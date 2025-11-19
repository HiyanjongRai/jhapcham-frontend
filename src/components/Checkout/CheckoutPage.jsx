import React, { useEffect, useState } from "react";
import { getCurrentUserId, apiGetCart } from "../AddCart/cartUtils";
import { apiPlaceOrderFromCart } from "../AddCart/cartUtils";
import "./CheckoutPage.css";

function CheckoutPage() {
  const userId = getCurrentUserId();
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    if (!userId) return;
    loadCart();
  }, [userId]);

  const loadCart = async () => {
    try {
      const data = await apiGetCart(userId);
      console.log("CART DATA:", data); // debugging
      setItems(data.items || []);
      setTotal(data.total || 0);
    } catch (e) {
      console.log("Error loading cart:", e);
    }
  };

  const placeOrder = async () => {
    try {
      await apiPlaceOrderFromCart(userId);
      window.location.href = "/order-success";
    } catch (e) {
      alert(e.message || "Order failed");
    }
  };

  return (
    <div className="checkout-wrapper">

      {/* Billing form */}
      <div className="billing-box">
        <h2>Billing Details</h2>

        <input placeholder="Full Name" />
        <input placeholder="Street Address" />
        <input placeholder="City" />
        <input placeholder="Phone" />
        <input placeholder="Email" />
      </div>

      {/* Order Summary */}
      <div className="summary-box">
        <h2>Your Order</h2>

        <div className="summary-list">
          {items.map((item) => (
            <div key={item.productId} className="summary-row">

              <div className="summary-item-left">
                <img
                  src={
                    item.imagePath
                      ? `http://localhost:8080${item.imagePath}`
                      : "https://via.placeholder.com/80x80?text=No+Image"
                  }
                  alt={item.name}
                  className="summary-image"
                />

                <div>
                  <div className="summary-item-name">{item.name}</div>
                  <div className="summary-item-qty">Qty: {item.quantity}</div>
                  <div className="summary-item-price">
                    Price: ${item.unitPrice.toFixed(2)}
                  </div>
                </div>
              </div>

              <div className="summary-item-total">
                ${item.lineTotal.toFixed(2)}
              </div>

            </div>
          ))}
        </div>

        <hr />

        <div className="summary-total-row">
          <strong>Total:</strong>
          <strong>${total.toFixed(2)}</strong>
        </div>

        <button className="place-order-btn" onClick={placeOrder}>
          Place Order
        </button>
      </div>
    </div>
  );
}

export default CheckoutPage;
