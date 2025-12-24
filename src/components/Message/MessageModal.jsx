import React, { useState } from "react";
import { MessageCircle, X, Send } from "lucide-react";
import { sendProductEnquiry, sendStoreMessage } from "./messageService";
import { getCurrentUserId } from "../AddCart/cartUtils";
import { API_BASE } from "../config/config";
import "./MessageModal.css";

export default function MessageModal({
  isOpen,
  onClose,
  type, // "product", "store", or "admin"
  recipientId,
  recipientName,
  productId = null,
  productName = null,
  reportContext = null, // Contains { reason, reporter, targetName, targetId, targetImage }
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

    let finalContent = message;
    if (type === "admin" && reportContext) {
        finalContent = `[ADMIN NOTICE - DISPUTE RESOLUTION]\n\nTarget: ${reportContext.targetName} (ID: ${reportContext.targetId})\nReporter: ${reportContext.reporter}\nReason: ${reportContext.reason}\n\nMessage:\n${message}`;
    }

    try {
      if (type === "product") {
        await sendProductEnquiry(currentUserId, recipientId, productId, message);
      } else {
        await sendStoreMessage(currentUserId, recipientId, finalContent);
      }

      setFeedback({ type: "success", text: "Message sent successfully!" });
      setMessage("");
      
      setTimeout(() => {
        onClose();
        setFeedback({ type: "", text: "" });
      }, 1500);
    } catch (error) {
      console.error("Message send failed:", error);
      let errMsg = "Failed to send message.";
      if (error.response?.status === 401 || error.response?.status === 403) {
          errMsg = "Session expired. Please login again.";
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

  const getTitle = () => {
      if (type === "product") return "Ask About Product";
      if (type === "admin") return "Dispute Resolution Notice";
      return "Message Store";
  };

  return (
    <div className="msg-modal-overlay" onClick={onClose}>
      <div className="msg-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="msg-modal-header">
          <div className="msg-modal-title">
            <MessageCircle size={24} />
            <h2>{getTitle()}</h2>
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

          {type === "admin" && reportContext && (
            <div className="msg-admin-context-card" style={{ 
                background: '#fff1f2', 
                border: '1px solid #fda4af', 
                borderRadius: '16px',
                padding: '1.25rem',
                display: 'flex',
                gap: '1rem'
            }}>
                {reportContext.targetImage && (
                    <img 
                        src={reportContext.targetImage.startsWith('http') ? reportContext.targetImage : `${API_BASE}/${reportContext.targetImage}`}
                        alt=""
                        style={{ width: '60px', height: '60px', borderRadius: '8px', objectFit: 'cover', border: '2px solid white' }}
                    />
                )}
                <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#e11d48', textTransform: 'uppercase' }}>Report Details</span>
                        <span style={{ fontSize: '0.65rem', fontWeight: 600, color: '#9f1239' }}>ID: {reportContext.targetId}</span>
                    </div>
                    <div style={{ fontSize: '1rem', fontWeight: 700, color: '#1e293b', marginBottom: '4px' }}>{reportContext.targetName}</div>
                    <div style={{ fontSize: '0.8rem', color: '#475569' }}>
                        <strong>Reporter:</strong> {reportContext.reporter}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#475569', marginTop: '4px', fontStyle: 'italic' }}>
                        "{reportContext.reason}"
                    </div>
                </div>
            </div>
          )}

          <div className="msg-input-group">
            <label className="msg-label">Your Message</label>
            <textarea
              className="msg-textarea"
              placeholder={
                type === "product"
                  ? "Ask about availability, specifications, shipping, etc..."
                  : type === "admin"
                  ? "Describe findings or request investigation steps..."
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
