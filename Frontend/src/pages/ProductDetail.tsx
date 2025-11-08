import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { 
  ArrowLeft, Edit, Trash2, TrendingUp, TrendingDown, Package,
  Calendar, DollarSign, AlertTriangle, CheckCircle, Sparkles,
  Clock, Target, BarChart3, Zap, Save
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Button from '../../src/components/common/Button';
import Modal from '../../src/components/common/Modal';

const ProductDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // Mock product data
  const [product, setProduct] = useState({
    id: 1,
    name: 'Fresh Milk (1L)',
    category: 'Dairy',
    sku: 'MILK-001',
    expiryDate: '2024-11-08',
    mfgDate: '2024-11-01',
    currentPrice: 3.99,
    mlPrice: 2.49,
    originalPrice: 4.50,
    stock: 50,
    status: 'critical',
    confidence: 94,
    supplier: 'Fresh Farms Co.',
    barcode: '123456789012',
    weight: '1L',
    description: 'Premium fresh milk, pasteurized and homogenized'
  });
  
  const [showOptimizeModal, setShowOptimizeModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedPrice, setEditedPrice] = useState(product.currentPrice);
  
  const priceHistory = [
    { date: '11-01', price: 4.50 },
    { date: '11-03', price: 4.20 },
    { date: '11-05', price: 3.99 },
    { date: '11-07', price: 3.50 },
    { date: '11-08', price: 2.49 }
  ];
  
  const salesHistory = [
    { date: '11-01', sold: 8 },
    { date: '11-02', sold: 12 },
    { date: '11-03', sold: 15 },
    { date: '11-04', sold: 10 },
    { date: '11-05', sold: 18 },
    { date: '11-06', sold: 22 },
    { date: '11-07', sold: 25 }
  ];
  
  const getDaysUntilExpiry = () => {
    const today = new Date();
    const expiry = new Date(product.expiryDate);
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };
  
  const daysLeft = getDaysUntilExpiry();
  
  const calculateOptimizationImpact = () => {
    const priceDiff = product.currentPrice - product.mlPrice;
    const expectedSalesIncrease = 0.35; // 35% more sales expected
    const currentRevenue = product.currentPrice * product.stock * 0.6; // 60% sell-through
    const optimizedRevenue = product.mlPrice * product.stock * 0.95; // 95% sell-through with ML
    const profitIncrease = optimizedRevenue - currentRevenue;
    const wasteSaving = product.stock * 0.35 * product.mlPrice; // 35% less waste
    
    return {
      profitIncrease: profitIncrease.toFixed(2),
      wasteSaving: wasteSaving.toFixed(2),
      sellThroughIncrease: '35%',
      revenueIncrease: ((optimizedRevenue / currentRevenue - 1) * 100).toFixed(1)
    };
  };
  
  const impact = calculateOptimizationImpact();
  
  const handleOptimize = () => {
    setProduct({ ...product, currentPrice: product.mlPrice });
    setShowOptimizeModal(false);
  };
  
  const handleDelete = () => {
    // In real app, this would call an API
    navigate('/inventory');
  };
  
  const handleSavePrice = () => {
    setProduct({ ...product, currentPrice: editedPrice });
    setIsEditing(false);
  };
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/inventory">
            <motion.button
              whileHover={{ scale: 1.05, x: -5 }}
              whileTap={{ scale: 0.95 }}
              className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
            >
              <ArrowLeft size={24} />
            </motion.button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{product.name}</h1>
            <p className="text-gray-600">SKU: {product.sku} • {product.category}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsEditing(!isEditing)}
            className="px-4 py-2 border border-gray-200 rounded-xl font-medium hover:bg-gray-50 flex items-center gap-2"
          >
            <Edit size={18} />
            Edit
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowDeleteModal(true)}
            className="px-4 py-2 border border-red-200 text-red-600 rounded-xl font-medium hover:bg-red-50 flex items-center gap-2"
          >
            <Trash2 size={18} />
            Delete
          </motion.button>
        </div>
      </div>
      
      {/* Status Banner */}
      {product.status === 'critical' && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-2xl p-6 shadow-lg"
        >
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <AlertTriangle size={28} />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2">Immediate Action Required!</h3>
                <p className="text-red-50 mb-4">
                  This product expires in {daysLeft} day{daysLeft !== 1 ? 's' : ''}. 
                  Optimizing the price now could save ${impact.wasteSaving} in waste and increase revenue by {impact.revenueIncrease}%.
                </p>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg">
                    <Clock size={18} />
                    <span className="font-medium">Expires: {product.expiryDate}</span>
                  </div>
                  <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg">
                    <Package size={18} />
                    <span className="font-medium">{product.stock} units in stock</span>
                  </div>
                </div>
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowOptimizeModal(true)}
              className="px-6 py-3 bg-white text-red-600 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
            >
              <Zap size={20} />
              Optimize Now
            </motion.button>
          </div>
        </motion.div>
      )}
      
      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Product Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Pricing Card */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Pricing Information</h3>
            
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="p-4 bg-gray-50 rounded-xl">
                <p className="text-sm text-gray-600 mb-1">Original Price</p>
                <p className="text-2xl font-bold text-gray-400 line-through">${product.originalPrice}</p>
              </div>
              <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                <p className="text-sm text-blue-600 mb-1">Current Price</p>
                {isEditing ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      step="0.01"
                      value={editedPrice}
                      onChange={(e) => setEditedPrice(parseFloat(e.target.value))}
                      className="w-24 px-2 py-1 border border-blue-300 rounded-lg text-xl font-bold"
                    />
                    <button
                      onClick={handleSavePrice}
                      className="p-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      <Save size={16} />
                    </button>
                  </div>
                ) : (
                  <p className="text-2xl font-bold text-blue-600">${product.currentPrice}</p>
                )}
              </div>
              <div className="p-4 bg-green-50 rounded-xl border border-green-200">
                <p className="text-sm text-green-600 mb-1 flex items-center gap-1">
                  <Sparkles size={14} />
                  ML Recommended
                </p>
                <p className="text-2xl font-bold text-green-600">${product.mlPrice}</p>
                <p className="text-xs text-green-700 mt-1">{product.confidence}% confidence</p>
              </div>
            </div>
            
            {/* Optimization Impact */}
            {product.currentPrice !== product.mlPrice && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-xl border border-green-200"
              >
                <div className="flex items-center gap-2 mb-3">
                  <Target className="text-green-600" size={20} />
                  <h4 className="font-semibold text-gray-900">Potential Impact of ML Optimization</h4>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Additional Revenue</p>
                    <p className="text-xl font-bold text-green-600">+${impact.profitIncrease}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Waste Saving</p>
                    <p className="text-xl font-bold text-blue-600">${impact.wasteSaving}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Sell-through Increase</p>
                    <p className="text-xl font-bold text-purple-600">+{impact.sellThroughIncrease}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Revenue Growth</p>
                    <p className="text-xl font-bold text-orange-600">+{impact.revenueIncrease}%</p>
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowOptimizeModal(true)}
                  className="mt-4 w-full py-3 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
                >
                  <Zap size={20} />
                  Apply ML Optimization
                </motion.button>
              </motion.div>
            )}
          </div>
          
          {/* Price History Chart */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Price History</h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={priceHistory}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '12px'
                  }}
                />
                <Line type="monotone" dataKey="price" stroke="#3b82f6" strokeWidth={3} dot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          
          {/* Sales Performance */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Sales Performance</h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={salesHistory}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '12px'
                  }}
                />
                <Line type="monotone" dataKey="sold" stroke="#22c55e" strokeWidth={3} dot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
            <div className="mt-4 grid grid-cols-3 gap-4">
              <div className="p-3 bg-green-50 rounded-lg text-center">
                <p className="text-sm text-gray-600">Total Sold</p>
                <p className="text-2xl font-bold text-green-600">110</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg text-center">
                <p className="text-sm text-gray-600">Remaining</p>
                <p className="text-2xl font-bold text-blue-600">{product.stock}</p>
              </div>
              <div className="p-3 bg-purple-50 rounded-lg text-center">
                <p className="text-sm text-gray-600">Sell-through</p>
                <p className="text-2xl font-bold text-purple-600">69%</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Sidebar */}
        <div className="space-y-6">
          {/* Product Details */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Product Details</h3>
            <div className="space-y-3">
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600">Category</span>
                <span className="text-sm font-semibold text-gray-900">{product.category}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600">SKU</span>
                <span className="text-sm font-semibold text-gray-900">{product.sku}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600">Barcode</span>
                <span className="text-sm font-semibold text-gray-900">{product.barcode}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600">Weight/Size</span>
                <span className="text-sm font-semibold text-gray-900">{product.weight}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600">Supplier</span>
                <span className="text-sm font-semibold text-gray-900">{product.supplier}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600">Mfg Date</span>
                <span className="text-sm font-semibold text-gray-900">{product.mfgDate}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-sm text-gray-600">Expiry Date</span>
                <span className={`text-sm font-semibold ${daysLeft <= 2 ? 'text-red-600' : 'text-gray-900'}`}>
                  {product.expiryDate}
                </span>
              </div>
            </div>
          </div>
          
          {/* Stock Info */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Stock Information</h3>
            <div className="text-center mb-4">
              <p className="text-5xl font-bold text-gray-900">{product.stock}</p>
              <p className="text-sm text-gray-600 mt-1">units available</p>
            </div>
            <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(product.stock / 160) * 100}%` }}
                className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
              />
            </div>
            <p className="text-xs text-gray-500 mt-2 text-center">
              {product.stock} / 160 units (original stock)
            </p>
          </div>
          
          {/* Status */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Status</h3>
            <div className="space-y-3">
              <div className={`p-3 rounded-xl border ${
                product.status === 'critical' 
                  ? 'bg-red-50 border-red-200' 
                  : product.status === 'warning'
                  ? 'bg-yellow-50 border-yellow-200'
                  : 'bg-green-50 border-green-200'
              }`}>
                <div className="flex items-center gap-2 mb-1">
                  <AlertTriangle size={16} className={
                    product.status === 'critical' ? 'text-red-600' :
                    product.status === 'warning' ? 'text-yellow-600' : 'text-green-600'
                  } />
                  <span className="font-semibold text-gray-900">
                    {product.status === 'critical' ? 'Critical' :
                     product.status === 'warning' ? 'Warning' : 'Good'}
                  </span>
                </div>
                <p className="text-sm text-gray-600">
                  {daysLeft <= 1 ? `Expires today` : `${daysLeft} days until expiry`}
                </p>
              </div>
              
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl">
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles size={16} className="text-blue-600" />
                  <span className="font-semibold text-gray-900">ML Confidence</span>
                </div>
                <p className="text-2xl font-bold text-blue-600">{product.confidence}%</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Optimize Modal */}
      <Modal isOpen={showOptimizeModal} onClose={() => setShowOptimizeModal(false)} title="Optimize Product Price">
        <div className="space-y-4">
          <div className="p-4 bg-gradient-to-br from-green-50 to-blue-50 rounded-xl border border-green-200">
            <h4 className="font-semibold text-gray-900 mb-3">Optimization Summary</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Current Price:</span>
                <span className="font-bold text-gray-900">${product.currentPrice}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">New Price:</span>
                <span className="font-bold text-green-600">${product.mlPrice}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Price Change:</span>
                <span className="font-bold text-red-600">-${(product.currentPrice - product.mlPrice).toFixed(2)}</span>
              </div>
            </div>
          </div>
          
          <div className="p-4 bg-purple-50 rounded-xl border border-purple-200">
            <h4 className="font-semibold text-gray-900 mb-3">Expected Impact</h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-gray-600">Revenue Increase</p>
                <p className="text-lg font-bold text-green-600">+${impact.profitIncrease}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Waste Saving</p>
                <p className="text-lg font-bold text-blue-600">${impact.wasteSaving}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Sell-through</p>
                <p className="text-lg font-bold text-purple-600">+{impact.sellThroughIncrease}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Growth</p>
                <p className="text-lg font-bold text-orange-600">+{impact.revenueIncrease}%</p>
              </div>
            </div>
          </div>
          
          <div className="flex gap-3">
            <Button 
              type="button" 
              variant="primary" 
              onClick={handleOptimize}
              className="flex-1 bg-gradient-to-r from-green-600 to-blue-600"
            >
              <span className="flex items-center justify-center gap-2">
                <Zap size={18} />
                Apply Optimization
              </span>
            </Button>
            <Button 
              type="button" 
              variant="secondary" 
              onClick={() => setShowOptimizeModal(false)}
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
      
      {/* Delete Modal */}
      <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} title="Delete Product">
        <div className="space-y-4">
          <div className="p-4 bg-red-50 rounded-xl border border-red-200">
            <p className="text-red-900">
              Are you sure you want to delete <span className="font-bold">{product.name}</span>? 
              This action cannot be undone.
            </p>
          </div>
          
          <div className="flex gap-3">
            <Button 
              type="button" 
              variant="danger" 
              onClick={handleDelete}
              className="flex-1"
            >
              Delete Product
            </Button>
            <Button 
              type="button" 
              variant="secondary" 
              onClick={() => setShowDeleteModal(false)}
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ProductDetail;