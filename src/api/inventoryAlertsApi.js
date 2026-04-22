import api from './axios';

/**
 * Inventory Alerts API Service
 * Handles all API calls related to inventory alerts
 */

export const inventoryAlertsApi = {
  /**
   * Get all alerts for the current seller
   */
  getMyAlerts: async (page = 0, pageSize = 20) => {
    try {
      const response = await api.get('/api/inventory-alerts/my-alerts', {
        params: { page, pageSize }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching inventory alerts:', error);
      throw error;
    }
  },

  /**
   * Get unacknowledged alerts
   */
  getUnacknowledgedAlerts: async () => {
    try {
      const response = await api.get('/api/inventory-alerts/unacknowledged');
      return response.data;
    } catch (error) {
      console.error('Error fetching unacknowledged alerts:', error);
      throw error;
    }
  },

  /**
   * Get alert details
   */
  getAlert: async (alertId) => {
    try {
      const response = await api.get(`/api/inventory-alerts/${alertId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching alert:', error);
      throw error;
    }
  },

  /**
   * Acknowledge an alert
   */
  acknowledgeAlert: async (alertId) => {
    try {
      const response = await api.post(`/api/inventory-alerts/${alertId}/acknowledge`);
      return response.data;
    } catch (error) {
      console.error('Error acknowledging alert:', error);
      throw error;
    }
  }
};

export default inventoryAlertsApi;
