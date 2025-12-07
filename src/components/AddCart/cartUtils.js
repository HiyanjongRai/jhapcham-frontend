const API_BASE = "http://localhost:8080";
const GUEST_CART_KEY = "guestCart";

export function getCurrentUserId() {
  try {
    const encoded = localStorage.getItem("userId");
    if (!encoded) return null;
    const decoded = window.atob(encoded);
    const idNum = Number(decoded);
    return Number.isNaN(idNum) ? null : idNum;
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
  const body = { userId, productId, quantity, color, storage };
  const url = `${API_BASE}/api/cart/add`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const error = await parseErrorResponse(res, url);
    throw error;
  }
  
  return res.json();
}

export async function apiGetCart(userId) {
  const url = `${API_BASE}/api/cart?userId=${userId}`;
  const res = await fetch(url);
  
  if (!res.ok) {
    const error = await parseErrorResponse(res, url);
    throw error;
  }
  
  return res.json();
}

export async function apiUpdateQuantity(userId, productId, quantity, color, storage) {
  const body = { userId, productId, quantity, color, storage };
  const url = `${API_BASE}/api/cart/quantity`;

  const res = await fetch(url, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const error = await parseErrorResponse(res, url);
    throw error;
  }
  
  return res.json();
}

export async function apiRemoveItem(userId, productId, color, storage) {
  const body = { userId, productId, color, storage };
  const url = `${API_BASE}/api/cart/remove`;

  const res = await fetch(url, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const error = await parseErrorResponse(res, url);
    throw error;
  }
  
  return res.json();
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

export async function apiPlaceOrderFromCart(userId, fullAddress, lat, lng) {
  const params = new URLSearchParams();
  params.append("userId", userId);
  params.append("fullAddress", fullAddress || "");

  if (lat != null && lng != null) {
    params.append("lat", lat);
    params.append("lng", lng);
  }

  const url = `${API_BASE}/orders/checkout?${params.toString()}`;
  const res = await fetch(url, { method: "POST" });

  if (!res.ok) {
    const error = await parseErrorResponse(res, url);
    throw error;
  }
  
  return res.json();
}

