import React, { useEffect, useState } from "react";
import { API_BASE } from "../config/config";
import { useNavigate } from "react-router-dom";
import { getCurrentUserId, apiAddToCart } from "../AddCart/cartUtils";
import { apiGetWishlist, apiRemoveFromWishlist } from "./wishlistUtils";
import "./WishlistPage.css";

function WishlistPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const navigate = useNavigate();

  const loadWishlist = async () => {
    const userId = getCurrentUserId();
    if (!userId) {
      navigate("/login");
      return;
    }

    try {
      const data = await apiGetWishlist(userId);
      
      // Map DTO to frontend format (ensure imagePath matches)
      const mapped = Array.isArray(data) ? data.map(dto => ({
        ...dto,
        productId: dto.id, // Ensure productId is available
        imagePath: (dto.imagePaths && dto.imagePaths.length > 0) ? dto.imagePaths[0] : (dto.imagePath || ""),
        rating: dto.averageRating || 0,
        views: dto.totalViews || 0
      })) : [];

      setItems(mapped);
    } catch (e) {
      console.error(e);
      setError("Unable to load wishlist.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWishlist();
  }, []);

  const handleRemove = async (productId) => {
    const userId = getCurrentUserId();
    if (!userId) return;

    try {
      await apiRemoveFromWishlist(userId, productId);
      setItems((prev) => prev.filter((it) => it.id !== productId && it.productId !== productId));
    } catch (e) {
      console.error(e);
      alert("Failed to remove item");
    }
  };

  const handleOpenProduct = (productId) => {
    navigate(`/products/${productId}`);
  };

  const handleBuyNow = async (product) => {
    const userId = getCurrentUserId();
    if (!userId) {
      navigate("/login");
      return;
    }

    try {
      await apiAddToCart(userId, product.productId, 1, null, null);
      navigate("/cart");
    } catch (err) {
      console.error("Buy Now failed", err);
      alert(err.message || "Unable to add product to cart");
    }
  };

  const formatPrice = (n) => {
    if (n == null) return "";
    return `Rs. ${n.toFixed(2)}`;
  };

  if (loading) {
    return (
      <div className="wl-page">
        <h2 className="wl-title">My Wishlist</h2>
        <p>Loading wishlist...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="wl-page">
        <h2 className="wl-title">My Wishlist</h2>
        <p className="wl-error">{error}</p>
      </div>
    );
  }

  if (!items.length) {
    return (
      <div className="wl-page">
        <h2 className="wl-title">My Wishlist</h2>
        <p>Your wishlist is empty.</p>
      </div>
    );
  }

  return (
    <div className="wl-page">
      <h2 className="wl-title">My Wishlist</h2>

      <div className="wl-grid">
        {items.map((item) => {
          const imgSrc = item.imagePath
            ? `${API_BASE}/${item.imagePath}`
            : "https://via.placeholder.com/400x260?text=No+Image";

          const rating = item.rating ?? 0;
          const views = item.views ?? 0;

          const hasDiscount =
            item.salePrice != null &&
            item.salePrice > 0 &&
            item.discountPercent != null;

          return (
            <div key={item.id} className="wl-card">
              <div className="wl-img-wrap" onClick={() => handleOpenProduct(item.productId)}>
                <img src={imgSrc} alt={item.name || "Product"} className="wl-img" />

                {hasDiscount && (
                  <span className="wl-badge-sale">-{item.discountPercent}%</span>
                )}
              </div>

              <div className="wl-body">
                <h3 className="wl-name">{item.name}</h3>

                {item.shortDescription && (
                  <p className="wl-short">{item.shortDescription}</p>
                )}

                <div className="wl-row wl-meta">
                  <span className="wl-rating">⭐ {rating.toFixed(1)}</span>
                  <span className="wl-views">👁 {views}</span>
                </div>

                <div className="wl-row wl-price-row">
                  {hasDiscount ? (
                    <>
                      <span className="wl-price-sale">
                        {formatPrice(item.salePrice)}
                      </span>
                      <span className="wl-price-original">
                        {formatPrice(item.price)}
                      </span>
                    </>
                  ) : (
                    <span className="wl-price">{formatPrice(item.price)}</span>
                  )}
                </div>

                <div className="wl-row wl-actions">
                  <button
                    className="wl-btn wl-btn-primary"
                    onClick={() => handleOpenProduct(item.productId)}
                  >
                    View
                  </button>

                  <button
                    className="wl-btn wl-btn-green"
                    onClick={() => handleBuyNow(item)}
                  >
                    Buy Now
                  </button>

                  <button
                    className="wl-btn wl-btn-ghost"
                    onClick={() => handleRemove(item.productId)}
                  >
                    Remove
                  </button>
                </div>

              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default WishlistPage;
