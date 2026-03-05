import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Search, ChevronDown, ChevronUp, Mail, Phone, MessageCircle, Video } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Help() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFaq, setExpandedFaq] = useState(null);

  const faqs = [
    {
      id: 1,
      question: 'How do I scan my crops for diseases?',
      answer: 'Go to the Diagnose tab, click "Capture" to take a photo of the affected crop, or "Gallery" to upload an existing image. Our AI will analyze the image and provide results within seconds.'
    },
    {
      id: 2,
      question: 'How accurate is the disease detection?',
      answer: 'Our AI model has been trained on thousands of crop images and achieves 85-95% accuracy. The confidence score shown with each diagnosis indicates the reliability of the result.'
    },
    {
      id: 3,
      question: 'Can I use the app offline?',
      answer: 'Yes! The app works offline for basic features. Captured images will be queued and analyzed once you reconnect to the internet. Previously viewed treatments are cached for offline access.'
    },
    {
      id: 4,
      question: 'How do I consult with an expert?',
      answer: 'If a diagnosis requires expert review, you\'ll see an "Expert Consultation Recommended" banner. Click it to send your case to our agricultural experts who will respond within 24 hours.'
    },
    {
      id: 5,
      question: 'What crops are supported?',
      answer: 'We currently support detection for 20+ major crops including Rice, Wheat, Cotton, Tomato, Potato, Corn, and more. We\'re constantly adding support for new crops.'
    },
    {
      id: 6,
      question: 'How do I track treatment progress?',
      answer: 'After diagnosis, go to the Treatment tab and navigate to the Progress section. Take photos at regular intervals to document recovery. The app will track your progress over time.'
    },
    {
      id: 7,
      question: 'Is my data secure?',
      answer: 'Yes, all data is encrypted and stored securely. We never share your personal information or crop data with third parties without your consent.'
    },
    {
      id: 8,
      question: 'How do I buy recommended products?',
      answer: 'Treatment recommendations include a shopping list with product links. You can add items to cart and order directly through our partner stores.'
    }
  ];

  const filteredFaqs = faqs.filter(faq =>
    faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-green-50 to-green-100 pb-20 relative">
      {/* Glowing effect overlay */}
      <div className="absolute inset-0 bg-gradient-radial from-green-200/20 via-transparent to-transparent pointer-events-none" style={{backgroundImage: 'radial-gradient(circle at 50% 80%, rgba(134, 239, 172, 0.15) 0%, transparent 60%)'}}></div>
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white sticky top-0 z-10">
        <div className="px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate(-1)}>
            <ChevronLeft size={24} />
          </button>
          <h1 className="text-lg font-semibold">Help & Support</h1>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Search */}
        <div className="bg-white rounded-xl p-3 shadow-sm">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search help topics..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-4">Contact Support</h3>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => toast.success('Opening email client...')}
              className="flex flex-col items-center gap-2 p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <Mail className="text-blue-600" size={24} />
              <span className="text-sm font-medium text-blue-900">Email</span>
            </button>
            <button
              onClick={() => toast.success('Calling support...')}
              className="flex flex-col items-center gap-2 p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
            >
              <Phone className="text-green-600" size={24} />
              <span className="text-sm font-medium text-green-900">Call</span>
            </button>
            <button
              onClick={() => toast.success('Opening chat...')}
              className="flex flex-col items-center gap-2 p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
            >
              <MessageCircle className="text-purple-600" size={24} />
              <span className="text-sm font-medium text-purple-900">Chat</span>
            </button>
            <button
              onClick={() => toast.success('Scheduling video call...')}
              className="flex flex-col items-center gap-2 p-4 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors"
            >
              <Video className="text-orange-600" size={24} />
              <span className="text-sm font-medium text-orange-900">Video</span>
            </button>
          </div>
        </div>

        {/* FAQs */}
        <div className="bg-white rounded-xl overflow-hidden shadow-sm">
          <div className="px-4 py-3 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900">Frequently Asked Questions</h3>
            <p className="text-xs text-gray-600 mt-1">{filteredFaqs.length} questions</p>
          </div>

          <div className="divide-y divide-gray-100">
            {filteredFaqs.map((faq) => (
              <div key={faq.id}>
                <button
                  onClick={() => setExpandedFaq(expandedFaq === faq.id ? null : faq.id)}
                  className="w-full px-4 py-4 flex items-start gap-3 text-left hover:bg-gray-50"
                >
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{faq.question}</p>
                    {expandedFaq === faq.id && (
                      <p className="text-sm text-gray-600 mt-2 leading-relaxed">{faq.answer}</p>
                    )}
                  </div>
                  {expandedFaq === faq.id ? (
                    <ChevronUp className="text-gray-400 flex-shrink-0" size={20} />
                  ) : (
                    <ChevronDown className="text-gray-400 flex-shrink-0" size={20} />
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Tutorials */}
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-4">Video Tutorials</h3>
          <div className="space-y-3">
            {[
              { title: 'Getting Started with CropShield AI', duration: '3:45' },
              { title: 'How to Scan Crops Effectively', duration: '2:30' },
              { title: 'Understanding Diagnosis Results', duration: '4:15' },
              { title: 'Applying Organic Treatments', duration: '5:20' }
            ].map((video, idx) => (
              <button
                key={idx}
                onClick={() => toast.success('Playing video...')}
                className="w-full flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-pink-500 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Video className="text-white" size={24} />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-medium text-gray-900 text-sm">{video.title}</p>
                  <p className="text-xs text-gray-600 mt-1">{video.duration} min</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Support Info */}
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl p-4 text-white">
          <h3 className="font-semibold mb-2">24/7 Support Available</h3>
          <p className="text-sm text-green-50 mb-3">
            Our expert team is here to help you protect your crops.
          </p>
          <div className="space-y-2 text-sm">
            <p>📧 support@cropshield.ai</p>
            <p>📞 +91 1800-123-4567 (Toll Free)</p>
            <p>⏰ Response time: Within 24 hours</p>
          </div>
        </div>
      </div>
    </div>
  );
}
