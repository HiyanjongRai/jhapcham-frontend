// src/components/productCard/ProductCard.jsx
import React from "react";
import { API_BASE } from "../config/config";
import "./ProductCard.css";

function ProductCard({ product }) {
  const {
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
  } = product;

  const safeName = name || "Unnamed product";
  const safePrice = typeof price === "number" ? price : 0;
  const safeStock = stock ?? 0;
  const safeLikes = totalLikes ?? 0;
  const safeViews = totalViews ?? 0;
  const safeRating = typeof averageRating === "number" ? averageRating : 0;
  const safeRatingCount = ratingCount ?? 0;
  const isVisible = visible ?? true;
  const inStock = safeStock > 0 && isVisible && status === "ACTIVE";

  const imgSrc = imagePath
    ? `${API_BASE}/api/products/images/${imagePath}`
    : "https://via.placeholder.com/600x400?text=No+Image";

  const displayDescription =
    shortDescription && shortDescription.trim().length > 0
      ? shortDescription.trim()
      : description
      ? description.length > 80
        ? description.slice(0, 80) + "..."
        : description
      : "";

  const ratingInt = Math.round(safeRating);

  return (
    <div className="pc-card">
      {/* IMAGE */}
      <div className="pc-image-shell">
        <img src={imgSrc} alt={safeName} className="pc-image" />

        {category && (
          <span className="pc-chip pc-chip-category">{category}</span>
        )}

        <span
          className={`pc-chip pc-chip-stock ${
            inStock ? "pc-chip-green" : "pc-chip-red"
          }`}
        >
          {inStock ? "In stock" : "Out of stock"}
        </span>
      </div>

      {/* BODY */}
      <div className="pc-card-body">
        <h3 className="pc-title">{safeName}</h3>

        {displayDescription && (
          <p className="pc-description">{displayDescription}</p>
        )}

        {/* Rating */}
        <div className="pc-rating-row">
          <div className="pc-stars">
            {Array.from({ length: 5 }).map((_, i) => (
              <span
                key={i}
                className={
                  i < ratingInt
                    ? "pc-star pc-star-full"
                    : "pc-star pc-star-empty"
                }
              >
                ★
              </span>
            ))}
          </div>
          <span className="pc-rating-count">
            {safeRating.toFixed(1)} ({safeRatingCount})
          </span>
        </div>

        {/* Meta */}
        <div className="pc-meta-row">
          <span className="pc-meta-item">♥ {safeLikes}</span>
          <span className="pc-meta-item">👁 {safeViews}</span>
        </div>

        {/* Price + Button */}
        <div className="pc-bottom-row">
          <div className="pc-price-block">
            <span className="pc-price">${safePrice.toFixed(2)}</span>
          </div>

          <button
            className="pc-btn"
            disabled={!inStock}
            aria-label="Add to cart"
          >
            {inStock ? "Add to cart" : "Unavailable"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ProductCard;
