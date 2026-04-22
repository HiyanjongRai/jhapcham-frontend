// Granular Notification Preferences API
import api from "../api/axios";

export const getNotificationPreferences = async (userId) => {
  try {
    const response = await api.get(`/api/notifications/preferences/${userId}`);
    return response.data || getDefaultPreferences();
  } catch (error) {
    console.error("Notification preferences error:", error);
    return getDefaultPreferences();
  }
};

export const updateNotificationPreferences = async (userId, preferences) => {
  try {
    const response = await api.put(
      `/api/notifications/preferences/${userId}`,
      preferences
    );
    return { success: true, data: response.data, message: "Preferences updated" };
  } catch (error) {
    console.error("Update preferences error:", error);
    return { success: false, error };
  }
};

export const getDefaultPreferences = () => ({
  // Order Notifications
  orderPlaced: { email: true, sms: false, push: true },
  orderConfirmed: { email: true, sms: false, push: true },
  orderProcessing: { email: false, sms: false, push: true },
  orderShipped: { email: true, sms: true, push: true },
  orderDelivered: { email: true, sms: true, push: true },
  orderCancelled: { email: true, sms: false, push: true },
  
  // Payment Notifications
  paymentReceived: { email: true, sms: false, push: true },
  paymentFailed: { email: true, sms: true, push: true },
  refundInitiated: { email: true, sms: false, push: true },
  refundCompleted: { email: true, sms: true, push: true },
  
  // Promotion & Marketing
  promotionalOffers: { email: true, sms: false, push: false },
  flashSales: { email: false, sms: false, push: true },
  newArrivals: { email: true, sms: false, push: false },
  personalizedRecommendations: { email: true, sms: false, push: true },
  
  // Account Notifications
  accountSecurityAlerts: { email: true, sms: true, push: true },
  passwordChanged: { email: true, sms: true, push: true },
  newDevice: { email: true, sms: true, push: true },
  accountUpdate: { email: true, sms: false, push: false },
  
  // Seller & Review Notifications
  sellerMessage: { email: true, sms: false, push: true },
  reviewRequest: { email: false, sms: false, push: true },
  reviewResponse: { email: true, sms: false, push: true },
  
  // Wishlist & Cart
  wishlistItemRestocked: { email: true, sms: false, push: true },
  wishlistPriceDropped: { email: true, sms: false, push: true },
  abandonedCartReminder: { email: true, sms: false, push: true },
  
  // Loyalty & Rewards
  loyaltyPointsEarned: { email: false, sms: false, push: true },
  tierUpgrade: { email: true, sms: false, push: true },
  specialLoyaltyOffer: { email: true, sms: false, push: true },
  
  // Disputes & Returns
  disputeUpdate: { email: true, sms: true, push: true },
  returnApproved: { email: true, sms: true, push: true },
  returnShipped: { email: true, sms: false, push: true }
});

export const enableNotificationCategory = async (userId, category) => {
  try {
    const response = await api.patch(
      `/api/notifications/preferences/${userId}/enable`,
      { category }
    );
    return { success: true, data: response.data };
  } catch (error) {
    console.error("Enable category error:", error);
    return { success: false, error };
  }
};

export const disableNotificationCategory = async (userId, category) => {
  try {
    const response = await api.patch(
      `/api/notifications/preferences/${userId}/disable`,
      { category }
    );
    return { success: true, data: response.data };
  } catch (error) {
    console.error("Disable category error:", error);
    return { success: false, error };
  }
};

export const disableAllNotifications = async (userId) => {
  try {
    const response = await api.patch(
      `/api/notifications/preferences/${userId}/disable-all`
    );
    return { success: true, message: "All notifications disabled" };
  } catch (error) {
    console.error("Disable all error:", error);
    return { success: false, error };
  }
};

export const enableAllNotifications = async (userId) => {
  try {
    const response = await api.patch(
      `/api/notifications/preferences/${userId}/enable-all`
    );
    return { success: true, message: "All notifications enabled" };
  } catch (error) {
    console.error("Enable all error:", error);
    return { success: false, error };
  }
};

export const getNotificationFrequency = async (userId) => {
  try {
    const response = await api.get(
      `/api/notifications/frequency/${userId}`
    );
    return response.data;
  } catch (error) {
    console.error("Get frequency error:", error);
    return null;
  }
};

export const setNotificationFrequency = async (userId, frequency) => {
  try {
    const response = await api.put(
      `/api/notifications/frequency/${userId}`,
      { frequency }
    );
    return { success: true, data: response.data };
  } catch (error) {
    console.error("Set frequency error:", error);
    return { success: false, error };
  }
};
