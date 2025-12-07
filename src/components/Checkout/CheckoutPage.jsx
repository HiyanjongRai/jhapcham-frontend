import React, { useEffect, useState } from "react";
import {
  getCurrentUserId,
  apiGetCart,
  apiPlaceOrderFromCart,
} from "../AddCart/cartUtils";
import ErrorToast from "../ErrorToast/ErrorToast";
import "./CheckoutPage.css";


function CheckoutPage() {
  const userId = getCurrentUserId();

  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);

  // Contact Info
  const [user, setUser] = useState({
    email: "",
    contactNumber: "",
  });

  // Shipping Address
  const [shipping, setShipping] = useState({
    firstName: "",
    lastName: "",
    street: "",
    city: "",
    state: "",
    zip: "",
    country: "",
  });

  // Shipping Method
  const [shippingMethod, setShippingMethod] = useState({
    name: "Standard Shipping",
    price: 10,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);


  useEffect(() => {
    if (!userId) return;

    loadCart();
    loadUser();
  }, [userId]);

  const loadCart = async () => {
    try {
      const data = await apiGetCart(userId);
      setItems(data.items || []);
      setTotal(data.total || 0);
    } catch (e) {
      console.error("Cart load error:", e);
    }
  };

  const loadUser = async () => {
    try {
      const res = await fetch(`http://localhost:8080/users/profile/${userId}`);
      if (!res.ok) return;

      const u = await res.json();

      setUser({
        email: u.email || "",
        contactNumber: u.contactNumber || "",
      });
    } catch (e) {
      console.error("User load error:", e);
    }
  };

  const placeOrder = async () => {
    if (!userId) {
      setError({
        status: 401,
        message: "Authentication Required",
        details: "You must be logged in to place an order",
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Combine shipping address into a single string
    const fullAddress = `
      ${shipping.firstName} ${shipping.lastName},
      ${shipping.street},
      ${shipping.city}, ${shipping.state} ${shipping.zip},
      ${shipping.country}
    `;

    try {
      setLoading(true);
      setError(null); // Clear any previous errors
      await apiPlaceOrderFromCart(userId, fullAddress, null, null);
      window.location.href = "/order-success";
    } catch (e) {
      console.error("Order placement error:", e);
      
      // Check if it's a structured error from our API
      if (e.status) {
        setError(e);
      } else {
        // Generic error
        setError({
          status: 500,
          message: "Order Failed",
          details: e.message || "An unexpected error occurred while placing your order",
          timestamp: new Date().toISOString()
        });
      }
    } finally {
      setLoading(false);
    }
  };


  return (
    <>
      {/* Error Toast Notification */}
      <ErrorToast error={error} onClose={() => setError(null)} />

      <div className="checkout-container">


      {/* LEFT SIDE */}
      <div className="checkout-left">

        {/* Contact Information */}
        <div className="checkout-section">
          <h3 className="section-title">
            <i className="icon">📧</i> Contact Information
          </h3>

          <div className="form-row">
            <div className="form-field">
              <label>Email Address</label>
              <input type="email" value={user.email} readOnly />
            </div>

            <div className="form-field">
              <label>Phone Number</label>
              <input type="text" value={user.contactNumber} readOnly />
            </div>
          </div>
        </div>

        {/* Shipping Address */}
        <div className="checkout-section">
          <h3 className="section-title">
            <i className="icon">📦</i> Shipping Address
          </h3>

          <div className="form-row">
            <div className="form-field">
              <label>First Name</label>
              <input
                type="text"
                value={shipping.firstName}
                onChange={(e) =>
                  setShipping({ ...shipping, firstName: e.target.value })
                }
              />
            </div>

            <div className="form-field">
              <label>Last Name</label>
              <input
                type="text"
                value={shipping.lastName}
                onChange={(e) =>
                  setShipping({ ...shipping, lastName: e.target.value })
                }
              />
            </div>
          </div>

          <div className="form-field">
            <label>Street Address</label>
            <input
              type="text"
              value={shipping.street}
              onChange={(e) =>
                setShipping({ ...shipping, street: e.target.value })
              }
            />
          </div>

          <div className="form-row">
            <div className="form-field">
              <label>City</label>
              <input
                type="text"
                value={shipping.city}
                onChange={(e) =>
                  setShipping({ ...shipping, city: e.target.value })
                }
              />
            </div>

            <div className="form-field">
              <label>State</label>
              <input
                type="text"
                value={shipping.state}
                onChange={(e) =>
                  setShipping({ ...shipping, state: e.target.value })
                }
              />
            </div>

            <div className="form-field">
              <label>ZIP Code</label>
              <input
                type="text"
                value={shipping.zip}
                onChange={(e) =>
                  setShipping({ ...shipping, zip: e.target.value })
                }
              />
            </div>
          </div>

          <div className="form-field">
            <label>Country</label>
            <input
              type="text"
              value={shipping.country}
              onChange={(e) =>
                setShipping({ ...shipping, country: e.target.value })
              }
            />
          </div>
        </div>

        {/* Shipping Method */}
        <div className="checkout-section">
          <h3 className="section-title">
            <i className="icon">🚚</i> Shipping Method
          </h3>

          <div className="shipping-option">
            <input
              type="radio"
              checked={shippingMethod.name === "Standard Shipping"}
              onChange={() =>
                setShippingMethod({ name: "Standard Shipping", price: 10 })
              }
            />
            <label>
              <strong>Standard Shipping</strong> <br />
              5–7 business days
            </label>
            <span className="price">$10.00</span>
          </div>

          <div className="shipping-option">
            <input
              type="radio"
              checked={shippingMethod.name === "Express Shipping"}
              onChange={() =>
                setShippingMethod({ name: "Express Shipping", price: 25 })
              }
            />
            <label>
              <strong>Express Shipping</strong> <br />
              2–3 business days
            </label>
            <span className="price">$25.00</span>
          </div>

          <div className="shipping-option">
            <input
              type="radio"
              checked={shippingMethod.name === "Overnight Shipping"}
              onChange={() =>
                setShippingMethod({ name: "Overnight Shipping", price: 50 })
              }
            />
            <label>
              <strong>Overnight Shipping</strong> <br />
              Next business day
            </label>
            <span className="price">$50.00</span>
          </div>
        </div>

        {/* Continue Button */}
        <button
          onClick={placeOrder}
          className="continue-btn"
          disabled={loading}
        >
          {loading ? "Processing..." : "Continue to Payment →"}
        </button>
      </div>

      {/* RIGHT SIDE – ORDER SUMMARY */}
      <div className="checkout-right">
        <div className="summary-box">
          <h3>Order Summary</h3>

          {items.map((item) => (
            <div className="summary-item" key={item.productId}>
              <img
                src={
                  item.imagePath
                    ? `http://localhost:8080${item.imagePath}`
                    : "https://via.placeholder.com/70"
                }
                alt=""
                className="summary-img"
              />

              <div className="summary-info">
  <div className="summary-item-name">{item.name}</div>

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
    ${item.unitPrice?.toFixed(2)}
  </div>
</div>


              <div className="summary-line">$ {item.lineTotal.toFixed(2)}</div>
            </div>
          ))}

          <hr />

          <div className="summary-row">
            <span>Subtotal</span>
            <span>${total.toFixed(2)}</span>
          </div>

          <div className="summary-row">
            <span>Shipping</span>
            <span>${shippingMethod.price.toFixed(2)}</span>
          </div>

          <div className="summary-row total">
            <strong>Total</strong>
            <strong>
              ${(total + shippingMethod.price).toFixed(2)}
            </strong>
          </div>
        </div>
      </div>
      </div>
    </>
  );
}

export default CheckoutPage;
