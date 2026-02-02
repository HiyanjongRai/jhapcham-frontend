import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { X, ShoppingBag, Trash2, Plus, Minus, ArrowRight, Check, AlertCircle, Package, Truck, Sparkles } from "lucide-react";
import { getCurrentUserId, apiGetCart, apiUpdateQuantity, loadGuestCart, saveGuestCart, updateGlobalCartCount } from "../AddCart/cartUtils";
import { API_BASE } from "../config/config";
import "./CartDrawer.css";

const CartDrawer = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [subtotal, setSubtotal] = useState(0);
  const [removingItemId, setRemovingItemId] = useState(null);
  const [updatingItemId, setUpdatingItemId] = useState(null);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
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
    
    const itemKey = item.cartItemId || item.id || `${item.productId}-${item.color}-${item.storage}`;
    setUpdatingItemId(itemKey);
    
    try {
      if (userId) {
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
      setShowSuccessToast(true);
      setTimeout(() => setShowSuccessToast(false), 2000);
    } catch (e) {
      console.error("Update qty failed", e);
    } finally {
      setUpdatingItemId(null);
    }
  };

  const handleRemove = async (item) => {
    const itemKey = item.cartItemId || item.id || `${item.productId}-${item.color}-${item.storage}`;
    setRemovingItemId(itemKey);
    
    // Add delay for animation
    await new Promise(resolve => setTimeout(resolve, 300));
    
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
    } finally {
      setRemovingItemId(null);
    }
  };

  if (!isOpen && !loading) return null;

  const totalItems = cartItems.reduce((sum, item) => sum + (item.quantity || 1), 0);

  return (
    <div className={`cart-drawer-overlay ${isOpen ? "open" : ""}`} onClick={onClose}>
      <div className={`cart-drawer-content ${isOpen ? "open" : ""}`} onClick={(e) => e.stopPropagation()}>
        {showSuccessToast && (
          <div className="drawer-success-toast">
            <Check size={18} />
            <span>Cart updated!</span>
          </div>
        )}
        
        <div className="cart-drawer-header">
          <div className="cart-header-title">
            <div className="cart-icon-wrapper">
              <ShoppingBag size={22} />
              {totalItems > 0 && <span className="cart-badge">{totalItems}</span>}
            </div>
            <div>
              <h2>Your Cart</h2>
              <p className="cart-header-subtitle">{cartItems.length} {cartItems.length === 1 ? 'item' : 'items'}</p>
            </div>
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
              {cartItems.map((item) => {
                const itemKey = item.cartItemId || item.id || `${item.productId}-${item.color}-${item.storage}`;
                const isRemoving = removingItemId === itemKey;
                const isUpdating = updatingItemId === itemKey;
                
                return (
                  <div 
                    className={`cart-item-card ${isRemoving ? 'removing' : ''} ${isUpdating ? 'updating' : ''}`} 
                    key={itemKey}
                  >
                    <Link to={`/product/${item.productId}`} className="item-img-box">
                      <img 
                        src={item.imagePath ? (item.imagePath.startsWith('http') ? item.imagePath : `${API_BASE}/${item.imagePath}`) : "https://via.placeholder.com/100"} 
                        alt={item.name || item.productName} 
                      />
                      {isUpdating && (
                        <div className="item-updating-overlay">
                          <div className="updating-spinner-small"></div>
                        </div>
                      )}
                    </Link>
                    <div className="item-details">
                      <div className="item-header">
                        <Link to={`/product/${item.productId}`} className="item-name-link">
                          <h4 className="item-name">{item.name || item.productName}</h4>
                        </Link>
                        <button 
                          className="item-remove-btn" 
                          onClick={() => handleRemove(item)}
                          disabled={isRemoving}
                          title="Remove item"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                      {(item.color || item.storage) && (
                        <div className="item-variant">
                          {item.color && <span className="variant-chip color-chip">{item.color}</span>}
                          {item.storage && <span className="variant-chip storage-chip">{item.storage}</span>}
                        </div>
                      )}
                      <div className="item-footer">
                        <div className="qty-controls">
                          <button 
                            onClick={() => handleUpdateQty(item, (item.quantity - 1))} 
                            className="qty-btn"
                            disabled={item.quantity <= 1 || isUpdating}
                          >
                            <Minus size={14} />
                          </button>
                          <span className="qty-value">{item.quantity}</span>
                          <button 
                            onClick={() => handleUpdateQty(item, (item.quantity + 1))} 
                            className="qty-btn"
                            disabled={isUpdating}
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                        <div className="item-price">
                          Rs. {((item.unitPrice || item.price || 0) * (item.quantity || 1)).toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {cartItems.length > 0 && (
          <div className="cart-drawer-footer">
            <div className="cart-summary-section">
              <div className="cart-summary-row">
                <span className="summary-label">
                  <Package size={16} />
                  Subtotal ({totalItems} {totalItems === 1 ? 'item' : 'items'})
                </span>
                <span className="summary-value">Rs. {subtotal.toLocaleString()}</span>
              </div>
              <div className="shipping-info">
                <Truck size={14} />
                <span>Shipping calculated at checkout</span>
              </div>
            </div>
            
            <div className="drawer-actions">
              <button className="view-cart-btn" onClick={() => { onClose(); navigate("/cart"); }}>
                <ShoppingBag size={18} />
                View Full Cart
              </button>
              <button className="checkout-btn" onClick={() => { onClose(); navigate("/checkout"); }}>
                <span>Checkout</span>
                <ArrowRight size={18} />
              </button>
            </div>
            
            <div className="drawer-security-badges">
              <div className="security-badge-item">
                <Check size={12} />
                <span>Secure Payment</span>
              </div>
              <div className="security-badge-item">
                <Sparkles size={12} />
                <span>Quality Guaranteed</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CartDrawer;
