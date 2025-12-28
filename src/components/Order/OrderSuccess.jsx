import React, { useEffect, useState } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { CheckCircle, Package, Truck, Home, ArrowRight, ShoppingBag, MapPin, Calendar } from 'lucide-react';
import './OrderSuccess.css';
import { API_BASE } from '../config/config';

function OrderSuccess() {
  const location = useLocation();
  const navigate = useNavigate();
  // Support both 'session' (legacy) and 'order' (direct) keys from navigation state
  const orderData = location.state?.order || location.state?.session;

  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    // If no state, redirect to home after a brief moment to avoid empty page
    if (!orderData) {
       const timer = setTimeout(() => navigate('/'), 3000);
       return () => clearTimeout(timer);
    }
    setAnimate(true);
  }, [orderData, navigate]);

  if (!orderData) {
    return (
      <div className="os-container empty-state">
        <div className="os-spinner"></div>
        <p>Redirecting...</p>
      </div>
    );
  }

  // Robust Data Extraction
  let finalOrder = orderData;
  if (Array.isArray(orderData)) {
       if (orderData.length === 0) return <div className="os-container empty-state">Empty Order</div>;
       const first = orderData[0];
       finalOrder = {
           ...first,
           // Aggregate fields
           orderId: orderData.map(o => o.orderId || o.id).join(', #'),
           grandTotal: orderData.reduce((sum, o) => sum + (o.grandTotal || o.totalAmount || o.total || 0), 0),
           itemsTotal: orderData.reduce((sum, o) => sum + (o.itemsTotal || o.subtotal || 0), 0),
           shippingFee: orderData.reduce((sum, o) => sum + (o.shippingFee || o.shipping || 0), 0),
           items: orderData.flatMap(o => o.items || o.orderItems || o.products || []),
           // Common fields
           shippingAddress: first.shippingAddress || first.address,
           paymentMethod: first.paymentMethod || first.payment,
           customerName: first.customerName,
           estimatedDelivery: first.estimatedDelivery
       };
  }

  const {
     orderId = finalOrder.orderId || finalOrder.id || "N/A",
     grandTotal = finalOrder.grandTotal || finalOrder.totalAmount || finalOrder.total || 0,
     items = finalOrder.items || finalOrder.orderItems || finalOrder.products || [],
     shippingAddress = finalOrder.shippingAddress || finalOrder.address || "N/A",
     paymentMethod = finalOrder.paymentMethod || finalOrder.payment || "COD",
     estimatedDelivery = finalOrder.estimatedDelivery || "3-5 Business Days",
     customerName = finalOrder.customerName || "Customer",
     shippingFee = finalOrder.shippingFee || 0,
     itemsTotal = finalOrder.itemsTotal || 0,
  } = finalOrder;

  const buildImageUrl = (path) => {
      if (!path) return "https://via.placeholder.com/60";
      if (path.startsWith('http')) return path;
      return `${API_BASE}/${path.startsWith('/') ? path.slice(1) : path}`;
  };

  return (
    <div className={`os-wrapper ${animate ? 'fade-in' : ''}`}>
      <div className="os-card">
        {/* Header Section */}
        <div className="os-header">
           <div className="os-success-icon">
              <CheckCircle size={48} color="#ffffff" strokeWidth={2.5} />
           </div>
           <h1 className="os-title">Order Confirmed!</h1>
           <p className="os-subtitle">
             Thank you, {customerName.split(' ')[0]}! We've received your order.
           </p>
           <div className="os-order-pill">
              Order ID: <span>#{orderId}</span>
           </div>
        </div>

        {/* Dynamic Stepper / Timeline */}
        <div className="os-timeline">
            <div className="os-step active">
               <div className="os-step-icon"><CheckCircle size={16} /></div>
               <span>Confirmed</span>
            </div>
            <div className="os-line active"></div>
            <div className="os-step">
               <div className="os-step-icon"><Package size={16} /></div>
               <span>Processing</span>
            </div>
            <div className="os-line"></div>
            <div className="os-step">
               <div className="os-step-icon"><Truck size={16} /></div>
               <span>On the way</span>
            </div>
        </div>

        {/* Content Grid */}
        <div className="os-grid">
            {/* Left Col: Details */}
            <div className="os-details">
                <div className="os-section">
                    <h3><MapPin size={16} /> Delivery Details</h3>
                    <div className="os-info-box">
                        <p className="os-label">Shipping Address</p>
                        <p className="os-value">{shippingAddress}</p>
                        <div className="os-divider"></div>
                        <p className="os-label">Estimated Delivery</p>
                        <p className="os-value highlight">{estimatedDelivery}</p>
                    </div>
                </div>

                <div className="os-section">
                   <h3><ShoppingBag size={16} /> Order Items ({items.length})</h3>
                   <div className="os-items-list">
                      {items.map((item, idx) => (
                          <div key={idx} className="os-item">
                             <img 
                                src={buildImageUrl(item.imagePath || item.image)} 
                                alt={item.productName || item.name} 
                                className="os-item-img"
                             />
                             <div className="os-item-info">
                                 <h4 className="os-item-name">{item.productName || item.name || "Product"}</h4>
                                 <p className="os-item-meta">
                                    Qty: {item.quantity} 
                                    {item.selectedColor && ` • ${item.selectedColor}`}
                                 </p>
                             </div>
                             <div className="os-item-price">
                                Rs. {(item.lineTotal || (item.unitPrice * item.quantity) || 0).toLocaleString()}
                             </div>
                          </div>
                      ))}
                   </div>
                </div>
            </div>

            {/* Right Col: Summary */}
            <div className="os-sidebar">
                <div className="os-summary-box">
                    <h3>Payment Summary</h3>
                    <div className="os-row">
                        <span>Subtotal</span>
                        <span>Rs. {itemsTotal.toLocaleString()}</span>
                    </div>
                    <div className="os-row">
                        <span>Shipping</span>
                        <span>{shippingFee === 0 ? "Free" : `Rs. ${shippingFee.toLocaleString()}`}</span>
                    </div>
                    <div className="os-row total">
                        <span>Total Paid</span>
                        <span>Rs. {grandTotal.toLocaleString()}</span>
                    </div>
                    
                    <div className="os-payment-tag">
                        Paid via {paymentMethod}
                    </div>
                </div>

                <div className="os-actions">
                    <Link to="/" className="os-btn primary">
                        Continue Shopping <ArrowRight size={18} />
                    </Link>
                    <Link to="/profile" className="os-btn secondary">
                        View My Orders
                    </Link>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}

export default OrderSuccess;
