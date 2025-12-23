import api from "../../api/axios";
import { API_BASE } from "../config/config";

const GUEST_CART_KEY = "guestCart";

export function getCurrentUserId() {
  try {
    const value = localStorage.getItem("userId");
    if (!value) return null;

    // Try treating it as Base64 first (standard flow)
    try {
        const decoded = window.atob(value);
        const idNum = Number(decoded);
        if (!Number.isNaN(idNum) && idNum > 0) return idNum;
    } catch (e) {
        // Not base64 or failed to decode
    }

    // Fallback: Try treating as raw number (legacy or debug)
    const rawNum = Number(value);
    return (!Number.isNaN(rawNum) && rawNum > 0) ? rawNum : null;
  } catch {
    return null;
  }
}

export function loadGuestCart() {
  try {
    const raw = localStorage.getItem(GUEST_CART_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveGuestCart(items) {
  localStorage.setItem(GUEST_CART_KEY, JSON.stringify(items));
}

// Helper to update global count and notify Navbar
export function updateGlobalCartCount(count) {
  localStorage.setItem("cartCount", count);
  window.dispatchEvent(new Event("cart-updated"));
}

export function addToGuestCart(product, quantity = 1, color = null, storage = null) {
  const cart = loadGuestCart();
  const unit = product.price ?? 0;

  const existing = cart.find(
    (item) =>
      item.productId === product.id &&
      item.color === color &&
      item.storage === storage
  );

  if (existing) {
    existing.quantity += quantity;
    existing.lineTotal = existing.quantity * unit;
  } else {
    cart.push({
      productId: product.id,
      name: product.name,
      imagePath: product.imagePath,
      unitPrice: unit,
      quantity,
      lineTotal: unit * quantity,
      color,
      storage,
    });
  }

  saveGuestCart(cart);
  
  // Update global count (Sum of ALL quantities)
  const totalCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  updateGlobalCartCount(totalCount);
  
  return cart;
}

/**
 * Helper function to parse error responses from axios
 */
function handleApiError(error, path) {
  const response = error.response;
  if (response) {
    const errorData = response.data || {};
    return {
      status: response.status,
      message: errorData.message || 'An error occurred',
      details: errorData.details || errorData.error || response.statusText,
      timestamp: errorData.timestamp || new Date().toISOString(),
      path: path
    };
  }
  return {
    status: 500,
    message: error.message || 'Network error',
    details: 'Unable to connect to the server',
    timestamp: new Date().toISOString(),
    path: path
  };
}

// ---- API CALLS -----
export async function apiAddToCart(userId, productId, quantity, color, storage) {
  // Legacy Path: POST /api/cart/${userId}/add/${productId}
  const path = `/api/cart/${userId}/add/${productId}`;

  try {
    const res = await api.post(path, {
      quantity: quantity,
      selectedColor: color,
      selectedStorage: storage
    });

    // Legacy backend returns the updated cart DTO (CartResponseDTO)
    // with 'subtotal' and 'items'
    const cartData = res.data;
    if (cartData && Array.isArray(cartData.items)) {
        const totalCount = cartData.items.reduce((sum, item) => sum + item.quantity, 0);
        updateGlobalCartCount(totalCount);
    }

    return cartData;
  } catch (err) {
    throw handleApiError(err, path);
  }
}

export async function apiGetCart(userId) {
  // Legacy Path: GET /api/cart/${userId}
  const path = `/api/cart/${userId}`;
  try {
    const res = await api.get(path);
    const cartData = res.data;
    if (cartData && Array.isArray(cartData.items)) {
        const totalCount = cartData.items.reduce((sum, item) => sum + item.quantity, 0);
        updateGlobalCartCount(totalCount);
    }
    return cartData;
  } catch (err) {
    throw handleApiError(err, path);
  }
}

/**
 * Updates cart item quantity. Needs cartItemId for legacy PUT endpoint.
 */
export async function apiUpdateQuantity(userId, cartItemId, quantity) {
  // Legacy Path: PUT /api/cart/${userId}/update/${cartItemId}?qty=${quantity}
  const path = `/api/cart/${userId}/update/${cartItemId}`;

  try {
    const res = await api.put(path, null, {
        params: { qty: quantity }
    });

    const cartData = res.data;
    if (cartData && Array.isArray(cartData.items)) {
        const totalCount = cartData.items.reduce((sum, item) => sum + item.quantity, 0);
        updateGlobalCartCount(totalCount);
    }
    
    return cartData;
  } catch (err) {
    throw handleApiError(err, path);
  }
}

/**
 * Removes an item. Legacy approach uses updateQuantity with qty=0.
 * We need the cartItemId here.
 */
export async function apiRemoveItem(userId, cartItemId) {
  return apiUpdateQuantity(userId, cartItemId, 0);
}

export async function mergeGuestCartIntoUser(userId) {
  const guestCart = loadGuestCart();
  if (!guestCart || guestCart.length === 0) return;

  for (const item of guestCart) {
    try {
      await apiAddToCart(
        userId,
        item.productId,
        item.quantity,
        item.color,
        item.storage
      );
    } catch (e) {
      console.error("Failed to merge item:", item.productId, e);
    }
  }

  localStorage.removeItem(GUEST_CART_KEY);
}

// New method matching OrderController.preview
export async function apiPreviewOrder(checkoutRequest) {
  const path = "/api/orders/preview";
  try {
    const res = await api.post(path, checkoutRequest);
    return res.data;
  } catch (err) {
    throw handleApiError(err, path);
  }
}

// Checkout from Cart (Authenticated)
export async function apiPlaceOrderFromCart(cartCheckoutRequest) {
  const path = "/api/orders/cart";
  try {
    const res = await api.post(path, cartCheckoutRequest);
    return res.data;
  } catch (err) {
    throw handleApiError(err, path);
  }
}

// Direct Checkout / Guest Checkout / Buy Now
export async function apiPlaceOrder(checkoutRequest) {
  const path = "/api/orders";
  try {
    const res = await api.post(path, checkoutRequest);
    return res.data;
  } catch (err) {
    throw handleApiError(err, path);
  }
}

// Seller: Assign Branch
export async function apiSellerAssignBranch(sellerId, orderId, branchName) {
   const path = `/api/orders/seller/${sellerId}/assign/${orderId}`;
   try {
     const res = await api.put(path, { branch: branchName });
     return res.data;
   } catch (err) {
     throw handleApiError(err, path);
   }
}

// Branch: Update Status
export async function apiBranchUpdateStatus(orderId, branchName, nextStatus) {
    const path = `/api/orders/branch/${orderId}/status`;
    try {
      const res = await api.put(path, null, {
        params: { branch: branchName, nextStatus: nextStatus }
      });
      return res.data;
    } catch (err) {
      throw handleApiError(err, path);
    }
}

// Customer: Cancel Order
export async function apiCustomerCancelOrder(userId, orderId) {
    const path = `/api/orders/user/${userId}/cancel/${orderId}`;
    try {
      const res = await api.put(path);
      return res.data;
    } catch (err) {
      throw handleApiError(err, path);
    }
}

// Seller: Cancel Order
export async function apiSellerCancelOrder(sellerId, orderId) {
    const path = `/api/orders/seller/${sellerId}/cancel/${orderId}`;
    try {
      const res = await api.put(path);
      return res.data;
    } catch (err) {
      throw handleApiError(err, path);
    }
}

export async function apiGetOrder(orderId) {
  const path = `/api/orders/${orderId}`;
  try {
    const res = await api.get(path);
    return res.data;
  } catch (err) {
    throw handleApiError(err, path);
  }
}

export async function apiGetOrdersForUser(userId) {
  const path = `/api/orders/user/${userId}`;
  try {
    const res = await api.get(path);
    return res.data;
  } catch (err) {
    throw handleApiError(err, path);
  }
}

export async function apiGetUserOrdersSimple(userId) {
  const path = `/api/orders/user/${userId}/list`;
  try {
    const res = await api.get(path);
    return res.data;
  } catch (err) {
    throw handleApiError(err, path);
  }
}

export async function apiGetSellerOrders(sellerUserId) {
  const path = `/api/orders/seller/${sellerUserId}`;
  try {
    const res = await api.get(path);
    return res.data;
  } catch (err) {
    throw handleApiError(err, path);
  }
}

// Deprecated methods kept for backward compatibility if needed, 
// but should be replaced by apiPlaceOrder where possible.
export async function apiStartCheckout(userId, fullAddress, insideValley, paymentMethod, lat = null, lng = null) {
  console.warn("apiStartCheckout is execution path is deprecated. Migrating to apiPlaceOrder recommended.");
  // We can't easily map this to strict OrderController without item details.
  // Leaving as is but it will likely fail if backend removed the old controller.
  
  const params = {
    userId: userId,
    fullAddress: fullAddress,
    insideValley: insideValley.toString(),
    paymentMethod: paymentMethod, 
  };
  
  if (lat) params.lat = lat;
  if (lng) params.lng = lng;

  try {
    const res = await api.post("/api/checkout/start", null, { params });
    return res.data;
  } catch (error) {
    throw handleApiError(error, "/api/checkout/start");
  }
}

export async function apiMarkPaid(checkoutId) {
    try {
        const res = await api.post(`/api/checkout/pay/${checkoutId}`);
        return res.data;
    } catch (error) {
        throw handleApiError(error, `/api/checkout/pay/${checkoutId}`);
    }
}
