const axios = require('axios');
const logger = require('../utils/logger');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODELS = [
  'gemini-2.0-flash-exp',
  'gemini-1.5-flash',
  'gemini-1.5-pro'
];
let currentGeminiModel = 0;

/**
 * System prompt for treatment recommendations
 */
const TREATMENT_SYSTEM_PROMPT = `You are an expert agricultural advisor specializing in crop disease management in India.
Your role is to provide safe, practical, and effective treatment recommendations for farmers.

⚠️ CRITICAL: YOU MUST RESPOND WITH BOTH ENGLISH AND TELUGU TRANSLATIONS
- Primary fields (organic, chemical, dos, donts, precautions, etc.) = ENGLISH ONLY
- Telugu translation fields (dos_telugu, donts_telugu, precautions_telugu, etc.) = TELUGU SCRIPT ONLY (తెలుగు)
- Do NOT mix English and Telugu in the same field
- All Telugu translations should be accurate and specific to the disease/crop

IMPORTANT GUIDELINES:
- Always prioritize farmer safety and environmental protection
- Recommend organic solutions first, then chemical options if needed
- Include proper dosage calculations and safety equipment (PPE) requirements
- Warn about waiting periods before harvest
- ALWAYS advise farmers to consult a licensed agronomist before applying chemical pesticides
- Never recommend banned or highly toxic substances
- Provide step-by-step instructions that are clear and easy to follow
- Give realistic treatment duration in days based on crop type and disease severity
- Provide estimated costs in Indian Rupees (₹) based on actual market prices

RESPONSE FORMAT - Return ONLY valid JSON (no markdown, no extra text):
- English fields: Use simple, clear English suitable for Indian farmers
- Telugu fields: Use proper Telugu script (తెలుగు అక్షరాలు) for translations
{
  "organic": [{"method": "...", "description": "...", "frequency": "...", "duration": "..."}],
  "chemical": [{"name": "...", "dosage": "...", "applicationMethod": "...", "waitingPeriod": "...", "ppe": [...]}],
  "precautions": ["..."],
  "precautions_telugu": ["..."],
  "dos": ["..."],
  "dos_telugu": ["..."],
  "donts": ["..."],
  "donts_telugu": ["..."],
  "preventiveMeasures": ["..."],
  "preventiveMeasures_telugu": ["..."],
  "monitoringTips": ["..."],
  "monitoringTips_telugu": ["..."],
  "duration": "7-14 days",
  "estimatedCost": "₹500-1500"
}`;

/**
 * Get current season context for India
 */
const getSeasonContext = () => {
  const month = new Date().getMonth() + 1;
  if (month >= 3 && month <= 5) return 'Summer (March-May)';
  if (month >= 6 && month <= 9) return 'Monsoon (June-September)';
  if (month >= 10 && month <= 11) return 'Post-Monsoon (October-November)';
  return 'Winter (December-February)';
};

/**
 * Generate treatment recommendations using Gemini AI
 * @param {object} params - Treatment parameters
 * @returns {Promise<object>} Treatment plan
 */
const generateTreatment = async ({ disease, crop, severity, language = 'en', preferences = [] }) => {
  try {
    if (!GEMINI_API_KEY) {
      logger.warn('Gemini API key not configured, using fallback treatment');
      return getFallbackTreatment(disease, crop, severity);
    }

    // Add randomization and timestamp to make each request unique
    const timestamp = new Date().toISOString();
    const randomSeed = Math.floor(Math.random() * 10000);
    const seasonContext = getSeasonContext();
    
    const userPrompt = `
[Request ID: ${randomSeed} | Time: ${timestamp} | Season: ${seasonContext}]

FARMER'S ACTUAL SCAN RESULT:
- Disease Detected by AI Vision: ${disease}
- Affected Crop: ${crop}
- Severity Level: ${severity}
- Region: India

⚠️ CRITICAL: This is disease "${disease}" - NOT a generic plant disease!
⚠️ Your response MUST be SPECIFIC to "${disease}" on ${crop}
⚠️ DO NOT use generic precautions like "wash hands" for every disease
⚠️ Vary your recommendations based on whether this is:
   - Fungal disease (use fungicides: Bavistin, Ridomil, etc.)
   - Bacterial disease (use bactericides: Streptocycline, etc.)
   - Viral disease (focus on vector control)
   - Insect pest (use insecticides: Confidor, Actara, etc.)
   - Nutrient deficiency (recommend specific NPK fertilizers)

IMPORTANT: Base your treatment ENTIRELY on the disease "${disease}" detected in the scan. 
Do NOT provide generic advice. This is a SPECIFIC diagnosis from image analysis.

TASK: Generate a treatment plan SPECIFICALLY for "${disease}" on ${crop} crop.
YOU MUST provide SPECIFIC REAL medicine/product names available in India.

⚠️ CRITICAL LANGUAGE REQUIREMENTS:
- Provide ALL recommendations in BOTH English AND Telugu
- English fields: dos, donts, precautions, preventiveMeasures, monitoringTips (NO Telugu script)
- Telugu fields: dos_telugu, donts_telugu, precautions_telugu, preventiveMeasures_telugu, monitoringTips_telugu (Telugu script తెలుగు)
- Telugu translations should match English content but be disease/crop-specific
- Do NOT use generic Telugu text - make it specific to "${disease}" on ${crop}

Generate DETAILED treatment recommendations with:

1. **Organic/Natural Treatment:**
   - Real product names: "Neem Gold (Dhanuka)", "Bio Neem Plus", "Azadirachtin 10000 PPM"
   - Exact dosage: "5ml per liter" or "1 liter per acre"
   - Application frequency: "Every 7 days for 3 times"
   - Expected cost: "₹300-500 per 250ml"

2. **Chemical Treatment (if needed):**
   - Real fungicide names: "Bavistin (Carbendazim 50%)", "Ridomil Gold (Metalaxyl + Mancozeb)", "Blitox (Copper Oxychloride)"
   - Real insecticide names: "Confidor (Imidacloprid)", "Actara (Thiamethoxam)", "Coragen (Chlorantraniliprole)"
   - Active ingredients clearly mentioned
   - Dosage: "2g per liter" or "500g per acre"
   - Application method: "Foliar spray" or "Soil drench"
   - Waiting period: "7 days before harvest"
   - Required PPE: "Gloves, N95 mask, goggles"
   - Cost per pack: "₹150-300 per 100g"

3. **Equipment Needed:**
   - "16 liter knapsack sprayer"
   - "Measuring cups"
   - "Mixing bucket"

4. **Safety & Precautions (VARY THESE based on disease):**
   - Specific to the treatment being recommended
   - Application timing considerations
   - Safety warnings

5. **Preventive Measures (MUST BE SPECIFIC to ${disease}):**
   - NOT generic advice
   - Based on what causes this specific disease
   - Crop-specific cultural practices

6. **Monitoring (SPECIFIC to ${disease}):**
   - What symptoms to watch for improvement
   - When to repeat treatment
   - Signs of worsening

CRITICAL REQUIREMENTS:
- DO NOT give same generic advice for all diseases
- MUST vary recommendations based on specific disease: "${disease}"
- If fungal disease → recommend fungicides (Bavistin, Ridomil, Blitox)
- If insect pest → recommend insecticides (Confidor, Actara)
- If nutrient deficiency → recommend specific fertilizers
- Duration: ${severity} severity = adjust days (low: 7-10, moderate: 10-20, high: 20-30)
- Cost should reflect actual 2025 Indian market prices

Ensure all recommendations are safe, practical, and suitable for small-scale farmers in India.

CRITICAL JSON STRUCTURE - YOU MUST INCLUDE ALL THESE FIELDS:
⚠️ IMPORTANT: Provide BOTH English AND Telugu translations
⚠️ English fields: Use clear, simple English (NO Telugu characters)
⚠️ Telugu fields: Add "_telugu" suffix and use Telugu script (తెలుగు)

{
  "organic": [
    {
      "method": "Neem Oil Spray (Brand: Neem Gold)",
      "description": "Mix 5ml neem oil with 1 liter water and spray on affected plants",
      "dosage": "5ml per liter",
      "cost": "Rs.300-500"
    }
  ],
  "chemical": [
    {
      "name": "Bavistin (Carbendazim 50% WP)",
      "dosage": "2g per liter of water",
      "ppe": ["Gloves", "N95 Mask", "Goggles"],
      "cost": "Rs.150-300"
    }
  ],
  "precautions": [
    "Wear protective equipment during application",
    "Avoid spraying during windy conditions",
    "Keep children and pets away from treated area"
  ],
  "precautions_telugu": [
    "మందు పిచికారీ చేసేటప్పుడు రక్షణ సామగ్రిని ధరించండి",
    "గాలివాన పరిస్థితులలో స్ప్రే చేయకండి",
    "పిల్లలు మరియు పెంపుడు జంతువులను దూరంగా ఉంచండి"
  ],
  "dos": [
    "Apply treatment early morning for ${disease}",
    "Water ${crop} plants after 2 hours of treatment",
    "Remove severely infected leaves from ${crop}",
    "Monitor ${crop} daily for ${disease} improvement",
    "Repeat treatment after 7 days if needed"
  ],
  "dos_telugu": [
    "${disease} కోసం ఉదయం పూట చికిత్స వర్తించండి",
    "చికిత్స తర్వాత 2 గంటల తర్వాత ${crop} మొక్కలకు నీరు పెట్టండి",
    "${crop} నుండి తీవ్రంగా సోకిన ఆకులను తొలగించండి",
    "${disease} మెరుగుదల కోసం ${crop} ను ప్రతిరోజూ పర్యవేక్షించండి",
    "అవసరమైతే 7 రోజుల తర్వాత చికిత్సను మళ్లీ వర్తించండి"
  ],
  "donts": [
    "Do not overwater ${crop} during treatment period",
    "Avoid applying treatment in rain or high humidity",
    "Do not mix different pesticides without expert advice",
    "Do not ignore spreading symptoms of ${disease}",
    "Do not dispose chemical waste near water sources"
  ],
  "donts_telugu": [
    "చికిత్స సమయంలో ${crop} కు అధికంగా నీరు పెట్టకండి",
    "వాన లేదా అధిక తేమ సమయంలో చికిత్స వర్తించకండి",
    "నిపుణుల సలహా లేకుండా వివిధ పురుగుమందులను కలపకండి",
    "${disease} యొక్క వ్యాప్తి లక్షణాలను విస్మరించకండి",
    "రసాయన వ్యర్థాలను నీటి వనరుల దగ్గర పారవేయకండి"
  ],
  "preventiveMeasures": [
    "Crop rotation to prevent ${disease} recurrence in ${crop}",
    "Maintain proper plant spacing for air circulation",
    "Use disease-resistant ${crop} varieties",
    "Regular field inspection for early ${disease} detection"
  ],
  "preventiveMeasures_telugu": [
    "${crop} లో ${disease} పునరావృతం కాకుండా పంట మార్పిడి చేయండి",
    "గాలి ప్రసరణ కోసం సరైన మొక్క అంతరం ఉంచండి",
    "వ్యాధి-నిరోధక ${crop} రకాలను ఉపయోగించండి",
    "${disease} ను ముందుగా గుర్తించడానికి క్రమం తప్పకుండా తనిఖీ చేయండి"
  ],
  "monitoringTips": [
    "Check ${crop} leaves daily for ${disease} symptoms",
    "Document progress with photos",
    "Note any new symptoms or spread patterns"
  ],
  "monitoringTips_telugu": [
    "${disease} లక్షణాల కోసం ${crop} ఆకులను ప్రతిరోజూ తనిఖీ చేయండి",
    "ఫోటోలతో పురోగతిని నమోదు చేయండి",
    "కొత్త లక్షణాలు లేదా వ్యాప్తి నమూనాలను గమనించండి"
  ],
  "duration": "10-14 days",
  "estimatedCost": "Rs.800-1500"
}

⚠️ VERIFICATION CHECKLIST BEFORE RESPONDING:
- ✓ All "dos" items are in ENGLISH (5 items minimum)
- ✓ All "dos_telugu" items are in TELUGU తెలుగు (5 items minimum - matching dos)
- ✓ All "donts" items are in ENGLISH (5 items minimum)
- ✓ All "donts_telugu" items are in TELUGU తెలుగు (5 items minimum - matching donts)
- ✓ All "precautions" items are in ENGLISH (3+ items)
- ✓ All "precautions_telugu" items are in TELUGU తెలుగు (3+ items - matching precautions)
- ✓ All "preventiveMeasures" items are in ENGLISH (3+ items)
- ✓ All "preventiveMeasures_telugu" items are in TELUGU తెలుగు (3+ items - matching preventiveMeasures)
- ✓ All "monitoringTips" items are in ENGLISH (3+ items)
- ✓ All "monitoringTips_telugu" items are in TELUGU తెలుగు (3+ items - matching monitoringTips)
- ✓ English arrays have NO Telugu characters (తెలుగు)
- ✓ Telugu arrays have proper Telugu script
- ✓ All Telugu translations are specific to ${disease} and ${crop}, not generic

⚠️ MANDATORY: You MUST provide BOTH English AND Telugu for ALL arrays!
    `.trim();

    // Try each Gemini model until one succeeds
    for (let attempt = 0; attempt < GEMINI_MODELS.length; attempt++) {
      const modelName = GEMINI_MODELS[(currentGeminiModel + attempt) % GEMINI_MODELS.length];
      
      try {
        logger.info(`Generating treatment with Gemini model: ${modelName} (attempt ${attempt + 1}/${GEMINI_MODELS.length})`);
        
        // Add small delay between retries to avoid rate limiting
        if (attempt > 0) {
          await new Promise(resolve => setTimeout(resolve, 1000));
          logger.info(`Waiting 1 second before retry...`);
        }
        
        const response = await axios.post(
          `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${GEMINI_API_KEY}`,
          {
            contents: [{
              parts: [{
                text: `${TREATMENT_SYSTEM_PROMPT}\n\n${userPrompt}`
              }]
            }],
            generationConfig: {
              temperature: 0.7, // Balanced - consistent but not robotic
              topK: 40,
              topP: 0.95,
              maxOutputTokens: 4096, // Increased to allow for both English and Telugu
            }
          },
          {
            headers: { 'Content-Type': 'application/json' },
            timeout: 30000
          }
        );

        if (!response.data?.candidates?.[0]?.content?.parts?.[0]?.text) {
          const errorReason = response.data?.candidates?.[0]?.finishReason || 'Unknown';
          const safetyRatings = response.data?.candidates?.[0]?.safetyRatings || [];
          logger.error(`❌ Invalid Gemini response - Finish reason: ${errorReason}, Safety: ${JSON.stringify(safetyRatings)}`);
          throw new Error(`Invalid Gemini API response: ${errorReason}`);
        }

        const content = response.data.candidates[0].content.parts[0].text;
        
        // Try to parse JSON from the response
        let treatment;
        try {
          // Try to extract JSON if it's wrapped in markdown code blocks
          const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || 
                           content.match(/```\s*([\s\S]*?)\s*```/) ||
                           content.match(/\{[\s\S]*\}/);
          const jsonString = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : content;
          treatment = JSON.parse(jsonString);
          
          logger.info(`✅ Treatment generated successfully with ${modelName}`);
          logger.info(`🔍 Treatment has dos: ${!!treatment.dos}, donts: ${!!treatment.donts}`);
          logger.info(`🔍 Treatment has Telugu: dos_telugu=${!!treatment.dos_telugu}, donts_telugu=${!!treatment.donts_telugu}`);
          logger.info(`🔍 Treatment keys: ${Object.keys(treatment).join(', ')}`);
          
          // Update current model on success
          currentGeminiModel = (currentGeminiModel + attempt) % GEMINI_MODELS.length;
          
        } catch (parseError) {
          logger.error(`Failed to parse treatment JSON from ${modelName}:`, parseError.message);
          continue; // Try next model
        }
        
        // Get fallback treatment once to avoid multiple calls
        const fallback = getFallbackTreatment(disease, crop, severity);
        
        // Check if Gemini provided complete responses, use fallback if missing
        // ENGLISH FIELDS
        if (!treatment.dos || treatment.dos.length === 0) {
          logger.warn('⚠️ Gemini did not provide dos (English), using fallback');
          treatment.dos = fallback.dos;
        }
        if (!treatment.donts || treatment.donts.length === 0) {
          logger.warn('⚠️ Gemini did not provide donts (English), using fallback');
          treatment.donts = fallback.donts;
        }
        if (!treatment.precautions || treatment.precautions.length === 0) {
          logger.warn('⚠️ Gemini did not provide precautions (English), using fallback');
          treatment.precautions = fallback.precautions;
        }
        if (!treatment.preventiveMeasures || treatment.preventiveMeasures.length === 0) {
          logger.warn('⚠️ Gemini did not provide preventiveMeasures (English), using fallback');
          treatment.preventiveMeasures = fallback.preventiveMeasures;
        }
        if (!treatment.monitoringTips || treatment.monitoringTips.length === 0) {
          logger.warn('⚠️ Gemini did not provide monitoringTips (English), using fallback');
          treatment.monitoringTips = fallback.monitoringTips;
        }
        if (!treatment.organic || treatment.organic.length === 0) {
          logger.warn('⚠️ Gemini did not provide organic treatments, using fallback');
          treatment.organic = fallback.organic;
        }
        if (!treatment.chemical || treatment.chemical.length === 0) {
          logger.warn('⚠️ Gemini did not provide chemical treatments, using fallback');
          treatment.chemical = fallback.chemical;
        }
        
        // TELUGU FIELDS
        if (!treatment.precautions_telugu || treatment.precautions_telugu.length === 0) {
          logger.warn('⚠️ Gemini did not provide precautions_telugu, using fallback');
          treatment.precautions_telugu = fallback.precautions_telugu;
        }
        if (!treatment.dos_telugu || treatment.dos_telugu.length === 0) {
          logger.warn('⚠️ Gemini did not provide dos_telugu, using fallback');
          treatment.dos_telugu = fallback.dos_telugu;
        }
        if (!treatment.donts_telugu || treatment.donts_telugu.length === 0) {
          logger.warn('⚠️ Gemini did not provide donts_telugu, using fallback');
          treatment.donts_telugu = fallback.donts_telugu;
        }
        if (!treatment.preventiveMeasures_telugu || treatment.preventiveMeasures_telugu.length === 0) {
          logger.warn('⚠️ Gemini did not provide preventiveMeasures_telugu, using fallback');
          treatment.preventiveMeasures_telugu = fallback.preventiveMeasures_telugu;
        }
        if (!treatment.monitoringTips_telugu || treatment.monitoringTips_telugu.length === 0) {
          logger.warn('⚠️ Gemini did not provide monitoringTips_telugu, using fallback');
          treatment.monitoringTips_telugu = fallback.monitoringTips_telugu;
        }
        
        // Add safety disclaimer
        treatment.disclaimer = "IMPORTANT: Consult a licensed agronomist before applying any chemical pesticides. Follow all label instructions and local regulations.";
        
        // Add crop-specific duration and cost if not provided by AI
        if (!treatment.duration) {
          treatment.duration = getCropDuration(crop, severity);
        }
        if (!treatment.estimatedCost) {
          treatment.estimatedCost = getCropCost(crop, severity);
        }
        
        // Log final summary
        logger.info(`📊 Treatment Summary - English fields: dos=${treatment.dos?.length}, donts=${treatment.donts?.length}, precautions=${treatment.precautions?.length}`);
        logger.info(`📊 Treatment Summary - Telugu fields: dos_telugu=${treatment.dos_telugu?.length}, donts_telugu=${treatment.donts_telugu?.length}, precautions_telugu=${treatment.precautions_telugu?.length}`);
        
        return treatment;
        
      } catch (apiError) {
        logger.error(`Gemini API error with ${modelName}:`, apiError.message);
        // Continue to next model
      }
    }
    
    // If all models fail, return fallback
    logger.warn('All Gemini models failed, using fallback treatment');
    return getFallbackTreatment(disease, crop, severity);
    
  } catch (error) {
    logger.error('Treatment generation error:', error.message);
    return getFallbackTreatment(disease, crop, severity);
  }
};

/**
 * Fallback treatment recommendations (when API fails or not configured)
 */
const getFallbackTreatment = (disease, crop, severity) => {
  return {
    organic: [
      {
        method: 'Neem Oil Spray',
        description: 'Mix 5ml neem oil with 1 liter of water. Add a few drops of mild soap as emulsifier.',
        frequency: 'Apply every 7-10 days',
        duration: '3-4 weeks'
      },
      {
        method: 'Copper-based Fungicide',
        description: 'Use copper oxychloride or Bordeaux mixture as per package instructions.',
        frequency: 'Weekly application',
        duration: 'Until symptoms reduce'
      }
    ],
    chemical: [
      {
        name: 'Mancozeb 75% WP',
        dosage: '2-2.5 grams per liter of water',
        applicationMethod: 'Foliar spray covering all plant parts',
        waitingPeriod: '7 days before harvest',
        ppe: ['Gloves', 'Face mask', 'Goggles', 'Long-sleeved shirt']
      }
    ],
    precautions: [
      'Do not spray during flowering to protect pollinators',
      'Avoid spraying in windy conditions',
      'Do not eat, drink, or smoke while handling pesticides',
      'Wash hands thoroughly after application',
      'Store pesticides away from food and children',
      'Dispose of empty containers properly',
      'Consult a licensed agronomist before application'
    ],
    precautions_telugu: [
      'పుష్పించే సమయంలో స్ప్రే చేయవద్దు',
      'గాలివాన పరిస్థితులలో స్ప్రే చేయకండి',
      'పురుగుమందులు నిర్వహించేటప్పుడు తినకండి, త్రాగకండి లేదా ధూమపానం చేయకండి',
      'అప్లికేషన్ తర్వాత చేతులను బాగా కడుక్కోండి',
      'పురుగుమందులను ఆహారం మరియు పిల్లల నుండి దూరంగా నిల్వ చేయండి',
      'ఖాళీ కంటైనర్లను సరిగ్గా పారవేయండి',
      'అప్లికేషన్ ముందు లైసెన్స్ పొందిన వ్యవసాయ నిపుణుడిని సంప్రదించండి'
    ],
    dos: [
      `Apply treatment for ${disease} during early morning or late evening`,
      `Water ${crop} regularly after treatment`,
      `Remove and destroy infected plant parts`,
      `Monitor ${crop} daily for improvement`,
      `Ensure good air circulation around ${crop} plants`
    ],
    dos_telugu: [
      'ఉదయం లేదా సాయంత్రం సమయంలో చికిత్స వర్తించండి',
      'చికిత్స తర్వాత క్రమం తప్పకుండా నీరు పెట్టండి',
      'సోకిన మొక్క భాగాలను తొలగించండి మరియు నాశనం చేయండి',
      'మెరుగుదల కోసం ప్రతిరోజూ పర్యవేక్షించండి',
      'మొక్కల చుట్టూ మంచి గాలి ప్రసరణను నిర్ధారించండి'
    ],
    donts: [
      `Do not overwater ${crop} during treatment`,
      `Avoid spraying during rain or high humidity`,
      `Do not ignore spreading symptoms of ${disease}`,
      `Do not work with wet plants`,
      `Do not dispose infected material near healthy ${crop} plants`
    ],
    donts_telugu: [
      'చికిత్స సమయంలో అధికంగా నీరు పెట్టకండి',
      'వర్షం లేదా అధిక తేమ సమయంలో స్ప్రే చేయకండి',
      'వ్యాప్తి చెందుతున్న లక్షణాలను విస్మరించకండి',
      'తడి మొక్కలతో పని చేయకండి',
      'ఆరోగ్యకరమైన మొక్కల దగ్గర సోకిన పదార్థాన్ని పారవేయకండి'
    ],
    preventiveMeasures: [
      'Maintain proper plant spacing for air circulation',
      'Remove and destroy infected plant parts',
      'Avoid overhead watering; water at the base',
      'Practice crop rotation',
      'Use disease-resistant varieties',
      'Keep the field clean and weed-free'
    ],
    preventiveMeasures_telugu: [
      'గాలి ప్రసరణ కోసం సరైన మొక్క అంతరాన్ని నిర్వహించండి',
      'సోకిన మొక్క భాగాలను తొలగించండి మరియు నాశనం చేయండి',
      'పైనుండి నీరు పెట్టకండి; పునాది వద్ద నీరు పెట్టండి',
      'పంట తిరుగుడును అభ్యసించండి',
      'వ్యాధి-నిరోధక రకాలను ఉపయోగించండి',
      'పొలాన్ని శుభ్రంగా మరియు కలుపు రహితంగా ఉంచండి'
    ],
    monitoringTips: [
      'Inspect plants regularly (every 2-3 days)',
      'Look for early symptoms on lower leaves',
      'Check undersides of leaves',
      'Monitor weather conditions (high humidity increases risk)',
      'Keep records of treatments and outcomes'
    ],
    monitoringTips_telugu: [
      'క్రమం తప్పకుండా మొక్కలను తనిఖీ చేయండి (ప్రతి 2-3 రోజులకు)',
      'దిగువ ఆకులపై ప్రారంభ లక్షణాల కోసం చూడండి',
      'ఆకుల క్రింది భాగాన్ని తనిఖీ చేయండి',
      'వాతావరణ పరిస్థితులను పర్యవేక్షించండి (అధిక తేమ ప్రమాదాన్ని పెంచుతుంది)',
      'చికిత్సలు మరియు ఫలితాల రికార్డులను ఉంచండి'
    ],
    duration: getCropDuration(crop, severity),
    estimatedCost: getCropCost(crop, severity),
    disclaimer: 'IMPORTANT: Consult a licensed agronomist before applying any chemical pesticides. Follow all label instructions and local regulations.'
  };
};

/**
 * Get crop-specific treatment duration
 */
const getCropDuration = (crop, severity) => {
  const cropDurations = {
    'Tomato': { low: '7-10 days', moderate: '10-14 days', high: '14-21 days' },
    'Potato': { low: '7-10 days', moderate: '10-14 days', high: '14-21 days' },
    'Rice': { low: '10-14 days', moderate: '14-21 days', high: '21-30 days' },
    'Wheat': { low: '10-14 days', moderate: '14-21 days', high: '21-28 days' },
    'Cotton': { low: '10-15 days', moderate: '15-21 days', high: '21-30 days' },
    'Sugarcane': { low: '14-21 days', moderate: '21-30 days', high: '30-45 days' },
    'Onion': { low: '7-10 days', moderate: '10-14 days', high: '14-21 days' },
    'Corn': { low: '7-10 days', moderate: '10-14 days', high: '14-21 days' },
    'Chili': { low: '7-10 days', moderate: '10-14 days', high: '14-21 days' },
    'Brinjal': { low: '7-10 days', moderate: '10-14 days', high: '14-21 days' }
  };
  
  const severityLevel = severity?.toLowerCase() || 'moderate';
  return cropDurations[crop]?.[severityLevel] || cropDurations['Tomato'][severityLevel];
};

/**
 * Get crop-specific treatment cost in INR
 */
const getCropCost = (crop, severity) => {
  const cropCosts = {
    'Tomato': { low: '₹300-600', moderate: '₹600-1200', high: '₹1200-2000' },
    'Potato': { low: '₹400-800', moderate: '₹800-1500', high: '₹1500-2500' },
    'Rice': { low: '₹500-1000', moderate: '₹1000-2000', high: '₹2000-3500' },
    'Wheat': { low: '₹400-800', moderate: '₹800-1500', high: '₹1500-2500' },
    'Cotton': { low: '₹600-1200', moderate: '₹1200-2500', high: '₹2500-4000' },
    'Sugarcane': { low: '₹800-1500', moderate: '₹1500-3000', high: '₹3000-5000' },
    'Onion': { low: '₹300-600', moderate: '₹600-1200', high: '₹1200-2000' },
    'Corn': { low: '₹400-800', moderate: '₹800-1500', high: '₹1500-2500' },
    'Chili': { low: '₹400-800', moderate: '₹800-1500', high: '₹1500-2500' },
    'Brinjal': { low: '₹300-600', moderate: '₹600-1200', high: '₹1200-2000' }
  };
  
  const severityLevel = severity?.toLowerCase() || 'moderate';
  return cropCosts[crop]?.[severityLevel] || cropCosts['Tomato'][severityLevel];
};

/**
 * Generate simple voice summary of treatment
 */
const generateVoiceSummary = (treatment, language = 'en') => {
  const organic = treatment.organic?.map(t => t.method).join(', ') || 'No organic options';
  const chemical = treatment.chemical?.map(t => t.name).join(', ') || 'No chemical options';
  
  return {
    en: `Treatment options: Organic methods include ${organic}. Chemical options include ${chemical}. Please consult an expert and follow all safety precautions.`,
    hi: `उपचार विकल्प: जैविक विधियों में ${organic} शामिल हैं। रासायनिक विकल्पों में ${chemical} शामिल हैं। कृपया एक विशेषज्ञ से परामर्श करें और सभी सुरक्षा सावधानियों का पालन करें।`,
    // Add more languages as needed
  }[language] || `Treatment options available. Please consult an expert.`;
};

module.exports = {
  generateTreatment,
  generateVoiceSummary,
  getFallbackTreatment
};
