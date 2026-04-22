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
  X, 
  Plus, 
  Minus, 
  ArrowRight, 
  RotateCcw,
  ShoppingBag,
  AlertCircle
} from "lucide-react";
import "./CartPage.css";
import Toast from "../Toast/Toast";
import ProductCard from "../productCard/ProductCard";
import api from "../../api/axios";

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
  const [crossSellProducts, setCrossSellProducts] = useState([]);

  const [shippingLocation, setShippingLocation] = useState('INSIDE');
  const [shippingCost, setShippingCost] = useState(0);

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
            storage: i.selectedStorage,
            stock: i.stockQuantity
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

  // Fetch cross-sell products based on cart items
  useEffect(() => {
    const fetchCrossSell = async () => {
      if (items.length === 0) {
        setCrossSellProducts([]);
        return;
      }
      try {
        const productIds = items.map(i => i.productId).filter(Boolean);
        const allSimilar = [];
        
        // Fetch similar items for each cart product (limit to first 3 to avoid too many calls)
        for (const pid of productIds.slice(0, 3)) {
          try {
            const res = await api.get(`/api/activity/similar/${pid}`, { params: { limit: 4 } });
            if (res.data) allSimilar.push(...res.data);
          } catch {
            // skip
          }
        }
        
        // Deduplicate and remove items already in cart
        const cartProductIds = new Set(productIds);
        const seen = new Set();
        const unique = allSimilar.filter(p => {
          if (cartProductIds.has(p.id) || seen.has(p.id)) return false;
          seen.add(p.id);
          return true;
        });
        
        // Map to ProductCard format
        const mapped = unique.slice(0, 6).map(dto => ({
          ...dto,
          imagePath: (dto.imagePaths && dto.imagePaths.length > 0) ? dto.imagePaths[0] : (dto.imagePath || ""),
          rating: dto.averageRating || 0,
          stock: dto.stockQuantity ?? dto.stock ?? 0,
        }));
        setCrossSellProducts(mapped);
      } catch (err) {
        console.warn("Cross-sell fetch failed", err);
      }
    };
    fetchCrossSell();
  }, [items]);

  useEffect(() => {
    const calculateShipping = async () => {
      if (items.length === 0) {
        setShippingCost(0);
        return;
      }

      try {
        const payload = {
          userId: userId || null,
          shippingLocation: shippingLocation,
          items: items.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            color: item.selectedColor || item.color,
            storage: item.selectedStorage || item.storage
          }))
        };

        const preview = await apiPreviewOrder(payload);
        setShippingCost(preview.shippingFee || 0);
      } catch (err) {
        console.warn('Shipping calculation failed:', err);
        setShippingCost(0);
      }
    };

    calculateShipping();
  }, [items, userId, shippingLocation]);

  const handleQtyChange = async (item, newQty) => {
    if (newQty <= 0) return;

    // Check stock limit if available
    if (item.stock !== undefined && newQty > item.stock) {
      alert(`Sorry, only ${item.stock} items are available in stock.`);
      return;
    }

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
            storage: i.selectedStorage,
            stock: i.stockQuantity
          }));
          
        setItems(mappedItems);
        setTotal(data.subtotal || 0);
        showToast("Quantity updated", "success");

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
        showToast("Item removed", "success");
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
      showToast("Item removed", "success");
    }
  };

  if (loading) {
    return (
      <div className="cart-page">
        <div className="cart-loading">
          <div className="cart-loading-spinner">
            <div className="spinner-ring"></div>
            <div className="spinner-ring"></div>
            <div className="spinner-ring"></div>
          </div>
          <p className="cart-loading-text">Loading your cart...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="cart-page">
        <div className="cart-error">
          <div className="cart-error-box">
            <AlertCircle size={48} />
            <h2>Something went wrong</h2>
            <p>{error}</p>
            <button onClick={() => window.location.reload()} className="retry-btn">
              <RotateCcw size={16} />
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="cart-page">
        <div className="empty-cart">
          <div className="empty-cart-icon">
            <ShoppingBag size={40} />
          </div>
          <h2>Your cart is empty</h2>
          <p>Looks like you haven't added anything to your cart yet.</p>
          <button onClick={() => navigate('/products')} className="empty-cart-btn">
            <ShoppingBag size={18} />
            Start Shopping
          </button>
        </div>
      </div>
    );
  }

  const grandTotal = total + shippingCost;

  return (
    <div className="cart-page">
      {toast.visible && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast({ ...toast, visible: false })} 
        />
      )}
      
      <h1 className="cart-page-title">YOUR CART</h1>
      
      <div className="cart-layout">
        <div className="cart-items-section">
          <table className="cart-table">
            <thead>
              <tr>
                <th className="product-col">PRODUCT</th>
                <th className="price-col">PRICE</th>
                <th className="qty-col">QUANTITY</th>
                <th className="subtotal-col">SUBTOTAL</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => {
                const itemKey = item.cartItemId || `${item.productId}-${item.color}-${item.storage}`;
                const isRemoving = removingItemId === itemKey;
                const isUpdating = updatingItemId === itemKey;
                
                return (
                  <tr 
                    key={itemKey} 
                    className={`cart-table-row ${isRemoving ? 'removing' : ''} ${isUpdating ? 'updating' : ''}`}
                  >
                    <td className="product-col">
                      <div className="product-cell-content">
                        <div className="product-image-container">
                          <button 
                            className="remove-item-btn" 
                            onClick={() => handleRemove(item)}
                            disabled={isRemoving}
                            title="Remove item"
                          >
                            <X size={14} strokeWidth={3} />
                          </button>
                          <Link to={`/product/${item.productId}`} className="cart-item-img-link">
                            <img
                              src={item.imagePath ? `${API_BASE}/${item.imagePath}` : "https://via.placeholder.com/100"}
                              alt={item.name}
                            />
                            {isUpdating && (
                              <div className="updating-overlay">
                                <div className="spinner"></div>
                              </div>
                            )}
                          </Link>
                        </div>
                        <div className="cart-item-info">
                          <Link to={`/product/${item.productId}`} className="cart-item-name">
                            {item.name}
                          </Link>
                          {(item.color || item.storage) && (
                            <div className="cart-item-variant">
                              {item.storage && <span className="variant-label">Capacity: <strong>{item.storage}</strong></span>}
                              {item.color && (
                                <span className="variant-label">
                                  Color: <strong>{item.color}</strong>
                                  <span className="color-indicator" style={{ backgroundColor: item.color.toLowerCase() }}></span>
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="price-col">
                      <span className="price-text">Rs. {item.unitPrice.toLocaleString()}</span>
                    </td>
                    <td className="qty-col">
                      <div className="cart-item-qty">
                        <button 
                          className="qty-btn"
                          onClick={() => handleQtyChange(item, item.quantity - 1)} 
                          disabled={item.quantity <= 1 || isUpdating}
                        >
                          <Minus size={14} />
                        </button>
                        <span className="qty-value">{item.quantity}</span>
                        <button 
                          className="qty-btn"
                          onClick={() => handleQtyChange(item, item.quantity + 1)} 
                          disabled={isUpdating}
                        >
                          <Plus size={14} strokeWidth={2} />
                        </button>
                      </div>
                    </td>
                    <td className="subtotal-col">
                      <span className="subtotal-text">Rs. {item.lineTotal.toLocaleString()}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

        </div>
        
        <div className="order-summary">
          <h2 className="order-summary-title">Order Summary</h2>
          
          <div className="shipping-toggle-container">
            <span className="toggle-label">Shipping To:</span>
            <div className="shipping-toggle-group">
              <button 
                className={`toggle-btn ${shippingLocation === 'INSIDE' ? 'active' : ''}`}
                onClick={() => setShippingLocation('INSIDE')}
              >
                Inside Valley
              </button>
              <button 
                className={`toggle-btn ${shippingLocation === 'OUTSIDE' ? 'active' : ''}`}
                onClick={() => setShippingLocation('OUTSIDE')}
              >
                Outside Valley
              </button>
            </div>
          </div>

          <div className="summary-row">
            <span className="label">Subtotal</span>
            <span className="value">Rs. {total.toLocaleString()}</span>
          </div>
          
          <div className="summary-row">
            <span className="label">Delivery Fee</span>
            <span className="value">
              {shippingCost > 0 ? `Rs. ${shippingCost.toLocaleString()}` : "Free"}
            </span>
          </div>
          
          <div className="summary-row total">
            <span className="label">Total</span>
            <span className="value">Rs. {grandTotal.toLocaleString()}</span>
          </div>
          
          <button
            className="checkout-btn"
            onClick={() => {
              if (!isLoggedIn) {
                showToast("Please login first to checkout", "info");
                setTimeout(() => navigate("/login"), 1500);
                return;
              }
              navigate("/checkout", { state: { preselectedZone: shippingLocation } });
            }}
          >
            <span>Proceed to Checkout</span>
            <ArrowRight size={20} strokeWidth={3} />
          </button>
        </div>
      </div>

      {crossSellProducts.length > 0 && (
        <div className="cart-cross-sell">
          <h2 className="cross-sell-title">Frequently Bought Together</h2>
          <div className="cross-sell-grid">
            {crossSellProducts.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default CartPage;
