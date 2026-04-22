import React, { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { 
  MessageCircle, Send, ArrowLeft, User, 
  ChevronRight, Search, Phone, MapPin, 
  Mail, Calendar, ShoppingBag, Eye,
  LayoutDashboard, MoreVertical, Paperclip,
  Clock, Hash, BadgeInfo, Image as ImageIcon,
  Link as LinkIcon, Smile, Film, Star,
  Filter, MessageSquare
} from "lucide-react";
import { getCurrentUserId } from "../AddCart/cartUtils";
import { getInbox, getSentMessages, getConversation, sendMessage, markAsRead } from "./messageService";
import { API_BASE } from "../config/config";
import "./MessagesPage.css";
import DashboardNavbar from "../Admin/DashboardNavbar.jsx";
import CustomerSidebar from "../Customer/CustomerSidebar.jsx";
import SellerSidebar from "../Seller/SellerSidebar.jsx";
import api from "../../api/axios";

const LayoutWrapper = ({ children, isSeller, isCustomer, isAdmin, storeInfo, userProfile }) => {
  const navigate = useNavigate();
  if (isSeller) {
    return (
      <div className="dashboard" style={{ height: '100vh', overflow: 'hidden', display: 'flex' }}>
        <SellerSidebar storeInfo={storeInfo} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
          <DashboardNavbar title="Message Studio" role="SELLER" showSearch={false} customUserName={storeInfo?.shopName || storeInfo?.storeName} />
          <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
            {children}
          </div>
        </div>
      </div>
    );
  }
  if (isCustomer) {
    return (
      <div className="dashboard" style={{ height: '100vh', overflow: 'hidden', display: 'flex' }}>
        <CustomerSidebar storeInfo={storeInfo} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
          <DashboardNavbar title="Message Studio" role="CUSTOMER" showSearch={false} customUserName={userProfile?.fullName} />
          <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
             {children}
          </div>
        </div>
      </div>
    );
  }
  if (isAdmin) {
    return (
      <div className="dashboard" style={{ height: '100vh', overflow: 'hidden', display: 'flex', background: '#f5f7f9' }}>
         <div className="adm-sidebar-hub">
            <div className="adm-sidebar-brand">
               <div className="adm-brand-logo"><MessageSquare size={20}/></div>
               <div className="adm-brand-text">
                  <div className="adm-brand-name">Jhapcham</div>
                  <div className="adm-brand-role">Message Studio</div>
               </div>
            </div>
            <div className="adm-sidebar-nav-hub">
               <div className="adm-nav-label">System</div>
               <button className="adm-nav-item-hub" onClick={() => navigate('/admin/dashboard')}>
                  <LayoutDashboard size={18} />
                  <span>Control Center</span>
               </button>
               <button className="adm-nav-item-hub active">
                  <MessageSquare size={18} />
                  <span>Inbox Hub</span>
               </button>
            </div>
         </div>
         <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
            <DashboardNavbar title="Communication Hub" role="ADMIN" showSearch={false} />
            <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
               {children}
            </div>
         </div>
      </div>
    );
  }
  return <div className="messages-standalone" style={{ padding: '0' }}>{children}</div>;
};

export default function MessagesPage() {
  const navigate = useNavigate();
  const currentUserId = getCurrentUserId();
  const userRole = localStorage.getItem("userRole");
  const isCustomer = userRole === 'CUSTOMER';
  const isSeller = userRole === 'SELLER';
  const feedRef = useRef(null);

  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [conversationMessages, setConversationMessages] = useState([]);
  const [otherUserInfo, setOtherUserInfo] = useState(null);
  
  const [replyText, setReplyText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [storeInfo, setStoreInfo] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  const scrollToBottom = () => {
    if (feedRef.current) {
      feedRef.current.scrollTop = feedRef.current.scrollHeight;
    }
  };

  const loadMessages = useCallback(async () => {
    try {
      setLoading(true);
      const [inbox, sent] = await Promise.all([getInbox(), getSentMessages()]);
      const allMessages = [...inbox, ...sent];
      allMessages.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      const grouped = {};
      allMessages.forEach((msg) => {
        const myId = parseInt(currentUserId);
        const isSender = msg.senderId === myId;
        const oId = isSender ? msg.receiverId : msg.senderId;
        const oName = isSender ? msg.receiverName : msg.senderName;
        const oImg = isSender ? msg.receiverProfileImage : msg.senderProfileImage;

        if (!grouped[oId]) {
          const isMsgFromO = !isSender;
          const oRole = isMsgFromO ? msg.senderRole : (msg.receiverRole || null); // Note: receiverRole might not be in DTO yet
          
          grouped[oId] = {
            userId: oId,
            userName: oName || `User ${oId}`,
            userImage: oImg,
            userRole: oRole === "ADMIN" || oName === "Jhapcham Official Admin" ? "ADMIN" : oRole,
            lastMessage: msg.content,
            lastMessageTime: msg.createdAt,
            unread: !isSender && (msg.isRead === false || msg.read === false),
          };
        } else if (!grouped[oId].userRole || grouped[oId].userRole !== "ADMIN") {
           // Update role if we find an ADMIN message later in the loop
           const incomingRole = !isSender ? msg.senderRole : null;
           if (incomingRole === "ADMIN" || oName === "Jhapcham Official Admin") {
              grouped[oId].userRole = "ADMIN";
           }
        }
      });
      setConversations(Object.values(grouped));
    } catch (error) {
      console.error("Hub Core Load Error:", error);
    } finally {
      setLoading(false);
    }
  }, [currentUserId]);

  useEffect(() => {
    if (!currentUserId) {
      navigate("/login");
      return;
    }
    if (isCustomer) {
      api.get(`/api/users/${currentUserId}`).then(res => setUserProfile(res.data)).catch(console.error);
    } else if (isSeller) {
      api.get(`/api/seller/${currentUserId}/dashboard`).then(res => setStoreInfo(res.data)).catch(console.error);
    }
    loadMessages();
  }, [currentUserId, loadMessages, navigate, isCustomer, isSeller]);

  useEffect(() => {
    scrollToBottom();
  }, [conversationMessages]);

  const selectConversation = async (conv) => {
    setOtherUserInfo({ fullName: conv.userName, userId: conv.userId });
    setSelectedConversation(conv);
    
    try {
      const data = await getConversation(conv.userId);
      setConversationMessages(data.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)));
      await markAsRead(conv.userId);

      // Deep Intel Fetch
      const targetEndpoint = isSeller ? `/api/users/${conv.userId}` : `/api/seller-profiles/${conv.userId}`;
      api.get(targetEndpoint).then(res => setOtherUserInfo(res.data)).catch(console.warn);
    } catch (e) {
      console.error("Conversation Switch Error:", e);
    }
  };

  const handleSendReply = async () => {
    if (!replyText.trim() || !selectedConversation || sending) return;
    setSending(true);
    const text = replyText;
    setReplyText("");
    try {
      await sendMessage(selectedConversation.userId, text, null);
      const updated = await getConversation(selectedConversation.userId);
      setConversationMessages(updated.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)));
    } catch (error) {
      console.error("Reply Transmission Error:", error);
      setReplyText(text);
    } finally {
      setSending(false);
    }
  };

  const filteredConversations = conversations.filter(c => 
    c.userName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <LayoutWrapper 
      isSeller={isSeller} 
      isCustomer={isCustomer} 
      isAdmin={userRole === 'ADMIN'}
      storeInfo={storeInfo} 
      userProfile={userProfile}
    >
      <div className="messages-hub">

        <div className="hub-sidebar-list">
          <div className="hub-list-header">
            <h2 className="gt-h2">Messages</h2>
            <div className="hub-search-box">
              <Search size={18} color="#9ca3af" />
              <input 
                placeholder="Search messages" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Filter size={18} color="#9ca3af" style={{ cursor: 'pointer' }} />
            </div>
          </div>
          
          <div className="hub-scroll-list">
            {filteredConversations.map((conv) => (
              <div
                key={conv.userId}
                className={`conv-row ${selectedConversation?.userId === conv.userId ? 'active' : ''}`}
                onClick={() => selectConversation(conv)}
              >
                <div className={`conv-row-avatar ${conv.userRole === 'ADMIN' ? 'admin-avatar' : ''}`}>
                  {conv.userRole === 'ADMIN' ? (
                     <div className="admin-status-icon" style={{ backgroundColor: '#1e293b', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Hash size={24} color="white" /></div>
                  ) : conv.userImage ? (
                    <img src={`${API_BASE}/${conv.userImage}`} alt="" onError={(e) => e.target.src = "https://via.placeholder.com/100"} />
                  ) : <User size={24} />}
                </div>
                <div className="conv-row-main">
                  <div className="conv-row-top">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                       <span className="conv-row-name">{conv.userName}</span>
                       {conv.userRole === 'ADMIN' && <span className="admin-tag-sidebar" style={{ background: '#1e293b', color: 'white', fontSize: '0.6rem', fontWeight: '800', padding: '2px 6px', borderRadius: '4px' }}>ADMIN</span>}
                    </div>
                    <span className="conv-row-time">{new Date(conv.lastMessageTime).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                  </div>
                  <div className="conv-row-msg">
                     <p>{conv.lastMessage}</p>
                  </div>
                </div>
              </div>
            ))}
            {filteredConversations.length === 0 && <div className="hub-empty">No messages found.</div>}
          </div>
        </div>

        <div className="hub-chat-main">
          {selectedConversation ? (
            <>
               <div className="hub-chat-header">
                  <div className="hub-header-avatar">
                    {selectedConversation.userRole === 'ADMIN' ? (
                       <div style={{ width: '48px', height: '48px', backgroundColor: '#1e293b', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Hash size={24} color="white" /></div>
                    ) : (
                       <img src={`${API_BASE}/${otherUserInfo?.logoImagePath || otherUserInfo?.profileImagePath || conversations.find(c => c.userId === selectedConversation.userId)?.userImage}`} alt="" onError={(e) => e.target.src = "https://via.placeholder.com/100"} />
                    )}
                  </div>
                  <div className="hub-header-meta">
                     <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <h3 style={{ margin: 0 }}>{selectedConversation.userName}</h3>
                        {selectedConversation.userRole === 'ADMIN' && <span style={{ background: '#1e293b', color: 'white', fontSize: '0.7rem', fontWeight: '800', padding: '2px 8px', borderRadius: '6px' }}>OFFICIAL ADMIN</span>}
                     </div>
                     <div className="status-subtitle">{selectedConversation.userRole === 'ADMIN' ? 'Jhapcham Authority Center' : isSeller ? 'Online - Verified Customer' : 'Operational Merchant'}</div>
                  </div>
                 <div style={{ marginLeft: 'auto', display: 'flex', gap: '20px', color: '#6b7280' }}>
                    <Star size={20} style={{ cursor: 'pointer' }} />
                    <MoreVertical size={20} style={{ cursor: 'pointer' }} />
                 </div>
              </div>

              <div className="hub-chat-feed" ref={feedRef}>
                 <div className="hub-date-divider">
                    <div className="line" />
                    <span>TODAY</span>
                    <div className="line" />
                 </div>

                 {conversationMessages.map((msg, i) => {
                   const isMe = msg.senderId === parseInt(currentUserId);
                   const isAdminMsg = msg.senderRole === "ADMIN";
                   return (
                     <div key={msg.id || i} className={`hub-msg-wrap ${isMe ? 'sent' : 'received'} ${isAdminMsg ? 'admin-notice' : ''}`}>
                       {!isMe && (
                         <div className="hub-msg-avatar-small">
                            {isAdminMsg ? (
                              <div className="admin-avatar-icon" style={{ backgroundColor: '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', borderRadius: '50%' }}>
                                <Hash size={12} color="white" />
                              </div>
                            ) : (
                              <img src={`${API_BASE}/${otherUserInfo?.logoImagePath || otherUserInfo?.profileImagePath || conversations.find(c => c.userId === selectedConversation.userId)?.userImage}`} alt="" onError={(e) => e.target.src = "https://via.placeholder.com/100"} />
                            )}
                         </div>
                       )}
                       <div className="hub-msg-content">
                          {isAdminMsg && <span className="admin-status-label" style={{ fontSize: '0.65rem', fontWeight: '800', color: '#1e293b', marginBottom: '4px', display: 'block' }}>OFFICIAL JHAPCHAM ADMIN</span>}
                          <div className={`hub-msg-bubble ${isAdminMsg ? 'admin-bubble' : ''}`}>
                             {msg.content}
                          </div>
                          <span className="msg-time">{new Date(msg.createdAt).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                       </div>
                     </div>
                   );
                 })}
              </div>

              <div className="hub-chat-input-container">
                 <div className="hub-input-wrapper">
                    <textarea 
                      placeholder="Write a message..."
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSendReply())}
                    />
                    <div className="hub-input-footer">
                       <div className="hub-input-tools">
                          <ImageIcon className="hub-tool-btn" size={20} />
                          <LinkIcon className="hub-tool-btn" size={20} />
                          <Smile className="hub-tool-btn" size={20} />
                          <Film className="hub-tool-btn" size={20} />
                          <span style={{ fontSize: '0.75rem', fontWeight: '800', cursor: 'pointer' }} className="hub-tool-btn">GIF</span>
                       </div>
                       <button className="hub-send-action-btn" onClick={handleSendReply} disabled={sending || !replyText.trim()}>
                         Send
                       </button>
                    </div>
                 </div>
              </div>
            </>
          ) : (
            <div className="hub-chat-placeholder">
               <MessageCircle size={64} color="#e5e7eb" />
               <p>Select a message to start conversation</p>
            </div>
          )}
        </div>
      </div>
    </LayoutWrapper>
  );
}

