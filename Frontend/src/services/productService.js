import api from './api';

export const getProducts = async () => {
  try {
    const response = await api.get('/products');
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Failed to fetch products';
  }
};

export const addProduct = async (productData) => {
  try {
    const response = await api.post('/products', productData);
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Failed to add product';
  }
};

export const updateProductPrice = async (id, newPrice) => {
  try {
    const response = await api.patch(`/products/${id}`, { price: newPrice });
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Failed to update price';
  }
};

export const getDashboardStats = async () => {
  try {
    const response = await api.get('/analytics/summary');
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Failed to fetch dashboard stats';
  }
};

export const getAnalyticsData = async () => {
  try {
    const response = await api.get('/analytics/charts');
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Failed to fetch analytics data';
  }
};
