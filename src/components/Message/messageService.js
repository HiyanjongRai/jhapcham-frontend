import api from "../../api/axios";

/**
 * Message Service - API utilities for messaging functionality
 */

// Send a message (product inquiry or direct message)
export const sendMessage = async (receiverId, content, productId = null) => {
  try {
    const response = await api.post("/api/messages", {
      receiverId,
      productId,
      content,
    });
    return response.data;
  } catch (error) {
    console.error("Error sending message:", error);
    throw error;
  }
};

// Get inbox messages (messages received by current user)
export const getInbox = async () => {
  try {
    const response = await api.get("/api/messages/inbox");
    return response.data;
  } catch (error) {
    console.error("Error fetching inbox:", error);
    throw error;
  }
};

// Get sent messages
export const getSentMessages = async () => {
  try {
    const response = await api.get("/api/messages/sent");
    return response.data;
  } catch (error) {
    console.error("Error fetching sent messages:", error);
    throw error;
  }
};

// Get conversation with a specific user
export const getConversation = async (otherUserId) => {
  try {
    const response = await api.get(`/api/messages/conversation/${otherUserId}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching conversation:", error);
    throw error;
  }
};

// Deprecated wrappers for backward compatibility (if needed) or simple mapping
export const sendProductEnquiry = async (
  senderId,
  receiverId,
  productId,
  content
) => {
  // senderId is ignored as it's taken from token in backend
  return sendMessage(receiverId, content, productId);
};

export const sendStoreMessage = async (senderId, receiverId, content) => {
  return sendMessage(receiverId, content, null);
};

export const sendReply = async (senderId, receiverId, content) => {
  return sendMessage(receiverId, content, null);
};
