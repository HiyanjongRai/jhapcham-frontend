import api from './axios';

/**
 * Disputes API Service
 * Handles all API calls related to dispute resolution
 */

export const disputesApi = {
  /**
   * Initiate a new dispute
   */
  initiateDispute: async (disputeData) => {
    try {
      const response = await api.post('/api/disputes/initiate', disputeData);
      return response.data;
    } catch (error) {
      console.error('Error initiating dispute:', error);
      throw error;
    }
  },

  /**
   * Upload evidence for a dispute (multipart/form-data)
   */
  uploadEvidence: async (disputeId, file, description) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('description', description);

      const response = await api.post(
        `/api/disputes/${disputeId}/upload-evidence`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error uploading evidence:', error);
      throw error;
    }
  },

  /**
   * Get user's disputes
   */
  getMyDisputes: async (page = 0, pageSize = 20) => {
    try {
      const response = await api.get('/api/disputes/my-disputes', {
        params: { page, pageSize }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching disputes:', error);
      throw error;
    }
  },

  /**
   * Get dispute details
   */
  getDispute: async (disputeId) => {
    try {
      const response = await api.get(`/api/disputes/${disputeId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching dispute:', error);
      throw error;
    }
  },

  /**
   * Get pending disputes (Admin only)
   */
  getPendingDisputes: async (page = 0, pageSize = 20) => {
    try {
      const response = await api.get('/api/disputes/admin/pending', {
        params: { page, pageSize }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching pending disputes:', error);
      throw error;
    }
  },

  /**
   * Resolve a dispute (Admin only)
   */
  resolveDispute: async (disputeId, resolutionData) => {
    try {
      const response = await api.post(
        `/api/disputes/admin/${disputeId}/resolve`,
        resolutionData
      );
      return response.data;
    } catch (error) {
      console.error('Error resolving dispute:', error);
      throw error;
    }
  }
};

export default disputesApi;
