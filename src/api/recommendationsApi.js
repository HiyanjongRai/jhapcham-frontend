// Product Recommendations API
import api from "../api/axios";

export const getRecommendations = async (userId, limit = 6) => {
  try {
    const response = await api.get(
      `/api/recommendations/user/${userId}?limit=${limit}`
    );
    return response.data;
  } catch (error) {
    console.error("Recommendations API error:", error);
    return [];
  }
};

export const getComplementaryProducts = async (productId, limit = 4) => {
  try {
    const response = await api.get(
      `/api/recommendations/complementary/${productId}?limit=${limit}`
    );
    return response.data;
  } catch (error) {
    console.error("Complementary products error:", error);
    return [];
  }
};

export const getSimilarProducts = async (productId, limit = 4) => {
  try {
    const response = await api.get(
      `/api/recommendations/similar/${productId}?limit=${limit}`
    );
    return response.data;
  } catch (error) {
    console.error("Similar products error:", error);
    return [];
  }
};

export const getTrendingInCategory = async (category, limit = 5) => {
  try {
    const response = await api.get(
      `/api/recommendations/trending/${category}?limit=${limit}`
    );
    return response.data;
  } catch (error) {
    console.error("Trending products error:", error);
    return [];
  }
};

export const recordRecommendationView = async (userId, productId, source) => {
  try {
    await api.post(`/api/recommendations/track`, {
      userId,
      productId,
      source,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("Recommendation tracking error:", error);
  }
};

export const recordRecommendationClick = async (userId, productId, source) => {
  try {
    await api.post(`/api/recommendations/click`, {
      userId,
      productId,
      source,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("Click tracking error:", error);
  }
};
