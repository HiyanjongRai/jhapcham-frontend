import React, { useState } from "react";
import { API_BASE } from "../config/config";
import "./ProductCard.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faHeart, faStar } from "@fortawesome/free-solid-svg-icons";
import { useNavigate } from "react-router-dom";
import { getCurrentUserId } from "../AddCart/cartUtils";

function ProductCard({ product, onAddToCart }) {
  const navigate = useNavigate();
  const [liked, setLiked] = useState(false);

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
  } = product;

  const safePrice = price ?? 0;
  const safeSalePrice = salePrice ?? safePrice;
  const safeStock = stock ?? 0;
  const safeRating = averageRating ?? 0;
  const safeRatingCount = ratingCount ?? 0;
  const safeViews = totalViews ?? 0;
  const safeLikes = totalLikes ?? 0;

  const inStock = safeStock > 0 && (visible ?? true) && status === "ACTIVE";

  const imgSrc = imagePath
    ? `${API_BASE}/product-images/${imagePath}`
    : "https://via.placeholder.com/600x400?text=No+Image";

  const ratingInt = Math.round(safeRating);

  const handleCardClick = () => {
    navigate(`/products/${id}`);
  };

  const handleAddToCartClick = async (e) => {
    e.stopPropagation();

    if (onAddToCart) await onAddToCart();

    const prev = Number(localStorage.getItem("cartCount")) || 0;
    localStorage.setItem("cartCount", prev + 1);
    window.dispatchEvent(new Event("cart-updated"));

    navigate("/cart");
  };

  const toggleWishlist = async (e) => {
    e.stopPropagation();
    const userId = getCurrentUserId();
    if (!userId) return navigate("/login");

    const res = await fetch(
      `${API_BASE}/wishlist/toggle?userId=${userId}&productId=${id}`,
      { method: "POST" }
    );

    if (!res.ok) {
      console.log("Wishlist failed at backend");
      return;
    }

    setLiked(!liked);
  };

  return (
    <div className="pc-card" onClick={handleCardClick}>
      <div className="pc-img-box">
        {onSale && <div className="pc-sale-badge">SALE</div>}
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
          </div>
        </div>

        <p className="pc-desc-short">
          {(shortDescription || description)?.slice(0, 50)}
          {(shortDescription || description)?.length > 50 ? "..." : ""}
        </p>

        <div className="pc-price-box">
          {onSale ? (
            <>
              <span className="pc-price-new">${safeSalePrice.toFixed(2)}</span>
              <span className="pc-price-old">${safePrice.toFixed(2)}</span>
            </>
          ) : (
            <span className="pc-price-new">${safePrice.toFixed(2)}</span>
          )}
        </div>

        <button className="pc-btn-add" onClick={handleAddToCartClick}>
          Add to Cart
        </button>
      </div>
    </div>
  );
}

export default ProductCard;
