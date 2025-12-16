import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { API_BASE } from "../config/config";
import { getCurrentUserId } from "../AddCart/cartUtils";
import MessageModal from "../Message/MessageModal";
import ReportModal from "../Report/ReportModal";
import FollowService from "./followService";
import "./SellerProfilePage.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faStar,
  faCheckCircle,
  faPlus,
  faBox,
  faChartLine,
  faCommentDots,
  faTruck,
  faUndo,
  faMapMarkerAlt,
  faCalendarAlt,
  faStore,
  faFlag
} from "@fortawesome/free-solid-svg-icons";

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
    try {
      const isFollowing = await FollowService.isFollowing(customerId, id);
      setIsFollowing(isFollowing);
    } catch (err) {
      console.error("Follow status error:", err);
    }
  };

  // Toggle Follow / Unfollow
  const toggleFollow = async () => {
    try {
      if (isFollowing) {
        // UNFOLLOW
        await FollowService.unfollowSeller(customerId, id);
        setIsFollowing(false);
        // Optimize: Update local count immediately to reflect change without re-fetching
         setSeller(prev => ({...prev, followerCount: (prev.followerCount || 0) - 1}));
      } else {
        // FOLLOW
        await FollowService.followSeller(customerId, id);
        setIsFollowing(true);
        // Optimize: Update local count immediately
        setSeller(prev => ({...prev, followerCount: (prev.followerCount || 0) + 1}));
      }
    } catch (err) {
      console.error("Follow toggle error:", err);
    }
  };

  if (loading) return <div className="spp-loading">Loading...</div>;
  if (!seller) return <div className="spp-loading">Seller Not Found</div>;

  const products = seller.products || [];

  return (
    <div className="spp-wrapper">
      {/* HEADER */}
      <div className="spp-header">
        <div className="spp-header-content">
          <div className="spp-logo-box">
            {seller.logoImagePath ? (
              <img
                src={`${API_BASE}/uploads/${seller.logoImagePath}`}
                alt="Logo"
                className="spp-store-logo"
              />
            ) : (
              <FontAwesomeIcon icon={faStore} className="spp-store-icon" />
            )}
          </div>

          <div className="spp-header-info">
            <h1 className="spp-title">{seller.storeName}</h1>

            <div className="spp-header-meta">
              <div className="spp-rating-row">
                {[...Array(5)].map((_, i) => (
                  <FontAwesomeIcon
                    key={i}
                    icon={faStar}
                    className={i < 4 ? "star-full" : "star-empty"}
                  />
                ))}
                <span className="spp-rating-text">4.8 (3450 reviews)</span>
              </div>

              <div className="spp-rating-row" style={{ marginLeft: "1.5rem" }}>
                <FontAwesomeIcon icon={faPlus} className="spp-icon-mr" style={{ color: '#FFD700' }} />
                <span className="spp-rating-text">{seller.followerCount || 0} Followers</span>
              </div>

              {seller.isVerified && (
                <div className="spp-verified-badge">
                  <FontAwesomeIcon icon={faCheckCircle} /> Verified Seller
                </div>
              )}
            </div>
          </div>

          {/* FOLLOW / UNFOLLOW BUTTON */}
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              className="spp-follow-btn"
              onClick={toggleFollow}
              style={{ opacity: isFollowing ? 0.7 : 1 }}
            >
              <FontAwesomeIcon icon={faPlus} />
              {isFollowing ? " Following" : " Follow Seller"}
            </button>

            <button
              className="spp-follow-btn"
              onClick={() => setShowMessageModal(true)}
              style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
            >
              <FontAwesomeIcon icon={faCommentDots} />
              {" Message Store"}
            </button>

             <button
              className="spp-follow-btn"
              onClick={() => setShowReportModal(true)}
              style={{ background: '#ef4444' }}
            >
              <FontAwesomeIcon icon={faFlag} />
              {" Report"}
            </button>
          </div>
        </div>
      </div>

      {/* MAIN LAYOUT */}
      <div className="spp-main-layout">
        {/* LEFT */}
        <div className="spp-left-col">
          <div className="spp-card">
            <div className="spp-card-header">
              <h3>
                <FontAwesomeIcon icon={faStore} className="spp-icon-mr" /> About the
                Seller
              </h3>
              {seller.isVerified && (
                <span className="spp-badge-black">
                  <FontAwesomeIcon icon={faCheckCircle} /> Verified
                </span>
              )}
            </div>

            <div className="spp-card-body">
              <h4 className="spp-subtitle">Store Description</h4>
              <p className="spp-text">{seller.description}</p>

              <h4 className="spp-subtitle mt-4">About the Seller</h4>
              <p className="spp-text">{seller.about}</p>

              <div className="spp-info-row mt-6">
                <div className="spp-info-col">
                  <label>Business Address</label>
                  <div className="spp-val">
                    <FontAwesomeIcon icon={faMapMarkerAlt} /> {seller.address}
                  </div>
                </div>

                <div className="spp-info-col">
                  <label>Member Since</label>
                  <div className="spp-val">
                    <FontAwesomeIcon icon={faCalendarAlt} />{" "}
                    {seller.joinedDate ? seller.joinedDate.split("T")[0] : "N/A"}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* STATS */}
          <div className="spp-card mt-6">
            <h3 className="spp-card-title">Performance Statistics</h3>

            <div className="spp-stats-grid">
              <div className="spp-stat-box">
                <FontAwesomeIcon icon={faBox} className="spp-stat-icon" />
                <div className="spp-stat-val">{products.length}</div>
                <div className="spp-stat-label">Total Products</div>
              </div>

              <div className="spp-stat-box">
                <FontAwesomeIcon icon={faChartLine} className="spp-stat-icon" />
                <div className="spp-stat-val">21500</div>
                <div className="spp-stat-label">Total Sales</div>
              </div>

              <div className="spp-stat-box">
                <FontAwesomeIcon icon={faCommentDots} className="spp-stat-icon" />
                <div className="spp-stat-val">98%</div>
                <div className="spp-stat-label">Response Rate</div>
              </div>

              <div className="spp-stat-box">
                <FontAwesomeIcon icon={faTruck} className="spp-stat-icon" />
                <div className="spp-stat-val">2.1 days</div>
                <div className="spp-stat-label">Avg Delivery</div>
              </div>

              <div className="spp-stat-box">
                <FontAwesomeIcon icon={faUndo} className="spp-stat-icon" />
                <div className="spp-stat-val">1.5%</div>
                <div className="spp-stat-label">Return Rate</div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT */}
        <div className="spp-right-col">
          <div className="spp-card">
            <h3 className="spp-card-title">Quick Stats</h3>
            <div className="spp-quick-stat-row">
              <span>Response Rate</span>
              <span>98%</span>
            </div>
            <div className="spp-quick-stat-row">
              <span>Avg Delivery</span>
              <span>2.1 days</span>
            </div>
            <div className="spp-quick-stat-row no-border">
              <span>Return Rate</span>
              <span>1.5%</span>
            </div>
          </div>

          <div className="spp-card mt-4">
            <h3 className="spp-card-title">Seller Badges</h3>
            <div className="spp-badges-row">
              <span className="spp-badge-dark">Top Seller</span>
              <span className="spp-badge-dark">Trusted</span>
              <span className="spp-badge-dark">Fast Shipper</span>
            </div>
          </div>

          <div className="spp-card mt-4">
            <h3 className="spp-card-title">Contact Information</h3>
            <p>{seller.address}</p>
            <p className="mt-3">{seller.joinedDate?.split("T")[0]}</p>
          </div>
        </div>
      </div>

      {/* PRODUCTS */}
      <div className="spp-section-title">Featured Products</div>

      <div className="spp-products-grid">
        {products.map((p) => (
          <div
            key={p.productId}
            className="spp-prod-card"
            onClick={() => navigate(`/products/${p.productId}`)}
          >
            <div className="spp-prod-img-wrap">
              <img
                src={`${API_BASE}/uploads/${p.mainImage}`}
                alt={p.name}
              />
            </div>

            <div className="spp-prod-details">
              <h4 className="spp-prod-name">{p.name}</h4>

              <div className="spp-prod-rating">
                {[...Array(5)].map((_, i) => (
                  <FontAwesomeIcon
                    key={i}
                    icon={faStar}
                    className={i < 4 ? "star-full" : "star-empty"}
                  />
                ))}
                <span className="ml-1">4.5</span>
              </div>

              <div className="spp-prod-price">₹{p.price}</div>
            </div>
          </div>
        ))}

        {products.length === 0 && (
          <div className="spp-no-products">No products found</div>
        )}
      </div>

      {/* Message Modal */}
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
        reportedEntityId={seller.userId} // Reporting the User ID of seller
        entityName={seller.storeName}
      />
    </div>
  );
}
