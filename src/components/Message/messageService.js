import { API_BASE } from "../config/config";

/**
 * Message Service - API utilities for messaging functionality
 */

// Send product enquiry
export const sendProductEnquiry = async (senderId, receiverId, productId, content) => {
  try {
    const response = await fetch(`${API_BASE}/api/messages/product`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        senderId,
        receiverId, // Send the actual receiverId
        productId,
        content,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to send product enquiry");
    }

    // Try to parse JSON, but don't fail if it's not valid JSON
    try {
      return await response.json();
    } catch (jsonError) {
      // If JSON parsing fails but response was ok, still return success
      console.log("Response was OK but couldn't parse JSON, message likely sent successfully");
      return { success: true };
    }
  } catch (error) {
    console.error("Product enquiry error:", error);
    throw error;
  }
};

// Send store message
export const sendStoreMessage = async (senderId, receiverId, content) => {
  try {
    const response = await fetch(`${API_BASE}/api/messages/store`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        senderId,
        receiverId,
        productId: null,
        content,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to send store message");
    }

    // Try to parse JSON, but don't fail if it's not valid JSON
    try {
      return await response.json();
    } catch (jsonError) {
      // If JSON parsing fails but response was ok, still return success
      console.log("Response was OK but couldn't parse JSON, message likely sent successfully");
      return { success: true };
    }
  } catch (error) {
    console.error("Store message error:", error);
    throw error;
  }
};

// Send reply
export const sendReply = async (senderId, receiverId, content) => {
  try {
    const response = await fetch(`${API_BASE}/api/messages/reply`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        senderId,
        receiverId,
        productId: null,
        content,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to send reply");
    }

    // Try to parse JSON, but don't fail if it's not valid JSON
    try {
      return await response.json();
    } catch (jsonError) {
      // If JSON parsing fails but response was ok, still return success
      console.log("Response was OK but couldn't parse JSON, message likely sent successfully");
      return { success: true };
    }
  } catch (error) {
    console.error("Reply error:", error);
    throw error;
  }
};

// Get conversation between two users
export const getConversation = async (user1, user2) => {
  try {
    const response = await fetch(`${API_BASE}/api/messages/chat/${user1}/${user2}`);

    if (!response.ok) {
      throw new Error("Failed to fetch conversation");
    }

    return await response.json();
  } catch (error) {
    console.error("Conversation fetch error:", error);
    throw error;
  }
};

// Get all messages for a receiver
export const getMessagesForReceiver = async (receiverId) => {
  try {
    const response = await fetch(`${API_BASE}/api/messages/receiver/${receiverId}`);

    if (!response.ok) {
      throw new Error("Failed to fetch messages");
    }

    return await response.json();
  } catch (error) {
    console.error("Messages fetch error:", error);
    throw error;
  }
};
