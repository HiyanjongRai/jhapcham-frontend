// Analytics & Spending Dashboard Utility
import api from "../api/axios";

export const getSpendingAnalytics = async (userId, timeRange = "all") => {
  try {
    const response = await api.get(
      `/api/analytics/spending/${userId}?timeRange=${timeRange}`
    );
    return response.data;
  } catch (error) {
    console.error("Spending analytics error:", error);
    return null;
  }
};

export const getMonthlySpending = async (userId) => {
  try {
    const response = await api.get(
      `/api/analytics/spending/monthly/${userId}`
    );
    return response.data;
  } catch (error) {
    console.error("Monthly spending error:", error);
    return [];
  }
};

export const getCategoryBreakdown = async (userId) => {
  try {
    const response = await api.get(
      `/api/analytics/spending/categories/${userId}`
    );
    return response.data;
  } catch (error) {
    console.error("Category breakdown error:", error);
    return [];
  }
};

export const getOrderStats = async (userId) => {
  try {
    const response = await api.get(`/api/analytics/orders/${userId}`);
    return {
      totalOrders: response.data.totalOrders || 0,
      totalSpent: response.data.totalSpent || 0,
      averageOrderValue: response.data.averageOrderValue || 0,
      recentOrders: response.data.recentOrders || 0,
      cancelledOrders: response.data.cancelledOrders || 0,
      deliveredOrders: response.data.deliveredOrders || 0,
      returnedOrders: response.data.returnedOrders || 0
    };
  } catch (error) {
    console.error("Order stats error:", error);
    return {
      totalOrders: 0,
      totalSpent: 0,
      averageOrderValue: 0,
      recentOrders: 0,
      cancelledOrders: 0,
      deliveredOrders: 0,
      returnedOrders: 0
    };
  }
};

export const getTopProducts = async (userId, limit = 5) => {
  try {
    const response = await api.get(
      `/api/analytics/top-products/${userId}?limit=${limit}`
    );
    return response.data;
  } catch (error) {
    console.error("Top products error:", error);
    return [];
  }
};

export const getSpendingTrends = async (userId, months = 12) => {
  try {
    const response = await api.get(
      `/api/analytics/trends/${userId}?months=${months}`
    );
    return response.data;
  } catch (error) {
    console.error("Spending trends error:", error);
    return [];
  }
};

export const getFavoriteCategories = async (userId) => {
  try {
    const response = await api.get(
      `/api/analytics/favorite-categories/${userId}`
    );
    return response.data;
  } catch (error) {
    console.error("Favorite categories error:", error);
    return [];
  }
};
