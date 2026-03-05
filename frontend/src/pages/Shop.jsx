import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ShoppingCart, Star, Package, X, Plus, Minus, Trash2, ChevronLeft, ExternalLink, Loader2, AlertCircle, IndianRupee } from 'lucide-react';
import useCartStore from '../store/cartStore';
import axios from 'axios';
import toast from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export default function Shop() {
  const location = useLocation();
  const navigate = useNavigate();
  const { items, addToCart, updateQuantity, removeFromCart, getTotalItems, getTotalPrice } = useCartStore();
  
  const [shopData, setShopData] = useState(null);
  const [recommendedMedicines, setRecommendedMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCart, setShowCart] = useState(false);

  useEffect(() => {
    const data = location.state || JSON.parse(sessionStorage.getItem('shopData') || '{}');
    
    if (data.disease && data.crop) {
      setShopData(data);
      fetchRecommendedMedicines(data);
    } else {
      setLoading(false);
    }
  }, [location.state]);

  const fetchRecommendedMedicines = async (data) => {
    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/api/shop/recommendations`, {
        disease: data.disease,
        crop: data.crop,
        severity: data.severity,
        treatment: data.treatment
      });

      if (response.data.success) {
        setRecommendedMedicines(response.data.medicines);
      }
    } catch (error) {
      console.error('Error fetching medicines:', error);
      toast.error('Failed to load medicine recommendations');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = (product) => {
    addToCart(product);
    toast.success(`${product.name} added to cart`);
  };

  return (
    <>
      <div className="min-h-screen bg-gradient-to-b from-white via-green-50 to-green-100 pb-6 relative">
        {/* Glowing effect overlay */}
        <div className="absolute inset-0 bg-gradient-radial from-green-200/20 via-transparent to-transparent pointer-events-none" style={{backgroundImage: 'radial-gradient(circle at 50% 80%, rgba(134, 239, 172, 0.15) 0%, transparent 60%)'}}></div>
        <div className="bg-gradient-to-r from-green-700 via-green-600 to-emerald-600 border-b border-green-800 p-4 sticky top-0 z-10 shadow-lg shadow-green-900/30">
          <div className="max-w-screen-xl mx-auto">
            <div className="flex items-center justify-between">
              <button 
                onClick={() => navigate(-1)}
                className="p-2 hover:bg-white/20 rounded-lg mr-2 text-white"
              >
                <ChevronLeft size={24} />
              </button>
              <div className="flex-1">
                <h1 className="text-xl font-bold text-white">
                  {shopData ? 'Top 3 Recommended Medicines' : 'Shopping Cart'}
                </h1>
                {shopData && (
                  <p className="text-sm text-green-100">
                    For {shopData.crop} - {shopData.disease}
                  </p>
                )}
              </div>
              <button 
                onClick={() => setShowCart(true)}
                className="relative p-2 bg-primary-500 hover:bg-primary-600 rounded-lg transition-colors"
              >
                <ShoppingCart size={24} className="text-white" />
                {getTotalItems() > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {getTotalItems()}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-screen-xl mx-auto px-4 py-6">
          {shopData && (
            <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-4 border border-green-200 mb-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="text-green-600 mt-1 flex-shrink-0" size={24} />
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">
                    Treatment for {shopData.disease}
                  </h3>
                  <p className="text-sm text-gray-600">
                    Showing top 3 best medicines for your {shopData.crop} crop. 
                    Severity: <span className="font-semibold capitalize">{shopData.severity}</span>
                  </p>
                </div>
              </div>
            </div>
          )}

          {shopData ? (
            loading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="animate-spin text-green-600 mb-4" size={48} />
                <p className="text-gray-600">Finding top 3 best medicines for you...</p>
              </div>
            ) : recommendedMedicines.length === 0 ? (
              <div className="text-center py-12">
                <Package size={48} className="text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No medicines found</p>
              </div>
            ) : (
              <>
                <div className="space-y-4 mb-6">
                  {recommendedMedicines.map((medicine) => (
                    <div key={medicine.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                      <div className="p-4">
                        <div className="flex gap-4">
                          <div className="w-24 h-24 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden">
                            {medicine.image ? (
                              <img 
                                src={medicine.image} 
                                alt={medicine.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.style.display = 'none';
                                  e.target.nextElementSibling.style.display = 'flex';
                                }}
                              />
                            ) : null}
                            <div 
                              className={`w-full h-full flex items-center justify-center ${medicine.image ? 'hidden' : 'flex'}`}
                              style={{ display: medicine.image ? 'none' : 'flex' }}
                            >
                              <Package className="text-gray-400" size={40} />
                            </div>
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <h3 className="font-semibold text-gray-900 leading-tight">
                                {medicine.name}
                              </h3>
                              <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded whitespace-nowrap">
                                {medicine.category}
                              </span>
                            </div>
                            
                            <p className="text-sm text-gray-600 mb-2">{medicine.brand}</p>
                            
                            <div className="flex items-center gap-2 mb-2">
                              <div className="flex items-center gap-1">
                                <Star className="text-yellow-400 fill-yellow-400" size={14} />
                                <span className="text-sm font-medium">{medicine.rating}</span>
                              </div>
                              <span className="text-xs text-gray-500">
                                ({medicine.reviews} reviews)
                              </span>
                            </div>

                            <p className="text-xs text-gray-600 mb-2">
                              <span className="font-medium">Dosage:</span> {medicine.dosage}
                            </p>

                            <p className="text-sm text-gray-600 leading-relaxed mb-3">
                              {medicine.description}
                            </p>

                            <div className="space-y-2">
                              <div className="flex items-center gap-2 mb-3">
                                <IndianRupee size={18} className="text-green-600" />
                                <span className="text-xl font-bold text-green-600">
                                  ₹{medicine.price}
                                </span>
                                <span className="text-sm text-gray-500">onwards</span>
                              </div>
                              
                              {medicine.apiUsed === 'Google Custom Search' && medicine.realProducts && (
                                <div className="mb-2 flex items-center gap-1 text-xs text-blue-600">
                                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="20 6 9 17 4 12"></polyline>
                                  </svg>
                                  <span>Real-time products from {medicine.realProducts.length} stores</span>
                                </div>
                              )}
                              
                              {medicine.purchaseLinks && (
                                <div className="space-y-2">
                                  <div className="flex flex-wrap gap-2">
                                    <a
                                      href={medicine.purchaseLinks.amazon}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex items-center gap-1 bg-orange-500 text-white px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-orange-600 active:scale-95 transition-all"
                                    >
                                      Amazon
                                      <ExternalLink size={12} />
                                    </a>
                                    <a
                                      href={medicine.purchaseLinks.flipkart}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex items-center gap-1 bg-blue-500 text-white px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-blue-600 active:scale-95 transition-all"
                                    >
                                      Flipkart
                                      <ExternalLink size={12} />
                                    </a>
                                    <a
                                      href={medicine.purchaseLinks.bighaat}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex items-center gap-1 bg-green-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-green-700 active:scale-95 transition-all"
                                    >
                                      BigHaat
                                      <ExternalLink size={12} />
                                    </a>
                                  </div>
                                  <button
                                    onClick={() => handleAddToCart(medicine)}
                                    className="w-full flex items-center justify-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-primary-700 active:scale-95 transition-all"
                                  >
                                    <ShoppingCart size={16} />
                                    Save to Cart
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                  <p className="text-xs text-gray-600">
                    <strong>Disclaimer:</strong> These are top 3 recommended medicines based on the diagnosis. Compare prices across platforms before purchasing. 
                    Please consult with a local agricultural expert before applying any pesticides.
                  </p>
                </div>
              </>
            )
          ) : (
            <div className="text-center py-12">
              <ShoppingCart size={64} className="text-gray-300 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-700 mb-2">View Your Saved Items</h2>
              <p className="text-gray-500 mb-6">Click the cart icon above to see items you saved from diagnosis</p>
              <button
                onClick={() => navigate('/diagnose')}
                className="bg-primary-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-600 transition-colors"
              >
                Scan a Crop
              </button>
            </div>
          )}
        </div>
      </div>

      {showCart && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center">
          <div className="bg-white w-full max-w-[480px] rounded-t-2xl shadow-2xl max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h2 className="text-lg font-bold text-gray-900">Shopping Cart ({getTotalItems()})</h2>
              <button onClick={() => setShowCart(false)} className="p-2 hover:bg-gray-100 rounded-full">
                <X size={24} className="text-gray-600" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {items.length === 0 ? (
                <div className="text-center py-12">
                  <ShoppingCart size={48} className="text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600">Your cart is empty</p>
                  <p className="text-sm text-gray-500 mt-2">Scan a crop and save recommended medicines</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {items.map((item) => (
                    <div key={item.id} className="bg-gray-50 rounded-lg p-3 flex gap-3">
                      <div className="w-16 h-16 bg-white rounded-lg overflow-hidden flex-shrink-0">
                        {item.image ? (
                          <img 
                            src={item.image} 
                            alt={item.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.style.display = 'none';
                              e.target.nextElementSibling.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div 
                          className={`w-full h-full flex items-center justify-center ${item.image ? 'hidden' : 'flex'}`}
                          style={{ display: item.image ? 'none' : 'flex' }}
                        >
                          <Package size={32} className="text-gray-300" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm text-gray-900 mb-1 truncate">{item.name}</h3>
                        <p className="text-xs text-gray-500 mb-1">{item.brand}</p>
                        <p className="text-sm font-bold text-primary-500">₹{item.price}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="p-1 bg-white rounded-md hover:bg-gray-200"
                          >
                            <Minus size={16} className="text-gray-600" />
                          </button>
                          <span className="text-sm font-medium px-2">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="p-1 bg-white rounded-md hover:bg-gray-200"
                          >
                            <Plus size={16} className="text-gray-600" />
                          </button>
                        </div>
                      </div>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="p-2 hover:bg-red-100 rounded-lg self-start"
                      >
                        <Trash2 size={18} className="text-red-500" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {items.length > 0 && (
              <div className="border-t border-gray-200 p-4 space-y-3">
                <div className="flex items-center justify-between text-lg font-bold">
                  <span>Total:</span>
                  <span className="text-primary-500">₹{getTotalPrice().toFixed(2)}</span>
                </div>
                <button
                  onClick={() => {
                    toast.success('Proceeding to checkout...');
                    setShowCart(false);
                  }}
                  className="w-full bg-primary-500 text-white py-3 rounded-lg font-semibold hover:bg-primary-600 transition-colors"
                >
                  Proceed to Buy
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
