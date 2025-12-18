import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import './OrderSuccess.css'; // We'll create this CSS file

function OrderSuccess() {
  const location = useLocation();
  const { session } = location.state || {};

  if (!session) {
    return (
      <div className="order-success-container">
        <h1>Order Placed!</h1>
        <p>Your order has been successfully placed.</p>
        <Link to="/" className="continue-btn" style={{ width: '200px', display: 'inline-block', textAlign: 'center' }}>
          Continue Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="order-success-container">
      <div className="success-icon">🎉</div>
      <h1>Order Confirmed!</h1>
      <p className="order-id">Order ID: #{session.orderId || session.id}</p>
      <p className="success-message">
        Thank you for your purchase via {session.paymentMethod || 'COD'}.
      </p>

      <div className="order-details-card">
        <h3>Order Details</h3>
        
        <div className="order-items-list">
          {(session.items || []).map((item, idx) => (
            <div key={item.id || idx} className="order-item-row">
              <div className="item-info">
                <strong>{item.product?.name || item.productName || "Unknown Product"}</strong>
                <div className="item-meta">
                  <span>Qty: {item.quantity}</span>
                </div>
              </div>
              <div className="item-price">
                 Rs. {(item.unitPrice * item.quantity).toFixed(2)}
              </div>
            </div>
          ))}
        </div>

        <div className="order-summary-section">
          <div className="summary-row">
            <span>Subtotal</span>
            <span>Rs. {(session.totalPrice || 0).toFixed(2)}</span>
          </div>
          <div className="summary-row">
            <span>Shipping Fee</span>
            <span>Rs. 0.00</span> 
          </div>
          <hr />
          <div className="summary-row total">
            <span>Grand Total</span>
            <span>Rs. {(session.totalPrice || 0).toFixed(2)}</span>
          </div>
        </div>

        <div className="shipping-info-section">
            <h4>Shipping To:</h4>
            <p style={{ whiteSpace: 'pre-line' }}>{session.deliveryAddress?.fullAddress || session.shippingAddress || session.fullAddress || "N/A"}</p>
        </div>
      </div>

      <Link to="/" className="continue-btn" style={{ marginTop: '20px', textDecoration: 'none' }}>
        Continue Shopping
      </Link>
    </div>
  );
}

export default OrderSuccess;

