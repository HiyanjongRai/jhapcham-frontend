import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MessageCircle, Send, ArrowLeft, User, ChevronRight } from "lucide-react";
import { getCurrentUserId } from "../AddCart/cartUtils";
import { getMessagesForReceiver, getConversation, sendReply } from "./messageService";
import { API_BASE } from "../config/config";
import "./MessagesPage.css";

export default function MessagesPage() {
  const navigate = useNavigate();
  const currentUserId = getCurrentUserId();

  const [messages, setMessages] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [conversationMessages, setConversationMessages] = useState([]);
  const [replyText, setReplyText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!currentUserId) {
      navigate("/login");
      return;
    }
    loadMessages();
  }, [currentUserId]);

  const loadMessages = async () => {
    try {
      setLoading(true);
      const data = await getMessagesForReceiver(currentUserId);
      setMessages(data);

      // Group messages by the other person in conversation
      const grouped = {};
      data.forEach((msg) => {
        // Determine the other user in the conversation
        const otherUserId = msg.senderId === parseInt(currentUserId) ? msg.receiverId : msg.senderId;
        const otherUserName = msg.senderId === parseInt(currentUserId) ? msg.receiverUsername : msg.senderUsername;

        if (!grouped[otherUserId]) {
          // Format last message with product info if it's a product enquiry
          let lastMessagePreview = msg.content;
          if (msg.productId && msg.messageType === "PRODUCT_ENQUIRY") {
            const prodName = msg.productName || `ID: ${msg.productId}`;
            lastMessagePreview = `📦 Enquiry (${prodName}): ${msg.content}`;
          }

          grouped[otherUserId] = {
            userId: otherUserId,
            userName: otherUserName,
            lastMessage: lastMessagePreview,
            lastMessageTime: msg.sentAt,
            unread: msg.senderId !== parseInt(currentUserId),
          };
        }
      });

      setConversations(Object.values(grouped));
    } catch (error) {
      console.error("Failed to load messages:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadConversation = async (otherUserId, otherUserName) => {
    try {
      const data = await getConversation(currentUserId, otherUserId);
      setConversationMessages(data);
      setSelectedConversation({ userId: otherUserId, userName: otherUserName });
      
      // Mark all messages from this user as read
      try {
        await fetch(`${API_BASE}/api/messages/mark-read`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            receiverId: currentUserId,
            senderId: otherUserId
          })
        });
        
        // Trigger navbar to refresh message count
        window.dispatchEvent(new Event('messages-updated'));
      } catch (error) {
        console.error('Failed to mark messages as read:', error);
      }
    } catch (error) {
      console.error("Failed to load conversation:", error);
    }
  };

  const handleSendReply = async () => {
    if (!replyText.trim() || !selectedConversation) return;

    setSending(true);
    try {
      await sendReply(currentUserId, selectedConversation.userId, replyText);
      setReplyText("");
      // Reload conversation
      await loadConversation(selectedConversation.userId, selectedConversation.userName);
    } catch (error) {
      console.error("Failed to send reply:", error);
      alert("Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const handleBackToList = () => {
    setSelectedConversation(null);
    setConversationMessages([]);
    loadMessages();
  };

  if (loading) {
    return (
      <div className="messages-page">
        <div className="messages-loading">Loading messages...</div>
      </div>
    );
  }

  return (
    <div className="messages-page">
      <div className="messages-container">
        {/* Conversation List */}
        {!selectedConversation ? (
          <div className="messages-list">
            <div className="messages-header">
              <MessageCircle size={28} />
              <h1>Messages</h1>
            </div>

            {conversations.length === 0 ? (
              <div className="messages-empty">
                <MessageCircle size={64} color="#d1d5db" />
                <p>No messages yet</p>
                <span>Start a conversation by messaging a seller!</span>
              </div>
            ) : (
              <div className="conversations-list">
                {conversations.map((conv) => (
                  <div
                    key={conv.userId}
                    className="conversation-item"
                    onClick={() => loadConversation(conv.userId, conv.userName)}
                  >
                    <div className="conversation-avatar">
                      <User size={24} />
                    </div>
                    <div className="conversation-details">
                      <h3>{conv.userName}</h3>
                      <p>{conv.lastMessage}</p>
                    </div>
                    {conv.unread && <div className="conversation-unread"></div>}
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          // Conversation View
          <div className="conversation-view">
            <div className="conversation-header">
              <button className="back-btn" onClick={handleBackToList}>
                <ArrowLeft size={20} />
              </button>
              <div className="conversation-avatar">
                <User size={24} />
              </div>
              <h2>{selectedConversation.userName}</h2>
            </div>

            <div className="conversation-messages">
              {conversationMessages.map((msg, index) => (
                <div
                  key={index}
                  className={`message-bubble ${
                    msg.senderId === parseInt(currentUserId) ? "message-sent" : "message-received"
                  }`}
                >
                  {/* Show product info if it's a product enquiry */}
                  {msg.productId && msg.messageType === "PRODUCT_ENQUIRY" && (
                    <div 
                      className="message-product-tag clickable"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/products/${msg.productId}`);
                      }}
                      title="View Product Details"
                    >
                      {msg.productImage && (
                        <img 
                          src={`${API_BASE}/product-images/${msg.productImage}`} 
                          alt={msg.productName} 
                          className="msg-product-thumb"
                          onError={(e) => {
                            e.target.onerror = null; // Prevent infinite loop
                            e.target.src = "https://via.placeholder.com/40?text=Img";
                          }}
                        />
                      )}
                      <div className="msg-product-details">
                        <span className="msg-product-label">Product Enquiry</span>
                        <span className="msg-product-name">{msg.productName || `Product ID: ${msg.productId}`}</span>
                      </div>
                      <ChevronRight size={16} className="msg-product-arrow" />
                    </div>
                  )}
                  
                  <div className="message-content">{msg.content}</div>
                  <div className="message-time">
                    {new Date(msg.sentAt).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>

            <div className="conversation-reply">
              <textarea
                className="reply-input"
                placeholder="Type your message..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                rows={3}
                disabled={sending}
              />
              <button
                className="reply-btn"
                onClick={handleSendReply}
                disabled={sending || !replyText.trim()}
              >
                <Send size={18} />
                {sending ? "Sending..." : "Send"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
