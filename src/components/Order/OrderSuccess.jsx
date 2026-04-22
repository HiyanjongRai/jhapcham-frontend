import React, { useEffect, useState } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { Check } from 'lucide-react';
import './OrderSuccess.css';
import { API_BASE } from '../config/config';

function OrderSuccess() {
  const location = useLocation();
  const navigate = useNavigate();
  const orderData = location.state?.order || location.state?.session;

  useEffect(() => {
    if (!orderData) {
       const timer = setTimeout(() => navigate('/'), 3000);
       return () => clearTimeout(timer);
    }
  }, [orderData, navigate]);

  if (!orderData) {
    return (
      <div className="os-wrapper">
        <p>Loading your receipt...</p>
      </div>
    );
  }

  let finalOrder = orderData;
  if (Array.isArray(orderData)) {
       const first = orderData[0];
       finalOrder = {
           ...first,
           orderId: orderData.map(o => o.orderId || o.id).join(', #'),
           grandTotal: orderData.reduce((sum, o) => sum + (o.grandTotal || o.totalAmount || o.total || 0), 0),
           itemsTotal: orderData.reduce((sum, o) => sum + (o.itemsTotal || o.subtotal || 0), 0),
           shippingFee: orderData.reduce((sum, o) => sum + (o.shippingFee || o.shipping || 0), 0),
           discountTotal: orderData.reduce((sum, o) => sum + (o.discountTotal || 0), 0),
           items: orderData.flatMap(o => o.items || o.orderItems || o.products || []),
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
     estimatedDelivery = finalOrder.estimatedDelivery || "Standard Arrival",
     shippingFee = finalOrder.shippingFee || 0,
     itemsTotal = finalOrder.itemsTotal || 0,
     discountTotal = finalOrder.discountTotal || 0,
  } = finalOrder;

  const buildImageUrl = (path) => {
      if (!path) return "https://via.placeholder.com/60";
      if (path.startsWith('http')) return path;
      return `${API_BASE}/${path.startsWith('/') ? path.slice(1) : path}`;
  };

  return (
    <div className="os-wrapper">
      <div className="os-card">
        <div className="os-success-icon">
          <Check size={24} strokeWidth={3} />
        </div>
        
        <h1 className="os-title">Order Secured.</h1>
        <p className="os-subtitle">We've received your request and are preparing your collection for delivery. ID: #{orderId}</p>

        {discountTotal > 0 && (
            <div className="os-savings-badge">
                <span></span>
                You saved Rs. {discountTotal.toLocaleString()} on this order!
            </div>
        )}

        <div className="os-grid">
            <div className="os-details">
                <div className="os-section">
                    <h3>Delivery Details</h3>
                    <div className="os-info-box">
                        <p className="os-label">Shipping To</p>
                        <p className="os-value">{shippingAddress}</p>
                        <div style={{ height: '1px', background: '#e5e7eb', margin: '16px 0' }}></div>
                        <p className="os-label">Estimated Delivery</p>
                        <p className="os-value">{estimatedDelivery}</p>
                    </div>
                </div>

                <div className="os-section" style={{ marginTop: '32px' }}>
                   <h3>Your Items ({items.length})</h3>
                   <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {items.map((item, idx) => (
                          <div key={idx} className="os-item">
                             <img src={buildImageUrl(item.imagePath || item.image)} alt="" className="os-item-img" />
                             <div className="os-item-info">
                                 <h4>{item.productName || item.name}</h4>
                                 <p>Quantity: {item.quantity}</p>
                             </div>
                             <div className="os-item-price">Rs. {(item.lineTotal || (item.unitPrice * item.quantity) || 0).toLocaleString()}</div>
                          </div>
                      ))}
                   </div>
                </div>
            </div>

            <div className="os-sidebar">
                <div className="os-summary-box">
                    <h3>Statement</h3>
                    <div className="os-row"><span>Subtotal</span><span>Rs. {itemsTotal.toLocaleString()}</span></div>
                    {discountTotal > 0 && (
                        <div className="os-row" style={{ color: '#fff', opacity: 1 }}>
                            <span style={{ fontWeight: 700 }}>Discount</span>
                            <span style={{ fontWeight: 700 }}>-Rs. {discountTotal.toLocaleString()}</span>
                        </div>
                    )}
                    <div className="os-row"><span>Logistics</span><span>{shippingFee === 0 ? "Free" : `Rs. ${shippingFee.toLocaleString()}`}</span></div>
                    <div className="os-row total"><span>Total</span><span>Rs. {grandTotal.toLocaleString()}</span></div>
                    <p className="os-payment-note">
                      Charged via {
                        paymentMethod === 'ESEWA' ? 'eSewa (Online)' : 
                        
                        paymentMethod === 'COD' ? 'Cash on Delivery' : 
                        paymentMethod
                      }
                    </p>
                </div>

                <Link to="/" className="os-btn primary">Continue Exploring</Link>
                <Link to="/customer/dashboard?tab=orders" className="os-btn secondary">View My Orders</Link>
            </div>
        </div>
      </div>
    </div>
  );
}

export default OrderSuccess;
