import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  getCurrentUserId,
  loadGuestCart,
  saveGuestCart,
  apiGetCart,
  apiUpdateQuantity,
  apiRemoveItem,
  updateGlobalCartCount,
  apiPreviewOrder
} from "./cartUtils";
import { API_BASE } from "../config/config";
import { 
  ShoppingCart, 
  Trash2, 
  Plus, 
  Minus, 
  ArrowRight, 
  Package, 
  RotateCcw, 
  Lock,
  ShoppingBag,
  Sparkles,
  ShieldCheck,
  Heart,
  X,
  Check,
  AlertCircle,
  Truck,
  Gift
} from "lucide-react";
import "./CartPage.css";
import Toast from "../Toast/Toast";

function CartPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [removingItemId, setRemovingItemId] = useState(null);
  const [updatingItemId, setUpdatingItemId] = useState(null);
  const [toast, setToast] = useState({ message: '', type: 'info', visible: false });

  const userId = getCurrentUserId();
  const isLoggedIn = !!userId;

  // Shipping states
  const [shippingLocation] = useState('INSIDE'); 
  const [shippingCost, setShippingCost] = useState(0);
  const [shippingPreview, setShippingPreview] = useState(null);

  const recalcTotal = (list) =>
    list.reduce((sum, i) => sum + i.lineTotal, 0);

  const showToast = (msg, type = 'success') => {
    setToast({ message: msg, type, visible: true });
  };

  useEffect(() => {
    const loadCart = async () => {
      try {
        setLoading(true);
        setError("");

        if (isLoggedIn) {
          const data = await apiGetCart(userId);
          const mappedItems = (data.items || []).map(i => ({
            ...i,
            unitPrice: i.price || 0,
            lineTotal: (i.price || 0) * (i.quantity || 1),
            imagePath: i.image,
            color: i.selectedColor,
            storage: i.selectedStorage
          }));
          
          setItems(mappedItems);
          setTotal(data.subtotal || 0);
        } else {
          const guestItems = loadGuestCart();
          setItems(guestItems);
          setTotal(recalcTotal(guestItems));
        }
      } catch (e) {
        setError(e.message || "Failed to load cart");
      } finally {
        setLoading(false);
      }
    };

    loadCart();
  }, [isLoggedIn, userId]);

  useEffect(() => {
    const calculateShipping = async () => {
      if (items.length === 0) {
        setShippingCost(0);
        setShippingPreview(null);
        return;
      }

      try {
        const payload = {
          userId: userId || null,
          shippingLocation: 'INSIDE',
          items: items.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            color: item.selectedColor || item.color,
            storage: item.selectedStorage || item.storage
          }))
        };

        const preview = await apiPreviewOrder(payload);
        setShippingPreview(preview);
        setShippingCost(preview.shippingFee || 0);
      } catch (err) {
        console.warn('Shipping calculation failed:', err);
        setShippingCost(0);
      }
    };

    calculateShipping();
  }, [items, userId]);

  const handleQtyChange = async (item, newQty) => {
    if (newQty <= 0) return;
    
    const itemKey = item.cartItemId || `${item.productId}-${item.color}-${item.storage}`;
    setUpdatingItemId(itemKey);

    if (isLoggedIn) {
      try {
        await apiUpdateQuantity(userId, item.cartItemId, newQty);
        const data = await apiGetCart(userId);
        
        const mappedItems = (data.items || []).map(i => ({
            ...i,
            unitPrice: i.price || 0,
            lineTotal: (i.price || 0) * (i.quantity || 1),
            imagePath: i.image,
            color: i.selectedColor,
            storage: i.selectedStorage
          }));
          
        setItems(mappedItems);
        setTotal(data.subtotal || 0);
        showToast("Cart quantity updated", "success");

      } catch (e) {
        alert(e.message || "Unable to update quantity");
      } finally {
        setUpdatingItemId(null);
      }
    } else {
      const updated = items.map((i) =>
        i.productId === item.productId &&
        i.color === item.color &&
        i.storage === item.storage
          ? { ...i, quantity: newQty, lineTotal: i.unitPrice * newQty }
          : i
      );
      setItems(updated);
      setTotal(recalcTotal(updated));
      saveGuestCart(updated);
      const totalCount = updated.reduce((sum, item) => sum + item.quantity, 0);
      updateGlobalCartCount(totalCount);
      setUpdatingItemId(null);
    }
  };

  const handleRemove = async (item) => {
    const itemKey = item.cartItemId || `${item.productId}-${item.color}-${item.storage}`;
    setRemovingItemId(itemKey);

    // Add a small delay for animation
    await new Promise(resolve => setTimeout(resolve, 300));

    if (isLoggedIn) {
      try {
        await apiRemoveItem(userId, item.cartItemId);
        const data = await apiGetCart(userId);
        const mappedItems = (data.items || []).map(i => ({
            ...i,
            unitPrice: i.price || 0,
            lineTotal: (i.price || 0) * (i.quantity || 1),
            imagePath: i.image,
            color: i.selectedColor,
            storage: i.selectedStorage
          }));
          
        setItems(mappedItems);
        setTotal(data.subtotal || 0);
        showToast("Item removed from cart", "success");
      } catch (e) {
        alert(e.message || "Unable to remove item");
      } finally {
        setRemovingItemId(null);
      }
    } else {
      const updated = items.filter(i => !(i.productId === item.productId && i.color === item.color && i.storage === item.storage));
      setItems(updated);
      setTotal(recalcTotal(updated));
      saveGuestCart(updated);
      const totalCount = updated.reduce((sum, item) => sum + item.quantity, 0);
      updateGlobalCartCount(totalCount);
      setRemovingItemId(null);
      showToast("Item removed from cart", "success");
    }
  };

  if (loading) {
    return (
      <div className="cart-loading">
        <div className="cart-loading-spinner">
          <div className="spinner-ring"></div>
          <div className="spinner-ring"></div>
          <div className="spinner-ring"></div>
        </div>
        <p className="cart-loading-text">Loading your cart...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="cart-error-container">
        <div className="cart-error-box">
          <AlertCircle size={48} className="error-icon" />
          <h2>Oops! Something went wrong</h2>
          <p>{error}</p>
          <button onClick={() => window.location.reload()} className="retry-button">
            <RotateCcw size={18} />
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="empty-cart-container">
        <div className="empty-cart-box">
          <div className="empty-icon-wrap">
            <ShoppingBag size={100} strokeWidth={1.5} />
            <div className="empty-icon-glow"></div>
          </div>
          <h2>Your cart is empty</h2>
          <p>Discover amazing products waiting for you. Start adding items to your cart!</p>
          <div className="empty-cart-features">
            <div className="feature-item">
              <Truck size={20} />
              <span>Free shipping on orders over Rs. 5000</span>
            </div>
            <div className="feature-item">
              <ShieldCheck size={20} />
              <span>Secure checkout</span>
            </div>
            <div className="feature-item">
              <RotateCcw size={20} />
              <span>Easy returns</span>
            </div>
          </div>
          <button onClick={() => navigate('/products')} className="empty-cart-button">
            <ShoppingBag size={20} />
            Start Shopping
          </button>
        </div>
      </div>
    );
  }

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="cart-wrapper">
      {toast.visible && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast({ ...toast, visible: false })} 
        />
      )}
      
      <div className="cart-container">
        <div className="cart-main-section">
          <div className="cart-header-modern">
            <div className="header-content">
              <h1 className="cart-title">My Shopping Cart</h1>
              <p className="cart-subtitle">{items.length} {items.length === 1 ? 'item' : 'items'} • {totalItems} {totalItems === 1 ? 'product' : 'products'}</p>
            </div>
            <div className="header-actions">
              <button className="clear-cart-btn" onClick={() => navigate('/products')}>
                Continue Shopping
              </button>
            </div>
          </div>

          <div className="cart-items-grid">
            {items.map((item) => {
              const itemKey = item.cartItemId || `${item.productId}-${item.color}-${item.storage}`;
              const isRemoving = removingItemId === itemKey;
              const isUpdating = updatingItemId === itemKey;
              
              return (
                <div 
                  key={itemKey} 
                  className={`cart-item-card-modern ${isRemoving ? 'removing' : ''} ${isUpdating ? 'updating' : ''}`}
                >
                  <div className="item-card-content">
                    <Link to={`/product/${item.productId}`} className="item-image-modern">
                      <img
                        src={item.imagePath ? `${API_BASE}/${item.imagePath}` : "https://via.placeholder.com/300"}
                        alt={item.name}
                      />
                      {isUpdating && (
                        <div className="item-updating-overlay">
                          <div className="updating-spinner"></div>
                        </div>
                      )}
                    </Link>
                    
                    <div className="item-details-modern">
                      <div className="item-header-modern">
                        <Link to={`/product/${item.productId}`} className="item-name-modern">{item.name}</Link>
                        <button 
                          className="remove-icon-btn" 
                          onClick={() => handleRemove(item)}
                          disabled={isRemoving}
                          title="Remove item"
                        >
                          <X size={18} />
                        </button>
                      </div>
                      
                      {item.brand && (
                        <p className="item-brand-modern">{item.brand}</p>
                      )}
                      
                      {(item.color || item.storage) && (
                        <div className="item-options-modern">
                          {item.color && (
                            <div className="option-badge">
                              <span className="option-label">Color:</span>
                              <span className="option-value">{item.color}</span>
                            </div>
                          )}
                          {item.storage && (
                            <div className="option-badge">
                              <span className="option-label">Storage:</span>
                              <span className="option-value">{item.storage}</span>
                            </div>
                          )}
                        </div>
                      )}
                      
                      <div className="item-pricing-row">
                        <div className="price-info">
                          <span className="unit-price">Rs. {item.unitPrice.toLocaleString()}</span>
                          <span className="each-label">each</span>
                        </div>
                        <div className="quantity-control-modern">
                          <button 
                            onClick={() => handleQtyChange(item, item.quantity - 1)} 
                            className="qty-btn-modern" 
                            disabled={item.quantity <= 1 || isUpdating}
                          >
                            <Minus size={16} />
                          </button>
                          <span className="qty-display">{item.quantity}</span>
                          <button 
                            onClick={() => handleQtyChange(item, item.quantity + 1)} 
                            className="qty-btn-modern"
                            disabled={isUpdating}
                          >
                            <Plus size={16} />
                          </button>
                        </div>
                      </div>
                      
                      <div className="item-total-row">
                        <span className="total-label-modern">Item Total:</span>
                        <span className="total-amount">Rs. {item.lineTotal.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="item-card-footer">
                    <button className="save-later-btn-modern">
                      <Heart size={16} />
                      <span>Save for later</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="cart-sidebar-modern">
          <div className="order-summary-modern">
            <div className="summary-header-modern">
              <h2>Order Summary</h2>
            </div>
            
            <div className="summary-content-modern">
              <div className="summary-line">
                <div className="summary-line-left">
                  <span className="line-label">Subtotal</span>
                  <span className="line-items">({totalItems} {totalItems === 1 ? 'item' : 'items'})</span>
                </div>
                <span className="line-value">Rs. {total.toLocaleString()}</span>
              </div>
              
              <div className="summary-line">
                <div className="summary-line-left">
                  <Truck size={16} />
                  <span className="line-label">Shipping</span>
                </div>
                <span className={`line-value ${shippingCost === 0 ? 'free' : ''}`}>
                  {shippingCost > 0 ? `Rs. ${shippingCost.toLocaleString()}` : "Free"}
                </span>
              </div>

              {shippingCost === 0 && (
                <div className="free-shipping-banner">
                  <Check size={16} />
                  <span>Free shipping applied!</span>
                </div>
              )}

              <div className="summary-line savings-line">
                <div className="summary-line-left">
                  <Sparkles size={16} />
                  <span className="line-label">Savings</span>
                </div>
                <span className="line-value savings">Rs. 0</span>
              </div>

              <div className="summary-divider-modern"></div>

              <div className="summary-total-modern">
                <span className="total-label-modern">Total</span>
                <span className="total-price-modern">Rs. {(total + shippingCost).toLocaleString()}</span>
              </div>
            </div>

            <div className="summary-actions-modern">
              <button
                className="checkout-btn-modern"
                onClick={() => navigate("/checkout", { state: { preselectedZone: 'INSIDE' } })}
              >
                <Lock size={18} />
                <span>Proceed to Checkout</span>
                <ArrowRight size={20} />
              </button>
            </div>

            <div className="trust-badges-modern">
              <div className="trust-item">
                <ShieldCheck size={16} />
                <span>Secure Payment</span>
              </div>
              <div className="trust-item">
                <Package size={16} />
                <span>Quality Guaranteed</span>
              </div>
              <div className="trust-item">
                <RotateCcw size={16} />
                <span>Easy Returns</span>
              </div>
            </div>
          </div>

          {total < 5000 && (
            <div className="shipping-promo-modern">
              <div className="promo-icon-wrapper">
                <Truck size={24} />
              </div>
              <div className="promo-text-modern">
                <h4>Free Shipping!</h4>
                <p>Add Rs. {(5000 - total).toLocaleString()} more for free shipping</p>
              </div>
              <Link to="/products" className="promo-action-btn">
                Shop Now
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default CartPage;
