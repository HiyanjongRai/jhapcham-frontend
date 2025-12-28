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
import { 
  User, 
  MapPin, 
  Truck, 
  CreditCard, 
  FileText, 
  CheckCircle,
  ShieldCheck,
  Wallet,
  Banknote
} from "lucide-react";


function CheckoutPage() {
  const navigate = useNavigate();
  const userId = getCurrentUserId();

  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [previewData, setPreviewData] = useState(null); // Calculated totals from backend

  // Form State - Enhanced with structured address
  const [formData, setFormData] = useState({
    // Personal Information
    fullName: "",
    email: "",
    phone: "",
    alternativePhone: "",
    
    // Structured Address Fields
    streetAddress: "",
    landmark: "",
    city: "",
    district: "",
    postalCode: "",
    
    // Delivery & Order
    deliveryTimePreference: "Any Time",
    orderNote: ""
  });

  // Inside Valley State
  const [insideValley, setInsideValley] = useState(true);

  // Payment Method
  const [paymentMethod, setPaymentMethod] = useState("COD");

  // Terms & Conditions
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  // Save Address for Future (only for logged-in users)
  const [saveAddress, setSaveAddress] = useState(false);

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
        // Note: If user has old 'address' format, it stays in old format
        // New users will use structured fields
      }));
    } catch (e) {
      console.error("User load error:", e);
    }
  };

  // ...
  const [success, setSuccess] = useState(false);

  // ...

  const placeOrder = async () => {
    // Cart validation
    if (!items || items.length === 0) {
        setError({
          status: 400,
          message: "Empty Cart",
          details: "Your cart is empty. Please add items before checking out.",
          timestamp: new Date().toISOString()
        });
        return;
    }

    // Enhanced validation
    if (!formData.fullName || !formData.phone) {
        setError({
          status: 400,
          message: "Missing Information",
          details: "Please fill in your name and phone number",
          timestamp: new Date().toISOString()
        });
        return;
    }

    if (!formData.streetAddress || !formData.city) {
        setError({
          status: 400,
          message: "Incomplete Address",
          details: "Please provide at least street address and city",
          timestamp: new Date().toISOString()
        });
        return;
    }

    if (!acceptedTerms) {
        setError({
          status: 400,
          message: "Terms Required",
          details: "Please accept the Terms & Conditions to proceed",
          timestamp: new Date().toISOString()
        });
        return;
    }

    // Construct full address from structured fields
    const fullAddress = [
      formData.streetAddress,
      formData.landmark && `(${formData.landmark})`,
      formData.city,
      formData.district && formData.district !== formData.city ? formData.district : null,
      formData.postalCode
    ].filter(Boolean).join(', ');

    // Prepare Base Request Data
    const requestData = {
        userId: userId || null,
        fullName: formData.fullName,
        phone: formData.phone,
        email: formData.email,
        address: fullAddress,  // Constructed from structured fields
        shippingLocation: insideValley ? "INSIDE" : "OUTSIDE",
        paymentMethod: paymentMethod === "WALLET" ? "ONLINE" : "COD",
        alternativePhone: formData.alternativePhone || null,
        deliveryTimePreference: formData.deliveryTimePreference || "Any Time",
        orderNote: formData.orderNote || null
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
      
      console.log('Order placed successfully! Backend response:', orderSummary);
      
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

      {/* Premium Success Modal */}
      {success && (
        <div style={{
          position: 'fixed', 
          top: 0, 
          left: 0, 
          width: '100%', 
          height: '100%',
          backgroundColor: 'rgba(15, 23, 42, 0.8)',
          backdropFilter: 'blur(8px)',
          zIndex: 9999,
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center',
          animation: 'fadeIn 0.3s ease-out'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '24px',
            padding: '3rem 2.5rem',
            maxWidth: '480px',
            width: '90%',
            textAlign: 'center',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            animation: 'scaleIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
          }}>
            {/* Success Icon */}
            <div style={{
              width: '80px',
              height: '80px',
              margin: '0 auto 1.5rem',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '3rem',
              animation: 'bounceIn 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
              boxShadow: '0 8px 20px rgba(16, 185, 129, 0.4)'
            }}>
              🎉
            </div>

            {/* Title */}
            <h2 style={{
              fontSize: '2rem',
              fontWeight: '800',
              color: '#0f172a',
              margin: '0 0 0.75rem 0',
              letterSpacing: '-0.02em'
            }}>
              Order Successfully Created!
            </h2>

            {/* Subtitle */}
            <p style={{
              fontSize: '1.05rem',
              color: '#64748b',
              margin: '0 0 2rem 0',
              lineHeight: '1.6'
            }}>
              Thank you for your purchase! Redirecting you to order summary...
            </p>

            {/* Loading Spinner */}
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 24px',
              background: '#f8fafc',
              borderRadius: '12px'
            }}>
              <div style={{
                width: '16px',
                height: '16px',
                border: '3px solid #e2e8f0',
                borderTop: '3px solid #10b981',
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite'
              }}></div>
              <span style={{
                fontSize: '0.9rem',
                fontWeight: '600',
                color: '#475569'
              }}>
                Preparing your summary...
              </span>
            </div>
          </div>

          {/* CSS Animations */}
          <style>{`
            @keyframes fadeIn {
              from { opacity: 0; }
              to { opacity: 1; }
            }
            @keyframes scaleIn {
              from {
                transform: scale(0.8);
                opacity: 0;
              }
              to {
                transform: scale(1);
                opacity: 1;
              }
            }
            @keyframes bounceIn {
              0% {
                transform: scale(0);
                opacity: 0;
              }
              50% {
                transform: scale(1.1);
              }
              100% {
                transform: scale(1);
                opacity: 1;
              }
            }
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      )}

      <div className="checkout-container">


      {/* LEFT SIDE */}
      <div className="checkout-left">

        {/* Customer Information */}
        <div className="checkout-section">
          <h3 className="section-title">
            <User className="icon-lucide" /> Customer Details
          </h3>

          <div className="form-field">
            <label>Full Name *</label>
            <input 
              type="text" 
              value={formData.fullName} 
              onChange={e => setFormData({...formData, fullName: e.target.value})}
              placeholder="Enter your full name"
              required
            />
          </div>

          <div className="form-row">
            <div className="form-field">
              <label>Email Address *</label>
              <input 
                type="email" 
                value={formData.email} 
                onChange={e => setFormData({...formData, email: e.target.value})}
                placeholder="name@example.com"
              />
            </div>

            <div className="form-field">
              <label>Phone Number *</label>
              <input 
                type="text" 
                value={formData.phone} 
                onChange={e => setFormData({...formData, phone: e.target.value})}
                placeholder="98XXXXXXXX"
                required
              />
            </div>
          </div>

          <div className="form-field">
            <label>Alternative Phone (Optional)</label>
            <input 
              type="text" 
              value={formData.alternativePhone} 
              onChange={e => setFormData({...formData, alternativePhone: e.target.value})}
              placeholder="Backup contact number"
            />
          </div>
        </div>

        {/* Delivery Address - Structured */}
        <div className="checkout-section">
          <h3 className="section-title">
            <MapPin className="icon-lucide" /> Delivery Address
          </h3>

          <div className="form-field">
            <label>Street Address *</label>
            <input
              type="text"
              value={formData.streetAddress}
              onChange={(e) => setFormData({ ...formData, streetAddress: e.target.value })}
              placeholder="House No. 45, Thamel Marg"
              required
            />
          </div>

          <div className="form-field">
            <label>Landmark (Recommended for Nepal)</label>
            <input
              type="text"
              value={formData.landmark}
              onChange={(e) => setFormData({ ...formData, landmark: e.target.value })}
              placeholder="Near Mandala Theater, Opposite Pumpernickel Bakery"
            />
            <small style={{ color: '#666', fontSize: '0.85em', marginTop: '4px' }}>
              Helps delivery personnel find your location easily
            </small>
          </div>

          <div className="form-row">
            <div className="form-field">
              <label>City *</label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                placeholder="Kathmandu"
                required
              />
            </div>

            <div className="form-field">
              <label>District</label>
              <input
                type="text"
                value={formData.district}
                onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                placeholder="Kathmandu"
              />
            </div>
          </div>

          <div className="form-field">
            <label>Postal Code (Optional)</label>
            <input
              type="text"
              value={formData.postalCode}
              onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
              placeholder="44600"
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

          {userId && (
            <div className="shipping-option" style={{ marginTop: '0.5rem' }}>
              <input
                type="checkbox"
                id="saveAddress"
                checked={saveAddress}
                onChange={(e) => setSaveAddress(e.target.checked)}
                style={{ width: "auto", marginRight: "10px" }}
              />
              <label htmlFor="saveAddress">
                <strong>Save this address for future orders</strong>
              </label>
            </div>
          )}
        </div>

        {/* Delivery Preferences */}
        <div className="checkout-section">
          <h3 className="section-title">
            <Truck className="icon-lucide" /> Delivery Preferences
          </h3>

          <div className="form-field">
            <label>Preferred Delivery Time</label>
            <select
              value={formData.deliveryTimePreference}
              onChange={(e) => setFormData({ ...formData, deliveryTimePreference: e.target.value })}
              style={{ 
                width: "100%", 
                padding: "14px 16px", 
                borderRadius: "10px", 
                border: "2px solid #e0e0e0",
                fontSize: "15px",
                background: "#fafafa"
              }}
            >
              <option value="Any Time">Any Time</option>
              <option value="Morning (9 AM - 12 PM)">Morning (9 AM - 12 PM)</option>
              <option value="Afternoon (12 PM - 4 PM)">Afternoon (12 PM - 4 PM)</option>
              <option value="Evening (4 PM - 8 PM)">Evening (4 PM - 8 PM)</option>
            </select>
          </div>
        </div>

        {/* Payment Method */}
        <div className="checkout-section">
          <h3 className="section-title">
            <CreditCard className="icon-lucide" /> Payment Method
          </h3>

          <div className="payment-grid">
            <div 
              className={`payment-card ${paymentMethod === "COD" ? "active" : ""}`}
              onClick={() => setPaymentMethod("COD")}
            >
              <div className="payment-icon-wrapper">
                <Banknote size={24} />
              </div>
              <div className="payment-info">
                <strong>Cash on Delivery (COD)</strong>
                <span>Pay when you receive your order</span>
              </div>
              <div className="payment-radio">
                {paymentMethod === "COD" && <div className="payment-radio-inner" />}
              </div>
            </div>

            <div 
              className={`payment-card ${paymentMethod === "WALLET" ? "active" : ""}`}
              onClick={() => setPaymentMethod("WALLET")}
            >
              <div className="payment-icon-wrapper">
                <Wallet size={24} />
              </div>
              <div className="payment-info">
                <strong>Digital Wallet</strong>
                <span>Pay with Khalti / Esewa (Coming Soon)</span>
              </div>
              <div className="payment-radio">
                {paymentMethod === "WALLET" && <div className="payment-radio-inner" />}
              </div>
            </div>
          </div>
        </div>

        {/* Order Note */}
        <div className="checkout-section">
          <h3 className="section-title">
            <FileText className="icon-lucide" /> Order Note (Optional)
          </h3>
          <div className="form-field">
            <textarea
              style={{ width: "100%", padding: "14px 16px", borderRadius: "10px", border: "2px solid #e0e0e0", minHeight: "80px", fontFamily: 'inherit', background: "#fafafa" }}
              placeholder="Any special instructions for delivery..."
              value={formData.orderNote}
              onChange={(e) => setFormData({...formData, orderNote: e.target.value})}
            />
          </div>
        </div>

        {/* Terms & Conditions */}
        <div className="checkout-section" style={{ background: '#f8fafc', border: '2px solid #e0e0e0' }}>
          <div className="shipping-option" style={{ margin: 0, background: 'transparent', border: 'none' }}>
            <input
              type="checkbox"
              id="acceptTerms"
              checked={acceptedTerms}
              onChange={(e) => setAcceptedTerms(e.target.checked)}
              style={{ width: "auto", marginRight: "10px" }}
              required
            />
            <label htmlFor="acceptTerms">
              <strong>I accept the <a href="/terms" target="_blank" style={{ color: '#1e293b', textDecoration: 'underline' }}>Terms & Conditions</a> and <a href="/privacy" target="_blank" style={{ color: '#1e293b', textDecoration: 'underline' }}>Privacy Policy</a></strong>
            </label>
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
    Rs. {(item.unitPrice || 0).toFixed(2)}
  </div>
</div>


              <div className="summary-line">Rs. {(item.lineTotal || 0).toFixed(2)}</div>
            </div>
          ))}

          <hr />

          <div className="summary-row">
            <span>Subtotal</span>
            <span>Rs. {(previewData ? (previewData.itemsTotal || 0) : (total || 0)).toFixed(2)}</span>
          </div>

          <div className="summary-row">
            <span>Shipping</span>
            <span>
                {previewData 
                  ? (previewData.shippingFee === 0 ? "Free Shipping" : `Rs. ${(previewData.shippingFee || 0).toFixed(2)}`)
                  : "Calculating..."}
            </span>
          </div>

          {previewData && previewData.discountTotal > 0 && (
             <div className="summary-row" style={{ color: '#10b981' }}>
                <span>Discount</span>
                <span>- Rs. {(previewData.discountTotal || 0).toFixed(2)}</span>
             </div>
          )}

          <div className="summary-row total">
            <strong>Grand Total</strong>
            <strong>
              Rs. {(previewData ? (previewData.grandTotal || 0) : (total || 0)).toFixed(2)}
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