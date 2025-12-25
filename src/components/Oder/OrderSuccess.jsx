import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import './OrderSuccess.css';

function OrderSuccess() {
  const location = useLocation();
  const { session } = location.state || {};

  console.log('Order Success - Full session data:', session);
  console.log('Order Success - Session keys:', session ? Object.keys(session) : 'No session');

  if (!session) {
    console.warn('No session data passed to OrderSuccess page!');
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

  // Extract data with extensive fallbacks
  const orderId = session.orderId || session.id || session.orderNumber || 'N/A';
  const items = session.items || session.orderItems || session.products || [];
  const itemsTotal = session.itemsTotal || session.subtotal || session.totalPrice || session.amount || 0;
  const shippingFee = session.shippingFee || session.shipping || session.deliveryCharge || 0;
  const grandTotal = session.grandTotal || session.total || session.finalAmount || (itemsTotal + shippingFee);
  const paymentMethod = session.paymentMethod || session.payment || 'COD';
  const shippingAddress = session.shippingAddress || session.deliveryAddress || session.address || session.customerAddress || 'N/A';
  
  console.log('Extracted data:', {
    orderId,
    itemsCount: items.length,
    itemsTotal,
    shippingFee,
    grandTotal,
    paymentMethod,
    shippingAddress
  });

  return (
    <div className="order-success-container">
      <div className="success-icon">🎉</div>
      <h1>Order Confirmed!</h1>
      <p className="order-id">Order ID: #{orderId}</p>
      <p className="success-message">
        Thank you for your purchase! Your order has been successfully placed via {paymentMethod}.
      </p>

      {session.estimatedDelivery && (
          <div style={{ marginTop: '30px', padding: '15px', backgroundColor: '#f0f9ff', borderRadius: '12px', textAlign: 'center', maxWidth: '400px', margin: '30px auto 0' }}>
            <span style={{ fontSize: '1em', color: '#0369a1', fontWeight: '500' }}>
              📦 Estimated Delivery: <strong>{session.estimatedDelivery}</strong>
            </span>
          </div>
      )}

      <Link to="/" className="continue-btn" style={{ marginTop: '20px', textDecoration: 'none' }}>
        Continue Shopping
      </Link>
    </div>
  );
}

export default OrderSuccess;
