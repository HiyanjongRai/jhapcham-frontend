import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
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
  MessageCircle,
  Flag
} from "lucide-react";
import {
  getCurrentUserId,
  loadGuestCart,
  saveGuestCart,
  apiAddToCart,
} from "../AddCart/cartUtils";
import { apiAddToWishlist, apiRemoveFromWishlist, apiCheckWishlist } from "../WishlistPage/wishlistUtils";
import MessageModal from "../Message/MessageModal";
import ReportModal from "../Report/ReportModal";
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
  const [liked, setLiked] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);
  const [selectedStorage, setSelectedStorage] = useState(null);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);

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

        // Load product with userId for view tracking
        const res = await fetch(`${API_BASE}/api/products/${id}?userId=${userId || ''}`);
        const data = await res.json();
        
        // Map ProductDetailDTO to frontend format
        const mappedProduct = {
          ...data,
          id: data.productId || data.id,
          imagePath: data.imagePaths && data.imagePaths.length > 0 ? data.imagePaths[0] : "",
          additionalImages: data.imagePaths || [],
          stock: data.stockQuantity || 0,
          colors: (() => {
            if (Array.isArray(data.colorOptions)) return data.colorOptions;
            if (typeof data.colorOptions !== 'string') return [];
            try {
              const res = JSON.parse(data.colorOptions);
              return Array.isArray(res) ? res : [];
            } catch { 
              return data.colorOptions.split(',').map(s => s.trim()).filter(Boolean);
            }
          })(),
          storage: (() => {
            if (Array.isArray(data.storageSpec)) return data.storageSpec;
            if (typeof data.storageSpec !== 'string') return [];
            try {
              const res = JSON.parse(data.storageSpec);
              return Array.isArray(res) ? res : [];
            } catch { 
              return data.storageSpec.split(',').map(s => s.trim()).filter(Boolean);
            }
          })(),
          rating: data.averageRating || 0,
          sellerId: data.sellerUserId,
          sellerStoreName: data.storeName,
          sellerStoreAddress: data.storeAddress,
          specification: data.specification || "",
          salePrice: data.salePrice !== null ? data.salePrice : (data.discountPrice ?? data.price),
          discountPercent: data.salePercentage || 0,
          saleLabel: data.saleLabel,
          freeShipping: data.freeShipping || false,
          insideValleyShipping: data.insideValleyShipping,
          outsideValleyShipping: data.outsideValleyShipping,
          manufactureDate: data.manufactureDate,
          expiryDate: data.expiryDate,
          warrantyMonths: data.warrantyMonths,
          features: data.features,
          description: data.description,
        };
        
        setProduct(mappedProduct);
        setMainImage(`${API_BASE}/uploads/${mappedProduct.imagePath}`);

        if (mappedProduct.colors?.length) setSelectedColor(mappedProduct.colors[0]);
        if (mappedProduct.storage?.length) setSelectedStorage(mappedProduct.storage[0]);

        // Check wishlist status
        if (userId) {
            const isLiked = await apiCheckWishlist(userId, id);
            setLiked(isLiked);
        }

        // auto-view logging handled by backend now

        // Load reviews
        try {
          const rev = await fetch(`${API_BASE}/api/reviews/product/${id}`);
          if (rev.ok) {
            const revData = await rev.json();
            setReviews(Array.isArray(revData) ? revData : []);
          } else {
            setReviews([]);
          }
        } catch (revErr) {
          console.error("Failed to load reviews:", revErr);
          setReviews([]);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id, userId]);

  if (loading) return <div className="pd-container" style={{textAlign: 'center', paddingTop: '4rem'}}>Loading...</div>;
  if (!product) return <div className="pd-container" style={{textAlign: 'center', paddingTop: '4rem'}}>Product Not Found</div>;

  // Handlers
  const increaseQty = () => setQuantity(quantity + 1);
  const decreaseQty = () => setQuantity(Math.max(1, quantity - 1));

  const toggleWishlist = async () => {
    if (!userId) {
        navigate("/login");
        return;
    }
    try {
        if (liked) {
            await apiRemoveFromWishlist(userId, id);
            setLiked(false);
            setMessage("Removed from wishlist");
        } else {
            await apiAddToWishlist(userId, id);
            setLiked(true);
            setMessage("Added to wishlist");
        }
        setTimeout(() => setMessage(""), 2000);
    } catch (err) {
        console.error(err);
    }
  };

  const handleAddToCart = async () => {
    if (product.stock === 0 || adding) return;
    setAdding(true);
    setError(null);

    try {
      if (userId) {
        // Logged in: Use API
        await apiAddToCart(userId, product.id, quantity, selectedColor, selectedStorage);
      } else {
        // Guest: Local Logic
        const item = {
          userId: null,
          productId: product.id,
          name: product.name,
          imagePath: product.imagePath,
          quantity,
          unitPrice: product.price,
          lineTotal: product.price * quantity,
          color: selectedColor,
          storage: selectedStorage,
        };

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

  // Calculate Rating Distribution
  const ratingDist = [5, 4, 3, 2, 1].map(star => {
    const count = reviews.filter(r => Math.round(r.rating) === star).length;
    const percentage = reviews.length ? (count / reviews.length) * 100 : 0;
    return { star, count, percentage };
  });

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

      {/* Breadcrumb */}
      <div className="pd-breadcrumb">
         <Link to="/">Home</Link> 
         <ChevronRight size={14} />
         <Link to="/products">Products</Link>
         <ChevronRight size={14} />
         <span>{product.name}</span>
      </div>

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
                src={`${API_BASE}/uploads/${img}`}
                className={`pd-thumb ${mainImage.includes(img) ? "active" : ""}`}
                onClick={() => setMainImage(`${API_BASE}/uploads/${img}`)}
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
            
            


          <div className="pd-stock-status">
              {product.stock > 0 ? (
              <p className="status-in-stock">In Stock : {product.stock}</p>) : (
              <p className="status-out-stock">Out of Stock</p>)}
          </div>
  
            <div className="pd-rating">
              <div className="pd-stars">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    size={20}
                    fill={i < Math.round(product.rating) ? "#1a1a1a" : "none"}
                    color={i < Math.round(product.rating) ? "#1a1a1a" : "#d1d5db"}
                  />
                ))}
              </div>
              <span className="pd-review-count">({reviews.length} reviews)</span>
            </div>
          </div>

          <div className="pd-price-block">
            {product.onSale ? (
              <>
                <span className="pd-price-new">₹{product.salePrice}</span>
                <span className="pd-price-old">₹{product.price}</span>
                <span className="pd-discount-badge">
                  {product.saleLabel || `-${Math.round(product.discountPercent)}%`}
                </span>
              </>
            ) : (
              <span className="pd-price-new">₹{product.price}</span>
            )}
            {product.freeShipping && (
               <span className="pd-shipping-badge">
                  Free Shipping
               </span>
            )}
          </div>

          <p className="pd-description">{product.shortDescription}</p>
          
          {product.specification && (
            <div className="pd-section">
              <h4 className="pd-section-title">Specifications</h4>
              <p className="pd-text-content">{product.specification}</p>
            </div>
          )}

          {product.features && (
            <div className="pd-section">
              <h4 className="pd-section-title">Features</h4>
              <ul className="pd-features-list">
                {product.features.split('\n').map((f, i) => f.trim() && <li key={i}>{f}</li>)}
              </ul>
            </div>
          )}

          {product.description && (
             <div className="pd-section">
                <h4 className="pd-section-title">Description</h4>
                <p className="pd-text-content">{product.description}</p>
             </div>
          )}
          
          <div className="pd-meta-info">
             {product.warrantyMonths > 0 && <p className="meta-item"><strong>Warranty:</strong> {product.warrantyMonths} Months</p>}
             {product.expiryDate && <p className="meta-item"><strong>Expiry Date:</strong> {new Date(product.expiryDate).toLocaleDateString()}</p>}
             {product.manufactureDate && <p className="meta-item"><strong>Manufactured:</strong> {new Date(product.manufactureDate).toLocaleDateString()}</p>}
          </div>

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
              <button className="pd-qty-btn" onClick={decreaseQty} disabled={product.stock === 0}><Minus size={18} /></button>
              <span className="pd-qty-val">{quantity}</span>
              <button className="pd-qty-btn" onClick={increaseQty} disabled={product.stock === 0}><Plus size={18} /></button>
            </div>

            <button 
              className="pd-add-btn" 
              onClick={handleAddToCart}
              disabled={product.stock === 0 || adding}
            >
              <ShoppingCart size={20} />
              {product.stock === 0 ? "OUT OF STOCK" : adding ? "ADDING..." : "ADD TO CART"}
            </button>

            <button 
              className="pd-message-btn" 
              onClick={() => setShowMessageModal(true)}
              title="Ask Seller"
            >
              <MessageCircle size={24} />
            </button>

             <button 
              className="pd-message-btn" // Reusing styling for now, or add pd-report-btn
              onClick={() => setShowReportModal(true)}
              title="Report Product"
              style={{ color: '#ef4444', borderColor: '#ef4444' }}
            >
              <Flag size={24} />
            </button>

            <button 
              className="pd-wish-btn" 
              onClick={toggleWishlist}
              style={{ 
                  color: liked ? '#dc2626' : 'inherit',
                  borderColor: liked ? '#dc2626' : '#e5e7eb',
                  background: liked ? '#fef2f2' : 'white'
              }}
            >
              <Heart size={24} fill={liked ? "#dc2626" : "none"} />
            </button>
          </div>

          {/* Seller Card */}
          <div className="pd-seller-card" onClick={() => navigate(`/seller/${product.sellerId}`)}>
            <div className="pd-seller-avatar">
              <Store size={24} color="#1a1a1a" />
            </div>
            <div className="sellerProfile">

            </div>
            <div className="pd-seller-info">
              <p className="seller-label">Sold by</p>
              <h3>{product.sellerStoreName}</h3>
              <p className="seller-address">{product.sellerStoreAddress}</p>
            </div>
            <ChevronRight color="#1a1a1a" />
          </div>
        </div>
      </div>

      {/* Reviews Section */}
      <div className="pd-reviews-section">
        <div className="pd-reviews-header">
          <h2 className="section-title">Customer Reviews</h2>
          <div className="pd-rating-summary">
            <div className="pd-rating-hero">
                <span className="rating-number">{product.rating ? Math.round(product.rating * 10) / 10 : 0}</span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div className="pd-stars">
                        {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                            key={i}
                            size={20}
                            fill={i < Math.round(product.rating) ? "#1a1a1a" : "none"}
                            color={i < Math.round(product.rating) ? "#1a1a1a" : "#d1d5db"}
                        />
                        ))}
                    </div>
                     <p className="rating-count">{reviews.length} reviews</p>
                </div>
            </div>

            <div className="pd-rating-bars">
                {ratingDist.map(item => (
                    <div key={item.star} className="rating-bar-row">
                        <span className="star-label">{item.star} <Star size={10} fill="#666" stroke="none" /></span>
                        <div className="rating-track">
                            <div className="rating-fill" style={{ width: `${item.percentage}%` }}></div>
                        </div>
                        <span className="count-label">{item.count}</span>
                    </div>
                ))}
            </div>
          </div>
        </div>

        <div className="pd-reviews-list">
          {reviews.map(r => (
            <div className="pd-review-card" key={r.id}>
              <div className="pd-review-user">
                <img
                  src={r.userProfileImage 
                        ? (r.userProfileImage.startsWith('http') ? r.userProfileImage : `${API_BASE}/uploads/${r.userProfileImage}`) 
                        : "https://via.placeholder.com/40"}
                  className="pd-review-avatar"
                  alt={r.userName || "User"}
                />
                <div>
                  <div style={{ fontWeight: '600' }}>{r.userName || "Anonymous"}</div>
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
              {r.imagePath && (
                <div style={{ marginTop: '1rem' }}>
                    <img 
                        src={r.imagePath.startsWith('http') ? r.imagePath : `${API_BASE}/uploads/${r.imagePath}`} 
                        alt="review" 
                        style={{ width: 100, height: 100, borderRadius: 8, objectFit: 'cover' }} 
                    />
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
      
      <ReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        type="PRODUCT"
        reportedEntityId={product.id}
        entityName={product.name}
      />
      </div>
    </>
  );
}
