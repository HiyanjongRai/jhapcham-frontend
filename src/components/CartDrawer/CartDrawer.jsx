import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { X, ShoppingBag, Trash2, Plus, Minus, ArrowRight } from "lucide-react";
import { getCurrentUserId, apiGetCart, apiUpdateQuantity, loadGuestCart, saveGuestCart, updateGlobalCartCount } from "../AddCart/cartUtils";
import { API_BASE } from "../config/config";
import "./CartDrawer.css";

const CartDrawer = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [subtotal, setSubtotal] = useState(0);
  const userId = getCurrentUserId();

  const fetchCart = async () => {
    setLoading(true);
    try {
      if (userId) {
        const data = await apiGetCart(userId);
        // Map backend data to ensure unitPrice is properly set
        const mappedItems = (data.items || []).map(item => ({
          ...item,
          unitPrice: item.price || item.unitPrice || 0,
          name: item.name || item.productName || 'Product',
          imagePath: item.image || item.imagePath || '',
          color: item.selectedColor || item.color || '',
          storage: item.selectedStorage || item.storage || ''
        }));
        setCartItems(mappedItems);
        setSubtotal(data.subtotal || 0);
      } else {
        const items = loadGuestCart();
        setCartItems(items);
        const total = items.reduce((sum, item) => sum + ((item.unitPrice || 0) * (item.quantity || 1)), 0);
        setSubtotal(total);
      }
    } catch (error) {
      console.error("Failed to fetch cart for drawer:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchCart();
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => { document.body.style.overflow = "unset"; };
  }, [isOpen]);

  useEffect(() => {
    const handleUpdate = () => {
      if (isOpen) fetchCart();
    };
    window.addEventListener("cart-updated", handleUpdate);
    return () => window.removeEventListener("cart-updated", handleUpdate);
  }, [isOpen]);

  const handleUpdateQty = async (item, newQty) => {
    if (newQty < 1) return;
    try {
      if (userId) {
        // userId, cartItemId, quantity
        const cartItemId = item.cartItemId || item.id;
        await apiUpdateQuantity(userId, cartItemId, newQty);
      } else {
        const cart = loadGuestCart();
        const idx = cart.findIndex(i => i.productId === item.productId && i.color === item.color && i.storage === item.storage);
        if (idx !== -1) {
          cart[idx].quantity = newQty;
          cart[idx].lineTotal = cart[idx].unitPrice * newQty;
          saveGuestCart(cart);
          updateGlobalCartCount(cart.reduce((s, i) => s + i.quantity, 0));
        }
      }
      fetchCart();
    } catch (e) {
      console.error("Update qty failed", e);
    }
  };

  const handleRemove = async (item) => {
    try {
      if (userId) {
        const cartItemId = item.cartItemId || item.id;
        await apiUpdateQuantity(userId, cartItemId, 0);
      } else {
        let cart = loadGuestCart();
        cart = cart.filter(i => !(i.productId === item.productId && i.color === item.color && i.storage === item.storage));
        saveGuestCart(cart);
        updateGlobalCartCount(cart.reduce((s, i) => s + i.quantity, 0));
      }
      fetchCart();
    } catch (e) {
      console.error("Remove item failed", e);
    }
  };

  if (!isOpen && !loading) return null;

  return (
    <div className={`cart-drawer-overlay ${isOpen ? "open" : ""}`} onClick={onClose}>
      <div className={`cart-drawer-content ${isOpen ? "open" : ""}`} onClick={(e) => e.stopPropagation()}>
        <div className="cart-drawer-header">
          <div className="cart-header-title">
            <ShoppingBag size={20} />
            <h2>Your Cart ({cartItems.length})</h2>
          </div>
          <button className="cart-close-btn" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <div className="cart-drawer-body">
          {loading && cartItems.length === 0 ? (
            <div className="cart-drawer-loading">
                <div className="drawer-spinner"></div>
                <span>Syncing Cart...</span>
            </div>
          ) : cartItems.length === 0 ? (
            <div className="cart-empty-state">
              <div className="empty-icon-wrapper">
                <ShoppingBag size={48} />
              </div>
              <p>Your cart is empty</p>
              <button className="start-shopping-btn" onClick={() => { onClose(); navigate("/products"); }}>
                Start Shopping
              </button>
            </div>
          ) : (
            <div className="cart-items-list">
              {cartItems.map((item) => (
                <div className="cart-item-card" key={item.cartItemId || `${item.productId}-${item.color}-${item.storage}`}>
                  <div className="item-img-box">
                    <img 
                      src={item.imagePath ? (item.imagePath.startsWith('http') ? item.imagePath : `${API_BASE}/${item.imagePath}`) : "https://via.placeholder.com/100"} 
                      alt={item.name} 
                    />
                  </div>
                  <div className="item-details">
                    <div className="item-header">
                      <h4 className="item-name">{item.name || item.productName}</h4>
                      <button className="item-remove-btn" onClick={() => handleRemove(item)}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <p className="item-variant">
                      {item.color && <span>{item.color}</span>}
                      {item.color && item.storage && <span className="dot">•</span>}
                      {item.storage && <span>{item.storage}</span>}
                    </p>
                    <div className="item-footer">
                      <div className="qty-controls">
                        <button onClick={() => handleUpdateQty(item, (item.quantity - 1))} className="qty-btn">
                          <Minus size={14} />
                        </button>
                        <span>{item.quantity}</span>
                        <button onClick={() => handleUpdateQty(item, (item.quantity + 1))} className="qty-btn">
                          <Plus size={14} />
                        </button>
                      </div>
                      <div className="item-price">
                        Rs. {((item.unitPrice || 0) * (item.quantity || 1)).toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {cartItems.length > 0 && (
          <div className="cart-drawer-footer">
            <div className="cart-summary-row">
              <span className="summary-label">Subtotal</span>
              <span className="summary-value">Rs. {subtotal.toLocaleString()}</span>
            </div>
            <div style={{
              fontSize: '11px',
              color: '#94a3b8',
              marginTop: '8px',
              padding: '0 4px',
              textAlign: 'center',
              lineHeight: '1.4'
            }}>
              + Shipping costs calculated at checkout based on your location
            </div>
            <p className="shipping-note">Shipping & taxes calculated at checkout</p>
            <div className="drawer-actions">
              <button className="view-cart-btn" onClick={() => { onClose(); navigate("/cart"); }}>
                View Cart
              </button>
              <button className="checkout-btn" onClick={() => { onClose(); navigate("/checkout"); }}>
                Checkout <ArrowRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CartDrawer;
