import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getCurrentUserId } from "../AddCart/cartUtils";

const API_BASE = "http://localhost:8080";

export default function NotificationList() {
  const userId = getCurrentUserId();
  const [trackingList, setTrackingList] = useState([]);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  useEffect(() => {
    async function loadTracking() {
      try {
        const res = await fetch(`${API_BASE}/orders/tracking/user/${userId}`);
        const data = await res.json();

        // Sort newest first
        data.sort((a, b) => new Date(b.updateTime) - new Date(a.updateTime));

        setTrackingList(data);
      } catch (err) {
        console.error("Notification load error:", err);
      } finally {
        setLoading(false);
      }
    }

    loadTracking();
  }, [userId]);

  if (loading) return <p style={{ padding: 20 }}>Loading notifications...</p>;

  return (
    <div style={{ padding: 20 }}>
      <h2>Notifications</h2>

      {trackingList.length === 0 ? (
        <p>No notifications found.</p>
      ) : (
        trackingList.map(n => {
          // Custom review message
          const customMessage =
            n.stage === "DELIVERED"
              ? "We heard you received your product. Please share a review."
              : n.message;

          return (
            <div
              key={n.id}
              onClick={() => {
                // If delivered, save orderId and go to review page
                if (n.stage === "DELIVERED" && n.orderId) {
                  localStorage.setItem("reviewOrderId", n.orderId);
                  navigate("/review");
                } else {
                  // Otherwise open normal notification details
                  navigate(`/notification/${n.id}`);
                }
              }}
              style={{
                border: "1px solid #ccc",
                padding: 12,
                borderRadius: 8,
                marginBottom: 10,
                cursor: "pointer",
                background: "#fafafa"
              }}
            >
              <strong>{n.stage}</strong>
              <p>{customMessage}</p>
              <small>{new Date(n.updateTime).toLocaleString()}</small>
            </div>
          );
        })
      )}
    </div>
  );
}
