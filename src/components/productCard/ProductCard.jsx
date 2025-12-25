import React, { useState, useEffect } from "react";
import { API_BASE } from "../config/config";
import "./ProductCard.css";
import { 
  Heart, 
  Star, 
  Eye, 
  ShoppingCart,
  ShoppingBag
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getCurrentUserId, apiAddToCart, addToGuestCart } from "../AddCart/cartUtils";
import { apiAddToWishlist, apiRemoveFromWishlist, apiCheckWishlist } from "../WishlistPage/wishlistUtils";
import Toast from "../Toast/Toast";

function ProductCard({ product }) {
  const navigate = useNavigate();
  const [liked, setLiked] = useState(false);
  const [adding, setAdding] = useState(false);
  const [toast, setToast] = useState({ message: '', type: 'info', visible: false });

  const showToast = (message, type = 'info') => {
    setToast({ message, type, visible: true });
  };

  const userRole = localStorage.getItem("userRole");
  const isSeller = userRole === "SELLER";

  const {
    id,
    name,
    price,
    salePrice,
    onSale,
    stock,
    totalViews,
    averageRating,
    status,
    visible,
    salePercentage,
    saleLabel,
    categoryName,
    brand
  } = product;

  // Check wishlist status on mount
  useEffect(() => {
    const checkStatus = async () => {
      const userId = getCurrentUserId();
      if (userId && id) {
        const isIn = await apiCheckWishlist(userId, id);
        setLiked(isIn);
      }
    };
    checkStatus();
  }, [id]);

  const effectiveSalePrice = salePrice ?? price;
  const safePrice = price ?? 0;
  const displayPrice = onSale ? (effectiveSalePrice ?? safePrice) : safePrice;
  const safeRating = averageRating ?? 0;
  const inStock = (stock ?? 0) > 0 && (visible ?? true) && status === "ACTIVE";

  const isFullUrl = (src) => src && (src.startsWith('http://') || src.startsWith('https://'));

  const rawImg = (product.imagePaths && product.imagePaths.length > 0)
    ? product.imagePaths[0]
    : product.imagePath;

  const imgSrc = isFullUrl(rawImg)
    ? rawImg
    : (rawImg
        ? `${API_BASE}/${rawImg}`
        : "https://via.placeholder.com/600x400?text=No+Image");

  const handleCardClick = () => {
    navigate(`/products/${id}`);
  };

  const handleAddToCartClick = async (e) => {
    e.stopPropagation();
    if (stock === 0 || adding) return;
    setAdding(true);
    
    const userId = getCurrentUserId();
    try {
      if (userId) {
        await apiAddToCart(userId, id, 1, null, null);
      } else {
        addToGuestCart(product);
      }
      showToast("Item added to cart", "success");
    } catch (err) {
      console.error("Add to cart error:", err);
      const errorMsg = err.response?.data?.message || "Failed to add item to cart";
      showToast(errorMsg, "error");
    } finally {
      setAdding(false);
    }
  }; 

  const toggleWishlist = async (e) => {
    e.stopPropagation();
    const userId = getCurrentUserId();
    if (!userId) return navigate("/login");
    
    try {
      if (liked) {
        await apiRemoveFromWishlist(userId, id);
        setLiked(false);
        showToast("Removed from wishlist", "info");
      } else {
        await apiAddToWishlist(userId, id);
        setLiked(true);
        showToast("Added to wishlist", "success");
      }
    } catch (err) {
      console.error("Wishlist toggle fail", err);
    }
  };

  const renderStars = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Star 
          key={i} 
          size={14} 
          fill={i <= Math.round(rating) ? "#fbc02d" : "none"} 
          color={i <= Math.round(rating) ? "#fbc02d" : "#64748b"} 
        />
      );
    }
    return stars;
  };

  const formatViews = (views) => {
    if (views >= 1000) return (views / 1000).toFixed(1) + 'K';
    return views || 0;
  };

  return (
    <div className="modern-pc-card" onClick={handleCardClick}>
      {/* Wishlist Button */}
      {!isSeller && (
        <button
          className={`modern-pc-wishlist ${liked ? "active" : ""}`}
          onClick={toggleWishlist}
          aria-label="Toggle Wishlist"
        >
          <Heart size={18} fill={liked ? "#ff4d4d" : "none"} color={liked ? "#ff4d4d" : "#666"} />
        </button>
      )}

      {/* Sale/Discount Badge */}
      {onSale && (
        <div className="modern-pc-badge" title={saleLabel}>
          {saleLabel || (salePercentage ? `${Math.round(salePercentage)}% OFF` : 'SALE')}
        </div>
      )}

      {/* Product Image Area */}
      <div className="modern-pc-img-box">
        <img src={imgSrc} alt={name} className="modern-pc-img" loading="lazy" />
      </div>

      {/* Product Info Section */}
      <div className="modern-pc-body">
        <h3 className="modern-pc-title">{name}</h3>
        <p className="modern-pc-brand">{brand || categoryName || "Official Brand"}</p>
        
        <div className="modern-pc-meta">
          <div className="modern-pc-rating">
            {renderStars(safeRating)}
            <span className="rating-value">{safeRating.toFixed(1)}</span>
          </div>
          <div className="modern-pc-views">
            <Eye size={14} />
            <span>{formatViews(totalViews)} Views</span>
          </div>
        </div>

        <div className="modern-pc-footer">
          <div className="modern-pc-price-box">
            <div className="modern-pc-price">
              <span className="currency">Rs </span>
              <span className="amount">{Number(displayPrice).toLocaleString()}</span>
            </div>
            {onSale && safePrice > displayPrice && (
              <span className="modern-pc-old-price">Rs {Number(safePrice).toLocaleString()}</span>
            )}
          </div>
          
          {!isSeller && (
            <button 
              className="modern-pc-btn" 
              onClick={handleAddToCartClick} 
              disabled={stock === 0 || adding}
            >
              {adding ? (
                "Adding..."
              ) : (
                <>
                  <ShoppingCart size={16} />
                  <span>Add to Cart</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {toast.visible && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast({ ...toast, visible: false })} 
        />
      )}
    </div>
  );
}

export default ProductCard;
