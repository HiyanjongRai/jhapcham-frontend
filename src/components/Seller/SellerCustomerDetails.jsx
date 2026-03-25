import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "../../api/axios";
import { 
  User, 
  ShoppingBag, 
  Calendar, 
  Phone, 
  Mail, 
  ChevronLeft, 
  TrendingUp, 
  Clock, 
  ExternalLink,
  ShieldCheck,
  AlertCircle
} from "lucide-react";
import "./SellerCustomerDetails.css";
import { getCurrentUserId } from "../../utils/authUtils";
import { API_BASE } from "../config/config";

const SellerCustomerDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const sellerId = getCurrentUserId();
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCustomer = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`/api/seller/${sellerId}/customers/${id}`);
        setCustomer(response.data);
      } catch (err) {
        console.error("Error fetching customer details for seller:", err);
        setError("Failed to load customer profile. Access may be restricted.");
      } finally {
        setLoading(false);
      }
    };

    fetchCustomer();
  }, [id, sellerId]);

  const buildImageUrl = (path) => {
    if (!path) return null;
    if (path.startsWith("http")) return path;
    const cleanPath = path.startsWith('/') ? path.slice(1) : path;
    return `${API_BASE}/${cleanPath}`;
  };

  if (loading) {
    return (
      <div className="scd-loading">
        <div className="scd-spinner"></div>
        <p>Analyzing Customer Relations...</p>
      </div>
    );
  }

  if (error || !customer) {
    return (
      <div className="scd-error">
        <AlertCircle size={48} />
        <h2>Intelligence Restricted</h2>
        <p>{error || "We couldn't retrieve the requested customer profile."}</p>
        <button onClick={() => navigate(-1)}><ChevronLeft size={18} /> Return to Orders</button>
      </div>
    );
  }

  return (
    <div className="scd-container">
      <header className="scd-header">
        <div className="scd-header-left">
          <button className="scd-btn-back" onClick={() => navigate(-1)}>
            <ChevronLeft size={20} />
          </button>
          <div className="scd-title-box">
            <h1>Customer Intelligence</h1>
            <p>Aggregated metrics for your store's relationship with this user.</p>
          </div>
        </div>
        <div className="scd-header-right">
           <button className="scd-btn-action secondary">Log Audit</button>
           <button className="scd-btn-action primary">Contact User</button>
        </div>
      </header>

      <div className="scd-layout">
        <aside className="scd-sidebar">
          <section className="scd-card scd-profile-card">
            <div className="scd-avatar-box">
              {customer.profileImagePath ? (
                <img src={buildImageUrl(customer.profileImagePath)} alt="" />
              ) : (
                <div className="scd-avatar-placeholder">{(customer.fullName || 'U').charAt(0)}</div>
              )}
              {customer.status === 'ACTIVE' && <div className="scd-status-dot" title="Active Account"></div>}
            </div>
            <h2 className="scd-customer-name">{customer.fullName}</h2>
            <div className={`scd-badge ${customer.status === 'ACTIVE' ? 'active' : 'suspended'}`}>
              {customer.status === 'ACTIVE' ? <ShieldCheck size={14} /> : <AlertCircle size={14} />}
              {customer.status}
            </div>
            
            <div className="scd-contact-list">
              <div className="scd-contact-item">
                <Mail size={16} />
                <span>{customer.email}</span>
              </div>
              <div className="scd-contact-item">
                <Phone size={16} />
                <span>+977 {customer.phone || 'N/A'}</span>
              </div>
              <div className="scd-contact-item">
                <Calendar size={16} />
                <span>Joined {new Date(customer.joinedAt).toLocaleDateString()}</span>
              </div>
            </div>
          </section>

          <section className="scd-card scd-stats-card">
            <h3 className="card-title">Store Performance</h3>
            <div className="scd-mini-stats">
              <div className="mini-stat">
                <span className="label">Total Acquisition</span>
                <span className="value">NPR {customer.totalSpentWithSeller?.toLocaleString()}</span>
              </div>
              <div className="mini-stat">
                <span className="label">Order Frequency</span>
                <span className="value">{customer.orderCountWithSeller} Transactions</span>
              </div>
              <div className="mini-stat">
                 <span className="label">Retention</span>
                 <span className="value">{(customer.orderCountWithSeller > 1) ? 'Repeat Buyer' : 'New Acquisition'}</span>
              </div>
            </div>
          </section>
        </aside>

        <main className="scd-content">
          <section className="scd-metrics-row">
            <div className="scd-metric-box">
               <div className="metric-icon blue"><ShoppingBag size={20} /></div>
               <div className="metric-info">
                  <span className="label">Last Order Date</span>
                  <span className="value">{customer.lastOrderDate ? new Date(customer.lastOrderDate).toLocaleDateString() : 'Never'}</span>
               </div>
            </div>
            <div className="scd-metric-box">
               <div className="metric-icon emerald"><TrendingUp size={20} /></div>
               <div className="metric-info">
                  <span className="label">Net Revenue</span>
                  <span className="value">NPR {customer.totalSpentWithSeller?.toLocaleString()}</span>
               </div>
            </div>
            <div className="scd-metric-box">
               <div className="metric-icon amber"><Clock size={20} /></div>
               <div className="metric-info">
                  <span className="label">Average Settlement</span>
                  <span className="value">NPR {(customer.orderCountWithSeller > 0 ? (customer.totalSpentWithSeller / customer.orderCountWithSeller) : 0).toLocaleString()}</span>
               </div>
            </div>
          </section>

          <section className="scd-card scd-history-card">
            <div className="card-header-v2">
              <h3 className="card-title"><Clock size={18} /> Transaction History</h3>
              <p>Chronological audit of all orders placed in your store.</p>
            </div>
            <div className="scd-table-wrapper">
              <table className="scd-table">
                <thead>
                  <tr>
                    <th>ORDER ID</th>
                    <th>SETTLED</th>
                    <th>PAYMENT</th>
                    <th>NET REVENUE</th>
                    <th>STATUS</th>
                    <th>ACTION</th>
                  </tr>
                </thead>
                <tbody>
                  {customer.orderHistory?.map(order => (
                    <tr key={order.orderId}>
                      <td className="bold">#ORD-{String(order.orderId).padStart(5, '0')}</td>
                      <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                      <td>
                        <span className={`scd-payment-tag ${order.paymentMethod?.toLowerCase()}`}>
                          {order.paymentMethod}
                        </span>
                      </td>
                      <td className="revenue">NPR {order.sellerNetAmount?.toLocaleString()}</td>
                      <td>
                        <div className={`scd-status-pill ${order.status?.toLowerCase()}`}>
                          {order.status?.replace(/_/g, ' ')}
                        </div>
                      </td>
                      <td>
                        <button className="scd-btn-view" onClick={() => navigate(`/seller/order/${order.orderId}`)}>
                          <ExternalLink size={14} /> Manifest
                        </button>
                      </td>
                    </tr>
                  ))}
                  {(!customer.orderHistory || customer.orderHistory.length === 0) && (
                    <tr><td colSpan="6" className="empty-row">No recorded activity for this merchant profile.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
};

export default SellerCustomerDetails;
