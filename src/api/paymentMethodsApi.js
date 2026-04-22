// Payment Methods Management API
import api from "../api/axios";

export const getSavedPaymentMethods = async (userId) => {
  try {
    const response = await api.get(`/api/payment-methods/user/${userId}`);
    return response.data;
  } catch (error) {
    console.error("Payment methods error:", error);
    return [];
  }
};

export const addPaymentMethod = async (userId, paymentData) => {
  try {
    const response = await api.post(`/api/payment-methods`, {
      userId,
      ...paymentData
    });
    return { success: true, data: response.data, message: "Payment method added" };
  } catch (error) {
    console.error("Add payment method error:", error);
    return { success: false, error };
  }
};

export const updatePaymentMethod = async (methodId, updateData) => {
  try {
    const response = await api.put(
      `/api/payment-methods/${methodId}`,
      updateData
    );
    return { success: true, data: response.data, message: "Payment method updated" };
  } catch (error) {
    console.error("Update payment method error:", error);
    return { success: false, error };
  }
};

export const setDefaultPaymentMethod = async (methodId) => {
  try {
    const response = await api.patch(
      `/api/payment-methods/${methodId}/default`
    );
    return { success: true, data: response.data };
  } catch (error) {
    console.error("Set default payment error:", error);
    return { success: false, error };
  }
};

export const deletePaymentMethod = async (methodId) => {
  try {
    await api.delete(`/api/payment-methods/${methodId}`);
    return { success: true, message: "Payment method removed" };
  } catch (error) {
    console.error("Delete payment method error:", error);
    return { success: false, error };
  }
};

export const verifyPaymentMethod = async (methodId, verificationCode) => {
  try {
    const response = await api.post(
      `/api/payment-methods/${methodId}/verify`,
      { verificationCode }
    );
    return { success: true, data: response.data };
  } catch (error) {
    console.error("Verify payment method error:", error);
    return { success: false, error };
  }
};
