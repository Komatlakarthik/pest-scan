import { useState, useRef, useEffect } from 'react';
import { Camera, Upload, X, Loader2, ArrowRight, AlertCircle, Sparkles, Globe, Zap, Volume2, VolumeX, ShoppingCart } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../utils/axios';
import useAuthStore from '../store/authStore';
import { useLocation, useNavigate } from 'react-router-dom';

export default function Diagnose() {
  const location = useLocation();
  const navigate = useNavigate();
  const [step, setStep] = useState('upload'); // 'upload', 'preview', 'analyzing', 'results'
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedCrop, setSelectedCrop] = useState(location.state?.selectedCrop || 'Tomato');
  const [fieldId, setFieldId] = useState(location.state?.fieldId || null);
  const [language, setLanguage] = useState('english'); // 'english' or 'telugu'
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [ttsSupported, setTtsSupported] = useState(true); // Google TTS always supported
  const [showCamera, setShowCamera] = useState(false);
  const [stream, setStream] = useState(null);
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const currentAudioRef = useRef(null); // Track current audio for stopping
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const { user, token } = useAuthStore();

  // Check TTS support on mount
  useEffect(() => {
    if ('speechSynthesis' in window) {
      setTtsSupported(true);
    }
    
    // Check if navigating from history with result data
    if (location.state?.result && location.state?.fromHistory) {
      console.log('Loading result from history:', location.state.result);
      setResult(location.state.result);
      setStep('results');
      if (location.state.result.imageUrl) {
        setImagePreview(location.state.result.imageUrl);
      }
    }
    
    // Cleanup: stop any ongoing speech when component unmounts
    return () => {
      // Stop Google TTS audio
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
        currentAudioRef.current = null;
      }
      // Stop browser TTS
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      // Stop camera stream
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      setIsSpeaking(false);
    };
  }, []);

  // Text-to-Speech using Google Cloud TTS API
  const speakText = async (text) => {
    if (!text) {
      toast.error('No text to speak');
      return;
    }

    try {
      console.log('🔊 Requesting Google TTS for:', text);
      setIsSpeaking(true);

      // Call backend TTS API
      const response = await api.post(
        '/api/tts/speak',
        { 
          text,
          language: 'te-IN'
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
    utterance.lang = 'te-IN';
    utterance.rate = 0.85;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  // Stop speaking
  const stopSpeaking = () => {
    // Stop Google TTS audio
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current.currentTime = 0;
      currentAudioRef.current = null;
    }
    // Stop browser TTS
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  };

  // Auto-play results when in Telugu mode
  useEffect(() => {
    if (result && language === 'telugu' && step === 'results' && ttsSupported) {
      // Prepare Telugu text to speak - handle arrays and clean text
      const diseaseText = result.disease_telugu || result.disease || '';
      const severityText = result.severity_telugu || result.severity || '';
      
      // Handle symptoms - could be string or array
      let symptomsText = '';
      if (result.symptoms_telugu) {
        symptomsText = Array.isArray(result.symptoms_telugu) 
          ? result.symptoms_telugu.join('. ') 
          : String(result.symptoms_telugu);
      } else if (result.symptoms) {
        symptomsText = Array.isArray(result.symptoms) 
          ? result.symptoms.join('. ') 
          : String(result.symptoms);
      }
      
      // Clean text - remove English, numbers, but keep Telugu
      const cleanTeluguText = (text) => {
        const str = String(text);
        // Remove English letters, numbers, special symbols but keep Telugu and spaces
        const cleaned = str
          .replace(/[a-zA-Z0-9]/g, '') // Remove English letters and numbers
          .replace(/[@#$%^&*()_+=\[\]{}|\\<>?\/]/g, '') // Remove special symbols
          .replace(/\s+/g, ' ') // Normalize spaces
          .trim();
        
        console.log('Original:', str, '→ Cleaned:', cleaned);
        return cleaned;
      };
      
      const cleanedDisease = cleanTeluguText(diseaseText);
      const cleanedSeverity = cleanTeluguText(severityText);
      const cleanedSymptoms = cleanTeluguText(symptomsText);
      
      const fullText = `${cleanedDisease}. తీవ్రత: ${cleanedSeverity}. ${cleanedSymptoms ? 'లక్షణాలు: ' + cleanedSymptoms : ''}`;
      
      console.log('📢 Full text to speak:', fullText);
      
      // Small delay to ensure UI is rendered
      setTimeout(() => {
        if (fullText.trim().length > 0) {
          speakText(fullText);
        } else {
          console.warn('⚠️ No Telugu text to speak');
        }
      }, 500);
    }
    
    // Cleanup on language change or unmount
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
      }
    };
  }, [result, language, step, ttsSupported]);

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error('Image size must be less than 10MB');
        return;
      }
      
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
        setStep('preview');
      };
      reader.readAsDataURL(file);
    }
  };

  // Open camera
  const openCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      setStream(mediaStream);
      setShowCamera(true);
      
      // Wait for video element to be ready
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      }, 100);
    } catch (error) {
      console.error('Camera error:', error);
      toast.error('Unable to access camera. Please check permissions.');
    }
  };

  // Close camera
  const closeCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setShowCamera(false);
  };

  // Capture photo from camera
  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const context = canvas.getContext('2d');
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], 'camera-capture.jpg', { type: 'image/jpeg' });
          setSelectedImage(file);
          setImagePreview(canvas.toDataURL('image/jpeg'));
          closeCamera();
          setStep('preview');
        }
      }, 'image/jpeg', 0.95);
    }
  };

  const handleAnalyze = async () => {
    if (!selectedImage) return;

    setLoading(true);
    setStep('analyzing');

    const formData = new FormData();
    formData.append('image', selectedImage);
    formData.append('cropType', selectedCrop);

    try {
      const response = await api.post('/api/detect', formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      console.log('AI Detection Result:', response.data);
      const diagnosisResult = response.data;
      setResult(diagnosisResult);
      
      // Auto-save crop to field if not already saved
      await saveToMyFields(diagnosisResult);
      
      setStep('results');
      toast.success('Analysis complete!');
    } catch (error) {
      console.error('Analysis error:', error);
      if (error.response?.status !== 401) {
        toast.error(error.response?.data?.message || 'Analysis failed');
      }
      setStep('preview');
    } finally {
      setLoading(false);
    }
  };

  const saveToMyFields = async (diagnosisResult) => {
    try {
      // Check if field already exists for this crop
      const cropName = diagnosisResult.cropType || selectedCrop;
      const fieldName = `${cropName} - Scan ${new Date().toLocaleDateString()}`;
      
      await api.post('/api/fields', {
        name: fieldName,
        location: 'My Farm',
        cropType: cropName,
        size: 1.0,
        plantedDate: new Date().toISOString(),
        imageUrl: imagePreview
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log('✅ Crop saved to My Fields');
    } catch (error) {
      console.error('Failed to save crop:', error);
      // Don't show error to user - saving is optional
    }
  };

  const reset = () => {
    setStep('upload');
    setSelectedImage(null);
    setImagePreview(null);
    setResult(null);
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'high': return 'bg-red-100 text-red-700 border-red-200';
      case 'moderate': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'low': return 'bg-green-100 text-green-700 border-green-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  if (step === 'analyzing') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
            <Loader2 className="animate-spin text-green-600" size={40} />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Analyzing Image</h2>
          <p className="text-gray-600">Our AI is examining your crop...</p>
        </div>
      </div>
    );
  }

  if (step === 'results' && result) {
    const getSourceBadge = (source) => {
      const sourceLower = (source || '').toLowerCase().replace(/\s+/g, '_');
      const badges = {
        'roboflow': { icon: Sparkles, text: 'Roboflow AI', color: 'bg-purple-100 text-purple-700 border-purple-200' },
        'gemini_vision': { icon: Globe, text: 'Gemini Vision', color: 'bg-blue-100 text-blue-700 border-blue-200' },
        'google_vision': { icon: Zap, text: 'Google Vision', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
        'huggingface': { icon: Sparkles, text: 'Hugging Face', color: 'bg-orange-100 text-orange-700 border-orange-200' },
        'offline_mock': { icon: AlertCircle, text: 'Offline Mode', color: 'bg-gray-100 text-gray-700 border-gray-200' }
      };
      return badges[sourceLower] || badges.offline_mock;
    };

    const sourceBadge = getSourceBadge(result.source);
    const SourceIcon = sourceBadge.icon;

    // Translations for UI elements
    const translations = {
      english: {
        diagnosisResults: 'Diagnosis Results',
        newScan: 'New Scan',
        offlineMode: 'Operating in offline mode - results may not be accurate',
        model: 'Model',
        notPlantDetected: 'Not a Plant Detected',
        detected: 'Detected',
        labels: 'Labels',
        cropType: 'Crop Type',
        youSelected: 'You selected',
        butDetectedAs: 'but detected as',
        confidence: 'Confidence',
        expertConsultation: 'Expert Consultation Created',
        expertReview: 'Due to lower confidence, an expert will review your case',
        symptomsIdentified: 'Symptoms Identified',
        recommendedTreatment: 'Recommended Treatment',
        preventionTips: 'Prevention Tips',
        getTreatment: 'Get Treatment',
        shopNow: 'Shop Now',
        otherPossibilities: 'Other Possibilities',
        noTreatment: 'No treatment recommendations available',
        noPrevention: 'No prevention tips available',
        noSymptoms: 'No symptoms identified'
      },
      telugu: {
        diagnosisResults: 'నిర్ధారణ ఫలితాలు',
        newScan: 'కొత్త స్కాన్',
        offlineMode: 'ఆఫ్‌లైన్ మోడ్‌లో పనిచేస్తోంది - ఫలితాలు ఖచ్చితమైనవి కాకపోవచ్చు',
        model: 'మోడల్',
        notPlantDetected: 'మొక్క కాదు గుర్తించబడింది',
        detected: 'గుర్తించబడింది',
        labels: 'లేబుల్స్',
        cropType: 'పంట రకం',
        youSelected: 'మీరు ఎంచుకున్నారు',
        butDetectedAs: 'కానీ గుర్తించబడింది',
        confidence: 'విశ్వాసం',
        expertConsultation: 'నిపుణుల సంప్రదింపు సృష్టించబడింది',
        expertReview: 'తక్కువ విశ్వాసం కారణంగా, ఒక నిపుణుడు మీ కేసును సమీక్షిస్తారు',
        symptomsIdentified: 'గుర్తించబడిన లక్షణాలు',
        recommendedTreatment: 'సిఫార్సు చేయబడిన చికిత్స',
        preventionTips: 'నివారణ చిట్కాలు',
        getTreatment: 'చికిత్స పొందండి',
        shopNow: 'ఇప్పుడు కొనండి',
        otherPossibilities: 'ఇతర అవకాశాలు',
        noTreatment: 'చికిత్స సిఫార్సులు అందుబాటులో లేవు',
        noPrevention: 'నివారణ చిట్కాలు అందుబాటులో లేవు',
        noSymptoms: 'లక్షణాలు గుర్తించబడలేదు'
      }
    };

    const t = translations[language];

    return (
      <div className="min-h-screen bg-gray-50 pb-6">
        {/* Header with Language Toggle */}
        <div className="bg-gradient-to-r from-green-700 via-green-600 to-emerald-600 border-b border-green-800 p-4 sticky top-0 z-10 shadow-lg shadow-green-900/30">
          <div className="flex items-center justify-between max-w-screen-xl mx-auto">
            <h1 className="text-xl font-bold text-white">{t.diagnosisResults}</h1>
            <div className="flex items-center gap-3">
              {/* Language Toggle */}
              <div className="flex items-center gap-2 bg-white/20 rounded-lg p-1">
                <button
                  onClick={() => setLanguage('english')}
                  className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                    language === 'english'
                      ? 'bg-white text-green-600 shadow-sm'
                      : 'text-white hover:text-green-100'
                  }`}
                >
                  English
                </button>
                <button
                  onClick={() => setLanguage('telugu')}
                  className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                    language === 'telugu'
                      ? 'bg-white text-green-600 shadow-sm'
                      : 'text-white hover:text-green-100'
                  }`}
                >
                  తెలుగు
                </button>
              </div>
              <button
                onClick={reset}
                className="text-white font-medium text-sm hover:text-green-100"
              >
                {t.newScan}
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-screen-xl mx-auto px-4 py-6 space-y-4">
          {/* AI Source Badge */}
          {result.source === 'offline_mock' && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center gap-2">
              <AlertCircle size={20} className="text-amber-600" />
              <span className="text-sm text-amber-800">{t.offlineMode}</span>
            </div>
          )}

          {/* Image */}
          <img
            src={result.imageUrl || imagePreview}
            alt="Scanned crop"
            className="w-full h-64 object-cover rounded-xl shadow-sm"
          />

          {/* Disease Info */}
          <div className="bg-white rounded-xl p-4 shadow-sm">
            {/* AI Source & Model */}
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${sourceBadge.color}`}>
                <SourceIcon size={14} />
                {sourceBadge.text}
              </span>
              {result.model && (
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                  {t.model}: {result.model}
                </span>
              )}
            </div>

            {/* Not a Plant Warning */}
            {result.disease === 'Not a Plant' && (
              <div className="mb-4 p-4 bg-red-50 border-2 border-red-200 rounded-xl">
                <div className="flex items-start gap-3">
                  <AlertCircle size={24} className="text-red-600 flex-shrink-0 mt-1" />
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-red-900 mb-2">{t.notPlantDetected}</h3>
                    <p className="text-sm text-red-800 mb-3">{result.warning}</p>
                    {result.detectedObjects && result.detectedObjects.length > 0 && (
                      <div className="text-xs text-red-700 bg-red-100 px-3 py-2 rounded">
                        <span className="font-semibold">{t.detected}: </span>
                        {result.detectedObjects.join(', ')}
                      </div>
                    )}
                    {result.detectedLabels && result.detectedLabels.length > 0 && (
                      <div className="text-xs text-red-700 mt-2">
                        <span className="font-semibold">{t.labels}: </span>
                        {result.detectedLabels.join(', ')}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h2 className={`text-xl font-bold mb-1 ${result.disease === 'Not a Plant' ? 'text-red-900' : 'text-gray-900'}`}>
                    {language === 'telugu' ? (result.disease_telugu || result.disease) : result.disease}
                  </h2>
                  {/* TTS Button - Only show in Telugu mode */}
                  {language === 'telugu' && ttsSupported && (
                    <button
                      onClick={() => {
                        if (isSpeaking) {
                          stopSpeaking();
                        } else {
                          // Clean text - remove English and numbers, keep Telugu
                          const cleanTeluguText = (text) => {
                            if (!text) return '';
                            const str = Array.isArray(text) ? text.join('. ') : String(text);
                            return str
                              .replace(/[a-zA-Z0-9]/g, '') // Remove English letters and numbers
                              .replace(/[@#$%^&*()_+=\[\]{}|\\<>?\/]/g, '') // Remove special symbols
                              .replace(/\s+/g, ' ') // Normalize spaces
                              .trim();
                          };
                          
                          const diseaseText = cleanTeluguText(result.disease_telugu || result.disease);
                          const severityText = cleanTeluguText(result.severity_telugu || result.severity);
                          const symptomsText = cleanTeluguText(result.symptoms_telugu || result.symptoms);
                          const treatmentText = cleanTeluguText(result.treatment_telugu || result.treatment);
                          
                          const fullText = `${diseaseText}. తీవ్రత: ${severityText}. ${symptomsText ? `లక్షణాలు: ${symptomsText}. ` : ''}${treatmentText ? `చికిత్స: ${treatmentText}` : ''}`;
                          
                          console.log('🔊 Button click - Speaking:', fullText);
                          speakText(fullText);
                        }
                      }}
                      className={`p-2 rounded-full transition-all ${
                        isSpeaking 
                          ? 'bg-red-100 text-red-600 hover:bg-red-200 animate-pulse' 
                          : 'bg-green-100 text-green-600 hover:bg-green-200'
                      }`}
                      title={isSpeaking ? 'Stop speaking' : 'Listen in Telugu'}
                    >
                      {isSpeaking ? <VolumeX size={20} /> : <Volume2 size={20} />}
                    </button>
                  )}
                </div>
                <div className="flex flex-col gap-1">
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">{t.cropType}:</span> {language === 'telugu' ? (result.crop_telugu || result.crop) : result.crop}
                  </p>
                  {selectedCrop && selectedCrop !== 'Other' && selectedCrop !== result.crop && (
                    <p className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded inline-block">
                      ⚠️ {t.youSelected} "{selectedCrop}" {t.butDetectedAs} "{result.crop}"
                    </p>
                  )}
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getSeverityColor(result.severity)}`}>
                {language === 'telugu' ? (result.severity_telugu || result.severity) : result.severity}
              </span>
            </div>

            {/* Confidence */}
            {result.disease !== 'Not a Plant' && (
              <div className="mb-3">
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-gray-600">{t.confidence}</span>
                  <span className="font-semibold text-gray-900">{result.confidence}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-600 h-2 rounded-full transition-all"
                    style={{ width: `${result.confidence}%` }}
                  />
                </div>
              </div>
            )}

            {result.expertCaseCreated && (
              <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg">
                <AlertCircle size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-blue-900">{t.expertConsultation}</p>
                  <p className="text-xs text-blue-700 mt-1">
                    {t.expertReview}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Symptoms Section with Telugu Support */}
          {((language === 'english' && result.symptoms && result.symptoms.length > 0) ||
            (language === 'telugu' && result.symptoms_telugu && result.symptoms_telugu.length > 0)) && (
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <AlertCircle size={18} className="text-orange-600" />
                {t.symptomsIdentified}
              </h3>
              <ul className="space-y-2">
                {language === 'telugu' && result.symptoms_telugu ? (
                  result.symptoms_telugu.map((symptom, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                      <span className="text-orange-500 mt-1">•</span>
                      <span className="font-telugu">{symptom}</span>
                    </li>
                  ))
                ) : (
                  result.symptoms && result.symptoms.map((symptom, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                      <span className="text-orange-500 mt-1">•</span>
                      <span>{symptom}</span>
                    </li>
                  ))
                )}
              </ul>
            </div>
          )}

          {/* Treatment Section with Telugu Support */}
          {(result.treatment || result.treatment_english || result.treatment_telugu) && (
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-3">{t.recommendedTreatment}</h3>
              <div className="text-sm text-gray-700 leading-relaxed">
                {language === 'telugu' && result.treatment_telugu ? (
                  <p className="font-telugu whitespace-pre-line">{result.treatment_telugu}</p>
                ) : (
                  <p className="whitespace-pre-line">{result.treatment || result.treatment_english || t.noTreatment}</p>
                )}
              </div>
            </div>
          )}

          {/* Prevention Section with Telugu Support */}
          {(result.prevention || result.prevention_telugu) && (
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Sparkles size={18} className="text-green-600" />
                {t.preventionTips}
              </h3>
              <div className="text-sm text-gray-700 leading-relaxed">
                {language === 'telugu' && result.prevention_telugu ? (
                  <p className="font-telugu whitespace-pre-line">{result.prevention_telugu}</p>
                ) : (
                  <p className="whitespace-pre-line">{result.prevention || t.noPrevention}</p>
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="grid grid-cols-2 gap-3">
            <button 
              onClick={() => {
                // Store diagnosis data in sessionStorage for persistence
                const diagnosisData = {
                  disease: result.disease,
                  disease_telugu: result.disease_telugu,
                  crop: result.cropType || selectedCrop,
                  severity: result.severity,
                  confidence: result.confidence,
                  symptoms: result.symptoms,
                  symptoms_telugu: result.symptoms_telugu,
                  treatment: result.treatment,
                  treatment_telugu: result.treatment_telugu,
                  prevention: result.prevention,
                  prevention_telugu: result.prevention_telugu,
                  imageUrl: imagePreview,
                  reportId: result.reportId,
                  fieldId: result.fieldId
                };
                sessionStorage.setItem('currentDiagnosis', JSON.stringify(diagnosisData));
                
                navigate('/treatment', { state: diagnosisData });
              }}
              className="flex items-center justify-center gap-2 bg-green-600 text-white py-3 rounded-xl font-semibold hover:bg-green-700 active:scale-95 transition-all"
            >
              <ArrowRight size={20} />
              {t.getTreatment}
            </button>
            <button 
              onClick={() => {
                // Navigate to shop page with medicine info
                const shopData = {
                  disease: result.disease,
                  disease_telugu: result.disease_telugu,
                  crop: result.cropType || selectedCrop,
                  severity: result.severity,
                  treatment: result.treatment,
                  reportId: result.reportId
                };
                sessionStorage.setItem('shopData', JSON.stringify(shopData));
                navigate('/shop', { state: shopData });
              }}
              className="flex items-center justify-center gap-2 bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 active:scale-95 transition-all"
            >
              <ShoppingCart size={20} />
              {t.shopNow || 'Shop Now'}
            </button>
          </div>

          {/* Other Predictions - Show All */}
          {result.allPredictions && result.allPredictions.length > 1 && (
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-3">{t.otherPossibilities}</h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {result.allPredictions.slice(1).map((pred, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-700">
                      {language === 'telugu' ? (pred.disease_telugu || pred.disease) : pred.disease}
                    </span>
                    <span className="text-sm font-medium text-gray-500">{pred.confidence}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-green-50 to-green-100 relative">
      {/* Glowing effect overlay */}
      <div className="absolute inset-0 bg-gradient-radial from-green-200/20 via-transparent to-transparent pointer-events-none" style={{backgroundImage: 'radial-gradient(circle at 50% 80%, rgba(134, 239, 172, 0.15) 0%, transparent 60%)'}}></div>
      
      {/* Camera Modal */}
      {showCamera && (
        <div className="fixed inset-0 bg-black z-50 flex flex-col">
          {/* Camera Header */}
          <div className="bg-black/80 p-4 flex items-center justify-between">
            <h2 className="text-white font-semibold">Take Photo</h2>
            <button
              onClick={closeCamera}
              className="text-white p-2 hover:bg-white/20 rounded-full"
            >
              <X size={24} />
            </button>
          </div>
          
          {/* Camera Preview */}
          <div className="flex-1 relative flex items-center justify-center bg-black">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="max-w-full max-h-full"
            />
            
            {/* Capture Button - Bottom Right */}
            <div className="absolute bottom-8 right-8 flex flex-col items-center gap-2">
              <button
                onClick={capturePhoto}
                className="w-20 h-20 bg-white rounded-full border-4 border-gray-300 hover:border-green-500 transition-all active:scale-90 shadow-lg relative"
              >
                <div className="absolute inset-2 bg-white rounded-full"></div>
              </button>
              <p className="text-white text-xs">Capture</p>
            </div>
          </div>
          
          {/* Hidden canvas for capturing */}
          <canvas ref={canvasRef} className="hidden" />
        </div>
      )}
      
      {/* Header */}
      <div className="bg-gradient-to-r from-green-700 via-green-600 to-emerald-600 border-b border-green-800 p-4 sticky top-0 z-10 shadow-lg shadow-green-900/30">
        <div className="max-w-screen-xl mx-auto">
          <h1 className="text-xl font-bold text-white">Diagnose Your Crops</h1>
          <p className="text-sm text-green-100 mt-1">Take or upload a photo for AI analysis</p>
        </div>
      </div>

      <div className="max-w-screen-xl mx-auto px-4 py-6">
        {step === 'upload' ? (
          <div className="space-y-4">
            {/* Camera Option */}
            <button
              onClick={openCamera}
              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow"
            >
              <div className="flex flex-col items-center">
                <div className="bg-white bg-opacity-20 rounded-full p-6 mb-4">
                  <Camera size={48} />
                </div>
                <h2 className="text-xl font-bold mb-2">Take a Photo</h2>
                <p className="text-green-100 text-sm">Use your camera to capture</p>
              </div>
            </button>

            {/* Upload Option */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full bg-white border-2 border-dashed border-gray-300 rounded-2xl p-8 hover:border-green-500 hover:bg-green-50 transition-colors"
            >
              <div className="flex flex-col items-center">
                <Upload size={48} className="text-gray-400 mb-4" />
                <h2 className="text-xl font-bold text-gray-900 mb-2">Upload from Gallery</h2>
                <p className="text-gray-600 text-sm">Choose an existing photo</p>
              </div>
            </button>

            {/* Hidden file inputs */}
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileSelect}
              className="hidden"
            />
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />

            {/* Tips */}
            <div className="bg-blue-50 rounded-xl p-4 mt-6">
              <h3 className="font-semibold text-blue-900 mb-2">Tips for Best Results</h3>
              <ul className="space-y-1 text-sm text-blue-800">
                <li>• Ensure good lighting</li>
                <li>• Focus on affected areas</li>
                <li>• Avoid blurry images</li>
                <li>• Include multiple leaves if possible</li>
              </ul>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Image Preview */}
            <div className="relative">
              <img
                src={imagePreview}
                alt="Preview"
                className="w-full h-80 object-cover rounded-xl shadow-sm"
              />
              <button
                onClick={reset}
                className="absolute top-4 right-4 bg-white rounded-full p-2 shadow-lg hover:bg-gray-100"
              >
                <X size={20} className="text-gray-700" />
              </button>
            </div>

            {/* Crop Type Selector */}
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Crop Type
              </label>
              <select
                value={selectedCrop}
                onChange={(e) => setSelectedCrop(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="Tomato">🍅 Tomato</option>
                <option value="Potato">🥔 Potato</option>
                <option value="Pepper">🌶️ Pepper</option>
                <option value="Wheat">🌾 Wheat</option>
                <option value="Rice">🌾 Rice</option>
                <option value="Corn">🌽 Corn</option>
                <option value="Cotton">☁️ Cotton</option>
                <option value="Soybean">🫘 Soybean</option>
                <option value="Sugarcane">🎍 Sugarcane</option>
                <option value="Other">❓ Other</option>
              </select>
            </div>

            {/* Actions */}
            <div className="space-y-3">
              <button
                onClick={handleAnalyze}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-green-600 text-white py-4 rounded-xl font-semibold hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors shadow-lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin" size={20} />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Camera size={20} />
                    Analyze Image
                  </>
                )}
              </button>

              <button
                onClick={reset}
                className="w-full text-gray-600 font-medium py-3 hover:text-gray-800"
              >
                Choose Different Image
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
