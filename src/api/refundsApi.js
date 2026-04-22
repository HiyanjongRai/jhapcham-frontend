import api from './axios';

/**
 * Refunds & Reports API Service
 * Handles all API calls related to reporting issues and linked refund processing
 */

export const refundsApi = {
  // --- REPORTS API (New Entry Point) ---
  
  createReport: async (reportData) => {
    const response = await api.post('/api/reports', reportData);
    return response.data;
  },

  getMyReports: async () => {
    const response = await api.get('/api/reports/my');
    return response.data;
  },

  getSellerReports: async () => {
    const response = await api.get('/api/reports/seller');
    return response.data;
  },

  sellerAction: async (reportId, action) => {
    // action: { approved: boolean, comment: string }
    const response = await api.post(`/api/reports/${reportId}/seller-action`, action);
    return response.data;
  },

  getDisputes: async () => {
    const response = await api.get('/api/reports/disputes');
    return response.data;
  },

  adminAction: async (reportId, action) => {
    // action: { approved: boolean, comment: string, payerType: 'SELLER' | 'PLATFORM' }
    const response = await api.post(`/api/reports/${reportId}/admin-action`, action);
    return response.data;
  },

  // --- REFUNDS API (Financial Processing) ---

  getPendingPayouts: async () => {
    const response = await api.get('/api/refunds/admin/pending-payouts');
    return response.data;
  },

  completeRefund: async (refundId, adminNotes) => {
    const response = await api.post(`/api/refunds/admin/${refundId}/complete`, { adminNotes });
    return response.data;
  }
};

export default refundsApi;
