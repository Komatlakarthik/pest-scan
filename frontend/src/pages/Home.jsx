import { Link, useNavigate } from 'react-router-dom';
import { Camera, AlertTriangle, Bell, ChevronRight, Circle, MoreVertical, Plus, Languages, Cloud, Droplets, Wind, CloudRain, Trash2 } from 'lucide-react';
import useAuthStore from '../store/authStore';
import { useState, useEffect } from 'react';
import api from '../utils/axios';
import toast from 'react-hot-toast';
import { getAPWeather, getWeatherIconUrl, formatTemp, getWeatherAdvice } from '../utils/weather';

export default function Home() {
  const navigate = useNavigate();
  const { user, token, updateUser } = useAuthStore();
  const [fields, setFields] = useState([]);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [language, setLanguage] = useState(user?.language || 'en');
  const [weather, setWeather] = useState(null);
  const [weatherLoading, setWeatherLoading] = useState(true);

  useEffect(() => {
    if (user?.id && token) {
      fetchDashboard();
    }
    fetchWeather();
  }, [user, token]);

  const fetchWeather = async () => {
    try {
      setWeatherLoading(true);
      const weatherData = await getAPWeather();
      setWeather(weatherData);
    } catch (error) {
      console.error('Weather fetch error:', error);
    } finally {
      setWeatherLoading(false);
    }
  };

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/api/user/${user.id}/dashboard`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDashboardData(response.data);
      setFields(response.data.fields || []);
    } catch (error) {
      console.error('Dashboard fetch error:', error);
      if (error.response?.status !== 401) {
        toast.error('Failed to load dashboard');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCrop = async (fieldId, e) => {
    e.stopPropagation(); // Prevent navigation when clicking delete
    
    const confirmMessage = language === 'te' 
      ? 'మీరు ఖచ్చితంగా ఈ పంటను తొలగించాలనుకుంటున్నారా?' 
      : 'Are you sure you want to delete this crop?';
    
    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      await api.delete(`/api/fields/${fieldId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const successMessage = language === 'te' 
        ? 'పంట విజయవంతంగా తొలగించబడింది' 
        : 'Crop deleted successfully';
      
      toast.success(successMessage);
      
      // Refresh the dashboard
      fetchDashboard();
    } catch (error) {
      console.error('Delete crop error:', error);
      const errorMessage = language === 'te' 
        ? 'పంట తొలగించడం విफలమైంది' 
        : 'Failed to delete crop';
      toast.error(errorMessage);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (language === 'te') {
      if (hour < 12) return 'శుభోదయం';
      if (hour < 18) return 'శుభ మధ్యాహ్నం';
      return 'శుభ సాయంత్రం';
    }
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  const translations = {
    en: {
      greeting: getGreeting(),
      farmer: 'Farmer',
      readyToProtect: 'Ready to protect your crops today?',
      scanCropNow: 'Scan Crop Now',
      myCrops: 'My Crops',
      seeAll: 'See All',
      noCrops: 'No crops yet',
      startAdding: 'Start by adding your first field',
      addField: 'Add Field',
      online: 'Online',
      apWeather: 'AP Weather',
      weatherUnavailable: 'Unable to load weather',
      deleteCrop: 'Delete Crop',
      confirmDelete: 'Are you sure you want to delete this crop?',
      cropDeleted: 'Crop deleted successfully',
      deleteFailed: 'Failed to delete crop'
    },
    te: {
      greeting: getGreeting(),
      farmer: 'రైతు',
      readyToProtect: 'ఈరోజు మీ పంటలను రక్షించడానికి సిద్ధంగా ఉన్నారా?',
      scanCropNow: 'ఇప్పుడు స్కాన్ చేయండి',
      myCrops: 'నా పంటలు',
      seeAll: 'అన్నీ చూడండి',
      noCrops: 'ఇంకా పంటలు లేవు',
      startAdding: 'మీ మొదటి పొలాన్ని జోడించడం ద్వారా ప్రారంభించండి',
      addField: 'పొలం జోడించండి',
      online: 'ఆన్‌లైన్',
      apWeather: 'AP వాతావరణం',
      weatherUnavailable: 'వాతావరణం లోడ్ చేయడం సాధ్యం కాలేదు',
      deleteCrop: 'పంట తొలగించండి',
      confirmDelete: 'మీరు ఖచ్చితంగా ఈ పంటను తొలగించాలనుకుంటున్నారా?',
      cropDeleted: 'పంట విజయవంతంగా తొలగించబడింది',
      deleteFailed: 'పంట తొలగించడం విफలమైంది'
    }
  };

  const t = translations[language] || translations.en;

  // Map crop types to image URLs
  const getCropImage = (cropType) => {
    const cropImages = {
      'Tomato': 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=400&h=400&fit=crop',
      'Corn': 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=400&h=400&fit=crop',
      'Maize': 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=400&h=400&fit=crop',
      'Sugarcane': 'https://images.unsplash.com/photo-1583486932976-2c5e85a388a4?w=400&h=400&fit=crop',
      'Sugar Cane': 'https://images.unsplash.com/photo-1583486932976-2c5e85a388a4?w=400&h=400&fit=crop',
      'sugarcane': 'https://images.unsplash.com/photo-1583486932976-2c5e85a388a4?w=400&h=400&fit=crop'
    };
    return cropImages[cropType] || 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=400&h=400&fit=crop';
  };

  const getHealthColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'healthy': return 'bg-green-500';
      case 'warning': return 'bg-orange-500';
      case 'critical': return 'bg-red-500';
      default: return 'bg-green-500';
    }
  };

  const getHealthText = (status) => {
    switch (status?.toLowerCase()) {
      case 'healthy': return 'HEALTHY';
      case 'warning': return 'WARNING';
      case 'critical': return 'CRITICAL';
      default: return 'HEALTHY';
    }
  };

  const cropImages = {
    'Tomato Field A': '🍅',
    'Wheat Crop B': '🌾',
    'Rice Paddy C': '🌱'
  };

  const handleLanguageToggle = async () => {
    const newLang = language === 'en' ? 'te' : 'en';
    try {
      const response = await api.put(`/api/user/${user.id}`, { language: newLang }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('Language update response:', response.data);
      setLanguage(newLang);
      // Update user in auth store with the response user object
      if (response.data.user) {
        updateUser({ ...user, ...response.data.user });
      } else {
        updateUser({ ...user, language: newLang });
      }
      toast.success(`Language: ${newLang === 'en' ? 'English' : 'తెలుగు'}`);
    } catch (error) {
      console.error('Failed to update language:', error);
      console.error('Error response:', error.response?.data);
      toast.error(error.response?.data?.message || 'Failed to update language');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-green-50 to-green-100 pb-20 relative">
      {/* Glowing effect overlay */}
      <div className="absolute inset-0 bg-gradient-radial from-green-200/20 via-transparent to-transparent pointer-events-none" style={{backgroundImage: 'radial-gradient(circle at 50% 80%, rgba(134, 239, 172, 0.15) 0%, transparent 60%)'}}></div>
      
      {/* Header */}
      <div className="bg-gradient-to-r from-green-700 via-green-600 to-emerald-600 backdrop-blur-md border-b border-green-800 px-6 py-4 flex items-center justify-between sticky top-0 z-10 safe-top shadow-lg shadow-green-900/30 relative">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-white tracking-tight">CropShield AI</h1>
          <div className="flex items-center gap-1.5 text-xs text-green-100 font-medium">
            <Circle size={8} className="fill-green-300 text-green-300 animate-pulse" />
            <span>{t.online}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={handleLanguageToggle}
            className="px-3 py-1.5 rounded-full hover:bg-white/20 flex items-center gap-1.5 transition-all"
            title={language === 'en' ? 'Switch to Telugu' : 'Switch to English'}
          >
            <Languages size={18} className="text-white" />
            <span className="text-xs font-semibold text-white">
              {language === 'en' ? 'EN' : 'తె'}
            </span>
          </button>
        </div>
      </div>

      {/* Greeting */}
      <div className="bg-gradient-to-br from-white/90 to-green-50/50 backdrop-blur-sm px-6 py-8 border-b border-gray-100 relative">
        <h2 className="text-3xl font-bold text-gray-900 mb-2 tracking-tight leading-tight">{t.greeting}, <span className="text-green-600">{t.farmer}</span>!</h2>
        <p className="text-gray-600 font-medium">{t.readyToProtect}</p>
      </div>

      <div className="max-w-screen-xl mx-auto relative z-0">
        {/* Weather Widget */}
        <div className="px-6 pt-6 pb-4">
          <div className="bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 rounded-2xl p-5 text-white shadow-lg shadow-blue-500/20">
            {weatherLoading ? (
              <div className="flex items-center justify-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
              </div>
            ) : weather ? (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex-1">
                    <p className="text-xs opacity-80 font-medium uppercase tracking-wide mb-1">{t.apWeather}</p>
                    <p className="text-4xl font-bold tracking-tight">{formatTemp(weather.main?.temp)}</p>
                    <p className="text-sm capitalize opacity-90 font-medium mt-1">{weather.weather?.[0]?.description}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    {weather.weather?.[0]?.icon && (
                      <img 
                        src={getWeatherIconUrl(weather.weather[0].icon)} 
                        alt="weather" 
                        className="w-16 h-16 drop-shadow-lg"
                      />
                    )}
                  </div>
                  <div className="flex flex-col gap-2 text-right text-sm">
                    <div className="flex items-center gap-1.5 bg-white/10 rounded-full px-2.5 py-1">
                      <Droplets size={16} />
                      <span className="font-semibold">{weather.main?.humidity}%</span>
                    </div>
                    <div className="flex items-center gap-1.5 bg-white/10 rounded-full px-2.5 py-1">
                      <Wind size={16} />
                      <span className="font-semibold">{Math.round(weather.wind?.speed)} m/s</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white/15 backdrop-blur-sm rounded-xl px-3 py-2.5 text-xs font-medium">
                  <p>{getWeatherAdvice(weather)}</p>
                </div>
              </div>
            ) : (
              <p className="text-center text-sm py-3 font-medium">{t.weatherUnavailable}</p>
            )}
          </div>
        </div>

        {/* Scan CTA Button */}
        <div className="px-6 pb-6">
          <Link 
            to="/diagnose"
            className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-2xl p-6 shadow-lg shadow-green-500/30 flex items-center justify-center gap-3 transition-all active:scale-[0.98] hover:shadow-xl"
          >
            <Camera size={28} className="drop-shadow" />
            <span className="text-xl font-bold tracking-tight">{t.scanCropNow}</span>
          </Link>
        </div>

        {/* My Crops Section */}
        <div className="px-6 pb-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-xl font-bold text-gray-900 tracking-tight">{t.myCrops}</h3>
            <button
              onClick={() => navigate('/add-field')}
              className="flex items-center gap-1.5 text-green-600 text-sm font-bold hover:text-green-700 transition-colors"
            >
              <Plus size={18} strokeWidth={2.5} />
              <span>{t.addField}</span>
            </button>
          </div>
          
          {loading ? (
            <div className="grid grid-cols-3 gap-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="aspect-square bg-gray-200 rounded-xl mb-2" />
                  <div className="h-3 bg-gray-200 rounded mb-1" />
                  <div className="h-2 bg-gray-200 rounded w-2/3" />
                </div>
              ))}
            </div>
          ) : fields.length === 0 ? (
            <div className="text-center py-12 bg-gradient-to-br from-gray-50 to-green-50/30 rounded-2xl border-2 border-dashed border-gray-300">
              <p className="text-gray-600 text-base mb-3 font-medium">{t.noCrops}</p>
              <button 
                onClick={() => navigate('/add-field')}
                className="text-green-600 text-sm font-bold hover:text-green-700"
              >
                {t.startAdding}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3">
              {fields
                .slice(0, 3)
                .map((field) => (
                <div key={field.id} className="relative">
                  <button
                    onClick={() => navigate(`/field-details/${field.id}`)}
                    className="w-full bg-green-50/90 backdrop-blur-sm rounded-2xl overflow-hidden shadow-md shadow-green-400/25 hover:shadow-xl hover:shadow-green-400/35 transition-all hover:-translate-y-1 text-left border border-green-200"
                >
                  <div className="relative aspect-square">
                    <img 
                      src={getCropImage(field.crops && field.crops[0])} 
                      alt={field.crops && field.crops[0]}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextElementSibling.style.display = 'flex';
                      }}
                    />
                    <div className="w-full h-full bg-gradient-to-br from-green-100 via-emerald-50 to-green-200 hidden items-center justify-center text-6xl">
                      {field.crops && field.crops[0] === 'Tomato' ? '�' : 
                       field.crops && field.crops[0] === 'Wheat' ? '🌾' : '🌱'}
                    </div>
                    <div className={`absolute top-2 right-2 w-6 h-6 rounded-full ${getHealthColor(field.status)} flex items-center justify-center shadow-md`}>
                      <Circle size={12} className="text-white fill-white" />
                    </div>
                  </div>
                  <div className="p-2.5">
                    <p className="font-bold text-sm text-gray-900 truncate">{field.name}</p>
                    <p className={`text-xs font-semibold mt-1 ${
                      field.status === 'healthy' ? 'text-green-600' :
                      field.status === 'warning' ? 'text-orange-600' :
                      'text-red-600'
                    }`}>
                      • {getHealthText(field.status)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Confidence: {field.confidence}%</p>
                  </div>
                </button>
                
                {/* Delete Button */}
                <button
                  onClick={(e) => handleDeleteCrop(field.id, e)}
                  className="absolute top-1 right-1 p-1 hover:bg-red-100 rounded-full transition-all z-10"
                  title={t.deleteCrop}
                >
                  <Trash2 size={16} className="text-red-600" strokeWidth={2.5} />
                </button>
              </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="px-4 pb-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Recent Activity</h3>
          
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-green-50/80 backdrop-blur-sm rounded-xl p-3 shadow-sm shadow-green-400/15 animate-pulse border border-green-200">
                  <div className="flex gap-3">
                    <div className="w-12 h-12 bg-gray-200 rounded-lg" />
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded mb-2" />
                      <div className="h-3 bg-gray-200 rounded w-2/3" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : dashboardData?.recentActivity?.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-xl">
              <p className="text-gray-600 text-sm">No recent activity</p>
            </div>
          ) : (
            <div className="space-y-3">
              {(dashboardData?.recentActivity || []).map((activity) => (
                <button
                  key={activity.id}
                  onClick={() => {
                    // Navigate to diagnose page with the scan result
                    navigate('/diagnose', {
                      state: {
                        result: {
                          disease: activity.disease,
                          disease_telugu: activity.disease_telugu,
                          crop: activity.crop,
                          crop_telugu: activity.crop_telugu,
                          severity: activity.severity,
                          severity_telugu: activity.severity_telugu,
                          confidence: activity.confidence,
                          symptoms: activity.symptoms,
                          symptoms_telugu: activity.symptoms_telugu,
                          treatment: activity.treatment,
                          treatment_telugu: activity.treatment_telugu,
                          prevention: activity.prevention,
                          prevention_telugu: activity.prevention_telugu,
                          imageUrl: activity.imageUrl,
                          reportId: activity.id
                        },
                        fromHistory: true
                      }
                    });
                  }}
                  className="w-full bg-green-50/90 backdrop-blur-sm rounded-xl p-3 shadow-sm shadow-green-400/25 flex items-center gap-3 hover:shadow-md hover:shadow-green-400/35 transition-shadow text-left border border-green-200"
                >
                  <div className="w-12 h-12 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg flex items-center justify-center text-2xl flex-shrink-0">
                    {activity.crop === 'Tomato' ? '🍅' : 
                     activity.crop === 'Wheat' ? '🌾' : 
                     activity.crop === 'Rice' ? '🌱' : 
                     activity.crop === 'Corn' ? '🌽' : '🥔'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-gray-900 truncate">{activity.fieldName || activity.crop}</p>
                    <p className={`text-sm ${
                      activity.severity === 'low' ? 'text-green-600' :
                      activity.severity === 'moderate' ? 'text-orange-500' :
                      'text-red-600'
                    }`}>
                      {activity.disease}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-gray-500">🎯 {activity.confidence}%</span>
                      <span className="text-xs text-gray-400">•</span>
                      <span className="text-xs text-gray-500">
                        {new Date(activity.date).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="text-gray-400 flex-shrink-0" size={20} />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
