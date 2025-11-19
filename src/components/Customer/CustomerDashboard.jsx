import React, { useEffect, useState } from "react";
import "./CustomerDashboard.css";
import { apiGetCart, getCurrentUserId } from "../AddCart/cartUtils";
import ProductGrid from "../ProductGrind/ProductGrind";
import { useNavigate } from "react-router-dom";

const API_BASE = "http://localhost:8080";

export default function CustomerDashboard() {
  const [cartItems, setCartItems] = useState([]);
  const [cartTotal, setCartTotal] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [reviewNotifications, setReviewNotifications] = useState([]);

  const userId = getCurrentUserId();
  const navigate = useNavigate();

  async function loadNotifications() {
    const res = await fetch(`${API_BASE}/orders/tracking/user/${userId}`);
    const data = await res.json();

    setNotifications(data);

    // Filter only DELIVERED messages for reviews
    const reviewList = data.filter(n => n.stage === "DELIVERED");
    setReviewNotifications(reviewList);
  }

  useEffect(() => {
    loadNotifications();
  }, []);

  return (
    <div className="cd-wrapper">

      {/* Buttons Row */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "15px" }}>

        {/* Notification Button */}
        <button
          className="cd-top-btn"
          onClick={() => navigate("/notification-list")}
        >
          Notifications 🔔
          {notifications.length > 0 && (
            <span className="notify-count">{notifications.length}</span>
          )}
        </button>

        {/* Review Button */}
        <button
          className="cd-top-btn"
          onClick={() => navigate("/order-review-list")}
        >
          Order Reviews ⭐
          {reviewNotifications.length > 0 && (
            <span className="notify-count">{reviewNotifications.length}</span>
          )}
        </button>

      </div>

      <h2 className="cd-title">Customer Dashboard</h2>

      {/* CART UI */}
      <div className="cd-card">
        <h3>Your Cart</h3>
        {cartItems.length === 0 ? (
          <p>No items.</p>
        ) : (
          <div>
            {cartItems.map(item => (
              <div className="cd-cart-item" key={item.productId}>
                <img
                  src={`${API_BASE}/api/products/images/${item.imagePath}`}
                  alt=""
                />
                <div>
                  <h4>{item.name}</h4>
                  <p>Qty: {item.quantity}</p>
                  <p>Total: ${item.lineTotal}</p>
                </div>
              </div>
            ))}
            <strong>Total: ${cartTotal}</strong>
          </div>
        )}
      </div>

      {/* Product Browser */}
      <div className="cd-card">
        <h3>Browse Products</h3>
        <ProductGrid />
      </div>
    </div>
  );
}
