import React, { useEffect, useState } from "react";
import {
  getCurrentUserId,
  loadGuestCart,
  saveGuestCart,
  apiGetCart,
  apiUpdateQuantity,
  apiRemoveItem
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
    list.reduce((sum, i) => sum + i.lineTotal, 0);

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

  /* INSTANT QTY UPDATE (NO FULL RELOAD) */

  const handleQtyChange = async (item, newQty) => {
    if (newQty <= 0) return;

    if (isLoggedIn) {
      try {
        await apiUpdateQuantity(
          userId,
          item.productId,
          newQty,
          item.color || null,
          item.storage || null
        );

        /* Update instantly without reload */
        setItems((prev) =>
          prev.map((i) =>
            i.productId === item.productId &&
            i.color === item.color &&
            i.storage === item.storage
              ? {
                  ...i,
                  quantity: newQty,
                  lineTotal: i.unitPrice * newQty
                }
              : i
          )
        );

        setTotal((prev) => {
          const oldLine = item.lineTotal;
          const newLine = item.unitPrice * newQty;
          return prev - oldLine + newLine;
        });
      } catch (e) {
        alert(e.message || "Unable to update quantity");
      }
    } else {
      /* Guest user */
      const updated = items.map((i) =>
        i.productId === item.productId &&
        i.color === item.color &&
        i.storage === item.storage
          ? { ...i, quantity: newQty, lineTotal: i.unitPrice * newQty }
          : i
      );
      setItems(updated);
      setTotal(recalcTotal(updated));
      saveGuestCart(updated);
    }
  };

  /* INSTANT REMOVE (NO RELOAD) */

  const handleRemove = async (item) => {
    if (isLoggedIn) {
      try {
        await apiRemoveItem(
          userId,
          item.productId,
          item.color || null,
          item.storage || null
        );

        /* Update instantly */
        setItems((prev) =>
          prev.filter(
            (i) =>
              !(
                i.productId === item.productId &&
                i.color === item.color &&
                i.storage === item.storage
              )
          )
        );

        setTotal((prev) => prev - item.lineTotal);
      } catch (e) {
        alert(e.message || "Unable to remove item");
      }
    } else {
      const updated = items.filter(
        (i) =>
          !(
            i.productId === item.productId &&
            i.color === item.color &&
            i.storage === item.storage
          )
      );
      setItems(updated);
      setTotal(recalcTotal(updated));
      saveGuestCart(updated);
    }
  };

  if (loading) return <div className="cart-loading">Loading cart...</div>;
  if (error) return <div className="cart-error">{error}</div>;

  return (
    <div className="cart-wrapper">
      <div className="cart-left">
        {items.map((item) => (
          <div
            key={`${item.productId}-${item.color}-${item.storage}`}
            className="cart-box"
          >
            <div className="item-info">
              <img
                src={
                  item.imagePath
                    ? `http://localhost:8080${item.imagePath}`
                    : "https://via.placeholder.com/130x130?text=Product"
                }
                alt={item.name}
                className="item-img"
              />

              <div className="item-text">
                <div className="item-title">{item.name}</div>

                <div className="item-tags">
                  {item.brand && <span>{item.brand}</span>}
                  {item.category && <span>{item.category}</span>}
                </div>

                {item.color && (
                  <div className="item-attr">Color: {item.color}</div>
                )}
                {item.storage && (
                  <div className="item-attr">Storage: {item.storage}</div>
                )}

                <button className="remove-btn" onClick={() => handleRemove(item)}>
                  Remove
                </button>
              </div>
            </div>

            <div className="item-price">${item.unitPrice.toFixed(2)}</div>

            <div className="item-qty">
              <button
                onClick={() => handleQtyChange(item, item.quantity - 1)}
                className="qty-button"
              >
                -
              </button>
              <span>{item.quantity}</span>
              <button
                onClick={() => handleQtyChange(item, item.quantity + 1)}
                className="qty-button"
              >
                +
              </button>
            </div>

            <div className="item-total">${item.lineTotal.toFixed(2)}</div>
          </div>
        ))}
      </div>

      <div className="cart-right">
        <div className="summary-box">
          <div className="summary-row">
            <span>Total Items</span>
            <span>{items.length}</span>
          </div>

          <div className="summary-row">
            <span>Subtotal</span>
            <span>${total.toFixed(2)}</span>
          </div>

          <div className="summary-row grand">
            <span>Grand Total</span>
            <span>${total.toFixed(2)}</span>
          </div>

          <button
            className="checkout-button"
            onClick={() => (window.location.href = "/checkout")}
          >
            Proceed to Checkout
          </button>

          <button
            className="continue-button"
            onClick={() => (window.location.href = "/index")}
          >
            Continue Shopping
          </button>
        </div>
      </div>
    </div>
  );
}

export default CartPage;
