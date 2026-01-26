import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
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
  Shield, 
  RotateCcw, 
  Lock,
  ShoppingBag,
  Sparkles,
  MapPin,
  Truck
} from "lucide-react";
import "./CartPage.css";

function CartPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const userId = getCurrentUserId();
  const isLoggedIn = !!userId;

  // Shipping states
  const [shippingLocation, setShippingLocation] = useState('INSIDE'); // INSIDE or OUTSIDE
  const [shippingCost, setShippingCost] = useState(0);
  const [shippingPreview, setShippingPreview] = useState(null);
  const [loadingShipping, setLoadingShipping] = useState(false);

  const recalcTotal = (list) =>
    list.reduce((sum, i) => sum + i.lineTotal, 0);

  useEffect(() => {
    const loadCart = async () => {
      try {
        setLoading(true);
        setError("");

        if (isLoggedIn) {
          const data = await apiGetCart(userId);
          // Legacy DTO has 'subtotal' and 'items'
          // Each item has 'cartItemId', 'price', 'image', etc.
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

  // Calculate shipping whenever items or location changes
  useEffect(() => {
    const calculateShipping = async () => {
      if (items.length === 0) {
        setShippingCost(0);
        setShippingPreview(null);
        return;
      }

      setLoadingShipping(true);
      try {
        const payload = {
          userId: userId || null,
          shippingLocation: shippingLocation === 'INSIDE' ? 'INSIDE' : 'OUTSIDE',
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
      } finally {
        setLoadingShipping(false);
      }
    };

    calculateShipping();
  }, [items, shippingLocation, userId]);

  /* INSTANT QTY UPDATE (NO FULL RELOAD) */

  const handleQtyChange = async (item, newQty) => {
    if (newQty <= 0) return;

    if (isLoggedIn) {
      try {
        // The backend returns the updated cart DTO
        // The backend returns a message, not the cart. So we must refetch.
        await apiUpdateQuantity(
          userId,
          item.cartItemId, // Legacy uses cartItemId
          newQty
        );

        // Refetch cart
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

      } catch (e) {
        alert(e.message || "Unable to update quantity");
      }
    } else {
      /* Guest user */
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
      // Sync navbar count
      const totalCount = updated.reduce((sum, item) => sum + item.quantity, 0);
      updateGlobalCartCount(totalCount);
    }
  };

  /* INSTANT REMOVE (NO RELOAD) */

  const handleRemove = async (item) => {
    if (isLoggedIn) {
      try {
        // Backend returns updated cart DTO (or if it returns 200 OK with data)
        // Since apiRemoveItem calls apiUpdateQuantity with 0, it returns the cart DTO.
        // Backend returns message. Refetch needed.
        await apiRemoveItem(
          userId,
          item.cartItemId // Legacy uses cartItemId
        );

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

      } catch (e) {
        alert(e.message || "Unable to remove item");
      }
    } else {
      const updated = items.filter(
        (i) =>
          !(
            i.productId === item.productId &&
            i.color === item.color &&
            i.storage === item.storage
          )
      );
      setItems(updated);
      setTotal(recalcTotal(updated));
      saveGuestCart(updated);
      // Sync navbar count
      const totalCount = updated.reduce((sum, item) => sum + item.quantity, 0);
      updateGlobalCartCount(totalCount);
    }
  };

  // Loading State with Animation
  if (loading) {
    return (
      <div className="cart-loading">
        <div className="loading-spinner" style={{
          width: '48px',
          height: '48px',
          border: '4px solid #f3f4f6',
          borderTop: '4px solid #667eea',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite'
        }}></div>
        <p style={{ marginTop: '16px', fontSize: '16px' }}>Loading your cart...</p>
      </div>
    );
  }
  
  if (error) return <div className="cart-error">{error}</div>;

  // Empty Cart State
  if (items.length === 0) {
    return (
      <div style={{ 
        minHeight: '80vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        padding: '40px 20px' 
      }}>
        <div style={{
          textAlign: 'center',
          maxWidth: '500px',
          background: 'var(--glass-bg)',
          backdropFilter: 'blur(20px)',
          padding: '60px 40px',
          borderRadius: '24px',
          boxShadow: 'var(--shadow-lg)',
          animation: 'fadeIn 0.6s ease-out'
        }}>
          <div style={{
            width: '120px',
            height: '120px',
            margin: '0 auto 24px',
            background: 'linear-gradient(135deg, #667eea15 0%, #764ba215 100%)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            animation: 'pulse 2s ease-in-out infinite'
          }}>
            <ShoppingBag size={56} color="#667eea" strokeWidth={1.5} />
          </div>
          <h2 style={{
            fontSize: '28px',
            fontWeight: '800',
            marginBottom: '12px',
            color: '#1a1a1a'
          }}>Your Cart is Empty</h2>
          <p style={{
            fontSize: '16px',
            color: '#64748b',
            marginBottom: '32px',
            lineHeight: '1.6'
          }}>
            Looks like you haven't added anything to your cart yet. 
            Start exploring our amazing products!
          </p>
          <button 
            onClick={() => navigate('/products')}
            style={{
              padding: '16px 36px',
              background: '#111827',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s ease'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1)';
              e.currentTarget.style.background = '#000000';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
              e.currentTarget.style.background = '#111827';
            }}
          >
            <Sparkles size={20} />
            Start Shopping
          </button>
        </div>
      </div>
    );
  }

  // Calculate shipping progress
  // Now handled by backend preview API

  return (
    <div className="cart-wrapper">
      {/* LEFT SIDE - Cart Items */}
      <div className="cart-left">
        <div style={{
          background: 'var(--glass-bg)',
          backdropFilter: 'blur(20px)',
          padding: '20px 24px',
          borderRadius: '16px',
          marginBottom: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <h1 style={{ 
            fontSize: '28px', 
            fontWeight: '800', 
            margin: 0,
            color: '#111827',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <ShoppingCart size={28} color="#111827" />
            Shopping Cart
          </h1>
          <span style={{
            fontSize: '15px',
            fontWeight: '600',
            color: '#64748b'
          }}>
            {items.length} {items.length === 1 ? 'Item' : 'Items'}
          </span>
        </div>

        {items.map((item) => (
          <div
            key={item.cartItemId || `${item.productId}-${item.color}-${item.storage}`}
            className="cart-box"
          >
            <div className="item-info">
              <img
                src={
                  item.imagePath
                    ? `${API_BASE}/${item.imagePath}`
                    : "https://via.placeholder.com/130x130?text=Product"
                }
                alt={item.name}
                className="item-img"
              />

              <div className="item-text">
                <div className="item-title">{item.name}</div>

                <div className="item-tags">
                  {item.brand && <span>{item.brand}</span>}
                  {item.category && <span>{item.category}</span>}
                </div>

                {item.color && (
                  <div className="item-attr">Color: {item.color}</div>
                )}
                {item.storage && (
                  <div className="item-attr">Storage: {item.storage}</div>
                )}

                <button className="remove-btn" onClick={() => handleRemove(item)}>
                  <Trash2 size={14} />
                  Remove
                </button>

                {/* Shipping Details per Item */}
                <div style={{ marginTop: '12px', fontSize: '11px' }}>
                  {item.freeShipping === true ? (
                     <div style={{ color: '#166534', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px', background: '#dcfce7', padding: '4px 8px', borderRadius: '4px', width: 'fit-content' }}>
                        <Package size={12} /> Free Shipping
                     </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {item.sellerFreeShippingMinOrder > 0 && (
                         <div style={{ color: '#b45309', background: '#fef3c7', padding: '4px 8px', borderRadius: '4px', width: 'fit-content', fontWeight: '500' }}>
                           🎁 Free on orders over Rs. {item.sellerFreeShippingMinOrder.toLocaleString()}
                         </div>
                      )}
                      {(item.insideValleyShipping !== undefined || item.outsideValleyShipping !== undefined) && (
                        <div style={{ color: '#64748b', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                           {item.insideValleyShipping !== undefined && <span>Inside: Rs. {item.insideValleyShipping}</span>}
                           {item.outsideValleyShipping !== undefined && <span>Outside: Rs. {item.outsideValleyShipping}</span>}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="item-price">Rs. {item.unitPrice.toFixed(2)}</div>

            <div className="item-qty">
              <button
                onClick={() => handleQtyChange(item, item.quantity - 1)}
                className="qty-button"
                disabled={item.quantity <= 1}
              >
                <Minus size={16} />
              </button>
              <span>{item.quantity}</span>
              <button
                onClick={() => handleQtyChange(item, item.quantity + 1)}
                className="qty-button"
              >
                <Plus size={16} />
              </button>
            </div>

            <div className="item-total">Rs. {item.lineTotal.toFixed(2)}</div>
          </div>
        ))}
      </div>

      {/* RIGHT SIDE - Order Summary */}
      <div className="cart-right">
        <div className="summary-box">








          <button
            className="checkout-button"
            onClick={() => navigate("/checkout", {
              state: {
                preselectedZone: shippingLocation === 'INSIDE' ? 'INSIDE' : 'OUTSIDE'
              }
            })}
          >
            Proceed to Checkout
            <ArrowRight size={20} />
          </button>

          <button
            className="continue-button"
            onClick={() => navigate("/products")}
          >
            Continue Shopping
          </button>

          <p style={{
            fontSize: '12px',
            color: '#94a3b8',
            textAlign: 'center',
            marginTop: '16px',
            lineHeight: '1.5'
          }}>
            💳 We accept all major payment methods
          </p>
        </div>
      </div>
    </div>
  );
}

export default CartPage;
