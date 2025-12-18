import api from "../../api/axios";

export async function apiAddToWishlist(userId, productId) {
  try {
    // New backend: @PostMapping("/{userId}/{productId}")
    await api.post(`/api/wishlist/${userId}/${productId}`);
  } catch (err) {
    console.error("Failed to add to wishlist", err);
    throw new Error(err.response?.data?.message || "Failed to add to wishlist");
  }
}

export async function apiRemoveFromWishlist(userId, productId) {
  try {
    // New backend: @DeleteMapping("/{userId}/{productId}")
    await api.delete(`/api/wishlist/${userId}/${productId}`);
  } catch (err) {
    console.error("Failed to remove from wishlist", err);
    throw new Error(err.response?.data?.message || "Failed to remove from wishlist");
  }
}

export async function apiGetWishlist(userId) {
  try {
    // New backend: @GetMapping("/{userId}")
    const res = await api.get(`/api/wishlist/${userId}`);
    return res.data;
  } catch (err) {
    console.error("Failed to load wishlist", err);
    throw new Error(err.response?.data?.message || "Failed to load wishlist");
  }
}

export async function apiCheckWishlist(userId, productId) {
  try {
    // New backend: @GetMapping("/{userId}/check/{productId}")
    const res = await api.get(`/api/wishlist/${userId}/check/${productId}`);
    return res.data; // returns boolean true/false
  } catch (err) {
    console.error("Check wishlist status fail", err);
    return false;
  }
}

