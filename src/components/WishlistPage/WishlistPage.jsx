import React, { useEffect, useState } from "react";
import { API_BASE } from "../config/config";
import { useNavigate } from "react-router-dom";
import { getCurrentUserId, apiAddToCart } from "../AddCart/cartUtils";
import { apiGetWishlist, apiRemoveFromWishlist } from "./wishlistUtils";
import Toast from "../Toast/Toast";
import { X, Search, ShoppingCart } from "lucide-react";
import "./WishlistPage.css";

function WishlistPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState({ message: '', type: 'info', visible: false });

  const navigate = useNavigate();

  const showToast = (message, type = 'info') => {
    setToast({ message, type, visible: true });
  };

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
      showToast("Removed from wishlist", "info");
    } catch (e) {
      console.error(e);
      showToast("Failed to remove item", "error");
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
      showToast("Added to cart!", "success");
      setTimeout(() => navigate("/cart"), 1000);
    } catch (err) {
      console.error("Buy Now failed", err);
      showToast(err.message || "Unable to add product to cart", "error");
    }
  };

  const formatPrice = (n) => {
    if (n == null) return "";
    return `Rs. ${n.toLocaleString()}`;
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

      <div className="wl-table-container">
        <table className="wl-table">
          <thead>
            <tr>
              <th className="wl-col-product">PRODUCT</th>
              <th className="wl-col-price">PRICE</th>
              <th className="wl-col-stock">STOCK STATUS</th>
              <th className="wl-col-actions">ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => {
              const imgSrc = item.imagePath
                ? `${API_BASE}/${item.imagePath}`
                : "https://via.placeholder.com/100?text=No+Image";

              const stockStatus = item.stockQuantity > 0 ? "In stock" : "Out of stock";
              const isOutOfStock = item.stockQuantity <= 0;

              return (
                <tr key={item.id} className="wl-table-row">
                  <td className="wl-col-product">
                    <div className="wl-product-cell">
                      <div className="wl-img-wrapper">
                        <img src={imgSrc} alt={item.name} className="wl-thumbnail" />
                        <button 
                          className="wl-remove-btn" 
                          onClick={() => handleRemove(item.productId)}
                          title="Remove from wishlist"
                        >
                          <X size={14} />
                        </button>
                      </div>
                      <span className="wl-product-name" onClick={() => handleOpenProduct(item.productId)}>
                        {item.name}
                      </span>
                    </div>
                  </td>
                  <td className="wl-col-price">
                    <span className="wl-price-text">{formatPrice(item.price)}</span>
                  </td>
                  <td className="wl-col-stock">
                    <span className={`wl-stock-badge ${isOutOfStock ? 'out' : 'in'}`}>
                      {stockStatus}
                    </span>
                  </td>
                  <td className="wl-col-actions">
                    <div className="wl-action-buttons">
                      <button 
                        className="wl-action-btn wl-quickview-btn"
                        onClick={() => handleOpenProduct(item.productId)}
                      >
                        QUICK VIEW
                      </button>
                      <button 
                        className="wl-action-btn wl-addcart-btn"
                        onClick={() => handleBuyNow(item)}
                        disabled={isOutOfStock}
                      >
                        {isOutOfStock ? "STAY TUNED" : "ADD TO CART"}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
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

export default WishlistPage;
