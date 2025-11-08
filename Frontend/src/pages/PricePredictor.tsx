import React, { useState } from 'react';
import { motion } from 'motion/react';
import { TrendingUp, DollarSign, Package, Calendar, Percent, TrendingDown, AlertTriangle, CheckCircle, BarChart3, Sparkles } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import Button from '../components/common/Button';

const PricePredictor: React.FC = () => {
  const [formData, setFormData] = useState({
    productName: 'Fresh Organic Milk',
    category: 'Dairy',
    currentPrice: '4.99',
    stockQuantity: '150',
    daysToExpiry: '7',
    currentDemand: 'medium',
    targetProfit: '25'
  });
  
  const [showResults, setShowResults] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };
  
  const runSimulation = async () => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setShowResults(true);
    setLoading(false);
  };
  
  // Mock simulation data
  const predictedPrice = parseFloat(formData.currentPrice) * 0.85;
  const potentialRevenue = predictedPrice * parseInt(formData.stockQuantity);
  const wasteReduction = 78;
  const profitIncrease = 32;
  
  const priceScenarios = [
    { name: 'Current', price: parseFloat(formData.currentPrice), sales: 45, revenue: 224, waste: 35 },
    { name: 'Optimal', price: predictedPrice, sales: 92, revenue: 388, waste: 8 },
    { name: 'Aggressive', price: predictedPrice * 0.75, sales: 100, revenue: 299, waste: 0 }
  ];
  
  const demandForecast = [
    { day: 'Day 1', demand: 85, price: parseFloat(formData.currentPrice) },
    { day: 'Day 2', demand: 78, price: parseFloat(formData.currentPrice) * 0.95 },
    { day: 'Day 3', demand: 72, price: parseFloat(formData.currentPrice) * 0.90 },
    { day: 'Day 4', demand: 92, price: parseFloat(formData.currentPrice) * 0.85 },
    { day: 'Day 5', demand: 98, price: parseFloat(formData.currentPrice) * 0.80 },
    { day: 'Day 6', demand: 100, price: parseFloat(formData.currentPrice) * 0.75 },
    { day: 'Day 7', demand: 100, price: parseFloat(formData.currentPrice) * 0.70 }
  ];
  
  return (
    <div className="max-w-7xl">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center gap-3 mb-2">
          <div className="p-3 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl">
            <TrendingUp className="text-white" size={24} />
          </div>
          <div>
            <h1 className="text-gray-800 mb-1">AI Price Predictor</h1>
            <p className="text-gray-600">Simulate pricing strategies and predict outcomes</p>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Input Panel */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-1 space-y-6"
        >
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-5">
              <Package className="text-blue-600" size={20} />
              <h2 className="text-gray-800">Product Details</h2>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-700 mb-2">Product Name</label>
                <input
                  type="text"
                  name="productName"
                  value={formData.productName}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
              
              <div>
                <label className="block text-sm text-gray-700 mb-2">Category</label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                >
                  <option value="Dairy">Dairy</option>
                  <option value="Produce">Produce</option>
                  <option value="Meat">Meat</option>
                  <option value="Bakery">Bakery</option>
                  <option value="Frozen">Frozen</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm text-gray-700 mb-2">Current Price ($)</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="number"
                    step="0.01"
                    name="currentPrice"
                    value={formData.currentPrice}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm text-gray-700 mb-2">Stock Quantity</label>
                <input
                  type="number"
                  name="stockQuantity"
                  value={formData.stockQuantity}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
              
              <div>
                <label className="block text-sm text-gray-700 mb-2">Days to Expiry</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="number"
                    name="daysToExpiry"
                    value={formData.daysToExpiry}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm text-gray-700 mb-2">Current Demand</label>
                <select
                  name="currentDemand"
                  value={formData.currentDemand}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm text-gray-700 mb-2">Target Profit Margin (%)</label>
                <div className="relative">
                  <Percent className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="number"
                    name="targetProfit"
                    value={formData.targetProfit}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>
            </div>
            
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="mt-6"
            >
              <Button
                variant="primary"
                className="w-full"
                onClick={runSimulation}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                    />
                    Running Simulation...
                  </>
                ) : (
                  <>
                    <Sparkles size={18} />
                    Run AI Prediction
                  </>
                )}
              </Button>
            </motion.div>
          </div>
        </motion.div>

        {/* Results Panel */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-2 space-y-6"
        >
          {!showResults ? (
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl border border-blue-200 p-12 flex flex-col items-center justify-center text-center min-h-[600px]">
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="p-6 bg-white rounded-full shadow-lg mb-6"
              >
                <BarChart3 className="text-blue-600" size={64} />
              </motion.div>
              <h3 className="text-gray-800 mb-2">Ready to Optimize Pricing</h3>
              <p className="text-gray-600 max-w-md">
                Enter your product details and click "Run AI Prediction" to see optimized pricing strategies, profit projections, and waste reduction insights.
              </p>
            </div>
          ) : (
            <>
              {/* Key Metrics */}
              <div className="grid grid-cols-2 gap-4">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <TrendingUp className="text-green-600" size={20} />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Recommended Price</p>
                      <p className="text-2xl text-gray-800">${predictedPrice.toFixed(2)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-green-600">↓ 15% from current</span>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <DollarSign className="text-blue-600" size={20} />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Projected Revenue</p>
                      <p className="text-2xl text-gray-800">${potentialRevenue.toFixed(0)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-blue-600">For {formData.stockQuantity} units</span>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-orange-100 rounded-lg">
                      <TrendingDown className="text-orange-600" size={20} />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Waste Reduction</p>
                      <p className="text-2xl text-gray-800">{wasteReduction}%</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="text-green-600" size={14} />
                    <span className="text-green-600">Excellent improvement</span>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Percent className="text-purple-600" size={20} />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Profit Increase</p>
                      <p className="text-2xl text-gray-800">+{profitIncrease}%</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-purple-600">vs current pricing</span>
                  </div>
                </motion.div>
              </div>

              {/* Price Scenarios Comparison */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
              >
                <h3 className="text-gray-800 mb-4">Pricing Scenarios</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={priceScenarios}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="sales" fill="#3b82f6" name="Sales Units" />
                    <Bar dataKey="revenue" fill="#10b981" name="Revenue ($)" />
                    <Bar dataKey="waste" fill="#f59e0b" name="Waste (%)" />
                  </BarChart>
                </ResponsiveContainer>
              </motion.div>

              {/* Demand Forecast */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
              >
                <h3 className="text-gray-800 mb-4">7-Day Demand & Price Forecast</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={demandForecast}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="day" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Legend />
                    <Line yAxisId="left" type="monotone" dataKey="demand" stroke="#8b5cf6" strokeWidth={2} name="Demand %" />
                    <Line yAxisId="right" type="monotone" dataKey="price" stroke="#3b82f6" strokeWidth={2} name="Price ($)" />
                  </LineChart>
                </ResponsiveContainer>
              </motion.div>

              {/* Recommendations */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-200 p-6"
              >
                <div className="flex items-center gap-2 mb-4">
                  <CheckCircle className="text-green-600" size={24} />
                  <h3 className="text-gray-800">AI Recommendations</h3>
                </div>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <div className="p-1 bg-green-600 rounded-full mt-1">
                      <CheckCircle className="text-white" size={12} />
                    </div>
                    <div>
                      <p className="text-gray-800">Reduce price to ${predictedPrice.toFixed(2)} to maximize sales velocity</p>
                      <p className="text-sm text-gray-600">This will increase demand by 92% and reduce waste significantly</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="p-1 bg-green-600 rounded-full mt-1">
                      <CheckCircle className="text-white" size={12} />
                    </div>
                    <div>
                      <p className="text-gray-800">Implement dynamic pricing over the next {formData.daysToExpiry} days</p>
                      <p className="text-sm text-gray-600">Gradually decrease price as expiry approaches to maintain optimal turnover</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="p-1 bg-green-600 rounded-full mt-1">
                      <CheckCircle className="text-white" size={12} />
                    </div>
                    <div>
                      <p className="text-gray-800">Run promotional campaigns on Day 4-5 for maximum impact</p>
                      <p className="text-sm text-gray-600">Predicted demand spike will help clear inventory before expiry</p>
                    </div>
                  </li>
                </ul>
              </motion.div>
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default PricePredictor;
