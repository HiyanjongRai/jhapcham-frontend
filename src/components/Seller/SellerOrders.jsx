import React, { useEffect, useState, useCallback, useMemo } from "react";
import axios from "axios";
import { getCurrentUserId } from "../config/authUtils";
import { API_BASE } from "../config/config";
import "./SellerOrders.css";
import { 
  Package, 
  Truck, 
  CheckCircle, 
  XCircle, 
  MapPin,
  ChevronDown,
  ChevronUp
} from "lucide-react";

export default function SellerOrders() {
  const sellerId = getCurrentUserId();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [orderBranches, setOrderBranches] = useState({});
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [expandedOrders, setExpandedOrders] = useState({});
  
  const branches = ["KATHMANDU", "POKHARA", "UDAYAPUR"];

  // Load seller orders
  const loadOrders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/orders/seller/${sellerId}`);
      let ordersData = res.data;

      // Extract unique customer IDs to fetch their profiles for images
      const customerIds = [...new Set(ordersData.map(o => o.customerId).filter(id => id))];

      if (customerIds.length > 0) {
        try {
          // Fetch profiles in parallel
          const profileResponses = await Promise.allSettled(
            customerIds.map(id => axios.get(`${API_BASE}/users/profile/${id}`))
          );

          // Create a map of customerId -> profileImagePath
          const imageMap = {};
          profileResponses.forEach((result, index) => {
            if (result.status === 'fulfilled' && result.value.data) {
              const cid = customerIds[index];
              imageMap[cid] = result.value.data.profileImagePath;
            }
          });

          // Attach image path to orders
          ordersData = ordersData.map(order => ({
            ...order,
            customerImagePath: imageMap[order.customerId] || null
          }));
        } catch (profileErr) {
          console.error("Error fetching customer profiles", profileErr);
        }
      }

      setOrders(ordersData);
    } catch (err) {
      console.error(err.response || err);
      // alert("Error loading orders");
    } finally {
      setLoading(false);
    }
  }, [sellerId]);

  // Map order status to tracking stage
  const mapStatusToStage = (status) => {
    switch (status) {
      case "PROCESSING": return "PROCESSING";
      case "SHIPPED": return "OUT_FOR_DELIVERY";
      case "DELIVERED": return "DELIVERED";
      case "CANCELLED": return "CANCELLED";
      default: return "PROCESSING";
    }
  };

  // Update order status and send tracking info
  const updateStatus = async (orderId, status) => {
    try {
      await axios.patch(
        `${API_BASE}/orders/${orderId}/status`,
        null,
        { params: { status } }
      );

      const branch = orderBranches[orderId];
      const trackingParams = { stage: mapStatusToStage(status) };
      if (branch) trackingParams.branch = branch;

      await axios.post(
        `${API_BASE}/orders/${orderId}/tracking`,
        null,
        { params: trackingParams }
      );

      loadOrders();
    } catch (err) {
      console.error(err.response || err);
      alert("Failed to update order");
    }
  };

  // Build product image URL
  const buildImageUrl = (imagePath) => {
    if (!imagePath) return "https://via.placeholder.com/48";
    // Check if imagePath is already a full URL (though unlikely based on backend)
    if (imagePath.startsWith("http")) return imagePath;
    return `${API_BASE}/product-images/${imagePath}`;
  };

  // Calculate stats
  const stats = useMemo(() => {
    const total = orders.length;
    const processing = orders.filter(o => o.status === "PROCESSING").length;
    const shipped = orders.filter(o => o.status === "SHIPPED").length;
    const delivered = orders.filter(o => o.status === "DELIVERED").length;
    return { total, processing, shipped, delivered };
  }, [orders]);

  // Filter orders
  const filteredOrders = useMemo(() => {
    if (statusFilter === "ALL") return orders;
    return orders.filter(o => o.status === statusFilter);
  }, [orders, statusFilter]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const toggleOrderItems = (orderId) => {
    setExpandedOrders(prev => ({
      ...prev,
      [orderId]: !prev[orderId]
    }));
  };

  if (loading) {
    return (
      <div className="so-container">
        <div className="so-empty">Loading orders...</div>
      </div>
    );
  }

  return (
    <div className="so-container">
      <div className="so-header">
        <h1 className="so-title">Order Management</h1>
        <p className="so-subtitle">Manage and track all your customer orders</p>
      </div>

      {/* Stats */}
      <div className="so-stats">
        <div className="so-stat-card">
          <div className="so-stat-label">Total Orders</div>
          <div className="so-stat-value">{stats.total}</div>
        </div>
        <div className="so-stat-card">
          <div className="so-stat-label">Processing</div>
          <div className="so-stat-value">{stats.processing}</div>
        </div>
        <div className="so-stat-card">
          <div className="so-stat-label">Shipped</div>
          <div className="so-stat-value">{stats.shipped}</div>
        </div>
        <div className="so-stat-card">
          <div className="so-stat-label">Delivered</div>
          <div className="so-stat-value">{stats.delivered}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="so-filters">
        {["ALL", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"].map(status => (
          <button
            key={status}
            className={`so-filter-btn ${statusFilter === status ? "active" : ""}`}
            onClick={() => setStatusFilter(status)}
          >
            {status === "ALL" ? "All Orders" : status}
          </button>
        ))}
      </div>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <div className="so-empty">No orders found.</div>
      ) : (
        <div className="so-orders-list">
          {filteredOrders.map((order) => {
            const customerImgUrl = order.customerImagePath
              ? `${API_BASE}/uploads/customer-profile/${order.customerImagePath}`
              : "https://via.placeholder.com/64";

            return (
              <div key={order.orderId} className="so-order-card">
                {/* Header */}
                <div className="so-order-header">
                  <div>
                    <h3 className="so-order-id">Order #{String(order.orderId).padStart(4, "0")}</h3>
                  </div>
                  <div className="so-order-meta">
                    <span className={`so-badge so-badge-${order.status?.toLowerCase()}`}>
                      {order.status}
                    </span>
                    <span style={{fontSize: '0.875rem', color: '#6b7280'}}>
                      {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : ""}
                    </span>
                    <span style={{fontSize: '0.875rem', fontWeight: '600', color: '#111827'}}>
                      ${(order.totalPrice || 0).toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Body */}
                <div className="so-order-body">
                  {/* Customer Info */}
                  <div className="so-customer-section">
                    <img 
                      src={customerImgUrl} 
                      alt={order.customerName || "Customer"} 
                      className="so-customer-avatar"
                      onError={(e) => { e.target.onerror = null; e.target.src = "https://via.placeholder.com/64"; }}
                    />
                    <div className="so-customer-info">
                      <h4>{order.customerName || "No name"}</h4>
                      <p>📧 {order.customerEmail || "Not provided"}</p>
                      <p>📞 {order.customerContact || "Not provided"}</p>
                      <p>📍 {order.fullAddress || "No address provided"}</p>
                      {order.latitude != null && order.longitude != null && (
                        <p>
                          <a
                            href={`https://www.google.com/maps?q=${order.latitude},${order.longitude}`}
                            target="_blank"
                            rel="noreferrer"
                          >
                            <MapPin size={14} style={{display: 'inline', verticalAlign: 'middle'}} /> View on Map
                          </a>
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="so-actions">
                    <select
                      className="so-branch-select"
                      value={orderBranches[order.orderId] || ""}
                      onChange={(e) =>
                        setOrderBranches((prev) => ({
                          ...prev,
                          [order.orderId]: e.target.value,
                        }))
                      }
                    >
                      <option value="">Select Branch</option>
                      {branches.map((b) => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                    </select>

                    <button 
                      onClick={() => updateStatus(order.orderId, "PROCESSING")} 
                      className="so-action-btn"
                      disabled={order.status === "PROCESSING"}
                    >
                      <Package size={16} /> Process
                    </button>
                    
                    <button 
                      onClick={() => updateStatus(order.orderId, "SHIPPED")} 
                      className="so-action-btn primary"
                      disabled={order.status === "SHIPPED" || order.status === "DELIVERED"}
                    >
                      <Truck size={16} /> Ship
                    </button>
                    
                    <button 
                      onClick={() => updateStatus(order.orderId, "DELIVERED")} 
                      className="so-action-btn"
                      disabled={order.status === "DELIVERED"}
                    >
                      <CheckCircle size={16} /> Deliver
                    </button>
                    
                    <button 
                      onClick={() => updateStatus(order.orderId, "CANCELLED")} 
                      className="so-action-btn danger"
                      disabled={order.status === "CANCELLED" || order.status === "DELIVERED"}
                    >
                      <XCircle size={16} /> Cancel
                    </button>
                  </div>

                  {/* Order Items */}
                  <div>
                    <div 
                      className="so-items-toggle"
                      onClick={() => toggleOrderItems(order.orderId)}
                    >
                      Order Items ({order.items?.length || 0})
                      {expandedOrders[order.orderId] ? <ChevronUp size={16} style={{display: 'inline', marginLeft: '0.5rem'}} /> : <ChevronDown size={16} style={{display: 'inline', marginLeft: '0.5rem'}} />}
                    </div>

                    {expandedOrders[order.orderId] && (
                      <table className="so-items-table">
                        <thead>
                          <tr>
                            <th>Image</th>
                            <th>Product</th>
                            <th>Details</th>
                            <th>Qty</th>
                            <th>Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {order.items.map((item) => (
                            <tr key={item.productId}>
                              <td>
                                <img
                                  src={buildImageUrl(item.imagePath)}
                                  alt={item.productName}
                                  className="so-item-img"
                                />
                              </td>
                              <td>{item.productName}</td>
                              <td>
                                <div style={{fontSize: '0.85rem', color: '#4b5563'}}>
                                  {item.selectedColor && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginBottom: '0.25rem' }}>
                                      <span style={{ fontWeight: '500' }}>Color:</span>
                                      <span style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: item.selectedColor, border: '1px solid #ddd', display: 'inline-block' }}></span>
                                      {item.selectedColor}
                                    </div>
                                  )}
                                  {item.selectedStorage && (
                                    <div style={{ marginBottom: '0.25rem' }}>
                                      <span style={{ fontWeight: '500' }}>Storage:</span> {item.selectedStorage}
                                    </div>
                                  )}
                                  {item.categoryName && <div><span style={{ fontWeight: '500' }}>Category:</span> {item.categoryName}</div>}
                                </div>
                              </td>
                              <td>{item.quantity}</td>
                              <td>${item.lineTotal?.toFixed(2)}</td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr>
                            <td colSpan="4" style={{textAlign: 'right'}}>Total</td>
                            <td>${(order.totalPrice || 0).toFixed(2)}</td>
                          </tr>
                        </tfoot>
                      </table>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
