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

  return (
    <div className="pc-card" onClick={handleCardClick}>
      <div className="pc-img-box">
        <div className="pc-badges">
          {onSale && (
            <div className="pc-sale-badge">
              {saleLabel || (salePercentage ? `${Math.round(salePercentage)}% OFF` : 'SALE')}
            </div>
          )}
          {stock > 0 && stock <= 5 && (
            <div className="pc-new-badge" style={{background: '#f97316'}}>Low Stock</div>
          )}
        </div>
        
        {!isSeller && (
          <button
            className={`pc-wish-floating ${liked ? "pc-wish-active" : ""}`}
            onClick={toggleWishlist}
            aria-label="Toggle Wishlist"
          >
            <Heart size={20} fill={liked ? "currentColor" : "none"} />
          </button>
        )}
        
        <img src={imgSrc} className="pc-img" alt={name} loading="lazy" />
        
        {/* Seller Logo Branding */}
        {(product.logoImagePath || product.profileImagePath) && (
          <div className="pc-seller-badge" title={`Sold by ${product.sellerFullName}`}>
            <img 
              src={`${API_BASE}/${product.logoImagePath || product.profileImagePath}`} 
              alt="Seller" 
              className="pc-seller-thumb"
            />
          </div>
        )}
      </div>

      <div className="pc-body">
        <div className="pc-category">{brand || categoryName || "Product"}</div>
        <h3 className="pc-title">{name}</h3>
        
        <div className="pc-meta">
          <div className="pc-rating">
            <Star size={14} fill="currentColor" />
            <span>{safeRating.toFixed(1)}</span>
          </div>
          <div className="pc-views">
            <Eye size={14} />
            <span>{totalViews || 0}</span>
          </div>
        </div>

        <div className="pc-price-row">
          {onSale ? (
            <>
              <span className="pc-price-new">₹{Number(displayPrice).toLocaleString()}</span>
              <span className="pc-price-old">₹{Number(safePrice).toLocaleString()}</span>
            </>
          ) : (
            <span className="pc-price-new">₹{Number(safePrice).toLocaleString()}</span>
          )}
        </div>

        {!isSeller && (
          <div className="pc-footer">
            <button 
              className="pc-btn-add" 
              onClick={handleAddToCartClick} 
              disabled={stock === 0 || adding}
            >
              {adding ? "Adding..." : stock === 0 ? "Out of Stock" : (
                <>
                  <ShoppingBag size={18} />
                  <span>Add to Cart</span>
                </>
              )}
            </button>
          </div>
        )}
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
