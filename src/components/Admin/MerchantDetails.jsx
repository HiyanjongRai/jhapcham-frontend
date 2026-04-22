import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from "../../api/axios";
import { 
  BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, Cell 
} from 'recharts';
import { 
  ArrowLeft, Mail, Phone, MapPin, Package, ShoppingBag, 
  DollarSign, CheckCheck, MessageSquare, Lock, Unlock,
  ExternalLink, Globe, LayoutDashboard, AlertCircle, FileText
} from 'lucide-react';
import { API_BASE } from '../config/config';
import './MerchantDetails.css';
import DashboardNavbar from './DashboardNavbar.jsx';

const Badge = ({ status }) => {
  const getBadgeClass = (s) => {
    switch (s?.toUpperCase()) {
      case 'ACTIVE': return 'badge-active';
      case 'BLOCKED': return 'badge-blocked';
      case 'PENDING': return 'badge-pending';
      default: return 'badge-inactive';
    }
  };
  return <span className={`adm-badge ${getBadgeClass(status)}`}>{status}</span>;
};

const MerchantDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [seller, setSeller] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [sellerRes, ordersRes] = await Promise.all([
        axios.get(`/api/admin/sellers/${id}`),
        axios.get(`/api/admin/sellers/${id}/orders`)
      ]);
      setSeller(sellerRes.data);
      setOrders(ordersRes.data);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching merchant data:", err);
      setError("Failed to load merchant insights. Please try again.");
      setLoading(false);
    }
  };

  const toggleStatus = async (isBlocking) => {
    try {
      const endpoint = isBlocking ? 'block' : 'unblock';
      await axios.put(`/api/admin/users/${id}/${endpoint}`);
      fetchData(); // Refresh info
    } catch (err) {
      alert("Failed to update merchant status");
    }
  };

  if (loading) return <div className="adm-page-loader">Loading Merchant Insights...</div>;
  if (error) return <div className="adm-page-error"><AlertCircle /> {error}</div>;
  if (!seller) return <div className="adm-page-empty">Merchant not found</div>;

  return (
    <div className="merchant-details-page">
      <DashboardNavbar title="Merchant Intelligence" role="ADMIN" showSearch={false} />
      
      <div className="mdp-header">
         <div className="mdp-nav-back">
            <button onClick={() => navigate(-1)} className="mdp-back-btn">
               <ArrowLeft size={20} /> Back to Directory
            </button>
         </div>
         <div className="mdp-profile-strip">
            <div className="mdp-avatar">
               {seller.logoImagePath ? <img src={`${API_BASE}/${seller.logoImagePath}`} alt=""/> : seller.storeName?.charAt(0)}
            </div>
            <div className="mdp-identity">
               <h1>{seller.storeName}</h1>
               <div className="mdp-meta">
                  <Badge status={seller.status} />
                  <span className="mdp-id-tag">Merchant ID: #{seller.id}</span>
                  <span className="mdp-role-tag">{seller.role}</span>
               </div>
            </div>
            <div className="mdp-header-actions">
               <button className="mdp-action-btn primary" onClick={() => navigate(`/shop/${seller.id}`)}>
                  <Globe size={16} /> Visit Store
               </button>
               {seller.status === "ACTIVE" ? (
                 <button className="mdp-action-btn danger" onClick={() => toggleStatus(true)}>
                    <Lock size={16} /> Suspend
                 </button>
               ) : (
                 <button className="mdp-action-btn success" onClick={() => toggleStatus(false)}>
                    <Unlock size={16} /> Reactivate
                 </button>
               )}
            </div>
         </div>
      </div>

      <div className="mdp-content-grid">
         
         <div className="mdp-main-col">
            <div className="mdp-card">
               <h3 className="mdp-card-title">Merchant Performance</h3>
               <div className="mdp-stats-grid">
                  <div className="mdp-stat-box">
                     <div className="mdp-stat-icon blue"><DollarSign size={24}/></div>
                     <div className="mdp-stat-info">
                        <label>Delivered GMV</label>
                        <span className="mdp-stat-val">Rs. {seller.totalIncome?.toLocaleString()}</span>
                     </div>
                  </div>
                  <div className="mdp-stat-box">
                     <div className="mdp-stat-icon purple"><Package size={24}/></div>
                     <div className="mdp-stat-info">
                        <label>Live Products</label>
                        <span className="mdp-stat-val">{seller.totalProducts} Items</span>
                     </div>
                  </div>
                  <div className="mdp-stat-box">
                     <div className="mdp-stat-icon orange"><ShoppingBag size={24}/></div>
                     <div className="mdp-stat-info">
                        <label>Total Orders</label>
                        <span className="mdp-stat-val">{seller.totalOrders} Units</span>
                     </div>
                  </div>
                  <div className="mdp-stat-box success">
                     <div className="mdp-stat-icon green"><CheckCheck size={24}/></div>
                     <div className="mdp-stat-info">
                        <label>Successful Delivery</label>
                        <span className="mdp-stat-val">{seller.totalDelivered} Orders</span>
                     </div>
                  </div>
                  <div className="mdp-stat-box" style={{ background: '#fff1f2', border: '1px solid #fecdd3' }}>
                     <div className="mdp-stat-icon red" style={{ background: '#fb7185', color: 'white' }}><LayoutDashboard size={24}/></div>
                     <div className="mdp-stat-info">
                        <label>Commission Paid</label>
                        <span className="mdp-stat-val" style={{ color: '#be123c' }}>Rs. {seller.totalCommission?.toLocaleString()}</span>
                     </div>
                  </div>
               </div>
            </div>

            <div className="mdp-card">
               <h3 className="mdp-card-title">Order History</h3>
               <div className="mdp-order-table-wrap">
                  <table className="mdp-order-table">
                     <thead>
                        <tr>
                           <th>Order ID</th>
                           <th>Customer</th>
                           <th>Amount</th>
                           <th>Status</th>
                           <th>Date</th>
                           <th></th>
                        </tr>
                     </thead>
                     <tbody>
                        {orders.length === 0 ? (
                          <tr><td colSpan="6" className="mdp-td-empty">No transactions recorded yet.</td></tr>
                        ) : (
                          orders.map(o => (
                            <tr key={o.orderId} className="mdp-tr-clickable" onClick={() => navigate(`/admin/order/${o.orderId}`)}>
                               <td className="mdp-td-bold">#{o.orderId}</td>
                               <td>{o.customerName}</td>
                               <td className="mdp-td-price">Rs. {o.grandTotal.toLocaleString()}</td>
                               <td><Badge status={o.status} /></td>
                               <td className="mdp-td-date">{new Date(o.createdAt).toLocaleDateString()}</td>
                               <td><ExternalLink size={14} className="mdp-row-icon"/></td>
                            </tr>
                          ))
                        )}
                     </tbody>
                  </table>
               </div>
            </div>
         </div>

         <div className="mdp-side-col">
            <div className="mdp-card">
               <h3 className="mdp-card-title">Merchant Profile</h3>
                <div className="mdp-info-list">
                  <div className="mdp-info-item">
                     <div className="mdp-info-icon"><Mail size={16}/></div>
                     <div className="mdp-info-text">
                        <label>Email Address</label>
                        <span>{seller.email}</span>
                     </div>
                  </div>
                  <div className="mdp-info-item">
                     <div className="mdp-info-icon"><Phone size={16}/></div>
                     <div className="mdp-info-text">
                        <label>Contact Number</label>
                        <span>{seller.contactNumber || "Not Provided"}</span>
                     </div>
                  </div>
                  <div className="mdp-info-item">
                     <div className="mdp-info-icon"><MapPin size={16}/></div>
                     <div className="mdp-info-text">
                        <label>Business Location</label>
                        <span>Kathmandu, Nepal</span>
                     </div>
                  </div>
               </div>

               {(seller.idDocumentPath || seller.businessLicensePath || seller.taxCertificatePath) && (
                 <div className="mdp-info-list" style={{ marginTop: '20px', borderTop: '1px solid #f1f5f9', paddingTop: '15px' }}>
                    <h4 style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', color: '#777', marginBottom: '10px' }}>Legal Documents</h4>
                    {seller.idDocumentPath && (
                      <div className="mdp-info-item">
                        <div className="mdp-info-icon"><FileText size={16}/></div>
                        <div className="mdp-info-text">
                            <label>Identity Proof</label>
                            <a href={`${API_BASE}/${seller.idDocumentPath}`} target="_blank" rel="noopener noreferrer" style={{ color: '#0088cc', fontSize: '0.8rem', fontWeight: '600' }}>View ID Document</a>
                        </div>
                      </div>
                    )}
                    {seller.businessLicensePath && (
                      <div className="mdp-info-item">
                        <div className="mdp-info-icon"><FileText size={16}/></div>
                        <div className="mdp-info-text">
                            <label>Business License</label>
                            <a href={`${API_BASE}/${seller.businessLicensePath}`} target="_blank" rel="noopener noreferrer" style={{ color: '#0088cc', fontSize: '0.8rem', fontWeight: '600' }}>View License</a>
                        </div>
                      </div>
                    )}
                    {seller.taxCertificatePath && (
                      <div className="mdp-info-item">
                        <div className="mdp-info-icon"><FileText size={16}/></div>
                        <div className="mdp-info-text">
                            <label>Tax Certificate</label>
                            <a href={`${API_BASE}/${seller.taxCertificatePath}`} target="_blank" rel="noopener noreferrer" style={{ color: '#0088cc', fontSize: '0.8rem', fontWeight: '600' }}>View Certificate</a>
                        </div>
                      </div>
                    )}
                 </div>
               )}

               <button className="mdp-msg-btn">
                  <MessageSquare size={16} /> Send Direct Message
               </button>
            </div>

            <div className="mdp-card mdp-alert-card">
               <div className="mdp-alert-head">
                  <AlertCircle size={20} />
                  <span>Administrative Note</span>
               </div>
               <p>
                  This merchant joined the platform on <b>{new Date(seller.createdAt || Date.now()).toLocaleDateString()}</b>. 
                  Currently maintaining a <b>100%</b> success rate.
               </p>
            </div>
         </div>
      </div>
    </div>
  );
};

export default MerchantDetails;
