import React, { useState, useEffect } from "react";
import { ShoppingBag, Search, Filter, Calendar, RefreshCw, User, Store, ExternalLink } from "lucide-react";
import { Badge } from "./AdminCommon";
import axios from "../../api/axios";
import { useNavigate } from "react-router-dom";
import "./AdminDashboard.css";

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    status: "ALL",
    payment: "ALL",
    dateStart: "",
    dateEnd: ""
  });
  const navigate = useNavigate();

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await axios.get("/api/admin/orders");
      setOrders(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOrders(); }, []);

  const filtered = orders.filter(o => {
    const matchesSearch = [o.customerName, o.sellerStoreName, o.status, String(o.orderId)]
      .some(k => String(k || "").toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = filters.status === "ALL" || o.status === filters.status;
    const matchesPayment = filters.payment === "ALL" || o.paymentMethod === filters.payment;
    
    let matchesDate = true;
    if (filters.dateStart) matchesDate = matchesDate && new Date(o.createdAt) >= new Date(filters.dateStart);
    if (filters.dateEnd) {
      const end = new Date(filters.dateEnd);
      end.setHours(23, 59, 59, 999);
      matchesDate = matchesDate && new Date(o.createdAt) <= end;
    }

    return matchesSearch && matchesStatus && matchesPayment && matchesDate;
  });

  return (
    <div className="adm-orders-container fade-in">
      <div className="adm-welcome-banner">
        <div>
          <h2 className="adm-welcome-title">Platform Orders</h2>
          <p className="adm-welcome-sub">Manage and monitor all marketplace transactions.</p>
        </div>
        <div className="adm-search-bar" style={{ maxWidth: '300px' }}>
          <Search size={18} />
          <input 
            type="text" 
            placeholder="Search orders..." 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="adm-table-card">
        <div className="adm-table-filters advanced-filters">
          <div className="filter-group">
            <Filter size={16}/>
            <select 
              value={filters.status} 
              onChange={e => setFilters({...filters, status: e.target.value})}
              className="adm-filter-select"
            >
              <option value="ALL">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="PROCESSING">Processing</option>
              <option value="SHIPPED">Shipped</option>
              <option value="DELIVERED">Delivered</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
            
            <select 
              value={filters.payment} 
              onChange={e => setFilters({...filters, payment: e.target.value})}
              className="adm-filter-select"
            >
              <option value="ALL">All Payments</option>
              <option value="COD">COD</option>
              <option value="ESEWA">eSewa</option>
            </select>
          </div>

          <div className="filter-group date-filters">
            <div className="date-input-wrap">
              <Calendar size={14}/>
              <input 
                type="date" 
                value={filters.dateStart}
                onChange={e => setFilters({...filters, dateStart: e.target.value})}
              />
            </div>
            <span>to</span>
            <div className="date-input-wrap">
              <input 
                type="date"
                value={filters.dateEnd}
                onChange={e => setFilters({...filters, dateEnd: e.target.value})}
              />
            </div>
            <button className="reset-filters" onClick={() => setFilters({ status: "ALL", payment: "ALL", dateStart: "", dateEnd: "" })}>
              <RefreshCw size={14}/>
            </button>
          </div>
        </div>

        <div className="adm-table-wrap">
          <table className="adm-data-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Platform Meta</th>
                <th>Financials</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(o => (
                <tr key={o.orderId} className="adm-table-row">
                  <td>
                    <div className="adm-id-cell">
                      <span className="id-badge">#{o.orderId}</span>
                      <span className="date-sub">{new Date(o.createdAt).toLocaleDateString()}</span>
                    </div>
                  </td>
                  <td>
                    <div className="adm-user-cell">
                      <div className="user-entity">
                        <User size={12}/> <strong>Cust:</strong> {o.customerName}
                      </div>
                      <div className="user-entity seller">
                        <Store size={12}/> <strong>Store:</strong> {o.sellerStoreName || "Global"}
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="adm-price-cell">
                      <span className="price-main">Rs. {o.grandTotal?.toLocaleString()}</span>
                      <span className="pay-method">{o.paymentMethod}</span>
                    </div>
                  </td>
                  <td><Badge status={o.status} /></td>
                  <td>
                    <div className="adm-row-actions">
                      <button className="adm-icon-btn" title="Detailed Manifest" onClick={() => navigate(`/admin/order/${o.orderId}`)}>
                        <ExternalLink size={16}/>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {loading ? (
             <div className="adm-empty">Loading platform orders...</div>
        ) : filtered.length === 0 && (
             <div className="adm-empty">No platform orders found.</div>
        )}
      </div>
    </div>
  );
}
