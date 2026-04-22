import api from './axios';

/**
 * SMS Notifications API Service
 * Handles all API calls related to SMS notifications
 */

export const smsApi = {
  /**
   * Get SMS preferences
   */
  getPreferences: async () => {
    try {
      const response = await api.get('/api/sms/preferences');
      return response.data;
    } catch (error) {
      console.error('Error fetching SMS preferences:', error);
      throw error;
    }
  },

  /**
   * Update SMS preferences
   */
  updatePreferences: async (preferencesData) => {
    try {
      const response = await api.put('/api/sms/preferences', preferencesData);
      return response.data;
    } catch (error) {
      console.error('Error updating SMS preferences:', error);
      throw error;
    }
  },

  /**
   * Disable all SMS notifications
   */
  disableAllSms: async () => {
    try {
      const response = await api.post('/api/sms/disable-all');
      return response.data;
    } catch (error) {
      console.error('Error disabling all SMS:', error);
      throw error;
    }
  },

  /**
   * Enable all SMS notifications
   */
  enableAllSms: async () => {
    try {
      const response = await api.post('/api/sms/enable-all');
      return response.data;
    } catch (error) {
      console.error('Error enabling all SMS:', error);
      throw error;
    }
  },

  /**
   * Get SMS history
   */
  getSmsHistory: async (page = 0, pageSize = 20) => {
    try {
      const response = await api.get('/api/sms/history', {
        params: { page, pageSize }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching SMS history:', error);
      throw error;
    }
  }
};

export default smsApi;
