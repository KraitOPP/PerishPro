// src/pages/ProductDetail.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  ArrowLeft,
  Edit,
  Trash2,
  Package,
  AlertTriangle,
  Sparkles,
  Clock,
  Target,
  Zap,
  Save
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import Alert from '../components/common/Alert';
import * as productService from '../services/productService';

type ApiProduct = any;

const formatISODateToYYYYMMDD = (d?: string | Date) => {
  if (!d) return '';
  try {
    const dt = new Date(d);
    return dt.toISOString().slice(0, 10);
  } catch {
    return String(d);
  }
};

const safeNumber = (v: any, fallback = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

const ProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [product, setProduct] = useState<ApiProduct | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingAction, setLoadingAction] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showOptimizeModal, setShowOptimizeModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedPrice, setEditedPrice] = useState<number>(0);

  const [priceHistory, setPriceHistory] = useState<any[]>([]);
  const [salesHistory, setSalesHistory] = useState<any[]>([]);

  const daysLeft = useMemo(() => {
    if (!product?.expiryDate) return 999;
    const today = new Date();
    const expiry = new Date(product.expiryDate);
    const diffTime = expiry.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }, [product?.expiryDate]);

  // If server doesn't provide ML price, generate a temporary realistic recommendation
  const computeTemporaryML = (p: ApiProduct | null) => {
    if (!p) return 0;
    // Check if we have a valid ML price from the API
    if (typeof p.mlPrice === 'number' && !isNaN(p.mlPrice) && p.mlPrice > 0) return p.mlPrice;
    
    // Temporary ML calculation until API provides recommendedPrice
    const currentPrice = p.currentPrice ?? 0;
    const currentDaysLeft = daysLeft;
    
    // More aggressive discounting as expiry approaches
    if (currentDaysLeft <= 1) {
      // Last day: 40-50% off
      return Number((currentPrice * 0.5).toFixed(2));
    } else if (currentDaysLeft <= 3) {
      // 2-3 days: 25-35% off
      return Number((currentPrice * 0.7).toFixed(2));
    } else if (currentDaysLeft <= 7) {
      // 4-7 days: 15-20% off
      return Number((currentPrice * 0.85).toFixed(2));
    } else if (currentDaysLeft <= 14) {
      // 8-14 days: 5-10% off
      return Number((currentPrice * 0.92).toFixed(2));
    } else {
      // More than 14 days: 0-5% off
      return Number((currentPrice * 0.97).toFixed(2));
    }
  };

  useEffect(() => {
    let mounted = true;
    const fetchProduct = async () => {
      if (!id) return;
      setLoading(true);
      setErrorMessage('');
      try {
        const resp = await productService.getProduct(id);
        const p = resp?.product ?? resp;
        if (!mounted) return;
        if (!p) {
          setErrorMessage('Product not found');
          setProduct(null);
          return;
        }

        const normalized: any = {
          ...p,
          id: p._id ?? p.id,
          name: p.name ?? p.sku ?? 'Unnamed',
          category: p.category ?? 'Uncategorized',
          sku: p.sku ?? '',
          expiryDate: p.perishable?.expiryDate
            ? formatISODateToYYYYMMDD(p.perishable.expiryDate)
            : p.expiryDate
            ? formatISODateToYYYYMMDD(p.expiryDate)
            : '',
          mfgDate: p.perishable?.manufactureDate
            ? formatISODateToYYYYMMDD(p.perishable.manufactureDate)
            : p.mfgDate
            ? formatISODateToYYYYMMDD(p.mfgDate)
            : '',
          currentPrice: safeNumber(p.pricing?.currentPrice ?? p.pricing?.mrp ?? p.currentPrice, 0),
          mlPrice: ((): number | null => {
            const v = p.aiMetrics?.recommendedPrice ?? p.mlPrice;
            const n = Number(v);
            return Number.isFinite(n) && n > 0 ? n : null;
          })(),
          originalPrice: safeNumber(
            p.pricing?.mrp ?? p.originalPrice ?? p.pricing?.costPrice ?? 0,
            0
          ),
          stock: safeNumber(p.stock?.quantity ?? p.stock ?? 0, 0),
          status: p.status ?? 'active',
          confidence: safeNumber(p.aiMetrics?.confidenceScore ?? p.confidence ?? 85, 0),
          description: p.description ?? p.notes ?? '',
          weight: p.weight ?? null,
          supplier: p.supplier ?? null
        };

        setProduct(normalized);

        // histories: use API if present, else a quick fallback
        if (Array.isArray(p.priceHistory) && p.priceHistory.length > 0) {
          setPriceHistory(p.priceHistory);
        } else {
          setPriceHistory([
            { date: '11-01', price: normalized.originalPrice },
            { date: '11-03', price: Math.round(normalized.originalPrice * 0.95 * 100) / 100 },
            { date: '11-05', price: normalized.currentPrice },
            { date: '11-07', price: Math.round(normalized.currentPrice * 0.88 * 100) / 100 },
            {
              date: normalized.expiryDate || 'exp',
              price: normalized.mlPrice ?? normalized.currentPrice
            }
          ]);
        }

        if (Array.isArray(p.salesHistory) && p.salesHistory.length > 0) {
          setSalesHistory(p.salesHistory);
        } else {
          setSalesHistory([
            { date: '11-01', sold: 8 },
            { date: '11-02', sold: 12 },
            { date: '11-03', sold: 15 },
            { date: '11-04', sold: 10 },
            { date: '11-05', sold: 18 },
            { date: '11-06', sold: 22 },
            { date: '11-07', sold: 25 }
          ]);
        }

        setEditedPrice(normalized.currentPrice);
      } catch (err: any) {
        console.error('Failed to load product', err);
        const errorMsg = typeof err === 'string' ? err : (err?.response?.data?.message ?? err?.message ?? 'Failed to load product');
        setErrorMessage(errorMsg);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
    return () => {
      mounted = false;
    };
  }, [id]);

  const calculateOptimizationImpact = () => {
    if (!product) return { profitIncrease: '0.00', wasteSaving: '0.00', sellThroughIncrease: '0%', revenueIncrease: '0.0' };
    const curr = safeNumber(product.currentPrice, 0);
    const ml = product.mlPrice ?? computeTemporaryML(product);
    const expectedSalesIncrease = 0.35;
    const currentRevenue = curr * (product.stock ?? 0) * 0.6;
    const optimizedRevenue = ml * (product.stock ?? 0) * 0.95;
    const profitIncrease = optimizedRevenue - currentRevenue;
    const wasteSaving = (product.stock ?? 0) * 0.35 * ml;
    const revenueIncrease = currentRevenue > 0 ? ((optimizedRevenue / currentRevenue - 1) * 100) : 0;
    return {
      profitIncrease: profitIncrease.toFixed(2),
      wasteSaving: wasteSaving.toFixed(2),
      sellThroughIncrease: `${Math.round(expectedSalesIncrease * 100)}%`,
      revenueIncrease: revenueIncrease.toFixed(1)
    };
  };

  const impact = calculateOptimizationImpact();

  const handleOptimize = async () => {
    if (!product || !product.id) return;
    setLoadingAction(true);
    setErrorMessage('');
    try {
      const ml = product.mlPrice ?? computeTemporaryML(product);
      await productService.updateProduct(String(product.id), { 
        pricing: { 
          currentPrice: ml,
          costPrice: product.originalPrice,
          mrp: product.originalPrice
        } 
      });
      
      setProduct(prev => (prev ? { ...prev, currentPrice: ml } : prev));
      setEditedPrice(ml);
      setSuccessMessage('Price optimized successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
      setShowOptimizeModal(false);
    } catch (err: any) {
      console.error('Optimize failed', err);
      const errorMsg = typeof err === 'string' ? err : (err?.response?.data?.message ?? err?.message ?? 'Failed to apply optimization');
      setErrorMessage(errorMsg);
      setTimeout(() => setErrorMessage(''), 5000);
    } finally {
      setLoadingAction(false);
    }
  };

  const handleSavePrice = async () => {
    if (!product || !product.id) return;
    if (!Number.isFinite(editedPrice) || editedPrice < 0) {
      setErrorMessage('Invalid price value');
      setTimeout(() => setErrorMessage(''), 3000);
      return;
    }
    setLoadingAction(true);
    setErrorMessage('');
    try {
      await productService.updateProduct(String(product.id), { 
        pricing: { 
          currentPrice: Number(editedPrice),
          costPrice: product.originalPrice,
          mrp: product.originalPrice
        } 
      });
      
      setProduct(prev => (prev ? { ...prev, currentPrice: Number(editedPrice) } : prev));
      setSuccessMessage('Price updated successfully');
      setIsEditing(false);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: any) {
      console.error('Save price failed', err);
      const errorMsg = typeof err === 'string' ? err : (err?.response?.data?.message ?? err?.message ?? 'Failed to update price');
      setErrorMessage(errorMsg);
      setTimeout(() => setErrorMessage(''), 5000);
    } finally {
      setLoadingAction(false);
    }
  };

  const handleDelete = async () => {
    if (!product || !product.id) return;
    setLoadingAction(true);
    setErrorMessage('');
    try {
      await productService.deleteProduct(String(product.id), { force: false });
      setSuccessMessage('Product deleted successfully');
      setTimeout(() => {
        navigate('/inventory');
      }, 1500);
    } catch (err: any) {
      console.error('Delete failed', err);
      const errorMsg = typeof err === 'string' ? err : (err?.response?.data?.message ?? err?.message ?? 'Failed to delete product');
      setErrorMessage(errorMsg);
      setTimeout(() => setErrorMessage(''), 5000);
    } finally {
      setLoadingAction(false);
      setShowDeleteModal(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading product...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertTriangle className="mx-auto mb-4 text-red-500" size={48} />
          <p className="text-xl text-gray-600">{errorMessage || 'Product not found'}</p>
          <Link to="/inventory">
            <button className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700">
              Back to Inventory
            </button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {successMessage && <Alert message={successMessage} type="success" onClose={() => setSuccessMessage('')} />}
      {errorMessage && <Alert message={errorMessage} type="error" onClose={() => setErrorMessage('')} />}

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
            onClick={() => { 
              setIsEditing(!isEditing); 
              setEditedPrice(product.currentPrice); 
            }}
            className="px-4 py-2 border border-gray-200 rounded-xl font-medium hover:bg-gray-50 flex items-center gap-2"
          >
            <Edit size={18} /> Edit
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowDeleteModal(true)}
            className="px-4 py-2 border border-red-200 text-red-600 rounded-xl font-medium hover:bg-red-50 flex items-center gap-2"
          >
            <Trash2 size={18} /> Delete
          </motion.button>
        </div>
      </div>

      {/* Status Banner */}
      {(product.status === 'critical' || daysLeft <= 3) && (
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
              <Zap size={20} /> Optimize Now
            </motion.button>
          </div>
        </motion.div>
      )}

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Pricing Card */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Pricing Information</h3>

            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="p-4 bg-gray-50 rounded-xl">
                <p className="text-sm text-gray-600 mb-1">Original Price</p>
                <p className="text-2xl font-bold text-gray-400 line-through">
                  ${product.originalPrice?.toFixed(2)}
                </p>
              </div>

              <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                <p className="text-sm text-blue-600 mb-1">Current Price</p>
                {isEditing ? (
                  <div className="flex items-center gap-2">
                    <input 
                      type="number" 
                      step="0.01" 
                      value={editedPrice} 
                      onChange={(e) => setEditedPrice(Number(e.target.value))} 
                      className="w-32 px-2 py-1 border border-blue-300 rounded-lg text-xl font-bold" 
                    />
                    <button 
                      onClick={handleSavePrice} 
                      disabled={loadingAction} 
                      className="p-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                      <Save size={16} />
                    </button>
                  </div>
                ) : (
                  <p className="text-2xl font-bold text-blue-600">
                    ${(product.currentPrice ?? 0).toFixed(2)}
                  </p>
                )}
              </div>

              <div className="p-4 bg-green-50 rounded-xl border border-green-200">
                <p className="text-sm text-green-600 mb-1 flex items-center gap-1">
                  <Sparkles size={14} /> ML Recommended
                </p>
                <p className="text-2xl font-bold text-green-600">
                  ${(product.mlPrice ?? computeTemporaryML(product)).toFixed(2)}
                </p>
                <p className="text-xs text-green-700 mt-1">{product.confidence}% confidence</p>
              </div>
            </div>

            {Math.abs(product.currentPrice - (product.mlPrice ?? computeTemporaryML(product))) > 0.01 && (
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
                    <p className="text-xl font-bold text-purple-600">{impact.sellThroughIncrease}</p>
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
                  disabled={loadingAction} 
                  className="mt-4 w-full py-3 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Zap size={20} /> Apply ML Optimization
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
                    backgroundColor: 'rgba(255,255,255,0.95)', 
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
                    backgroundColor: 'rgba(255,255,255,0.95)', 
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
                <span className="text-sm text-gray-600">Weight/Size</span>
                <span className="text-sm font-semibold text-gray-900">{product.weight ?? '-'}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600">Supplier</span>
                <span className="text-sm font-semibold text-gray-900">{product.supplier ?? '-'}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600">Mfg Date</span>
                <span className="text-sm font-semibold text-gray-900">{product.mfgDate || '-'}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-sm text-gray-600">Expiry Date</span>
                <span className={`text-sm font-semibold ${daysLeft <= 2 ? 'text-red-600' : 'text-gray-900'}`}>
                  {product.expiryDate}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Stock Information</h3>
            <div className="text-center mb-4">
              <p className="text-5xl font-bold text-gray-900">{product.stock}</p>
              <p className="text-sm text-gray-600 mt-1">units available</p>
            </div>
            <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }} 
                animate={{ width: `${Math.min(100, ((product.stock ?? 0) / 160) * 100)}%` }} 
                className="h-full bg-gradient-to-r from-blue-500 to-purple-500" 
              />
            </div>
            <p className="text-xs text-gray-500 mt-2 text-center">
              {product.stock} / 160 units (original stock)
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Status</h3>
            <div className="space-y-3">
              <div className={`p-3 rounded-xl border ${
                daysLeft <= 2 
                  ? 'bg-red-50 border-red-200' 
                  : daysLeft <= 7 
                  ? 'bg-yellow-50 border-yellow-200' 
                  : 'bg-green-50 border-green-200'
              }`}>
                <div className="flex items-center gap-2 mb-1">
                  <AlertTriangle 
                    size={16} 
                    className={
                      daysLeft <= 2 
                        ? 'text-red-600' 
                        : daysLeft <= 7 
                        ? 'text-yellow-600' 
                        : 'text-green-600'
                    } 
                  />
                  <span className="font-semibold text-gray-900">
                    {daysLeft <= 2 ? 'Critical' : daysLeft <= 7 ? 'Warning' : 'Good'}
                  </span>
                </div>
                <p className="text-sm text-gray-600">
                  {daysLeft <= 0 ? 'Expired' : daysLeft === 1 ? 'Expires tomorrow' : `${daysLeft} days until expiry`}
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
      <Modal 
        isOpen={showOptimizeModal} 
        onClose={() => setShowOptimizeModal(false)} 
        title="Optimize Product Price"
      >
        <div className="space-y-4">
          <div className="p-4 bg-gradient-to-br from-green-50 to-blue-50 rounded-xl border border-green-200">
            <h4 className="font-semibold text-gray-900 mb-3">Optimization Summary</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Current Price:</span>
                <span className="font-bold text-gray-900">${(product.currentPrice ?? 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">New Price:</span>
                <span className="font-bold text-green-600">
                  ${(product.mlPrice ?? computeTemporaryML(product)).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Price Change:</span>
                <span className="font-bold text-red-600">
                  -${((product.currentPrice ?? 0) - (product.mlPrice ?? computeTemporaryML(product))).toFixed(2)}
                </span>
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
              disabled={loadingAction}
            >
              <span className="flex items-center justify-center gap-2">
                <Zap size={18} /> Apply ML Optimization
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
      <Modal 
        isOpen={showDeleteModal} 
        onClose={() => setShowDeleteModal(false)} 
        title="Delete Product"
      >
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
              disabled={loadingAction}
            >
              {loadingAction ? 'Deleting...' : 'Delete Product'}
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