import React, { useState } from "react";
import { MessageCircle, X, Send } from "lucide-react";
import { sendProductEnquiry, sendStoreMessage } from "./messageService";
import { getCurrentUserId } from "../AddCart/cartUtils";
import "./MessageModal.css";

export default function MessageModal({
  isOpen,
  onClose,
  type, // "product" or "store"
  recipientId,
  recipientName,
  productId = null,
  productName = null,
}) {
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState({ type: "", text: "" });

  const currentUserId = getCurrentUserId();

  const handleSend = async () => {
    if (!message.trim()) {
      setFeedback({ type: "error", text: "Please enter a message" });
      return;
    }

    if (!currentUserId) {
      setFeedback({ type: "error", text: "Please login to send messages" });
      return;
    }

    setSending(true);
    setFeedback({ type: "", text: "" });

    try {
      if (type === "product") {
        await sendProductEnquiry(currentUserId, recipientId, productId, message);
      } else {
        await sendStoreMessage(currentUserId, recipientId, message);
      }

      setFeedback({ type: "success", text: "Message sent successfully!" });
      setMessage("");
      
      // Close modal after 1.5 seconds
      setTimeout(() => {
        onClose();
        setFeedback({ type: "", text: "" });
      }, 1500);
    } catch (error) {
      console.error("Message send failed:", error);
      let errMsg = "Failed to send message.";
      if (error.response?.status === 401 || error.response?.status === 403) {
          errMsg = "Session expired. Please login again.";
          // Optional: You could trigger a logout/redirect here
          // window.location.href = '/login'; 
      } else if (error.response?.data) {
          if (typeof error.response.data === 'string') {
              errMsg = error.response.data;
          } else if (error.response.data.message) {
              errMsg = error.response.data.message;
          }
      } else if (error.message) {
          errMsg = error.message;
      }
      setFeedback({ type: "error", text: errMsg });
    } finally {
      setSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="msg-modal-overlay" onClick={onClose}>
      <div className="msg-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="msg-modal-header">
          <div className="msg-modal-title">
            <MessageCircle size={24} />
            <h2>{type === "product" ? "Ask About Product" : "Message Store"}</h2>
          </div>
          <button className="msg-modal-close" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <div className="msg-modal-body">
          <div className="msg-recipient-info">
            <p className="msg-label">To:</p>
            <p className="msg-recipient-name">{recipientName}</p>
          </div>

          {type === "product" && productName && (
            <div className="msg-product-info">
              <p className="msg-label">Regarding:</p>
              <p className="msg-product-name">{productName}</p>
            </div>
          )}

          <div className="msg-input-group">
            <label className="msg-label">Your Message</label>
            <textarea
              className="msg-textarea"
              placeholder={
                type === "product"
                  ? "Ask about availability, specifications, shipping, etc..."
                  : "Send a message to the store..."
              }
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={6}
              disabled={sending}
            />
          </div>

          {feedback.text && (
            <div className={`msg-feedback msg-feedback-${feedback.type}`}>
              {feedback.text}
            </div>
          )}
        </div>

        <div className="msg-modal-footer">
          <button className="msg-btn msg-btn-cancel" onClick={onClose} disabled={sending}>
            Cancel
          </button>
          <button
            className="msg-btn msg-btn-send"
            onClick={handleSend}
            disabled={sending || !message.trim()}
          >
            <Send size={18} />
            {sending ? "Sending..." : "Send Message"}
          </button>
        </div>
      </div>
    </div>
  );
}
