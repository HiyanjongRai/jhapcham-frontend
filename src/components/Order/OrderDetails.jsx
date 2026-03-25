import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "../../api/axios";
import { 
  Package, 
  Truck, 
  CheckCircle, 
  XCircle, 
  MapPin, 
  ChevronLeft, 
  Clock, 
  FileText, 
  Printer, 
  User, 
  Calendar,
  CreditCard,
  Phone,
  Mail,
  Store,
  MoreVertical,
  ArrowRight
} from "lucide-react";
import "./OrderDetails.css";
import { API_BASE } from "../config/config";
import DashboardNavbar from "../Admin/DashboardNavbar.jsx";

const OrderDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const userRole = localStorage.getItem("userRole");

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`/api/orders/${id}`);
        setOrder(response.data);
      } catch (err) {
        console.error("Error fetching order details:", err);
        setError("Failed to load order manifestation. Please verify the ID.");
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [id]);

  const buildImageUrl = (imagePath) => {
    if (!imagePath) return "https://via.placeholder.com/80?text=No+Image";
    if (imagePath.startsWith("http")) return imagePath;
    const cleanPath = imagePath.startsWith('/') ? imagePath.slice(1) : imagePath;
    return `${API_BASE}/${cleanPath}`;
  };

  const statusMap = {
    NEW: { label: "Inbound", color: "amber", icon: <Clock size={16} /> },
    PENDING: { label: "Pending", color: "amber", icon: <Clock size={16} /> },
    PROCESSING: { label: "Processing", color: "blue", icon: <Package size={16} /> },
    SHIPPED_TO_BRANCH: { label: "Dispatched", color: "cyan", icon: <Truck size={16} /> },
    OUT_FOR_DELIVERY: { label: "In Transit", color: "indigo", icon: <Truck size={16} /> },
    DELIVERED: { label: "Fulfilled", color: "emerald", icon: <CheckCircle size={16} /> },
    CANCELED: { label: "Voided", color: "rose", icon: <XCircle size={16} /> },
  };

  if (loading) {
    return (
      <div className="od-loading-container">
        <div className="od-spinner"></div>
        <p>Decoding Transaction Manifest...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="od-error-container">
        <XCircle size={48} className="error-icon" />
        <h2>Manifest Not Found</h2>
        <p>{error || "The requested order document no longer exists in the registry."}</p>
        <button className="od-btn-back" onClick={() => navigate(-1)}>
          <ChevronLeft size={18} /> Return to Dashboard
        </button>
      </div>
    );
  }

  const currentStatus = statusMap[order.status] || { label: order.status, color: "gray", icon: <Clock size={16} /> };

  return (
    <div className="od-page-wrapper">
      <DashboardNavbar 
        title="Order Manifest" 
        role={userRole === 'ADMIN' ? 'ADMIN' : 'CUSTOMER'} 
        showSearch={false} 
      />
      <div className="od-nav-header">
        <div className="od-nav-left">
          <button className="od-btn-icon-back" onClick={() => navigate(-1)}>
            <ChevronLeft size={20} />
          </button>
          <div className="od-breadcrumb">
            <span>{userRole === 'ADMIN' ? 'Admin Hub' : (userRole === 'SELLER' ? 'Seller Hub' : 'My Account')}</span>
            <ArrowRight size={14} />
            <span>Order Manifest</span>
          </div>
        </div>
        <div className="od-nav-right">
          <button className="od-btn-print" onClick={() => window.print()}>
            <Printer size={18} /> Print Manifest
          </button>
          <button className="od-btn-more">
            <MoreVertical size={18} />
          </button>
        </div>
      </div>

      <div className="od-main-grid">
        {/* Left Column: Summary & Items */}
        <div className="od-col-left">
          <section className="od-card od-manifest-header">
            <div className="manifest-id">
              <span className="label">TRANSACTION ID</span>
              <h1>ORD-{String(order.orderId).padStart(6, '0')}</h1>
              <div className="manifest-meta">
                <span><Calendar size={14} /> {new Date(order.createdAt).toLocaleDateString(undefined, { dateStyle: 'long' })}</span>
                <span><Clock size={14} /> {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            </div>
            <div className={`manifest-status-badge ${currentStatus.color}`}>
              {currentStatus.icon}
              {currentStatus.label}
            </div>
          </section>

          <section className="od-card od-items-card">
            <div className="card-header">
              <h3 className="card-title"><Package size={18} /> Unit Manifest</h3>
              <span className="item-count">{order.items?.length} Items</span>
            </div>
            <div className="items-list">
              {order.items?.map((item, idx) => (
                <div key={idx} className="order-item-row">
                  <div className="item-image-box">
                    <img src={buildImageUrl(item.imagePath)} alt={item.name} />
                  </div>
                  <div className="item-details">
                    <h4>{item.name}</h4>
                    <p className="item-brand">{item.brand}</p>
                    {item.sellerStoreName && (
                      <div className="item-seller-info">
                        <Store size={12} />
                        <span>Sold by: {item.sellerStoreName}</span>
                      </div>
                    )}
                    <div className="item-variants">
                      {item.selectedColor && <span className="variant-tag">Color: {item.selectedColor}</span>}
                      {item.selectedStorage && <span className="variant-tag">Storage: {item.selectedStorage}</span>}
                    </div>
                  </div>
                  <div className="item-pricing">
                    <span className="unit-price">NPR {item.unitPrice.toLocaleString()} x {item.quantity}</span>
                    <span className="line-total">NPR {item.lineTotal.toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="od-card od-financial-card">
            <div className="financial-grid">
              <div className="fin-row">
                <span>Subtotal (Gross)</span>
                <span>NPR {order.itemsTotal?.toLocaleString()}</span>
              </div>
              <div className="fin-row">
                <span>Shipping & Logistics</span>
                <span>NPR {order.shippingFee?.toLocaleString()}</span>
              </div>
              {order.discountTotal > 0 && (
                <div className="fin-row discount">
                  <span>Promo Discount Applied</span>
                  <span>- NPR {order.discountTotal?.toLocaleString()}</span>
                </div>
              )}
              <div className="fin-divider"></div>
              <div className="fin-row grand-total">
                <span>Settlement Grand Total</span>
                <span>NPR {order.grandTotal?.toLocaleString()}</span>
              </div>
            </div>
          </section>
        </div>

        {/* Right Column: Customer & Logistics */}
        <div className="od-col-right">
          <section className="od-card od-customer-card">
            <h3 className="card-title"><User size={18} /> Customer Profile</h3>
            <div className="customer-overview">
              <div className="customer-avatar-v3">
                {order.customerProfileImagePath ? (
                  <img src={buildImageUrl(order.customerProfileImagePath)} alt="" />
                ) : (
                  <div className="avatar-placeholder">{(order.customerName || 'U').charAt(0)}</div>
                )}
              </div>
              <div className="customer-name-box">
                <h4>{order.customerName || "Confidential User"}</h4>
                <div className={`user-type-tag ${order.customerProfileImagePath ? 'verified' : ''}`}>
                  {order.customerProfileImagePath ? 'Authenticated Buyer' : 'Guest Checkout'}
                </div>
              </div>
            </div>
            <div className="contact-details">
              <div className="contact-row">
                <Phone size={14} />
                <span>+977 {order.customerPhone}</span>
              </div>
              {order.customerAlternativePhone && (
                <div className="contact-row alternative">
                  <Phone size={14} />
                  <span>+977 {order.customerAlternativePhone} (Alt)</span>
                </div>
              )}
              <div className="contact-row">
                <Mail size={14} />
                <span>{order.customerEmail}</span>
              </div>
            </div>
          </section>

          {/* Merchant Profile (Only for Admin/Seller) */}
          {(userRole === 'ADMIN' || userRole === 'SELLER') && order.sellerStoreName && (
            <section className="od-card od-merchant-card">
              <h3 className="card-title"><Store size={18} /> Merchant Profile</h3>
              <div className="customer-overview">
                <div className="customer-avatar-v3">
                  {order.sellerLogoPath ? (
                    <img src={buildImageUrl(order.sellerLogoPath)} alt="" />
                  ) : (
                    <div className="avatar-placeholder">{(order.sellerStoreName || 'S').charAt(0)}</div>
                  )}
                </div>
                <div className="customer-name-box">
                  <h4>{order.sellerStoreName}</h4>
                  <div className="user-type-tag verified">
                    Registered Merchant
                  </div>
                </div>
              </div>
              <div className="contact-details">
                 <div className="contact-row">
                   <User size={14} />
                   <span>{order.sellerFullName}</span>
                 </div>
                 <div className="contact-row">
                   <Mail size={14} />
                   <span>{order.sellerEmail}</span>
                 </div>
              </div>
            </section>
          )}

          <section className="od-card od-logistics-card">
            <h3 className="card-title"><Truck size={18} /> Logistics & Hub</h3>
            <div className="logistics-info">
              <div className="log-item">
                <div className="log-icon-v3"><MapPin size={18} /></div>
                <div className="log-text">
                  <label>Shipping Destination</label>
                  <p>{order.shippingAddress}</p>
                  <span className="location-tag">{order.shippingLocation} Valley</span>
                </div>
              </div>
              <div className="log-item">
                <div className="log-icon-v3"><Clock size={18} /></div>
                <div className="log-text">
                  <label>Preference Window</label>
                  <p>{order.deliveryTimePreference || "Standard Business Hours"}</p>
                </div>
              </div>
            </div>
            {order.orderNote && (
              <div className="order-notes-box">
                <label><FileText size={14} /> Delivery Instructions</label>
                <div className="notes-content">{order.orderNote}</div>
              </div>
            )}
          </section>

          <section className="od-card od-payment-card">
            <h3 className="card-title"><CreditCard size={18} /> Payment Intelligence</h3>
            <div className="payment-summary">
              <div className={`payment-method-box ${(order.paymentMethod || 'COD').toLowerCase()}`}>
                <span className="method-label">
                  {order.paymentMethod === 'ESEWA' ? 'eSewa Digital' : 
                   order.paymentMethod === 'KHALTI' ? 'Khalti Wallet' : 
                   'Cash on Delivery'}
                </span>
                <span className="payment-status">
                  {order.paymentMethod === 'COD' ? 'Unpaid / Pending Verification' : 'Transaction Settled'}
                </span>
              </div>
              {order.paymentReference && (
                <div className="payment-ref">
                  <label>Reference Code</label>
                  <code>{order.paymentReference}</code>
                </div>
              )}
            </div>
          </section>

          {/* Seller Settlement Summary (Only for Seller/Admin) */}
          {(userRole === 'ADMIN' || userRole === 'SELLER') && order.sellerNetAmount && (
            <section className="od-card od-settlement-card">
              <h3 className="card-title">💵 Disbursement Info</h3>
              <div className="settlement-breakdown">
                <div className="set-row">
                  <span>Gross (Items Only)</span>
                  <span>NPR {order.sellerGrossAmount?.toLocaleString()}</span>
                </div>
                <div className="set-row">
                  <span>Marketplace Logistics</span>
                  <span>- NPR {order.sellerShippingCharge?.toLocaleString()}</span>
                </div>
                <div className="set-divider"></div>
                <div className="set-row net-income">
                  <span>Merchant Net Income</span>
                  <span>NPR {order.sellerNetAmount?.toLocaleString()}</span>
                </div>
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderDetails;
