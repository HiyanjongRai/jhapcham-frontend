// Search Autocomplete API
import api from "../api/axios";

export const getSearchSuggestions = async (query, limit = 10) => {
  try {
    const response = await api.get(
      `/api/search/suggestions?q=${encodeURIComponent(query)}&limit=${limit}`
    );
    return response.data;
  } catch (error) {
    console.error("Search suggestions error:", error);
    return [];
  }
};

export const getOrderSearchSuggestions = async (userId, query, limit = 5) => {
  try {
    const response = await api.get(
      `/api/search/orders/${userId}?q=${encodeURIComponent(query)}&limit=${limit}`
    );
    return response.data;
  } catch (error) {
    console.error("Order search error:", error);
    return [];
  }
};

export const getProductSearchSuggestions = async (query, limit = 8) => {
  try {
    const response = await api.get(
      `/api/search/products?q=${encodeURIComponent(query)}&limit=${limit}`
    );
    return response.data;
  } catch (error) {
    console.error("Product search error:", error);
    return [];
  }
};

export const getCategorySearchSuggestions = async (query) => {
  try {
    const response = await api.get(
      `/api/search/categories?q=${encodeURIComponent(query)}`
    );
    return response.data;
  } catch (error) {
    console.error("Category search error:", error);
    return [];
  }
};

export const searchOrders = async (userId, query) => {
  try {
    const response = await api.get(
      `/api/orders/search?userId=${userId}&q=${encodeURIComponent(query)}`
    );
    return response.data;
  } catch (error) {
    console.error("Search orders error:", error);
    return [];
  }
};

export const recordSearchQuery = async (userId, query, resultCount) => {
  try {
    await api.post(`/api/search/track`, {
      userId,
      query,
      resultCount,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("Search tracking error:", error);
  }
};
