// Auto-Reorder & Subscription API
import api from "../api/axios";

export const createSubscription = async (userId, subscriptionData) => {
  try {
    const response = await api.post(`/api/subscriptions`, {
      userId,
      ...subscriptionData
    });
    return { success: true, data: response.data, message: "Subscription created" };
  } catch (error) {
    console.error("Create subscription error:", error);
    return { success: false, error };
  }
};

export const getActiveSubscriptions = async (userId) => {
  try {
    const response = await api.get(`/api/subscriptions/user/${userId}/active`);
    return response.data;
  } catch (error) {
    console.error("Get subscriptions error:", error);
    return [];
  }
};

export const getAllSubscriptions = async (userId) => {
  try {
    const response = await api.get(`/api/subscriptions/user/${userId}`);
    return response.data;
  } catch (error) {
    console.error("Get all subscriptions error:", error);
    return [];
  }
};

export const updateSubscription = async (subscriptionId, updateData) => {
  try {
    const response = await api.put(
      `/api/subscriptions/${subscriptionId}`,
      updateData
    );
    return { success: true, data: response.data, message: "Subscription updated" };
  } catch (error) {
    console.error("Update subscription error:", error);
    return { success: false, error };
  }
};

export const pauseSubscription = async (subscriptionId) => {
  try {
    const response = await api.patch(
      `/api/subscriptions/${subscriptionId}/pause`
    );
    return { success: true, data: response.data };
  } catch (error) {
    console.error("Pause subscription error:", error);
    return { success: false, error };
  }
};

export const resumeSubscription = async (subscriptionId) => {
  try {
    const response = await api.patch(
      `/api/subscriptions/${subscriptionId}/resume`
    );
    return { success: true, data: response.data };
  } catch (error) {
    console.error("Resume subscription error:", error);
    return { success: false, error };
  }
};

export const cancelSubscription = async (subscriptionId) => {
  try {
    const response = await api.delete(`/api/subscriptions/${subscriptionId}`);
    return { success: true, data: response.data, message: "Subscription cancelled" };
  } catch (error) {
    console.error("Cancel subscription error:", error);
    return { success: false, error };
  }
};

export const getSubscriptionHistory = async (subscriptionId) => {
  try {
    const response = await api.get(
      `/api/subscriptions/${subscriptionId}/history`
    );
    return response.data;
  } catch (error) {
    console.error("Subscription history error:", error);
    return [];
  }
};

export const quickReorder = async (userId, orderId) => {
  try {
    const response = await api.post(`/api/orders/${orderId}/quick-reorder`, {
      userId
    });
    return { success: true, data: response.data, message: "Order created from previous order" };
  } catch (error) {
    console.error("Quick reorder error:", error);
    return { success: false, error };
  }
};
