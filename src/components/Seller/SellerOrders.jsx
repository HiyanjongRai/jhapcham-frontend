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
            <p className="so-subtitle">Manage and track all your customer orders</p>
          </div>
          <button className="so-refresh-btn" onClick={loadOrders}>
            <Package size={16} /> Refresh List
          </button>
        </div>
      </div>

      {/* Stats Grid code ... */}
      <div className="so-stats">
        <div className="so-stat-card total">
          <div className="so-stat-icon"><Package size={24} /></div>
          <div className="so-stat-content">
            <div className="so-stat-label">Total Orders</div>
            <div className="so-stat-value">{stats.total}</div>
          </div>
        </div>
        <div className="so-stat-card pending">
          <div className="so-stat-icon"><Truck size={24} /></div>
          <div className="so-stat-content">
            <div className="so-stat-label">New Orders</div>
            <div className="so-stat-value">{stats.pending}</div>
          </div>
        </div>
        <div className="so-stat-card processing">
          <div className="so-stat-icon"><Edit2 size={24} /></div>
          <div className="so-stat-content">
            <div className="so-stat-label">Processing</div>
            <div className="so-stat-value">{stats.processing}</div>
          </div>
        </div>
        <div className="so-stat-card shipped">
          <div className="so-stat-icon"><Truck size={24} /></div>
          <div className="so-stat-content">
            <div className="so-stat-label">Shipped</div>
            <div className="so-stat-value">{stats.shipped}</div>
          </div>
        </div>
        <div className="so-stat-card delivered">
          <div className="so-stat-icon"><CheckCircle size={24} /></div>
          <div className="so-stat-content">
            <div className="so-stat-label">Delivered</div>
            <div className="so-stat-value">{stats.delivered}</div>
          </div>
        </div>
      </div>

      <div className="so-filters">
        {["NEW", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELED"].map(status => (
          <button
            key={status}
            className={`so-filter-btn ${statusFilter === status ? "active" : ""}`}
            onClick={() => setStatusFilter(status)}
          >
            {status === "NEW" ? "New Orders" : status}
          </button>
        ))}
      </div>

      {filteredOrders.length === 0 ? (
        <div className="so-empty">No orders found.</div>
      ) : (
        <div className="so-orders-list">
          {filteredOrders.map((order) => {
            const currentId = order.id || order.orderId; // Fallback
            return (
              <div key={currentId} className="so-order-card">
                <div className="so-order-header">
                  <div>
                    <h3 className="so-order-id">
                        {order.productNames || `Order #${String(currentId).padStart(4, "0")}`}
                    </h3>
                    <div style={{fontSize: '0.8rem', color: '#666', display: 'flex', alignItems: 'center', gap: '8px'}}>
                        <span style={{fontWeight:'600'}}>#{String(currentId).padStart(4, "0")}</span>
                        • Customer: {order.customerName || "Guest"}
                        <button 
                          className="so-action-btn secondary" 
                          style={{ padding: '2px 6px', fontSize: '0.75rem', height: '24px' }}
                          onClick={() => setMsgModal({
                            isOpen: true,
                            recipientId: order.customerId,
                            recipientName: order.customerName || "Customer",
                            type: 'store'
                          })}
                        >
                          <MessageSquare size={12} /> Message
                        </button>
                    </div>
                  </div>
                  <div className="so-order-meta">
                    <span className={`so-badge so-badge-${(order.status || 'PENDING').toLowerCase()}`}>
                      {order.status}
                    </span>
                    <span style={{fontSize: '0.875rem', color: '#6b7280'}}>
                      {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : ""}
                    </span>
                    <span style={{fontSize: '0.875rem', fontWeight: '600', color: '#111827'}}>
                      ${(order.totalPrice || order.grandTotal || 0).toFixed(2)}
                    </span>
                     {order.paymentMethod && (
                         <span className="so-badge" style={{background: '#f3f4f6', color: '#374151', border: '1px solid #d1d5db'}}>
                          {order.paymentMethod}
                        </span>
                     )}
                  </div>
                </div>

                <div className="so-order-body">
                  {/* For DELIVERED orders, we show EVERYTHING directly as a receipt/history view */}
                  {order.status === 'DELIVERED' ? (
                    <div className="so-delivered-view">
                       {/* Customer Section (Always shown for Delivered) */}
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
                                <h4 className="so-delivered-customer-name">
                                  {orderDetails[currentId].customerName || "Guest"}
                                  <span className="so-delivered-phone">({orderDetails[currentId].customerPhone || "N/A"})</span>
                                </h4>
                                <div className="so-delivered-address">
                                  <MapPin size={14} />
                                  <span>{orderDetails[currentId].shippingAddress || "No address provided"}</span>
                                </div>
                              </div>
                            </div>

                            <div className="so-price-breakdown">
                               <div className="so-price-row">
                                  <span>Subtotal</span>
                                  <span>${(orderDetails[currentId].itemsTotal || 0).toFixed(2)}</span>
                               </div>
                               <div className="so-price-row highlight">
                                  <span>Shipping Fee</span>
                                  <span>+ ${(orderDetails[currentId].shippingFee || 0).toFixed(2)}</span>
                               </div>
                               <div className="so-price-row total">
                                  <span>Total Received</span>
                                  <span>${(orderDetails[currentId].grandTotal || 0).toFixed(2)}</span>
                               </div>
                            </div>
                          </div>
                       ) : (
                          <div className="so-load-details-prompt">
                             <button className="so-action-btn secondary" onClick={() => toggleOrderItems(currentId)}>
                                <ChevronDown size={14} /> Load Order Receipt
                             </button>
                          </div>
                       )}

                       {/* Items Table (Always shown for Delivered if loaded) */}
                       {orderDetails[currentId] && (
                          <div className="so-items-summary">
                             <table className="so-items-table">
                                <thead>
                                  <tr>
                                    <th>Product</th>
                                    <th>Qty</th>
                                    <th>Total</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {orderDetails[currentId].items.map((item) => (
                                    <tr key={item.id || Math.random()}>
                                      <td>
                                        <div style={{ fontWeight: '500', fontSize: '0.9rem' }}>{item.product?.name || item.name}</div>
                                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                                           {item.selectedColor} {item.selectedStorage}
                                        </div>
                                      </td>
                                      <td>{item.quantity}</td>
                                      <td>${(item.unitPrice * item.quantity).toFixed(2)}</td>
                                    </tr>
                                  ))}
                                </tbody>
                             </table>
                          </div>
                       )}
                    </div>
                  ) : (
                    <>
                      {/* Standard View (Collapsible) for other statuses */}
                      {expandedOrders[currentId] && orderDetails[currentId] ? (
                         <div className="so-customer-section">
                            <img 
                               src={
                                 orderDetails[currentId].customerProfileImagePath
                                   ? (orderDetails[currentId].customerProfileImagePath.startsWith('http') 
                                       ? orderDetails[currentId].customerProfileImagePath 
                                       : `${API_BASE}/${orderDetails[currentId].customerProfileImagePath}`)
                                   : "https://via.placeholder.com/60"
                               }
                               alt="Customer"
                               style={{
                                 width: '60px', height: '60px', 
                                 borderRadius: '50%', objectFit: 'cover', 
                                 border: '2px solid #eee', marginRight: '1rem'
                               }}
                            />
                            <div className="so-customer-info">
                              <h4>
                                {orderDetails[currentId].customerName || "Guest"}
                                <span style={{fontSize:'0.8em', fontWeight:'normal', marginLeft:'10px'}}>
                                    ({orderDetails[currentId].customerPhone || "N/A"})
                                </span>
                              </h4>
                              <p>📧 {orderDetails[currentId].customerEmail || "N/A"}</p>
                              <p>📍 {orderDetails[currentId].shippingAddress || "N/A"}</p>
                              {order.assignedBranch && (
                                  <p style={{marginTop: '4px', color: '#2563eb'}}>Currently Assigned To: <strong>{order.assignedBranch}</strong></p>
                              )}
                            </div>
                         </div>
                      ) : (
                         <div style={{padding: '0 1rem', color: '#888', fontStyle: 'italic', fontSize: '0.9rem'}}>
                            {order.items?.length || order.totalItems || 0} items • Click to view details
                         </div>
                      )}

                      {order.status !== 'CANCELED' && (
                        <div className="so-actions">
                          <select
                            className="so-branch-select"
                            value={orderBranches[currentId] || ""}
                            onChange={(e) =>
                              setOrderBranches((prev) => ({
                                ...prev,
                                [currentId]: e.target.value,
                              }))
                            }
                            style={{ marginRight: '0.5rem' }}
                          >
                            <option value="">Select Branch</option>
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
                            style={{ marginRight: '0.5rem', minWidth: '160px' }}
                          >
                            <option value="">Select Action</option>
                            <option value="PROCESSING">Process Order</option>
                            <option value="SHIPPED">Ship Order (To Branch)</option>
                            <option value="OUT_FOR_DELIVERY">Out for Delivery</option>
                            <option value="DELIVERED">Mark Delivered</option>
                            <option value="CANCELED">Cancel Order</option>
                          </select>

                          <button 
                            onClick={() => {
                              const stage = selectedStages[currentId];
                              if (!stage) {
                                showToast("Please select an action/stage first", "info");
                                return;
                              }
                              updateStatus(currentId, stage);
                            }} 
                            className="so-action-btn primary"
                            disabled={!selectedStages[currentId]}
                          >
                            <CheckCircle size={16} /> Update Status
                          </button>
                        </div>
                      )}

                      <div>
                        <div 
                          className="so-items-toggle"
                          onClick={() => toggleOrderItems(currentId)}
                        >
                          {expandedOrders[currentId] ? 'Hide' : 'Show'} Order Details
                          {expandedOrders[currentId] ? <ChevronUp size={16} style={{display: 'inline', marginLeft: '0.5rem'}} /> : <ChevronDown size={16} style={{display: 'inline', marginLeft: '0.5rem'}} />}
                        </div>

                        {expandedOrders[currentId] && orderDetails[currentId] && (
                          <table className="so-items-table">
                            <thead>
                              <tr>
                                <th>Image</th>
                                <th>Product</th>
                                <th>Qty</th>
                                <th>Total</th>
                                <th>Actions</th>
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
                                    />
                                  </td>
                                  <td>
                                    <div style={{ fontWeight: '500' }}>{item.product?.name || item.name}</div>
                                    <div style={{ fontSize: '0.8rem', color: '#666' }}>
                                      {item.selectedColor} {item.selectedStorage}
                                    </div>
                                  </td>
                                  <td>{item.quantity}</td>
                                  <td>${(item.unitPrice * item.quantity).toFixed(2)}</td>
                                  <td>
                                    {(item.product?.id || item.productId) && (
                                      <button
                                        className="so-action-btn"
                                        onClick={() => navigate('/seller/products', { state: { editProductId: item.product?.id || item.productId } })}
                                        style={{ background: '#000', color: '#fff', borderRadius: '6px', border: 'none', padding: '0.4rem' }}
                                      >
                                        <Edit2 size={14} />
                                      </button>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                            <tfoot>
                              <tr>
                                <td colSpan="3" style={{textAlign: 'right'}}><strong>Grand Total</strong></td>
                                <td colSpan="2"><strong>${(orderDetails[currentId].grandTotal || 0).toFixed(2)}</strong></td>
                              </tr>
                            </tfoot>
                          </table>
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