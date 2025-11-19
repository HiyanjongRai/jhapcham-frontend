// src/cart/CartPage.jsx
import React, { useEffect, useState } from "react";
import {
  getCurrentUserId,
  loadGuestCart,
  saveGuestCart,
  apiGetCart,
  apiUpdateQuantity,
  apiRemoveItem,
} from "./cartUtils";
import "./CartPage.css";

function CartPage() {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const userId = getCurrentUserId();
  const isLoggedIn = !!userId;

  const recalcTotal = (list) =>
    list.reduce((sum, i) => sum + (i.lineTotal || 0), 0);

  const loadCart = async () => {
    try {
      setLoading(true);
      setError("");

      if (isLoggedIn) {
        const data = await apiGetCart(userId);
        setItems(data.items || []);
        setTotal(data.total ?? recalcTotal(data.items || []));
      } else {
        const guestItems = loadGuestCart();
        setItems(guestItems);
        setTotal(recalcTotal(guestItems));
      }
    } catch (e) {
      setError(e.message || "Failed to load cart");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCart();
  }, [isLoggedIn, userId]);

  const handleQtyChange = async (productId, newQty) => {
    if (newQty <= 0) return;

    try {
      if (isLoggedIn) {
        await apiUpdateQuantity(userId, productId, newQty);
        await loadCart();
      } else {
        const updated = items.map((i) =>
          i.productId === productId
            ? {
                ...i,
                quantity: newQty,
                lineTotal: (i.unitPrice || 0) * newQty,
              }
            : i
        );
        setItems(updated);
        setTotal(recalcTotal(updated));
        saveGuestCart(updated);
      }
    } catch (e) {
      alert(e.message || "Unable to update quantity");
    }
  };

  const handleRemove = async (productId) => {
    try {
      if (isLoggedIn) {
        await apiRemoveItem(userId, productId);
        await loadCart();
      } else {
        const updated = items.filter((i) => i.productId !== productId);
        setItems(updated);
        setTotal(recalcTotal(updated));
        saveGuestCart(updated);
      }
    } catch (e) {
      alert(e.message || "Unable to remove item");
    }
  };

  if (loading) return <div className="cart-loading">Loading cart...</div>;
  if (error) return <div className="cart-error">{error}</div>;

  return (
    <div className="cart-page">
      <h1 className="cart-header">CART</h1>

      {items.length === 0 ? (
        <p>Your cart is empty.</p>
      ) : (
        <>
          <div className="cart-list">
            {items.map((item) => (
              <div key={item.productId} className="cart-row">
                <div className="cart-item-main">

                  {/* FIXED IMAGE PATH */}
                  <img
                    src={
                      item.imagePath
                        ? `http://localhost:8080${item.imagePath}`
                        : "https://via.placeholder.com/140x100?text=Product"
                    }
                    alt={item.name}
                    className="cart-item-image"
                  />

                  <div className="cart-item-info">
                    <div className="cart-item-name">{item.name}</div>
                    <button
                      className="cart-remove-link"
                      onClick={() => handleRemove(item.productId)}
                    >
                      Remove
                    </button>
                  </div>
                </div>

                <div className="cart-cell cart-price">
                  ${item.unitPrice?.toFixed(2)}
                </div>

                <div className="cart-cell cart-qty">
                  <button
                    className="qty-btn"
                    onClick={() =>
                      handleQtyChange(item.productId, item.quantity - 1)
                    }
                  >
                    –
                  </button>
                  <span className="qty-value">{item.quantity}</span>
                  <button
                    className="qty-btn"
                    onClick={() =>
                      handleQtyChange(item.productId, item.quantity + 1)
                    }
                  >
                    +
                  </button>
                </div>

                <div className="cart-cell cart-line-total">
                  ${item.lineTotal?.toFixed(2)}
                </div>
              </div>
            ))}
          </div>

          <div className="cart-summary">
            <div className="summary-row">
              <span>Grand total:</span>
              <span>${total.toFixed(2)}</span>
            </div>

            <button
              className="checkout-btn"
              onClick={() => (window.location.href = "/checkout")}
            >
              PROCEED TO CHECKOUT
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default CartPage;
