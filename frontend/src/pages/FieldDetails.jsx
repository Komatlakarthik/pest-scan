import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Calendar, Activity, TrendingUp, AlertTriangle, Leaf, DollarSign, BarChart3, Droplets, Camera, BookOpen } from 'lucide-react';
import useAuthStore from '../store/authStore';
import api from '../utils/axios';
import toast from 'react-hot-toast';

// Market price data (simulated - in production, fetch from commodity API)
const marketPrices = {
  'Tomato': { current: 25, previous: 22, unit: 'kg', trend: 'up', change: 13.6 },
  'Wheat': { current: 2100, previous: 2050, unit: 'quintal', trend: 'up', change: 2.4 },
  'Rice': { current: 2800, previous: 2750, unit: 'quintal', trend: 'up', change: 1.8 },
  'Cotton': { current: 7200, previous: 7500, unit: 'quintal', trend: 'down', change: -4.0 },
  'Potato': { current: 18, previous: 20, unit: 'kg', trend: 'down', change: -10.0 },
  'Onion': { current: 30, previous: 28, unit: 'kg', trend: 'up', change: 7.1 },
  'Sugarcane': { current: 315, previous: 310, unit: 'quintal', trend: 'up', change: 1.6 },
  'Corn': { current: 1900, previous: 1850, unit: 'quintal', trend: 'up', change: 2.7 },
};

export default function FieldDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = useAuthStore();
  const [field, setField] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id && token) {
      fetchFieldDetails();
    }
  }, [id, token]);

  const fetchFieldDetails = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/api/fields/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setField(response.data.field);
    } catch (error) {
      console.error('Field fetch error:', error);
      if (error.response?.status !== 401) {
        toast.error('Failed to load field details');
        navigate('/');
      }
    } finally {
      setLoading(false);
    }
  };

  const getHealthColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'healthy': return 'bg-green-500';
      case 'warning': return 'bg-orange-500';
      case 'critical': return 'bg-red-500';
      default: return 'bg-green-500';
    }
  };

  const getHealthTextColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'healthy': return 'text-green-600';
      case 'warning': return 'text-orange-600';
      case 'critical': return 'text-red-600';
      default: return 'text-green-600';
    }
  };

  const getCropEmoji = (cropType) => {
    const emojis = {
      'Tomato': '🍅',
      'Wheat': '🌾',
      'Rice': '🌱',
      'Cotton': '☁️',
      'Potato': '🥔',
      'Onion': '🧅',
      'Sugarcane': '🎋',
      'Corn': '🌽',
    };
    return emojis[cropType] || '🌿';
  };

  const getMarketPrice = (cropType) => {
    return marketPrices[cropType] || { current: 0, previous: 0, unit: 'kg', trend: 'neutral', change: 0 };
  };

  const calculateEstimatedValue = () => {
    if (!field) return 0;
    const price = getMarketPrice(field.cropType);
    const areaInHectares = parseFloat(field.size) || 0;
    
    // Average yield estimates per hectare
    const yieldEstimates = {
      'Tomato': 40000, // 40 tons/hectare
      'Wheat': 35, // 35 quintals/hectare
      'Rice': 40, // 40 quintals/hectare
      'Cotton': 18, // 18 quintals/hectare
      'Potato': 25000, // 25 tons/hectare
      'Onion': 30000, // 30 tons/hectare
      'Sugarcane': 700, // 700 quintals/hectare
      'Corn': 50, // 50 quintals/hectare
    };

    const expectedYield = yieldEstimates[field.cropType] || 0;
    return (expectedYield * price.current * areaInHectares).toFixed(0);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (!field) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Field not found</p>
      </div>
    );
  }

  const marketPrice = getMarketPrice(field.cropType);
  const estimatedValue = calculateEstimatedValue();

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-green-50 to-green-100 pb-6 relative">
      {/* Glowing effect overlay */}
      <div className="absolute inset-0 bg-gradient-radial from-green-200/20 via-transparent to-transparent pointer-events-none" style={{backgroundImage: 'radial-gradient(circle at 50% 80%, rgba(134, 239, 172, 0.15) 0%, transparent 60%)'}}></div>
      {/* Header */}
      <div className="bg-gradient-to-r from-green-700 via-green-600 to-emerald-600 border-b border-green-800 px-4 py-3 sticky top-0 z-10 shadow-lg shadow-green-900/30">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 hover:bg-white/20 rounded-full">
            <ArrowLeft size={20} className="text-white" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-white">{field.name}</h1>
            <p className="text-xs text-green-100">{field.cropType} Field</p>
          </div>
        </div>
      </div>

      {/* Field Image/Banner */}
      <div className="relative h-48 bg-gradient-to-br from-green-100 via-emerald-50 to-green-200">
        <div className="absolute inset-0 flex items-center justify-center text-8xl">
          {getCropEmoji(field.cropType)}
        </div>
        <div className={`absolute top-4 right-4 px-3 py-1 rounded-full ${getHealthColor(field.status)} text-white text-xs font-semibold shadow-lg`}>
          {field.status?.toUpperCase() || 'HEALTHY'}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="px-4 py-4 bg-white border-b border-gray-200">
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{field.size}</div>
            <div className="text-xs text-gray-500">Hectares</div>
          </div>
          <div className="text-center border-l border-r border-gray-200">
            <div className="text-2xl font-bold text-gray-900">{field.recentReports?.length || 0}</div>
            <div className="text-xs text-gray-500">Scans</div>
          </div>
          <div className="text-center">
            <div className={`text-2xl font-bold ${getHealthTextColor(field.status)}`}>
              {field.confidence || 95}%
            </div>
            <div className="text-xs text-gray-500">Confidence</div>
          </div>
        </div>
      </div>

      {/* Market Price Section */}
      <div className="px-4 py-4">
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-green-100 rounded-lg">
                <DollarSign size={20} className="text-primary-500" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Market Price</h3>
                <p className="text-xs text-gray-500">Current rates for {field.cropType}</p>
              </div>
            </div>
            <div className={`flex items-center gap-1 ${marketPrice.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
              <TrendingUp size={16} className={marketPrice.trend === 'down' ? 'rotate-180' : ''} />
              <span className="text-sm font-semibold">{Math.abs(marketPrice.change)}%</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500 mb-1">Current Price</p>
              <p className="text-xl font-bold text-gray-900">₹{marketPrice.current}</p>
              <p className="text-xs text-gray-500">per {marketPrice.unit}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500 mb-1">Previous Price</p>
              <p className="text-xl font-bold text-gray-600">₹{marketPrice.previous}</p>
              <p className="text-xs text-gray-500">per {marketPrice.unit}</p>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Estimated Field Value</span>
              <span className="text-lg font-bold text-primary-500">₹{parseInt(estimatedValue).toLocaleString('en-IN')}</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">Based on average yield per hectare</p>
          </div>
        </div>
      </div>

      {/* Field Information */}
      <div className="px-4 pb-4">
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Leaf size={18} className="text-primary-500" />
            Field Information
          </h3>
          
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <MapPin size={18} className="text-gray-400 mt-0.5" />
              <div className="flex-1">
                <p className="text-xs text-gray-500">Location</p>
                <p className="text-sm text-gray-900 font-medium">{field.location || 'Not specified'}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Calendar size={18} className="text-gray-400 mt-0.5" />
              <div className="flex-1">
                <p className="text-xs text-gray-500">Planted Date</p>
                <p className="text-sm text-gray-900 font-medium">
                  {field.plantedDate ? new Date(field.plantedDate).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  }) : 'Not specified'}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Activity size={18} className="text-gray-400 mt-0.5" />
              <div className="flex-1">
                <p className="text-xs text-gray-500">Crop Type</p>
                <p className="text-sm text-gray-900 font-medium">{field.cropType}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <BarChart3 size={18} className="text-gray-400 mt-0.5" />
              <div className="flex-1">
                <p className="text-xs text-gray-500">Field Size</p>
                <p className="text-sm text-gray-900 font-medium">{field.size} hectares</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Scans */}
      {field.recentReports && field.recentReports.length > 0 && (
        <div className="px-4 pb-4">
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Activity size={18} className="text-primary-500" />
              Recent Scans ({field.recentReports.length})
            </h3>
            
            <div className="space-y-3">
              {field.recentReports.map((report, index) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className={`w-2 h-2 rounded-full ${
                    report.severity === 'High' ? 'bg-red-500' :
                    report.severity === 'Medium' ? 'bg-orange-500' :
                    'bg-green-500'
                  }`} />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{report.disease}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(report.createdAt).toLocaleDateString('en-IN')} • {report.confidence}% confidence
                    </p>
                  </div>
                  <span className={`text-xs font-semibold px-2 py-1 rounded ${
                    report.severity === 'High' ? 'bg-red-100 text-red-700' :
                    report.severity === 'Medium' ? 'bg-orange-100 text-orange-700' :
                    'bg-green-100 text-green-700'
                  }`}>
                    {report.severity}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Weather Recommendations */}
      <div className="px-4 pb-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-4 shadow-sm text-white">
          <h3 className="font-semibold mb-2 flex items-center gap-2">
            <Droplets size={18} />
            Weather Advisory
          </h3>
          <p className="text-sm opacity-90">
            Ideal conditions for {field.cropType} growth. Monitor soil moisture levels and ensure adequate irrigation during dry spells.
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="px-4 pb-6">
        <div className="grid grid-cols-1 gap-3">
          <button
            onClick={() => navigate('/diagnose', { state: { selectedCrop: field.cropType, fieldId: field.id } })}
            className="flex items-center justify-center gap-2 bg-primary-500 text-white py-4 rounded-xl font-semibold shadow-lg hover:bg-primary-600 transition-all active:scale-95"
          >
            <Camera size={20} />
            Scan This Crop Now
          </button>
          
          <button
            onClick={() => navigate('/timeline', { state: { fieldId: field.id } })}
            className="flex items-center justify-center gap-2 bg-gray-900 text-white py-3 rounded-xl font-semibold shadow-sm hover:bg-gray-800 transition-colors w-full"
          >
            <BarChart3 size={18} />
            View History
          </button>
        </div>
      </div>
    </div>
  );
}
