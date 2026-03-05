import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Calendar, 
  Leaf, 
  CheckCircle, 
  Clock, 
  Trash2,
  Eye,
  Loader2,
  AlertTriangle
} from 'lucide-react';
import api from '../utils/axios';
import toast from 'react-hot-toast';
import useAuthStore from '../store/authStore';

export default function SavedTreatments() {
  const navigate = useNavigate();
  const { token } = useAuthStore();
  const [treatments, setTreatments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all', 'active', 'completed'

  useEffect(() => {
    fetchTreatments();
  }, [filter]);

  const fetchTreatments = async () => {
    setLoading(true);
    try {
      const params = filter !== 'all' ? `?status=${filter}` : '';
      const response = await api.get(`/api/treatment/plans${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTreatments(response.data.treatmentPlans || []);
    } catch (error) {
      console.error('Fetch treatments error:', error);
      if (error.response?.status !== 401) {
        toast.error('Failed to load treatments');
      }
    } finally {
      setLoading(false);
    }
  };

  const deleteTreatment = async (id) => {
    if (!confirm('Are you sure you want to delete this treatment plan?')) return;
    
    try {
      await api.delete(`/api/treatment/plans/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Treatment plan deleted');
      fetchTreatments();
    } catch (error) {
      console.error('Delete error:', error);
      if (error.response?.status !== 401) {
        toast.error('Failed to delete treatment');
      }
    }
  };

  const viewTreatment = (treatment) => {
    // Parse the treatmentData which is stored as JSON string
    const data = typeof treatment.treatmentData === 'string' 
      ? JSON.parse(treatment.treatmentData) 
      : treatment.treatmentData;
    
    navigate('/treatment', { 
      state: { 
        disease: treatment.disease,
        crop: treatment.cropType,
        severity: treatment.severity,
        // Pass the full treatment data for dynamic rendering
        savedTreatmentData: data,
        savedPlanId: treatment.id,
        isSaved: true,
        reportId: treatment.reportId,
        fieldId: treatment.fieldId
      }
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-700';
      case 'completed': return 'bg-blue-100 text-blue-700';
      case 'cancelled': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'high': return 'text-red-600';
      case 'moderate': return 'text-orange-600';
      case 'low': return 'text-green-600';
      default: return 'text-gray-600';
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
      'Corn': '🌽',
    };
    return emojis[cropType] || '🌿';
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-green-50 to-green-100 pb-20 relative">
      {/* Glowing effect overlay */}
      <div className="absolute inset-0 bg-gradient-radial from-green-200/20 via-transparent to-transparent pointer-events-none" style={{backgroundImage: 'radial-gradient(circle at 50% 80%, rgba(134, 239, 172, 0.15) 0%, transparent 60%)'}}></div>
      {/* Header */}
      <div className="bg-gradient-to-r from-green-700 via-green-600 to-emerald-600 border-b border-green-800 sticky top-0 z-10 shadow-lg shadow-green-900/30">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="p-2 -ml-2 hover:bg-white/20 rounded-full">
              <ArrowLeft size={20} className="text-white" />
            </button>
            <div>
              <h1 className="text-lg font-bold text-white">Saved Treatment Plans</h1>
              <p className="text-xs text-green-100">{treatments.length} plan{treatments.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex border-t border-green-800">
          {['all', 'active', 'completed'].map(status => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`flex-1 py-3 text-sm font-medium transition-colors capitalize ${
                filter === status
                  ? 'text-white border-b-2 border-white'
                  : 'text-green-100 hover:text-white'
                  ? 'text-green-600 border-b-2 border-green-600'
                  : 'text-gray-600'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-4">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="animate-spin h-8 w-8 text-green-600" />
          </div>
        ) : treatments.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Leaf className="text-gray-400" size={32} />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Treatment Plans</h3>
            <p className="text-gray-600 text-sm mb-4">
              {filter === 'all' 
                ? 'Scan crops and save treatment plans to view them here'
                : `No ${filter} treatment plans found`
              }
            </p>
            <button
              onClick={() => navigate('/diagnose')}
              className="bg-green-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-green-700"
            >
              Scan a Crop
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {treatments.map((treatment) => (
              <div key={treatment.id} className="bg-white rounded-xl p-4 shadow-sm">
                <div className="flex items-start gap-3">
                  {/* Crop Icon */}
                  <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-emerald-100 rounded-lg flex items-center justify-center text-2xl flex-shrink-0">
                    {getCropEmoji(treatment.cropType)}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 truncate">{treatment.disease}</h3>
                        <p className="text-sm text-gray-600">{treatment.cropType}</p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(treatment.status)}`}>
                        {treatment.status}
                      </span>
                    </div>

                    {/* Details */}
                    <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
                      <div className="flex items-center gap-1">
                        <AlertTriangle size={14} className={getSeverityColor(treatment.severity)} />
                        <span className="capitalize">{treatment.severity}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar size={14} />
                        <span>{new Date(treatment.startDate).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <CheckCircle size={14} />
                        <span>{treatment.progress}%</span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-gray-200 rounded-full h-1.5 mb-3">
                      <div 
                        className="bg-green-600 h-1.5 rounded-full transition-all"
                        style={{ width: `${treatment.progress}%` }}
                      />
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => viewTreatment(treatment)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700"
                      >
                        <Eye size={14} />
                        View Details
                      </button>
                      <button
                        onClick={() => deleteTreatment(treatment.id)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-600 text-sm font-medium rounded-lg hover:bg-red-100"
                      >
                        <Trash2 size={14} />
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
