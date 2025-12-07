import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { API_BASE } from "../config/config";
import { 
  Star, 
  Heart, 
  ShoppingCart, 
  Minus, 
  Plus, 
  Store, 
  ChevronRight,
  Share2,
  MessageCircle
} from "lucide-react";
import {
  getCurrentUserId,
  loadGuestCart,
  saveGuestCart,
} from "../AddCart/cartUtils";
import MessageModal from "../Message/MessageModal";
import ErrorToast from "../ErrorToast/ErrorToast";
import "./ProductDetailModern.css";

export default function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [mainImage, setMainImage] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState(null);

  const [selectedColor, setSelectedColor] = useState(null);
  const [selectedStorage, setSelectedStorage] = useState(null);
  const [showMessageModal, setShowMessageModal] = useState(false);

  const userId = getCurrentUserId();
  const viewLogged = useRef(false);

  // Log View
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
    } catch { }
  };

  // Load Data
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);

        // Load product
        const res = await fetch(`${API_BASE}/api/products/${id}`);
        const data = await res.json();
        setProduct(data);
        setMainImage(`${API_BASE}/product-images/${data.imagePath}`);

        if (data.colors?.length) setSelectedColor(data.colors[0]);
        if (data.storage?.length) setSelectedStorage(data.storage[0]);

        // Log view
        if (!viewLogged.current) {
          logView(data.id);
          viewLogged.current = true;
        }

        // Load reviews
        const rev = await fetch(`${API_BASE}/api/reviews/product/${id}`);
        const revData = await rev.json();
        setReviews(revData);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id]);

  if (loading) return <div className="pd-container" style={{textAlign: 'center', paddingTop: '4rem'}}>Loading...</div>;
  if (!product) return <div className="pd-container" style={{textAlign: 'center', paddingTop: '4rem'}}>Product Not Found</div>;

  // Handlers
  const increaseQty = () => setQuantity(quantity + 1);
  const decreaseQty = () => setQuantity(Math.max(1, quantity - 1));

  const apiAddItem = async (userId, item) => {
    const url = `${API_BASE}/api/cart/add`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(item),
    });

    if (!res.ok) {
      // Parse backend error response
      try {
        const errorData = await res.json();
        throw {
          status: res.status,
          message: errorData.message || 'Failed to add to cart',
          details: errorData.details || errorData.error || res.statusText,
          errors: errorData.errors || {},
          timestamp: errorData.timestamp || new Date().toISOString(),
          path: errorData.path || url,
          trace: errorData.trace
        };
      } catch (e) {
        if (e.status) throw e;
        throw {
          status: res.status,
          message: 'Failed to add to cart',
          details: await res.text().catch(() => 'Unknown error'),
          timestamp: new Date().toISOString(),
          path: url
        };
      }
    }
  };

  const handleAddToCart = async () => {
    if (product.stock === 0) return;
    setAdding(true);
    setError(null); // Clear previous errors

    try {
      const item = {
        userId: userId,
        productId: product.id,
        quantity,
        unitPrice: product.price,
        lineTotal: product.price * quantity,
        color: selectedColor,
        storage: selectedStorage,
      };

      if (userId) {
        await apiAddItem(userId, item);
      } else {
        const cart = loadGuestCart();
        const idx = cart.findIndex(
          (c) =>
            c.productId === item.productId &&
            c.color === item.color &&
            c.storage === item.storage
        );

        if (idx >= 0) {
          cart[idx].quantity += quantity;
          cart[idx].lineTotal = cart[idx].unitPrice * cart[idx].quantity;
        } else {
          cart.push(item);
        }
        saveGuestCart(cart);
      }

      setMessage("Item added to cart");
      setTimeout(() => setMessage(""), 2500);
    } catch (err) {
      console.error("Add to cart error:", err);
      
      // Display error using ErrorToast
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

  return (
    <>
      {/* Error Toast Notification */}
      <ErrorToast error={error} onClose={() => setError(null)} />

      <div className="pd-container">
        {message && (
          <div style={{
            position: 'fixed', top: '20px', right: '20px', 
            background: '#000', color: '#fff', padding: '1rem 2rem', 
            borderRadius: '8px', zIndex: 1000, animation: 'fadeIn 0.3s'
          }}>
            {message}
          </div>
        )}

      <div className="pd-grid">
        {/* Left: Image Gallery */}
        <div className="pd-gallery">
          <div className="pd-main-image-wrapper">
            <img src={mainImage} className="pd-main-image" alt={product.name} />
          </div>
          <div className="pd-thumbnails">
            {[product.imagePath, ...(product.additionalImages || [])].map((img, i) => (
              <img
                key={i}
                src={`${API_BASE}/product-images/${img}`}
                className={`pd-thumb ${mainImage.includes(img) ? "active" : ""}`}
                onClick={() => setMainImage(`${API_BASE}/product-images/${img}`)}
                alt="thumbnail"
              />
            ))}
          </div>
        </div>

        {/* Right: Product Info */}
        <div className="pd-info">
          <div>
            <div className="pd-brand">{product.brand}</div>
            <h1 className="pd-title">{product.name}</h1>
            

            


          <div className="stock">
              {product.stock > 0 ? (
              <p style={{ color: "green" , marginTop : "10px", marginBottom : "10px" , fontWeight : "bold" , fontSize: "20px" }}>In Stock : {product.stock}</p>) : (
              <p style={{ color: "red" }}>Out of Stock</p>)}
          </div>
  
            <div className="pd-rating">
              <div className="pd-stars">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    size={18}
                    fill={i < Math.round(product.rating) ? "#fbbf24" : "none"}
                    color={i < Math.round(product.rating) ? "#fbbf24" : "#d1d5db"}
                  />
                ))}
              </div>
              <span className="pd-review-count">({reviews.length} reviews)</span>
            </div>
          </div>

          <div className="pd-price-block">
            {product.onSale ? (
              <>
                <span className="pd-price">₹{product.salePrice}</span>
                <span className="pd-old-price">₹{product.price}</span>
                <span className="pd-discount">-{product.discountPercent}%</span>
              </>
            ) : (
              <span className="pd-price">₹{product.price}</span>
            )}
          </div>

          <p className="pd-description">{product.shortDescription}</p>

          <div className="pd-options">
            {product.colors?.length > 0 && (
              <div className="pd-option-group">
                <span className="pd-option-label">Select Color</span>
                <div className="pd-option-values">
                  {product.colors.map((c) => (
                    <button
                      key={c}
                      className={`pd-opt-btn ${selectedColor === c ? "active" : ""}`}
                      onClick={() => setSelectedColor(c)}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {product.storage?.length > 0 && (
              <div className="pd-option-group">
                <span className="pd-option-label">Storage</span>
                <div className="pd-option-values">
                  {product.storage.map((s) => (
                    <button
                      key={s}
                      className={`pd-opt-btn ${selectedStorage === s ? "active" : ""}`}
                      onClick={() => setSelectedStorage(s)}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="pd-actions">
            <div className="pd-qty-wrapper">
              <button className="pd-qty-btn" onClick={decreaseQty} disabled={product.stock === 0}><Minus size={16} /></button>
              <span className="pd-qty-val">{quantity}</span>
              <button className="pd-qty-btn" onClick={increaseQty} disabled={product.stock === 0}><Plus size={16} /></button>
            </div>

            <button 
              className="pd-add-btn" 
              onClick={handleAddToCart}
              disabled={product.stock === 0 || adding}
              style={{ opacity: product.stock === 0 ? 0.5 : 1 }}
            >
              <ShoppingCart size={20} />
              {product.stock === 0 ? "Out of Stock" : adding ? "Adding..." : "Add to Cart"}
            </button>

            <button 
              className="pd-wish-btn" 
              onClick={() => setShowMessageModal(true)}
              title="Ask Seller"
            >
              <MessageCircle size={24} />
            </button>

            <button className="pd-wish-btn">
              <Heart size={24} />
            </button>
          </div>

          {/* Seller Card */}
          <div className="pd-seller-card" onClick={() => navigate(`/seller/${product.sellerId}`)}>
            <div className="pd-seller-avatar">
              <Store size={32} color="#4b5563" />
            </div>
            <div className="pd-seller-info" style={{ flex: 1 }}>
              <p>Sold by</p>
              <h3>{product.sellerStoreName}</h3>
              <p>{product.sellerStoreAddress}</p>
            </div>
            <ChevronRight color="#9ca3af" />
          </div>
        </div>
      </div>

      {/* Reviews Section */}
      <div className="pd-reviews-section">
        <div className="pd-reviews-header">
          <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '1rem' }}>Customer Reviews</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span style={{ fontSize: '3rem', fontWeight: '800' }}>{product.rating}</span>
            <div>
              <div className="pd-stars">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    size={20}
                    fill={i < Math.round(product.rating) ? "#fbbf24" : "none"}
                    color={i < Math.round(product.rating) ? "#fbbf24" : "#d1d5db"}
                  />
                ))}
              </div>
              <p style={{ margin: 0, color: '#6b7280' }}>Based on {reviews.length} reviews</p>
            </div>
          </div>
        </div>

        <div className="pd-reviews-list">
          {reviews.map(r => (
            <div className="pd-review-card" key={r.id}>
              <div className="pd-review-user">
                <img
                  src={r.reviewerProfileImage ? `${API_BASE}/${r.reviewerProfileImage}` : "https://via.placeholder.com/40"}
                  className="pd-review-avatar"
                  alt={r.reviewerName}
                />
                <div>
                  <div style={{ fontWeight: '600' }}>{r.reviewerName}</div>
                  <div className="pd-stars" style={{ fontSize: '0.8rem' }}>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        size={14}
                        fill={i < r.rating ? "#fbbf24" : "none"}
                        color={i < r.rating ? "#fbbf24" : "#d1d5db"}
                      />
                    ))}
                  </div>
                </div>
              </div>
              <p className="pd-review-content">{r.comment}</p>
              {r.images?.length > 0 && (
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                  {r.images.map((img, i) => (
                    <img key={i} src={`${API_BASE}/${img}`} alt="review" style={{ width: 80, height: 80, borderRadius: 8, objectFit: 'cover' }} />
                  ))}
                </div>
              )}
            </div>
          ))}
          {reviews.length === 0 && <p style={{ color: '#6b7280' }}>No reviews yet. Be the first to review!</p>}
        </div>
      </div>

      {/* Message Modal */}
      <MessageModal
        isOpen={showMessageModal}
        onClose={() => setShowMessageModal(false)}
        type="product"
        recipientId={product.sellerId}
        recipientName={product.sellerStoreName}
        productId={product.id}
        productName={product.name}
      />
      </div>
    </>
  );
}
