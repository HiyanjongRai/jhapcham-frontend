import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  getCurrentUserId,
  apiGetCart,
  apiPlaceOrder,
  apiPlaceOrderFromCart,
  apiPreviewOrder, // Add this
} from "../AddCart/cartUtils";
import { apiGetAddresses } from "../Customer/addressUtils";
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
  Banknote,
  Navigation,
  Lock,
  RefreshCcw,
  Package,
  ChevronLeft
} from "lucide-react";


function CheckoutPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const userId = getCurrentUserId();

  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [previewData, setPreviewData] = useState(null); // Calculated totals from backend
  const [savedAddresses, setSavedAddresses] = useState([]); // User's saved addresses

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

  // Initialize from navigation state if available
  useEffect(() => {
    if (location.state?.preselectedZone) {
      setInsideValley(location.state.preselectedZone === 'INSIDE');
    }
  }, [location.state]);

  // Payment Method
  const [paymentMethod, setPaymentMethod] = useState("COD");

  // Terms & Conditions
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  // Save Address for Future (only for logged-in users)
  const [saveAddress, setSaveAddress] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeStep, setActiveStep] = useState(1);


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
        shippingLocation: insideValley ? "INSIDE" : "OUTSIDE",
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
      }));

      // Load Saved Addresses
      try {
          const addrs = await apiGetAddresses(userId);
          if (Array.isArray(addrs)) {
            setSavedAddresses(addrs);
            // Pre-fill with default if available
            const def = addrs.find(a => a.isDefault);
            if (def) {
                setFormData(prev => ({
                    ...prev,
                    streetAddress: def.street, // Mapped
                    city: def.city,
                    district: def.state, // Using state as district for now
                    landmark: def.landMark || "",
                    postalCode: "", // Add if backend supports
                    phone: def.receiverPhone || prev.phone
                }));
            }
          }
      } catch (err) {
          console.warn("Failed to load addresses", err);
      }

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
        paymentMethod: paymentMethod, // Will be "ESEWA" or "COD"
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

      // === eSewa Specific Logic ===
      if (paymentMethod === "ESEWA") {
         try {
             // 1. Initiate at Backend to get Signature
             // orderSummary can be an object or an array of objects (if split orders)
             const oid = Array.isArray(orderSummary) ? orderSummary[0].orderId : orderSummary.orderId;
             
             const initRes = await api.post('/api/payment/initiate/esewa', { orderId: oid });
             const esewaConfig = initRes.data; // contains signature, signedFieldNames, etc.

             // 2. Auto Submit Form
             var form = document.createElement("form");
             form.setAttribute("method", "POST");
             form.setAttribute("action", esewaConfig.gatewayUrl);

             // Map all config to hidden fields
             // Key fields: amount, tax_amount, total_amount, transaction_uuid, product_code, product_service_charge, product_delivery_charge, success_url, failure_url, signed_field_names, signature
             const fields = {
                 amount: esewaConfig.amount,
                 tax_amount: esewaConfig.taxAmount,
                 total_amount: esewaConfig.totalAmount,
                 transaction_uuid: esewaConfig.transactionUuid,
                 product_code: esewaConfig.productCode,
                 product_service_charge: esewaConfig.productServiceCharge,
                 product_delivery_charge: esewaConfig.productDeliveryCharge,
                 success_url: esewaConfig.successUrl,
                 failure_url: esewaConfig.failureUrl,
                 signed_field_names: esewaConfig.signedFieldNames,
                 signature: esewaConfig.signature
             };

             for (var key in fields) {
                 var hiddenField = document.createElement("input");
                 hiddenField.setAttribute("type", "hidden");
                 hiddenField.setAttribute("name", key);
                 hiddenField.setAttribute("value", fields[key]);
                 form.appendChild(hiddenField);
             }

             document.body.appendChild(form);
             form.submit();
             return; 

         } catch (e) {
             console.error("Failed to initiate eSewa", e);
             setError({
                 status: 500,
                 message: "eSewa Initiation Failed",
                 details: "Could not connect to payment gateway."
             });
             setLoading(false);
             return;
         }
      }

      // === Khalti Specific Logic ===
      if (paymentMethod === "KHALTI") {
          try {
              // orderingSummary is list or obj logic
              const oid = Array.isArray(orderSummary) ? orderSummary[0].orderId : orderSummary.orderId;

              // 1. Initiate at Backend
              const initRes = await api.post('/api/payment/initiate/khalti', { orderId: oid });
              const { pidx, payment_url } = initRes.data;

              // 2. Redirect to Payment URL
              if (payment_url) {
                  window.location.href = payment_url;
                  return;
              } else {
                  throw new Error("No payment URL received");
              }
          } catch (e) {
             console.error("Failed to initiate Khalti", e);
             setError({
                 status: 500,
                 message: "Khalti Initiation Failed",
                 details: "Could not connect to payment gateway."
             });
             setLoading(false);
             return;
          }
      }

      setLoading(false);
      setSuccess(true);
      
      console.log('Order placed successfully! Backend response:', orderSummary);

      // Save address if requested
      if (userId && saveAddress) {
          try {
              // Only save if it's a new address (simple check)
              const existing = savedAddresses.find(a => 
                  a.street === formData.streetAddress && a.city === formData.city
              );
              
              if (!existing) {
                  await import("../Customer/addressUtils").then(m => m.apiAddAddress(userId, {
                      label: "New Address",
                      receiverName: formData.fullName,
                      receiverPhone: formData.phone,
                      city: formData.city,
                      state: formData.district || formData.city, // fallback
                      street: formData.streetAddress,
                      landMark: formData.landmark || "",
                      fullAddress: fullAddress,
                      isDefault: false
                  }));
              }
          } catch (e) {
              console.warn("Failed to auto-save address", e);
          }
      }
      
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

  const nextStep = () => {
    if (activeStep === 1) {
      if (!formData.fullName || !formData.phone) {
        setError({
          status: 400,
          message: "Missing Information",
          details: "Please fill in your name and phone number",
          timestamp: new Date().toISOString()
        });
        return;
      }
      setActiveStep(2);
    } else if (activeStep === 2) {
      if (!formData.streetAddress || !formData.city) {
        setError({
          status: 400,
          message: "Incomplete Address",
          details: "Please provide at least street address and city",
          timestamp: new Date().toISOString()
        });
        return;
      }
      setActiveStep(3);
    }
  };

  const prevStep = () => {
    setActiveStep(prev => Math.max(prev - 1, 1));
  };


  return (
    <>
      {/* Error Toast Notification */}
      <ErrorToast error={error} onClose={() => setError(null)} />

      {/* Premium Success Modal */}
      {success && (
        <div className="success-overlay">
          <div className="success-modal">
            <div className="success-icon-wrap">
              🎉
            </div>

            <h2>Order Successfully Created!</h2>

            <p>
              Thank you for your purchase! Redirecting you to order summary...
            </p>

            <div className="success-loader">
              <div className="loader-spinner"></div>
              <span>Preparing your summary...</span>
            </div>
          </div>
        </div>
      )}

      <div className="checkout-outer-container">
        {/* PROGRESS STEPPER */}
        <div className="checkout-stepper-wrapper">
          <div className="checkout-stepper">
            <div className={`step ${activeStep >= 1 ? "active" : ""} ${activeStep > 1 ? "complete" : ""}`}>
              <div className="step-circle">{activeStep > 1 ? <CheckCircle size={20} /> : "1"}</div>
              <span className="step-label">Information</span>
            </div>
            <div className={`step ${activeStep >= 2 ? "active" : ""} ${activeStep > 2 ? "complete" : ""}`}>
              <div className="step-circle">{activeStep > 2 ? <CheckCircle size={20} /> : "2"}</div>
              <span className="step-label">Shipping</span>
            </div>
            <div className={`step ${activeStep >= 3 ? "active" : ""} ${activeStep > 3 ? "complete" : ""}`}>
              <div className="step-circle">{activeStep > 3 ? <CheckCircle size={20} /> : "3"}</div>
              <span className="step-label">Payment</span>
            </div>
          </div>
        </div>

        <div className="checkout-container">
          {/* LEFT SIDE */}
          <div className="checkout-left">
            <div className="back-to-cart" onClick={() => navigate("/cart")}>
              <ChevronLeft size={18} />
              <span>Back to Shopping</span>
            </div>

            {/* STEP 1: INFORMATION */}
            {activeStep === 1 && (
              <div className="checkout-section-group fade-in">
                <div className="checkout-section">
                  <h3 className="section-title">
                    <span className="section-number">01</span>
                    Customer Details
                  </h3>

                  <div className="form-field">
                    <label>Full Name</label>
                    <input 
                      type="text" 
                      value={formData.fullName} 
                      onChange={e => setFormData({...formData, fullName: e.target.value})}
                      placeholder="Your full name"
                      required
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
                        required
                      />
                    </div>
                  </div>

                  <div className="form-field">
                    <label>Alternative Phone</label>
                    <input 
                      type="text" 
                      value={formData.alternativePhone} 
                      onChange={e => setFormData({...formData, alternativePhone: e.target.value})}
                      placeholder="Secondary number"
                    />
                  </div>
                </div>

                <div className="step-controls">
                  <button onClick={nextStep} className="continue-btn">
                    Continue to Shipping
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: SHIPPING */}
            {activeStep === 2 && (
              <div className="checkout-section-group fade-in">
                <div className="checkout-section">
                  <h3 className="section-title">
                    <span className="section-number">02</span>
                    Delivery Address
                  </h3>

                  {savedAddresses.length > 0 && (
                      <div className="saved-addr-list" style={{ marginBottom: '1.5rem' }}>
                          <label style={{display:'block', marginBottom:'0.5rem', fontWeight:'600'}}>Saved Addresses</label>
                          <div style={{display:'flex', gap:'1rem', overflowX:'auto', paddingBottom:'0.5rem'}}>
                             {savedAddresses.map(addr => (
                                 <div 
                                    key={addr.id} 
                                    onClick={() => setFormData(prev => ({
                                        ...prev,
                                        streetAddress: addr.street,
                                        city: addr.city,
                                        district: addr.state,
                                        landmark: addr.landMark || "",
                                        phone: addr.receiverPhone || prev.phone
                                    }))}
                                    style={{
                                        minWidth:'200px', 
                                        padding:'1rem', 
                                        border: formData.streetAddress === addr.street ? '2px solid #000' : '1px solid #ddd', 
                                        borderRadius:'8px', 
                                        cursor:'pointer',
                                        background: formData.streetAddress === addr.street ? '#fdfdfd' : '#fff'
                                    }}
                                 >
                                     <div style={{fontWeight:'700', fontSize:'0.9rem'}}>{addr.label}</div>
                                     <div style={{fontSize:'0.8rem', color:'#555', marginTop:'0.25rem'}}>
                                        {addr.receiverName}<br/>
                                        {addr.street}, {addr.city}
                                     </div>
                                 </div>
                             ))}
                          </div>
                          <div style={{textAlign:'center', marginTop:'0.5rem', fontSize:'0.8rem', color:'#666'}}>Or enter a new address below</div>
                      </div>
                  )}

                  <div className="form-field">
                    <label>Street Address</label>
                    <input
                      type="text"
                      value={formData.streetAddress}
                      onChange={(e) => setFormData({ ...formData, streetAddress: e.target.value })}
                      placeholder="House No. 45, Thamel Marg"
                      required
                    />
                  </div>

                  <div className="form-field">
                    <label>Landmark</label>
                    <input
                      type="text"
                      value={formData.landmark}
                      onChange={(e) => setFormData({ ...formData, landmark: e.target.value })}
                      placeholder="Near landmark"
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-field">
                      <label>City</label>
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
                    <label>Postal Code</label>
                    <input
                      type="text"
                      value={formData.postalCode}
                      onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                      placeholder="44600"
                    />
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
                        Save this address for future orders
                      </label>
                    </div>
                  )}
                </div>

                <div className="checkout-section">
                  <h3 className="section-title">
                    <span className="section-number">03</span>
                    Delivery Preferences
                  </h3>

                  <div className="form-field">
                    <label>Delivery Time</label>
                    <select
                      value={formData.deliveryTimePreference}
                      onChange={(e) => setFormData({ ...formData, deliveryTimePreference: e.target.value })}
                    >
                      <option value="Any Time">Any Time</option>
                      <option value="Morning (9 AM - 12 PM)">Morning (9 - 12)</option>
                      <option value="Afternoon (12 PM - 4 PM)">Afternoon (12 - 4)</option>
                      <option value="Evening (4 PM - 8 PM)">Evening (4 - 8)</option>
                    </select>
                  </div>
                </div>

                <div className="step-controls">
                  <button onClick={prevStep} className="back-btn-secondary">
                    Back to Information
                  </button>
                  <button onClick={nextStep} className="continue-btn">
                    Continue to Payment
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: PAYMENT */}
            {activeStep === 3 && (
              <div className="checkout-section-group fade-in">
                <div className="checkout-section">
                  <h3 className="section-title">
                    <span className="section-number">04</span>
                    Payment Method
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
                      <div className="payment-radio"></div>
                    </div>

                    <div 
                      className={`payment-card ${paymentMethod === "ESEWA" ? "active" : ""}`}
                      onClick={() => setPaymentMethod("ESEWA")}
                    >
                      <div className="payment-icon-wrapper" style={{ backgroundColor: '#60bb46', color: 'white' }}>
                        <Wallet size={24} />
                      </div>
                      <div className="payment-info">
                        <strong>eSewa</strong>
                        <span>Pay securely via eSewa</span>
                      </div>
                      <div className="payment-radio"></div>
                    </div>

                    <div 
                      className={`payment-card ${paymentMethod === "KHALTI" ? "active" : ""}`}
                      onClick={() => setPaymentMethod("KHALTI")}
                    >
                      <div className="payment-icon-wrapper" style={{ backgroundColor: '#5c2d91', color: 'white' }}>
                        <Wallet size={24} />
                      </div>
                      <div className="payment-info">
                        <strong>Khalti</strong>
                        <span>Pay securely via Khalti</span>
                      </div>
                      <div className="payment-radio"></div>
                    </div>
                  </div>
                </div>

                <div className="checkout-section">
                  <h3 className="section-title">
                    <span className="section-number">05</span>
                    Order Note
                  </h3>
                  <div className="form-field">
                    <textarea
                      placeholder="Any special instructions for delivery..."
                      value={formData.orderNote}
                      onChange={(e) => setFormData({...formData, orderNote: e.target.value})}
                      style={{ minHeight: "100px" }}
                    />
                  </div>
                </div>

                <div className="checkout-section" style={{ background: '#f8fafc' }}>
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
                      I accept the <a href="/terms" target="_blank" style={{ color: '#000', textDecoration: 'underline' }}>Terms & Conditions</a>
                    </label>
                  </div>
                </div>

                <div className="step-controls">
                  <button onClick={prevStep} className="back-btn-secondary">
                    Back to Shipping
                  </button>
                  <button
                    onClick={placeOrder}
                    className="continue-btn"
                    disabled={loading}
                  >
                    {loading ? "Processing..." : "Confirm & Place Order"}
                  </button>
                </div>
              </div>
            )}
          </div>

      {/* RIGHT SIDE – ORDER SUMMARY */}
      <div className="checkout-right">
        <div className="summary-box">
          <h3>Order Summary</h3>

          {/* Location Selector (Matching Cart Page Style) */}
          <div style={{
            background: '#f8fafc',
            padding: '16px',
            borderRadius: '12px',
            marginBottom: '20px',
            border: '1px solid #e2e8f0'
          }}>
            <div style={{
              fontSize: '14px',
              fontWeight: '600',
              color: '#334155',
              marginBottom: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <MapPin size={16} className="text-blue-600" />
              Delivery Location
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '8px'
            }}>
              <button
                onClick={() => setInsideValley(true)}
                className={insideValley ? "active-zone-btn" : "zone-btn"}
                style={{
                  padding: '10px',
                  background: insideValley 
                    ? '#000' 
                    : 'white',
                  color: insideValley ? 'white' : '#64748b',
                  border: insideValley ? '1px solid #000' : '1px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: insideValley 
                    ? '0 4px 6px -1px rgba(0, 0, 0, 0.1)' 
                    : 'none'
                }}
              >
                Inside Valley
              </button>
              <button
                onClick={() => setInsideValley(false)}
                className={!insideValley ? "active-zone-btn" : "zone-btn"}
                style={{
                  padding: '10px',
                  background: !insideValley 
                    ? '#000' 
                    : 'white',
                  color: !insideValley ? 'white' : '#64748b',
                  border: !insideValley ? '1px solid #000' : '1px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: !insideValley 
                    ? '0 4px 6px -1px rgba(0, 0, 0, 0.1)' 
                    : 'none'
                }}
              >
                Outside Valley
              </button>
            </div>
          </div>

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

  {/* Shipping Info Display */}
  <div style={{ fontSize: '11px', marginTop: '6px' }}>
    {item.freeShipping === true ? (
      <span style={{ color: '#166534', background: '#dcfce7', padding: '2px 6px', borderRadius: '4px', fontWeight: '600' }}>
        Free Shipping
      </span>
    ) : (
      <span style={{ color: '#64748b' }}>
        Shipping: Rs. {(insideValley ? item.insideValleyShipping : item.outsideValleyShipping) || 0}
      </span>
    )}
  </div>

  <div className="summary-item-price">
    Rs. {(item.unitPrice || 0).toFixed(2)}
  </div>
</div>


              <div className="summary-line">Rs. {(item.lineTotal || 0).toFixed(2)}</div>
            </div>
          ))}

          <div className="coupon-area">
            <input type="text" placeholder="Promo code" className="coupon-input" />
            <button className="coupon-btn">Apply</button>
          </div>

          <hr style={{ border: 'none', borderTop: '2px solid #f3f4f6', margin: '32px 0' }} />

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
          
          <div style={{ 
            fontSize: '0.85em', 
            color: '#64748b', 
            marginTop: '2rem', 
            padding: '16px',
            background: '#f8fafc',
            borderRadius: '12px',
            textAlign: 'center',
            border: '1px solid #f1f5f9'
          }}>
            {previewData && previewData.estimatedDelivery ? (
                 <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    <Truck size={14} />
                    <span>Estimated Delivery: <strong>{previewData.estimatedDelivery}</strong></span>
                 </div>
            ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    <ShieldCheck size={14} />
                    <span>Secure Checkout • SSL Encrypted</span>
                </div>
            )}
          </div>

          <div className="trust-badges">
            <div className="badge-item">
              <Lock size={16} />
              <span>Secure Pay</span>
            </div>
            <div className="badge-item">
              <RefreshCcw size={16} />
              <span>Easy Returns</span>
            </div>
            <div className="badge-item">
              <Package size={16} />
              <span>Quality Assured</span>
            </div>
          </div> {/* trust-badges */}
        </div> {/* summary-box */}
      </div> {/* checkout-right */}
    </div> {/* checkout-container */}
  </div> {/* checkout-outer-container */}
</>
  );
}

export default CheckoutPage;