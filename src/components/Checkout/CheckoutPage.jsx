import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  getCurrentUserId,
  apiGetCart,
  apiPlaceOrder,
  apiPlaceOrderFromCart,
  apiPreviewOrder,
} from "../AddCart/cartUtils";
import { apiGetAddresses } from "../Customer/addressUtils";
import api from "../../api/axios";
import { API_BASE } from "../config/config";
import ErrorToast from "../ErrorToast/ErrorToast";
import "./CheckoutPage.css";
import { 
  MapPin, 
  Truck, 
  CreditCard, 
  CheckCircle,
  Lock,
  RefreshCcw,
  Package,
  ChevronLeft,
  ArrowRight,
  ShieldCheck,
  ShoppingBag
} from "lucide-react";


function CheckoutPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const userId = getCurrentUserId();

  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [previewData, setPreviewData] = useState(null); 
  const [savedAddresses, setSavedAddresses] = useState([]); 

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    alternativePhone: "",
    streetAddress: "",
    landmark: "",
    city: "",
    district: "",
    postalCode: "",
    deliveryTimePreference: "Any Time",
    orderNote: ""
  });

  const [insideValley, setInsideValley] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState("COD");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [saveAddress, setSaveAddress] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeStep, setActiveStep] = useState(1);
  const [success, setSuccess] = useState(false);
  
  // Promo Code State
  const [promoCode, setPromoCode] = useState("");
  const [appliedPromo, setAppliedPromo] = useState("");

  useEffect(() => {
    if (location.state?.preselectedZone) {
      setInsideValley(location.state.preselectedZone === 'INSIDE');
    }
  }, [location.state]);

  useEffect(() => {
    if (!userId) return;
    loadCart();
    loadUser();
  }, [userId]);

  useEffect(() => {
    if (items.length > 0) {
      fetchPreview();
    }
  }, [items, insideValley, appliedPromo]);

  const fetchPreview = async () => {
    try {
      const payload = {
        userId,
        shippingLocation: insideValley ? "INSIDE" : "OUTSIDE",
        couponCode: appliedPromo || null,
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

  const handleApplyPromo = () => {
    if (!promoCode.trim()) return;
    setAppliedPromo(promoCode.trim());
  };

  const loadCart = async () => {
    try {
      const data = await apiGetCart(userId);
      const mappedItems = (data.items || []).map(i => ({
        ...i,
        unitPrice: i.price || i.unitPrice || 0,
        lineTotal: (i.price || i.unitPrice || 0) * (i.quantity || 1),
        imagePath: i.image || i.imagePath,
        productName: i.name || i.productName,
        selectedColor: i.selectedColor,
        selectedStorage: i.selectedStorage
      }));
      setItems(mappedItems);
      setTotal(data.subtotal || 0);
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

      try {
          const addrs = await apiGetAddresses(userId);
          if (Array.isArray(addrs)) {
            setSavedAddresses(addrs);
            const def = addrs.find(a => a.isDefault);
            if (def) {
                setFormData(prev => ({
                    ...prev,
                    streetAddress: def.street,
                    city: def.city,
                    district: def.state,
                    landmark: def.landMark || "",
                    phone: def.receiverPhone || prev.phone
                }));
            }
          }
      } catch (err) { console.warn("Failed to load addresses", err); }
    } catch (e) { console.error("User load error:", e); }
  };

  const placeOrder = async () => {
    if (!items || items.length === 0) {
        setError({ status: 400, message: "Empty Cart", details: "Please add items before checking out." });
        return;
    }
    if (!formData.fullName || !formData.phone || !formData.streetAddress || !formData.city) {
        setError({ status: 400, message: "Missing Information", details: "Please fill in all required fields." });
        return;
    }
    if (!acceptedTerms) {
        setError({ status: 400, message: "Terms Required", details: "Please accept the Terms & Conditions." });
        return;
    }

    const fullAddress = [
      formData.streetAddress,
      formData.landmark && `(${formData.landmark})`,
      formData.city,
      formData.district && formData.district !== formData.city ? formData.district : null,
      formData.postalCode
    ].filter(Boolean).join(', ');

    const requestData = {
        userId: userId || null,
        fullName: formData.fullName,
        phone: formData.phone,
        email: formData.email,
        address: fullAddress,
        shippingLocation: insideValley ? "INSIDE" : "OUTSIDE",
        paymentMethod: paymentMethod,
        alternativePhone: formData.alternativePhone || null,
        deliveryTimePreference: formData.deliveryTimePreference || "Any Time",
        orderNote: formData.orderNote || null,
        couponCode: appliedPromo || null
    };

    try {
      setLoading(true);
      setError(null);
      let orderSummary;

      if (userId) {
          orderSummary = await apiPlaceOrderFromCart(requestData);
      } else {
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

      if (paymentMethod === "ESEWA" || paymentMethod === "KHALTI") {
          const path = paymentMethod.toLowerCase();
          const oid = Array.isArray(orderSummary) ? orderSummary[0].orderId : orderSummary.orderId;
          const initRes = await api.post(`/api/payment/initiate/${path}`, { orderId: oid });
          if (initRes.data.payment_url || initRes.data.gatewayUrl) {
              window.location.href = initRes.data.payment_url || initRes.data.gatewayUrl;
              return;
          }
      }

      setLoading(false);
      setSuccess(true);
      
      if (userId && saveAddress) {
          try {
              const existing = savedAddresses.find(a => a.street === formData.streetAddress && a.city === formData.city);
              if (!existing) {
                  await import("../Customer/addressUtils").then(m => m.apiAddAddress(userId, {
                      label: "New Address",
                      receiverName: formData.fullName,
                      receiverPhone: formData.phone,
                      city: formData.city,
                      state: formData.district || formData.city,
                      street: formData.streetAddress,
                      landMark: formData.landmark || "",
                      fullAddress: fullAddress,
                      isDefault: false
                  }));
              }
          } catch (e) { console.warn("Failed to auto-save address", e); }
      }
      
      setTimeout(() => {
        navigate("/order-success", { state: { session: orderSummary, order: orderSummary } });
      }, 2000);

    } catch (e) {
      console.error("Order placement error:", e);
      setLoading(false);
      setError(e.status ? e : { status: 500, message: "Order Failed", details: e.message || "An unexpected error occurred" });
    }
  };

  const nextStep = () => {
    if (activeStep === 1 && (!formData.fullName || !formData.phone)) {
        setError({ status: 400, message: "Missing Information", details: "Please fill in your name and phone number" });
        return;
    }
    if (activeStep === 2 && (!formData.streetAddress || !formData.city)) {
        setError({ status: 400, message: "Incomplete Address", details: "Please provide street address and city" });
        return;
    }
    setActiveStep(prev => prev + 1);
  };

  return (
    <div className="checkout-outer-container">
      <ErrorToast error={error} onClose={() => setError(null)} />

      {success && (
        <div className="success-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(10px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
            <div style={{ width: '80px', height: '80px', background: '#f0fdf4', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#16a34a', marginBottom: '24px' }}>
                <CheckCircle size={40} />
            </div>
            <h2 style={{ fontFamily: 'Outfit', fontWeight: 800 }}>Order Secured</h2>
            <p style={{ color: '#6b7280' }}>Preparing your receipt...</p>
        </div>
      )}

      <div className="checkout-stepper-wrapper">
        <div className="checkout-stepper">
          <div className={`step ${activeStep >= 1 ? "active" : ""} ${activeStep > 1 ? "complete" : ""}`}>
            <div className="step-circle">{activeStep > 1 ? <CheckCircle size={18} /> : "1"}</div>
            <span className="step-label">Info</span>
          </div>
          <div className={`step ${activeStep >= 2 ? "active" : ""} ${activeStep > 2 ? "complete" : ""}`}>
            <div className="step-circle">{activeStep > 2 ? <CheckCircle size={18} /> : "2"}</div>
            <span className="step-label">Shipping</span>
          </div>
          <div className={`step ${activeStep >= 3 ? "active" : ""} ${activeStep > 3 ? "complete" : ""}`}>
            <div className="step-circle">{activeStep > 3 ? <CheckCircle size={18} /> : "3"}</div>
            <span className="step-label">Payment</span>
          </div>
        </div>
      </div>

      <div className="checkout-container">
        <div className="checkout-left">
          <div className="back-to-cart" onClick={() => navigate("/cart")} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '40px', fontWeight: '700', fontSize: '14px', color: '#666' }}>
            <ChevronLeft size={16} /> Back to Cart
          </div>

          {activeStep === 1 && (
            <div className="checkout-section fade-in">
              <h3 className="section-title"><span className="section-number">01</span> Customer Details</h3>
              <div className="form-field">
                <label>Full Name</label>
                <input type="text" value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} placeholder="Your full name" />
              </div>
              <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div className="form-field">
                  <label>Email Address</label>
                  <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="name@example.com" />
                </div>
                <div className="form-field">
                  <label>Phone Number</label>
                  <input type="text" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder="98XXXXXXXX" />
                </div>
              </div>
              <button onClick={nextStep} className="continue-btn" style={{ marginTop: '20px' }}>Continue to Shipping</button>
            </div>
          )}

          {activeStep === 2 && (
            <div className="checkout-section fade-in">
              <h3 className="section-title"><span className="section-number">02</span> Delivery Address</h3>
              
              {savedAddresses.length > 0 && (
                <div className="saved-addr-list" style={{ marginBottom: '40px' }}>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#999', textTransform: 'uppercase', marginBottom: '16px' }}>Saved Addresses</label>
                    <div style={{ display: 'flex', gap: '16px', overflowX: 'auto', paddingBottom: '16px' }}>
                       {savedAddresses.map(addr => (
                           <div key={addr.id} onClick={() => setFormData({...formData, streetAddress: addr.street, city: addr.city, district: addr.state, landmark: addr.landMark || "", phone: addr.receiverPhone || formData.phone})}
                              style={{ minWidth: '240px', padding: '24px', border: formData.streetAddress === addr.street ? '1px solid #000' : '1px solid #eee', borderRadius: '12px', cursor: 'pointer', background: formData.streetAddress === addr.street ? '#fafafa' : '#fff', transition: 'all 0.2s' }}>
                               <div style={{ fontWeight: '700', fontSize: '14px', marginBottom: '4px' }}>{addr.label}</div>
                               <div style={{ fontSize: '13px', color: '#666' }}>{addr.street}, {addr.city}</div>
                           </div>
                       ))}
                    </div>
                </div>
              )}

              <div className="form-field"><label>Street Address</label><input type="text" value={formData.streetAddress} onChange={e => setFormData({...formData, streetAddress: e.target.value})} placeholder="House No / Street Name" /></div>
              <div className="form-field"><label>Landmark</label><input type="text" value={formData.landmark} onChange={e => setFormData({...formData, landmark: e.target.value})} placeholder="Near Landmark (Optional)" /></div>
              <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div className="form-field"><label>City</label><input type="text" value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} placeholder="City" /></div>
                <div className="form-field"><label>District</label><input type="text" value={formData.district} onChange={e => setFormData({...formData, district: e.target.value})} placeholder="District" /></div>
              </div>
              <div className="step-controls">
                <button onClick={() => setActiveStep(1)} className="back-btn-secondary">Back</button>
                <button onClick={nextStep} className="continue-btn">Continue to Payment</button>
              </div>
            </div>
          )}

          {activeStep === 3 && (
            <div className="checkout-section fade-in">
              <h3 className="section-title"><span className="section-number">03</span> Payment Method</h3>
              <div className="payment-grid">
                {[
                  { id: "COD", name: "Cash on Delivery", desc: "Pay when you receive", icon: <Package size={20} /> },
                  { id: "ESEWA", name: "eSewa", desc: "Digital Payment Gateway", icon: <CreditCard size={20} /> },
                  { id: "KHALTI", name: "Khalti", desc: "Instant Online Pay", icon: <CreditCard size={20} /> }
                ].map(p => (
                  <div key={p.id} className={`payment-card ${paymentMethod === p.id ? "active" : ""}`} onClick={() => setPaymentMethod(p.id)}>
                    <div className="payment-icon-wrapper" style={{ width: '40px', height: '40px', background: '#fafafa', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{p.icon}</div>
                    <div className="payment-info"><strong>{p.name}</strong><span style={{ fontSize: '12px', color: '#999' }}>{p.desc}</span></div>
                    <div className="payment-radio"></div>
                  </div>
                ))}
              </div>
              <div className="form-field" style={{ marginTop: '40px' }}>
                <label>Order Note</label>
                <textarea value={formData.orderNote} onChange={e => setFormData({...formData, orderNote: e.target.value})} placeholder="Any special instructions?" style={{ minHeight: '100px' }}></textarea>
              </div>
              <div style={{ marginTop: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <input type="checkbox" id="terms" checked={acceptedTerms} onChange={e => setAcceptedTerms(e.target.checked)} style={{ width: '18px', height: '18px' }} />
                <label htmlFor="terms" style={{ fontWeight: '500', fontSize: '13px', color: '#666' }}>I accept the Terms and Conditions</label>
              </div>
              <div className="step-controls">
                <button onClick={() => setActiveStep(2)} className="back-btn-secondary">Back</button>
                <button onClick={placeOrder} className="continue-btn" disabled={loading}>{loading ? "Placing Order..." : "Confirm & Pay"}</button>
              </div>
            </div>
          )}
        </div>

        <div className="checkout-right">
          <div className="summary-box">
            <h2 className="summary-title">Summary</h2>
            
            <div style={{ marginBottom: '32px' }}>
                {(previewData?.items || items).map(item => (
                  <div key={item.productId} style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
                    <img src={item.imagePath ? `${API_BASE}/${item.imagePath}` : "https://via.placeholder.com/70"} alt="" style={{ width: '50px', height: '50px', objectFit: 'contain', background: '#fafafa', borderRadius: '4px' }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '14px', fontWeight: '600' }}>{item.productName || item.name}</div>
                      <div style={{ fontSize: '12px', color: '#999' }}>Qty: {item.quantity} • Rs. {(item.lineTotal || 0).toLocaleString()}</div>
                    </div>
                  </div>
                ))}
            </div>

            <div className="summary-row"><span>Subtotal</span><span>Rs. {(previewData ? previewData.itemsTotal : total).toLocaleString()}</span></div>
            <div className="summary-row"><span>Shipping</span><span>{previewData?.shippingFee === 0 ? "Free" : `Rs. ${previewData?.shippingFee.toLocaleString()}`}</span></div>
            {previewData?.discountTotal > 0 && (
                 <div className="summary-row" style={{ color: 'var(--primary-color)' }}><span>Discount</span><span>-Rs. {previewData.discountTotal.toLocaleString()}</span></div>
            )}
            <div className="summary-row total"><span>Total</span><span>Rs. {(previewData ? previewData.grandTotal : total).toLocaleString()}</span></div>

            <div className="promo-container" style={{ marginTop: '20px', display: 'flex', gap: '8px' }}>
                <input 
                    type="text" 
                    placeholder="Promo Code" 
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                    style={{ flex: 1, padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}
                />
                <button onClick={handleApplyPromo} style={{ padding: '10px 20px', background: '#000', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>APPLY</button>
            </div>

            <div style={{ marginTop: '40px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px', color: '#999' }}><ShieldCheck size={16} /> SSL Secure Payment</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px', color: '#999' }}><Truck size={16} /> {previewData?.estimatedDelivery || "Standard Logistics"}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CheckoutPage;