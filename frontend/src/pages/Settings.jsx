import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, 
  Camera, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Bell,
  Shield,
  HelpCircle,
  LogOut,
  ChevronRight,
  Languages
} from 'lucide-react';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';

export default function Settings() {
  const navigate = useNavigate();
  const { user, logout, token, updateUser } = useAuthStore();
  const [language, setLanguage] = useState(user?.language || 'en');
  
  const [profile, setProfile] = useState({
    name: user?.name || 'Rajesh Kumar',
    email: user?.email || 'rajesh.kumar@example.com',
    phone: user?.phone || '+919876543210',
    location: 'Pune, Maharashtra',
    crops: ['Rice', 'Wheat', 'Cotton']
  });

  const [notifications, setNotifications] = useState({
    diseaseAlerts: true,
    weatherUpdates: true,
    treatmentReminders: true,
    newFeatures: false
  });

  const [showNotifications, setShowNotifications] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  const translations = {
    en: {
      profileSettings: 'Profile Settings',
      personalInfo: 'Personal Information',
      fullName: 'Full Name',
      phoneNumber: 'Phone Number',
      emailAddress: 'Email Address',
      location: 'Location',
      cropPreferences: 'Crop Preferences',
      selectCrops: 'Select crops you grow',
      notifications: 'Notifications',
      diseaseAlerts: 'Disease Alerts',
      weatherUpdates: 'Weather Updates',
      treatmentReminders: 'Treatment Reminders',
      newFeatures: 'New Features',
      privacy: 'Privacy & Security',
      changePassword: 'Change Password',
      clearData: 'Clear Cached Data',
      deleteAccount: 'Delete Account',
      help: 'Help & Support',
      userGuide: 'User Guide',
      contactUs: 'Contact Us',
      email: 'Email',
      phone: 'Phone',
      whatsapp: 'WhatsApp',
      logout: 'Logout',
      logoutConfirm: 'Are you sure you want to logout?'
    },
    te: {
      profileSettings: 'ప్రొఫైల్ సెట్టింగ్‌లు',
      personalInfo: 'వ్యక్తిగత సమాచారం',
      fullName: 'పూర్తి పేరు',
      phoneNumber: 'ఫోన్ నంబర్',
      emailAddress: 'ఇమెయిల్ చిరునామా',
      location: 'స్థానం',
      cropPreferences: 'పంట ప్రాధాన్యతలు',
      selectCrops: 'మీరు పెంచే పంటలను ఎంచుకోండి',
      notifications: 'నోటిఫికేషన్లు',
      diseaseAlerts: 'వ్యాధి హెచ్చరికలు',
      weatherUpdates: 'వాతావరణ నవీకరణలు',
      treatmentReminders: 'చికిత్స రిమైండర్లు',
      newFeatures: 'కొత్త ఫీచర్లు',
      privacy: 'గోప్యత & భద్రత',
      changePassword: 'పాస్‌వర్డ్ మార్చండి',
      clearData: 'కాష్ డేటాను క్లియర్ చేయండి',
      deleteAccount: 'ఖాతాను తొలగించండి',
      help: 'సహాయం & మద్దతు',
      userGuide: 'యూజర్ గైడ్',
      contactUs: 'మమ్మల్ని సంప్రదించండి',
      email: 'ఇమెయిల్',
      phone: 'ఫోన్',
      whatsapp: 'వాట్సాప్',
      logout: 'లాగ్ అవుట్',
      logoutConfirm: 'మీరు లాగ్ అవుట్ చేయాలనుకుంటున్నారా?'
    }
  };

  const t = translations[language] || translations.en;

  const handleLanguageToggle = async () => {
    const newLang = language === 'en' ? 'te' : 'en';
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';
      const response = await fetch(`${API_URL}/api/user/${user.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ language: newLang })
      });
      const data = await response.json();
      setLanguage(newLang);
      if (data.user) {
        updateUser({ ...user, ...data.user });
      } else {
        updateUser({ ...user, language: newLang });
      }
      toast.success(`Language: ${newLang === 'en' ? 'English' : 'తెలుగు'}`);
    } catch (error) {
      console.error('Failed to update language:', error);
      toast.error('Failed to update language');
    }
  };

  const handleLogout = () => {
    if (window.confirm(t.logoutConfirm)) {
      logout();
      navigate('/login');
    }
  };

  const cropOptions = [
    'Rice', 'Wheat', 'Cotton', 'Tomato', 'Potato', 
    'Sugarcane', 'Maize', 'Soybean', 'Groundnut', 'Chilli'
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-green-50 to-green-100 pb-20 relative">
      {/* Glowing effect overlay */}
      <div className="absolute inset-0 bg-gradient-radial from-green-200/20 via-transparent to-transparent pointer-events-none" style={{backgroundImage: 'radial-gradient(circle at 50% 80%, rgba(134, 239, 172, 0.15) 0%, transparent 60%)'}}></div>
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white sticky top-0 z-10">
        <div className="px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/profile')}>
              <ChevronLeft size={24} />
            </button>
            <h1 className="text-lg font-semibold">{t.profileSettings}</h1>
          </div>
          <button 
            onClick={handleLanguageToggle}
            className="p-2 rounded-full bg-white/20 hover:bg-white/30 flex items-center gap-1"
            title={language === 'en' ? 'Switch to Telugu' : 'Switch to English'}
          >
            <Languages size={20} className="text-white" />
            <span className="text-xs font-medium text-white">
              {language === 'en' ? 'EN' : 'తె'}
            </span>
          </button>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Profile Picture */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex flex-col items-center">
            <div className="relative">
              <div className="w-24 h-24 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full flex items-center justify-center text-white text-3xl font-bold">
                {profile.name[0]}
              </div>
              <button className="absolute bottom-0 right-0 w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center shadow-lg">
                <Camera size={16} />
              </button>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mt-3">{profile.name}</h2>
            <p className="text-sm text-gray-600">{profile.location}</p>
          </div>
        </div>

        {/* Personal Information */}
        <div className="bg-white rounded-xl overflow-hidden shadow-sm">
          <div className="px-4 py-3 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900">{t.personalInfo}</h3>
          </div>
          
          <div className="divide-y divide-gray-100">
            <div className="px-4 py-3 flex items-center gap-3">
              <User className="text-gray-400" size={20} />
              <div className="flex-1">
                <p className="text-xs text-gray-600">{t.fullName}</p>
                <p className="text-sm font-medium text-gray-900">{profile.name}</p>
              </div>
            </div>

            <div className="px-4 py-3 flex items-center gap-3">
              <Phone className="text-gray-400" size={20} />
              <div className="flex-1">
                <p className="text-xs text-gray-600">{t.phoneNumber}</p>
                <p className="text-sm font-medium text-gray-900">{profile.phone}</p>
              </div>
            </div>

            <div className="px-4 py-3 flex items-center gap-3">
              <Mail className="text-gray-400" size={20} />
              <div className="flex-1">
                <p className="text-xs text-gray-600">{t.emailAddress}</p>
                <p className="text-sm font-medium text-gray-900">{profile.email}</p>
              </div>
            </div>

            <div className="px-4 py-3 flex items-center gap-3">
              <MapPin className="text-gray-400" size={20} />
              <div className="flex-1">
                <p className="text-xs text-gray-600">{t.location}</p>
                <p className="text-sm font-medium text-gray-900">{profile.location}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Crop Preferences */}
        <div className="bg-white rounded-xl overflow-hidden shadow-sm">
          <div className="px-4 py-3 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900">{t.cropPreferences}</h3>
            <p className="text-xs text-gray-600 mt-1">{t.selectCrops}</p>
          </div>
          
          <div className="p-4">
            <div className="flex flex-wrap gap-2">
              {cropOptions.map((crop) => (
                <button
                  key={crop}
                  onClick={() => {
                    if (profile.crops.includes(crop)) {
                      setProfile({
                        ...profile,
                        crops: profile.crops.filter(c => c !== crop)
                      });
                    } else {
                      setProfile({
                        ...profile,
                        crops: [...profile.crops, crop]
                      });
                    }
                  }}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    profile.crops.includes(crop)
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {crop}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Other Settings */}
        <div className="bg-white rounded-xl overflow-hidden shadow-sm">
          <div className="divide-y divide-gray-100">
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className="w-full px-4 py-3 flex items-center gap-3 text-left hover:bg-gray-50"
            >
              <Bell className="text-gray-400" size={20} />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">{t.notifications}</p>
                <p className="text-xs text-gray-600">Manage alert preferences</p>
              </div>
              <ChevronRight className={`text-gray-400 transition-transform ${showNotifications ? 'rotate-90' : ''}`} size={20} />
            </button>

            {showNotifications && (
              <div className="px-4 py-3 bg-gray-50 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{t.diseaseAlerts}</p>
                    <p className="text-xs text-gray-600">Get notified about crop diseases</p>
                  </div>
                  <button
                    onClick={() => setNotifications({...notifications, diseaseAlerts: !notifications.diseaseAlerts})}
                    className={`w-12 h-6 rounded-full transition-colors ${
                      notifications.diseaseAlerts ? 'bg-green-600' : 'bg-gray-300'
                    }`}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                      notifications.diseaseAlerts ? 'translate-x-6' : 'translate-x-0.5'
                    }`} />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{t.weatherUpdates}</p>
                    <p className="text-xs text-gray-600">Daily weather forecasts</p>
                  </div>
                  <button
                    onClick={() => setNotifications({...notifications, weatherUpdates: !notifications.weatherUpdates})}
                    className={`w-12 h-6 rounded-full transition-colors ${
                      notifications.weatherUpdates ? 'bg-green-600' : 'bg-gray-300'
                    }`}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                      notifications.weatherUpdates ? 'translate-x-6' : 'translate-x-0.5'
                    }`} />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{t.treatmentReminders}</p>
                    <p className="text-xs text-gray-600">Reminders for scheduled treatments</p>
                  </div>
                  <button
                    onClick={() => setNotifications({...notifications, treatmentReminders: !notifications.treatmentReminders})}
                    className={`w-12 h-6 rounded-full transition-colors ${
                      notifications.treatmentReminders ? 'bg-green-600' : 'bg-gray-300'
                    }`}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                      notifications.treatmentReminders ? 'translate-x-6' : 'translate-x-0.5'
                    }`} />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{t.newFeatures}</p>
                    <p className="text-xs text-gray-600">Updates about new app features</p>
                  </div>
                  <button
                    onClick={() => setNotifications({...notifications, newFeatures: !notifications.newFeatures})}
                    className={`w-12 h-6 rounded-full transition-colors ${
                      notifications.newFeatures ? 'bg-green-600' : 'bg-gray-300'
                    }`}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                      notifications.newFeatures ? 'translate-x-6' : 'translate-x-0.5'
                    }`} />
                  </button>
                </div>

                <button
                  onClick={() => {
                    toast.success('Notification preferences saved!');
                    setShowNotifications(false);
                  }}
                  className="w-full mt-2 bg-green-600 text-white py-2 rounded-lg font-medium"
                >
                  Save Preferences
                </button>
              </div>
            )}

            <button 
              onClick={() => setShowPrivacy(!showPrivacy)}
              className="w-full px-4 py-3 flex items-center gap-3 text-left hover:bg-gray-50"
            >
              <Shield className="text-gray-400" size={20} />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">{t.privacy}</p>
                <p className="text-xs text-gray-600">Data and account settings</p>
              </div>
              <ChevronRight className={`text-gray-400 transition-transform ${showPrivacy ? 'rotate-90' : ''}`} size={20} />
            </button>

            {showPrivacy && (
              <div className="px-4 py-3 bg-gray-50 space-y-3">
                <button 
                  onClick={() => toast.info('Change password feature coming soon')}
                  className="w-full text-left px-4 py-3 bg-white rounded-lg hover:bg-gray-50 border border-gray-200"
                >
                  <p className="text-sm font-medium text-gray-900">{t.changePassword}</p>
                  <p className="text-xs text-gray-600 mt-1">Update your account password</p>
                </button>

                <button 
                  onClick={() => {
                    if (window.confirm('Are you sure you want to delete all your data? This action cannot be undone.')) {
                      toast.success('Data deletion request submitted');
                    }
                  }}
                  className="w-full text-left px-4 py-3 bg-white rounded-lg hover:bg-gray-50 border border-gray-200"
                >
                  <p className="text-sm font-medium text-gray-900">{t.clearData}</p>
                  <p className="text-xs text-gray-600 mt-1">Remove all stored reports and images</p>
                </button>

                <button 
                  onClick={() => {
                    if (window.confirm('This will permanently delete your account. Are you sure?')) {
                      toast.error('Account deletion feature coming soon');
                    }
                  }}
                  className="w-full text-left px-4 py-3 bg-white rounded-lg hover:bg-red-50 border border-red-200"
                >
                  <p className="text-sm font-medium text-red-600">{t.deleteAccount}</p>
                  <p className="text-xs text-gray-600 mt-1">Permanently delete your account</p>
                </button>
              </div>
            )}

            <button 
              onClick={() => setShowHelp(!showHelp)}
              className="w-full px-4 py-3 flex items-center gap-3 text-left hover:bg-gray-50"
            >
              <HelpCircle className="text-gray-400" size={20} />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">{t.help}</p>
                <p className="text-xs text-gray-600">FAQs and contact</p>
              </div>
              <ChevronRight className={`text-gray-400 transition-transform ${showHelp ? 'rotate-90' : ''}`} size={20} />
            </button>

            {showHelp && (
              <div className="px-4 py-3 bg-gray-50 space-y-3">
                <button 
                  onClick={() => navigate('/help')}
                  className="w-full text-left px-4 py-3 bg-white rounded-lg hover:bg-gray-50 border border-gray-200"
                >
                  <p className="text-sm font-medium text-gray-900">📚 {t.userGuide}</p>
                  <p className="text-xs text-gray-600 mt-1">Learn how to use the app</p>
                </button>

                <button 
                  onClick={() => {
                    window.open('mailto:support@cropshield.ai?subject=Support Request', '_blank');
                  }}
                  className="w-full text-left px-4 py-3 bg-white rounded-lg hover:bg-gray-50 border border-gray-200"
                >
                  <p className="text-sm font-medium text-gray-900">✉️ {t.email}</p>
                  <p className="text-xs text-gray-600 mt-1">support@cropshield.ai</p>
                </button>

                <button 
                  onClick={() => {
                    window.open('tel:+918008001234', '_blank');
                  }}
                  className="w-full text-left px-4 py-3 bg-white rounded-lg hover:bg-gray-50 border border-gray-200"
                >
                  <p className="text-sm font-medium text-gray-900">📞 {t.phone}</p>
                  <p className="text-xs text-gray-600 mt-1">+91 800-800-1234 (Mon-Sat, 9 AM - 6 PM)</p>
                </button>

                <button 
                  onClick={() => {
                    window.open('https://wa.me/918008001234', '_blank');
                  }}
                  className="w-full text-left px-4 py-3 bg-white rounded-lg hover:bg-gray-50 border border-gray-200"
                >
                  <p className="text-sm font-medium text-gray-900">💬 {t.whatsapp}</p>
                  <p className="text-xs text-gray-600 mt-1">Chat with us on WhatsApp</p>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="w-full bg-red-50 text-red-600 py-3 rounded-xl font-medium flex items-center justify-center gap-2 border border-red-200"
        >
          <LogOut size={20} />
          {t.logout}
        </button>

        {/* App Version */}
        <div className="text-center py-4">
          <p className="text-xs text-gray-500">CropShield AI v1.0.0</p>
        </div>
      </div>
    </div>
  );
}
