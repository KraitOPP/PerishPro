import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import {
  Search, Filter, Download, Upload, MoreVertical,
  Edit, Trash2, TrendingDown, TrendingUp, Clock,
  CheckCircle, XCircle, Sparkles, Package, Eye, Zap,
  AlertTriangle, X
} from 'lucide-react';
import Modal from '../components/common/Modal';
import Button from '../components/common/Button';
import Alert from '../components/common/Alert';
import * as productService from '../services/productService';

type ProductItem = {
  _id?: string;
  id?: number;
  name: string;
  category: string;
  expiryDate: string;
  currentPrice: number;
  mlPrice?: number;
  originalPrice?: number;
  stock: number;
  status: 'critical' | 'warning' | 'good' | string;
  confidence?: number;
  pricing?: { currentPrice?: number; mrp?: number; costPrice?: number };
};

const DEFAULT_LOCAL_PRODUCTS: ProductItem[] = [
  { id: 1, name: 'Fresh Milk (1L)', category: 'Dairy', expiryDate: '2024-11-08', currentPrice: 3.99, originalPrice: 4.99, mlPrice: 2.49, stock: 50, status: 'critical', confidence: 94 },
  { id: 2, name: 'Greek Yogurt', category: 'Dairy', expiryDate: '2024-11-09', currentPrice: 4.99, originalPrice: 5.99, mlPrice: 3.49, stock: 30, status: 'warning', confidence: 91 },
  { id: 3, name: 'Chicken Breast', category: 'Meat', expiryDate: '2024-11-10', currentPrice: 8.99, originalPrice: 10.99, mlPrice: 6.99, stock: 25, status: 'warning', confidence: 88 },
  { id: 4, name: 'Fresh Bread', category: 'Bakery', expiryDate: '2024-11-15', currentPrice: 2.99, originalPrice: 2.99, mlPrice: 2.99, stock: 100, status: 'good', confidence: 92 },
  { id: 5, name: 'Bananas', category: 'Produce', expiryDate: '2024-11-12', currentPrice: 1.99, originalPrice: 2.49, mlPrice: 1.49, stock: 75, status: 'good', confidence: 89 }
];

const InventoryPage: React.FC = () => {
  const [products, setProducts] = useState<ProductItem[]>(DEFAULT_LOCAL_PRODUCTS);
  const [loadingList, setLoadingList] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductItem | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', currentPrice: 0, stock: 0 });
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedItems, setSelectedItems] = useState<string[] | number[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [busyIds, setBusyIds] = useState<(string | number)[]>([]);
  const [actionLoading, setActionLoading] = useState(false);

  const categories = ['all', 'Dairy', 'Meat', 'Produce', 'Bakery', 'Frozen', 'Beverages'];
  const statuses = ['all', 'critical', 'warning', 'good'];

  useEffect(() => {
    let mounted = true;
    const fetchProducts = async () => {
      setLoadingList(true);
      try {
        const resp = await productService.listProducts({ limit: 200 });
        if (!mounted) return;
        if (resp && Array.isArray(resp.products)) {
          const normalized: ProductItem[] = resp.products.map((p: any, idx: number) => ({
            _id: p._id || p.id || undefined,
            id: p._id || p.id || idx + 1,
            name: p.name || p.sku || 'Unnamed product',
            category: p.category || 'Uncategorized',
            expiryDate: (p.perishable?.expiryDate) 
              ? new Date(p.perishable.expiryDate).toISOString().slice(0,10) 
              : (p.expiryDate || ''),
            currentPrice: Number(p.pricing?.currentPrice ?? p.currentPrice ?? 0),
            originalPrice: Number(p.pricing?.mrp ?? p.originalPrice ?? 0),
            mlPrice: p.aiMetrics?.recommendedPrice ?? p.mlPrice ?? null,
            stock: Number(p.stock?.quantity ?? p.stock ?? 0),
            status: p.status ?? 'active',
            confidence: p.aiMetrics?.confidenceScore ?? p.confidence ?? 0,
            pricing: p.pricing ?? undefined
          }));
          setProducts(normalized);
        }
      } catch (err) {
        console.warn('Failed to fetch products, using local defaults', err);
      } finally {
        setLoadingList(false);
      }
    };
    fetchProducts();
    return () => { mounted = false; };
  }, []);

  const isExpiringSoon = (expiryDate: string) => {
    if (!expiryDate) return false;
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 3;
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    const matchesStatus = selectedStatus === 'all' || product.status === selectedStatus;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const computeTemporaryML = (p: ProductItem) => {
    if (typeof p.mlPrice === 'number' && !isNaN(p.mlPrice)) return Number(p.mlPrice.toFixed(2));
    return Number((p.currentPrice * 0.9).toFixed(2));
  };

  const optimisticUpdateLocal = (id: string | number, patch: Partial<ProductItem>) => {
    setProducts(prev => prev.map(p => (p._id === id || p.id === id ? { ...p, ...patch } : p)));
  };

  const handleOpenEditModal = (product: ProductItem) => {
    setSelectedProduct(product);
    setEditForm({
      name: product.name,
      currentPrice: product.currentPrice ?? 0,
      stock: product.stock ?? 0
    });
    setIsEditModalOpen(true);
  };

  const handleUpdateProduct = async () => {
    if (!selectedProduct) return;
    const id = selectedProduct._id ?? selectedProduct.id;
    if (!id) return;

    setActionLoading(true);
    setErrorMessage('');

    try {
      const updatePayload: any = {
        name: editForm.name,
        pricing: {
          currentPrice: Number(editForm.currentPrice),
          mrp: selectedProduct.originalPrice ?? Number(editForm.currentPrice),
          costPrice: selectedProduct.originalPrice ?? Number(editForm.currentPrice)
        },
        stock: {
          quantity: Number(editForm.stock),
          unit: 'units', // Required field
          reorderLevel: 10 // Optional but good practice
        }
      };

      await productService.updateProduct(String(id), updatePayload);

      // Update local state
      optimisticUpdateLocal(id, {
        name: editForm.name,
        currentPrice: Number(editForm.currentPrice),
        stock: Number(editForm.stock)
      });

      setSuccessMessage(`${editForm.name} updated successfully`);
      setTimeout(() => setSuccessMessage(''), 3000);
      setIsEditModalOpen(false);
    } catch (err: any) {
      console.error('Update failed', err);
      const errorMsg = typeof err === 'string' ? err : (err?.response?.data?.message ?? err?.message ?? 'Failed to update product');
      setErrorMessage(errorMsg);
      setTimeout(() => setErrorMessage(''), 5000);
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenDeleteModal = (product: ProductItem) => {
    setSelectedProduct(product);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteProduct = async () => {
    if (!selectedProduct) return;
    const id = selectedProduct._id ?? selectedProduct.id;
    if (!id) return;

    setActionLoading(true);
    setErrorMessage('');

    try {
      await productService.deleteProduct(String(id), { force: false });

      // Remove from local state
      setProducts(prev => prev.filter(p => (p._id !== id && p.id !== id)));

      setSuccessMessage(`${selectedProduct.name} deleted successfully`);
      setTimeout(() => setSuccessMessage(''), 3000);
      setIsDeleteModalOpen(false);
    } catch (err: any) {
      console.error('Delete failed', err);
      const errorMsg = typeof err === 'string' ? err : (err?.response?.data?.message ?? err?.message ?? 'Failed to delete product');
      setErrorMessage(errorMsg);
      setTimeout(() => setErrorMessage(''), 5000);
    } finally {
      setActionLoading(false);
    }
  };

  const handleApplyMLPrice = async (product: ProductItem) => {
    const id = product._id ?? product.id;
    if (!id) return;
    const ml = computeTemporaryML(product);
    
    optimisticUpdateLocal(id, { currentPrice: ml });
    setBusyIds(prev => [...prev, id]);
    
    try {
      await productService.updateProduct(String(id), { 
        pricing: { 
          currentPrice: ml,
          mrp: product.originalPrice ?? ml,
          costPrice: product.originalPrice ?? ml
        }
      });
      setSuccessMessage(`Applied ML price for ${product.name}`);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: any) {
      const errorMsg = typeof err === 'string' ? err : (err?.response?.data?.message ?? err?.message ?? 'Failed to apply ML price');
      setErrorMessage(errorMsg);
      setTimeout(() => setErrorMessage(''), 5000);
    } finally {
      setBusyIds(prev => prev.filter(x => x !== id));
    }
  };

  const handleBatchOptimize = async () => {
    if (selectedItems.length === 0) return;

    const ids = selectedItems.slice();
    setBusyIds(prev => [...prev, ...ids]);

    const updates = ids.map(idOrNum => {
      const p = products.find(p => p._id === idOrNum || p.id === idOrNum);
      const ml = p ? computeTemporaryML(p) : 0;
      return { id: idOrNum, price: ml, product: p };
    });

    setProducts(prev =>
      prev.map(p => {
        const found = updates.find(u => u.id === p._id || u.id === p.id);
        return found ? { ...p, currentPrice: found.price } : p;
      })
    );

    try {
      await Promise.all(
        updates.map(u => 
          productService.updateProduct(String(u.id), { 
            pricing: { 
              currentPrice: u.price,
              mrp: u.product?.originalPrice ?? u.price,
              costPrice: u.product?.originalPrice ?? u.price
            }
          }).catch(err => ({ err, id: u.id }))
        )
      );
      setSuccessMessage(`${updates.length} products optimized`);
      setSelectedItems([]);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setErrorMessage('Batch optimize failed for some items');
      setTimeout(() => setErrorMessage(''), 5000);
    } finally {
      setBusyIds(prev => prev.filter(x => !ids.includes(x)));
    }
  };

  const handleSelectAll = () => {
    if (selectedItems.length === filteredProducts.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(filteredProducts.map(p => p._id ?? p.id ?? ''));
    }
  };

  const getStatusBadge = (status: string) => {
    const badges: any = {
      critical: { bg: 'bg-red-100', text: 'text-red-700', label: 'Critical' },
      warning: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Warning' },
      good: { bg: 'bg-green-100', text: 'text-green-700', label: 'Good' }
    };
    const badge = badges[status] ?? { bg: 'bg-gray-100', text: 'text-gray-700', label: status || 'Unknown' };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>
        {badge.label}
      </span>
    );
  };

  const stats = {
    total: products.length,
    critical: products.filter(p => p.status === 'critical').length,
    needsOptimization: products.filter(p => Math.abs((p.currentPrice ?? 0) - (p.mlPrice ?? computeTemporaryML(p))) > 0.001).length,
    totalValue: products.reduce((sum, p) => sum + ((p.currentPrice ?? 0) * (p.stock ?? 0)), 0)
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Inventory Management</h1>
          <p className="text-gray-600">Manage and optimize your perishable products</p>
        </div>
        <div className="flex items-center gap-3">
          <motion.button 
            whileHover={{ scale: 1.05 }} 
            whileTap={{ scale: 0.95 }} 
            className="px-4 py-2 border border-gray-200 rounded-xl font-medium hover:bg-gray-50 flex items-center gap-2"
          >
            <Download size={18} /> Export
          </motion.button>
          <motion.button 
            whileHover={{ scale: 1.05 }} 
            whileTap={{ scale: 0.95 }} 
            className="px-4 py-2 border border-gray-200 rounded-xl font-medium hover:bg-gray-50 flex items-center gap-2"
          >
            <Upload size={18} /> Import
          </motion.button>
        </div>
      </div>

      {successMessage && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <Alert message={successMessage} type="success" onClose={() => setSuccessMessage('')} />
        </motion.div>
      )}
      {errorMessage && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <Alert message={errorMessage} type="error" onClose={() => setErrorMessage('')} />
        </motion.div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-md p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Products</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <Package className="text-blue-600" size={32} />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-md p-4 border border-red-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Critical Items</p>
              <p className="text-2xl font-bold text-red-600">{stats.critical}</p>
            </div>
            <Clock className="text-red-600" size={32} />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-md p-4 border border-yellow-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Needs Optimization</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.needsOptimization}</p>
            </div>
            <Sparkles className="text-yellow-600" size={32} />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-md p-4 border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Value</p>
              <p className="text-2xl font-bold text-green-600">${Math.round(stats.totalValue)}</p>
            </div>
            <TrendingUp className="text-green-600" size={32} />
          </div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-white rounded-xl shadow-md p-4 border border-gray-200">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input 
              type="text" 
              placeholder="Search products..." 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
            />
          </div>
          <button 
            onClick={() => setShowFilters(!showFilters)} 
            className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 flex items-center gap-2"
          >
            <Filter size={18} /> Filters
          </button>
        </div>

        <AnimatePresence>
          {showFilters && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }} 
              animate={{ height: 'auto', opacity: 1 }} 
              exit={{ height: 0, opacity: 0 }} 
              className="mt-4 pt-4 border-t border-gray-200 flex flex-wrap gap-4"
            >
              <div>
                <label className="block text-sm text-gray-600 mb-1">Category</label>
                <select 
                  value={selectedCategory} 
                  onChange={(e) => setSelectedCategory(e.target.value)} 
                  className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Status</label>
                <select 
                  value={selectedStatus} 
                  onChange={(e) => setSelectedStatus(e.target.value)} 
                  className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {statuses.map(status => (
                    <option key={status} value={status}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Batch Actions */}
      {selectedItems.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }} 
          animate={{ opacity: 1, y: 0 }} 
          className="bg-blue-50 rounded-xl p-4 border border-blue-200 flex items-center justify-between"
        >
          <span className="text-sm font-medium text-blue-900">
            {selectedItems.length} item(s) selected
          </span>
          <div className="flex gap-2">
            <button 
              onClick={handleBatchOptimize} 
              className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 flex items-center gap-2"
            >
              <Sparkles size={16} /> Optimize Prices
            </button>
            <button 
              onClick={() => setSelectedItems([])} 
              className="px-4 py-2 bg-white border border-gray-200 rounded-lg font-medium hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </motion.div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left">
                  <input 
                    type="checkbox" 
                    checked={selectedItems.length === filteredProducts.length && filteredProducts.length > 0} 
                    onChange={handleSelectAll} 
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" 
                  />
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Product</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Category</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Expiry</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Current Price</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">ML Price</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Stock</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredProducts.map((product, index) => {
                const idKey = product._id ?? product.id;
                const calculating = busyIds.includes(idKey);
                return (
                  <motion.tr 
                    key={idKey || index} 
                    initial={{ opacity: 0, y: 20 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    transition={{ delay: index * 0.02 }} 
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <input 
                        type="checkbox" 
                        checked={selectedItems.includes(product._id ?? product.id ?? '')} 
                        onChange={(e) => {
                          const id = product._id ?? product.id ?? '';
                          if (e.target.checked) setSelectedItems(prev => [...prev, id]);
                          else setSelectedItems(prev => prev.filter(x => x !== id));
                        }} 
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" 
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg flex items-center justify-center">
                          <Package size={20} className="text-blue-600" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{product.name}</div>
                          <div className="text-xs text-gray-500">ID: {String(idKey)}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-lg text-sm">
                        {product.category}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className={`text-sm font-medium ${isExpiringSoon(product.expiryDate) ? 'text-red-600' : 'text-gray-900'}`}>
                        {product.expiryDate}
                      </div>
                      {isExpiringSoon(product.expiryDate) && (
                        <div className="text-xs text-red-500 flex items-center gap-1 mt-1">
                          <Clock size={12} /> Expires soon
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">{getStatusBadge(product.status)}</td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-semibold text-gray-900">
                        ${(product.currentPrice ?? 0).toFixed(2)}
                        {calculating && <span className="ml-2 text-xs text-gray-500">Updating...</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <div className={`text-sm font-bold ${
                          Math.abs((product.currentPrice ?? 0) - (product.mlPrice ?? computeTemporaryML(product))) > 0.001 
                            ? 'text-green-600' 
                            : 'text-gray-900'
                        }`}>
                          ${(product.mlPrice ?? computeTemporaryML(product)).toFixed(2)}
                        </div>
                        <div className="text-xs text-gray-500">{(product.confidence ?? 0)}% confidence</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{product.stock} units</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Link to={`/product/${idKey}`}>
                          <motion.button 
                            whileHover={{ scale: 1.1 }} 
                            whileTap={{ scale: 0.9 }} 
                            className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg" 
                            title="View Details"
                          >
                            <Eye size={16} />
                          </motion.button>
                        </Link>
                        <motion.button 
                          whileHover={{ scale: 1.1 }} 
                          whileTap={{ scale: 0.9 }} 
                          onClick={() => handleOpenEditModal(product)} 
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg" 
                          title="Edit Product"
                        >
                          <Edit size={16} />
                        </motion.button>
                        {Math.abs((product.currentPrice ?? 0) - (product.mlPrice ?? computeTemporaryML(product))) > 0.001 && (
                          <motion.button 
                            whileHover={{ scale: 1.1 }} 
                            whileTap={{ scale: 0.9 }} 
                            onClick={() => handleApplyMLPrice(product)} 
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg" 
                            title="Apply ML Price"
                          >
                            <Zap size={16} />
                          </motion.button>
                        )}
                        <motion.button 
                          whileHover={{ scale: 1.1 }} 
                          whileTap={{ scale: 0.9 }} 
                          onClick={() => handleOpenDeleteModal(product)} 
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg" 
                          title="Delete Product"
                        >
                          <Trash2 size={16} />
                        </motion.button>
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {(!loadingList && filteredProducts.length === 0) && (
          <div className="text-center py-12">
            <Package size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600">No products found</p>
          </div>
        )}

        {loadingList && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading products...</p>
          </div>
        )}
      </div>

      {/* Edit Product Modal */}
      <Modal 
        isOpen={isEditModalOpen} 
        onClose={() => setIsEditModalOpen(false)} 
        title="Edit Product"
      >
        {selectedProduct && (
          <div className="space-y-5">
            {/* Product Preview Card */}
            <div className="p-4 bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl border border-blue-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center shadow-lg">
                  <Package size={28} className="text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 text-lg">{selectedProduct.name}</h4>
                  <p className="text-sm text-gray-600">{selectedProduct.category}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  selectedProduct.status === 'critical' 
                    ? 'bg-red-100 text-red-700' 
                    : selectedProduct.status === 'warning' 
                    ? 'bg-yellow-100 text-yellow-700' 
                    : 'bg-green-100 text-green-700'
                }`}>
                  {selectedProduct.status}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-3 text-sm">
                <div className="bg-white/60 backdrop-blur-sm rounded-lg p-3 border border-blue-100">
                  <p className="text-gray-600 text-xs mb-1">Current Price</p>
                  <p className="text-lg font-bold text-gray-900">${(selectedProduct.currentPrice ?? 0).toFixed(2)}</p>
                </div>
                <div className="bg-white/60 backdrop-blur-sm rounded-lg p-3 border border-green-100">
                  <p className="text-gray-600 text-xs mb-1">ML Recommended</p>
                  <p className="text-lg font-bold text-green-600">${(selectedProduct.mlPrice ?? computeTemporaryML(selectedProduct)).toFixed(2)}</p>
                </div>
                <div className="bg-white/60 backdrop-blur-sm rounded-lg p-3 border border-purple-100">
                  <p className="text-gray-600 text-xs mb-1">Current Stock</p>
                  <p className="text-lg font-bold text-purple-600">{selectedProduct.stock}</p>
                </div>
              </div>
            </div>

            {/* Edit Form */}
            <div className="space-y-4">
              {/* Product Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Product Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="Enter product name"
                />
              </div>

              {/* Current Price */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current Selling Price <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 font-semibold text-lg">
                    $
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={editForm.currentPrice}
                    onChange={(e) => setEditForm(prev => ({ ...prev, currentPrice: Number(e.target.value) }))}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg font-semibold transition-all"
                    placeholder="0.00"
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  ML suggests: ${(selectedProduct.mlPrice ?? computeTemporaryML(selectedProduct)).toFixed(2)}
                </p>
              </div>

              {/* Stock Quantity */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Stock Quantity <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    value={editForm.stock}
                    onChange={(e) => setEditForm(prev => ({ ...prev, stock: Number(e.target.value) }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg font-semibold transition-all"
                    placeholder="0"
                  />
                  <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
                    units
                  </span>
                </div>
              </div>

              {/* Additional Info */}
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertTriangle size={16} className="text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="text-xs text-blue-900">
                    <p className="font-medium mb-1">Expiry Date: {selectedProduct.expiryDate}</p>
                    <p>Make sure pricing and stock levels are accurate before saving.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              <Button 
                type="button" 
                variant="primary" 
                onClick={handleUpdateProduct} 
                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700" 
                disabled={actionLoading || !editForm.name.trim()}
              >
                {actionLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    Updating...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <CheckCircle size={18} /> Save Changes
                  </span>
                )}
              </Button>
              <Button 
                type="button" 
                variant="secondary" 
                onClick={() => setIsEditModalOpen(false)}
                disabled={actionLoading}
                className="px-6"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal 
        isOpen={isDeleteModalOpen} 
        onClose={() => setIsDeleteModalOpen(false)} 
        title="Delete Product"
      >
        {selectedProduct && (
          <div className="space-y-4">
            {/* Warning Card */}
            <div className="p-5 bg-gradient-to-br from-red-50 to-orange-50 rounded-xl border-2 border-red-200">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-red-100 rounded-xl">
                  <AlertTriangle size={28} className="text-red-600" />
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-red-900 text-lg mb-2">Confirm Deletion</h4>
                  <p className="text-red-800 text-sm leading-relaxed">
                    Are you sure you want to delete{' '}
                    <span className="font-bold">{selectedProduct.name}</span>?
                  </p>
                  <p className="text-red-700 text-sm mt-2 leading-relaxed">
                    This will mark the product as discontinued. This action can be reversed by updating the product status.
                  </p>
                </div>
              </div>
            </div>

            {/* Product Info Summary */}
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600 mb-1">Category</p>
                  <p className="font-semibold text-gray-900">{selectedProduct.category}</p>
                </div>
                <div>
                  <p className="text-gray-600 mb-1">Current Stock</p>
                  <p className="font-semibold text-gray-900">{selectedProduct.stock} units</p>
                </div>
                <div>
                  <p className="text-gray-600 mb-1">Current Price</p>
                  <p className="font-semibold text-gray-900">${selectedProduct.currentPrice.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-gray-600 mb-1">Expiry Date</p>
                  <p className="font-semibold text-gray-900">{selectedProduct.expiryDate}</p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button 
                type="button" 
                variant="danger" 
                onClick={handleDeleteProduct} 
                className="flex-1" 
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    Deleting...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <Trash2 size={18} /> Delete Product
                  </span>
                )}
              </Button>
              <Button 
                type="button" 
                variant="secondary" 
                onClick={() => setIsDeleteModalOpen(false)}
                disabled={actionLoading}
                className="px-6"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default InventoryPage;