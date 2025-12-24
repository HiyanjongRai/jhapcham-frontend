import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { API_BASE } from "../config/config";
import { getCurrentUserId } from "../AddCart/cartUtils";
import MessageModal from "../Message/MessageModal";
import ReportModal from "../Report/ReportModal";
import FollowService from "./followService";
import "./SellerProfilePage.css";
import { 
  Star, 
  CheckCircle, 
  Plus, 
  UserPlus, 
  MessageSquare, 
  Flag, 
  Package, 
  TrendingUp, 
  MessageCircle, 
  Truck, 
  RotateCcw, 
  MapPin, 
  Calendar,
  Store,
  ChevronRight,
  ShieldCheck,
  Check
} from "lucide-react";

export default function SellerProfilePage() {
  const { id } = useParams(); // Seller ID
  const navigate = useNavigate();

  const customerId = getCurrentUserId(); // Get logged-in user ID

  const [seller, setSeller] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);

  useEffect(() => {
    loadSellerProfile();
    checkFollowStatus();
    // Scroll to top on load
    window.scrollTo(0, 0);
  }, [id]);

  // Fetch seller profile
  const loadSellerProfile = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/api/seller-profiles/${id}`);
      if (!res.ok) throw new Error("Seller not found");

      const data = await res.json();
      setSeller(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Check if user is already following
  const checkFollowStatus = async () => {
    if (!customerId) return;
    try {
      const isFollowing = await FollowService.isFollowing(customerId, id);
      setIsFollowing(isFollowing);
    } catch (err) {
      console.error("Follow status error:", err);
    }
  };

  // Toggle Follow / Unfollow
  const toggleFollow = async () => {
    if (!customerId) {
      navigate('/login');
      return;
    }
    
    try {
      if (isFollowing) {
        // UNFOLLOW
        await FollowService.unfollowSeller(customerId, id);
        setIsFollowing(false);
        setSeller(prev => ({...prev, followerCount: (prev.followerCount || 0) - 1}));
      } else {
        // FOLLOW
        await FollowService.followSeller(customerId, id);
        setIsFollowing(true);
        setSeller(prev => ({...prev, followerCount: (prev.followerCount || 0) + 1}));
      }
    } catch (err) {
      console.error("Follow toggle error:", err);
    }
  };

  if (loading) return <div className="spp-loading">Loading store profile...</div>;
  if (!seller) return <div className="spp-loading">Store Not Found</div>;

  const products = seller.products || [];

  return (
    <div className="spp-wrapper">
      {/* PREMIUM HEADER */}
      <div className="spp-header">
        <div className="spp-header-content">
          <div className="spp-logo-box">
            {(seller.logoImagePath || seller.profileImagePath) ? (
              <img
                src={`${API_BASE}/${seller.logoImagePath || seller.profileImagePath}`}
                alt={seller.storeName}
                className="spp-store-logo"
              />
            ) : (
              <Store size={64} className="spp-store-icon" />
            )}
          </div>

          <div className="spp-header-info">
            <h1 className="spp-title">{seller.storeName}</h1>

            <div className="spp-header-meta">
              <div className="spp-rating-row">
                <div style={{ display: 'flex' }}>
                   {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      size={16}
                      fill={i < 4 ? "#facc15" : "transparent"}
                      className={i < 4 ? "star-full" : "star-empty"}
                    />
                  ))}
                </div>
                <span className="spp-rating-text">4.8 (3,450 Reviews)</span>
              </div>

              <div className="spp-rating-row">
                <UserPlus size={16} />
                <span className="spp-rating-text">{seller.followerCount || 0} Followers</span>
              </div>

              {seller.isVerified && (
                <div className="spp-verified-badge">
                  <ShieldCheck size={18} />
                  Verified Store
                </div>
              )}
            </div>
          </div>

          <div className="spp-header-actions">
            <button
              className={`spp-action-btn spp-follow-btn ${isFollowing ? 'following' : ''}`}
              onClick={toggleFollow}
            >
              {isFollowing ? <Check size={20} /> : <Plus size={20} />}
              {isFollowing ? "Following" : "Follow Store"}
            </button>

            <button
              className="spp-action-btn spp-message-btn"
              onClick={() => setShowMessageModal(true)}
            >
              <MessageSquare size={20} />
              Message
            </button>

             <button
              className="spp-action-btn spp-report-btn"
              onClick={() => setShowReportModal(true)}
              title="Report Store"
            >
              <Flag size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="spp-main-layout">
        {/* LEFT COLUMN: About & Stats */}
        <div className="spp-left-col">
          <div className="spp-card">
            <div className="spp-card-header">
              <h3>
                <Store size={22} className="spp-icon-accent" /> Store Overview
              </h3>
            </div>

            <div className="spp-card-body">
              <div className="spp-subtitle">Store Description</div>
              <p className="spp-text">{seller.description || "No description provided."}</p>

              {seller.about && (
                <>
                  <div className="spp-subtitle" style={{ marginTop: '32px' }}>Personal Journey</div>
                  <p className="spp-text">{seller.about}</p>
                </>
              )}

              <div className="spp-info-grid">
                <div className="spp-info-item">
                  <label>Service Area</label>
                  <div className="spp-info-val">
                    <MapPin size={18} className="spp-text-muted" /> {seller.address || "Global"}
                  </div>
                </div>

                <div className="spp-info-item">
                  <label>Partnership Since</label>
                  <div className="spp-info-val">
                    <Calendar size={18} className="spp-text-muted" />{" "}
                    {seller.joinedDate ? new Date(seller.joinedDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : "N/A"}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="spp-stats-container">
            <div className="spp-stats-grid">
              <div className="spp-stat-card">
                <div className="spp-stat-header">
                  <div className="spp-stat-icon-wrap"><Package size={20} /></div>
                  <div className="spp-stat-label">Catalog Size</div>
                </div>
                <div className="spp-stat-val">{products.length}</div>
                <div className="spp-stat-label">Active Products</div>
              </div>

              <div className="spp-stat-card">
                <div className="spp-stat-header">
                  <div className="spp-stat-icon-wrap"><TrendingUp size={20} /></div>
                  <div className="spp-stat-label">Total Sales</div>
                </div>
                <div className="spp-stat-val">2.5k+</div>
                <div className="spp-stat-label">Deliveries completed</div>
              </div>

              <div className="spp-stat-card">
                <div className="spp-stat-header">
                  <div className="spp-stat-icon-wrap"><MessageCircle size={20} /></div>
                  <div className="spp-stat-label">Avg. Response</div>
                </div>
                <div className="spp-stat-val">98%</div>
                <div className="spp-stat-label">Within 2 hours</div>
              </div>

              <div className="spp-stat-card">
                <div className="spp-stat-header">
                  <div className="spp-stat-icon-wrap"><Truck size={20} /></div>
                  <div className="spp-stat-label">Logistics Score</div>
                </div>
                <div className="spp-stat-val">4.9</div>
                <div className="spp-stat-label">Delivery satisfaction</div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Sidebar Bits */}
        <div className="spp-right-col">
          <div className="spp-widget">
            <h3 className="spp-widget-title">Quick Performance</h3>
            <div className="spp-quick-row">
              <span className="spp-quick-label">On-time Shipping</span>
              <span className="spp-quick-val">99%</span>
            </div>
            <div className="spp-quick-row">
              <span className="spp-quick-label">Return Rate</span>
              <span className="spp-quick-val">0.8%</span>
            </div>
            <div className="spp-quick-row">
              <span className="spp-quick-label">Cancellation Rate</span>
              <span className="spp-quick-val">0.2%</span>
            </div>
          </div>

          <div className="spp-widget">
            <h3 className="spp-widget-title">Recognitions</h3>
            <div className="spp-badge-list">
              <span className="spp-status-badge">Elite Merchant</span>
              <span className="spp-status-badge">Trusted Brand</span>
              <span className="spp-status-badge">Express Shipper</span>
              <span className="spp-status-badge">Carbon Neutral</span>
            </div>
          </div>

          <div className="spp-card" style={{ padding: '24px' }}>
             <h3 className="spp-subtitle">Transparency Score</h3>
             <div style={{ padding: '20px', background: '#f8fafc', borderRadius: '16px', textAlign: 'center' }}>
                <ShieldCheck size={40} color="#10b981" />
                <div style={{ fontSize: '1.25rem', fontWeight: '800', marginTop: '10px' }}>Excellent</div>
                <div style={{ fontSize: '0.85rem', color: '#64748b' }}>Verified Business Entity</div>
             </div>
          </div>
        </div>
      </div>

      {/* PRODUCTS SECTION */}
      <div className="spp-section-header">
        <h2 className="spp-section-title">Latest & Trending</h2>
        <div style={{ color: '#6366f1', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
          View All Collection <ChevronRight size={20} />
        </div>
      </div>

      <div className="spp-products-grid">
        {products.map((p) => (
          <div
            key={p.productId}
            className="spp-prod-card"
            onClick={() => navigate(`/products/${p.productId}`)}
          >
            <div className="spp-prod-img-wrap">
              <img
                src={`${API_BASE}/${p.imagePaths?.[0] || p.mainImage || p.imagePath}`}
                alt={p.name}
              />
            </div>

            <div className="spp-prod-details">
              <h4 className="spp-prod-name">{p.name}</h4>

              <div className="spp-prod-rating">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    size={14}
                    fill={i < 4 ? "#facc15" : "transparent"}
                    className={i < 4 ? "star-full" : "star-empty"}
                  />
                ))}
                <span style={{ fontSize: '0.85rem', fontWeight: '700', marginLeft: '6px' }}>4.8</span>
              </div>

              <div className="spp-prod-price">{p.price.toLocaleString()}</div>
            </div>
          </div>
        ))}

        {products.length === 0 && (
          <div className="spp-no-products">
            <Package size={48} className="spp-text-muted" style={{ marginBottom: '16px' }} />
            <p>This store hasn't listed any products yet.</p>
          </div>
        )}
      </div>

      {/* MODALS */}
      <MessageModal
        isOpen={showMessageModal}
        onClose={() => setShowMessageModal(false)}
        type="store"
        recipientId={seller.userId}
        recipientName={seller.storeName}
      />
      
      <ReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        type="SELLER"
        reportedEntityId={seller.userId}
        entityName={seller.storeName}
      />
    </div>
  );
}
