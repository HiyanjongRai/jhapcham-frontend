import api from './axios';

/**
 * Loyalty Points API Service
 * Handles all API calls related to loyalty program
 */

export const loyaltyApi = {
  /**
   * Get user's loyalty points and tier status
   */
  getMyPoints: async () => {
    try {
      const response = await api.get('/api/loyalty/my-points');
      return response.data;
    } catch (error) {
      console.error('Error fetching loyalty points:', error);
      throw error;
    }
  },

  /**
   * Redeem loyalty points
   */
  redeemPoints: async (pointsData) => {
    try {
      const response = await api.post('/api/loyalty/redeem', pointsData);
      return response.data;
    } catch (error) {
      console.error('Error redeeming points:', error);
      throw error;
    }
  }
};

export default loyaltyApi;
