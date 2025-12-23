import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getCurrentUserId,
  apiGetCart,
  apiPlaceOrder,
  apiPlaceOrderFromCart,
  apiPreviewOrder, // Add this
} from "../AddCart/cartUtils";
import api from "../../api/axios";
import { API_BASE } from "../config/config";
import ErrorToast from "../ErrorToast/ErrorToast";
import "./CheckoutPage.css";


function CheckoutPage() {
  const navigate = useNavigate();
  const userId = getCurrentUserId();

  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [previewData, setPreviewData] = useState(null); // Calculated totals from backend

  // Form State
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    address: "",
    orderNote: ""
  });

  // Inside Valley State
  const [insideValley, setInsideValley] = useState(true);

  // Payment Method
  const [paymentMethod, setPaymentMethod] = useState("COD");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);


  useEffect(() => {
    if (!userId) return;

    loadCart();
    loadUser();
  }, [userId]);

  // Trigger preview when dependencies change
  useEffect(() => {
    if (items.length > 0) {
      fetchPreview();
    }
  }, [items, insideValley, formData.address]); // Recalculate on items or location/address change

  const fetchPreview = async () => {
    try {
      const payload = {
        userId,
        deliveryZone: insideValley ? "INSIDE_VALLEY" : "OUTSIDE_VALLEY",
        items: items.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            color: item.selectedColor,
            storage: item.selectedStorage
        }))
      };

      const data = await apiPreviewOrder(payload);
      setPreviewData(data);
    } catch (e) {
      console.warn("Preview calculation failed", e);
    }
  };

  const loadCart = async () => {
    try {
      const data = await apiGetCart(userId);
      const mappedItems = (data.items || []).map(i => ({
        ...i,
        unitPrice: i.unitPrice || 0,
        lineTotal: i.lineTotal || 0,
        imagePath: i.imagePath,
        productName: i.name,
        selectedColor: i.selectedColor,
        selectedStorage: i.selectedStorage
      }));
      setItems(mappedItems);
      setTotal(data.subtotal || data.total || 0);
    } catch (e) {
      console.error("Cart load error:", e);
    }
  };

  const loadUser = async () => {
    try {
      const res = await api.get(`/api/users/${userId}`);
      const u = res.data;

      setFormData(prev => ({
        ...prev,
        fullName: u.fullName || "",
        email: u.email || "",
        phone: u.contactNumber || u.phone || "",
        address: u.address || ""
      }));
    } catch (e) {
      console.error("User load error:", e);
    }
  };

  // ...
  const [success, setSuccess] = useState(false);

  // ...

  const placeOrder = async () => {
    // Basic validation
    if (!formData.fullName || !formData.phone || !formData.address) {
        setError({
          status: 400,
          message: "Missing Information",
          details: "Please fill in all required fields (Name, Phone, Address)",
          timestamp: new Date().toISOString()
        });
        return;
    }

    // Prepare Base Request Data
    const requestData = {
        userId: userId || null,
        fullName: formData.fullName,
        phone: formData.phone,
        email: formData.email,
        address: formData.address,
        shippingLocation: insideValley ? "INSIDE" : "OUTSIDE",
        paymentMethod: paymentMethod === "WALLET" ? "ONLINE" : "COD",
    };

    try {
      setLoading(true);
      setError(null);

      let orderSummary;

      if (userId) {
          // WAY 2: Cart Checkout (Authenticated)
          // Backend fetches items from DB Cart
          orderSummary = await apiPlaceOrderFromCart(requestData);
      } else {
          // WAY 3: Guest Checkout (Direct)
          // Frontend sends items
          const guestRequest = {
            ...requestData,
            items: items.map(item => ({
                productId: item.productId,
                quantity: item.quantity,
                selectedColor: item.selectedColor,
                selectedStorage: item.selectedStorage
            }))
          };
          orderSummary = await apiPlaceOrder(guestRequest);
      }

      setLoading(false);
      setSuccess(true);
      
      // Delay navigation
      setTimeout(() => {
        // Pass the full order summary to success page
        navigate("/order-success", { state: { session: orderSummary, order: orderSummary } });
      }, 2000);

    } catch (e) {
      console.error("Order placement error:", e);
      setLoading(false);
      
      if (e.status) {
        setError(e);
      } else {
        setError({
          status: 500,
          message: "Order Failed",
          details: e.message || "An unexpected error occurred",
          timestamp: new Date().toISOString()
        });
      }
    }
  };


  return (
    <>
      {/* Error Toast Notification */}
      <ErrorToast error={error} onClose={() => setError(null)} />

      {success && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 9999,
          display: 'flex', justifyContent: 'center', alignItems: 'center',
          flexDirection: 'column', color: 'white'
        }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>✅</div>
          <h2 style={{ fontSize: '2rem', fontWeight: 'bold' }}>Order Successfully Created!</h2>
          <p>Redirecting you to summary...</p>
        </div>
      )}

      <div className="checkout-container">


      {/* LEFT SIDE */}
      <div className="checkout-left">

        {/* Customer Information */}
        <div className="checkout-section">
          <h3 className="section-title">
            <i className="icon">👤</i> Customer Details
          </h3>

          <div className="form-field">
            <label>Full Name</label>
            <input 
              type="text" 
              value={formData.fullName} 
              onChange={e => setFormData({...formData, fullName: e.target.value})}
              placeholder="Enter your full name"
            />
          </div>

          <div className="form-row">
            <div className="form-field">
              <label>Email Address</label>
              <input 
                type="email" 
                value={formData.email} 
                onChange={e => setFormData({...formData, email: e.target.value})}
                placeholder="name@example.com"
              />
            </div>

            <div className="form-field">
              <label>Phone Number</label>
              <input 
                type="text" 
                value={formData.phone} 
                onChange={e => setFormData({...formData, phone: e.target.value})}
                placeholder="98XXXXXXXX"
              />
            </div>
          </div>
        </div>

        {/* Delivery Address */}
        <div className="checkout-section">
          <h3 className="section-title">
            <i className="icon">📍</i> Delivery Address
          </h3>

          <div className="form-field">
            <textarea
              style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #bbb", minHeight: "60px", fontFamily: 'inherit' }}
              placeholder="e.g. House No. 123, Street Name, City"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            />
          </div>

          <div className="shipping-option" style={{ marginTop: '1rem' }}>
            <input
              type="checkbox"
              id="insideValley"
              checked={insideValley}
              onChange={(e) => setInsideValley(e.target.checked)}
              style={{ width: "auto", marginRight: "10px" }}
            />
            <label htmlFor="insideValley">
              <strong>Inside Kathmandu Valley?</strong> <br />
              <span style={{ fontSize: '0.9em', color: '#666' }}>Uncheck this if delivery is outside the valley.</span>
            </label>
          </div>
        </div>

        {/* Payment Method */}
        <div className="checkout-section">
          <h3 className="section-title">
            <i className="icon">💳</i> Payment Method
          </h3>

          <div className="shipping-option">
            <input
              type="radio"
              name="paymentMethod"
              checked={paymentMethod === "COD"}
              onChange={() => setPaymentMethod("COD")}
            />
            <label>
              <strong>Cash on Delivery (COD)</strong> <br />
              Pay when you receive your order
            </label>
          </div>

          <div className="shipping-option">
            <input
              type="radio"
              name="paymentMethod"
              checked={paymentMethod === "WALLET"}
              onChange={() => setPaymentMethod("WALLET")}
            />
            <label>
              <strong>Digital Wallet</strong> <br />
              Pay with Khalti / Esewa (Coming Soon)
            </label>
          </div>
        </div>

        {/* Order Note */}
        <div className="checkout-section">
          <h3 className="section-title">
            <i className="icon">📝</i> Order Note (Optional)
          </h3>
          <div className="form-field">
            <textarea
              style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #bbb", minHeight: "60px", fontFamily: 'inherit' }}
              placeholder="Any special instructions for delivery..."
              value={formData.orderNote}
              onChange={(e) => setFormData({...formData, orderNote: e.target.value})}
            />
          </div>
        </div>

        {/* Continue Button */}
        <button
          onClick={placeOrder}
          className="continue-btn"
          disabled={loading}
        >
          {loading ? "Processing..." : "Place Order"}
        </button>
      </div>

      {/* RIGHT SIDE – ORDER SUMMARY */}
      <div className="checkout-right">
        <div className="summary-box">
          <h3>Order Summary</h3>

          {(previewData?.items || items).map((item) => (
            <div className="summary-item" key={item.productId}>
              <img
                src={
                  item.imagePath
                    ? `${API_BASE}/${item.imagePath}`
                    : "https://via.placeholder.com/70"
                }
                alt=""
                className="summary-img"
              />

              <div className="summary-info">
  <div className="summary-item-name">{item.productName || item.name}</div>

  <div className="summary-item-details">
    <span>Qty: {item.quantity}</span>

    {item.selectedColor && (
      <span>Color: {item.selectedColor}</span>
    )}

    {item.selectedStorage && (
      <span>Storage: {item.selectedStorage}</span>
    )}

    {item.category && (
      <span>Category: {item.category}</span>
    )}

    {item.brand && (
      <span>Brand: {item.brand}</span>
    )}
  </div>

  <div className="summary-item-price">
    ${(item.unitPrice || 0).toFixed(2)}
  </div>
</div>


              <div className="summary-line">$ {(item.lineTotal || 0).toFixed(2)}</div>
            </div>
          ))}

          <hr />

          <div className="summary-row">
            <span>Subtotal</span>
            <span>$ {(previewData ? (previewData.itemsTotal || 0) : (total || 0)).toFixed(2)}</span>
          </div>

          <div className="summary-row">
            <span>Shipping</span>
            <span>
                {previewData 
                  ? (previewData.shippingFee === 0 ? "Free Shipping" : `$ ${(previewData.shippingFee || 0).toFixed(2)}`)
                  : "Calculating..."}
            </span>
          </div>

          {previewData && previewData.discountTotal > 0 && (
             <div className="summary-row" style={{ color: 'green' }}>
                <span>Discount</span>
                <span>- $ {(previewData.discountTotal || 0).toFixed(2)}</span>
             </div>
          )}

          <div className="summary-row total">
            <strong>Grand Total</strong>
            <strong>
              $ {(previewData ? (previewData.grandTotal || 0) : (total || 0)).toFixed(2)}
            </strong>
          </div>
          
          <div style={{ fontSize: '0.85em', color: '#666', marginTop: '1rem', textAlign: 'center' }}>
            {previewData && previewData.estimatedDelivery && (
                <p>Estimated Delivery: <strong>{previewData.estimatedDelivery}</strong></p>
            )}
          </div>
        </div>
      </div>
      </div>
    </>
  );
}

export default CheckoutPage;