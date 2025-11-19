import React from "react";
import { API_BASE } from "../config/config";
import "./ProductCard.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faHeart, faStar } from "@fortawesome/free-solid-svg-icons";
import { useNavigate } from "react-router-dom";

function ProductCard({ product, onAddToCart }) {
  const navigate = useNavigate();

  const {
    id,
    name,
    description,
    shortDescription,
    price,
    category,
    imagePath,
    stock,
    totalLikes,
    totalViews,
    averageRating,
    ratingCount,
    status,
    visible,
    onSale,
    discountPercent,
    salePrice,
  } = product;

  const safeName = name || "Unnamed Product";
  const safePrice = price ?? 0;
  const safeStock = stock ?? 0;
  const safeLikes = totalLikes ?? 0;
  const safeViews = totalViews ?? 0;
  const safeRating = averageRating ?? 0;
  const safeRatingCount = ratingCount ?? 0;
  const inStock = safeStock > 0 && (visible ?? true) && status === "ACTIVE";

  const imgSrc = imagePath
    ? `${API_BASE}/product-images/${imagePath}`
    : "https://via.placeholder.com/600x400?text=No+Image";

  const ratingInt = Math.round(safeRating);

  // Open product page on card click
  const handleCardClick = () => {
    if (!id) return;
    navigate(`/products/${id}`);
  };

  // Add to Cart button
  const handleAddToCartClick = async (e) => {
    e.stopPropagation(); 
    e.preventDefault();

    if (!inStock) return;

    // Add item
    if (onAddToCart) {
      await onAddToCart();
    }

    // Update navbar count
    const prev = Number(localStorage.getItem("cartCount")) || 0;
    localStorage.setItem("cartCount", prev + 1);

    window.dispatchEvent(new Event("cart-updated"));

    // Redirect to cart
    navigate("/cart");
  };

  return (
    <div
      className="pc-card"
      onClick={handleCardClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.target.classList.contains("add-cart-btn")) return;
        if (e.key === "Enter") handleCardClick();
      }}
    >
      <div className="pc-image-shell">
        <img src={imgSrc} alt={safeName} className="pc-image" />

        {category && <span className="pc-chip pc-chip-category">{category}</span>}

        <span
          className={`pc-chip pc-chip-stock ${
            inStock ? "pc-chip-green" : "pc-chip-red"
          }`}
        >
          {inStock ? "In stock" : "Out of stock"}
        </span>

        {onSale && salePrice > 0 && (
          <span className="pc-chip pc-chip-sale">
            {discountPercent ? `-${discountPercent}%` : "Sale"}
          </span>
        )}
      </div>

      <div className="pc-card-body">
        <h3 className="pc-title">{safeName}</h3>

        <p className="pc-description">
          {shortDescription || description || ""}
        </p>

        <div className="pc-rating-row">
          <div className="pc-stars">
            {Array.from({ length: 5 }).map((_, i) => (
              <span
                key={i}
                className={i < ratingInt ? "pc-star pc-star-full" : "pc-star pc-star-empty"}
              >
                <FontAwesomeIcon icon={faStar} />
              </span>
            ))}
          </div>
          <span className="pc-rating-count">
            {safeRating.toFixed(1)} ({safeRatingCount})
          </span>
        </div>

        <div className="pc-meta-row">
          <span className="pc-meta-item">
            <FontAwesomeIcon icon={faHeart} /> {safeLikes}
          </span>
          <span className="pc-meta-item">
            <FontAwesomeIcon icon={faEye} /> {safeViews}
          </span>
        </div>

        <div className="pc-bottom-row">
          <div className="pc-price-block">
            {onSale && salePrice > 0 ? (
              <>
                <span className="pc-price pc-price-sale">${salePrice.toFixed(2)}</span>
                <span className="pc-price pc-price-original">${safePrice.toFixed(2)}</span>
              </>
            ) : (
              <span className="pc-price">${safePrice.toFixed(2)}</span>
            )}
          </div>

          {/* FIXED NON-BUBBLING WRAPPER */}
          <div onClick={(e) => e.stopPropagation()} style={{ width: "100%" }}>
            <button
              className="pc-btn add-cart-btn"
              disabled={!inStock}
              onClick={handleAddToCartClick}
            >
              {inStock ? "Add to cart" : "Unavailable"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProductCard;
