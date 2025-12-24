/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState, useCallback, useMemo } from "react";
import axios from "axios";
import { getCurrentUserId } from "../config/authUtils";
import { API_BASE } from "../config/config";
import { useNavigate } from "react-router-dom";
import "./SellerOrders.css";
import { 
  Package, 
  Truck, 
  CheckCircle, 
  XCircle, 
  MapPin,
  ChevronDown,
  ChevronUp,
  Edit2,
  MessageSquare // Added icon
} from "lucide-react";
import { apiGetSellerOrders, apiGetOrder } from "../AddCart/cartUtils";

import Toast from "../Toast/Toast"; // Import Toast
import MessageModal from "../Message/MessageModal"; // Import MessageModal

export default function SellerOrders() {
  const sellerId = getCurrentUserId();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [orderBranches, setOrderBranches] = useState({});
  const [statusFilter, setStatusFilter] = useState("NEW");
  const [expandedOrders, setExpandedOrders] = useState({});
  const [orderDetails, setOrderDetails] = useState({}); 
  const [selectedStages, setSelectedStages] = useState({});
  const [msgModal, setMsgModal] = useState({ isOpen: false, recipientId: null, recipientName: '', type: 'store' });


  // Toast State
  const [toast, setToast] = useState({ message: '', type: 'info', isVisible: false });

  const showToast = (message, type = 'info') => {
    setToast({ message, type, isVisible: true });
  };
  
  const branches = ["KATHMANDU", "POKHARA", "UDAYAPUR"];

  // Load seller orders
  const loadOrders = useCallback(async () => {
    // ... (same as before)
    setLoading(true);
    try {
      const data = await apiGetSellerOrders(sellerId);
      setOrders(data || []);
    } catch (err) {
      console.error("Error loading orders:", err);
      showToast("Failed to load orders", "error");
    } finally {
      setLoading(false);
    }
  }, [sellerId]);

  const updateStatus = async (orderId, nextStatus) => {
    try {
      const branch = orderBranches[orderId];
      const statusUpper = nextStatus.toUpperCase();

      if (statusUpper === 'CANCELED') {
        const url = `${API_BASE}/api/orders/seller/${sellerId}/cancel/${orderId}`;
        await axios.put(url);
        showToast("Order canceled successfully", "success");
      } 
      else if (statusUpper === 'PROCESSING') {
        const url = `${API_BASE}/api/orders/seller/${sellerId}/process/${orderId}`;
        await axios.put(url);
        showToast("Order moved to PROCESSING", "success");
      }
      else if (statusUpper === 'SHIPPED' || statusUpper === 'SHIPPED_TO_BRANCH') {
         if (!branch) {
             showToast("Please select a branch to ship to.", "warning");
             return;
         }
         const url = `${API_BASE}/api/orders/seller/${sellerId}/assign/${orderId}`;
         await axios.put(url, { branch: branch }); 
         showToast("Order shipped to branch", "success");
      }
      else if (statusUpper === 'OUT_FOR_DELIVERY' || statusUpper === 'DELIVERED') {
          if (!branch) {
             showToast("Please confirm the branch (select from dropdown) for this update.", "warning");
             return;
          }
          const params = new URLSearchParams({ branch: branch, nextStatus: statusUpper });
          const url = `${API_BASE}/api/orders/branch/${orderId}/status?${params.toString()}`;
          await axios.put(url);
          showToast(`Order status updated to ${statusUpper}`, "success");
      } 
      else {
          showToast(`Unsupported status transition to ${statusUpper}.`, "error");
          return;
      }

      loadOrders();
    } catch (err) {
      console.error(err.response || err);
      const msg = err.response?.data?.message || "Failed to update order";
      showToast(msg, "error");
    }
  };

  const buildImageUrl = (imagePath) => {
    if (!imagePath) return "https://via.placeholder.com/48";
    if (imagePath.startsWith("http")) return imagePath;
    return `${API_BASE}/${imagePath}`;
  };

  const stats = useMemo(() => {
    const total = orders.length;
    // Map NEW to Pending stats
    const pending = orders.filter(o => o.status === "NEW" || o.status === "PENDING").length; 
    const processing = orders.filter(o => o.status === "PROCESSING").length;
    const shipped = orders.filter(o => o.status === "SHIPPED" || o.status === "SHIPPED_TO_BRANCH").length;
    const delivered = orders.filter(o => o.status === "DELIVERED").length;
    return { total, pending, processing, shipped, delivered };
  }, [orders]);

  const filteredOrders = useMemo(() => {
    // New logic: "NEW" acts as the default "Inbox"
    if (statusFilter === "NEW") return orders.filter(o => o.status === "NEW" || o.status === "PENDING");
    if (statusFilter === "PROCESSING") return orders.filter(o => o.status === "PROCESSING");
    if (statusFilter === "SHIPPED") return orders.filter(o => o.status === "SHIPPED" || o.status === "SHIPPED_TO_BRANCH" || o.status === "OUT_FOR_DELIVERY");
    if (statusFilter === "DELIVERED") return orders.filter(o => o.status === "DELIVERED");
    if (statusFilter === "CANCELED") return orders.filter(o => o.status === "CANCELED");
    
    // Fallback/Legacy "ALL" view if needed, but we are removing the tab
    return orders;
  }, [orders, statusFilter]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const toggleOrderItems = async (orderId) => {
    // If expanding and we don't have details, fetch them
    if (!expandedOrders[orderId] && !orderDetails[orderId]) {
      try {
        const detail = await apiGetOrder(orderId);
        setOrderDetails(prev => ({ ...prev, [orderId]: detail }));
      } catch (e) {
        console.error("Failed to fetch order details", e);
        showToast("Could not load order details", "error");
        return; 
      }
    }

    setExpandedOrders(prev => ({
      ...prev,
      [orderId]: !prev[orderId]
    }));
  };

  // Initialize statusFilter to NEW
  useEffect(() => {
      setStatusFilter("NEW");
  }, []);

  // ... (loading check)

  return (
    <div className="so-container">
      <div className="so-header">
        <div className="so-header-top">
          <div>
            <h1 className="so-title">Order Management</h1>
            <p className="so-subtitle">Monitor and process your merchant sales</p>
          </div>
          <button className="so-refresh-btn" onClick={loadOrders}>
            <Package size={18} strokeWidth={2.5} /> 
            <span>Refresh Workspace</span>
          </button>
        </div>
      </div>

      <div className="so-stats">
        {[
          { key: 'total', label: 'Total Orders', value: stats.total, icon: <Package size={24} />, color: 'total' },
          { key: 'pending', label: 'New Orders', value: stats.pending, icon: <Truck size={24} />, color: 'pending' },
          { key: 'processing', label: 'In Process', value: stats.processing, icon: <Edit2 size={24} />, color: 'processing' },
          { key: 'shipped', label: 'Outbound', value: stats.shipped, icon: <Truck size={24} />, color: 'shipped' },
          { key: 'delivered', label: 'Completed', value: stats.delivered, icon: <CheckCircle size={24} />, color: 'delivered' },
        ].map((s) => (
          <div key={s.key} className={`so-stat-card ${s.color}`}>
            <div className="so-stat-icon">{s.icon}</div>
            <div className="so-stat-content">
              <div className="so-stat-label">{s.label}</div>
              <div className="so-stat-value">{s.value}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="so-filters">
        {["NEW", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELED"].map(status => (
          <button
            key={status}
            className={`so-filter-btn ${statusFilter === status ? "active" : ""}`}
            onClick={() => setStatusFilter(status)}
          >
            {status === "NEW" ? "Incoming" : status}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="so-empty">
          <div className="so-spinner" role="status"></div>
          <p style={{ marginTop: '1.5rem', fontWeight: 600, color: '#475569' }}>Synchronizing your workspace...</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="so-empty">
          <Package size={48} style={{ marginBottom: '1rem', opacity: 0.2 }} />
          <h3>No Orders Found</h3>
          <p>You haven't received any orders in this category yet.</p>
        </div>
      ) : (
        <div className="so-orders-list">
          {filteredOrders.map((order) => {
            const currentId = order.id || order.orderId;
            return (
              <div key={currentId} className="so-order-card">
                <div className="so-order-header">
                  <div>
                    <h3 className="so-order-id">
                        {order.productNames || `Order #${String(currentId).padStart(4, "0")}`}
                    </h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{fontWeight:'700', color: '#6366f1'}}>#{String(currentId).padStart(4, "0")}</span>
                        <span style={{ color: '#94a3b8' }}>•</span>
                        <span style={{ color: '#64748b', fontSize: '0.9rem', fontWeight: 500 }}>
                          {order.customerName || "Anonymous Customer"}
                        </span>
                        <button 
                          className="so-action-btn secondary" 
                          style={{ padding: '4px 10px', fontSize: '0.75rem', height: '28px', borderRadius: '8px' }}
                          onClick={() => setMsgModal({
                            isOpen: true,
                            recipientId: order.customerId,
                            recipientName: order.customerName || "Customer",
                            type: 'store'
                          })}
                        >
                          <MessageSquare size={13} /> Chat
                        </button>
                    </div>
                  </div>
                  <div className="so-order-meta">
                    <span style={{fontSize: '0.9rem', fontWeight: '600', color: '#0f172a', background: '#f1f5f9', padding: '6px 12px', borderRadius: '8px'}}>
                      ${(order.totalPrice || order.grandTotal || 0).toFixed(2)}
                    </span>
                    <span className={`so-badge so-badge-${(order.status || 'PENDING').toLowerCase()}`}>
                      {order.status}
                    </span>
                    <span style={{fontSize: '0.8rem', color: '#94a3b8', fontWeight: 500}}>
                      {order.createdAt ? new Date(order.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : ""}
                    </span>
                  </div>
                </div>

                <div className="so-order-body">
                  {order.status === 'DELIVERED' ? (
                    <div className="so-delivered-view">
                       {orderDetails[currentId] ? (
                          <div className="so-delivered-details">
                            <div className="so-customer-info-box">
                              <img 
                                 src={
                                   orderDetails[currentId].customerProfileImagePath
                                     ? (orderDetails[currentId].customerProfileImagePath.startsWith('http') 
                                         ? orderDetails[currentId].customerProfileImagePath 
                                         : `${API_BASE}/${orderDetails[currentId].customerProfileImagePath}`)
                                     : "https://via.placeholder.com/60"
                                 }
                                 alt="Customer"
                                 className="so-customer-avatar-sm"
                              />
                              <div className="so-customer-text">
                                <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>
                                  {orderDetails[currentId].customerName || "Guest"}
                                  <span style={{ color: '#94a3b8', marginLeft: '8px', fontWeight: 500, fontSize: '0.9rem' }}>
                                    ({orderDetails[currentId].customerPhone || "N/A"})
                                  </span>
                                </h4>
                                <div className="so-delivered-address">
                                  <MapPin size={14} style={{ color: '#6366f1' }} />
                                  <span>{orderDetails[currentId].shippingAddress || "No address provided"}</span>
                                </div>
                              </div>
                            </div>

                            <div className="so-price-breakdown">
                               <div className="so-price-row" style={{ marginBottom: '0.5rem', display: 'flex', justifyContent: 'space-between' }}>
                                  <span style={{ color: '#64748b' }}>Subtotal</span>
                                  <span style={{ fontWeight: 600 }}>${(orderDetails[currentId].itemsTotal || 0).toFixed(2)}</span>
                               </div>
                               <div className="so-price-row" style={{ marginBottom: '0.5rem', display: 'flex', justifyContent: 'space-between', color: '#6366f1' }}>
                                  <span style={{ fontWeight: 600 }}>Logistics</span>
                                  <span style={{ fontWeight: 700 }}>+ ${(orderDetails[currentId].shippingFee || 0).toFixed(2)}</span>
                               </div>
                               <div className="so-price-row total">
                                  <span>Revenue</span>
                                  <span>${(orderDetails[currentId].grandTotal || 0).toFixed(2)}</span>
                               </div>
                            </div>
                          </div>
                       ) : (
                          <div style={{ textAlign: 'center', padding: '1rem' }}>
                             <button className="so-action-btn secondary" onClick={() => toggleOrderItems(currentId)}>
                                <ChevronDown size={14} /> View Order Summary
                             </button>
                          </div>
                       )}

                       {orderDetails[currentId] && (
                          <table className="so-items-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                             <thead>
                                <tr>
                                  <th style={{ textAlign: 'left' }}>Product Details</th>
                                  <th style={{ textAlign: 'center' }}>Qty</th>
                                  <th style={{ textAlign: 'right' }}>Amount</th>
                                </tr>
                             </thead>
                             <tbody>
                               {orderDetails[currentId].items.map((item) => (
                                 <tr key={item.id || Math.random()}>
                                   <td style={{ padding: '1rem' }}>
                                     <div style={{ fontWeight: '700', color: '#1e293b' }}>{item.product?.name || item.name}</div>
                                     <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '4px' }}>
                                        {item.selectedColor} | {item.selectedStorage}
                                     </div>
                                   </td>
                                   <td style={{ textAlign: 'center', fontWeight: '600' }}>{item.quantity}</td>
                                   <td style={{ textAlign: 'right', fontWeight: '700' }}>${(item.unitPrice * item.quantity).toFixed(2)}</td>
                                 </tr>
                               ))}
                             </tbody>
                          </table>
                       )}
                    </div>
                  ) : (
                    <>
                      {expandedOrders[currentId] && orderDetails[currentId] ? (
                         <div className="so-customer-section" style={{ display: 'flex', alignItems: 'center', background: '#f8fafc', padding: '1.5rem', borderRadius: '16px', marginTop: '1rem' }}>
                            <img 
                               src={
                                 orderDetails[currentId].customerProfileImagePath
                                   ? (orderDetails[currentId].customerProfileImagePath.startsWith('http') 
                                       ? orderDetails[currentId].customerProfileImagePath 
                                       : `${API_BASE}/${orderDetails[currentId].customerProfileImagePath}`)
                                   : "https://via.placeholder.com/64"
                               }
                               alt="Customer"
                               style={{
                                 width: '64px', height: '64px', 
                                 borderRadius: '16px', objectFit: 'cover', 
                                 boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', marginRight: '1.5rem'
                               }}
                            />
                            <div className="so-customer-info">
                              <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>
                                {orderDetails[currentId].customerName || "Guest"}
                                <span style={{fontSize:'0.85rem', fontWeight:500, color: '#94a3b8', marginLeft:'12px'}}>
                                    ({orderDetails[currentId].customerPhone || "N/A"})
                                </span>
                              </h4>
                              <p style={{ margin: '4px 0', color: '#64748b', fontSize: '0.9rem' }}>
                                <span style={{ marginRight: '8px' }}>📧</span> {orderDetails[currentId].customerEmail || "N/A"}
                              </p>
                              <p style={{ margin: '4px 0', color: '#64748b', fontSize: '0.9rem' }}>
                                <MapPin size={14} style={{ marginRight: '4px', verticalAlign: 'middle', color: '#6366f1' }} /> {orderDetails[currentId].shippingAddress || "N/A"}
                              </p>
                            </div>
                         </div>
                      ) : (
                         <div style={{padding: '1rem 0', color: '#94a3b8', fontSize: '0.9rem', fontWeight: 500, cursor: 'pointer'}} onClick={() => toggleOrderItems(currentId)}>
                            + {order.items?.length || order.totalItems || 0} items identified in this shipment. Click to expand.
                         </div>
                      )}

                      {order.status !== 'CANCELED' && (
                        <div className="so-actions">
                          <div style={{ display: 'flex', gap: '0.75rem', flex: 1 }}>
                            <select
                              className="so-branch-select"
                              value={orderBranches[currentId] || ""}
                              onChange={(e) =>
                                setOrderBranches((prev) => ({
                                  ...prev,
                                  [currentId]: e.target.value,
                                }))
                              }
                            >
                              <option value="">Logistics Hub</option>
                              {branches.map((b) => (
                                <option key={b} value={b}>{b}</option>
                              ))}
                            </select>

                            <select
                              className="so-branch-select"
                              value={selectedStages[currentId] || ""}
                              onChange={(e) =>
                                setSelectedStages((prev) => ({
                                  ...prev,
                                  [currentId]: e.target.value,
                                }))
                              }
                            >
                              <option value="">Standard Action</option>
                              <option value="PROCESSING">Confirm & Process</option>
                              <option value="SHIPPED">Dispatch to Hub</option>
                              <option value="OUT_FOR_DELIVERY">Out for Delivery</option>
                              <option value="DELIVERED">Complete Delivery</option>
                              <option value="CANCELED">Reject Order</option>
                            </select>
                          </div>

                          <button 
                            onClick={() => {
                              const stage = selectedStages[currentId];
                              if (!stage) {
                                showToast("Please define an action sequence.", "info");
                                return;
                              }
                              updateStatus(currentId, stage);
                            }} 
                            className="so-action-btn primary"
                            disabled={!selectedStages[currentId]}
                          >
                            Execute Update
                          </button>
                        </div>
                      )}

                      <div style={{ marginTop: '0.5rem' }}>
                        <div 
                          className="so-items-toggle"
                          style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
                          onClick={() => toggleOrderItems(currentId)}
                        >
                          <span style={{ fontSize: '0.85rem' }}>{expandedOrders[currentId] ? 'Compact View' : 'Audit Full Details'}</span>
                          {expandedOrders[currentId] ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </div>

                        {expandedOrders[currentId] && orderDetails[currentId] && (
                          <div style={{ marginTop: '1rem' }}>
                            <table className="so-items-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                              <thead>
                                <tr>
                                  <th style={{ width: '60px' }}>Item</th>
                                  <th>Description</th>
                                  <th style={{ textAlign: 'center' }}>Qty</th>
                                  <th style={{ textAlign: 'right' }}>Total</th>
                                  <th style={{ width: '60px' }}></th>
                                </tr>
                              </thead>
                              <tbody>
                                {orderDetails[currentId].items.map((item) => (
                                  <tr key={item.id || Math.random()}>
                                    <td>
                                      <img
                                        src={buildImageUrl(item.product?.imagePath || item.imagePath)}
                                        alt={item.product?.name || item.name}
                                        className="so-item-img"
                                        style={{ border: '1px solid #f1f5f9' }}
                                      />
                                    </td>
                                    <td>
                                      <div style={{ fontWeight: '700', color: '#1e293b' }}>{item.product?.name || item.name}</div>
                                      <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '4px' }}>
                                        {item.selectedColor} • {item.selectedStorage}
                                      </div>
                                    </td>
                                    <td style={{ textAlign: 'center', fontWeight: '600' }}>{item.quantity}</td>
                                    <td style={{ textAlign: 'right', fontWeight: '700' }}>${(item.unitPrice * item.quantity).toFixed(2)}</td>
                                    <td style={{ textAlign: 'right' }}>
                                      <button
                                        className="so-action-btn"
                                        onClick={() => navigate('/seller/products', { state: { editProductId: item.product?.id || item.productId } })}
                                        style={{ background: '#f1f5f9', color: '#475569', borderRadius: '10px', border: 'none', padding: '0.5rem', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                      >
                                        <Edit2 size={12} />
                                      </button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '1.25rem 1rem', background: '#f8fafc', borderRadius: '0 0 16px 16px', border: '1px solid #f1f5f9', borderTop: 'none' }}>
                                <div style={{ textAlign: 'right' }}>
                                  <div style={{ color: '#94a3b8', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Settlement Value</div>
                                  <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0f172a' }}>
                                    ${(orderDetails[currentId].grandTotal || 0).toFixed(2)}
                                  </div>
                                </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
      {/* Toast Notification */}
      {toast.isVisible && (
        <Toast 
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ ...toast, isVisible: false })}
        />
      )}

      {/* Message Modal */}
      <MessageModal
        isOpen={msgModal.isOpen}
        onClose={() => setMsgModal({ ...msgModal, isOpen: false })}
        type={msgModal.type}
        recipientId={msgModal.recipientId}
        recipientName={msgModal.recipientName}
      />
    </div>
  );
}