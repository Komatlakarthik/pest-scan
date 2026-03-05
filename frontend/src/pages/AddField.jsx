import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Calendar, Leaf, BarChart3 } from 'lucide-react';
import useAuthStore from '../store/authStore';
import axios from 'axios';
import toast from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

const cropTypes = [
  { name: 'Tomato', emoji: '🍅' },
  { name: 'Wheat', emoji: '🌾' },
  { name: 'Rice', emoji: '🌱' },
  { name: 'Cotton', emoji: '☁️' },
  { name: 'Potato', emoji: '🥔' },
  { name: 'Onion', emoji: '🧅' },
  { name: 'Sugarcane', emoji: '🎋' },
  { name: 'Corn', emoji: '🌽' },
];

export default function AddField() {
  const navigate = useNavigate();
  const { user, token } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    cropType: '',
    size: '',
    plantedDate: ''
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.cropType || !formData.size) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(
        `${API_URL}/api/fields`,
        {
          userId: user.id,
          ...formData
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      toast.success('Field added successfully!');
      navigate('/fields');
    } catch (error) {
      console.error('Add field error:', error);
      toast.error(error.response?.data?.message || 'Failed to add field');
    } finally {
      setLoading(false);
    }
  };

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
            <h1 className="text-lg font-bold text-white">Add New Field</h1>
            <p className="text-xs text-green-100">Register a new crop field</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-4 space-y-4">
        {/* Field Name */}
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <label className="block text-sm font-semibold text-gray-900 mb-2">
            Field Name <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g., North Field A"
              className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              required
            />
            <Leaf size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          </div>
        </div>

        {/* Crop Type */}
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <label className="block text-sm font-semibold text-gray-900 mb-3">
            Crop Type <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-4 gap-3">
            {cropTypes.map((crop) => (
              <button
                key={crop.name}
                type="button"
                onClick={() => setFormData({ ...formData, cropType: crop.name })}
                className={`p-3 rounded-xl border-2 transition-all ${
                  formData.cropType === crop.name
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <div className="text-3xl mb-1">{crop.emoji}</div>
                <div className="text-xs font-medium text-gray-700">{crop.name}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Location */}
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <label className="block text-sm font-semibold text-gray-900 mb-2">
            Location
          </label>
          <div className="relative">
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
              placeholder="e.g., Village, District"
              className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            <MapPin size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          </div>
        </div>

        {/* Field Size */}
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <label className="block text-sm font-semibold text-gray-900 mb-2">
            Field Size (hectares) <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type="number"
              name="size"
              value={formData.size}
              onChange={handleChange}
              placeholder="e.g., 2.5"
              step="0.1"
              min="0.1"
              className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              required
            />
            <BarChart3 size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          </div>
        </div>

        {/* Planted Date */}
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <label className="block text-sm font-semibold text-gray-900 mb-2">
            Planted Date
          </label>
          <div className="relative">
            <input
              type="date"
              name="plantedDate"
              value={formData.plantedDate}
              onChange={handleChange}
              className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            <Calendar size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-primary-500 text-white py-4 rounded-xl font-semibold shadow-sm hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <div className="flex items-center justify-center gap-2">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Adding Field...</span>
            </div>
          ) : (
            'Add Field'
          )}
        </button>

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <p className="text-sm text-blue-900">
            <strong>Note:</strong> After adding your field, you can scan crops and track health status in real-time.
          </p>
        </div>
      </form>
    </div>
  );
}
