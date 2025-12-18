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
  Edit2
} from "lucide-react";
import { apiGetSellerOrders, apiGetOrder } from "../AddCart/cartUtils";

export default function SellerOrders() {
  const sellerId = getCurrentUserId();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [orderBranches, setOrderBranches] = useState({});
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [expandedOrders, setExpandedOrders] = useState({});
  const [orderDetails, setOrderDetails] = useState({}); // Cache for detailed order info
  const [selectedStages, setSelectedStages] = useState({});
  
  const branches = ["KATHMANDU", "POKHARA", "UDAYAPUR"];

  // Load seller orders
  const loadOrders = useCallback(async () => {
    setLoading(true);
    try {
      console.log("Fetching orders for seller:", sellerId);
      const data = await apiGetSellerOrders(sellerId);
      console.log("Seller orders fetched:", data);
      
      // The backend now returns OrderListItemDTO which is a summary
      setOrders(data || []);
    } catch (err) {
      console.error("Error loading orders:", err);
    } finally {
      setLoading(false);
    }
  }, [sellerId]);

  const updateStatus = async (orderId, nextStatus) => {
    try {
      const branch = orderBranches[orderId];
      // Normalize status
      const statusUpper = nextStatus.toUpperCase();

      if (statusUpper === 'CANCELED') {
        const url = `${API_BASE}/api/orders/seller/${sellerId}/cancel/${orderId}`;
        await axios.put(url);
        alert("Order canceled successfully");
      } 
      else if (statusUpper === 'PROCESSING') {
        const url = `${API_BASE}/api/orders/seller/${sellerId}/process/${orderId}`;
        await axios.put(url);
        alert("Order moved to PROCESSING");
      }
      else if (statusUpper === 'SHIPPED' || statusUpper === 'SHIPPED_TO_BRANCH') {
         // Map SHIPPED to seller assigning branch
         if (!branch) {
             alert("Please select a branch to ship to.");
             return;
         }
         const url = `${API_BASE}/api/orders/seller/${sellerId}/assign/${orderId}`;
         await axios.put(url, { branch: branch }); 
         alert("Order shipped to branch");
      }
      else if (statusUpper === 'OUT_FOR_DELIVERY' || statusUpper === 'DELIVERED') {
          // Verify branch logic - usually branch staff does this, but for dev we allow seller/admin to toggle
          if (!branch) {
             // Try to find existing assigned branch from order details if possible, or force select
             alert("Please confirm the branch (select from dropdown) for this update.");
             return;
          }
          // Construct URL with query parameters
          const params = new URLSearchParams({ branch: branch, nextStatus: statusUpper });
          const url = `${API_BASE}/api/orders/branch/${orderId}/status?${params.toString()}`;
          await axios.put(url);
          alert("Order status updated");
      } 
      else {
          alert(`Unsupported status transition to ${statusUpper}. Backend only supports: Cancel, Ship to Branch, and Branch updates.`);
          return;
      }

      loadOrders();
    } catch (err) {
      console.error(err.response || err);
      const msg = err.response?.data?.message || "Failed to update order";
      alert(msg);
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
    if (statusFilter === "ALL") return orders.filter(o => o.status !== "DELIVERED");
    return orders.filter(o => {
        if (statusFilter === "PENDING") return o.status === "NEW" || o.status === "PENDING";
        if (statusFilter === "SHIPPED") return o.status === "SHIPPED" || o.status === "SHIPPED_TO_BRANCH";
        return o.status === statusFilter;
    });
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
        alert("Could not load order details");
        return; 
      }
    }

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
        <button onClick={loadOrders} style={{ padding: '0.4rem 0.8rem', marginLeft: 'auto', cursor: 'pointer', borderRadius: '4px', border: '1px solid #ccc', background: '#fff' }}>
          Refresh List
        </button>
        <p className="so-subtitle">Manage and track all your customer orders</p>
      </div>

      <div className="so-stats">
        <div className="so-stat-card">
          <div className="so-stat-label">Total Orders</div>
          <div className="so-stat-value">{stats.total}</div>
        </div>
        <div className="so-stat-card">
          <div className="so-stat-label">Pending</div>
          <div className="so-stat-value">{stats.pending}</div>
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

      <div className="so-filters">
        {["ALL", "PENDING", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELED"].map(status => (
          <button
            key={status}
            className={`so-filter-btn ${statusFilter === status ? "active" : ""}`}
            onClick={() => setStatusFilter(status)}
          >
            {status === "ALL" ? "All Orders" : status}
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
                    <h3 className="so-order-id">Order #{String(currentId).padStart(4, "0")}</h3>
                    <div style={{fontSize: '0.8rem', color: '#666'}}>Customer: {order.customer?.fullName || order.customerName || "Guest"}</div>
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
                  {/* Customer Info Section - Only visible if expanded or if we have detail */}
                  {expandedOrders[currentId] && orderDetails[currentId] ? (
                     <div className="so-customer-section">
                        {/* Customer Image */}
                        <img 
                           src={
                             orderDetails[currentId].customer?.profileImagePath
                               ? (orderDetails[currentId].customer.profileImagePath.startsWith('http') 
                                   ? orderDetails[currentId].customer.profileImagePath 
                                   : `${API_BASE}/${orderDetails[currentId].customer.profileImagePath}`)
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
                            {orderDetails[currentId].customer?.fullName || orderDetails[currentId].customer?.username || "No name"}
                            <span style={{fontSize:'0.8em', fontWeight:'normal', marginLeft:'10px'}}>
                                ({orderDetails[currentId].customer?.contactNumber || "N/A"})
                            </span>
                          </h4>
                          <p>📧 {orderDetails[currentId].customerEmail || orderDetails[currentId].customer?.email || "Not provided"}</p>
                          <p>📍 {orderDetails[currentId].deliveryAddress?.fullAddress || "No address provided"}</p>
                          {/* Shipping Zone is not on Order entity currently, seemingly lost or not saved */}
                        </div>
                     </div>
                  ) : (
                     /* collapsed view, minimal info */
                     <div style={{padding: '0 1rem', color: '#888', fontStyle: 'italic', fontSize: '0.9rem'}}>
                        {order.items?.length || order.totalItems || 0} items • Click to view details
                     </div>
                  )}

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
                          alert("Please select an action/stage first");
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
                          {orderDetails[currentId].items.map((item) => {
                             const productName = item.product?.name || item.name || "Unknown";
                             const productImage = item.product?.imagePath || item.imagePath; // Product entity has imagePath
                             const itemTotal = item.unitPrice * item.quantity;
                             const productId = item.product?.id || item.productId;

                            return (
                              <tr key={item.id || Math.random()}>
                                <td>
                                  <img
                                    src={buildImageUrl(productImage)}
                                    alt={productName}
                                    className="so-item-img"
                                  />
                                </td>
                                <td>
                                  <div style={{ fontWeight: '500' }}>{productName}</div>
                                  <div style={{ fontSize: '0.8rem', color: '#666', marginTop: '2px' }}>
                                    {item.selectedColor && (
                                      <span style={{ marginRight: '8px' }}>
                                        Color: {item.selectedColor}
                                      </span>
                                    )}
                                    {item.selectedStorage && (
                                      <span>
                                        Storage: {item.selectedStorage}
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td>{item.quantity}</td>
                                <td>${(itemTotal || 0).toFixed(2)}</td>
                                <td>
                                  {productId && (
                                    <button
                                      className="so-action-btn"
                                      onClick={() => navigate('/seller/products', { state: { editProductId: productId } })}
                                      title="Edit this product"
                                      style={{
                                        padding: '0.5rem 0.75rem',
                                        fontSize: '0.8rem',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '0.375rem',
                                        background: '#000',
                                        color: '#fff',
                                        border: 'none',
                                        borderRadius: '6px',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s'
                                      }}
                                    >
                                      <Edit2 size={14} />
                                    </button>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                        <tfoot>
                          <tr>
                            <td colSpan="3" style={{textAlign: 'right'}}>Subtotal</td>
                            <td>${(orderDetails[currentId].itemsTotal || 0).toFixed(2)}</td>
                            <td></td>
                          </tr>
                          <tr>
                            <td colSpan="3" style={{textAlign: 'right'}}>Shipping</td>
                            <td>${(orderDetails[currentId].shippingFee || 0).toFixed(2)}</td>
                            <td></td>
                          </tr>
                          <tr>
                            <td colSpan="3" style={{textAlign: 'right'}}><strong>Grand Total</strong></td>
                            <td><strong>${(orderDetails[currentId].grandTotal || 0).toFixed(2)}</strong></td>
                            <td></td>
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