import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from "../../api/axios";
import { 
  ShoppingBag, 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  ChevronLeft,
  Heart,
  AlertTriangle,
  CreditCard,
  DollarSign,
  Package,
  MessageSquare,
  ExternalLink,
  Shield,
  Clock,
  CheckCircle,
  Star
} from 'lucide-react';
import { API_BASE } from '../config/config';
import './CustomerDetails.css';
import DashboardNavbar from './DashboardNavbar.jsx';

const Badge = ({ status }) => {
  const getBadgeClass = (s) => {
    switch (s?.toUpperCase()) {
      case 'ACTIVE': return 'badge-active';
      case 'BLOCKED': return 'badge-blocked';
      default: return 'badge-inactive';
    }
  };
  return (
    <div className={`adm-badge-v2 ${getBadgeClass(status)}`}>
       <div className="status-glow" />
       <span>{status}</span>
    </div>
  );
};

const CustomerDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCustomer = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`/api/admin/users/${id}`);
        setCustomer(res.data);
      } catch (err) {
        console.error("Failed to fetch customer", err);
      } finally {
        setLoading(false);
      }
    };
    fetchCustomer();
  }, [id]);

  const toggleBlock = async () => {
    try {
      const endpoint = customer.status === 'ACTIVE' ? 'block' : 'unblock';
      await axios.put(`/api/admin/users/${id}/${endpoint}`);
      setCustomer({ ...customer, status: customer.status === 'ACTIVE' ? 'BLOCKED' : 'ACTIVE' });
    } catch (err) {
      console.error("Failed to update status", err);
    }
  };

  if (loading) return <div className="adm-page-loader">Gathering customer intelligence...</div>;
  if (!customer) return <div className="adm-page-loader">Customer not found.</div>;

  const totalSpent = customer.totalSpent || 0;
  const loyaltyPoints = Math.floor(totalSpent / 100);
  const tier = totalSpent < 10000 ? 'SILVER' : (totalSpent < 50000 ? 'GOLD' : 'PLATINUM');

  return (
    <div className="customer-intel-page">
      <DashboardNavbar title="Customer Intelligence" role="ADMIN" showSearch={false} />
      <div className="intel-bg-glow" />
      
      <header className="intel-header">
        <button className="intel-back-btn" onClick={() => navigate(-1)}>
          <ChevronLeft size={16} /> Back to Directory
        </button>
        
        <div className="intel-hero-card">
           <div className="intel-hero-glass" />
           <div className="intel-profile-info">
              <div className="intel-avatar">
                 {customer.profileImagePath ? (
                   <img src={`${API_BASE}/${customer.profileImagePath}`} alt="" />
                 ) : (
                   <User size={32} />
                 )}
                 <div className="avatar-status-ring" />
              </div>
              <div className="intel-identity">
                <div className={`tier-tag ${tier.toLowerCase()}`}>{tier} MEMBER</div>
                <h1>{customer.fullName}</h1>
                <div className="intel-meta">
                  <span className="intel-id">#{customer.id}</span>
                  <Badge status={customer.status} />
                  <span className="intel-join-date">
                     <Calendar size={12} /> Established {new Date(customer.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short' })}
                  </span>
                </div>
              </div>
           </div>
           
           <div className="intel-actions">
              <button className="intel-btn secondary" onClick={() => window.location.href = `mailto:${customer.email}`}>
                <Mail size={16} /> Contact
              </button>
              <button 
                className={`intel-btn ${customer.status === 'ACTIVE' ? 'danger' : 'success'}`}
                onClick={toggleBlock}
              >
                {customer.status === 'ACTIVE' ? <Shield size={16}/> : <CheckCircle size={16}/>}
                {customer.status === 'ACTIVE' ? 'Suspend' : 'Reactivate'}
              </button>
           </div>
        </div>
      </header>

      <div className="intel-content-grid">
        <main className="intel-main">
          
          <div className="intel-metrics-rail">
            <div className="intel-metric">
              <div className="metric-icon blue"><ShoppingBag size={20} /></div>
              <div className="metric-data">
                <div className="metric-val">{customer.totalOrders}</div>
                <label>Total Fulfillment</label>
              </div>
            </div>
            <div className="intel-metric">
              <div className="metric-icon green"><DollarSign size={20} /></div>
              <div className="metric-data">
                <div className="metric-val">NPR {totalSpent.toLocaleString()}</div>
                <label>Acquisition Value</label>
              </div>
            </div>
            <div className="intel-metric">
              <div className="metric-icon yellow"><Star size={20} /></div>
              <div className="metric-data">
                <div className="metric-val">{loyaltyPoints.toLocaleString()} PTS</div>
                <label>Loyalty Balance</label>
              </div>
            </div>
            <div className="intel-metric">
              <div className="metric-icon purple"><CreditCard size={20} /></div>
              <div className="metric-data">
                <div className="metric-val">{customer.favoritePaymentMethod || 'Pending'}</div>
                <label>Payment Preference</label>
              </div>
            </div>
          </div>

          <section className="intel-card intel-orders">
            <div className="card-head">
              <h3><Package size={18} /> Transaction Ledger</h3>
              <span className="count-pill">{customer.orders?.length} Entries</span>
            </div>
            <div className="intel-table-container">
              <table className="intel-table">
                <thead>
                  <tr>
                    <th>Ref ID</th>
                    <th>Timestamp</th>
                    <th>Gateway</th>
                    <th>Status</th>
                    <th className="right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {customer.orders?.map(o => (
                    <tr key={o.orderId} onClick={() => navigate(`/admin/order/${o.orderId}`)}>
                      <td className="font-mono">#ORD-{String(o.orderId).padStart(5, '0')}</td>
                      <td>{new Date(o.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</td>
                      <td><span className="gateway-tag">{o.paymentMethod}</span></td>
                      <td><div className={`status-pill ${o.status?.toLowerCase()}`}>{o.status}</div></td>
                      <td className="right bold">NPR {o.grandTotal?.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="intel-card intel-wishlist">
            <div className="card-head">
              <h3><Heart size={18} /> Interests & Wishlist</h3>
            </div>
            <div className="wishlist-grid">
              {customer.wishlist?.map(p => (
                <div key={p.id} className="wish-tile" onClick={() => navigate(`/product/${p.id}`)}>
                   <div className="wish-thumb">
                      <Heart size={14} fill="#f43f5e" color="#f43f5e" />
                   </div>
                   <div className="wish-info">
                      <span className="wish-name">{p.name}</span>
                      <span className="wish-price">NPR {p.price?.toLocaleString()}</span>
                   </div>
                   <ExternalLink size={12} className="wish-arrow" />
                </div>
              ))}
              {customer.wishlist?.length === 0 && (
                <div className="empty-msg">No collection entries found.</div>
              )}
            </div>
          </section>
        </main>

        <aside className="intel-sidebar">
          <div className="intel-card security-card">
            <h3><Shield size={18} /> Security & Auth</h3>
            <div className="security-list">
              <div className="security-item">
                <div className="s-icon"><Mail size={16}/></div>
                <div className="s-data">
                  <label>PRIMARY EMAIL</label>
                  <span>{customer.email}</span>
                </div>
              </div>
              <div className="security-item">
                <div className="s-icon"><Phone size={16}/></div>
                <div className="s-data">
                  <label>MOBILE LINK</label>
                  <span>{customer.contactNumber || 'Not provided'}</span>
                </div>
              </div>
              <div className="security-item">
                <div className="s-icon"><Clock size={16}/></div>
                <div className="s-data">
                  <label>AUTH HANDLER</label>
                  <span>@{customer.username}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="intel-card resolution-card">
            <div className="resolution-head">
              <AlertTriangle size={18} /> Resolution Center
            </div>
            <p className="res-meta">Platform-wide governance summary</p>
            <div className="dispute-count">
               <span>{customer.reports?.length}</span>
               <label>Active Cases</label>
            </div>
            
            {customer.reports?.length > 0 && (
              <div className="dispute-list">
                {customer.reports.map(r => (
                  <div key={r.id} className="dispute-entry">
                    <div className="dispute-status-dot" />
                    <div className="dispute-text">
                       <strong>{r.status}</strong>
                       <p>{r.reason?.substring(0, 48)}...</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {customer.reports?.length === 0 && (
               <div className="res-clean-slate">
                  <CheckCircle size={32} />
                  <p>Zero infractions found</p>
               </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
};

export default CustomerDetails;
