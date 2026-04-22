// Seller Ratings Utility
import api from "../api/axios";

export const getSellerRatings = async (sellerId) => {
  try {
    const response = await api.get(`/api/sellers/${sellerId}/ratings`);
    return response.data;
  } catch (error) {
    console.error("Seller ratings error:", error);
    return null;
  }
};

export const getOrderSellerInfo = async (orderId) => {
  try {
    const response = await api.get(`/api/orders/${orderId}/seller-info`);
    return response.data;
  } catch (error) {
    console.error("Order seller info error:", error);
    return null;
  }
};

export const rateOrderSeller = async (orderId, sellerId, rating, feedback) => {
  try {
    const response = await api.post(`/api/sellers/${sellerId}/rate`, {
      orderId,
      rating,
      feedback,
      timestamp: new Date().toISOString()
    });
    return { success: true, data: response.data, message: "Thank you for rating the seller" };
  } catch (error) {
    console.error("Rate seller error:", error);
    return { success: false, error };
  }
};

export const getSellerRatingHistory = async (userId) => {
  try {
    const response = await api.get(`/api/seller-ratings/user/${userId}`);
    return response.data;
  } catch (error) {
    console.error("Seller rating history error:", error);
    return [];
  }
};

export const updateSellerRating = async (ratingId, rating, feedback) => {
  try {
    const response = await api.put(`/api/seller-ratings/${ratingId}`, {
      rating,
      feedback
    });
    return { success: true, data: response.data, message: "Rating updated" };
  } catch (error) {
    console.error("Update rating error:", error);
    return { success: false, error };
  }
};

export const reportSellerIssue = async (orderId, sellerId, issue) => {
  try {
    const response = await api.post(`/api/sellers/${sellerId}/report`, {
      orderId,
      issue,
      timestamp: new Date().toISOString()
    });
    return { success: true, message: "Report submitted successfully" };
  } catch (error) {
    console.error("Report seller error:", error);
    return { success: false, error };
  }
};

export const getAverageSellerRating = (ratings) => {
  if (!ratings || ratings.length === 0) return 0;
  const sum = ratings.reduce((acc, r) => acc + r.rating, 0);
  return (sum / ratings.length).toFixed(1);
};

export const getRatingBreakdown = (ratings) => {
  if (!ratings || ratings.length === 0) {
    return { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  }
  
  const breakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  ratings.forEach(r => {
    const star = Math.round(r.rating);
    if (breakdown.hasOwnProperty(star)) {
      breakdown[star]++;
    }
  });
  return breakdown;
};
