// src/components/productCard/ProductDetailPage.jsx

import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { API_BASE } from "../config/config";
import "./ProductDetailPage.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faStar } from "@fortawesome/free-solid-svg-icons";

import {
  getCurrentUserId,
  loadGuestCart,
  saveGuestCart,
  apiAddItem,
} from "../AddCart/cartUtils";

function ProductDetailPage() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [message, setMessage] = useState("");

  const userId = getCurrentUserId();
  const isLoggedIn = !!userId;

  // ---------------------------------------------------------
  // LOG PRODUCT VIEW
  // ---------------------------------------------------------
  const logView = async (productId) => {
    try {
      let anonKey = localStorage.getItem("anonKey");
      if (!anonKey) {
        anonKey = crypto.randomUUID();
        localStorage.setItem("anonKey", anonKey);
      }

      const url = userId
        ? `${API_BASE}/api/views/log?productId=${productId}&userId=${userId}`
        : `${API_BASE}/api/views/log?productId=${productId}&anonKey=${anonKey}`;

      await fetch(url, { method: "POST" });
    } catch (err) {
      console.log("View logging failed", err);
    }
  };

  // ---------------------------------------------------------
  // LOAD PRODUCT + REVIEWS
  // ---------------------------------------------------------
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);

        // Load product
        const res = await fetch(`${API_BASE}/api/products/${id}`);
        const data = await res.json();
        setProduct(data);

        // Log product view
        logView(data.id);

        // Load reviews
        const revRes = await fetch(`${API_BASE}/api/reviews/product/${id}`);
        const reviewData = await revRes.json();
        setReviews(reviewData);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id]);

  if (loading) return <div className="pd-wrapper">Loading...</div>;
  if (!product) return <div className="pd-wrapper">Product not found</div>;

  // ---------------------------------------------------------
  // ADD TO CART FUNCTION
  // ---------------------------------------------------------
  const handleAddToCart = async () => {
    if (quantity <= 0) return;
    setAdding(true);

    try {
      if (isLoggedIn) {
        await apiAddItem(userId, {
          productId: product.id,
          quantity,
        });
      } else {
        const cart = loadGuestCart();
        const idx = cart.findIndex((c) => c.productId === product.id);

        if (idx >= 0) {
          cart[idx].quantity += quantity;
          cart[idx].lineTotal = cart[idx].unitPrice * cart[idx].quantity;
        } else {
          cart.push({
            productId: product.id,
            name: product.name,
            quantity,
            unitPrice: product.price,
            lineTotal: product.price * quantity,
            imagePath: `${API_BASE}/product-images/${product.imagePath}`,
          });
        }

        saveGuestCart(cart);
      }

      setMessage("Added to cart");
    } catch (e) {
      setMessage("Failed to add");
    } finally {
      setAdding(false);
      setTimeout(() => setMessage(""), 2000);
    }
  };

  // ---------------------------------------------------------
  // RENDER PAGE
  // ---------------------------------------------------------
  return (
    <div className="pd-wrapper">
      <div className="pd-main">

        {/* LEFT: PRODUCT IMAGE */}
        <div className="pd-gallery">
          <img
            className="pd-main-image"
            src={`${API_BASE}/product-images/${product.imagePath}`}
            alt={product.name}
          />
        </div>

        {/* RIGHT: PRODUCT INFO */}
        <div className="pd-info">
          <h1 className="pd-title">{product.name}</h1>

          {/* Rating */}
          <div className="pd-rating-row">
            <div className="pd-stars">
              {Array.from({ length: 5 }).map((_, i) => (
                <span
                  key={i}
                  className={
                    i < Math.round(product.averageRating || 0)
                      ? "pd-star pd-star-full"
                      : "pd-star pd-star-empty"
                  }
                >
                  <FontAwesomeIcon icon={faStar} />
                </span>
              ))}
            </div>

            <span className="pd-rating-text">
              {product.averageRating?.toFixed(1) || "0.0"} (
              {product.ratingCount || 0} reviews)
            </span>
          </div>

          {/* Price */}
          <div className="pd-price-block">
            <span className="pd-price">${product.price?.toFixed(2)}</span>
          </div>

          {/* Quantity */}
          <div className="pd-section pd-actions-row">
            <div className="pd-qty-block">
              <span>Quantity</span>
              <input
                type="number"
                min={1}
                value={quantity}
                onChange={(e) =>
                  setQuantity(Math.max(1, Number(e.target.value)))
                }
              />
            </div>

            <button
              className="pd-btn-primary"
              disabled={adding}
              onClick={handleAddToCart}
            >
              {adding ? "Adding..." : "Add to Cart"}
            </button>
          </div>

          {message && <div className="pd-message">{message}</div>}

          {/* Description */}
          <div className="pd-section">
            <h3>Description</h3>
            <p>{product.description}</p>
          </div>

          {/* ------------ REVIEWS SECTION --------------- */}
          <div className="review-section">
            <h2>Customer Reviews</h2>

            {reviews.length === 0 && (
              <p>No reviews yet. Be the first to review.</p>
            )}

            {reviews.map((r) => (
              <div key={r.id} className="review-box">
                <div className="review-header">
                  ⭐ <strong>{r.rating}/5</strong>
                </div>

                {r.comment && (
                  <p className="review-comment">{r.comment}</p>
                )}

                {r.images?.length > 0 && (
                  <div className="review-images">
                    {r.images.map((img, index) => (
                      <img
                        key={index}
                        src={`${API_BASE}/${img}`}  
                        alt="review"
                        className="review-img"
                      />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

        </div>
      </div>
    </div>
  );
}

export default ProductDetailPage;
