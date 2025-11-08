import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import { 
  Search, Filter, Download, Upload, MoreVertical, 
  Edit, Trash2, TrendingDown, TrendingUp, Clock, 
  CheckCircle, XCircle, Sparkles, Package, Eye, Zap
} from 'lucide-react';
import Modal from '../../src/components/common/Modal';
import Input from '../../src/components/common/Input';
import Button from '../../src/components/common/Button';
import Alert from '../../src/components/common/Alert';

const InventoryPage: React.FC = () => {
  const [products, setProducts] = useState([
    { id: 1, name: 'Fresh Milk (1L)', category: 'Dairy', expiryDate: '2024-11-08', currentPrice: 3.99, mlPrice: 2.49, stock: 50, status: 'critical', confidence: 94 },
    { id: 2, name: 'Greek Yogurt', category: 'Dairy', expiryDate: '2024-11-09', currentPrice: 4.99, mlPrice: 3.49, stock: 30, status: 'warning', confidence: 91 },
    { id: 3, name: 'Chicken Breast', category: 'Meat', expiryDate: '2024-11-10', currentPrice: 8.99, mlPrice: 6.99, stock: 25, status: 'warning', confidence: 88 },
    { id: 4, name: 'Fresh Bread', category: 'Bakery', expiryDate: '2024-11-15', currentPrice: 2.99, mlPrice: 2.99, stock: 100, status: 'good', confidence: 92 },
    { id: 5, name: 'Bananas', category: 'Produce', expiryDate: '2024-11-12', currentPrice: 1.99, mlPrice: 1.49, stock: 75, status: 'good', confidence: 89 },
    { id: 6, name: 'Cheddar Cheese', category: 'Dairy', expiryDate: '2024-11-20', currentPrice: 5.99, mlPrice: 5.99, stock: 40, status: 'good', confidence: 95 },
    { id: 7, name: 'Salmon Fillet', category: 'Meat', expiryDate: '2024-11-09', currentPrice: 12.99, mlPrice: 9.99, stock: 15, status: 'critical', confidence: 93 },
    { id: 8, name: 'Strawberries', category: 'Produce', expiryDate: '2024-11-08', currentPrice: 4.49, mlPrice: 2.99, stock: 60, status: 'critical', confidence: 90 }
  ]);
  
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newPrice, setNewPrice] = useState(0);
  const [successMessage, setSuccessMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  
  const categories = ['all', 'Dairy', 'Meat', 'Produce', 'Bakery'];
  const statuses = ['all', 'critical', 'warning', 'good'];
  
  const isExpiringSoon = (expiryDate: string) => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 3;
  };
  
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    const matchesStatus = selectedStatus === 'all' || product.status === selectedStatus;
    return matchesSearch && matchesCategory && matchesStatus;
  });
  
  const handleEditPrice = (product: any) => {
    setSelectedProduct(product);
    setNewPrice(product.mlPrice);
    setIsModalOpen(true);
  };
  
  const handleUpdatePrice = () => {
    setProducts(products.map(p => 
      p.id === selectedProduct.id ? { ...p, currentPrice: newPrice } : p
    ));
    setSuccessMessage(`Price updated for ${selectedProduct.name}!`);
    setIsModalOpen(false);
    setTimeout(() => setSuccessMessage(''), 3000);
  };
  
  const handleBatchOptimize = () => {
    const updatedProducts = products.map(p => 
      selectedItems.includes(p.id) ? { ...p, currentPrice: p.mlPrice } : p
    );
    setProducts(updatedProducts);
    setSuccessMessage(`${selectedItems.length} products optimized!`);
    setSelectedItems([]);
    setTimeout(() => setSuccessMessage(''), 3000);
  };
  
  const handleSelectAll = () => {
    if (selectedItems.length === filteredProducts.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(filteredProducts.map(p => p.id));
    }
  };
  
  const getStatusBadge = (status: string) => {
    const badges: any = {
      critical: { bg: 'bg-red-100', text: 'text-red-700', label: 'Critical' },
      warning: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Warning' },
      good: { bg: 'bg-green-100', text: 'text-green-700', label: 'Good' }
    };
    const badge = badges[status];
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>
        {badge.label}
      </span>
    );
  };
  
  const stats = {
    total: products.length,
    critical: products.filter(p => p.status === 'critical').length,
    needsOptimization: products.filter(p => p.currentPrice !== p.mlPrice).length,
    totalValue: products.reduce((sum, p) => sum + (p.currentPrice * p.stock), 0)
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
            <Download size={18} />
            Export
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-4 py-2 border border-gray-200 rounded-xl font-medium hover:bg-gray-50 flex items-center gap-2"
          >
            <Upload size={18} />
            Import
          </motion.button>
        </div>
      </div>
      
      {successMessage && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <Alert message={successMessage} type="success" onClose={() => setSuccessMessage('')} />
        </motion.div>
      )}
      
      {/* Stats Bar */}
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
              <p className="text-2xl font-bold text-green-600">${stats.totalValue.toFixed(0)}</p>
            </div>
            <TrendingUp className="text-green-600" size={32} />
          </div>
        </div>
      </div>
      
      {/* Search and Filters */}
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
            <Filter size={18} />
            Filters
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
                    <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
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
                    <option key={status} value={status}>{status.charAt(0).toUpperCase() + status.slice(1)}</option>
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
              <Sparkles size={16} />
              Optimize Prices
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
              {filteredProducts.map((product, index) => (
                <motion.tr
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-6 py-4">
                    <input
                      type="checkbox"
                      checked={selectedItems.includes(product.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedItems([...selectedItems, product.id]);
                        } else {
                          setSelectedItems(selectedItems.filter(id => id !== product.id));
                        }
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
                        <div className="text-xs text-gray-500">ID: {product.id}</div>
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
                        <Clock size={12} />
                        Expires soon
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">{getStatusBadge(product.status)}</td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-semibold text-gray-900">${product.currentPrice.toFixed(2)}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <div className={`text-sm font-bold ${product.currentPrice !== product.mlPrice ? 'text-green-600' : 'text-gray-900'}`}>
                        ${product.mlPrice.toFixed(2)}
                      </div>
                      <div className="text-xs text-gray-500">{product.confidence}% confidence</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{product.stock} units</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Link to={`/product/${product.id}`}>
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
                        onClick={() => handleEditPrice(product)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                        title="Edit Price"
                      >
                        <Edit size={16} />
                      </motion.button>
                      {product.currentPrice !== product.mlPrice && (
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => {
                            setProducts(products.map(p => 
                              p.id === product.id ? { ...p, currentPrice: p.mlPrice } : p
                            ));
                            setSuccessMessage(`Optimized ${product.name}!`);
                            setTimeout(() => setSuccessMessage(''), 3000);
                          }}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                          title="Apply ML Price"
                        >
                          <Zap size={16} />
                        </motion.button>
                      )}
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                      >
                        <MoreVertical size={16} />
                      </motion.button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredProducts.length === 0 && (
          <div className="text-center py-12">
            <Package size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600">No products found</p>
          </div>
        )}
      </div>
      
      {/* Edit Price Modal */}
      {selectedProduct && (
        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Optimize Product Price">
          <div className="space-y-4">
            <div className="p-4 bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl border border-blue-200">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
                  <Package size={24} className="text-white" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">{selectedProduct.name}</h4>
                  <p className="text-sm text-gray-600">{selectedProduct.category}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Current Price</p>
                  <p className="text-lg font-bold text-gray-900">${selectedProduct.currentPrice.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-gray-600">ML Recommended</p>
                  <p className="text-lg font-bold text-green-600">${selectedProduct.mlPrice.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-gray-600">Stock</p>
                  <p className="font-semibold text-gray-900">{selectedProduct.stock} units</p>
                </div>
                <div>
                  <p className="text-gray-600">Confidence</p>
                  <p className="font-semibold text-blue-600">{selectedProduct.confidence}%</p>
                </div>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">New Selling Price</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={newPrice}
                  onChange={(e) => setNewPrice(parseFloat(e.target.value))}
                  className="w-full pl-8 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg font-semibold"
                />
              </div>
              {newPrice !== selectedProduct.mlPrice && (
                <p className="text-sm text-yellow-600 mt-2 flex items-center gap-1">
                  <Clock size={14} />
                  Differs from ML recommendation
                </p>
              )}
            </div>
            
            <div className="flex gap-3 pt-4">
              <Button 
                type="button" 
                variant="primary" 
                onClick={handleUpdatePrice}
                className="flex-1"
              >
                Update Price
              </Button>
              <Button 
                type="button" 
                variant="secondary" 
                onClick={() => setIsModalOpen(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default InventoryPage;