import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Phone, Mail, Globe, LogOut, ChevronRight, Settings, HelpCircle, Bell, Edit2, Save, X, Languages } from 'lucide-react';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export default function Profile() {
  const { user, logout, token, updateUser } = useAuthStore();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [language, setLanguage] = useState(user?.language || 'en');
  const [stats, setStats] = useState({ reportCount: 0, fieldCount: 0, orderCount: 0 });
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState({
    diseaseAlerts: true,
    weatherUpdates: true,
    treatmentReminders: true,
    newFeatures: false
  });
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    language: user?.language || 'en'
  });

  useEffect(() => {
    if (user?.id && token) {
      fetchProfile();
    }
  }, [user, token]);

  const fetchProfile = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/user/${user.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(response.data.stats || { reportCount: 0, fieldCount: 0, orderCount: 0 });
      if (response.data.email) {
        setFormData(prev => ({ ...prev, email: response.data.email }));
      }
      if (response.data.language) {
        setFormData(prev => ({ ...prev, language: response.data.language }));
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    }
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error('Name is required');
      return;
    }
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      toast.error('Invalid email format');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.put(
        `${API_URL}/api/user/${user.id}`,
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      updateUser(response.data.user || response.data);
      setIsEditing(false);
      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Update failed:', error);
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: user?.name || '',
      email: user?.email || '',
      language: user?.language || 'en'
    });
    setIsEditing(false);
  };

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const handleLanguageToggle = async () => {
    const newLang = language === 'en' ? 'te' : 'en';
    try {
      const response = await axios.put(
        `${API_URL}/api/user/${user.id}`,
        { language: newLang },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log('Language update response:', response.data);
      setLanguage(newLang);
      // Update user in auth store with the response user object
      if (response.data.user) {
        updateUser({ ...user, ...response.data.user });
      } else {
        updateUser({ ...user, language: newLang });
      }
      setFormData({ ...formData, language: newLang });
      toast.success(`Language: ${newLang === 'en' ? 'English' : 'తెలుగు'}`);
    } catch (error) {
      console.error('Failed to update language:', error);
      console.error('Error response:', error.response?.data);
      toast.error(error.response?.data?.message || 'Failed to update language');
    }
  };

  const menuItems = [
    { icon: Settings, label: 'Settings', action: () => navigate('/settings') },
    { icon: Bell, label: 'Notifications', badge: '3', action: () => toast.info('Coming soon!') },
    { icon: HelpCircle, label: 'Help & Support', action: () => navigate('/help') },
  ];

  const translations = {
    en: {
      profile: 'Profile',
      manageAccount: 'Manage your account',
      personalInfo: 'Personal Information',
      name: 'Name',
      phoneNumber: 'Phone Number',
      emailAddress: 'Email Address',
      language: 'Language',
      english: 'English',
      telugu: 'Telugu',
      settings: 'Settings',
      notifications: 'Notifications',
      helpSupport: 'Help & Support',
      logout: 'Logout',
      edit: 'Edit',
      save: 'Save',
      cancel: 'Cancel',
      saveChanges: 'Save Changes',
      comingSoon: 'Coming soon!',
      diseaseAlerts: 'Disease Alerts',
      weatherUpdates: 'Weather Updates',
      treatmentReminders: 'Treatment Reminders',
      newFeatures: 'New Features',
      savePreferences: 'Save Preferences',
      manageAlertPreferences: 'Manage alert preferences'
    },
    te: {
      profile: 'ప్రొఫైల్',
      manageAccount: 'మీ ఖాతాను నిర్వహించండి',
      personalInfo: 'వ్యక్తిగత సమాచారం',
      name: 'పేరు',
      phoneNumber: 'ఫోన్ నంబర్',
      emailAddress: 'ఇమెయిల్ చిరునామా',
      language: 'భాష',
      english: 'ఆంగ్లం',
      telugu: 'తెలుగు',
      settings: 'సెట్టింగ్‌లు',
      notifications: 'నోటిఫికేషన్లు',
      helpSupport: 'సహాయం & మద్దతు',
      logout: 'లాగ్ అవుట్',
      edit: 'సవరించు',
      save: 'సేవ్ చేయి',
      cancel: 'రద్దు చేయి',
      saveChanges: 'మార్పులను సేవ్ చేయండి',
      comingSoon: 'త్వరలో వస్తోంది!',
      diseaseAlerts: 'వ్యాధి హెచ్చరికలు',
      weatherUpdates: 'వాతావరణ నవీకరణలు',
      treatmentReminders: 'చికిత్స రిమైండర్లు',
      newFeatures: 'క్రొత్త ఫీచర్లు',
      savePreferences: 'ప్రాధాన్యతలను సేవ్ చేయండి',
      manageAlertPreferences: 'హెచ్చరిక ప్రాధాన్యతలను నిర్వహించండి'
    }
  };

  const t = translations[language] || translations.en;

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-green-50 to-green-100 pb-6 relative">
      {/* Glowing effect overlay */}
      <div className="absolute inset-0 bg-gradient-radial from-green-200/20 via-transparent to-transparent pointer-events-none" style={{backgroundImage: 'radial-gradient(circle at 50% 80%, rgba(134, 239, 172, 0.15) 0%, transparent 60%)'}}></div>
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-500 to-emerald-700 text-white p-6 pb-8 safe-top">
        <div className="max-w-screen-xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-1">{t.profile}</h1>
            <p className="text-emerald-100">{t.manageAccount}</p>
          </div>
          <div className="flex items-center gap-2">
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
            {!isEditing ? (
              <button 
                onClick={() => setIsEditing(true)}
                className="p-2 rounded-full bg-white/20 hover:bg-white/30"
              >
                <Edit2 size={20} className="text-white" />
              </button>
            ) : (
              <div className="flex gap-2">
              <button 
                onClick={handleCancel}
                disabled={loading}
                className="p-2 rounded-full bg-white/20 hover:bg-white/30 disabled:opacity-50"
              >
                <X size={20} className="text-white" />
              </button>
              <button 
                onClick={handleSave}
                disabled={loading}
                className="p-2 rounded-full bg-white hover:bg-white/90 disabled:opacity-50"
              >
                <Save size={20} className="text-primary-500" />
              </button>
            </div>
          )}
          </div>
        </div>
      </div>

      <div className="max-w-screen-xl mx-auto px-4 -mt-4">
        {/* Profile Card */}
        <div className="bg-white rounded-xl p-6 shadow-sm mb-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-20 h-20 bg-gradient-to-br from-primary-400 to-emerald-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
              {(formData.name || user?.name)?.charAt(0) || 'F'}
            </div>
            <div className="flex-1">
              {isEditing ? (
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="text-xl font-bold text-gray-900 border-b-2 border-primary-500 focus:outline-none w-full"
                  placeholder="Your name"
                />
              ) : (
                <h2 className="text-xl font-bold text-gray-900">{user?.name || 'Farmer'}</h2>
              )}
              <p className="text-sm text-gray-500">{user?.role || 'Farmer'}</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-3 text-gray-700">
              <Phone size={20} className="text-gray-400" />
              <div className="flex-1">
                <p className="text-xs text-gray-500">{t.phoneNumber}</p>
                <span className="text-sm">{user?.phone || 'Not provided'}</span>
              </div>
            </div>
            <div className="flex items-center gap-3 text-gray-700">
              <Mail size={20} className="text-gray-400" />
              <div className="flex-1">
                <p className="text-xs text-gray-500">{t.emailAddress}</p>
                {isEditing ? (
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="text-sm w-full border-b border-primary-500 focus:outline-none"
                    placeholder="your@email.com"
                  />
                ) : (
                  <span className="text-sm">{user?.email || 'Not provided'}</span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3 text-gray-700">
              <Globe size={20} className="text-gray-400" />
              <div className="flex-1">
                <p className="text-xs text-gray-500">{t.language}</p>
                {isEditing ? (
                  <select
                    value={formData.language}
                    onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                    className="text-sm w-full border-b border-primary-500 focus:outline-none"
                  >
                    <option value="en">{t.english}</option>
                    <option value="te">{t.telugu}</option>
                  </select>
                ) : (
                  <span className="text-sm">{formData.language === 'en' ? t.english : t.telugu}</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Menu */}
        <div className="bg-white rounded-xl shadow-sm divide-y divide-gray-100">
          <button
            onClick={() => navigate('/settings')}
            className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Settings size={20} className="text-gray-400" />
              <span className="text-gray-700">{t.settings}</span>
            </div>
            <ChevronRight size={20} className="text-gray-400" />
          </button>
          
          {/* Notifications Section */}
          <div>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Bell size={20} className="text-gray-400" />
                <div className="flex-1 text-left">
                  <span className="text-gray-700">{t.notifications}</span>
                  <p className="text-xs text-gray-500">{t.manageAlertPreferences}</p>
                </div>
              </div>
              <ChevronRight size={20} className={`text-gray-400 transition-transform ${showNotifications ? 'rotate-90' : ''}`} />
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
                  {t.savePreferences}
                </button>
              </div>
            )}
          </div>
          
          <button
            onClick={() => navigate('/help')}
            className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <HelpCircle size={20} className="text-gray-400" />
              <span className="text-gray-700">{t.helpSupport}</span>
            </div>
            <ChevronRight size={20} className="text-gray-400" />
          </button>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-between p-4 hover:bg-red-50 transition-colors text-red-600"
          >
            <div className="flex items-center gap-3">
              <LogOut size={20} />
              <span className="font-medium">{t.logout}</span>
            </div>
          </button>
        </div>

        {/* App Version */}
        <p className="text-center text-xs text-gray-500 mt-6">
          Smart Pest Doctor v1.0.0
        </p>
      </div>
    </div>
  );
}
