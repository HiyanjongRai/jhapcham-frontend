import React, { useEffect, useState } from "react";
import axios from "axios";
import { getCurrentUserId } from "../config/authUtils";
import "./SellerOrders.css";

export default function SellerOrders() {
  const sellerId = getCurrentUserId();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const [orderBranches, setOrderBranches] = useState({});

  const branches = ["KATHMANDU", "POKHARA", "UDAYAPUR"];

  const loadOrders = async () => {
    try {
      const res = await axios.get(
        `http://localhost:8080/orders/seller/${sellerId}`
      );
      setOrders(res.data);
    } catch (err) {
      alert("Error loading orders");
    } finally {
      setLoading(false);
    }
  };

  // Map OrderStatus to TrackingStage
  const mapStatusToStage = (status) => {
    switch (status) {
      case "PROCESSING":
        return "PROCESSING";
      case "SHIPPED":
        return "OUT_FOR_DELIVERY";
      case "DELIVERED":
        return "DELIVERED";
      case "CANCELLED":
        return "PROCESSING";
      default:
        return "PROCESSING";
    }
  };

  const updateStatus = async (orderId, status) => {
    const branch = orderBranches[orderId];

    if (!branch) {
      alert("Please select a branch.");
      return;
    }

    try {
      // Step 1. Update order status
      await axios.patch(
        `http://localhost:8080/orders/${orderId}/status`,
        null,
        { params: { status: status } }
      );

      // Step 2. Add tracking entry
      await axios.post(
        `http://localhost:8080/orders/${orderId}/tracking`,
        null,
        {
          params: {
            stage: mapStatusToStage(status),
            branch: branch
          }
        }
      );

      loadOrders();
    } catch (err) {
      alert("Failed to update order");
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  if (loading) return <h2>Loading Orders...</h2>;

  return (
    <div className="seller-orders-container">
      <h1 className="seller-orders-title">Seller Orders</h1>

      {orders.length === 0 && <p>No orders found.</p>}

      {orders.map((order) => (
        <div key={order.orderId} className="order-card">
          <div className="order-header">
            <h3>Order #{order.orderId}</h3>
            <span className={`status-label status-${order.status.toLowerCase()}`}>
              {order.status}
            </span>
          </div>

          <div className="order-meta">
            <p><strong>Total:</strong> ${order.totalPrice.toFixed(2)}</p>
            <p><strong>Date:</strong> {order.createdAt}</p>
          </div>

          <div className="order-items">
            <strong>Items:</strong>
            <ul>
              {order.items.map((item) => (
                <li key={item.productId}>
                  {item.productName} x {item.quantity} (${item.lineTotal})
                </li>
              ))}
            </ul>
          </div>

          <div className="order-actions">

            {/* Branch Select */}
            <select
              className="branch-select"
              value={orderBranches[order.orderId] || ""}
              onChange={(e) =>
                setOrderBranches((prev) => ({
                  ...prev,
                  [order.orderId]: e.target.value,
                }))
              }
            >
              <option value="">Select Branch</option>
              {branches.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>

            {/* Buttons */}
            <button
              className="order-btn btn-process"
              onClick={() => updateStatus(order.orderId, "PROCESSING")}
            >
              PROCESSING
            </button>

            <button
              className="order-btn btn-ship"
              onClick={() => updateStatus(order.orderId, "SHIPPED")}
            >
              SHIPPED
            </button>

            <button
              className="order-btn btn-deliver"
              onClick={() => updateStatus(order.orderId, "DELIVERED")}
            >
              DELIVERED
            </button>

            <button
              className="order-btn btn-cancel"
              onClick={() => updateStatus(order.orderId, "CANCELLED")}
            >
              CANCEL ORDER
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
