const API_BASE = "http://localhost:8080";
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
function updateGlobalCartCount(count) {
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
 * Helper function to parse error responses from backend
 */
async function parseErrorResponse(response, url) {
  try {
    const errorData = await response.json();
    
    // Return structured error object
    return {
      status: response.status,
      message: errorData.message || 'An error occurred',
      details: errorData.details || errorData.error || response.statusText,
      errors: errorData.errors || {},
      timestamp: errorData.timestamp || new Date().toISOString(),
      path: errorData.path || url,
      trace: errorData.trace
    };
  } catch (e) {
    // If response is not JSON, create error from status text
    return {
      status: response.status,
      message: response.statusText || 'An error occurred',
      details: await response.text().catch(() => 'Unknown error'),
      timestamp: new Date().toISOString(),
      path: url
    };
  }
}

// ---- API CALLS -----
export async function apiAddToCart(userId, productId, quantity, color, storage) {
  const url = `${API_BASE}/api/cart/${userId}/add/${productId}`;

  const body = {
    quantity: quantity,
    selectedColor: color,
    selectedStorage: storage
  };

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const error = await parseErrorResponse(res, url);
    throw error;
  }
  
  const data = await res.json();
  
  // Sync Count
  try {
     const cart = await apiGetCart(userId);
     if(Array.isArray(cart.items)) { // check cart.items for the new structure
         const total = cart.items.reduce((sum, item) => sum + item.quantity, 0);
         updateGlobalCartCount(total);
     } else if (Array.isArray(cart)) { 
        // fallback if apiGetCart returns list directly (old behavior)
        const total = cart.reduce((sum, item) => sum + item.quantity, 0);
        updateGlobalCartCount(total);
     }
  } catch(e) { console.error("Failed to sync cart count", e); }

  return data;
}

export async function apiGetCart(userId) {
  const url = `${API_BASE}/api/cart/${userId}`;
  const res = await fetch(url);
  
  if (!res.ok) {
    const error = await parseErrorResponse(res, url);
    throw error;
  }
  
  return res.json();
}

/**
 * Updates cart item quantity. using cartItemId.
 */
export async function apiUpdateQuantity(userId, cartItemId, quantity) {
  const url = `${API_BASE}/api/cart/${userId}/update/${cartItemId}?qty=${quantity}`;

  const res = await fetch(url, {
    method: "PUT",
    headers: { "Content-Type": "application/json" }
  });

  if (!res.ok) {
    const error = await parseErrorResponse(res, url);
    throw error;
  }
  
  const data = await res.json();
  
  // Sync Count
  try {
     const cart = await apiGetCart(userId);
     if(cart && Array.isArray(cart.items)) {
         const total = cart.items.reduce((sum, item) => sum + item.quantity, 0);
         updateGlobalCartCount(total);
     } else if (Array.isArray(cart)) {
         const total = cart.reduce((sum, item) => sum + item.quantity, 0);
         updateGlobalCartCount(total);
     }
  } catch(e) { console.error("Failed to sync cart count", e); }
  
  return data;
}

/**
 * Removes an item by setting quantity to 0 via update endpoint
 */
export async function apiRemoveItem(userId, cartItemId) {
  return apiUpdateQuantity(userId, cartItemId, 0);
}

export async function mergeGuestCartIntoUser(userId) {
  const guestCart = loadGuestCart();
  if (!guestCart || guestCart.length === 0) return;

  for (const item of guestCart) {
    await apiAddToCart(
      userId,
      item.productId,
      item.quantity,
      item.color,
      item.storage
    );
  }

  localStorage.removeItem(GUEST_CART_KEY);
}

// New method matching OrderController.preview
export async function apiPreviewOrder(checkoutRequest) {
  const url = `${API_BASE}/api/orders/preview`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(checkoutRequest),
  });

  if (!res.ok) {
    const error = await parseErrorResponse(res, url);
    throw error;
  }
  return res.json();
}

// Checkout from Cart (Authenticated)
// Uses CartCheckoutRequestDTO (no items list needed)
export async function apiPlaceOrderFromCart(cartCheckoutRequest) {
  const url = `${API_BASE}/api/orders/cart`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(cartCheckoutRequest),
  });

  if (!res.ok) {
    const error = await parseErrorResponse(res, url);
    throw error;
  }
  return res.json();
}

// Direct Checkout / Guest Checkout / Buy Now
// Uses CheckoutRequestDTO (includes items list)
export async function apiPlaceOrder(checkoutRequest) {
  const url = `${API_BASE}/api/orders`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(checkoutRequest),
  });

  if (!res.ok) {
    const error = await parseErrorResponse(res, url);
    throw error;
  }
  return res.json();
}

// Seller: Assign Branch
export async function apiSellerAssignBranch(sellerId, orderId, branchName) {
   const url = `${API_BASE}/api/orders/seller/${sellerId}/assign/${orderId}`;
   const res = await fetch(url, {
       method: "PUT",
       headers: { "Content-Type": "application/json" },
       body: JSON.stringify({ branch: branchName })
   });
   
   if (!res.ok) {
     const error = await parseErrorResponse(res, url);
     throw error;
   }
   return res.json();
}

// Branch: Update Status
export async function apiBranchUpdateStatus(orderId, branchName, nextStatus) {
    const params = new URLSearchParams({ branch: branchName, nextStatus: nextStatus });
    const url = `${API_BASE}/api/orders/branch/${orderId}/status?${params.toString()}`;
    const res = await fetch(url, { method: "PUT" });
    
    if (!res.ok) {
      const error = await parseErrorResponse(res, url);
      throw error;
    }
    return res.json();
}

// Customer: Cancel Order
export async function apiCustomerCancelOrder(userId, orderId) {
    const url = `${API_BASE}/api/orders/user/${userId}/cancel/${orderId}`;
    const res = await fetch(url, { method: "PUT" });
    
    if (!res.ok) {
      const error = await parseErrorResponse(res, url);
      throw error;
    }
    return res.json();
}

// Seller: Cancel Order
export async function apiSellerCancelOrder(sellerId, orderId) {
    const url = `${API_BASE}/api/orders/seller/${sellerId}/cancel/${orderId}`;
    const res = await fetch(url, { method: "PUT" });
    
    if (!res.ok) {
      const error = await parseErrorResponse(res, url);
      throw error;
    }
    return res.json();
}

export async function apiGetOrder(orderId) {
  const url = `${API_BASE}/api/orders/${orderId}`;
  const res = await fetch(url);

  if (!res.ok) {
    const error = await parseErrorResponse(res, url);
    throw error;
  }
  return res.json();
}

export async function apiGetOrdersForUser(userId) {
  const url = `${API_BASE}/api/orders/user/${userId}`;
  const res = await fetch(url);

  if (!res.ok) {
    const error = await parseErrorResponse(res, url);
    throw error;
  }
  return res.json();
}

export async function apiGetUserOrdersSimple(userId) {
  const url = `${API_BASE}/api/orders/user/${userId}/list`;
  const res = await fetch(url);

  if (!res.ok) {
    const error = await parseErrorResponse(res, url);
    throw error;
  }
  return res.json();
}

export async function apiGetSellerOrders(sellerUserId) {
  const url = `${API_BASE}/api/orders/seller/${sellerUserId}`;
  const res = await fetch(url);

  if (!res.ok) {
    const error = await parseErrorResponse(res, url);
    throw error;
  }
  return res.json();
}

// Deprecated methods kept for backward compatibility if needed, 
// but should be replaced by apiPlaceOrder where possible.
export async function apiStartCheckout(userId, fullAddress, insideValley, paymentMethod, lat = null, lng = null) {
  console.warn("apiStartCheckout is execution path is deprecated. Migrating to apiPlaceOrder recommended.");
  // We can't easily map this to strict OrderController without item details.
  // Leaving as is but it will likely fail if backend removed the old controller.
  
  const params = new URLSearchParams({
    userId: userId,
    fullAddress: fullAddress,
    insideValley: insideValley.toString(),
    paymentMethod: paymentMethod, 
  });
  
  if (lat) params.append('lat', lat);
  if (lng) params.append('lng', lng);

  const url = `${API_BASE}/api/checkout/start?` + params.toString();

  const res = await fetch(url, {
    method: "POST",
  });

  if (!res.ok) {
      const error = await parseErrorResponse(res, url);
      throw error;
  }
  return res.json();
}

export async function apiMarkPaid(checkoutId) {
    const url = `${API_BASE}/api/checkout/pay/${checkoutId}`;
     const res = await fetch(url, {
        method: "POST"
     });
     if (!res.ok) {
         const error = await parseErrorResponse(res, url);
         throw error;
     }
     return res.json();
}
