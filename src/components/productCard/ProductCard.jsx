import React, { useState } from "react";
import { API_BASE } from "../config/config";
import "./ProductCard.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faHeart, faStar } from "@fortawesome/free-solid-svg-icons";
import { useNavigate } from "react-router-dom";
import { getCurrentUserId, apiAddToCart, addToGuestCart } from "../AddCart/cartUtils";
import { apiAddToWishlist, apiRemoveFromWishlist, apiCheckWishlist } from "../WishlistPage/wishlistUtils";

function ProductCard({ product, onAddToCart }) {
  const navigate = useNavigate();
  const [liked, setLiked] = useState(false);
  // Debug log to ensure fresh render
  // console.log("ProductCard Rendered", product?.id);

 // Check wishlist status on mount
  React.useEffect(() => {
    const checkStatus = async () => {
      const userId = getCurrentUserId();
      if (userId && product?.id) {
        const isIn = await apiCheckWishlist(userId, product.id);
        setLiked(isIn);
      }
    };
    checkStatus();
  }, [product?.id]);

  const [adding, setAdding] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState("");

  const {
    id,
    name,
    description,
    shortDescription,
    price,
    salePrice,
    onSale,
    imagePath,
    stock,
    totalLikes,
    totalViews,
    averageRating,
    ratingCount,
    status,
    visible,
    salePercentage,
    discountPrice,
    saleLabel,
  } = product;

  // Map backend discountPrice to frontend logic
  // FIX: discountPrice is the AMOUNT OFF, salePrice is the FINAL PRICE.
  // effectiveSalePrice should be the salePrice.
  const effectiveSalePrice = salePrice ?? price;
  const safePrice = price ?? 0;
  // If onSale is true, use effectiveSalePrice, otherwise safePrice
  const displayPrice = onSale ? (effectiveSalePrice ?? safePrice) : safePrice;
  
  const safeRating = averageRating ?? 0;
  const inStock = (stock ?? 0) > 0 && (visible ?? true) && status === "ACTIVE";

  // Resolve image source (handle both imagePath and legacy imagePaths)
  const imgSrc = (product.imagePaths && product.imagePaths.length > 0)
    ? `${API_BASE}/${product.imagePaths[0]}`
    : (product.imagePath
        ? `${API_BASE}/${product.imagePath}`
        : "https://via.placeholder.com/600x400?text=No+Image");

  const handleCardClick = () => {
    navigate(`/products/${id}`);
  };

 const handleAddToCartClick = async (e) => {
     e.stopPropagation();
     if (stock === 0 || adding) return;
     setAdding(true);
     setError(null);
     
     const userId = getCurrentUserId();

     try {
       if (userId) {
         // Logged in: Use API
         // Pass 1 as default quantity, null for color/storage
         await apiAddToCart(userId, product.id, 1, null, null);
       } else {
         // Guest: Use Helper
         addToGuestCart(product);
       }
 
       setMessage("Item added to cart");
       setTimeout(() => setMessage(""), 2500);
     } catch (err) {
       console.error("Add to cart error:", err);
       
       if (err.status) {
         setError(err);
       } else {
         setError({
           status: 500,
           message: "Failed to Add Item",
           details: err.message || "An unexpected error occurred while adding the item to cart",
           timestamp: new Date().toISOString()
         });
       }
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
        } else {
            await apiAddToWishlist(userId, id);
            setLiked(true);
        }
    } catch (err) {
        console.error("Wishlist toggle fail", err);
    }
  };

  return (
    <div className="pc-card" onClick={handleCardClick}>
      <div className="pc-img-box">
        {onSale && (
          <div className="pc-sale-badge" style={{background: '#dc2626'}}>
            {saleLabel || (salePercentage ? `${Math.round(salePercentage)}% OFF` : 'SALE')}
          </div>
        )}
        <button
          className={`pc-wish-floating ${liked ? "pc-wish-active" : ""}`}
          onClick={toggleWishlist}
        >
          <FontAwesomeIcon icon={faHeart} />
        </button>
        <img src={imgSrc} className="pc-img" alt={name} />
      </div>

      <div className="pc-body">
        <div className="pc-header">
          <h3 className="pc-title">{name}</h3>
          <div className="pc-rating-compact">
            <FontAwesomeIcon icon={faStar} className="pc-star-icon" />
            <span>{safeRating.toFixed(1)}</span>
            <span style={{marginLeft: '8px', color: '#9ca3af', fontSize: '0.8rem'}}>•</span>
            <div style={{display: 'flex', alignItems: 'center', gap: '3px', marginLeft: '8px', color: '#6b7280', fontSize: '0.8rem'}}>
              <FontAwesomeIcon icon={faEye} />
              <span>{totalViews || 0}</span>
            </div>
          </div>
        </div>

        <p className="pc-desc-short">
          {shortDescription || description}
        </p>

        <div className="pc-price-box">
          {onSale ? (
            <>
              <span className="pc-price-new" style={{color: '#dc2626'}}>₹{Number(displayPrice).toFixed(2)}</span>
              <span className="pc-price-old">₹{Number(safePrice).toFixed(2)}</span>
            </>
          ) : (
            <span className="pc-price-new">₹{Number(safePrice).toFixed(2)}</span>
          )}
        </div>

        <button className="pc-btn-add" onClick={handleAddToCartClick} disabled={stock === 0 || adding}>
          {adding ? "Adding..." : (stock === 0 ? "Out of Stock" : "Add to Cart")}
        </button>
        {message && <div style={{color: 'green', fontSize: '0.8rem', marginTop: '5px'}}>{message}</div>}
        {error && <div style={{color: 'red', fontSize: '0.8rem', marginTop: '5px'}}>{error.message}</div>}
      </div>
    </div>
  );
}

export default ProductCard;
