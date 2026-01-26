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
  Flag,
  Check,
  ThumbsUp,
  Package
} from "lucide-react";
import {
  getCurrentUserId,
  apiAddToCart,
  addToGuestCart,
} from "../AddCart/cartUtils";
import api from "../../api/axios";
import { apiAddToWishlist, apiRemoveFromWishlist, apiCheckWishlist } from "../WishlistPage/wishlistUtils";
import MessageModal from "../Message/MessageModal";
import ProductCard from "./ProductCard";

import ReportModal from "../Report/ReportModal";
import ErrorToast from "../ErrorToast/ErrorToast";
import Toast from "../Toast/Toast";
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
  const [toast, setToast] = useState({ message: '', type: 'info', visible: false });
  const [error, setError] = useState(null);

  const userRole = localStorage.getItem("userRole");
  const isSeller = userRole === "SELLER";

  const showToast = (message, type = 'info') => {
    setToast({ message, type, visible: true });
  };
  const [selectedColor, setSelectedColor] = useState(null);
  const [selectedStorage, setSelectedStorage] = useState(null);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);

  const [markedHelpful, setMarkedHelpful] = useState(new Set());
  const [visibleReviews, setVisibleReviews] = useState(3);
  const [zoomPos, setZoomPos] = useState({ x: 0, y: 0, opacity: 0 });
  const [relatedProducts, setRelatedProducts] = useState([]);




  const handleHelpful = async (reviewId) => {
    if (!userId) {
        navigate("/login");
        return;
    }

    // Optimistic Update
    const isMarked = markedHelpful.has(reviewId);
    setMarkedHelpful(prev => {
        const newSet = new Set(prev);
        if (isMarked) newSet.delete(reviewId);
        else newSet.add(reviewId);
        return newSet;
    });

    try {
        await api.post(`/api/reviews/${reviewId}/helpful`, null, {
            params: { userId }
        });
    } catch (error) {
        console.error("Failed to toggle helpful:", error);
        // Revert
        setMarkedHelpful(prev => {
            const newSet = new Set(prev);
            if (isMarked) newSet.add(reviewId);
            else newSet.delete(reviewId);
            return newSet;
        });
    }
  };

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

      await api.post("/api/views/log", null, {
        params: userId 
          ? { productId, userId }
          : { productId, anonKey }
      });
    } catch { }
  };

  // Load Data
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);

        // Load product with userId for view tracking
        const res = await api.get(`/api/products/${id}`, {
          params: { userId: userId || '' }
        });
        const data = res.data;
        
        // Map ProductDetailDTO to frontend format
        const mappedProduct = {
          ...data,
          id: data.productId || data.id,
          imagePath: (data.imagePaths && data.imagePaths.length > 0) ? data.imagePaths[0] : (data.imagePath || ""),
          additionalImages: (data.imagePaths && data.imagePaths.length > 1) ? data.imagePaths.slice(1) : [],
          stock: data.stockQuantity ?? data.stock ?? 0,
          colors: Array.isArray(data.colors) ? data.colors : (
            (() => {
              if (Array.isArray(data.colorOptions)) return data.colorOptions;
              if (typeof data.colorOptions === 'string') {
                try {
                  const res = JSON.parse(data.colorOptions);
                  return Array.isArray(res) ? res : [];
                } catch { 
                  return data.colorOptions.split(',').map(s => s.trim()).filter(Boolean);
                }
              }
              return [];
            })()
          ),
          storage: Array.isArray(data.storage) ? data.storage : (
            (() => {
              if (Array.isArray(data.storageSpec)) return data.storageSpec;
              if (typeof data.storageSpec === 'string') {
                try {
                  const res = JSON.parse(data.storageSpec);
                  return Array.isArray(res) ? res : [];
                } catch { 
                  return data.storageSpec.split(',').map(s => s.trim()).filter(Boolean);
                }
              }
              return [];
            })()
          ),
          rating: data.averageRating ?? data.rating ?? 0,
          sellerId: data.sellerUserId ?? data.sellerId,
          sellerStoreName: data.storeName ?? data.sellerStoreName,
          sellerStoreAddress: data.storeAddress ?? data.sellerStoreAddress,
          specification: data.specification || data.specifications || "",
          salePrice: data.salePrice !== null ? data.salePrice : (data.discountPrice ?? data.price),
          discountPercent: data.discountPercent ?? data.salePercentage ?? 0,
          saleLabel: data.saleLabel,
          freeShipping: data.freeShipping || false,
          insideValleyShipping: data.insideValleyShipping,
          outsideValleyShipping: data.outsideValleyShipping,
          manufactureDate: data.manufactureDate || data.manufacturingDate,
          expiryDate: data.expiryDate,
          warrantyMonths: data.warrantyMonths || data.warranty,
          features: data.features,
          description: data.description,
        };
        
        setProduct(mappedProduct);
        setMainImage(`${API_BASE}/${mappedProduct.imagePath}`);
        if (mappedProduct.category) fetchRelated(mappedProduct.category);


        if (mappedProduct.colors?.length) setSelectedColor(mappedProduct.colors[0]);
        if (mappedProduct.storage?.length) setSelectedStorage(mappedProduct.storage[0]);

        // Check wishlist status
        if (userId) {
            const isLiked = await apiCheckWishlist(userId, id);
            setLiked(isLiked);
        }

        // Load reviews
        try {
          // Pass userId to check which reviews are already marked helpful by this user
          const rev = await api.get(`/api/reviews/product/${id}`, {
              params: { userId: getCurrentUserId() }
          });
          const reviewData = Array.isArray(rev.data) ? rev.data : [];
          setReviews(reviewData);

          // Initialize local state of likes
          const helpfulSet = new Set();
          reviewData.forEach(r => {
              if (r.isHelpful) helpfulSet.add(r.id);
          });
          setMarkedHelpful(helpfulSet);
          
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

    const fetchRelated = async (category) => {
      try {
        const res = await api.get(`/api/products/filter`, {
          params: { category: category }
        });
        const list = Array.isArray(res.data) ? res.data : [];
        setRelatedProducts(list.filter(p => p.id !== parseInt(id)).slice(0, 4));
      } catch (err) {
        console.error("Related products failed", err);
      }
    };

    load();
    // After product is loaded, fetchRelated if possible
    // We'll update the load function to call fetchRelated inside if we want it serial

  }, [id, userId]);

  const handleMouseMove = (e) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.pageX - left - window.scrollX) / width) * 100;
    const y = ((e.pageY - top - window.scrollY) / height) * 100;
    setZoomPos({ x, y, opacity: 1 });
  };

  const handleMouseLeave = () => {
    setZoomPos(prev => ({ ...prev, opacity: 0 }));
  };


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
            showToast("Removed from wishlist", "info");
        } else {
            await apiAddToWishlist(userId, id);
            setLiked(true);
            showToast("Added to wishlist", "success");
        }
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
        await apiAddToCart(userId, product.id, quantity, selectedColor, selectedStorage);
      } else {
        addToGuestCart(product, quantity, selectedColor, selectedStorage);
      }

      showToast("Item added to cart", "success");
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
          <div 
            className="pd-main-image-wrapper"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
          >
            <img 
              src={mainImage} 
              className="pd-main-image" 
              alt={product.name} 
              style={{
                transformOrigin: `${zoomPos.x}% ${zoomPos.y}%`,
                transform: zoomPos.opacity ? 'scale(2)' : 'scale(1)',
                cursor: 'zoom-in'
              }}
            />
            {!zoomPos.opacity && <div className="zoom-hint">Hover to Zoom</div>}
          </div>

          <div className="pd-thumbnails">
            {[product.imagePath, ...(product.additionalImages || [])].map((img, i) => {
              const src = `${API_BASE}/${img}`;
              return (
                <img
                  key={i}
                  src={src}
                  className={`pd-thumb ${mainImage === src ? "active" : ""}`}
                  onClick={() => setMainImage(src)}
                  alt="thumbnail"
                />
              )
            })}
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
              {!isSeller && (
                <>
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
                </>
              )}

              <button 
                className="pd-message-btn" 
                onClick={() => setShowMessageModal(true)}
                title="Ask Seller"
              >
                <MessageCircle size={20} />
              </button>

               <button 
                className="pd-message-btn pd-report-btn" 
                onClick={() => setShowReportModal(true)}
                title="Report Product"
              >
                <Flag size={20} />
              </button>

              {!isSeller && (
                <button 
                  className={`pd-wish-btn ${liked ? 'active' : ''}`}
                  onClick={toggleWishlist}
                  title="Add to Wishlist"
                >
                  <Heart size={20} fill={liked ? "currentColor" : "none"} />
                </button>
              )}
            </div>

          {/* Seller Card */}
          <div className="pd-seller-card" onClick={() => navigate(`/seller/${product.sellerId}`)}>
            <div className="pd-seller-avatar">
              {product.logoImagePath || product.profileImagePath ? (
                <img 
                  src={`${API_BASE}/${product.logoImagePath || product.profileImagePath}`} 
                  alt={product.sellerStoreName} 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <Store size={24} color="#1a1a1a" />
              )}
            </div>
            <div className="pd-seller-info">
              <p className="seller-label">Sold by</p>
              <h3>{product.sellerStoreName}</h3>
              <p className="seller-address">{product.sellerStoreAddress}</p>
            </div>
            <ChevronRight size={20} color="#94a3b8" />
          </div>
        </div>
      </div>

      {/* Related Products Section */}
      {relatedProducts.length > 0 && (
        <div className="pd-related-section" style={{marginBottom: '80px', paddingTop: '40px', borderTop: '1px solid #f1f5f9'}}>
          <h2 className="section-title">You May Also Like</h2>
          <div className="pd-related-grid" style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px'}}>
            {relatedProducts.map(p => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      )}

      {/* Reviews Section */}

      <div className="pd-reviews-section">
          <h2 className="section-title">Customer Reviews</h2>
          
          <div className="pd-reviews-grid">
            {/* Sidebar: Ratings & Breakdown */}
            <div className="pd-reviews-sidebar">
                <div className="pd-rating-box">
                    <span className="rating-number">{product.rating ? Math.round(product.rating * 10) / 10 : 0}</span>
                    <div className="pd-stars">
                        {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                            key={i}
                            size={24}
                            fill={i < Math.round(product.rating) ? "#1a1a1a" : "none"}
                            color={i < Math.round(product.rating) ? "#1a1a1a" : "#d1d5db"}
                        />
                        ))}
                    </div>
                    <p className="rating-total-count">Based on {reviews.length} reviews</p>
                </div>

                <div className="pd-rating-bars">
                    {ratingDist.map(item => (
                        <div key={item.star} className="rating-bar-row">
                            <span className="star-label">{item.star} <Star size={12} fill="currentColor" stroke="none" /></span>
                            <div className="rating-track">
                                <div className="rating-fill" style={{ width: `${item.percentage}%` }}></div>
                            </div>
                            <span className="count-label">{item.count}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Content: Reviews Feed */}
            <div className="pd-reviews-feed">
                {reviews.length === 0 ? (
                    <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280', background: '#f9fafb', borderRadius: '16px' }}>
                        <p style={{ fontSize: '1.1rem', fontWeight: '500' }}>No reviews yet</p>
                        <p>Be the first to share your thoughts on this product.</p>
                    </div>
                ) : (
                    reviews.slice(0, visibleReviews).map(r => (
                        <div className="pd-review-card" key={r.id}>
                            <div className="pd-review-avatar-box">
                                <img
                                    src={r.userProfileImage 
                                            ? (r.userProfileImage.startsWith('http') ? r.userProfileImage : `${API_BASE}/${r.userProfileImage}`) 
                                            : "https://via.placeholder.com/56"}
                                    className="pd-review-avatar"
                                    alt={r.userName || "User"}
                                />
                            </div>
                            <div className="pd-review-main">
                                <div className="pd-review-header">
                                    <div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                            <span className="pd-review-author">{r.userName || "Verified Buyer"}</span>
                                            <span className="pd-verified-badge">
                                                <Check size={10} strokeWidth={4} /> Verified Purchase
                                            </span>
                                        </div>
                                        {r.createdAt && <span className="pd-review-date">{new Date(r.createdAt).toLocaleDateString()}</span>}
                                    </div>
                                    <div className="pd-stars">
                                        {Array.from({ length: 5 }).map((_, i) => (
                                        <Star
                                            key={i}
                                            size={14}
                                            fill={i < r.rating ? "#1a1a1a" : "none"}
                                            color={i < r.rating ? "#1a1a1a" : "#d1d5db"}
                                        />
                                        ))}
                                    </div>
                                </div>
                                
                                <p className="pd-review-content">{r.comment}</p>
                                
                                {r.imagePath && (
                                    <div style={{ marginTop: '16px' }}>
                                        <img 
                                            src={r.imagePath.startsWith('http') ? r.imagePath : `${API_BASE}/${r.imagePath}`} 
                                            alt="review attachment" 
                                            style={{ width: 80, height: 80, borderRadius: 12, objectFit: 'cover', cursor: 'pointer', border: '1px solid #e5e7eb' }} 
                                        />
                                    </div>
                                )}

                                <div className="pd-review-footer">
                                    {markedHelpful.has(r.id) ? (
                                        <button 
                                            className="pd-helpful-btn active"
                                            onClick={() => handleHelpful(r.id)}
                                        >
                                            <ThumbsUp size={14} fill="currentColor" /> 
                                            <span>{(r.helpfulCount || 0) + 1}</span>
                                        </button>
                                    ) : (
                                        <span className="pd-review-helpful">
                                            Was this review helpful?
                                            <button 
                                                className="pd-helpful-btn"
                                                onClick={() => handleHelpful(r.id)}
                                            >
                                                <ThumbsUp size={14} /> 
                                                <span>{r.helpfulCount || 0}</span>
                                            </button>
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
                
                {reviews.length > visibleReviews && (
                    <button 
                        className="pd-show-more-btn"
                        onClick={() => setVisibleReviews(prev => prev + 5)}
                    >
                        Show More Reviews
                    </button>
                )}
            </div>
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
      
      {toast.visible && (
        <Toast 
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ ...toast, visible: false })}
        />
      )}
      </div>
    </>
  );
}
