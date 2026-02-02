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
  MessageSquare,
  Copy,
  ExternalLink,
  Clock,
  ShieldCheck,
  RefreshCcw,
  Search,
  Filter,
  MoreHorizontal,
  Archive,
  FileText,
  AlertCircle,
  Navigation,
  User
} from "lucide-react";
import { apiGetSellerOrders, apiGetOrder } from "../AddCart/cartUtils";

import Toast from "../Toast/Toast"; // Import Toast
import MessageModal from "../Message/MessageModal"; // Import MessageModal

export default function SellerOrders() {
  const sellerId = useMemo(() => getCurrentUserId(), []);
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [orderBranches, setOrderBranches] = useState({});
  const [statusFilter, setStatusFilter] = useState("NEW");
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [orderDetails, setOrderDetails] = useState({}); 
  const [msgModal, setMsgModal] = useState({ isOpen: false, recipientId: null, recipientName: '', type: 'store' });
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("active"); 

  // Toast State
  const [toast, setToast] = useState({ message: '', type: 'info', isVisible: false });

  const showToast = (message, type = 'info') => {
    setToast({ message, type, isVisible: true });
  };
  
  const handleCopy = (text) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    showToast("Copied to clipboard!", "success");
  };
  
  const branches = ["KATHMANDU", "POKHARA", "UDAYAPUR"];

  const loadOrders = useCallback(async (refreshDetail = false) => {
    if (!sellerId) {
       console.warn("No seller ID found, skipping load.");
       setLoading(false);
       return;
    }

    setLoading(true);
    try {
      const data = await apiGetSellerOrders(sellerId);
      if (Array.isArray(data)) {
        setOrders(data);
      } else {
        console.warn("Expected orders array but got:", data);
        setOrders([]);
        if (data && data.message) showToast(data.message, "error");
      }

      // Optional: Refresh the Detail drawer if open
      if (refreshDetail && selectedOrderId) {
        try {
          const detail = await apiGetOrder(selectedOrderId);
          setOrderDetails(prev => ({ ...prev, [selectedOrderId]: detail }));
        } catch (e) {
          console.error("Failed to refresh order details", e);
        }
      }
    } catch (err) {
      console.error("Error loading orders:", err);
      // Check for 401/403
      if (err.status === 401 || err.status === 403) {
          showToast("Session expired. Please login again.", "error");
      } else {
          showToast("Failed to load orders pipeline.", "error");
      }
    } finally {
      setLoading(false);
    }
  }, [sellerId, selectedOrderId]);

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
             showToast("Please select a hub before dispatch.", "warning");
             return;
         }
         const url = `${API_BASE}/api/orders/seller/${sellerId}/assign/${orderId}`;
         await axios.put(url, { branch: branch }); 
         showToast("Order dispatched to branch", "success");
      }
      else if (statusUpper === 'OUT_FOR_DELIVERY' || statusUpper === 'DELIVERED') {
          if (!branch) {
             showToast("Please confirm the branch for this update.", "warning");
             return;
          }
          const params = new URLSearchParams({ branch: branch, nextStatus: statusUpper });
          const url = `${API_BASE}/api/orders/branch/${orderId}/status?${params.toString()}`;
          await axios.put(url);
          showToast(`Order status updated to ${statusUpper}`, "success");
      } 

      loadOrders(true); // Pass true to refresh details too
    } catch (err) {
      console.error(err.response || err);
      const msg = err.response?.data?.message || err.message || "Failed to update order";
      showToast(msg, "error");
    }
  };

  const buildImageUrl = (imagePath) => {
    if (!imagePath) return null;
    if (imagePath.startsWith("http")) return imagePath;
    const cleanPath = imagePath.startsWith('/') ? imagePath.slice(1) : imagePath;
    return `${API_BASE}/${cleanPath}`;
  };

  const stats = useMemo(() => {
    if (!Array.isArray(orders)) return { total: 0, pending: 0, processing: 0, shipped: 0, delivered: 0 };
    const total = orders.length;
    const pending = orders.filter(o => o.status === "NEW" || o.status === "PENDING").length; 
    const processing = orders.filter(o => o.status === "PROCESSING").length;
    const shipped = orders.filter(o => o.status === "SHIPPED" || o.status === "SHIPPED_TO_BRANCH" || o.status === "OUT_FOR_DELIVERY").length;
    const delivered = orders.filter(o => o.status === "DELIVERED").length;
    return { total, pending, processing, shipped, delivered };
  }, [orders]);

  const filteredOrders = useMemo(() => {
    if (!Array.isArray(orders)) return [];
    let result = [...orders];

    if (activeTab === "active") {
      result = result.filter(o => o.status !== "DELIVERED" && o.status !== "CANCELED");
    } else {
      result = result.filter(o => o.status === "DELIVERED" || o.status === "CANCELED");
    }

    if (statusFilter !== "ALL") {
      if (statusFilter === "NEW") {
        result = result.filter(o => o.status === "NEW" || o.status === "PENDING");
      } else if (statusFilter === "PROCESSING") {
        result = result.filter(o => o.status === "PROCESSING");
      } else if (statusFilter === "SHIPPED") {
        result = result.filter(o => o.status === "SHIPPED" || o.status === "SHIPPED_TO_BRANCH" || o.status === "OUT_FOR_DELIVERY");
      } else if (statusFilter === "DELIVERED") {
        result = result.filter(o => o.status === "DELIVERED");
      } else if (statusFilter === "CANCELED") {
        result = result.filter(o => o.status === "CANCELED");
      }
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(o => {
        const orderId = String(o.id || o.orderId);
        const customerName = (o.customerName || "Anonymous Customer").toLowerCase();
        const address = (o.shippingAddress || "").toLowerCase();
        const productNames = (o.productNames || "").toLowerCase();
        
        return orderId.includes(query) || 
               customerName.includes(query) ||
               address.includes(query) ||
               productNames.includes(query);
      });
    }
    
    return result;
  }, [orders, statusFilter, searchQuery, activeTab]);

  useEffect(() => {
    loadOrders();
    // eslint-disable-next-line
  }, [sellerId]); // Only reload when sellerId changes

  const handleSelectOrder = async (orderId) => {
    if (selectedOrderId === orderId) {
      setSelectedOrderId(null);
      return;
    }
    
    setSelectedOrderId(orderId);
    
    if (!orderDetails[orderId]) {
      try {
        const detail = await apiGetOrder(orderId);
        setOrderDetails(prev => ({ ...prev, [orderId]: detail }));
        // Pre-set branch if it already exists
        if (detail.assignedBranch) {
           setOrderBranches(prev => ({ ...prev, [orderId]: detail.assignedBranch }));
        }
      } catch (e) {
        console.error("Failed to fetch order details", e);
        showToast("Could not load order details", "error");
      }
    }
  };

  useEffect(() => {
      setStatusFilter("ALL");
  }, []);

  const currentOrder = selectedOrderId ? orders.find(o => (o.id || o.orderId) === selectedOrderId) : null;
  const currentDetail = selectedOrderId ? orderDetails[selectedOrderId] : null;

  return (
    <div className={`so-container-v2 ${selectedOrderId ? 'drawer-opened' : ''}`}>
      {/* Sidebar for context - (Assuming it exists in SellerLayout, just adjusting main area) */}
      
      <main className="so-main-content">
        <header className="so-header-v2">
          <div className="so-header-left">
            <h1 className="so-page-title">Order Hub</h1>
          </div>
          <div className="so-header-right">
             <div className="so-header-actions">
                <button className="so-btn-icon" title="Notifications"><AlertCircle size={20} /></button>
                <button className="so-btn-help">Help Center</button>
             </div>
          </div>
        </header>

        {/* Executive Metrics */}
        <div className="so-metrics-grid-v2">
          {[
            { key: 'total', label: 'Gross Volume', value: stats.total, sub: 'Total Orders', icon: <Package size={18} /> },
            { key: 'pending', label: 'Unfulfilled', value: stats.pending, sub: 'New & Pending', color: 'amber', icon: <AlertCircle size={18} /> },
            { key: 'processing', label: 'In Execution', value: stats.processing, sub: 'Processing', color: 'blue', icon: <RefreshCcw size={18} /> },
            { key: 'shipped', label: 'In Transit', value: stats.shipped, sub: 'Shipped', color: 'cyan', icon: <Truck size={18} /> },
            { key: 'delivered', label: 'Settled', value: stats.delivered, sub: 'Delivered', color: 'emerald', icon: <CheckCircle size={18} /> },
          ].map((s) => (
            <div 
               key={s.key} 
               className={`so-metric-card-v2 ${s.color || ''} ${statusFilter === (s.key === 'total' ? 'ALL' : (s.key === 'pending' ? 'NEW' : s.key.toUpperCase())) ? 'active' : ''}`}
               onClick={() => setStatusFilter(s.key === 'total' ? 'ALL' : (s.key === 'pending' ? 'NEW' : s.key.toUpperCase()))}
            >
              <div className="metric-header">
                <span className="metric-label">{s.label} {s.icon}</span>
              </div>
              <div className="metric-body">
                <span className="metric-value">{s.value.toLocaleString()}</span>
              </div>
              <div className="metric-footer">
                <span className="metric-sub">{s.sub}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Workflow Controls */}
        <div className="so-workflow-controls-v2">
          <div className="so-tabs-v2">
            <button className={`so-tab-v2 ${activeTab === 'active' ? 'active' : ''}`} onClick={() => setActiveTab('active')}>Active Workbench</button>
            <button className={`so-tab-v2 ${activeTab === 'completed' ? 'active' : ''}`} onClick={() => setActiveTab('completed')}>History Archive</button>
          </div>

          <div className="so-filters-v2">
            <div className="so-search-box-v2">
              <Search size={16} />
              <input 
                type="text" 
                placeholder="Search Order ID, Name, Product..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="so-filter-pills-v2">
              <button className={`filter-pill-v2 ${statusFilter === 'ALL' ? 'active' : ''}`} onClick={() => setStatusFilter('ALL')}>All</button>
              <button className={`filter-pill-v2 ${statusFilter === 'NEW' ? 'active' : ''}`} onClick={() => setStatusFilter('NEW')}>Inbound</button>
              <button className={`filter-pill-v2 ${statusFilter === 'PROCESSING' ? 'active' : ''}`} onClick={() => setStatusFilter('PROCESSING')}>Process</button>
              <button className={`filter-pill-v2 ${statusFilter === 'SHIPPED' ? 'active' : ''}`} onClick={() => setStatusFilter('SHIPPED')}>Dispatched</button>
              <button className={`filter-pill-v2 ${statusFilter === 'DELIVERED' ? 'active' : ''}`} onClick={() => setStatusFilter('DELIVERED')}>Success</button>
              <button className={`filter-pill-v2 ${statusFilter === 'CANCELED' ? 'active' : ''}`} onClick={() => setStatusFilter('CANCELED')}>Voided</button>
            </div>
            <button className="so-btn-sync" onClick={loadOrders}><RefreshCcw size={14} /> Sync</button>
          </div>
        </div>

        {/* Data Table */}
        <div className="so-table-container-v2">
          <table className="so-table-v2">
            <thead>
              <tr>
                <th>ORDER ID</th>
                <th>RECIPIENT</th>
                <th>PRODUCT</th>
                <th>PAYMENT</th>
                <th>TOTAL & DISCOUNT</th>
                <th>SETTLEMENT</th>
                <th>STATUS</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map(order => {
                const oid = order.id || order.orderId;
                const isSelected = selectedOrderId === oid;
                return (
                  <tr key={oid} className={`${isSelected ? 'selected' : ''}`} onClick={() => handleSelectOrder(oid)}>
                    <td>
                      <div className="oid-cell">
                        <span className="oid-text">ORD-{String(oid).padStart(5, '0')}</span>
                        <span className="oid-time">{order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'N/A'}</span>
                      </div>
                    </td>
                    <td>
                      <div className="recipient-cell">
                        <div className="recipient-avatar-v2">
                           <div className="avatar-initial">{(order.customerName || 'U').charAt(0)}</div>
                           {order.customerProfileImagePath && (
                              <img 
                                src={buildImageUrl(order.customerProfileImagePath)} 
                                alt="" 
                                className="recipient-avatar-img"
                                onError={(e) => { e.currentTarget.style.display='none'; }} 
                              />
                           )}
                        </div>
                        <div className="recipient-info-v2">
                           <span className="recipient-name">{order.customerName || "Confidential Buyer"}</span>
                           <span className="recipient-phone">{order.customerPhone || "N/A"}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="product-cell-v2">
                        <img 
                          src={buildImageUrl(order.productImage || order.items?.[0]?.product?.imagePath || order.items?.[0]?.imagePath)} 
                          alt="" 
                          className="prod-thumb-v2"
                          onError={(e) => { e.currentTarget.src = 'https://via.placeholder.com/40?text=P'; }}
                        />
                        <div className="prod-info-v2">
                           <span className="prod-name-v2">{order.productNames?.split(',')[0]}</span>
                           {order.items?.length > 1 && <span className="prod-count-v2">+{order.items.length - 1} items</span>}
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`payment-badge-v2 ${(order.paymentMethod || 'COD').toLowerCase()}`}>
                        {order.paymentMethod || 'COD'}
                      </span>
                    </td>
                    <td>
                      <div className="total-cell-v2">
                        <span className="grand-total-v2">NPR {(order.grandTotal || 0).toLocaleString()}</span>
                        {order.discountTotal > 0 && (
                          <span className="discount-tag-v2">-NPR {order.discountTotal.toLocaleString()}</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="settlement-cell-v2">
                         <span className="net-amount-v2">NPR {(order.sellerNetAmount || 0).toLocaleString()}</span>
                         <span className="settlement-sub-v2">Net Income</span>
                      </div>
                    </td>
                    <td>
                      <div className={`status-dot-pill ${(order.status || 'PENDING').toLowerCase()}`}>
                        <span className="dot"></span>
                        {(order.status || "").replace(/_/g, " ")}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filteredOrders.length === 0 && (
            <div className="so-empty-v2">
              <Archive size={40} />
              <p>No orders found in this view.</p>
            </div>
          )}
        </div>
      </main>

      {/* Detail Drawer */}
      <aside className={`so-detail-drawer ${selectedOrderId ? 'open' : ''}`}>
        {currentOrder ? (
          <div className="drawer-inner">
            <header className="drawer-header">
              <div className="order-id-meta">
                <span className="label">ORDER DETAIL</span>
                <h2>#ORD-{String(selectedOrderId).padStart(5, '0')} <Copy size={14} className="copy-btn" onClick={() => handleCopy(`ORD-${selectedOrderId}`)} /></h2>
                {currentOrder.status && <span className={`status-label ${currentOrder.status.toLowerCase()}`}>{currentOrder.status.replace(/_/g, ' ')}</span>}
              </div>
              <div className="drawer-actions">
                <button className="so-btn-icon" onClick={() => window.print()} title="Print"><FileText size={18} /></button>
                <button className="so-btn-close" onClick={() => setSelectedOrderId(null)}><XCircle size={20} /></button>
              </div>
            </header>

            <div className="drawer-content">
              {/* Stepper */}
              <div className="so-stepper-v2">
                {[
                  { label: "Received", status: ["NEW", "PENDING"] },
                  { label: "Processing", status: ["PROCESSING"] },
                  { label: "Dispatched", status: ["SHIPPED", "SHIPPED_TO_BRANCH", "OUT_FOR_DELIVERY"] },
                  { label: "Delivered", status: ["DELIVERED"] }
                ].map((step, idx) => {
                  const currentStatus = (currentOrder.status || "").toUpperCase();
                  const stepIndex = ["NEW", "PENDING"].includes(currentStatus) ? 0 :
                                   ["PROCESSING"].includes(currentStatus) ? 1 :
                                   ["SHIPPED", "SHIPPED_TO_BRANCH", "OUT_FOR_DELIVERY"].includes(currentStatus) ? 2 :
                                   ["DELIVERED"].includes(currentStatus) ? 3 : 0;
                  
                  const isDone = idx < stepIndex;
                  const isActive = idx === stepIndex;
                  
                  return (
                    <div key={step.label} className={`step-item-v2 ${isDone ? 'done' : ''} ${isActive ? 'active' : ''}`}>
                      <div className="step-circle">{isDone ? <CheckCircle size={14} /> : idx + 1}</div>
                      <span className="step-label">{step.label}</span>
                      {idx < 3 && <div className="step-line"></div>}
                    </div>
                  );
                })}
              </div>

              {/* Customer Info */}
              <section className="drawer-section">
                <h3 className="section-title"><User size={14} /> CUSTOMER</h3>
                <div className="customer-info-box">
                  <div className="customer-avatar">
                {currentOrder.customerProfileImagePath && (
                  <img 
                    src={buildImageUrl(currentOrder.customerProfileImagePath)} 
                    alt="" 
                    onError={(e) => { e.currentTarget.style.display='none'; }} 
                  />
                )}
                <span>{currentOrder.customerName?.charAt(0) || 'U'}</span>
              </div>
                  <div className="customer-details">
                    <span className="customer-name">{currentOrder.customerName || "Sita Sharma"}</span>
                    <span className="customer-contact">+977 {currentOrder.customerPhone || "980-332-1100"}</span>
                  </div>
                  <button className="so-btn-message" onClick={() => setMsgModal({ isOpen: true, recipientId: currentOrder.customerId, recipientName: currentOrder.customerName, type: 'store' })}><MessageSquare size={14} /></button>
                </div>
              </section>

              {/* Logistics */}
              <section className="drawer-section">
                <h3 className="section-title"><MapPin size={14} /> LOGISTICS TERMINAL</h3>
                <div className="logistics-info-v2">
                  <div className="log-row-v2">
                    <MapPin size={14} className="log-icon-v2" />
                    <p>{currentDetail?.shippingAddress || currentOrder.shippingAddress || "House 45, New Baneshwor, Kathmandu"}</p>
                  </div>
                  <div className="log-row-v2">
                    <Clock size={14} className="log-icon-v2" />
                    <p>Pref. Time: {currentDetail?.deliveryTimePreference || "10 AM - 2 PM"}</p>
                  </div>
                  <div className="internal-notes-v2">
                    <label>Internal Notes</label>
                    <textarea 
                      placeholder="Add internal note..." 
                      defaultValue={currentDetail?.orderNote || ""}
                      readOnly
                    ></textarea>
                  </div>
                </div>
              </section>

              {/* Manifest */}
              <section className="drawer-section">
                <h3 className="section-title"><Package size={14} /> UNIT MANIFEST</h3>
                <div className="manifest-list-v2">
                  {currentDetail?.items?.map(item => (
                    <div key={item.productId} className="manifest-item-v2">
                       <img src={buildImageUrl(item.imagePath)} alt="" className="item-img-v2" />
                       <div className="item-meta-v2">
                          <span className="item-name-v2">{item.name}</span>
                          <span className="item-sub-v2">{item.selectedColor || ''} {item.selectedStorage || ''}</span>
                       </div>
                       <div className="item-qty-v2">x{item.quantity}</div>
                       <div className="item-price-v2">NPR {item.lineTotal?.toLocaleString()}</div>
                    </div>
                  ))}
                  <div className="manifest-total-v2">
                      <div className="total-row-v2">
                        <span>Items Total (Gross)</span>
                        <span>NPR {currentDetail?.itemsTotal?.toLocaleString()}</span>
                      </div>
                      {currentDetail?.discountTotal > 0 && (
                        <div className="total-row-v2 discount">
                          <span>Promo Discount</span>
                          <span style={{ color: '#ff4d4f' }}>- NPR {currentDetail?.discountTotal?.toLocaleString()}</span>
                        </div>
                      )}
                      <div className="total-row-v2">
                        <span>Shipping (Customer Paid)</span>
                        <span>NPR {currentDetail?.shippingFee?.toLocaleString()}</span>
                      </div>
                      <div className="total-divider-v2" style={{ margin: '12px 0', borderTop: '1px dashed #eee' }}></div>
                      <div className="total-row-v2 grand">
                        <span>User Paid</span>
                        <span>NPR {currentDetail?.grandTotal?.toLocaleString()}</span>
                      </div>
                      
                      <div className="settlement-box-v2" style={{ marginTop: '20px', padding: '16px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                        <h4 style={{ margin: '0 0 12px', fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Seller Settlement</h4>
                        <div className="total-row-v2">
                          <span>Seller Gross</span>
                          <span>NPR {currentDetail?.sellerGrossAmount?.toLocaleString()}</span>
                        </div>
                        <div className="total-row-v2">
                          <span>Logistics Charge</span>
                          <span>- NPR {currentDetail?.sellerShippingCharge?.toLocaleString()}</span>
                        </div>
                        <div className="total-row-v2" style={{ marginTop: '8px', fontWeight: '800', color: '#0f172a' }}>
                          <span>Final Net</span>
                          <span>NPR {currentDetail?.sellerNetAmount?.toLocaleString()}</span>
                        </div>
                      </div>
                  </div>
                </div>
              </section>
            </div>

            <footer className="drawer-footer-v2">
              <div className="execution-panel-v2">
                {currentOrder.status !== 'CANCELED' && (
                  <>
                    <div className="hub-selection-v2">
                      <select 
                        value={orderBranches[selectedOrderId] || ""} 
                        onChange={(e) => setOrderBranches(prev => ({ ...prev, [selectedOrderId]: e.target.value }))}
                      >
                        <option value="" disabled>Select Delivery Hub</option>
                        {branches.map(b => <option key={b} value={b}>{b} Hub</option>)}
                      </select>
                    </div>
                    
                    <div className="main-actions-v2">
                      {["NEW", "PENDING"].includes(currentOrder.status) && (
                        <button className="so-btn-big primary" onClick={() => updateStatus(selectedOrderId, 'PROCESSING')}>
                           <CheckCircle size={18} /> Confirm Process
                        </button>
                      )}
                      {currentOrder.status === "PROCESSING" && (
                        <button className="so-btn-big primary" disabled={!orderBranches[selectedOrderId]} onClick={() => updateStatus(selectedOrderId, 'SHIPPED')}>
                           Confirm Dispatch
                        </button>
                      )}
                      {["SHIPPED", "SHIPPED_TO_BRANCH"].includes(currentOrder.status) && (
                        <button className="so-btn-big primary" onClick={() => updateStatus(selectedOrderId, 'OUT_FOR_DELIVERY')}>
                           Authorize Dispatch
                        </button>
                      )}
                      {currentOrder.status === "OUT_FOR_DELIVERY" && (
                        <button className="so-btn-big success" onClick={() => updateStatus(selectedOrderId, 'DELIVERED')}>
                           Verify Fulfillment
                        </button>
                      )}
                      
                      <button className="so-btn-big secondary" onClick={() => updateStatus(selectedOrderId, 'CANCELED')}>
                        Void Order
                      </button>
                    </div>
                  </>
                )}
                {currentOrder.status === 'CANCELED' && (
                  <div className="void-info-v2">
                    <XCircle size={20} />
                    <span>This transaction has been voided.</span>
                  </div>
                )}
              </div>
            </footer>
          </div>
        ) : (
          <div className="drawer-empty-v2">Select an order to view details.</div>
        )}
      </aside>

      {toast.isVisible && (
        <Toast 
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ ...toast, isVisible: false })}
        />
      )}

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
