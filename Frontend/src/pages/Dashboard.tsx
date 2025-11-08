import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { 
  DollarSign, Package, AlertTriangle, TrendingUp, TrendingDown, 
  Clock, Sparkles, ArrowUpRight, ArrowDownRight, Zap, Target, BarChart3
} from 'lucide-react';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const StatCard = ({ title, value, change, icon: Icon, color, trend }: any) => {
  const colorClasses: any = {
    blue: { bg: 'from-blue-500 to-blue-600', light: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200' },
    green: { bg: 'from-green-500 to-green-600', light: 'bg-green-50', text: 'text-green-600', border: 'border-green-200' },
    red: { bg: 'from-red-500 to-red-600', light: 'bg-red-50', text: 'text-red-600', border: 'border-red-200' },
    purple: { bg: 'from-purple-500 to-purple-600', light: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-200' },
    yellow: { bg: 'from-yellow-500 to-yellow-600', light: 'bg-yellow-50', text: 'text-yellow-600', border: 'border-yellow-200' }
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5, shadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)" }}
      className={`bg-white rounded-2xl shadow-lg border ${colorClasses[color].border} p-6 relative overflow-hidden group`}
    >
      {/* Background gradient on hover */}
      <div className={`absolute inset-0 bg-gradient-to-br ${colorClasses[color].bg} opacity-0 group-hover:opacity-5 transition-opacity`} />
      
      <div className="flex items-start justify-between relative z-10">
        <div className="flex-1">
          <p className="text-sm text-gray-600 mb-1 font-medium">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mb-2">{value}</p>
          <div className="flex items-center gap-2">
            {trend === 'up' ? (
              <div className="flex items-center gap-1 text-green-600 text-sm font-medium">
                <ArrowUpRight size={16} />
                <span>{change}</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 text-red-600 text-sm font-medium">
                <ArrowDownRight size={16} />
                <span>{change}</span>
              </div>
            )}
            <span className="text-xs text-gray-500">vs last week</span>
          </div>
        </div>
        
        <motion.div
          whileHover={{ rotate: 360, scale: 1.1 }}
          transition={{ duration: 0.5 }}
          className={`p-3 rounded-xl bg-gradient-to-br ${colorClasses[color].bg} text-white shadow-lg`}
        >
          <Icon size={24} />
        </motion.div>
      </div>
    </motion.div>
  );
};

const Dashboard: React.FC = () => {
  const [timeRange, setTimeRange] = useState('7d');
  
  const chartData = [
    { date: 'Mon', profit: 1200, revenue: 3500, waste: 150 },
    { date: 'Tue', profit: 1500, revenue: 4100, waste: 120 },
    { date: 'Wed', profit: 1800, revenue: 4800, waste: 100 },
    { date: 'Thu', profit: 1600, revenue: 4300, waste: 130 },
    { date: 'Fri', profit: 2100, revenue: 5200, waste: 80 },
    { date: 'Sat', profit: 2400, revenue: 5800, waste: 60 },
    { date: 'Sun', profit: 2200, revenue: 5400, waste: 70 }
  ];
  
  const categoryData = [
    { name: 'Dairy', value: 35, color: '#3b82f6' },
    { name: 'Meat', value: 25, color: '#ef4444' },
    { name: 'Produce', value: 20, color: '#22c55e' },
    { name: 'Bakery', value: 20, color: '#f59e0b' }
  ];
  
  const alerts = [
    { id: 1, name: 'Fresh Milk (1L)', expiry: 'Today', urgency: 'high', stock: 50, mlPrice: 2.49, currentPrice: 3.99 },
    { id: 2, name: 'Greek Yogurt', expiry: 'Tomorrow', urgency: 'high', stock: 30, mlPrice: 3.49, currentPrice: 4.99 },
    { id: 3, name: 'Chicken Breast', expiry: '2 days', urgency: 'medium', stock: 25, mlPrice: 6.99, currentPrice: 8.99 },
    { id: 4, name: 'Bananas', expiry: '3 days', urgency: 'medium', stock: 75, mlPrice: 1.49, currentPrice: 1.99 }
  ];
  
  const recentActivity = [
    { id: 1, action: 'Price updated', product: 'Fresh Milk', time: '2 min ago', user: 'System AI' },
    { id: 2, action: 'New product added', product: 'Organic Eggs', time: '15 min ago', user: 'You' },
    { id: 3, action: 'Stock alert', product: 'Greek Yogurt', time: '1 hour ago', user: 'System' },
    { id: 4, action: 'Price optimized', product: 'Chicken Breast', time: '2 hours ago', user: 'System AI' }
  ];
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
          <p className="text-gray-600">Welcome back! Here's what's happening with your inventory.</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="24h">Last 24 hours</option>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-medium shadow-lg shadow-blue-500/50 hover:shadow-xl hover:shadow-blue-500/60 transition-all"
          >
            <span className="flex items-center gap-2">
              <Zap size={18} />
              Run AI Optimization
            </span>
          </motion.button>
        </div>
      </div>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Revenue" 
          value="$32,450" 
          change="+18.2%" 
          trend="up"
          icon={DollarSign} 
          color="green" 
        />
        <StatCard 
          title="Items Expiring Soon" 
          value="12" 
          change="-5 items" 
          trend="up"
          icon={AlertTriangle} 
          color="red" 
        />
        <StatCard 
          title="Waste Reduction" 
          value="70%" 
          change="+12.5%" 
          trend="up"
          icon={TrendingUp} 
          color="blue" 
        />
        <StatCard 
          title="Active Products" 
          value="89" 
          change="+5 items" 
          trend="up"
          icon={Package} 
          color="purple" 
        />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Revenue & Profit Trends</h3>
              <p className="text-sm text-gray-600">Track your performance over time</p>
            </div>
            <div className="flex items-center gap-2">
              <button className="px-3 py-1.5 text-sm bg-blue-50 text-blue-600 rounded-lg font-medium">Profit</button>
              <button className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 rounded-lg">Revenue</button>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                  border: '1px solid #e5e7eb',
                  borderRadius: '12px',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Area type="monotone" dataKey="profit" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorProfit)" />
              <Area type="monotone" dataKey="revenue" stroke="#8b5cf6" strokeWidth={2} fillOpacity={1} fill="url(#colorRevenue)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        
        {/* Category Distribution */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Inventory by Category</h3>
          <p className="text-sm text-gray-600 mb-4">Distribution of products</p>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-4 space-y-2">
            {categoryData.map((cat, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }}></div>
                  <span className="text-sm text-gray-700">{cat.name}</span>
                </div>
                <span className="text-sm font-semibold text-gray-900">{cat.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Price Alerts */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-red-50 rounded-lg">
                <AlertTriangle className="text-red-600" size={20} />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Price Alerts</h3>
            </div>
            <span className="px-3 py-1 bg-red-100 text-red-600 rounded-full text-sm font-medium">
              {alerts.length} items
            </span>
          </div>
          
          <div className="space-y-3">
            {alerts.map((alert, index) => (
              <motion.div
                key={alert.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`p-4 rounded-xl border-l-4 ${
                  alert.urgency === 'high' 
                    ? 'bg-red-50 border-red-500' 
                    : 'bg-yellow-50 border-yellow-500'
                } hover:shadow-md transition-all cursor-pointer group`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-gray-900">{alert.name}</h4>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        alert.urgency === 'high' ? 'bg-red-200 text-red-700' : 'bg-yellow-200 text-yellow-700'
                      }`}>
                        {alert.expiry}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600 mt-2">
                      <span>Stock: {alert.stock}</span>
                      <span className="text-red-600 line-through">${alert.currentPrice}</span>
                      <span className="text-green-600 font-semibold">→ ${alert.mlPrice}</span>
                    </div>
                  </div>
                  <Link 
                    to="/inventory"
                    className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm font-medium text-blue-600 hover:bg-blue-50 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    Update
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
          
          <Link 
            to="/inventory"
            className="mt-4 block text-center py-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            View all items in inventory →
          </Link>
        </motion.div>
        
        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-50 rounded-lg">
                <Clock className="text-blue-600" size={20} />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
            </div>
          </div>
          
          <div className="space-y-4">
            {recentActivity.map((activity, index) => (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-start gap-3 pb-4 border-b border-gray-100 last:border-0"
              >
                <div className="w-2 h-2 rounded-full bg-blue-500 mt-2"></div>
                <div className="flex-1">
                  <p className="text-sm text-gray-900">
                    <span className="font-semibold">{activity.action}</span> - {activity.product}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-gray-500">{activity.time}</span>
                    <span className="text-xs text-gray-400">•</span>
                    <span className="text-xs text-gray-500">by {activity.user}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
          
          <button className="mt-4 w-full py-2 text-sm text-gray-600 hover:text-gray-800 font-medium hover:bg-gray-50 rounded-lg transition-colors">
            View all activity
          </button>
        </motion.div>
      </div>
      
      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div whileHover={{ y: -5 }} className="p-6 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl text-white shadow-lg">
          <Target size={32} className="mb-3" />
          <h3 className="text-lg font-semibold mb-1">Optimize All Prices</h3>
          <p className="text-sm text-blue-100 mb-4">Run ML optimization on all expiring items</p>
          <button className="px-4 py-2 bg-white text-blue-600 rounded-lg font-medium hover:shadow-lg transition-all">
            Start Optimization
          </button>
        </motion.div>
        
        <motion.div whileHover={{ y: -5 }} className="p-6 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl text-white shadow-lg">
          <Package size={32} className="mb-3" />
          <h3 className="text-lg font-semibold mb-1">Add New Products</h3>
          <p className="text-sm text-purple-100 mb-4">Quickly add items to your inventory</p>
          <Link to="/add-product" className="inline-block px-4 py-2 bg-white text-purple-600 rounded-lg font-medium hover:shadow-lg transition-all">
            Add Product
          </Link>
        </motion.div>
        
        <motion.div whileHover={{ y: -5 }} className="p-6 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl text-white shadow-lg">
          <BarChart3 size={32} className="mb-3" />
          <h3 className="text-lg font-semibold mb-1">View Analytics</h3>
          <p className="text-sm text-green-100 mb-4">Deep dive into your performance metrics</p>
          <Link to="/analytics" className="inline-block px-4 py-2 bg-white text-green-600 rounded-lg font-medium hover:shadow-lg transition-all">
            View Analytics
          </Link>
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;
