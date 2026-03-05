/**
 * Multi-AI Service with Intelligent Fallback
 * Integrates: Gemini, Roboflow, Google Vision, Groq, Hugging Face
 */

require('dotenv').config();
const axios = require('axios');
const FormData = require('form-data');
const logger = require('../utils/logger');

class AIService {
  constructor() {
    this.geminiApiKey = process.env.GEMINI_API_KEY;
    this.roboflowApiKey = process.env.ROBOFLOW_API_KEY;
    this.googleVisionApiKey = process.env.GOOGLE_VISION_API_KEY;
    this.groqApiKey = process.env.GROQ_API_KEY;
    this.hfApiKey = process.env.HF_API_KEY;
    
    // Roboflow configuration
    // Using pre-trained public model (1000+ images, 11 disease classes)
    this.roboflowModelId = process.env.ROBOFLOW_MODEL_ID || 'plant-disease-detection-iefbi/1';
    
    // Gemini model fallback chain - using LIVE models with unlimited free tier
    this.geminiModels = [
      'gemini-2.5-flash-live',  // Primary: Latest LIVE model with unlimited requests
      'gemini-2.0-flash-live',  // Fallback 1: Stable LIVE model
      'gemini-2.5-flash',       // Fallback 2: Standard latest model
      'gemini-2.0-flash'        // Fallback 3: Standard stable model
    ];
    this.currentGeminiModel = 0; // Start with first model
    
    logger.info('🤖 AI Service initialized with APIs:', {
      gemini: !!this.geminiApiKey,
      googleVision: !!this.googleVisionApiKey,
      roboflow: !!this.roboflowApiKey,
      roboflowModel: this.roboflowModelId,
      groq: !!this.groqApiKey,
      huggingface: !!this.hfApiKey,
      geminiModels: this.geminiModels
    });
  }

  /**
   * Main method: Detect plant disease from image
   * Priority: Google Vision (primary) → Roboflow (backup on failure only) → Mock
   * Step 1: Google Vision validates it's a plant (reject humans/objects)
   * Step 2: Google Vision detects disease (ALWAYS used, supports ALL crop types)
   * Step 3: Roboflow used ONLY if Google Vision fails (rate limit, API error, network issue)
   * Step 4: Mock detection as last resort if all AI services fail
   */
  async detectDisease(imageBuffer, cropType = 'unknown') {
    logger.info('🔍 Starting disease detection', { cropType, bufferSize: imageBuffer.length });

    try {
      // STEP 1: Validate image contains a plant using Google Vision
      logger.info('🔍 Step 1: Validating image with Google Vision...');
      const validation = await this.validateImageIsPlant(imageBuffer);
      
      if (!validation.isPlant) {
        logger.warn('❌ Image does not contain a plant', { 
          reason: validation.reason,
          detectedLabels: validation.labels 
        });
        return {
          disease: 'Not a Plant',
          crop: cropType,
          confidence: 0,
          severity: 'none',
          source: 'Google Vision',
          model: 'vision-api-validation',
          warning: validation.reason,
          detectedObjects: validation.objects,
          detectedLabels: validation.labels,
          symptoms: 'This image does not appear to contain a plant. Please upload a clear photo of plant leaves showing any disease symptoms.',
          treatment: 'N/A - Please upload a valid plant image',
          prevention: 'Ensure your photo shows a clear view of the plant leaves or affected areas.'
        };
      }
      
      logger.info('✅ Image validated as plant', { 
        plantType: validation.plantType,
        confidence: validation.confidence 
      });

      // STEP 2: Try Google Vision for disease detection (PRIMARY - supports ALL crops)
      logger.info('🔍 Step 2: Detecting disease with Google Vision (Primary)...');
      try {
        const visionResult = await this.detectWithGoogleVisionDisease(imageBuffer, cropType);
        
        // Add validation info to result
        visionResult.visionValidation = {
          isPlant: true,
          plantType: validation.plantType,
          validationConfidence: validation.confidence
        };
        
        // ALWAYS return Google Vision result (regardless of confidence)
        logger.info('✅ Google Vision detection successful', { 
          disease: visionResult.disease, 
          confidence: visionResult.confidence 
        });
        
        // Add low confidence warning if needed
        if (visionResult.confidence < 60) {
          visionResult.lowConfidenceWarning = 'Moderate confidence detection. Expert consultation recommended for low confidence results.';
        }
        
        return visionResult;
        
      } catch (visionError) {
        // Google Vision failed (rate limit, API error, network issue)
        logger.error('❌ Google Vision failed, trying Roboflow backup', { 
          error: visionError.message,
          errorType: visionError.response?.status || 'unknown'
        });
        
        // STEP 3: Fallback to Roboflow ONLY when Google Vision fails
        try {
          const roboflowResult = await this.detectWithRoboflow(imageBuffer, cropType);
          
          roboflowResult.visionValidation = {
            isPlant: true,
            plantType: validation.plantType,
            validationConfidence: validation.confidence
          };
          roboflowResult.fallbackUsed = 'Roboflow (Google Vision API failed or rate limited)';
          roboflowResult.visionError = visionError.message;
          
          logger.info('✅ Roboflow backup detection successful', { 
            disease: roboflowResult.disease, 
            confidence: roboflowResult.confidence 
          });
          return roboflowResult;
        } catch (roboflowError) {
          logger.error('❌ Both Google Vision and Roboflow failed', {
            visionError: visionError.message,
            roboflowError: roboflowError.message
          });
          // If both fail, throw error to trigger mock detection
          throw new Error(`All AI services failed. Google Vision: ${visionError.message}, Roboflow: ${roboflowError.message}`);
        }
      }
      
    } catch (error) {
      logger.error('❌ All detection methods failed', { error: error.message });
      // Return mock data as last resort
      return this.getMockDetection(cropType);
    }
  }

  /**
   * Validate image contains a plant using Google Vision API
   * Returns: { isPlant: boolean, reason: string, plantType: string, confidence: number, labels: [], objects: [] }
   */
  async validateImageIsPlant(imageBuffer) {
    if (!this.geminiApiKey) {
      logger.warn('⚠️ Google Vision API key not configured, skipping validation');
      return { isPlant: true, reason: 'Validation skipped', plantType: 'unknown', confidence: 0 };
    }

    try {
      const base64Image = imageBuffer.toString('base64');
      
      const response = await axios.post(
        `https://vision.googleapis.com/v1/images:annotate?key=${this.geminiApiKey}`,
        {
          requests: [
            {
              image: { content: base64Image },
              features: [
                { type: "LABEL_DETECTION", maxResults: 15 },
                { type: "OBJECT_LOCALIZATION", maxResults: 10 }
              ]
            }
          ]
        },
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 10000
        }
      );

      const result = response.data.responses[0];
      const labels = result.labelAnnotations || [];
      const objects = result.localizedObjectAnnotations || [];

      logger.info('🔍 Google Vision labels detected:', { 
        count: labels.length,
        topLabels: labels.slice(0, 5).map(l => `${l.description} (${(l.score * 100).toFixed(1)}%)`)
      });

      // Define plant-related keywords
      const plantKeywords = [
        'plant', 'leaf', 'leaves', 'crop', 'vegetable', 'flower', 
        'agriculture', 'botany', 'flora', 'garden', 'farming',
        'tomato', 'potato', 'pepper', 'corn', 'wheat', 'rice',
        'shrub', 'tree', 'grass', 'herb', 'produce', 'plantation',
        'grapevines', 'vine', 'foliage', 'stem', 'branch'
      ];

      // Define pest/disease keywords (these are GOOD - we want to detect them)
      const pestDiseaseKeywords = [
        'pest', 'insect', 'bug', 'aphid', 'beetle', 'caterpillar', 'larva', 'larvae',
        'plant pathology', 'disease', 'blight', 'fungus', 'mold', 'mould',
        'whitefly', 'thrips', 'leafhopper', 'mite', 'spider mite',
        'arthropod', 'invertebrate', 'parasitism', 'infestation'
      ];

      // Define non-plant keywords (things that are definitely NOT plants and NOT pests)
      const nonPlantKeywords = [
        'person', 'human', 'face', 'people', 'man', 'woman', 'child',
        'dog', 'cat', 'bird', 'pet',
        'car', 'vehicle', 'automobile', 'motorcycle',
        'building', 'house', 'furniture', 'chair', 'table',
        'phone', 'computer', 'electronics', 'device'
      ];

      // Check labels
      const plantLabels = labels.filter(label => 
        plantKeywords.some(keyword => label.description.toLowerCase().includes(keyword))
      );
      
      const pestDiseaseLabels = labels.filter(label =>
        pestDiseaseKeywords.some(keyword => label.description.toLowerCase().includes(keyword))
      );
      
      const nonPlantLabels = labels.filter(label => 
        nonPlantKeywords.some(keyword => label.description.toLowerCase().includes(keyword))
      );

      // Check objects
      const nonPlantObjects = objects.filter(obj => 
        nonPlantKeywords.some(keyword => obj.name.toLowerCase().includes(keyword))
      );

      // Decision logic - IMPROVED to handle pests on plants
      
      // 1. First check for absolute non-plant objects (person, car, etc.)
      if (nonPlantObjects.length > 0 && plantLabels.length === 0 && pestDiseaseLabels.length === 0) {
        const detected = nonPlantObjects.map(o => o.name).join(', ');
        return {
          isPlant: false,
          reason: `This image appears to contain: ${detected}. Please upload a photo of a plant with visible leaves or disease symptoms.`,
          plantType: 'none',
          confidence: 0,
          labels: labels.slice(0, 5).map(l => l.description),
          objects: objects.map(o => o.name)
        };
      }
      
      // 2. If we detect pest/disease labels, it's LIKELY a valid agricultural image
      // Even if plant labels are weak, pests on crops should be accepted
      if (pestDiseaseLabels.length > 0) {
        const topLabel = pestDiseaseLabels[0];
        
        logger.info('✅ Valid agricultural image detected', {
          plantLabels: plantLabels.length,
          pestLabels: pestDiseaseLabels.length
        });
        
        return {
          isPlant: true,
          reason: 'Plant with Pest/Disease detected',
          plantType: topLabel.description,
          confidence: Math.round(topLabel.score * 100),
          labels: labels.slice(0, 5).map(l => l.description),
          objects: objects.map(o => o.name),
          hasPest: true
        };
      }
      
      // 3. If we have strong plant labels, it's valid
      if (plantLabels.length > 0) {
        const topLabel = plantLabels[0];
        
        logger.info('✅ Valid agricultural image detected', {
          plantLabels: plantLabels.length,
          pestLabels: pestDiseaseLabels.length
        });
        
        return {
          isPlant: true,
          reason: 'Plant detected',
          plantType: topLabel.description,
          confidence: Math.round(topLabel.score * 100),
          labels: labels.slice(0, 5).map(l => l.description),
          objects: objects.map(o => o.name),
          hasPest: false
        };
      }

      // 2. Only non-plant objects detected (no plants, no pests)
      if (nonPlantLabels.length > 0 && plantLabels.length === 0 && pestDiseaseLabels.length === 0) {
        const detected = nonPlantLabels.slice(0, 3).map(l => l.description).join(', ');
        return {
          isPlant: false,
          reason: `This image appears to show: ${detected}. Please upload a photo of a plant with visible leaves or disease symptoms.`,
          plantType: 'none',
          confidence: 0,
          labels: labels.slice(0, 5).map(l => l.description),
          objects: objects.map(o => o.name)
        };
      }

      // 3. If unclear, allow it through (might be a plant with unusual lighting/angle)
      logger.warn('⚠️ Unclear image - no strong plant or non-plant signals, allowing through');
      return {
        isPlant: true,
        reason: 'Unable to clearly identify - proceeding with detection',
        plantType: 'unclear',
        confidence: 50,
        labels: labels.slice(0, 5).map(l => l.description),
        objects: objects.map(o => o.name)
      };

    } catch (error) {
      logger.error('❌ Google Vision validation failed', { error: error.message });
      // On error, allow through (don't block user)
      return { 
        isPlant: true, 
        reason: 'Validation unavailable - proceeding with detection', 
        plantType: 'unknown', 
        confidence: 0 
      };
    }
  }

  /**
   * Google Vision Disease Detection (Primary Method)
   * Uses label detection to identify plant diseases and health status
   * Supports ALL crop types (not limited to tomato/potato/pepper)
   */
  async detectWithGoogleVisionDisease(imageBuffer, cropType = 'unknown') {
    if (!this.geminiApiKey) {
      throw new Error('Google Vision API key not configured');
    }

    const base64Image = imageBuffer.toString('base64');
    
    const response = await axios.post(
      `https://vision.googleapis.com/v1/images:annotate?key=${this.geminiApiKey}`,
      {
        requests: [
          {
            image: { content: base64Image },
            features: [
              { type: 'LABEL_DETECTION', maxResults: 20 },
              { type: 'IMAGE_PROPERTIES' },
              { type: 'OBJECT_LOCALIZATION', maxResults: 10 }
            ]
          }
        ]
      },
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 15000
      }
    );

    const result = response.data.responses[0];
    const labels = result.labelAnnotations || [];
    const objects = result.localizedObjectAnnotations || [];
    const imageProperties = result.imagePropertiesAnnotation || {};
    const dominantColors = imageProperties.dominantColors?.colors || [];
    
    if (labels.length === 0) {
      throw new Error('No labels detected by Google Vision');
    }

    logger.info('🔍 Google Vision disease detection labels:', {
      count: labels.length,
      topLabels: labels.slice(0, 8).map(l => `${l.description} (${(l.score * 100).toFixed(1)}%)`)
    });
    
    // Analyze dominant colors for disease indicators
    let colorDamageScore = 0;
    if (dominantColors.length > 0) {
      dominantColors.forEach(colorInfo => {
        const color = colorInfo.color;
        const pixelFraction = colorInfo.pixelFraction || 0;
        
        // Check for yellowing (high red+green, low blue)
        if (color.red > 180 && color.green > 150 && color.blue < 100) {
          colorDamageScore += pixelFraction * 2; // Yellow indicates chlorosis/disease
        }
        // Check for browning (red+green similar, low blue)
        if (color.red > 120 && color.red < 180 && color.green > 80 && color.green < 150 && color.blue < 80) {
          colorDamageScore += pixelFraction * 2.5; // Brown indicates necrosis/death
        }
        // Check for orange/rust (high red, medium green, low blue)
        if (color.red > 200 && color.green > 100 && color.green < 180 && color.blue < 80) {
          colorDamageScore += pixelFraction * 2; // Orange indicates rust disease
        }
      });
      
      logger.info('🎨 Color analysis:', {
        colorDamageScore: colorDamageScore.toFixed(2),
        dominantColorCount: dominantColors.length
      });
    }

    // Enhanced pest identification with detailed info
    const pestDatabase = {
      'aphid': {
        name: 'Aphid Infestation',
        scientificName: 'Aphidoidea',
        severity: 'moderate',
        description: 'Small soft-bodied insects that suck plant sap, causing yellowing, stunted growth, and sticky honeydew residue.',
        description_telugu: 'చిన్న మృదువైన కీటకాలు మొక్కల రసాన్ని పీల్చుతాయి, పసుపు రంగు, కుంగిన పెరుగుదల మరియు అంటుకునే తేనె అవశేషాలను కలిగిస్తాయి.'
      },
      'whitefly': {
        name: 'Whitefly Infestation',
        scientificName: 'Aleyrodidae',
        severity: 'high',
        description: 'Tiny white flying insects that feed on plant sap, transmit viruses, and cause yellowing leaves.',
        description_telugu: 'మొక్కల రసాన్ని తినే చిన్న తెల్లని ఎగిరే కీటకాలు, వైరస్‌లను వ్యాప్తి చేస్తాయి మరియు ఆకులు పసుపు రంగులోకి మారుతాయి.'
      },
      'caterpillar': {
        name: 'Caterpillar Damage',
        scientificName: 'Lepidoptera larvae',
        severity: 'moderate',
        description: 'Larvae of moths and butterflies that chew leaves, creating holes and causing defoliation.',
        description_telugu: 'చిప్పల మరియు సీతాకోకచిలుకల లార్వా ఆకులను నమలుతాయి, రంధ్రాలు సృష్టిస్తాయి మరియు ఆకులు రాలిపోతాయి.'
      },
      'beetle': {
        name: 'Beetle Damage',
        scientificName: 'Coleoptera',
        severity: 'moderate',
        description: 'Hard-shelled insects that chew leaves, stems, and roots, causing visible damage and reduced plant vigor.',
        description_telugu: 'గట్టి పెంకు కీటకాలు ఆకులు, కాండం మరియు వేళ్లను నమలుతాయి, కనిపించే నష్టం మరియు మొక్క శక్తి తగ్గుతుంది.'
      },
      'thrips': {
        name: 'Thrips Infestation',
        scientificName: 'Thysanoptera',
        severity: 'moderate',
        description: 'Tiny insects causing silvery streaks on leaves, flower damage, and virus transmission.',
        description_telugu: 'చిన్న కీటకాలు ఆకులపై వెండి గీతలు, పూల నష్టం మరియు వైరస్ వ్యాప్తిని కలిగిస్తాయి.'
      },
      'leafhopper': {
        name: 'Leafhopper Damage',
        scientificName: 'Cicadellidae',
        severity: 'moderate',
        description: 'Jumping insects that suck sap, causing leaf curling, yellowing, and disease transmission.',
        description_telugu: 'దూకే కీటకాలు రసాన్ని పీల్చుతాయి, ఆకులు ముడుచుకోవడం, పసుపు రంగు మరియు వ్యాధి వ్యాప్తిని కలిగిస్తాయి.'
      },
      'mite': {
        name: 'Spider Mite Infestation',
        scientificName: 'Tetranychidae',
        severity: 'high',
        description: 'Microscopic pests causing stippling, webbing, and bronzing of leaves.',
        description_telugu: 'సూక్ష్మ తెగుళ్లు ఆకులపై చుక్కలు, వెబ్బింగ్ మరియు కంచు రంగును కలిగిస్తాయి.'
      },
      'mealybug': {
        name: 'Mealybug Infestation',
        scientificName: 'Pseudococcidae',
        severity: 'moderate',
        description: 'White cottony insects that suck sap and secrete honeydew, attracting ants and causing sooty mold.',
        description_telugu: 'తెల్లని పత్తి లాంటి కీటకాలు రసాన్ని పీల్చుతాయి మరియు తేనె స్రవిస్తాయి, చీమలను ఆకర్షిస్తాయి మరియు నల్ల అచ్చును కలిగిస్తాయి.'
      },
      'scale': {
        name: 'Scale Insect Infestation',
        scientificName: 'Coccoidea',
        severity: 'moderate',
        description: 'Armored insects that attach to stems and leaves, sucking sap and weakening plants.',
        description_telugu: 'కవచం ఉన్న కీటకాలు కాండం మరియు ఆకులకు అతికించబడతాయి, రసాన్ని పీల్చుతాయి మరియు మొక్కలను బలహీనపరుస్తాయి.'
      }
    };

    // Enhanced disease database
    const diseaseDatabase = {
      'blight': {
        name: 'Blight',
        severity: 'high',
        description: 'Rapid browning and death of plant tissues caused by fungal or bacterial pathogens.',
        description_telugu: 'శిలీంధ్ర లేదా బ్యాక్టీరియా వ్యాధికారకాల వల్ల మొక్క కణజాలాల త్వరిత గోధుమ రంగు మరియు మరణం.'
      },
      'late blight': {
        name: 'Late Blight',
        severity: 'high',
        description: 'Devastating disease causing dark lesions on leaves and stems, rapid plant death.',
        description_telugu: 'ఆకులు మరియు కాండంపై నల్ల గాయాలు, త్వరగా మొక్క మరణాన్ని కలిగించే వినాశకరమైన వ్యాధి.'
      },
      'early blight': {
        name: 'Early Blight',
        severity: 'high',
        description: 'Fungal disease with concentric ring spots on older leaves, causing defoliation.',
        description_telugu: 'పాత ఆకులపై కేంద్రీకృత వృత్తాకార మచ్చలతో శిలీంధ్ర వ్యాధి, ఆకులు రాలిపోతాయి.'
      },
      'spot': {
        name: 'Leaf Spot',
        severity: 'moderate',
        description: 'Circular spots on leaves caused by fungi or bacteria, leading to leaf yellowing.',
        description_telugu: 'శిలీంధ్రాలు లేదా బ్యాక్టీరియా వల్ల ఆకులపై వృత్తాకార మచ్చలు, ఆకులు పసుపు రంగులోకి మారుతాయి.'
      },
      'rust': {
        name: 'Rust Disease',
        severity: 'moderate',
        description: 'Orange or reddish pustules on leaves caused by rust fungi.',
        description_telugu: 'తుప్పు శిలీంధ్రాల వల్ల ఆకులపై నారింజ లేదా ఎరుపు పొక్కులు.'
      },
      'mildew': {
        name: 'Powdery Mildew',
        severity: 'moderate',
        description: 'White powdery coating on leaves, stems, and flowers.',
        description_telugu: 'ఆకులు, కాండం మరియు పూలపై తెల్లని పొడి పూత.'
      },
      'wilt': {
        name: 'Wilt Disease',
        severity: 'high',
        description: 'Drooping and wilting of plants due to vascular blockage.',
        description_telugu: 'వాహక అడ్డంకి వల్ల మొక్కలు వంగి మరియు వాడిపోవడం.'
      },
      'mosaic': {
        name: 'Mosaic Virus',
        severity: 'high',
        description: 'Viral disease causing mottled yellow-green patterns on leaves.',
        description_telugu: 'ఆకులపై మచ్చల పసుపు-ఆకుపచ్చ నమూనాలను కలిగించే వైరల్ వ్యాధి.'
      }
    };

    // Enhanced detection logic with detailed pest/disease info
    let disease = null;
    let severity = 'low';
    let confidence = 0;
    let detectedPestInfo = null;
    let detectedDiseaseInfo = null;

    // First pass: Check for specific pests and diseases ONLY
    for (const label of labels) {
      const labelText = label.description.toLowerCase();
      const labelScore = label.score * 100;

      // Check pest database
      for (const [keyword, info] of Object.entries(pestDatabase)) {
        if (labelText.includes(keyword)) {
          if (labelScore > confidence) {
            disease = info.name;
            severity = info.severity;
            confidence = labelScore;
            detectedPestInfo = {
              ...info,
              confidence: Math.round(labelScore)
            };
          }
        }
      }

      // Check disease database
      for (const [keyword, info] of Object.entries(diseaseDatabase)) {
        if (labelText.includes(keyword)) {
          if (labelScore > confidence) {
            disease = info.name;
            severity = info.severity;
            confidence = labelScore;
            detectedDiseaseInfo = {
              ...info,
              confidence: Math.round(labelScore)
            };
          }
        }
      }
    }

    // If no disease found, analyze labels for damage vs health indicators
    if (!disease) {
      // Count damage indicators with scoring
      const damageIndicators = [
        { keywords: ['damage', 'damaged', 'destruction'], weight: 3 },
        { keywords: ['spot', 'spots', 'speck', 'specks', 'lesion', 'lesions'], weight: 3 },
        { keywords: ['discolor', 'discolour', 'discoloration'], weight: 3 },
        { keywords: ['wilt', 'wilted', 'wilting'], weight: 3 },
        { keywords: ['brown', 'browning', 'browned'], weight: 2 },
        { keywords: ['yellow', 'yellowing', 'chlorosis'], weight: 2 },
        { keywords: ['dry', 'dried', 'drying', 'dessicated'], weight: 2 },
        { keywords: ['dead', 'dying', 'necrotic', 'necrosis'], weight: 3 },
        { keywords: ['curl', 'curled', 'curling', 'twisted'], weight: 2 },
        { keywords: ['rust', 'rusty', 'orange'], weight: 2 },
        { keywords: ['mold', 'mould', 'fungus', 'fungal', 'mildew'], weight: 3 },
        { keywords: ['disease', 'diseased', 'infected', 'infection'], weight: 3 }
      ];
      
      const healthIndicators = [
        { keywords: ['healthy', 'vigorous'], weight: 3 },
        { keywords: ['green', 'verdant'], weight: 1 }, // Low weight because damaged leaves can still be mostly green
        { keywords: ['fresh', 'vibrant', 'lush'], weight: 2 }
      ];
      
      // Calculate damage score
      let damageScore = 0;
      let healthScore = 0;
      
      labels.forEach(label => {
        const labelText = label.description.toLowerCase();
        const labelConfidence = label.score;
        
        // Check damage indicators
        damageIndicators.forEach(indicator => {
          if (indicator.keywords.some(kw => labelText.includes(kw))) {
            damageScore += indicator.weight * labelConfidence;
          }
        });
        
        // Check health indicators
        healthIndicators.forEach(indicator => {
          if (indicator.keywords.some(kw => labelText.includes(kw))) {
            healthScore += indicator.weight * labelConfidence;
          }
        });
      });
      
      // Add color-based damage score
      damageScore += colorDamageScore;
      
      logger.info('🔍 Analyzing plant health:', {
        labelDamageScore: (damageScore - colorDamageScore).toFixed(2),
        colorDamageScore: colorDamageScore.toFixed(2),
        totalDamageScore: damageScore.toFixed(2),
        healthScore: healthScore.toFixed(2),
        topLabels: labels.slice(0, 8).map(l => l.description)
      });
      
      // Check what visual indicators are present
      const hasSpots = labels.some(l => l.description.toLowerCase().includes('spot'));
      const hasWilt = labels.some(l => l.description.toLowerCase().includes('wilt'));
      const hasMold = labels.some(l => l.description.toLowerCase().includes('mold') || l.description.toLowerCase().includes('fungus'));
      const hasYellow = labels.some(l => l.description.toLowerCase().includes('yellow'));
      const hasBrown = labels.some(l => l.description.toLowerCase().includes('brown'));
      const hasDew = labels.some(l => l.description.toLowerCase().includes('dew') || l.description.toLowerCase().includes('moisture'));
      const hasPathology = labels.some(l => l.description.toLowerCase().includes('plant pathology') || l.description.toLowerCase().includes('pathology'));
      
      // Decision logic - DESCRIBE what we see, not neutral answers
      if (damageScore > 0.05 || hasPathology) {
        // ANY damage indicators = describe what we see
        let specificDisease = null;
        
        // Assign specific disease based on visual symptoms
        if (hasSpots) {
          specificDisease = 'Leaf Spot Disease';
        } else if (hasWilt) {
          specificDisease = 'Wilting Disease';
        } else if (hasMold) {
          specificDisease = 'Fungal Disease';
        } else if (colorDamageScore > 0.3) {
          if (hasBrown) {
            specificDisease = 'Leaf Blight/Necrosis';
          } else if (hasYellow) {
            specificDisease = 'Chlorosis/Nutrient Deficiency';
          } else {
            specificDisease = 'Leaf Discoloration';
          }
        } else if (hasPathology) {
          // If pathology label exists, describe based on other indicators
          if (hasDew) {
            specificDisease = 'Possible Fungal/Bacterial Disease';
          } else {
            specificDisease = 'Plant Stress/Disease Symptoms';
          }
        } else {
          specificDisease = 'Minor Plant Damage';
        }
        
        disease = specificDisease;
        
        // Set severity based on damage level
        if (damageScore > 2.0) {
          severity = 'high';
        } else if (damageScore > 0.8) {
          severity = 'moderate';
        } else {
          severity = 'low';
        }
        
        // Adjust confidence based on damage score
        confidence = Math.min(Math.round((damageScore / 1.5) * 100) + 30, 85);
        
      } else if (healthScore > 2.0 && damageScore === 0 && colorDamageScore === 0) {
        // Strong health indicators with zero damage
        disease = 'Healthy';
        severity = 'none';
        confidence = Math.min(Math.round((healthScore / 2) * 100), 90);
        
      } else {
        // Describe what we see based on visual labels - NO MORE "Unknown Condition"
        if (hasYellow) {
          disease = 'Yellowing Leaves - Possible Nutrient Issue';
          severity = 'low';
        } else if (hasBrown) {
          disease = 'Browning Detected - Possible Stress';
          severity = 'low';
        } else if (hasDew) {
          disease = 'High Moisture - Monitor for Disease';
          severity = 'low';
        } else {
          disease = 'Plant Monitoring Recommended';
          severity = 'low';
        }
        
        confidence = 55; // Descriptive but not certain
      }
    }

    // Try to detect crop type from labels if not provided
    let detectedCrop = cropType;
    if (cropType === 'unknown' || cropType === 'Other') {
      const cropKeywords = ['tomato', 'potato', 'wheat', 'rice', 'corn', 'maize', 'cotton', 'pepper', 'soybean', 'grape', 'sugarcane'];
      const cropLabel = labels.find(label => 
        cropKeywords.some(keyword => label.description.toLowerCase().includes(keyword))
      );
      if (cropLabel) {
        detectedCrop = cropLabel.description.charAt(0).toUpperCase() + cropLabel.description.slice(1);
      }
    }

    // Generate treatment and prevention based on disease with Telugu support
    const treatmentInfo = this.generateTreatmentInfo(disease, detectedCrop, detectedPestInfo, detectedDiseaseInfo);
    const symptoms = treatmentInfo.symptoms || [];
    const symptoms_telugu = treatmentInfo.symptoms_telugu || treatmentInfo.symptoms || [];
    const treatment = treatmentInfo.treatment || 'No treatment information available';
    const treatment_telugu = treatmentInfo.treatment_telugu || treatmentInfo.treatment || 'చికిత్స సమాచారం అందుబాటులో లేదు';
    const prevention = treatmentInfo.prevention || 'No prevention information available';
    const prevention_telugu = treatmentInfo.prevention_telugu || treatmentInfo.prevention || 'నివారణ సమాచారం అందుబాటులో లేదు';

    // Build comprehensive response with pest/disease details
    const detectionResponse = {
      disease: disease,
      disease_telugu: this.translateToTelugu(disease, 'disease'),
      crop: detectedCrop,
      crop_telugu: this.translateToTelugu(detectedCrop, 'crop'),
      confidence: Math.round(confidence),
      severity: severity,
      severity_telugu: this.translateToTelugu(severity, 'severity'),
      symptoms: symptoms,
      symptoms_telugu: symptoms_telugu || symptoms,
      treatment: treatment,
      treatment_telugu: treatment_telugu,
      prevention: prevention,
      prevention_telugu: prevention_telugu,
      allPredictions: labels.slice(0, 5).map(label => ({
        disease: this.formatDiseaseName(label.description),
        disease_telugu: this.translateToTelugu(this.formatDiseaseName(label.description), 'disease'),
        confidence: Math.round(label.score * 100)
      })),
      source: 'Google Vision',
      model: 'vision-api-label-detection',
      detectedLabels: labels.slice(0, 8).map(l => l.description)
    };

    // Add detailed pest information if detected
    if (detectedPestInfo) {
      detectionResponse.pestInfo = {
        name: detectedPestInfo.name,
        scientificName: detectedPestInfo.scientificName,
        description: detectedPestInfo.description,
        description_telugu: detectedPestInfo.description_telugu,
        confidence: detectedPestInfo.confidence
      };
    }

    // Add detailed disease information if detected
    if (detectedDiseaseInfo) {
      detectionResponse.diseaseInfo = {
        name: detectedDiseaseInfo.name,
        description: detectedDiseaseInfo.description,
        description_telugu: detectedDiseaseInfo.description_telugu,
        confidence: detectedDiseaseInfo.confidence
      };
    }

    return detectionResponse;
  }

  /**
   * Roboflow API - Best for custom trained plant disease models
   * Uses Roboflow Inference API (serverless endpoint)
   */
  async detectWithRoboflow(imageBuffer, cropType = 'unknown') {
    if (!this.roboflowApiKey) {
      throw new Error('Roboflow API key not configured');
    }

    // Convert image buffer to base64
    const base64Image = imageBuffer.toString('base64');

    // Roboflow Inference API endpoint format
    // POST to https://detect.roboflow.com/{model-id}?api_key={key}&confidence={threshold}
    // Body: base64 image string
    const endpoint = `https://detect.roboflow.com/${this.roboflowModelId}`;

    const response = await axios({
      method: 'POST',
      url: endpoint,
      params: {
        api_key: this.roboflowApiKey,
        confidence: 40, // Minimum 40% confidence
        overlap: 30     // Non-max suppression threshold
      },
      data: base64Image,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      timeout: 20000
    });

    const predictions = response.data.predictions;
    
    // Handle both object detection and classification formats
    let topPrediction;
    let allPredictions = [];
    
    if (Array.isArray(predictions)) {
      // Object Detection format: [{class, confidence, x, y, width, height}]
      if (predictions.length === 0) {
        throw new Error('No predictions from Roboflow');
      }
      topPrediction = predictions[0];
      allPredictions = predictions.slice(0, 5).map(p => ({
        disease: this.formatDiseaseName(p.class),
        confidence: Math.round(p.confidence * 100)
      }));
    } else if (typeof predictions === 'object') {
      // Classification format: {"Disease_Name": {confidence: 0.75, class_id: 7}}
      const classes = Object.entries(predictions)
        .map(([name, data]) => ({
          class: name,
          confidence: data.confidence || 0
        }))
        .sort((a, b) => b.confidence - a.confidence);
      
      if (classes.length === 0) {
        throw new Error('No predictions from Roboflow');
      }
      
      topPrediction = classes[0];
      allPredictions = classes.slice(0, 5).map(p => ({
        disease: this.formatDiseaseName(p.class),
        confidence: Math.round(p.confidence * 100)
      }));
    } else {
      throw new Error('Unknown Roboflow response format');
    }
    
    // Determine final crop type
    const finalCropType = cropType && cropType !== 'unknown' && cropType !== 'Unknown' && cropType !== 'Other' 
      ? cropType 
      : this.extractCropType(topPrediction.class);
    
    // Format and clean disease name
    const formattedDisease = this.formatDiseaseName(topPrediction.class);
    const cleanedDisease = this.cleanDiseaseName(formattedDisease, finalCropType);
    
    return {
      disease: cleanedDisease,
      crop: finalCropType,
      confidence: Math.round(topPrediction.confidence * 100),
      severity: this.calculateSeverity(topPrediction.confidence),
      recommendations: this.getRecommendations(topPrediction.class),
      allPredictions: allPredictions.map(p => ({
        ...p,
        disease: this.cleanDiseaseName(p.disease, finalCropType)
      })),
      source: 'roboflow',
      rawResponse: response.data
    };
  }

  /**
   * Google Vision API - Excellent for general image analysis
   * Uses both Cloud Vision (label detection) and Gemini Vision (multimodal analysis)
   */
  async detectWithGoogleVision(imageBuffer) {
    if (!this.googleVisionApiKey) {
      throw new Error('Google Vision API key not configured');
    }

    // Try Gemini Vision first (better for agricultural context)
    try {
      return await this.detectWithGeminiVision(imageBuffer);
    } catch (geminiError) {
      logger.warn('Gemini Vision failed, trying Cloud Vision API', { error: geminiError.message });
    }

    // Fallback to Cloud Vision API
    const base64Image = imageBuffer.toString('base64');
    
    const response = await axios.post(
      `https://vision.googleapis.com/v1/images:annotate?key=${this.googleVisionApiKey}`,
      {
        requests: [
          {
            image: { content: base64Image },
            features: [
              { type: 'LABEL_DETECTION', maxResults: 15 },
              { type: 'IMAGE_PROPERTIES' },
              { type: 'OBJECT_LOCALIZATION', maxResults: 10 }
            ]
          }
        ]
      },
      { timeout: 15000 }
    );

    const result = response.data.responses[0];
    const labels = result.labelAnnotations || [];
    const objects = result.localizedObjectAnnotations || [];
    
    if (labels.length === 0 && objects.length === 0) {
      throw new Error('No labels detected by Google Vision');
    }

    // Combine labels and objects for better detection
    const allLabels = [
      ...labels.map(l => ({ text: l.description, score: l.score })),
      ...objects.map(o => ({ text: o.name, score: o.score }))
    ];

    // Analyze for plant diseases
    const diseaseKeywords = ['disease', 'blight', 'spot', 'rot', 'mold', 'fungus', 'pest', 'damage', 'infection', 'wilt', 'rust', 'aphid', 'beetle', 'caterpillar'];
    const diseaseLabels = allLabels.filter(label => 
      diseaseKeywords.some(keyword => label.text.toLowerCase().includes(keyword))
    );

    let disease, confidence, crop = 'Unknown';
    
    if (diseaseLabels.length > 0) {
      disease = diseaseLabels[0].text;
      confidence = Math.round(diseaseLabels[0].score * 100);
    } else {
      // Check for healthy plant indicators
      const healthyKeywords = ['leaf', 'plant', 'green', 'healthy', 'vegetation', 'foliage'];
      const healthyLabels = allLabels.filter(label =>
        healthyKeywords.some(keyword => label.text.toLowerCase().includes(keyword))
      );
      
      if (healthyLabels.length > 0) {
        disease = 'Healthy Plant';
        confidence = Math.round(healthyLabels[0].score * 100);
      } else {
        disease = 'Unknown Condition';
        confidence = 50;
      }
    }

    // Try to detect crop type from labels
    const cropKeywords = ['tomato', 'potato', 'wheat', 'rice', 'corn', 'cotton'];
    const cropLabel = labels.find(label => 
      cropKeywords.some(keyword => label.description.toLowerCase().includes(keyword))
    );
    if (cropLabel) {
      crop = cropLabel.description;
    }

    return {
      disease: this.formatDiseaseName(disease),
      crop: this.formatDiseaseName(crop),
      confidence,
      severity: this.calculateSeverity(confidence / 100),
      recommendations: this.getRecommendations(disease),
      allPredictions: labels.slice(0, 5).map(label => ({
        disease: this.formatDiseaseName(label.description),
        confidence: Math.round(label.score * 100)
      })),
      source: 'google_vision',
      rawResponse: response.data
    };
  }

  /**
   * Gemini Vision API - Advanced multimodal analysis for crop disease detection
   * Better context understanding for agricultural images
   * Implements intelligent rate limit handling with model fallbacks
   */
  async detectWithGeminiVision(imageBuffer, cropType = 'unknown') {
    if (!this.geminiApiKey) {
      throw new Error('Gemini API key not configured');
    }

    const base64Image = imageBuffer.toString('base64');
    
    // Try each Gemini model in sequence until one works
    for (let i = this.currentGeminiModel; i < this.geminiModels.length; i++) {
      const modelName = this.geminiModels[i];
      
      try {
        logger.info(`Trying Gemini model: ${modelName}`);
        
        const response = await this.callGeminiVision(modelName, base64Image, cropType);
        
        // Success! Update current model for future requests
        this.currentGeminiModel = i;
        logger.info(`✅ Gemini Vision successful with model: ${modelName}`);
        
        return response;
        
      } catch (error) {
        const statusCode = error.response?.status;
        const errorMessage = error.response?.data?.error?.message || error.message;
        
        // Check if rate limit error
        if (statusCode === 429 || errorMessage.includes('rate limit') || errorMessage.includes('quota')) {
          logger.warn(`⚠️ Rate limit on ${modelName}, trying next model...`);
          
          // Continue to next model
          continue;
        }
        
        // Check if model not found
        if (statusCode === 404) {
          logger.warn(`⚠️ Model ${modelName} not found, trying next...`);
          continue;
        }
        
        // Other errors - try next model
        logger.warn(`⚠️ ${modelName} failed: ${errorMessage}, trying next...`);
      }
    }
    
    // All Gemini models failed
    throw new Error('All Gemini models exhausted or rate limited');
  }

  /**
   * Call Gemini Vision with specific model
   */
  async callGeminiVision(modelName, base64Image, cropType = 'unknown') {
    const cropContext = cropType && cropType !== 'unknown' && cropType !== 'Unknown' 
      ? `The user indicated this is a ${cropType} plant. Please verify this and correct if wrong.` 
      : 'Please identify the crop type from the image.';

    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${this.geminiApiKey}`,
      {
        contents: [{
          parts: [
            {
              text: `You are an expert agricultural AI assistant specializing in crop disease detection and pest identification. 

${cropContext}

Analyze this crop/plant image and identify:
1. Disease or pest name (if any) - be very specific (e.g., "Tomato Late Blight", "Aphid Infestation", "Bacterial Leaf Spot")
2. Crop type (e.g., Tomato, Potato, Wheat, Rice, Cotton, Corn, Soybean, etc.)
3. Confidence level (0-100%) - be realistic based on image quality
4. Severity (High/Medium/Low)
5. Visible symptoms or pest characteristics
6. Treatment in both English and Telugu (తెలుగు)
7. Prevention measures

For pests, identify the specific pest type (aphids, whiteflies, caterpillars, beetles, etc.)
For diseases, identify the specific disease (fungal, bacterial, viral)

IMPORTANT: Respond ONLY with valid JSON in this exact format (no markdown, no extra text):
{
  "disease": "Disease/Pest Name or Healthy",
  "crop": "Crop Type",
  "confidence": 85,
  "severity": "High",
  "symptoms": ["symptom1", "symptom2", "symptom3"],
  "treatment_english": "brief treatment recommendation in English",
  "treatment_telugu": "చికిత్స తెలుగులో",
  "prevention": "prevention tips"
}

If the image is not a plant or is unclear, respond with:
{
  "disease": "Not a plant",
  "crop": "Not applicable",
  "confidence": 0,
  "severity": "Low",
  "symptoms": ["Image shows a non-plant object or is unclear"],
  "treatment_english": "Please upload a clear image of the affected plant",
  "treatment_telugu": "దయచేసి ప్రభావిత మొక్క యొక్క స్పష్టమైన చిత్రాన్ని అప్‌లోడ్ చేయండి",
  "prevention": "N/A"
}`
            },
            {
              inline_data: {
                mime_type: 'image/jpeg',
                data: base64Image
              }
            }
          ]
        }],
        generationConfig: {
          temperature: 0.4,
          maxOutputTokens: 800
        }
      },
      { 
        timeout: 20000,
        validateStatus: (status) => status < 500 // Don't throw on 4xx errors
      }
    );

    // Check for rate limit in response
    if (response.status === 429) {
      throw new Error('Rate limit exceeded');
    }

    // Parse Gemini response
    const content = response.data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!content) {
      throw new Error('No response from Gemini Vision');
    }

    // Clean JSON response (remove markdown code blocks if present)
    let jsonText = content.trim();
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?$/g, '');
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/```\n?/g, '');
    }

    const result = JSON.parse(jsonText);
    
    return {
      disease: this.formatDiseaseName(result.disease),
      crop: this.formatDiseaseName(result.crop),
      confidence: result.confidence || 50,
      severity: result.severity || this.calculateSeverity(result.confidence / 100),
      symptoms: result.symptoms || [],
      recommendations: [
        `English: ${result.treatment_english}`,
        `Telugu: ${result.treatment_telugu}`,
        `Prevention: ${result.prevention}`,
        ...this.getRecommendations(result.disease)
      ],
      treatment_english: result.treatment_english,
      treatment_telugu: result.treatment_telugu,
      prevention: result.prevention,
      allPredictions: [{
        disease: this.formatDiseaseName(result.disease),
        confidence: result.confidence || 50
      }],
      source: 'gemini_vision',
      model: this.geminiModels[this.currentGeminiModel],
      rawResponse: result
    };
  }

  /**
   * Hugging Face API - Fallback with PlantVillage model
   */
  async detectWithHuggingFace(imageBuffer) {
    if (!this.hfApiKey) {
      throw new Error('Hugging Face API key not configured');
    }

    const response = await axios.post(
      'https://api-inference.huggingface.co/models/linkanjarad/mobilenet_v2_1.0_224-plant-disease-identification',
      imageBuffer,
      {
        headers: {
          'Authorization': `Bearer ${this.hfApiKey}`,
          'Content-Type': 'application/octet-stream'
        },
        timeout: 30000
      }
    );

    const predictions = response.data;
    
    if (!Array.isArray(predictions) || predictions.length === 0) {
      throw new Error('No predictions from Hugging Face');
    }

    const topPrediction = predictions[0];
    const parsed = this.parseHFLabel(topPrediction.label);
    
    return {
      disease: parsed.disease,
      crop: parsed.crop,
      confidence: Math.round(topPrediction.score * 100),
      severity: this.calculateSeverity(topPrediction.score),
      recommendations: this.getRecommendations(topPrediction.label),
      allPredictions: predictions.slice(0, 5).map(p => {
        const parsedP = this.parseHFLabel(p.label);
        return {
          disease: parsedP.disease,
          confidence: Math.round(p.score * 100)
        };
      }),
      source: 'huggingface',
      rawResponse: predictions
    };
  }

  /**
   * Gemini AI - For conversational AI and treatment advice
   */
  async getChatResponse(prompt, context = {}) {
    if (!this.geminiApiKey) {
      logger.warn('Gemini API key not configured, using Groq fallback');
      return this.getGroqResponse(prompt);
    }

    try {
      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${this.geminiApiKey}`,
        {
          contents: [
            {
              parts: [
                {
                  text: this.buildPrompt(prompt, context)
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1024
          }
        },
        { timeout: 15000 }
      );

      const text = response.data.candidates[0].content.parts[0].text;
      return text;
    } catch (error) {
      logger.error('Gemini API failed, falling back to Groq', { error: error.message });
      return this.getGroqResponse(prompt);
    }
  }

  /**
   * Groq AI - Fast backup for conversational AI
   */
  async getGroqResponse(prompt) {
    if (!this.groqApiKey) {
      throw new Error('Groq API key not configured');
    }

    const response = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: 'mixtral-8x7b-32768',
        messages: [
          {
            role: 'system',
            content: 'You are an expert agricultural advisor specializing in plant diseases and crop management for Indian farmers. Provide practical, actionable advice.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1024
      },
      {
        headers: {
          'Authorization': `Bearer ${this.groqApiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 15000
      }
    );

    return response.data.choices[0].message.content;
  }

  /**
   * Get treatment recommendations using AI
   */
  async getTreatmentRecommendations(disease, cropType, severity) {
    const prompt = `
Provide detailed treatment recommendations for this plant disease in India:
- Disease: ${disease}
- Crop: ${cropType}
- Severity: ${severity}

Please provide in JSON format:
{
  "immediateActions": ["action1", "action2"],
  "organicTreatment": ["treatment1", "treatment2"],
  "chemicalTreatment": ["treatment1", "treatment2"],
  "prevention": ["measure1", "measure2"],
  "expectedRecovery": "timeframe"
}
    `;

    try {
      const response = await this.getChatResponse(prompt);
      return this.parseTreatmentResponse(response);
    } catch (error) {
      logger.error('Failed to get AI treatment recommendations', { error: error.message });
      return this.getMockTreatment(disease, severity);
    }
  }

  /**
   * Helper Methods
   */
  
  parseHFLabel(label) {
    // Format: "Tomato___Late_blight"
    const parts = label.split('___');
    if (parts.length === 2) {
      return {
        crop: this.formatDiseaseName(parts[0]),
        disease: this.formatDiseaseName(parts[1])
      };
    }
    return {
      crop: 'Unknown',
      disease: this.formatDiseaseName(label)
    };
  }

  extractCropType(text) {
    const cropKeywords = ['tomato', 'potato', 'wheat', 'rice', 'corn', 'cotton', 'pepper', 'apple'];
    const lower = text.toLowerCase();
    const found = cropKeywords.find(crop => lower.includes(crop));
    return found ? this.formatDiseaseName(found) : 'Unknown';
  }

  formatDiseaseName(rawName) {
    return rawName
      .replace(/_/g, ' ')
      .replace(/___/g, ' - ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  /**
   * Remove crop name prefix from disease name
   * Example: "Tomato Late Blight" -> "Late Blight"
   */
  cleanDiseaseName(diseaseName, cropType) {
    if (!diseaseName || !cropType) return diseaseName;
    
    // Common crop names that might be prefixes
    const cropPrefixes = ['Tomato', 'Potato', 'Pepper', 'Wheat', 'Rice', 'Corn', 'Cotton', 'Soybean', 'Sugarcane'];
    
    // Remove any crop prefix from the disease name
    let cleaned = diseaseName;
    for (const prefix of cropPrefixes) {
      if (cleaned.startsWith(prefix + ' ')) {
        cleaned = cleaned.substring(prefix.length + 1).trim();
        break;
      }
    }
    
    return cleaned;
  }

  calculateSeverity(confidence) {
    if (confidence > 0.8) return 'high';
    if (confidence > 0.5) return 'moderate';
    return 'low';
  }

  getRecommendations(disease) {
    const diseaseLower = disease.toLowerCase();
    
    if (diseaseLower.includes('healthy')) {
      return [
        'Continue regular monitoring',
        'Maintain current care practices',
        'Keep plants well-watered',
        'Ensure proper nutrition'
      ];
    }
    
    if (diseaseLower.includes('blight')) {
      return [
        'Remove affected leaves immediately',
        'Apply copper-based fungicide',
        'Improve air circulation around plants',
        'Avoid overhead watering',
        'Consider resistant varieties for next season'
      ];
    }
    
    if (diseaseLower.includes('spot') || diseaseLower.includes('mold')) {
      return [
        'Prune infected areas promptly',
        'Apply appropriate fungicide',
        'Reduce humidity around plants',
        'Space plants for better airflow',
        'Water early in the day'
      ];
    }
    
    if (diseaseLower.includes('rot')) {
      return [
        'Remove and destroy infected plants',
        'Improve drainage',
        'Avoid over-watering',
        'Apply suitable fungicide',
        'Rotate crops next season'
      ];
    }
    
    return [
      'Isolate affected plants to prevent spread',
      'Consult with local agricultural expert',
      'Apply appropriate treatment based on disease type',
      'Monitor closely for disease progression',
      'Keep detailed records of symptoms'
    ];
  }

  /**
   * Generate comprehensive treatment information for detected disease with Telugu support
   */
  generateTreatmentInfo(disease, crop, pestInfo = null, diseaseInfo = null) {
    const diseaseLower = disease.toLowerCase();
    
    // If we have detailed pest info, use it
    if (pestInfo) {
      return this.getPestTreatment(pestInfo.name, crop);
    }
    
    // If we have detailed disease info, use it
    if (diseaseInfo) {
      return this.getDiseaseTreatment(diseaseInfo.name, crop);
    }
    
    // Fallback to keyword-based treatment
    
    // Healthy plant
    if (diseaseLower.includes('healthy')) {
      return {
        symptoms: ['No visible disease symptoms', 'Healthy green foliage', 'Normal growth patterns'],
        symptoms_telugu: ['కనిపించే వ్యాధి లక్షణాలు లేవు', 'ఆరోగ్యకరమైన ఆకుపచ్చ ఆకులు', 'సాధారణ పెరుగుదల నమూనాలు'],
        treatment: 'Continue regular care. Maintain proper watering, fertilization, and pest monitoring.',
        treatment_telugu: 'క్రమమైన సంరక్షణ కొనసాగించండి. సరైన నీటిపారుదల, ఎరువులు మరియు తెగుళ్ల పర్యవేక్షణ నిర్వహించండి.',
        prevention: 'Regular monitoring, proper spacing, good air circulation, crop rotation, and balanced nutrition.',
        prevention_telugu: 'క్రమమైన పర్యవేక్షణ, సరైన అంతరం, మంచి గాలి ప్రసరణ, పంట మార్పిడి మరియు సమతుల్య పోషణ.'
      };
    }
    
    // Blight (Early or Late)
    if (diseaseLower.includes('blight')) {
      return {
        symptoms: [
          'Dark spots on leaves with yellow halos',
          'Brown or black lesions',
          'Leaf wilting and death',
          'May spread to stems and fruit'
        ],
        symptoms_telugu: [
          'పసుపు హేలోలతో ఆకులపై ముదురు మచ్చలు',
          'గోధుమ లేదా నల్ల గాయాలు',
          'ఆకులు వాడిపోవడం మరియు చావు',
          'కాండాలు మరియు పండ్లకు వ్యాపించవచ్చు'
        ],
        treatment: 'Remove affected leaves immediately. Apply copper-based fungicide or chlorothalonil. Spray every 7-10 days. Improve air circulation. Avoid overhead watering.',
        treatment_telugu: 'ప్రభావిత ఆకులను వెంటనే తొలగించండి. రాగి ఆధారిత శిలీంధ్రనాశిని లేదా క్లోరోథలోనిల్ వర్తింపజేయండి. 7-10 రోజులకు స్ప్రే చేయండి. గాలి ప్రసరణను మెరుగుపరచండి. పైనుండి నీరు పోయడం మానండి.',
        prevention: 'Use resistant varieties, ensure proper spacing (2-3 feet between plants), remove plant debris, rotate crops every 2-3 years, water at soil level early in the day.',
        prevention_telugu: 'నిరోధక రకాలను ఉపయోగించండి, సరైన అంతరం (మొక్కల మధ్య 2-3 అడుగులు) నిర్ధారించండి, మొక్కల చెత్తను తొలగించండి, 2-3 సంవత్సరాలకు పంటలను మార్చండి, రోజు ప్రారంభంలో నేల స్థాయిలో నీరు పోయండి.'
      };
    }
    
    // Leaf Spot
    if (diseaseLower.includes('spot')) {
      return {
        symptoms: [
          'Circular brown or black spots on leaves',
          'Yellow halos around spots',
          'Leaves may turn yellow and drop',
          'Spots may merge as disease progresses'
        ],
        symptoms_telugu: [
          'ఆకులపై వృత్తాకార గోధుమ లేదా నల్ల మచ్చలు',
          'మచ్చల చుట్టూ పసుపు హేలోలు',
          'ఆకులు పసుపు రంగులోకి మారి రాలిపోవచ్చు',
          'వ్యాధి పురోగమిస్తున్నప్పుడు మచ్చలు కలవవచ్చు'
        ],
        treatment: 'Remove infected leaves. Apply fungicide (copper-based or mancozeb) every 7-14 days. Reduce leaf wetness. Space plants properly for air flow.',
        treatment_telugu: 'సోకిన ఆకులను తొలగించండి. 7-14 రోజులకు శిలీంధ్రనాశిని (రాగి ఆధారిత లేదా మాన్కోజెబ్) వర్తింపజేయండి. ఆకుల తేమను తగ్గించండి. గాలి ప్రసరణ కోసం మొక్కలను సరిగ్గా అమర్చండి.',
        prevention: 'Plant resistant varieties, avoid overhead irrigation, ensure good drainage, remove plant debris, practice crop rotation.',
        prevention_telugu: 'నిరోధక రకాలను నాటండి, పైనుండి నీటి పారుదలను నివారించండి, మంచి నీటి పారుదలను నిర్ధారించండి, మొక్కల చెత్తను తొలగించండి, పంట మార్పిడిని పాటించండి.'
      };
    }
    
    // Rot (Root, Fruit, or Stem)
    if (diseaseLower.includes('rot')) {
      return {
        symptoms: [
          'Soft, water-soaked areas on plant',
          'Foul odor from affected areas',
          'Rapid wilting despite adequate water',
          'Discoloration and decay'
        ],
        symptoms_telugu: [
          'మొక్కపై మృదువైన, నీరు నానిన ప్రాంతాలు',
          'ప్రభావిత ప్రాంతాల నుండి చెడు వాసన',
          'తగినంత నీరు ఉన్నా వేగంగా వాడిపోవడం',
          'రంగు మార్పు మరియు క్షయం'
        ],
        treatment: 'Remove and destroy infected plants immediately. Do not compost. Improve drainage. Reduce watering frequency. Apply appropriate fungicide to surrounding plants.',
        treatment_telugu: 'సోకిన మొక్కలను వెంటనే తొలగించండి మరియు నాశనం చేయండి. కంపోస్ట్ చేయవద్దు. నీటి పారుదలను మెరుగుపరచండి. నీటి పారుదల ఫ్రీక్వెన్సీని తగ్గించండి. చుట్టుపక్కల మొక్కలకు తగిన శిలీంధ్రనాశినిని వర్తింపజేయండి.',
        prevention: 'Ensure excellent drainage, avoid overwatering, use raised beds if needed, practice crop rotation, maintain soil pH 6.0-6.8, use disease-free seeds/transplants.',
        prevention_telugu: 'అద్భుతమైన నీటి పారుదలను నిర్ధారించండి, అధిక నీటి పారుదలను నివారించండి, అవసరమైతే పెరిగిన పడకలను ఉపయోగించండి, పంట మార్పిడిని పాటించండి, నేల pH 6.0-6.8 నిర్వహించండి, వ్యాధి లేని విత్తనాలు/మార్పిడిలను ఉపయోగించండి.'
      };
    }
    
    // Mildew or Mold
    if (diseaseLower.includes('mildew') || diseaseLower.includes('mold')) {
      return {
        symptoms: [
          'White or gray powdery coating on leaves',
          'Distorted or stunted growth',
          'Yellowing of older leaves',
          'Reduced fruit quality'
        ],
        symptoms_telugu: [
          'ఆకులపై తెలుపు లేదా బూడిద రంగు పొడి పూత',
          'వక్రీకృత లేదా కుంగిన పెరుగుదల',
          'పాత ఆకులు పసుపు రంగులోకి మారడం',
          'పండ్ల నాణ్యత తగ్గడం'
        ],
        treatment: 'Apply sulfur-based fungicide or potassium bicarbonate spray. Remove severely infected leaves. Improve air circulation. Spray early morning.',
        treatment_telugu: 'సల్ఫర్ ఆధారిత శిలీంధ్రనాశిని లేదా పొటాషియం బైకార్బొనేట్ స్ప్రే వర్తింపజేయండి. తీవ్రంగా సోకిన ఆకులను తొలగించండి. గాలి ప్రసరణను మెరుగుపరచండి. తెల్లవారుజామున స్ప్రే చేయండి.',
        prevention: 'Plant resistant varieties, ensure good spacing, prune for air flow, avoid overhead watering, water early in day, remove plant debris.',
        prevention_telugu: 'నిరోధక రకాలను నాటండి, మంచి అంతరాన్ని నిర్ధారించండి, గాలి ప్రసరణ కోసం కత్తిరించండి, పైనుండి నీరు పోయడం నివారించండి, రోజు ప్రారంభంలో నీరు పోయండి, మొక్కల చెత్తను తొలగించండి.'
      };
    }
    
    // Pest Damage
    if (diseaseLower.includes('aphid') || diseaseLower.includes('pest') || diseaseLower.includes('insect')) {
      return {
        symptoms: [
          'Small holes in leaves',
          'Distorted new growth',
          'Sticky residue on leaves',
          'Visible insects on plant'
        ],
        symptoms_telugu: [
          'ఆకులలో చిన్న రంధ్రాలు',
          'వక్రీకృత కొత్త పెరుగుదల',
          'ఆకులపై అంటుకునే అవశేషాలు',
          'మొక్కపై కనిపించే కీటకాలు'
        ],
        treatment: 'Spray with insecticidal soap or neem oil. Remove heavily infested leaves. Introduce beneficial insects (ladybugs, lacewings). Use yellow sticky traps.',
        treatment_telugu: 'కీటక సబ్బు లేదా వేప నూనెతో స్ప్రే చేయండి. ఎక్కువగా సోకిన ఆకులను తొలగించండి. ప్రయోజనకరమైన కీటకాలను (లేడీబగ్స్, లేస్‌వింగ్స్) పరిచయం చేయండి. పసుపు అంటుకునే ఉచ్చులను ఉపయోగించండి.',
        prevention: 'Regular monitoring, encourage beneficial insects, use row covers, practice crop rotation, remove weeds, maintain plant health with proper nutrition.',
        prevention_telugu: 'క్రమ పర్యవేక్షణ, ప్రయోజనకరమైన కీటకాలను ప్రోత్సహించండి, వరుస కవర్లను ఉపయోగించండి, పంట మార్పిడిని పాటించండి, కలుపు మొక్కలను తొలగించండి, సరైన పోషణతో మొక్క ఆరోగ్యాన్ని నిర్వహించండి.'
      };
    }
    
    // Yellowing or Stress
    if (diseaseLower.includes('yellow') || diseaseLower.includes('stress')) {
      return {
        symptoms: [
          'Yellowing of leaves',
          'Slow growth',
          'Weak stems',
          'Poor fruit development'
        ],
        symptoms_telugu: [
          'ఆకులు పసుపు రంగులోకి మారడం',
          'నెమ్మదిగా పెరుగుదల',
          'బలహీనమైన కాండాలు',
          'పేలవమైన పండు అభివృద్ధి'
        ],
        treatment: 'Test soil pH and nutrient levels. Apply balanced fertilizer if deficient. Ensure proper watering (1-2 inches per week). Check for root problems or pests.',
        treatment_telugu: 'నేల pH మరియు పోషక స్థాయిలను పరీక్షించండి. లోపం ఉంటే సమతుల్య ఎరువులు వర్తింపజేయండి. సరైన నీటి పారుదలను నిర్ధారించండి (వారానికి 1-2 అంగుళాలు). రూట్ సమస్యలు లేదా తెగుళ్ల కోసం తనిఖీ చేయండి.',
        prevention: 'Maintain soil fertility with organic matter, test soil annually, ensure proper watering schedule, mulch to regulate soil temperature and moisture.',
        prevention_telugu: 'సేంద్రియ పదార్థంతో నేల సారవంతత నిర్వహించండి, ప్రతి సంవత్సరం నేలను పరీక్షించండి, సరైన నీటి పారుదల షెడ్యూల్‌ను నిర్ధారించండి, నేల ఉష్ణోగ్రత మరియు తేమను నియంత్రించడానికి మల్చ్ వేయండి.'
      };
    }
    
    // Default/Unknown
    return {
      symptoms: ['Symptoms require expert identification', 'Unclear disease pattern', 'May need laboratory testing'],
      symptoms_telugu: ['లక్షణాలకు నిపుణుల గుర్తింపు అవసరం', 'అస్పష్టమైన వ్యాధి నమూనా', 'ప్రయోగశాల పరీక్ష అవసరం కావచ్చు'],
      treatment: 'Isolate affected plants. Take clear photos for expert consultation. Avoid using broad-spectrum treatments without proper diagnosis. Monitor daily for changes.',
      treatment_telugu: 'ప్రభావిత మొక్కలను వేరుచేయండి. నిపుణుల సంప్రదింపు కోసం స్పష్టమైన ఫోటోలు తీయండి. సరైన నిర్ధారణ లేకుండా విస్తృత-స్పెక్ట్రమ్ చికిత్సలను ఉపయోగించకండి. రోజువారీ మార్పుల కోసం పర్యవేక్షించండి.',
      prevention: 'Practice good sanitation, maintain plant health, ensure proper spacing and air circulation, use disease-resistant varieties when available, rotate crops annually.',
      prevention_telugu: 'మంచి పరిశుభ్రత పాటించండి, మొక్క ఆరోగ్యాన్ని కాపాడుకోండి, సరైన అంతరం మరియు గాలి ప్రసరణను నిర్ధారించండి, అందుబాటులో ఉన్నప్పుడు వ్యాధి-నిరోధక రకాలను ఉపయోగించండి, ప్రతి సంవత్సరం పంటలను మార్చండి.'
    };
  }

  /**
   * Get pest-specific treatment with Telugu translation
   */
  getPestTreatment(pestName, crop) {
    const pestTreatments = {
      'Aphid Infestation': {
        symptoms: [
          'Small green, black, or brown insects on leaves and stems',
          'Curled or distorted leaves',
          'Sticky honeydew on leaves',
          'Sooty mold growth',
          'Stunted plant growth'
        ],
        symptoms_telugu: [
          'ఆకులు మరియు కాండాలపై చిన్న ఆకుపచ్చ, నలుపు లేదా గోధుమ కీటకాలు',
          'వంకరగా లేదా వక్రీకృత ఆకులు',
          'ఆకులపై అంటుకునే తేనె కారుతో',
          'మసి బూజు పెరుగుదల',
          'కుంగిన మొక్క పెరుగుదల'
        ],
        treatment: 'Spray with neem oil (3-5 ml per liter) or insecticidal soap every 5-7 days. Remove heavily infested leaves. Introduce natural predators like ladybugs (100-500 per plant). Use yellow sticky traps. Spray strong water jets to dislodge aphids.',
        treatment_telugu: 'ప్రతి 5-7 రోజులకు వేప నూనె (లీటరుకు 3-5 మి.లీ) లేదా కీటక సబ్బుతో స్ప్రే చేయండి. ఎక్కువగా సోకిన ఆకులను తొలగించండి. లేడీబగ్స్ వంటి సహజ శత్రువులను పరిచయం చేయండి (మొక్కకు 100-500). పసుపు అంటుకునే ఉచ్చులను ఉపయోగించండి. అఫిడ్లను తొలగించడానికి బలమైన నీటి జెట్లను స్ప్రే చేయండి.',
        prevention: 'Regular inspection (2-3 times weekly), encourage beneficial insects with flowering plants, use reflective mulches, avoid excessive nitrogen fertilization, maintain proper plant spacing (30-45 cm), remove weeds that harbor aphids.',
        prevention_telugu: 'క్రమ పర్యవేక్షణ (వారానికి 2-3 సార్లు), పుష్పించే మొక్కలతో ప్రయోజనకరమైన కీటకాలను ప్రోత్సహించండి, ప్రతిబింబ మల్చ్‌లను ఉపయోగించండి, అధిక నత్రజని ఎరువులు వేయకండి, సరైన మొక్క అంతరాన్ని నిర్వహించండి (30-45 సెం.మీ), అఫిడ్లకు ఆశ్రయం ఇచ్చే కలుపు మొక్కలను తొలగించండి.'
      },
      'Caterpillar Damage': {
        symptoms: [
          'Large holes or missing sections in leaves',
          'Visible caterpillars on plants',
          'Dark droppings (frass) on leaves',
          'Skeletonized leaves',
          'Damaged fruits or flowers'
        ],
        symptoms_telugu: [
          'ఆకులలో పెద్ద రంధ్రాలు లేదా తప్పిపోయిన విభాగాలు',
          'మొక్కలపై కనిపించే గొంగళి పురుగులు',
          'ఆకులపై ముదురు రంగు మలం (ఫ్రాస్)',
          'అస్థిపంజర ఆకులు',
          'దెబ్బతిన్న పండ్లు లేదా పువ్వులు'
        ],
        treatment: 'Hand-pick caterpillars in early morning or evening. Apply Bacillus thuringiensis (Bt) spray (1-2 grams per liter). Use neem-based pesticides. Install pheromone traps. Apply spinosad if infestation is severe.',
        treatment_telugu: 'ఉదయం లేదా సాయంత్రం చేతితో గొంగళి పురుగులను తీయండి. బాసిల్లస్ థురింజియెన్సిస్ (Bt) స్ప్రే (లీటరుకు 1-2 గ్రా) వర్తింపజేయండి. వేప ఆధారిత క్రిమినాశకాలను ఉపయోగించండి. ఫెరోమోన్ ఉచ్చులను అమర్చండి. తీవ్రమైన సంక్రమణ ఉంటే స్పినోసాడ్ వర్తింపజేయండి.',
        prevention: 'Use insect-proof nets, crop rotation every season, remove egg masses from leaves, encourage natural predators (birds, wasps), companion planting with marigold or basil, till soil after harvest to destroy pupae.',
        prevention_telugu: 'కీటక-రుద్ధ వలలను ఉపయోగించండి, ప్రతి సీజన్ పంట మార్పిడి, ఆకుల నుండి గుడ్డు సమూహాలను తొలగించండి, సహజ శత్రువులను (పక్షులు, కందిరీగలు) ప్రోత్సహించండి, మ్యారిగోల్డ్ లేదా తులసితో తోడు నాటడం, ప్యూపాలను నాశనం చేయడానికి పంట తర్వాత నేలను దున్నండి.'
      },
      'Beetle Damage': {
        symptoms: [
          'Holes in leaves with irregular shapes',
          'Visible beetles on plants (day or night)',
          'Chewed leaf edges',
          'Damaged stems or roots',
          'Reduced plant growth'
        ],
        symptoms_telugu: [
          'ఆకులలో సక్రమంగా లేని ఆకారపు రంధ్రాలు',
          'మొక్కలపై కనిపించే బీటిల్స్ (పగలు లేదా రాత్రి)',
          'నమలిన ఆకు అంచులు',
          'దెబ్బతిన్న కాండాలు లేదా వేర్లు',
          'తగ్గిన మొక్క పెరుగుదల'
        ],
        treatment: 'Hand-pick beetles in morning and evening. Apply neem-based insecticides (5 ml/liter) weekly. Use carbaryl or malathion for severe infestations (2 ml/liter). Install light traps at night. Apply diatomaceous earth around plant base.',
        treatment_telugu: 'ఉదయం మరియు సాయంత్రం చేతితో బీటిల్స్ తీయండి. వారానికి వేప ఆధారిత క్రిమినాశకాలు (5 మి.లీ/లీటర్) వర్తింపజేయండి. తీవ్రమైన సంక్రమణలకు కార్బరిల్ లేదా మలథియాన్ (2 మి.లీ/లీటర్) ఉపయోగించండి. రాత్రి వెలుగు ఉచ్చులను అమర్చండి. మొక్క పునాది చుట్టూ డయాటోమేషియస్ భూమిని వర్తింపజేయండి.',
        prevention: 'Crop rotation with non-host crops, remove plant debris after harvest, use row covers during peak beetle season, maintain soil health, companion planting with garlic or onion, till soil in fall to expose larvae.',
        prevention_telugu: 'అతిథేయ కాని పంటలతో పంట మార్పిడి, పంట తర్వాత మొక్కల చెత్తను తొలగించండి, గరిష్ట బీటిల్ సీజన్‌లో వరుస కవర్లను ఉపయోగించండి, నేల ఆరోగ్యాన్ని నిర్వహించండి, వెల్లుల్లి లేదా ఉల్లిపాయతో తోడు నాటడం, లార్వాలను బహిర్గతం చేయడానికి శరదృతువులో నేలను దున్నండి.'
      },
      'Whitefly Infestation': {
        symptoms: [
          'Tiny white flying insects on leaf undersides',
          'Yellow, wilting leaves',
          'Honeydew and sooty mold',
          'Leaf distortion and drop',
          'Virus disease symptoms'
        ],
        symptoms_telugu: [
          'ఆకు దిగువ భాగాలపై చిన్న తెల్లని ఎగిరే కీటకాలు',
          'పసుపు, వాడిపోతున్న ఆకులు',
          'తేనెకారు మరియు మసి బూజు',
          'ఆకుల వక్రీకరణ మరియు రాలడం',
          'వైరస్ వ్యాధి లక్షణాలు'
        ],
        treatment: 'Spray neem oil (5 ml/liter) every 5 days. Use yellow sticky traps extensively. Apply imidacloprid as soil drench (0.3 ml/liter). Spray with soap water (2%). Remove heavily infested leaves.',
        treatment_telugu: 'ప్రతి 5 రోజులకు వేప నూనె (5 మి.లీ/లీటర్) స్ప్రే చేయండి. పసుపు అంటుకునే ఉచ్చులను విస్తృతంగా ఉపయోగించండి. నేల తడి వేయడానికి ఇమిడాక్లోప్రిడ్ (0.3 మి.లీ/లీటర్) వర్తింపజేయండి. సబ్బు నీటితో (2%) స్ప్రే చేయండి. ఎక్కువగా సోకిన ఆకులను తొలగించండి.',
        prevention: 'Use reflective mulches, install fine mesh screens, avoid over-fertilization, maintain field hygiene, grow trap crops like mustard, roguing infected plants early.',
        prevention_telugu: 'ప్రతిబింబ మల్చ్‌లను ఉపయోగించండి, చక్కటి జాలి తెరలను అమర్చండి, అధిక ఎరువులు వేయకండి, పొలం పరిశుభ్రతను నిర్వహించండి, ఆవాలు వంటి ఉచ్చు పంటలను పండించండి, సోకిన మొక్కలను త్వరగా తొలగించండి.'
      },
      'Spider Mite Infestation': {
        symptoms: [
          'Fine webbing on leaves',
          'Tiny moving dots on leaf undersides',
          'Yellow or bronze stippling on leaves',
          'Leaf drying and falling',
          'Reduced plant vigor'
        ],
        symptoms_telugu: [
          'ఆకులపై చక్కటి వెబ్బింగ్',
          'ఆకు దిగువ భాగాలపై చిన్న కదిలే చుక్కలు',
          'ఆకులపై పసుపు లేదా కాంస్య రంగు మచ్చలు',
          'ఆకులు ఎండిపోవడం మరియు రాలడం',
          'తగ్గిన మొక్క శక్తి'
        ],
        treatment: 'Spray with strong water jets daily. Apply sulfur spray (3 grams/liter). Use acaricides like dicofol or propargite. Spray neem oil (5 ml/liter). Increase humidity around plants.',
        treatment_telugu: 'ప్రతిరోజు బలమైన నీటి జెట్లతో స్ప్రే చేయండి. సల్ఫర్ స్ప్రే (3 గ్రా/లీటర్) వర్తింపజేయండి. డైకోఫోల్ లేదా ప్రొపార్గైట్ వంటి అకారిసైడ్‌లను ఉపయోగించండి. వేప నూనె (5 మి.లీ/లీటర్) స్ప్రే చేయండి. మొక్కల చుట్టూ తేమను పెంచండి.',
        prevention: 'Maintain high humidity, avoid water stress, regular monitoring with hand lens, remove infested leaves, use predatory mites, avoid dusty conditions.',
        prevention_telugu: 'అధిక తేమను నిర్వహించండి, నీటి ఒత్తిడిని నివారించండి, చేతి లెన్స్‌తో క్రమ పర్యవేక్షణ, సోకిన ఆకులను తొలగించండి, శికారీ మైట్‌లను ఉపయోగించండి, ధూళి పరిస్థితులను నివారించండి.'
      }
    };

    return pestTreatments[pestName] || {
      symptoms: ['Pest damage symptoms', 'Visible insect activity'],
      symptoms_telugu: ['తెగులు నష్టం లక్షణాలు', 'కనిపించే కీటక కార్యకలాపాలు'],
      treatment: 'Identify the pest accurately. Use appropriate insecticide. Consider integrated pest management approaches.',
      treatment_telugu: 'తెగులును ఖచ్చితంగా గుర్తించండి. తగిన కీటక నాశిని ఉపయోగించండి. సమగ్ర తెగులు నిర్వహణ విధానాలను పరిగణించండి.',
      prevention: 'Regular monitoring, maintain plant health, use resistant varieties when available.',
      prevention_telugu: 'క్రమ పర్యవేక్షణ, మొక్క ఆరోగ్యాన్ని కాపాడుకోండి, అందుబాటులో ఉన్నప్పుడు నిరోధక రకాలను ఉపయోగించండి.'
    };
  }

  /**
   * Get disease-specific treatment with Telugu translation
   */
  getDiseaseTreatment(diseaseName, crop) {
    // This method would contain disease-specific treatments similar to pest treatments
    // For now, falling back to the generic generateTreatmentInfo
    return this.generateTreatmentInfo(diseaseName, crop);
  }

  buildPrompt(prompt, context) {
    if (Object.keys(context).length === 0) {
      return prompt;
    }
    
    const contextStr = Object.entries(context)
      .map(([key, value]) => `${key}: ${value}`)
      .join('\n');
    
    return `Context:\n${contextStr}\n\nQuestion: ${prompt}\n\nPlease provide a detailed, practical answer suitable for Indian farmers.`;
  }

  parseTreatmentResponse(response) {
    try {
      // Try to parse JSON if AI returned it
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      // Otherwise, structure the text response
      return {
        immediateActions: this.extractListItems(response, 'immediate'),
        organicTreatment: this.extractListItems(response, 'organic'),
        chemicalTreatment: this.extractListItems(response, 'chemical'),
        prevention: this.extractListItems(response, 'prevention'),
        expectedRecovery: this.extractSection(response, 'recovery') || '2-3 weeks with proper treatment'
      };
    } catch (error) {
      return { rawResponse: response };
    }
  }

  extractListItems(text, keyword) {
    const lines = text.split('\n').filter(line => line.trim());
    const items = [];
    let capturing = false;
    
    for (const line of lines) {
      if (line.toLowerCase().includes(keyword)) {
        capturing = true;
        continue;
      }
      if (capturing && (line.startsWith('-') || line.startsWith('•') || /^\d+\./.test(line))) {
        items.push(line.replace(/^[-•\d.]\s*/, '').trim());
      }
      if (capturing && items.length > 0 && line.trim() === '') {
        break;
      }
    }
    
    return items.length > 0 ? items : ['Consult local agricultural expert'];
  }

  extractSection(text, keyword) {
    const lines = text.split('\n');
    const relevantLine = lines.find(line => 
      line.toLowerCase().includes(keyword)
    );
    return relevantLine ? relevantLine.split(':')[1]?.trim() : null;
  }

  /**
   * Mock data as last resort fallback (offline mode)
   * Includes Telugu translations for farmer accessibility
   */
  getMockDetection(cropType) {
    const mockDiseases = [
      { 
        disease: 'Late Blight', 
        severity: 'high', 
        confidence: 87,
        treatment_english: 'Remove affected leaves immediately and apply copper-based fungicide',
        treatment_telugu: 'ప్రభావిత ఆకులను వెంటనే తొలగించండి మరియు రాగి ఆధారిత ఫంగిసైడ్ వర్తించండి',
        prevention: 'Improve air circulation and avoid overhead watering'
      },
      { 
        disease: 'Leaf Spot', 
        severity: 'moderate', 
        confidence: 75,
        treatment_english: 'Prune infected areas and apply appropriate fungicide',
        treatment_telugu: 'సోకిన ప్రాంతాలను కత్తిరించండి మరియు తగిన ఫంగిసైడ్ వర్తించండి',
        prevention: 'Water early in the day and space plants properly'
      },
      { 
        disease: 'Powdery Mildew', 
        severity: 'moderate', 
        confidence: 82,
        treatment_english: 'Apply neem oil spray and reduce humidity around plants',
        treatment_telugu: 'వేప నూనె స్ప్రే వర్తించండి మరియు మొక్కల చుట్టూ తేమను తగ్గించండి',
        prevention: 'Ensure good air flow and avoid water stress'
      },
      { 
        disease: 'Healthy Plant', 
        severity: 'low', 
        confidence: 95,
        treatment_english: 'Continue regular monitoring and maintain good agricultural practices',
        treatment_telugu: 'క్రమం తప్పకుండా పర్యవేక్షణ కొనసాగించండి మరియు మంచి వ్యవసాయ పద్ధతులను కొనసాగించండి',
        prevention: 'Regular inspection and proper nutrition'
      }
    ];
    
    const random = mockDiseases[Math.floor(Math.random() * mockDiseases.length)];
    
    return {
      disease: random.disease,
      crop: cropType || 'Tomato',
      confidence: random.confidence,
      severity: random.severity,
      symptoms: ['Offline mode - symptoms not available'],
      recommendations: [
        `English: ${random.treatment_english}`,
        `Telugu: ${random.treatment_telugu}`,
        `Prevention: ${random.prevention}`,
        ...this.getRecommendations(random.disease)
      ],
      treatment_english: random.treatment_english,
      treatment_telugu: random.treatment_telugu,
      prevention: random.prevention,
      allPredictions: mockDiseases.map(d => ({
        disease: d.disease,
        confidence: d.confidence
      })),
      source: 'offline_mock',
      model: 'local_fallback',
      rawResponse: { 
        mock: true, 
        message: 'Operating in offline mode - all AI services unavailable',
        note: 'This is a fallback response to ensure farmers always get useful information'
      }
    };
  }

  getMockTreatment(disease, severity) {
    return {
      immediateActions: [
        'Inspect affected areas thoroughly',
        'Remove and destroy severely affected plant parts',
        'Isolate infected plants if possible'
      ],
      organicTreatment: [
        'Apply neem oil spray (10ml per liter)',
        'Use compost tea as foliar spray',
        'Apply trichoderma-based bio-fungicide',
        'Maintain proper plant spacing'
      ],
      chemicalTreatment: [
        'Apply copper oxychloride 50% WP @ 3g/liter',
        'Use mancozeb 75% WP @ 2g/liter',
        'Consult agricultural extension officer for severe cases',
        'Follow label instructions carefully'
      ],
      prevention: [
        'Regular field monitoring (weekly)',
        'Crop rotation with non-host crops',
        'Remove crop residues after harvest',
        'Use disease-resistant varieties',
        'Maintain field hygiene'
      ],
      expectedRecovery: severity === 'High' ? '3-4 weeks with intensive treatment' : 
                        severity === 'Medium' ? '2-3 weeks with proper care' : 
                        '1-2 weeks with preventive measures'
    };
  }

  /**
   * Translate disease names, crop names, and severity to Telugu
   */
  translateToTelugu(text, type) {
    if (!text) return text;
    
    const textLower = text.toLowerCase();
    
    // Disease name translations
    const diseaseTranslations = {
      'healthy': 'ఆరోగ్యకరమైన',
      'unknown condition': 'తెలియని పరిస్థితి',
      'possible plant stress': 'సంభావ్య మొక్క ఒత్తిడి',
      'general plant damage': 'సాధారణ మొక్క నష్టం',
      'minor plant damage': 'చిన్న మొక్క నష్టం',
      'leaf spot disease': 'ఆకు మచ్చ వ్యాధి',
      'wilting disease': 'వాడిపోయే వ్యాధి',
      'fungal disease': 'శిలీంధ్ర వ్యాధి',
      'possible fungal/bacterial disease': 'సంభావ్య శిలీంధ్ర/బ్యాక్టీరియా వ్యాధి',
      'plant stress/disease symptoms': 'మొక్క ఒత్తిడి/వ్యాధి లక్షణాలు',
      'leaf blight/necrosis': 'ఆకు బ్లైట్/నెక్రోసిస్',
      'leaf blight': 'ఆకు బ్లైట్',
      'necrosis': 'నెక్రోసిస్',
      'chlorosis/nutrient deficiency': 'క్లోరోసిస్/పోషక లోపం',
      'chlorosis': 'క్లోరోసిస్',
      'nutrient deficiency': 'పోషక లోపం',
      'leaf discoloration': 'ఆకు రంగు మార్పు',
      'yellowing leaves - possible nutrient issue': 'పసుపు ఆకులు - పోషక సమస్య సంభావ్యం',
      'browning detected - possible stress': 'గోధుమ రంగు గుర్తించబడింది - ఒత్తిడి సంభావ్యం',
      'high moisture - monitor for disease': 'అధిక తేమ - వ్యాధి కోసం పర్యవేక్షించండి',
      'plant monitoring recommended': 'మొక్క పర్యవేక్షణ సిఫార్సు చేయబడింది',
      'plant requires observation': 'మొక్క పరిశీలన అవసరం',
      'aphid infestation': 'అఫిడ్ తెగులు',
      'aphid': 'అఫిడ్ తెగులు',
      'whitefly infestation': 'తెల్ల ఈగ తెగులు',
      'whitefly': 'తెల్ల ఈగ తెగులు',
      'caterpillar damage': 'గొంగళి పురుగు నష్టం',
      'caterpillar': 'గొంగళి పురుగు నష్టం',
      'beetle damage': 'బీటిల్ నష్టం',
      'beetle': 'బీటిల్ నష్టం',
      'spider mite': 'సాలీడు పురుగు',
      'mite': 'సాలీడు పురుగు',
      'thrips': 'త్రిప్స్ తెగులు',
      'leafhopper': 'ఆకు దూకే పురుగు',
      'mealybug': 'పిండి పురుగు',
      'scale insect': 'స్కేల్ కీటకం',
      'arthropod': 'కీటకాలు',
      'pest': 'తెగులు',
      'insect': 'కీటకం',
      'terrestrial animal': 'భూమి జంతువు',
      'macro photography': 'స్థూల ఫోటోగ్రఫీ',
      'invertebrate': 'అకశేరుక జీవి',
      'blight': 'బ్లైట్ వ్యాధి',
      'early blight': 'ముందస్తు బ్లైట్',
      'late blight': 'ఆలస్యమైన బ్లైట్',
      'leaf spot': 'ఆకు మచ్చ వ్యాధి',
      'rust': 'తుప్పు వ్యాధి',
      'powdery mildew': 'పొడి బూజు',
      'mildew': 'బూజు వ్యాధి',
      'wilt': 'వాడిపోయే వ్యాధి',
      'mosaic virus': 'మొజాయిక్ వైరస్',
      'bacterial spot': 'బ్యాక్టీరియా మచ్చ',
      'fungal disease': 'శిలీంధ్ర వ్యాధి',
      'viral disease': 'వైరల్ వ్యాధి',
      'pest damage': 'తెగులు నష్టం',
      'not a plant': 'మొక్క కాదు',
      'root rot': 'వేరు కుళ్ళు వ్యాధి',
      'fruit rot': 'పండు కుళ్ళు వ్యాధి',
      'stem rot': 'కాండం కుళ్ళు వ్యాధి'
    };
    
    // Crop name translations
    const cropTranslations = {
      'tomato': 'టొమాటో',
      'potato': 'బంగాళదుంప',
      'pepper': 'మిరపకాయ',
      'chilli': 'మిరపకాయ',
      'brinjal': 'వంకాయ',
      'eggplant': 'వంకాయ',
      'rice': 'వరి',
      'paddy': 'వరి',
      'wheat': 'గోధుమ',
      'corn': 'మొక్కజొన్న',
      'maize': 'మొక్కజొన్న',
      'cotton': 'పత్తి',
      'sugarcane': 'చెరకు',
      'onion': 'ఉల్లిపాయ',
      'garlic': 'వెల్లుల్లి',
      'cabbage': 'క్యాబేజీ',
      'cauliflower': 'కాలీఫ్లవర్',
      'cucumber': 'దోసకాయ',
      'pumpkin': 'గుమ్మడికాయ',
      'beans': 'బీన్స్',
      'peas': 'బఠానీలు',
      'carrot': 'క్యారెట్',
      'beetroot': 'బీట్‌రూట్',
      'unknown': 'తెలియని పంట'
    };
    
    // Severity translations
    const severityTranslations = {
      'low': 'తక్కువ',
      'moderate': 'మధ్యస్థం',
      'medium': 'మధ్యస్థం',
      'high': 'అధికం',
      'severe': 'తీవ్రమైన',
      'critical': 'విషమ స్థితి',
      'none': 'ఏమీ లేదు'
    };
    
    if (type === 'disease') {
      for (const [english, telugu] of Object.entries(diseaseTranslations)) {
        if (textLower.includes(english)) {
          return telugu;
        }
      }
    } else if (type === 'crop') {
      return cropTranslations[textLower] || text;
    } else if (type === 'severity') {
      return severityTranslations[textLower] || text;
    }
    
    return text;
  }

  /**
   * Generate overlay image (placeholder for future implementation)
   */
  async generateOverlay(imageBuffer, detectionResult) {
    // Future enhancement: Use computer vision to highlight affected areas
    // For now, return null
    return null;
  }
}

module.exports = new AIService();
