import { API_BASE } from "../config/config";

export async function apiAddToWishlist(userId, productId) {
  const res = await fetch(`${API_BASE}/api/wishlist/${userId}/${productId}`, {
    method: "POST"
  });
  if (!res.ok) throw new Error("Failed to add to wishlist");
}

export async function apiRemoveFromWishlist(userId, productId) {
  const res = await fetch(`${API_BASE}/api/wishlist/${userId}/${productId}`, {
    method: "DELETE"
  });
  if (!res.ok) throw new Error("Failed to remove from wishlist");
}

export async function apiGetWishlist(userId) {
  const res = await fetch(`${API_BASE}/api/wishlist/${userId}`);
  if (!res.ok) throw new Error("Failed to load wishlist");
  return await res.json();
}

export async function apiCheckWishlist(userId, productId) {
  const res = await fetch(`${API_BASE}/api/wishlist/${userId}/check/${productId}`);
  if (!res.ok) return false;
  return await res.json(); // returns boolean true/false
}
