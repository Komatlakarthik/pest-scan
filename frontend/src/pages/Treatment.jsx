import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, 
  Loader2, 
  CheckCircle2, 
  Clock, 
  Calendar, 
  Sparkles, 
  AlertTriangle, 
  ShoppingCart, 
  TrendingUp, 
  BookOpen, 
  Globe,
  Droplets,
  Sun,
  ThermometerSun,
  Leaf,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Save,
  Check,
  List,
  Volume2,
  VolumeX,
  Stethoscope,
  Phone,
  X,
  MapPin,
  Star
} from 'lucide-react';
import api from '../utils/axios';
import toast from 'react-hot-toast';
import useAuthStore from '../store/authStore';

export default function Treatment() {
  const location = useLocation();
  const navigate = useNavigate();
  const { token } = useAuthStore();
  
  // Get diagnosis data from navigation state or sessionStorage
  const getStoredDiagnosis = () => {
    try {
      const stored = sessionStorage.getItem('currentDiagnosis');
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  };
  
  const diagnosisData = location.state || getStoredDiagnosis();
  
  const [activeTab, setActiveTab] = useState('overview');
  const [treatmentPlan, setTreatmentPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [language, setLanguage] = useState('english');
  const [expandedStep, setExpandedStep] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(diagnosisData.isSaved || false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showDoctorsModal, setShowDoctorsModal] = useState(false);
  
  // Ref to track current audio element for Google TTS
  const currentAudioRef = useRef(null);

  // Google TTS - Same as Diagnose page
  const speakText = async (text) => {
    if (!text) {
      toast.error('No text to speak');
      return;
    }

    try {
      console.log('🔊 Requesting Google TTS for:', text.substring(0, 100) + '...');
      setIsSpeaking(true);

      // Detect if text contains Telugu characters
      const hasTeluguChars = /[\u0C00-\u0C7F]/.test(text);
      
      // Use Telugu voice only if text actually contains Telugu
      const langCode = (language === 'telugu' && hasTeluguChars) ? 'te-IN' : 'en-IN';
      
      console.log('🔊 Using voice:', langCode, '| Has Telugu chars:', hasTeluguChars);

      // Call backend TTS API
      const response = await api.post(
        '/api/tts/speak',
        { 
          text,
          language: langCode
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        // Convert base64 to audio blob
        const audioBase64 = response.data.audio;
        const byteCharacters = atob(audioBase64);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const audioBlob = new Blob([byteArray], { type: 'audio/mpeg' });
        const audioUrl = URL.createObjectURL(audioBlob);

        // Create and play audio
        const audio = new Audio(audioUrl);
        currentAudioRef.current = audio; // Store reference for stopping

        audio.onplay = () => {
          console.log('🔊 Google TTS started');
        };

        audio.onended = () => {
          console.log('🔊 Google TTS ended');
          setIsSpeaking(false);
          URL.revokeObjectURL(audioUrl);
          currentAudioRef.current = null;
        };

        audio.onerror = (error) => {
          console.error('❌ Audio playback error:', error);
          setIsSpeaking(false);
          toast.error('Failed to play audio');
          currentAudioRef.current = null;
        };

        await audio.play();
      }

    } catch (error) {
      console.error('❌ Google TTS Error:', error);
      setIsSpeaking(false);
      
      // Fallback to browser TTS if API fails
      console.log('⚠️ Falling back to browser TTS');
      fallbackBrowserTTS(text);
    }
  };

  // Fallback browser TTS
  const fallbackBrowserTTS = (text) => {
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language === 'telugu' ? 'te-IN' : 'en-IN';
    utterance.rate = 0.85;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  // Stop speaking
  const stopSpeaking = () => {
    console.log('🛑 Stopping speech...');
    
    // Stop Google TTS audio if playing
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current.currentTime = 0;
      currentAudioRef.current = null;
      console.log('🛑 Google TTS audio stopped');
    }
    
    // Stop browser TTS if speaking
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
      console.log('🛑 Browser TTS stopped');
    }
    
    setIsSpeaking(false);
  };

  // Text-to-Speech function - Click to toggle
  const speak = () => {
    console.log('🎤 Speak button clicked | Active tab:', activeTab, '| Language:', language);
    
    if (isSpeaking) {
      stopSpeaking();
      return;
    }

    const text = getCurrentTabText();
    console.log('🎤 Got text to speak:', text?.substring(0, 100), '| Length:', text?.length);
    
    // Show which tab is being read
    const tabName = activeTab === 'overview' ? 'Overview' : 
                    activeTab === 'tips' ? 'Tips (Do\'s/Don\'ts)' : 
                    activeTab === 'schedule' ? 'Treatment Schedule' : 'Monitoring';
    console.log(`📢 Reading "${tabName}" tab in ${language === 'telugu' ? 'Telugu' : 'English'}`);
    
    if (text) {
      speakText(text);
    } else {
      console.warn('⚠️ No text to speak!');
      toast.error('No text available to read');
    }
  };

  // Get text content based on current tab and language
  const getCurrentTabText = () => {
    if (!treatmentPlan) return '';
    
    switch (activeTab) {
      case 'overview':
        if (language === 'telugu') {
          // Build complete text: Overview + Do's + Don'ts + Prevention
          let text = `${treatmentPlan.overview.diseaseName_telugu}. ${treatmentPlan.overview.description_telugu}. `;
          
          // Add Do's
          const dos = (treatmentPlan.tips.dos_telugu?.length > 0) 
            ? treatmentPlan.tips.dos_telugu 
            : treatmentPlan.tips.dos || [];
          
          if (dos.length > 0) {
            text += 'చేయవలసినవి. ';
            dos.forEach((item, index) => {
              text += `${index + 1}. ${item}. `;
            });
          }
          
          // Add Don'ts
          const donts = (treatmentPlan.tips.donts_telugu?.length > 0)
            ? treatmentPlan.tips.donts_telugu
            : treatmentPlan.tips.donts || [];
          
          if (donts.length > 0) {
            text += 'చేయకూడనివి. ';
            donts.forEach((item, index) => {
              text += `${index + 1}. ${item}. `;
            });
          }
          
          // Add Prevention
          const prevention = treatmentPlan.tips.prevention_telugu || '';
          if (prevention) {
            text += `నివారణ చర్యలు. ${prevention}`;
          }
          
          console.log('🔊 Overview + Tips Telugu text length:', text.length);
          return text;
          
        } else {
          // English: Overview + Do's + Don'ts + Prevention
          let text = `${treatmentPlan.overview.diseaseName}. ${treatmentPlan.overview.description}. `;
          
          const dos = treatmentPlan.tips.dos || [];
          if (dos.length > 0) {
            text += "Do's. ";
            dos.forEach((item, index) => {
              text += `${index + 1}. ${item}. `;
            });
          }
          
          const donts = treatmentPlan.tips.donts || [];
          if (donts.length > 0) {
            text += " Don'ts. ";
            donts.forEach((item, index) => {
              text += `${index + 1}. ${item}. `;
            });
          }
          
          const prevention = treatmentPlan.tips.prevention || '';
          if (prevention) {
            text += ` Prevention Measures. ${prevention}`;
          }
          
          console.log('🔊 Overview + Tips English text length:', text.length);
          return text;
        }
      
      case 'tips':
        if (language === 'telugu') {
          // Use English if Telugu arrays are empty
          const dos = (treatmentPlan.tips.dos_telugu?.length > 0) 
            ? treatmentPlan.tips.dos_telugu 
            : treatmentPlan.tips.dos || [];
          const donts = (treatmentPlan.tips.donts_telugu?.length > 0)
            ? treatmentPlan.tips.donts_telugu
            : treatmentPlan.tips.donts || [];
          const prevention = treatmentPlan.tips.prevention_telugu || treatmentPlan.tips.prevention || '';
          
          console.log('🔊 Telugu voice - dos array:', dos.length, dos[0]?.substring(0, 50));
          console.log('🔊 Telugu voice - donts array:', donts.length, donts[0]?.substring(0, 50));
          console.log('🔊 Telugu voice - prevention:', prevention.substring(0, 50));
          
          // Build complete text with proper pauses
          let text = '';
          
          if (dos.length > 0) {
            text += 'చేయవలసినవి. ';
            dos.forEach((item, index) => {
              text += `${index + 1}. ${item}. `;
            });
            text += ' '; // Add space after section
          }
          
          if (donts.length > 0) {
            text += 'చేయకూడనివి. ';
            donts.forEach((item, index) => {
              text += `${index + 1}. ${item}. `;
            });
            text += ' '; // Add space after section
          }
          
          if (prevention) {
            text += `నివారణ చర్యలు. ${prevention}`;
          }
          
          console.log('🔊 Telugu tips text length:', text.length);
          console.log('🔊 Telugu tips sample:', text.substring(0, 100));
          return text;
          
        } else {
          const dos = treatmentPlan.tips.dos || [];
          const donts = treatmentPlan.tips.donts || [];
          const prevention = treatmentPlan.tips.prevention || '';
          
          let text = '';
          
          if (dos.length > 0) {
            text += "Do's. ";
            dos.forEach((item, index) => {
              text += `${index + 1}. ${item}. `;
            });
          }
          
          if (donts.length > 0) {
            text += " Don'ts. ";
            donts.forEach((item, index) => {
              text += `${index + 1}. ${item}. `;
            });
          }
          
          if (prevention) {
            text += ` Prevention Measures. ${prevention}`;
          }
          
          console.log('🔊 English tips text length:', text.length);
          return text;
        }
      
      case 'steps':
        const step = treatmentPlan.steps[expandedStep];
        if (language === 'telugu') {
          return `${step.title_telugu}. ${step.description_telugu}`;
        } else {
          return `${step.title}. ${step.description}`;
        }
      
      case 'progress':
        return language === 'telugu' 
          ? 'పురోగతి పట్టిక చూస్తున్నారు'
          : 'Viewing progress tracking';
      
      default:
        return '';
    }
  };

  useEffect(() => {
    // Priority 1: If viewing a saved treatment from database
    if (diagnosisData.savedTreatmentData) {
      console.log('📋 Loading saved treatment from database');
      setTreatmentPlan(diagnosisData.savedTreatmentData);
      setLoading(false);
      return;
    }

    // Priority 2: Check if treatment already generated for this scan
    const existingTreatment = sessionStorage.getItem('currentTreatment');
    const currentReportId = diagnosisData.reportId;
    const TREATMENT_VERSION = '2.0'; // Increment this to invalidate old cached treatments
    
    if (existingTreatment && currentReportId) {
      try {
        const parsed = JSON.parse(existingTreatment);
        // Check version and reportId match
        if (parsed.reportId === currentReportId && parsed.version === TREATMENT_VERSION) {
          console.log('♻️ Reusing existing treatment for this scan (v' + TREATMENT_VERSION + ')');
          setTreatmentPlan(parsed.treatment);
          setLoading(false);
          return;
        } else if (parsed.reportId === currentReportId) {
          console.log('🔄 Old treatment version detected, generating new treatment');
        }
      } catch (e) {
        console.error('Error parsing existing treatment:', e);
      }
    }

    // Priority 3: Generate new treatment (only for NEW scans)
    console.log('✨ Generating NEW treatment for fresh scan');
    generateDynamicTreatment();
  }, []);

  // Stop speech when tab changes
  useEffect(() => {
    stopSpeaking();
  }, [activeTab, language]);
  
  // Cleanup: Stop speech when leaving page
  useEffect(() => {
    return () => {
      console.log('🧹 Cleaning up - stopping all speech');
      // Stop Google TTS audio
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
        currentAudioRef.current = null;
      }
      // Stop browser TTS
      if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const generateDynamicTreatment = async () => {
    try {
      setLoading(true);
      
      // Validate required data
      if (!diagnosisData.disease || !diagnosisData.crop) {
        console.error('Missing required data:', diagnosisData);
        toast.error('No diagnosis data found. Redirecting to scan page...');
        setTimeout(() => navigate('/diagnose'), 2000);
        return;
      }
      
      console.log('Generating treatment for:', {
        disease: diagnosisData.disease,
        crop: diagnosisData.crop,
        severity: diagnosisData.severity
      });
      
      // Call backend API for dynamic AI-generated treatment
      const response = await api.post('/api/treatment', {
        disease: diagnosisData.disease,
        crop: diagnosisData.crop,
        severity: diagnosisData.severity || 'moderate',
        language: 'en',
        preferences: []
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const aiTreatment = response.data;
      
      console.log('🤖 Raw Gemini Response:', {
        hasDos: !!aiTreatment.dos,
        hasDonts: !!aiTreatment.donts,
        hasPrecautions: !!aiTreatment.precautions,
        hasPreventiveMeasures: !!aiTreatment.preventiveMeasures,
        dosSample: aiTreatment.dos?.[0]?.substring(0, 100),
        dontsSample: aiTreatment.donts?.[0]?.substring(0, 100),
        preventiveMeasuresSample: aiTreatment.preventiveMeasures?.[0]?.substring(0, 100),
        keys: Object.keys(aiTreatment)
      });
      
      console.log('🔧 Processing bilingual text...');
      
      // Transform AI response into our UI format
      const steps = [];
      
      // Step 1: Immediate Action
      steps.push({
        id: 1,
        title: 'Immediate Action',
        title_telugu: 'తక్షణ చర్య',
        description: 'Isolate affected plants immediately to prevent spread. Remove severely infected parts.',
        description_telugu: 'వ్యాప్తిని నివారించడానికి వెంటనే ప్రభావిత మొక్కలను వేరు చేయండి. తీవ్రంగా సోకిన భాగాలను తొలగించండి.',
        duration: '1 hour',
        priority: 'high'
      });

      // Step 2: Organic Treatment (if available)
      if (aiTreatment.organic && aiTreatment.organic.length > 0) {
        // Use AI-provided Telugu translations
        const organicDesc = aiTreatment.organic.map(t => 
          `${t.method}: ${t.description} (${t.frequency}, ${t.duration})`
        ).join('\n\n');
        
        const organicDescTelugu = aiTreatment.organic.map(t => 
          `${t.method_telugu || t.method}: ${t.description_telugu || t.description}`
        ).join('\n\n');
        
        steps.push({
          id: 2,
          title: 'Organic Treatment',
          title_telugu: 'సేంద్రీయ చికిత్స',
          description: organicDesc,
          description_telugu: organicDescTelugu,
          duration: aiTreatment.organic[0].duration || '2-3 weeks',
          priority: 'high',
          organicMethods: aiTreatment.organic
        });
      }

      // Step 3: Chemical Treatment (if needed)
      if (aiTreatment.chemical && aiTreatment.chemical.length > 0) {
        const chemicalDesc = aiTreatment.chemical.map(t => 
          `⚠️ ${t.name}\nDosage: ${t.dosage}\nMethod: ${t.applicationMethod}\nWaiting Period: ${t.waitingPeriod}\nPPE Required: ${t.ppe.join(', ')}`
        ).join('\n\n');
        
        const chemicalDescTelugu = aiTreatment.chemical.map(t => 
          `⚠️ ${t.name_telugu || t.name}\nడోసేజ్: ${t.dosage_telugu || t.dosage}\nవిధానం: ${t.applicationMethod_telugu || t.applicationMethod}`
        ).join('\n\n');
        
        steps.push({
          id: 3,
          title: 'Chemical Treatment (Consult Expert First)',
          title_telugu: 'రసాయన చికిత్స (మొదట నిపుణుడిని సంప్రదించండి)',
          description: chemicalDesc,
          description_telugu: chemicalDescTelugu,
          duration: '1-2 weeks',
          priority: 'medium',
          chemicalOptions: aiTreatment.chemical
        });
      }

      // Step 4: Monitoring
      steps.push({
        id: 4,
        title: 'Monitor Progress',
        title_telugu: 'పురోగతిని పర్యవేక్షించండి',
        description: (aiTreatment.monitoringTips || []).join('\n'),
        description_telugu: (aiTreatment.monitoringTips_telugu || aiTreatment.monitoringTips || ['రోజువారీ మొక్కలను తనిఖీ చేయండి మరియు పురోగతిని రికార్డ్ చేయండి']).join('\n'),
        duration: 'Daily for 14-21 days',
        priority: 'medium'
      });

      // Step 5: Prevention
      steps.push({
        id: 5,
        title: 'Preventive Measures',
        title_telugu: 'నివారణ చర్యలు',
        description: (aiTreatment.preventiveMeasures || []).join('\n'),
        description_telugu: diagnosisData.prevention_telugu || 'భవిష్యత్ సంక్రమణను నివారించడానికి నివారణ చర్యలను అనుసరించండి',
        duration: 'Ongoing',
        priority: 'low'
      });

      // Generate schedule
      const today = new Date();
      const schedule = [
        {
          day: 1,
          date: new Date(today),
          tasks: ['Initial treatment application', 'Remove affected leaves', 'Isolate infected plants'],
          status: 'pending'
        },
        {
          day: 3,
          date: new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000),
          tasks: ['Second treatment application', 'Check for improvement', 'Water management'],
          status: 'pending'
        },
        {
          day: 7,
          date: new Date(today.getTime() + 6 * 24 * 60 * 60 * 1000),
          tasks: ['Mid-treatment assessment', 'Adjust treatment if needed', 'Document progress'],
          status: 'pending'
        },
        {
          day: 14,
          date: new Date(today.getTime() + 13 * 24 * 60 * 60 * 1000),
          tasks: ['Final assessment', 'Continue prevention', 'Resume normal care'],
          status: 'pending'
        }
      ];

      // Generate monitoring checkpoints
      const monitoring = {
        checkpoints: [
          { day: 1, check: 'Initial symptoms documented', status: 'pending' },
          { day: 3, check: 'Symptom progression slowed', status: 'pending' },
          { day: 7, check: 'Visible improvement in plant health', status: 'pending' },
          { day: 14, check: 'Full recovery achieved', status: 'pending' }
        ],
        expectedProgress: [
          { stage: 'Days 1-3', description: 'Symptoms stabilize, no new spread', progress: 25 },
          { stage: 'Days 4-7', description: 'Symptom reduction begins, new growth appears', progress: 50 },
          { stage: 'Days 8-14', description: 'Significant improvement, healthy growth', progress: 75 },
          { stage: 'Days 14+', description: 'Full recovery, preventive care only', progress: 100 }
        ]
      };

      const plan = {
        overview: {
          diseaseName: diagnosisData.disease || 'Plant Disease',
          diseaseName_telugu: diagnosisData.disease_telugu || 'మొక్క వ్యాధి',
          cropType: diagnosisData.crop || 'Crop',
          severity: diagnosisData.severity || 'moderate',
          confidence: diagnosisData.confidence || 0,
          duration: aiTreatment.duration || '14-21 days',
          estimatedCost: aiTreatment.estimatedCost || '₹800-1500',
          description: diagnosisData.description || 'Treatment plan based on AI diagnosis',
          description_telugu: diagnosisData.description_telugu || 'AI నిర్ధారణ ఆధారంగా చికిత్స ప్రణాళిక'
        },
        steps: steps,
        schedule: schedule,
        monitoring: monitoring,
        tips: {
          // Extract ONLY English - handle multiple formats
          dos: (aiTreatment.dos || []).map(item => {
            console.log('🔍 Processing dos item:', item);
            
            // NEW FORMAT: "తెలుగు / English" - split by "/" and take English part
            if (item.includes(' / ')) {
              const parts = item.split(' / ');
              console.log('  Split by /:', parts);
              // Find the part WITHOUT Telugu characters (English)
              const englishPart = parts.find(p => !/[\u0C00-\u0C7F]/.test(p));
              if (englishPart && englishPart.trim().length > 3) {
                console.log('  ✅ English part:', englishPart.trim());
                return englishPart.trim();
              }
            }
            
            // Old format: Remove parentheses with Telugu
            let cleaned = item.replace(/\s*\([^)]*[\u0C00-\u0C7F][^)]*\)\s*/g, '');
            cleaned = cleaned.split(' - ')[0];
            
            // If cleaned text has NO Telugu, return it (English)
            if (!/[\u0C00-\u0C7F]/.test(cleaned) && cleaned.trim().length > 3) {
              console.log('  ✅ Cleaned English:', cleaned.trim());
              return cleaned.trim();
            }
            
            console.log('  ❌ No English found');
            return '';
          }).filter(item => item && item.length > 3),
          
          // Extract ONLY Telugu - handle multiple formats
          dos_telugu: (aiTreatment.dos_telugu?.length > 0) 
            ? aiTreatment.dos_telugu 
            : (aiTreatment.dos || []).map(item => {
                // NEW FORMAT: "తెలుగు / English" - split by "/" and take Telugu part
                if (item.includes(' / ')) {
                  const parts = item.split(' / ');
                  // Find the part WITH Telugu characters
                  const teluguPart = parts.find(p => /[\u0C00-\u0C7F]/.test(p));
                  if (teluguPart && teluguPart.trim().length > 3) return teluguPart.trim();
                }
                
                // Old format: Extract from parentheses (తెలుగు)
                const parenMatch = item.match(/\(([^)]*[\u0C00-\u0C7F][^)]*)\)/);
                if (parenMatch) return parenMatch[1].trim();
                
                // Extract from " - తెలుగు" pattern
                if (item.includes(' - ')) {
                  const parts = item.split(' - ');
                  const teluguPart = parts.find(p => /[\u0C00-\u0C7F]/.test(p));
                  if (teluguPart) return teluguPart.trim();
                }
                
                // If item has Telugu only, return it
                if (/[\u0C00-\u0C7F]/.test(item) && !item.match(/[A-Za-z]{3,}/)) return item.trim();
                return '';
              }).filter(item => item && item.length > 3),
          
          // Extract ONLY English from donts - handle multiple formats
          donts: (aiTreatment.donts || []).map(item => {
            // NEW FORMAT: "తెలుగు / English"
            if (item.includes(' / ')) {
              const parts = item.split(' / ');
              const englishPart = parts.find(p => !/[\u0C00-\u0C7F]/.test(p));
              if (englishPart && englishPart.trim().length > 3) return englishPart.trim();
            }
            
            // Old format
            let cleaned = item.replace(/\s*\([^)]*[\u0C00-\u0C7F][^)]*\)\s*/g, '');
            cleaned = cleaned.split(' - ')[0];
            
            if (!/[\u0C00-\u0C7F]/.test(cleaned) && cleaned.trim().length > 3) return cleaned.trim();
            return '';
          }).filter(item => item && item.length > 3),
          
          // Extract ONLY Telugu from donts - handle multiple formats
          donts_telugu: (aiTreatment.donts_telugu?.length > 0)
            ? aiTreatment.donts_telugu
            : (aiTreatment.donts || []).map(item => {
                // NEW FORMAT: "తెలుగు / English"
                if (item.includes(' / ')) {
                  const parts = item.split(' / ');
                  const teluguPart = parts.find(p => /[\u0C00-\u0C7F]/.test(p));
                  if (teluguPart && teluguPart.trim().length > 3) return teluguPart.trim();
                }
                
                // Old formats
                const parenMatch = item.match(/\(([^)]*[\u0C00-\u0C7F][^)]*)\)/);
                if (parenMatch) return parenMatch[1].trim();
                
                if (item.includes(' - ')) {
                  const parts = item.split(' - ');
                  const teluguPart = parts.find(p => /[\u0C00-\u0C7F]/.test(p));
                  if (teluguPart) return teluguPart.trim();
                }
                
                if (/[\u0C00-\u0C7F]/.test(item) && !item.match(/[A-Za-z]{3,}/)) return item.trim();
                return '';
              }).filter(item => item && item.length > 3),
          // Extract ONLY English from prevention - handle multiple formats
          prevention: aiTreatment.preventiveMeasures 
            ? aiTreatment.preventiveMeasures.map(item => {
                // NEW FORMAT: "తెలుగు / English"
                if (item.includes(' / ')) {
                  const parts = item.split(' / ');
                  const englishPart = parts.find(p => !/[\u0C00-\u0C7F]/.test(p));
                  if (englishPart && englishPart.trim().length > 3) return englishPart.trim();
                }
                
                // Old format: Remove Telugu in parentheses and after dash
                let cleaned = item.replace(/\s*\([^)]*[\u0C00-\u0C7F][^)]*\)\s*/g, '');
                cleaned = cleaned.split(' - ')[0];
                cleaned = cleaned.replace(/\.{2,}/g, '.').trim();
                
                if (!/[\u0C00-\u0C7F]/.test(cleaned) && cleaned.length > 3) return cleaned;
                return '';
              }).filter(item => item.length > 3).join(' ') 
            : 'Regular monitoring and proper care',
          
          // Extract ONLY Telugu from prevention - handle multiple formats
          prevention_telugu: aiTreatment.preventiveMeasures_telugu?.length > 0
            ? aiTreatment.preventiveMeasures_telugu.join('. ')
            : (aiTreatment.preventiveMeasures 
              ? aiTreatment.preventiveMeasures.map(item => {
                  // NEW FORMAT: "తెలుగు / English"
                  if (item.includes(' / ')) {
                    const parts = item.split(' / ');
                    const teluguPart = parts.find(p => /[\u0C00-\u0C7F]/.test(p));
                    if (teluguPart && teluguPart.trim().length > 3) return teluguPart.trim();
                  }
                  
                  // Old format: Extract from parentheses
                  const parenMatch = item.match(/\(([^)]*[\u0C00-\u0C7F][^)]*)\)/);
                  if (parenMatch) return parenMatch[1].trim();
                  
                  // Extract from " - తెలుగు" pattern
                  if (item.includes(' - ')) {
                    const parts = item.split(' - ');
                    const teluguPart = parts.find(p => /[\u0C00-\u0C7F]/.test(p));
                    if (teluguPart) return teluguPart.trim();
                  }
                  
                  // If has Telugu only, return it
                  if (/[\u0C00-\u0C7F]/.test(item) && !item.match(/[A-Za-z]{3,}/)) return item.trim();
                  return '';
                }).filter(item => item.length > 3).join('. ')
              : (diagnosisData.prevention_telugu || 'క్రమ పర్యవేక్షణ మరియు సరైన సంరక్షణ'))
        },
        disclaimer: aiTreatment.disclaimer
      };
      
      console.log('✅ Extracted tips:', {
        rawDos: aiTreatment.dos?.length || 0,
        rawDonts: aiTreatment.donts?.length || 0,
        dosEnglishCount: plan.tips.dos.length,
        dosTeluguCount: plan.tips.dos_telugu.length,
        dontsEnglishCount: plan.tips.donts.length,
        dontsTeluguCount: plan.tips.donts_telugu.length,
        dosEnglishSample: plan.tips.dos[0],
        dosTeluguSample: plan.tips.dos_telugu[0],
        dontsEnglishSample: plan.tips.donts[0],
        dontsTeluguSample: plan.tips.donts_telugu[0],
        rawDosSample: aiTreatment.dos?.[0]
      });
      
      // Save generated treatment to sessionStorage for this scan
      if (diagnosisData.reportId) {
        try {
          const TREATMENT_VERSION = '2.0'; // Must match version in useEffect
          sessionStorage.setItem('currentTreatment', JSON.stringify({
            reportId: diagnosisData.reportId,
            treatment: plan,
            version: TREATMENT_VERSION,
            timestamp: new Date().toISOString()
          }));
          console.log('💾 Treatment saved to sessionStorage (v' + TREATMENT_VERSION + ') for reportId:', diagnosisData.reportId);
        } catch (e) {
          console.error('Error saving treatment to sessionStorage:', e);
        }
      }
      
      setTreatmentPlan(plan);
      setLoading(false);
    } catch (error) {
      console.error('Error generating dynamic treatment:', error);
      toast.error('Failed to generate treatment plan');
      // Fallback to basic treatment if API fails
      generateFallbackTreatment();
    }
  };

  const generateFallbackTreatment = () => {
    // Fallback treatment if API fails
    const treatment = diagnosisData.treatment || '';
    const treatment_telugu = diagnosisData.treatment_telugu || '';
    
    const treatmentLines = treatment.split('\n').filter(line => line.trim());
    const steps = [];
    
    steps.push({
      id: 1,
      title: 'Immediate Action',
      title_telugu: 'తక్షణ చర్య',
      description: treatmentLines[0] || 'Isolate affected plants immediately',
      description_telugu: treatment_telugu.split('\n')[0] || 'వెంటనే ప్రభావిత మొక్కలను వేరు చేయండి',
      duration: '1 hour',
      priority: 'high'
    });

    steps.push({
      id: 2,
      title: 'Apply Treatment',
      title_telugu: 'చికిత్స వర్తించండి',
      description: treatmentLines[1] || diagnosisData.treatment || 'Follow recommended treatment protocol',
      description_telugu: treatment_telugu.split('\n')[1] || treatment_telugu || 'సిফారసు చేసిన చికిత్స విధానాన్ని అనుసరించండి',
      duration: '2-3 hours',
      priority: 'high'
    });

    steps.push({
      id: 3,
      title: 'Monitor Progress',
      title_telugu: 'పురోగతిని పర్యవేక్షించండి',
      description: 'Check plants daily for improvement. Look for reduced symptoms and new healthy growth.',
      description_telugu: 'మెరుగుదల కోసం రోజువారీ మొక్కలను తనిఖీ చేయండి.',
      duration: 'Daily for 14 days',
      priority: 'medium'
    });

    steps.push({
      id: 4,
      title: 'Preventive Measures',
      title_telugu: 'నివారణ చర్యలు',
      description: diagnosisData.prevention || 'Maintain proper spacing, ensure good air circulation, and practice crop rotation.',
      description_telugu: diagnosisData.prevention_telugu || 'సరైన అంతరం నిర్వహించండి.',
      duration: 'Ongoing',
      priority: 'medium'
    });

    // Generate schedule
    const today = new Date();
    const schedule = [
      {
        day: 1,
        date: new Date(today),
        tasks: ['Initial treatment application', 'Remove affected leaves', 'Isolate infected plants'],
        status: 'pending'
      },
      {
        day: 3,
        date: new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000),
        tasks: ['Second treatment application', 'Check for improvement', 'Water management'],
        status: 'pending'
      },
      {
        day: 7,
        date: new Date(today.getTime() + 6 * 24 * 60 * 60 * 1000),
        tasks: ['Mid-treatment assessment', 'Adjust treatment if needed', 'Document progress'],
        status: 'pending'
      },
      {
        day: 14,
        date: new Date(today.getTime() + 13 * 24 * 60 * 60 * 1000),
        tasks: ['Final assessment', 'Continue prevention', 'Resume normal care'],
        status: 'pending'
      }
    ];

    // Generate monitoring checkpoints
    const monitoring = {
      checkpoints: [
        { day: 1, check: 'Initial symptoms documented', status: 'pending' },
        { day: 3, check: 'Symptom progression slowed', status: 'pending' },
        { day: 7, check: 'Visible improvement in plant health', status: 'pending' },
        { day: 14, check: 'Full recovery achieved', status: 'pending' }
      ],
      expectedProgress: [
        { stage: 'Days 1-3', description: 'Symptoms stabilize, no new spread', progress: 25 },
        { stage: 'Days 4-7', description: 'Symptom reduction begins, new growth appears', progress: 50 },
        { stage: 'Days 8-14', description: 'Significant improvement, healthy growth', progress: 75 },
        { stage: 'Days 14+', description: 'Full recovery, preventive care only', progress: 100 }
      ]
    };

    const plan = {
      overview: {
        diseaseName: diagnosisData.disease || 'Plant Disease',
        diseaseName_telugu: diagnosisData.disease_telugu || 'మొక్క వ్యాధి',
        cropType: diagnosisData.crop || 'Crop',
        severity: diagnosisData.severity || 'moderate',
        confidence: diagnosisData.confidence || 0,
        duration: '14-21 days',
        estimatedCost: '₹800-1500',
        description: diagnosisData.description || 'Treatment plan based on AI diagnosis',
        description_telugu: diagnosisData.description_telugu || 'AI నిర్ధారణ ఆధారంగా చికిత్స ప్రణాళిక'
      },
      steps: steps,
      schedule: schedule,
      monitoring: monitoring,
      tips: {
        dos: [
          'Apply treatment during early morning or late evening',
          'Maintain consistent watering schedule',
          'Monitor surrounding plants for spread',
          'Document progress with photos',
          'Ensure good air circulation'
        ],
        dos_telugu: [
          'ఉదయం లేదా సాయంత్రం సమయంలో చికిత్స వర్తించండి',
          'స్థిరమైన నీటి పెట్టడం షెడ్యూల్ నిర్వహించండి',
          'వ్యాప్తి కోసం చుట్టుపక్కల మొక్కలను పర్యవేక్షించండి',
          'ఫోటోలతో పురోగతిని డాక్యుమెంట్ చేయండి',
          'మంచి గాలి ప్రసరణను నిర్ధారించండి'
        ],
        donts: [
          'Do not overwater during treatment',
          'Avoid chemical pesticides unless necessary',
          'Do not ignore spreading symptoms',
          'Avoid working with plants when wet',
          'Do not dispose infected material near healthy plants'
        ],
        donts_telugu: [
          'చికిత్స సమయంలో అధికంగా నీరు పెట్టకండి',
          'అవసరం లేకుండా రసాయన పురుగుమందులను నివారించండి',
          'వ్యాప్తి చెందుతున్న లక్షణాలను విస్మరించకండి',
          'తడిగా ఉన్నప్పుడు మొక్కలతో పని చేయకండి',
          'ఆరోగ్యకరమైన మొక్కల దగ్గర సోకిన పదార్థాన్ని పారవేయకండి'
        ],
        prevention: diagnosisData.prevention || 'Regular monitoring and proper care',
        prevention_telugu: diagnosisData.prevention_telugu || 'క్రమ పర్యవేక్షణ మరియు సరైన సంరక్షణ'
      }
    };
    
    setTreatmentPlan(plan);
    setLoading(false);
  };

  const saveTreatmentPlan = async () => {
    if (isSaved) {
      toast.success('Treatment plan already saved!');
      return;
    }

    setIsSaving(true);
    try {
      const response = await api.post('/api/treatment/save', {
        reportId: diagnosisData.reportId || null,
        fieldId: diagnosisData.fieldId || null,
        cropType: diagnosisData.crop || treatmentPlan.overview.cropType,
        disease: diagnosisData.disease || treatmentPlan.overview.diseaseName,
        severity: diagnosisData.severity || treatmentPlan.overview.severity,
        treatmentData: treatmentPlan
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setIsSaved(true);
        toast.success('Treatment plan saved successfully! ✅');
      }
    } catch (error) {
      console.error('Save treatment error:', error);
      if (error.response?.status !== 401) {
        toast.error('Failed to save treatment plan');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'high':
      case 'critical':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'moderate':
      case 'medium':
        return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'low':
      case 'mild':
        return 'bg-green-100 text-green-700 border-green-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'bg-red-500';
      case 'medium':
        return 'bg-orange-500';
      case 'low':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="animate-spin h-12 w-12 text-green-600" />
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview', label_telugu: 'సమీక్ష' },
    { id: 'steps', label: 'Steps', label_telugu: 'దశలు' },
    { id: 'schedule', label: 'Schedule', label_telugu: 'షెడ్యూల్' },
    { id: 'progress', label: 'Progress', label_telugu: 'పురోగతి' }
  ];

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-white via-green-50 to-green-100 pb-20">
      {/* Glowing effect overlay */}
      <div className="absolute inset-0 bg-gradient-radial from-green-200/20 via-transparent to-transparent pointer-events-none" style={{backgroundImage: 'radial-gradient(circle at 50% 80%, rgba(134, 239, 172, 0.15) 0%, transparent 60%)'}}></div>
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white sticky top-0 z-20">
        <div className="px-4 py-3 flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 hover:bg-green-700 rounded-full">
            <ChevronLeft size={24} />
          </button>
          <h1 className="text-lg font-semibold">Treatment Plan</h1>
          <div className="flex items-center gap-2">
            <button 
              onClick={speak}
              className={`p-2 hover:bg-green-700 rounded-full transition-colors ${
                isSpeaking ? 'bg-green-700 animate-pulse' : ''
              }`}
              title={isSpeaking ? 'Stop speaking' : 'Read aloud'}
            >
              {isSpeaking ? <VolumeX size={20} /> : <Volume2 size={20} />}
            </button>
            <button 
              onClick={() => setLanguage(language === 'english' ? 'telugu' : 'english')} 
              className="p-2 hover:bg-green-700 rounded-full"
              title={`Switch to ${language === 'english' ? 'Telugu' : 'English'}`}
            >
              <Globe size={20} />
            </button>
            <button
              onClick={saveTreatmentPlan}
              disabled={isSaving || isSaved}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-medium text-sm transition-all ${
                isSaved 
                  ? 'bg-white text-green-600' 
                  : 'bg-white bg-opacity-20 hover:bg-opacity-30'
              }`}
            >
              {isSaving ? (
                <>
                  <Loader2 className="animate-spin" size={16} />
                  Saving...
                </>
              ) : isSaved ? (
                <>
                  <Check size={16} />
                  Saved
                </>
              ) : (
                <>
                  <Save size={16} />
                  Save
                </>
              )}
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-t border-green-500">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'text-white border-b-2 border-white'
                  : 'text-green-100'
              }`}
            >
              {language === 'telugu' ? tab.label_telugu : tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* View Saved Plans Button */}
      <div className="px-4 pt-4">
        <button
          onClick={() => navigate('/saved-treatments')}
          className="w-full flex items-center justify-center gap-2 bg-white text-green-600 border-2 border-green-600 py-2.5 rounded-xl font-semibold hover:bg-green-50 transition-all"
        >
          <List size={20} />
          View Saved Treatment Plans
        </button>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="p-4 space-y-4">
          {/* Disease Info Card */}
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <AlertTriangle className="text-red-600" size={24} />
              </div>
              <div className="flex-1">
                <h2 className="font-semibold text-gray-900 text-lg">
                  {language === 'telugu' ? treatmentPlan.overview.diseaseName_telugu : treatmentPlan.overview.diseaseName}
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  {treatmentPlan.overview.cropType} • {treatmentPlan.overview.confidence}% Confidence
                </p>
              </div>
              <div className={`px-3 py-1 rounded-full text-xs font-semibold ${getSeverityColor(treatmentPlan.overview.severity)}`}>
                {treatmentPlan.overview.severity.toUpperCase()}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <Clock className="text-gray-600" size={18} />
                <div>
                  <p className="text-xs text-gray-600">Duration</p>
                  <p className="font-semibold text-gray-900">{treatmentPlan.overview.duration}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <ShoppingCart className="text-gray-600" size={18} />
                <div>
                  <p className="text-xs text-gray-600">Est. Cost</p>
                  <p className="font-semibold text-gray-900">{treatmentPlan.overview.estimatedCost}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <BookOpen className="text-blue-600 mt-0.5" size={20} />
              <div>
                <h3 className="font-semibold text-blue-900 mb-2">
                  {language === 'telugu' ? 'వ్యాధి వివరణ' : 'Disease Description'}
                </h3>
                <p className="text-sm text-blue-800 leading-relaxed">
                  {language === 'telugu' ? treatmentPlan.overview.description_telugu : treatmentPlan.overview.description}
                </p>
              </div>
            </div>
          </div>

          {/* Do's */}
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <CheckCircle2 className="text-green-600" size={20} />
              {language === 'telugu' ? "చేయవలసినవి" : "Do's"}
            </h3>
            {(() => {
              const dosArray = (language === 'telugu' && treatmentPlan.tips.dos_telugu?.length > 0) 
                ? treatmentPlan.tips.dos_telugu 
                : treatmentPlan.tips.dos || [];
              
              return dosArray.length > 0 ? (
                <ul className="space-y-2">
                  {dosArray.map((item, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <CheckCircle2 className="text-green-500 mt-0.5 flex-shrink-0" size={16} />
                      <span className="text-sm text-gray-700">{item}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-500 italic">
                  {language === 'telugu' ? 'సమాచారం అందుబాటులో లేదు' : 'No recommendations available'}
                </p>
              );
            })()}
          </div>

          {/* Don'ts */}
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <AlertCircle className="text-red-600" size={20} />
              {language === 'telugu' ? "చేయకూడనివి" : "Don'ts"}
            </h3>
            {(() => {
              const dontsArray = (language === 'telugu' && treatmentPlan.tips.donts_telugu?.length > 0)
                ? treatmentPlan.tips.donts_telugu 
                : treatmentPlan.tips.donts || [];
              
              return dontsArray.length > 0 ? (
                <ul className="space-y-2">
                  {dontsArray.map((item, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <AlertCircle className="text-red-500 mt-0.5 flex-shrink-0" size={16} />
                      <span className="text-sm text-gray-700">{item}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-500 italic">
                  {language === 'telugu' ? 'సమాచారం అందుబాటులో లేదు' : 'No precautions available'}
                </p>
              );
            })()}
          </div>

          {/* Prevention */}
          <div className="bg-green-50 border border-green-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <Leaf className="text-green-600 mt-0.5" size={20} />
              <div>
                <h3 className="font-semibold text-green-900 mb-2">
                  {language === 'telugu' ? 'నివారణ చర్యలు' : 'Prevention Measures'}
                </h3>
                <p className="text-sm text-green-800 leading-relaxed">
                  {language === 'telugu' ? treatmentPlan.tips.prevention_telugu : treatmentPlan.tips.prevention}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Steps Tab */}
      {activeTab === 'steps' && (
        <div className="p-4 space-y-3">
          {treatmentPlan.steps.map((step, index) => (
            <div key={step.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
              <button
                onClick={() => setExpandedStep(expandedStep === index ? -1 : index)}
                className="w-full p-4 flex items-center gap-3 text-left"
              >
                <div className={`w-8 h-8 rounded-full ${getPriorityColor(step.priority)} flex items-center justify-center text-white font-semibold text-sm`}>
                  {step.id}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">
                    {language === 'telugu' ? step.title_telugu : step.title}
                  </h3>
                  <p className="text-xs text-gray-500">{step.duration}</p>
                </div>
                {expandedStep === index ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </button>
              
              {expandedStep === index && (
                <div className="px-4 pb-4 pt-2 border-t border-gray-100">
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {language === 'telugu' ? step.description_telugu : step.description}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Schedule Tab */}
      {activeTab === 'schedule' && (
        <div className="p-4 space-y-3">
          {console.log('📅 Schedule data:', treatmentPlan.schedule)}
          {(!treatmentPlan.schedule || treatmentPlan.schedule.length === 0) ? (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
              <p className="text-yellow-800 text-center">
                {language === 'telugu' ? 'షెడ్యూల్ డేటా అందుబాటులో లేదు' : 'Schedule data not available'}
              </p>
            </div>
          ) : (
            treatmentPlan.schedule.map((item) => {
              // Handle date conversion - it might be a Date object or string
              let dateDisplay = '';
              try {
                const dateObj = item.date instanceof Date ? item.date : new Date(item.date);
                if (!isNaN(dateObj.getTime())) {
                  dateDisplay = dateObj.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' });
                } else {
                  dateDisplay = item.date?.toString() || '';
                }
              } catch (e) {
                dateDisplay = item.date?.toString() || '';
              }
              
              return (
                <div key={item.day} className="bg-white rounded-xl p-4 shadow-sm">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                      <Calendar className="text-green-600" size={20} />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">
                        {language === 'telugu' ? `దిన ${item.day}` : `Day ${item.day}`}
                      </h3>
                      {dateDisplay && (
                        <p className="text-xs text-gray-500">
                          {dateDisplay}
                        </p>
                      )}
                    </div>
                    <div className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      item.status === 'completed' ? 'bg-green-100 text-green-700' :
                      item.status === 'in-progress' ? 'bg-blue-100 text-blue-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {item.status === 'completed' ? '✓ Done' : item.status === 'in-progress' ? 'In Progress' : 'Pending'}
                    </div>
                  </div>
                  
                  <ul className="space-y-2">
                    {item.tasks && item.tasks.map((task, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <CheckCircle2 className="text-gray-400 mt-0.5 flex-shrink-0" size={16} />
                        <span className="text-sm text-gray-700">{task}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Progress Tab */}
      {activeTab === 'progress' && (
        <div className="p-4 space-y-4">
          {/* Expected Progress Timeline */}
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <TrendingUp className="text-green-600" size={20} />
              {language === 'telugu' ? 'ఆశించిన పురోగతి' : 'Expected Progress'}
            </h3>
            <div className="space-y-4">
              {treatmentPlan.monitoring.expectedProgress.map((stage, index) => (
                <div key={index}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-900">{stage.stage}</span>
                    <span className="text-sm text-gray-600">{stage.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${stage.progress}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-600">{stage.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Monitoring Checkpoints */}
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <CheckCircle2 className="text-blue-600" size={20} />
              {language === 'telugu' ? 'పర్యవేక్షణ చెక్‌పాయింట్లు' : 'Monitoring Checkpoints'}
            </h3>
            <div className="space-y-3">
              {treatmentPlan.monitoring.checkpoints.map((checkpoint, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                    checkpoint.status === 'completed' ? 'bg-green-500 text-white' :
                    checkpoint.status === 'in-progress' ? 'bg-blue-500 text-white' :
                    'bg-gray-200 text-gray-600'
                  }`}>
                    {checkpoint.status === 'completed' ? '✓' : checkpoint.day}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{checkpoint.check}</p>
                    <p className="text-xs text-gray-500">
                      {language === 'telugu' ? `దిన ${checkpoint.day}` : `Day ${checkpoint.day}`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Environmental Conditions */}
          <div className="bg-gradient-to-br from-blue-50 to-green-50 rounded-xl p-4">
            <h3 className="font-semibold text-gray-900 mb-3">
              {language === 'telugu' ? 'సరైన పరిస్థితులు' : 'Ideal Conditions'}
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Droplets className="text-blue-600" size={16} />
                  <span className="text-xs text-gray-600">Humidity</span>
                </div>
                <p className="text-sm font-semibold text-gray-900">60-70%</p>
              </div>
              <div className="bg-white rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <ThermometerSun className="text-orange-600" size={16} />
                  <span className="text-xs text-gray-600">Temperature</span>
                </div>
                <p className="text-sm font-semibold text-gray-900">20-25°C</p>
              </div>
              <div className="bg-white rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Sun className="text-yellow-600" size={16} />
                  <span className="text-xs text-gray-600">Sunlight</span>
                </div>
                <p className="text-sm font-semibold text-gray-900">6-8 hours</p>
              </div>
              <div className="bg-white rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Droplets className="text-green-600" size={16} />
                  <span className="text-xs text-gray-600">Watering</span>
                </div>
                <p className="text-sm font-semibold text-gray-900">2x per day</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating Pest Doctor Button */}
      <div className="fixed bottom-0 left-0 right-0 pointer-events-none z-[60] flex justify-center">
        <div className="w-full max-w-mobile relative pointer-events-none">
          <button
            onClick={() => setShowDoctorsModal(true)}
            className="absolute bottom-24 right-4 bg-green-600 hover:bg-green-700 text-white p-3 rounded-full shadow-xl transition-all active:scale-95 pointer-events-auto"
            title="Contact Pest Doctor"
          >
            <Stethoscope size={20} />
          </button>
        </div>
      </div>

      {/* Pest Doctors Modal */}
      {showDoctorsModal && (
        <div className="absolute inset-0 bg-black/50 z-50 flex items-start justify-center pt-16 p-4">
          <div className="bg-white rounded-xl w-full max-h-[85vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Stethoscope size={24} />
                <div>
                  <h2 className="text-lg font-bold">Pest Control Experts</h2>
                  <p className="text-sm opacity-90">Trusted Services in Andhra Pradesh</p>
                </div>
              </div>
              <button
                onClick={() => setShowDoctorsModal(false)}
                className="p-2 hover:bg-white/20 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="overflow-y-auto p-4 space-y-4">
              {/* Sri Rama Pest Control Services */}
              <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-bold text-gray-900">Sri Rama Pest Control Services</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex items-center gap-1 text-yellow-500">
                        <Star size={14} fill="currentColor" />
                        <span className="text-sm font-semibold">4.8</span>
                      </div>
                      <span className="text-xs text-gray-500">(5 Ratings)</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-2 mb-3">
                  <div className="flex items-start gap-2 text-sm text-gray-600">
                    <MapPin size={16} className="flex-shrink-0 mt-0.5 text-green-600" />
                    <span>4th Street Railpeta Repale, Repalle</span>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <span className="px-2 py-1 bg-green-50 text-green-700 text-xs rounded-full">All Crops</span>
                    <span className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full">24 Hours</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <a
                    href="tel:+919876543210"
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg font-medium text-center flex items-center justify-center gap-2"
                  >
                    <Phone size={16} />
                    Call Now
                  </a>
                  <a
                    href="https://wa.me/919876543210"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-green-100 hover:bg-green-200 text-green-700 py-2 px-4 rounded-lg font-medium text-center"
                  >
                    WhatsApp
                  </a>
                </div>
              </div>

              {/* Sri Srinivasa Pest Control Services */}
              <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-bold text-gray-900">Sri Srinivasa Pest Control Services</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex items-center gap-1 text-yellow-500">
                        <Star size={14} fill="currentColor" />
                        <span className="text-sm font-semibold">5.0</span>
                      </div>
                      <span className="text-xs text-gray-500">(4 Ratings)</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-2 mb-3">
                  <div className="flex items-start gap-2 text-sm text-gray-600">
                    <MapPin size={16} className="flex-shrink-0 mt-0.5 text-green-600" />
                    <span>Near Rajya Lakshmi Theatre, Railpeta Repale, Repalle</span>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <span className="px-2 py-1 bg-green-50 text-green-700 text-xs rounded-full">Termite Specialist</span>
                    <span className="px-2 py-1 bg-orange-50 text-orange-700 text-xs rounded-full">All Crops</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <a
                    href="tel:+919876543211"
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg font-medium text-center flex items-center justify-center gap-2"
                  >
                    <Phone size={16} />
                    Call Now
                  </a>
                  <a
                    href="https://wa.me/919876543211"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-green-100 hover:bg-green-200 text-green-700 py-2 px-4 rounded-lg font-medium text-center"
                  >
                    WhatsApp
                  </a>
                </div>
              </div>

              {/* Indian Pest Control */}
              <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-bold text-gray-900">Indian Pest Control</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex items-center gap-1 text-yellow-500">
                        <Star size={14} fill="currentColor" />
                        <span className="text-sm font-semibold">4.3</span>
                      </div>
                      <span className="text-xs text-gray-500">(69 Ratings)</span>
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">Verified</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-2 mb-3">
                  <div className="flex items-start gap-2 text-sm text-gray-600">
                    <MapPin size={16} className="flex-shrink-0 mt-0.5 text-green-600" />
                    <span>Near Rama Mandiram, Arundalpet, Vijayawada</span>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <span className="px-2 py-1 bg-purple-50 text-purple-700 text-xs rounded-full">Commercial</span>
                    <span className="px-2 py-1 bg-green-50 text-green-700 text-xs rounded-full">Rice & Cotton</span>
                    <span className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full">Quick Response</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <a
                    href="tel:07383516993"
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg font-medium text-center flex items-center justify-center gap-2"
                  >
                    <Phone size={16} />
                    Call Now
                  </a>
                  <a
                    href="https://wa.me/917383516993"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-green-100 hover:bg-green-200 text-green-700 py-2 px-4 rounded-lg font-medium text-center"
                  >
                    WhatsApp
                  </a>
                </div>
              </div>

              {/* BPK Pest Control */}
              <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-bold text-gray-900">BPK Pest Control</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex items-center gap-1 text-yellow-500">
                        <Star size={14} fill="currentColor" />
                        <span className="text-sm font-semibold">4.8</span>
                      </div>
                      <span className="text-xs text-gray-500">(24 Ratings)</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-2 mb-3">
                  <div className="flex items-start gap-2 text-sm text-gray-600">
                    <MapPin size={16} className="flex-shrink-0 mt-0.5 text-green-600" />
                    <span>Main Road Check Post, Kurnool</span>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <span className="px-2 py-1 bg-green-50 text-green-700 text-xs rounded-full">All Crops</span>
                    <span className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full">24 Hours</span>
                    <span className="px-2 py-1 bg-orange-50 text-orange-700 text-xs rounded-full">10 Min Response</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <a
                    href="tel:08904938017"
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg font-medium text-center flex items-center justify-center gap-2"
                  >
                    <Phone size={16} />
                    Call Now
                  </a>
                  <a
                    href="https://wa.me/918904938017"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-green-100 hover:bg-green-200 text-green-700 py-2 px-4 rounded-lg font-medium text-center"
                  >
                    WhatsApp
                  </a>
                </div>
              </div>

              {/* G Pest Control India Pvt Ltd */}
              <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-bold text-gray-900">G Pest Control India Pvt Ltd</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex items-center gap-1 text-yellow-500">
                        <Star size={14} fill="currentColor" />
                        <span className="text-sm font-semibold">4.7</span>
                      </div>
                      <span className="text-xs text-gray-500">(11 Ratings)</span>
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">Verified</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-2 mb-3">
                  <div className="flex items-start gap-2 text-sm text-gray-600">
                    <MapPin size={16} className="flex-shrink-0 mt-0.5 text-green-600" />
                    <span>Near Central Bank, Bhakthavatsala Nagar, Nellore</span>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <span className="px-2 py-1 bg-purple-50 text-purple-700 text-xs rounded-full">Commercial</span>
                    <span className="px-2 py-1 bg-green-50 text-green-700 text-xs rounded-full">All Crops</span>
                    <span className="px-2 py-1 bg-orange-50 text-orange-700 text-xs rounded-full">55 Min Response</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <a
                    href="tel:08128321408"
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg font-medium text-center flex items-center justify-center gap-2"
                  >
                    <Phone size={16} />
                    Call Now
                  </a>
                  <a
                    href="https://wa.me/918128321408"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-green-100 hover:bg-green-200 text-green-700 py-2 px-4 rounded-lg font-medium text-center"
                  >
                    WhatsApp
                  </a>
                </div>
              </div>

              {/* Professional Pest Solutions */}
              <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-bold text-gray-900">Professional Pest Solutions</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex items-center gap-1 text-yellow-500">
                        <Star size={14} fill="currentColor" />
                        <span className="text-sm font-semibold">4.4</span>
                      </div>
                      <span className="text-xs text-gray-500">(24 Ratings)</span>
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">Verified</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-2 mb-3">
                  <div className="flex items-start gap-2 text-sm text-gray-600">
                    <MapPin size={16} className="flex-shrink-0 mt-0.5 text-green-600" />
                    <span>Near Gandhi Statue, Nehru Road, Proddatur</span>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <span className="px-2 py-1 bg-green-50 text-green-700 text-xs rounded-full">All Crops</span>
                    <span className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full">24 Hours</span>
                    <span className="px-2 py-1 bg-orange-50 text-orange-700 text-xs rounded-full">Waterproofing</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <a
                    href="tel:09054074907"
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg font-medium text-center flex items-center justify-center gap-2"
                  >
                    <Phone size={16} />
                    Call Now
                  </a>
                  <a
                    href="https://wa.me/919054074907"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-green-100 hover:bg-green-200 text-green-700 py-2 px-4 rounded-lg font-medium text-center"
                  >
                    WhatsApp
                  </a>
                </div>
              </div>

              {/* Sri Satyanarayana Services */}
              <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-bold text-gray-900">Sri Satyanarayana Services</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex items-center gap-1 text-yellow-500">
                        <Star size={14} fill="currentColor" />
                        <span className="text-sm font-semibold">4.7</span>
                      </div>
                      <span className="text-xs text-gray-500">(3 Ratings)</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-2 mb-3">
                  <div className="flex items-start gap-2 text-sm text-gray-600">
                    <MapPin size={16} className="flex-shrink-0 mt-0.5 text-green-600" />
                    <span>VTC Karimnagar, Vavilalapally, Karimnagar</span>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <span className="px-2 py-1 bg-green-50 text-green-700 text-xs rounded-full">All Crops</span>
                    <span className="px-2 py-1 bg-purple-50 text-purple-700 text-xs rounded-full">Sanitizing</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <a
                    href="tel:08401904425"
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg font-medium text-center flex items-center justify-center gap-2"
                  >
                    <Phone size={16} />
                    Call Now
                  </a>
                  <a
                    href="https://wa.me/918401904425"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-green-100 hover:bg-green-200 text-green-700 py-2 px-4 rounded-lg font-medium text-center"
                  >
                    WhatsApp
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
