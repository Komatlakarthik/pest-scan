import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, MapPin, TrendingUp, AlertTriangle, CheckCircle, Calendar, ChevronRight } from 'lucide-react';
import useAuthStore from '../store/authStore';
import axios from 'axios';
import toast from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export default function Fields() {
  const navigate = useNavigate();
  const { user, token } = useAuthStore();
  const [fields, setFields] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      fetchFields();
    }
  }, [user]);

  const fetchFields = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/api/fields/user/${user.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFields(response.data.fields || mockFields);
    } catch (error) {
      setFields(mockFields);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'healthy': return 'bg-green-100 text-green-700 border-green-500';
      case 'warning': return 'bg-orange-100 text-orange-700 border-orange-500';
      case 'critical': return 'bg-red-100 text-red-700 border-red-500';
      default: return 'bg-gray-100 text-gray-700 border-gray-500';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'healthy': return <CheckCircle size={16} />;
      case 'warning': return <AlertTriangle size={16} />;
      case 'critical': return <AlertTriangle size={16} />;
      default: return <TrendingUp size={16} />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20">
        <div className="bg-white border-b border-gray-200 p-4 sticky top-0 z-10">
          <h1 className="text-xl font-bold text-gray-900">My Fields</h1>
        </div>
        <div className="p-4 space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-xl overflow-hidden shadow-sm animate-pulse">
              <div className="h-40 bg-gray-200" />
              <div className="p-4">
                <div className="h-4 bg-gray-200 rounded mb-2" />
                <div className="h-3 bg-gray-200 rounded w-2/3" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-green-50 to-green-100 pb-20 relative">
      {/* Glowing effect overlay */}
      <div className="absolute inset-0 bg-gradient-radial from-green-200/20 via-transparent to-transparent pointer-events-none" style={{backgroundImage: 'radial-gradient(circle at 50% 80%, rgba(134, 239, 172, 0.15) 0%, transparent 60%)'}}></div>
      
      {/* Header */}
      <div className="bg-gradient-to-r from-green-700 via-green-600 to-emerald-600 border-b border-green-800 p-4 sticky top-0 z-10 shadow-lg shadow-green-900/30 relative">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">My Fields</h1>
            <p className="text-sm text-green-100 mt-1">{fields.length} fields registered</p>
          </div>
          <button
            onClick={() => navigate('/add-field')}
            className="w-10 h-10 bg-white text-green-600 rounded-full flex items-center justify-center shadow-lg hover:bg-green-50"
          >
            <Plus size={24} />
          </button>
        </div>
      </div>

      {/* Fields Grid */}
      <div className="p-4 space-y-4">
        {fields.map((field) => (
          <div
            key={field.id}
            onClick={() => navigate(`/field-details/${field.id}`)}
            className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer"
          >
            {/* Field Image */}
            <div className="relative h-40">
              {field.image ? (
                <img
                  src={field.image}
                  alt={field.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-green-400 via-emerald-500 to-green-600 flex items-center justify-center">
                  <div className="text-6xl opacity-50">🌾</div>
                </div>
              )}
              
              {/* Status Badge */}
              <div className={`absolute top-3 right-3 px-3 py-1 rounded-full border-2 backdrop-blur-sm flex items-center gap-1.5 ${getStatusColor(field.status)}`}>
                {getStatusIcon(field.status)}
                <span className="text-xs font-semibold capitalize">{field.status}</span>
              </div>

              {/* Confidence Badge */}
              {field.confidence && (
                <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full">
                  <span className="text-sm font-bold text-gray-900">{field.confidence}%</span>
                </div>
              )}
            </div>

            {/* Field Info */}
            <div className="p-4">
              <h3 className="font-bold text-gray-900 text-lg mb-2">{field.name}</h3>
              
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <MapPin size={14} />
                  <span>{field.location}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar size={14} />
                  <span>{field.plantedDate}</span>
                </div>
              </div>

              {/* Crop Tags */}
              <div className="flex flex-wrap gap-2 mb-3">
                {field.crops.map((crop, idx) => (
                  <span
                    key={idx}
                    className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full"
                  >
                    {crop}
                  </span>
                ))}
              </div>

              {/* Stats */}
              <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <div className="text-center flex-1">
                  <div className="text-lg font-bold text-gray-900">{field.size}</div>
                  <div className="text-xs text-gray-600">Acres</div>
                </div>
                <div className="text-center flex-1 border-l border-gray-100">
                  <div className="text-lg font-bold text-gray-900">{field.scans}</div>
                  <div className="text-xs text-gray-600">Scans</div>
                </div>
                <div className="text-center flex-1 border-l border-gray-100">
                  <div className="text-lg font-bold text-gray-900">{field.alerts}</div>
                  <div className="text-xs text-gray-600">Alerts</div>
                </div>
              </div>

              {/* View Details */}
              <button className="w-full mt-3 bg-gray-50 text-gray-700 py-2 rounded-lg font-medium text-sm flex items-center justify-center gap-2 hover:bg-gray-100 transition-colors">
                View Details
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        ))}

        {/* Empty State */}
        {fields.length === 0 && (
          <div className="bg-white rounded-xl p-8 text-center shadow-sm">
            <div className="text-6xl mb-4">🌾</div>
            <h3 className="font-semibold text-gray-900 mb-2">No Fields Added</h3>
            <p className="text-sm text-gray-600 mb-4">
              Add your first field to start monitoring crop health
            </p>
            <button
              onClick={() => navigate('/add-field')}
              className="bg-green-600 text-white px-6 py-2 rounded-lg font-medium"
            >
              Add Your First Field
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

const mockFields = [
  {
    id: 1,
    name: 'Tomato Field A',
    location: 'Pune, Maharashtra',
    crops: ['Tomato', 'Roma Variety'],
    size: '2.5',
    plantedDate: 'Mar 2025',
    status: 'healthy',
    confidence: 92,
    scans: 12,
    alerts: 1,
    image: null
  },
  {
    id: 2,
    name: 'Wheat Crop B',
    location: 'Nashik, Maharashtra',
    crops: ['Wheat', 'Durum'],
    size: '5.0',
    plantedDate: 'Jan 2025',
    status: 'warning',
    confidence: 87,
    scans: 8,
    alerts: 3,
    image: null
  },
  {
    id: 3,
    name: 'Rice Paddy C',
    location: 'Satara, Maharashtra',
    crops: ['Rice', 'Basmati'],
    size: '3.2',
    plantedDate: 'Feb 2025',
    status: 'healthy',
    confidence: 94,
    scans: 15,
    alerts: 0,
    image: null
  }
];
