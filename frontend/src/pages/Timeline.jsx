import { useState, useEffect } from 'react';
import { Calendar, TrendingUp, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import useAuthStore from '../store/authStore';
import axios from 'axios';
import toast from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export default function Timeline() {
  const { user, token } = useAuthStore();
  const [reports, setReports] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      fetchTimeline();
    }
  }, [user]);

  const fetchTimeline = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/api/timeline/${user.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setReports(response.data.reports);
      setStats(response.data.stats);
    } catch (error) {
      toast.error('Failed to load timeline');
    } finally {
      setLoading(false);
    }
  };

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'high': return <AlertCircle className="text-red-500" size={20} />;
      case 'moderate': return <Clock className="text-orange-500" size={20} />;
      case 'low': return <CheckCircle className="text-green-500" size={20} />;
      default: return <AlertCircle className="text-gray-500" size={20} />;
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-green-50 to-green-100 pb-6 relative">
      {/* Glowing effect overlay */}
      <div className="absolute inset-0 bg-gradient-radial from-green-200/20 via-transparent to-transparent pointer-events-none" style={{backgroundImage: 'radial-gradient(circle at 50% 80%, rgba(134, 239, 172, 0.15) 0%, transparent 60%)'}}></div>
      {/* Header */}
      <div className="bg-gradient-to-r from-green-700 via-green-600 to-emerald-600 border-b border-green-800 p-4 sticky top-0 z-10 shadow-lg shadow-green-900/30">
        <div className="max-w-screen-xl mx-auto">
          <h1 className="text-xl font-bold text-white">Timeline</h1>
          <p className="text-sm text-green-100 mt-1">Your diagnosis history</p>
        </div>
      </div>

      <div className="max-w-screen-xl mx-auto px-4 py-6">
        {/* Stats Overview */}
        {stats && (
          <div className="bg-white rounded-xl p-4 shadow-sm mb-6">
            <h2 className="font-semibold text-gray-900 mb-4">Overview</h2>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900 mb-1">{stats.totalReports}</div>
                <div className="text-xs text-gray-600">Total Scans</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600 mb-1">{stats.avgConfidence}%</div>
                <div className="text-xs text-gray-600">Avg Confidence</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600 mb-1">{stats.highSeverity}</div>
                <div className="text-xs text-gray-600">High Severity</div>
              </div>
            </div>
          </div>
        )}

        {/* Severity Distribution */}
        {stats && (
          <div className="bg-white rounded-xl p-4 shadow-sm mb-6">
            <h2 className="font-semibold text-gray-900 mb-4">Severity Distribution</h2>
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-gray-600">High</span>
                  <span className="font-semibold text-gray-900">{stats.highSeverity}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-red-500 h-2 rounded-full transition-all"
                    style={{ width: `${(stats.highSeverity / stats.totalReports) * 100}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-gray-600">Moderate</span>
                  <span className="font-semibold text-gray-900">{stats.moderateSeverity}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-orange-500 h-2 rounded-full transition-all"
                    style={{ width: `${(stats.moderateSeverity / stats.totalReports) * 100}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-gray-600">Low</span>
                  <span className="font-semibold text-gray-900">{stats.lowSeverity}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full transition-all"
                    style={{ width: `${(stats.lowSeverity / stats.totalReports) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Timeline */}
        <div className="space-y-4">
          <h2 className="font-semibold text-gray-900">History</h2>
          
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-xl p-4 shadow-sm animate-pulse">
                  <div className="flex gap-4">
                    <div className="w-20 h-20 bg-gray-200 rounded-lg" />
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded mb-2" />
                      <div className="h-3 bg-gray-200 rounded w-2/3" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : reports.length === 0 ? (
            <div className="bg-white rounded-xl p-8 text-center shadow-sm">
              <Calendar size={48} className="text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 mb-2">No scans yet</p>
              <p className="text-sm text-gray-500">Start by diagnosing your first crop!</p>
            </div>
          ) : (
            reports.map((report, index) => (
              <div key={report.id} className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                <div className="flex gap-4 p-4">
                  {/* Image */}
                  <div className="relative w-20 h-20 flex-shrink-0">
                    {report.imageUrl ? (
                      <img
                        src={report.imageUrl}
                        alt={report.disease}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg flex items-center justify-center">
                        <TrendingUp size={32} className="text-gray-300" />
                      </div>
                    )}
                    {/* Severity Badge */}
                    <div className="absolute -top-1 -right-1">
                      {getSeverityIcon(report.severity)}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-1">
                      <h3 className="font-semibold text-gray-900 text-sm line-clamp-1">
                        {report.disease}
                      </h3>
                      <span className="text-xs text-gray-500 whitespace-nowrap ml-2">
                        {report.confidence}%
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 mb-2">{report.crop}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">{formatDate(report.date)}</span>
                      {report.field && (
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                          {report.field.name}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Recovery Score */}
                {report.recoveryScore > 0 && (
                  <div className="px-4 pb-4">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-gray-600">Recovery Progress</span>
                      <span className="font-semibold text-gray-900">{report.recoveryScore}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div
                        className="bg-green-500 h-1.5 rounded-full transition-all"
                        style={{ width: `${report.recoveryScore}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
