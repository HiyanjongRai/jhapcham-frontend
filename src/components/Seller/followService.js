import { API_BASE } from "../config/config";
import axios from "axios";

const FollowService = {
  followSeller: async (userId, sellerId) => {
    try {
      const response = await axios.post(`${API_BASE}/api/follow/${userId}/follow/${sellerId}`);
      return response.data;
    } catch (error) {
      console.error("Error following seller:", error);
      throw error;
    }
  },

  unfollowSeller: async (userId, sellerId) => {
    try {
      const response = await axios.delete(`${API_BASE}/api/follow/${userId}/unfollow/${sellerId}`);
      return response.data;
    } catch (error) {
      console.error("Error unfollowing seller:", error);
      throw error;
    }
  },

  isFollowing: async (userId, sellerId) => {
    try {
      const response = await axios.get(`${API_BASE}/api/follow/${userId}/is-following/${sellerId}`);
      return response.data;
    } catch (error) {
      console.error("Error checking follow status:", error);
      throw error;
    }
  }
};

export default FollowService;
