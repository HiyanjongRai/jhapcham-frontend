import api from './axios';

/**
 * Product Variants API Service
 * Handles all API calls related to product variants
 */

export const productVariantsApi = {
  /**
   * Create a new product variant
   */
  createVariant: async (productId, variantData) => {
    try {
      const response = await api.post(`/api/products/${productId}/variants`, variantData);
      return response.data;
    } catch (error) {
      console.error('Error creating variant:', error);
      throw error;
    }
  },

  /**
   * Get all variants for a product
   */
  getProductVariants: async (productId) => {
    try {
      const response = await api.get(`/api/products/${productId}/variants`);
      return response.data;
    } catch (error) {
      console.error('Error fetching variants:', error);
      throw error;
    }
  },

  /**
   * Get a specific variant
   */
  getVariant: async (productId, variantId) => {
    try {
      const response = await api.get(`/api/products/${productId}/variants/${variantId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching variant:', error);
      throw error;
    }
  },

  /**
   * Get variant by SKU
   */
  getVariantBySku: async (productId, sku) => {
    try {
      const response = await api.get(`/api/products/${productId}/variants/sku/${sku}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching variant by SKU:', error);
      throw error;
    }
  },

  /**
   * Update a product variant
   */
  updateVariant: async (productId, variantId, variantData) => {
    try {
      const response = await api.put(
        `/api/products/${productId}/variants/${variantId}`,
        variantData
      );
      return response.data;
    } catch (error) {
      console.error('Error updating variant:', error);
      throw error;
    }
  },

  /**
   * Update variant stock
   */
  updateVariantStock: async (productId, variantId, stockData) => {
    try {
      const response = await api.put(
        `/api/products/${productId}/variants/${variantId}/stock`,
        stockData
      );
      return response.data;
    } catch (error) {
      console.error('Error updating variant stock:', error);
      throw error;
    }
  }
};

export default productVariantsApi;
