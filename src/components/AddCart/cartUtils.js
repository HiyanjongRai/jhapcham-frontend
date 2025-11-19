// ================================
// cartUtils.js (UPDATED VERSION)
// ================================

const API_BASE = "http://localhost:8080";
const GUEST_CART_KEY = "guestCart";

/* =============================================
   GET CURRENT USER ID (decode "MQ==" → 1)
============================================= */
export function getCurrentUserId() {
  try {
    const encoded = localStorage.getItem("userId");
    if (!encoded) return null;

    const decoded = window.atob(encoded); // "MQ==" → "1"
    const idNum = Number(decoded);

    return Number.isNaN(idNum) ? null : idNum;
  } catch (e) {
    console.error("getCurrentUserId error:", e);
    return null;
  }
}

/* =============================================
   GUEST CART LOCAL STORAGE HANDLERS
============================================= */

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

export function addToGuestCart(product, quantity = 1) {
  const cart = loadGuestCart();

  const existing = cart.find((item) => item.productId === product.id);
  const unit = product.price ?? 0;

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
    });
  }

  saveGuestCart(cart);
  return cart;
}

/* =============================================
   API CALLS TO BACKEND CART
============================================= */

export async function apiAddToCart(userId, productId, quantity = 1) {
  const url = `${API_BASE}/api/cart/add?userId=${userId}&productId=${productId}&quantity=${quantity}`;
  const res = await fetch(url, { method: "POST" });

  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function apiGetCart(userId) {
  const url = `${API_BASE}/api/cart?userId=${userId}`;
  const res = await fetch(url);

  if (!res.ok) throw new Error(await res.text());
  return res.json(); // { items: [], total: 0 }
}

export async function apiUpdateQuantity(userId, productId, quantity) {
  const url = `${API_BASE}/api/cart/quantity?userId=${userId}&productId=${productId}&quantity=${quantity}`;
  const res = await fetch(url, { method: "PATCH" });

  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function apiRemoveItem(userId, productId) {
  const url = `${API_BASE}/api/cart/remove?userId=${userId}&productId=${productId}`;
  const res = await fetch(url, { method: "DELETE" });

  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

/* =============================================
   ⭐ NEW: MERGE GUEST CART INTO BACKEND CART
============================================= */
export async function mergeGuestCartIntoUser(userId) {
  const guestCart = loadGuestCart();

  if (!guestCart || guestCart.length === 0) {
    console.log("No guest cart to merge.");
    return;
  }

  console.log("Merging guest cart:", guestCart);

  // Loop each guest item and push to backend
  for (const item of guestCart) {
    await apiAddToCart(userId, item.productId, item.quantity);
  }

  // Clear guest cart after merging
  localStorage.removeItem(GUEST_CART_KEY);

  console.log("Guest cart merged successfully.");
}
export async function apiAddItem(userId, item) {
  const url = `${API_BASE}/api/cart/add?userId=${userId}&productId=${item.productId}&quantity=${item.quantity}`;

  const res = await fetch(url, {
    method: "POST"
  });

  if (!res.ok) {
    throw new Error("Add to cart failed");
  }

  return await res.json();
}


export async function apiPlaceOrderFromCart(userId) {
  const url = `${API_BASE}/orders/checkout?userId=${userId}`;
  const res = await fetch(url, { method: "POST" });

  if (!res.ok) {
    const msg = await res.text();
    throw new Error(msg);
  }

  return res.json();
}
