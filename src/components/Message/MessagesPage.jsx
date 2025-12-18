import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MessageCircle, Send, ArrowLeft, User, ChevronRight } from "lucide-react";
import { getCurrentUserId } from "../AddCart/cartUtils";
import { getInbox, getSentMessages, getConversation, sendMessage } from "./messageService";
import { API_BASE } from "../config/config";
import "./MessagesPage.css";

export default function MessagesPage() {
  const navigate = useNavigate();
  const currentUserId = getCurrentUserId();

  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [conversationMessages, setConversationMessages] = useState([]);
  const [replyText, setReplyText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const loadMessages = React.useCallback(async () => {
    try {
      setLoading(true);
      // Fetch both inbox and sent to build full conversation list
      const [inbox, sent] = await Promise.all([
          getInbox(),
          getSentMessages()
      ]);
      
      const allMessages = [...inbox, ...sent];
      
      // Sort by date desc
      allMessages.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      // Group messages by the other person in conversation
      const grouped = {};
      
      allMessages.forEach((msg) => {
        const myId = parseInt(currentUserId);
        const isSender = msg.senderId === myId;
        
        // Determine the other user
        const otherUserId = isSender ? msg.receiverId : msg.senderId;
        const otherUserName = isSender ? msg.receiverName : msg.senderName;
        const otherUserProfile = isSender ? msg.receiverProfileImage : msg.senderProfileImage;

        if (!grouped[otherUserId]) {
          // Format last message
          let lastMessagePreview = msg.content;
          if (msg.productId) {
            lastMessagePreview = `📦 Enquiry: ${msg.content}`;
          }

          grouped[otherUserId] = {
            userId: otherUserId,
            userName: otherUserName || `User ${otherUserId}`,
            userImage: otherUserProfile,
            lastMessage: lastMessagePreview,
            lastMessageTime: msg.createdAt,
            unread: !isSender && !msg.read, // Use 'read' field from DTO
          };
        }
      });

      setConversations(Object.values(grouped));
    } catch (error) {
      console.error("Failed to load messages:", error);
    } finally {
      setLoading(false);
    }
  }, [currentUserId]);

  useEffect(() => {
    if (!currentUserId) {
      navigate("/login");
      return;
    }
    loadMessages();
  }, [currentUserId, loadMessages, navigate]);

  const loadConversationData = async (otherUserId, otherUserName) => {
    try {
      const data = await getConversation(otherUserId);
      // Sort oldest to newest for chat view
      const sorted = data.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      
      setConversationMessages(sorted);
      setSelectedConversation({ userId: otherUserId, userName: otherUserName });
      
      // Mark read logic would go here if backend supported it
    } catch (error) {
      console.error("Failed to load conversation:", error);
    }
  };

  const handleSendReply = async () => {
    if (!replyText.trim() || !selectedConversation) return;

    setSending(true);
    try {
      // Use generic sendMessage
      await sendMessage(selectedConversation.userId, replyText, null);
      setReplyText("");
      // Reload conversation to show new message
      await loadConversationData(selectedConversation.userId, selectedConversation.userName);
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
    loadMessages(); // Refresh list to update last message
  };

  if (loading && !selectedConversation) {
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
                    onClick={() => loadConversationData(conv.userId, conv.userName)}
                  >
                    <div className="conversation-avatar">
                      {conv.userImage ? (
                          <img src={`${API_BASE}/api/users/${conv.userId}/profile-image`} alt="" style={{width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover'}}/>
                      ) : <User size={24} />}
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
                  {msg.productId && (
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
                          src={`${API_BASE}/api/products/images/${msg.productImage}`} 
                          alt={msg.productName} 
                          className="msg-product-thumb"
                          onError={(e) => {
                            e.target.onerror = null; 
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
                    {new Date(msg.createdAt).toLocaleString()}
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
