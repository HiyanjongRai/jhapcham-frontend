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
  ChevronLeft,
  ChevronRight,
  Share2,
  MessageCircle,
  Flag,
  Check,
  ThumbsUp,
  Package,
  Facebook,
  Twitter,
  Linkedin,
  Mail,
  Instagram
} from "lucide-react";
import {
  getCurrentUserId,
  apiAddToCart, 
  addToGuestCart, 
  apiGetOrdersForUser 
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
  const [activeTab, setActiveTab] = useState('description');
  const [canReport, setCanReport] = useState(false);




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
        
        // Fetch similarity-based related products
        fetchRelated(mappedProduct.id, mappedProduct.category);


        if (mappedProduct.colors?.length) setSelectedColor(mappedProduct.colors[0]);
        if (mappedProduct.storage?.length) setSelectedStorage(mappedProduct.storage[0]);

        // Check wishlist and purchase status
        if (userId) {
            const isLiked = await apiCheckWishlist(userId, id);
            setLiked(isLiked);

            // Verify if user can report (bought and delivered)
            try {
              const orders = await apiGetOrdersForUser(userId);
              const hasPurchased = orders?.some(order => 
                (order.status === 'DELIVERED' || order.stage === 'DELIVERED') &&
                order.items?.some(item => String(item.productId) === String(id))
              );
              setCanReport(hasPurchased);
            } catch (e) {
              console.warn("Could not verify purchase status", e);
            }
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

    const fetchRelated = async (productId, category) => {
      try {
        // 1. Try fetching from IBCF Similarity API
        const simRes = await api.get(`/api/activity/similar/${productId}`, {
          params: { limit: 8 }
        });
        
        let list = Array.isArray(simRes.data) ? simRes.data : [];
        
        // 2. If we have enough items, use them
        if (list.length >= 4) {
          setRelatedProducts(list.slice(0, 8));
          return;
        }

        // 3. Fallback/Augment with category-based filtering
        const catRes = await api.get(`/api/products/filter`, {
          params: { category: category }
        });
        const catList = Array.isArray(catRes.data) ? catRes.data.filter(p => !list.some(s => s.id === p.id) && p.id !== parseInt(id)) : [];
        
        const combined = [...list, ...catList];
        setRelatedProducts(combined.slice(0, 8));

      } catch (err) {
        console.warn("Similarity fetch failed, falling back to category search", err);
        // Basic fallback
        try {
          const res = await api.get(`/api/products/filter`, { params: { category } });
          const list = Array.isArray(res.data) ? res.data : [];
          setRelatedProducts(list.filter(p => p.id !== parseInt(id)).slice(0, 8));
        } catch (fallbackErr) {
          console.error("Related products completely failed", fallbackErr);
        }
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
          <Link to="/"><Store size={14} /></Link>
          <ChevronRight size={12} />
          <Link to="/products">PRODUCTS</Link>
          <ChevronRight size={12} />
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
              {/* Badges */}
              <div className="pd-badges">
                {product.onSale && <span className="badge-hot">HOT</span>}
                {product.onSale && (
                  <span className="badge-discount">
                    -{Math.round(product.discountPercent)}%
                  </span>
                )}
              </div>

              <img
                src={mainImage}
                className="pd-main-image"
                alt={product.name}
                style={{
                  transformOrigin: `${zoomPos.x}% ${zoomPos.y}%`,
                  transform: zoomPos.opacity ? "scale(2)" : "scale(1)",
                  cursor: "zoom-in",
                }}
              />
            </div>

            <div className="pd-thumbnails">
              {[product.imagePath, ...(product.additionalImages || [])].map(
                (img, i) => {
                  const src = `${API_BASE}/${img}`;
                  return (
                    <img
                      key={i}
                      src={src}
                      className={`pd-thumb ${mainImage === src ? "active" : ""}`}
                      onClick={() => setMainImage(src)}
                      alt="thumbnail"
                    />
                  );
                }
              )}
            </div>
          </div>

          {/* Right: Product Info */}
          <div className="pd-info">
            <div className="pd-info-header">
              <h1 className="pd-title">{product.name}</h1>
              <div className="pd-nav-arrows">
                <button className="nav-arrow-btn"><ChevronLeft size={16} /></button>
                <button className="nav-arrow-btn"><ChevronRight size={16} /></button>
              </div>
            </div>

            <div className="pd-rating">
              <div className="pd-stars">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    size={16}
                    fill={i < Math.round(product.rating) ? "#ef4444" : "none"}
                    color={i < Math.round(product.rating) ? "#ef4444" : "#d1d5db"}
                  />
                ))}
              </div>
              <span className="pd-review-count">({reviews.length} Reviews)</span>
            </div>

            <div className="pd-price-block">
              {product.onSale ? (
                <>
                  <span className="pd-price-old">₹{product.price}</span>
                  <span className="pd-price-new">₹{product.salePrice}</span>
                </>
              ) : (
                <span className="pd-price-new">₹{product.price}</span>
              )}
            </div>

            <p className="pd-short-description">{product.shortDescription}</p>

            <div className="pd-quick-specs">
              <div className="spec-card">
                 <span className="spec-icon"><Package size={14} /></span>
                 <div className="spec-info">
                    <span className="spec-label">BRAND</span>
                    <span className="spec-val">{product.brand || "Authentic"}</span>
                 </div>
              </div>
              <div className="spec-card">
                 <span className="spec-icon"><Flag size={14} /></span>
                 <div className="spec-info">
                    <span className="spec-label">WARRANTY</span>
                    <span className="spec-val">{product.warrantyMonths ? `${product.warrantyMonths} Months` : "No Warranty"}</span>
                 </div>
              </div>
              {product.expiryDate && (
                <div className="spec-card">
                   <span className="spec-icon"><Star size={14} /></span>
                   <div className="spec-info">
                      <span className="spec-label">EXPIRY</span>
                      <span className="spec-val">{new Date(product.expiryDate).toLocaleDateString()}</span>
                   </div>
                </div>
              )}
            </div>

            <div className="pd-meta-details-porto">
              <div className="meta-row">
                <span className="meta-label">LISTING ID:</span>
                <span className="meta-value">{product.id.toString().padStart(8, '0')}</span>
              </div>
              <div className="meta-row">
                <span className="meta-label">TAGS:</span>
                <span className="meta-value">{product.category}, FASHION</span>
              </div>
            </div>

            {/* Variants Selection */}
            <div className="pd-variants-section">
              {product.colors && product.colors.length > 0 && (
                <div className="pd-variant-group">
                  <span className="pd-variant-label">COLOR: <strong>{selectedColor}</strong></span>
                  <div className="pd-variant-options">
                    {product.colors.map(color => (
                      <button 
                        key={color}
                        className={`pd-variant-btn color-btn ${selectedColor === color ? 'active' : ''}`}
                        onClick={() => setSelectedColor(color)}
                        title={color}
                      >
                        <span className="color-swatch" style={{ background: color.toLowerCase() }}></span>
                        {color}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {product.storage && product.storage.length > 0 && (
                <div className="pd-variant-group">
                  <span className="pd-variant-label">CAPACITY: <strong>{selectedStorage}</strong></span>
                  <div className="pd-variant-options">
                    {product.storage.map(spec => (
                      <button 
                        key={spec}
                        className={`pd-variant-btn spec-btn ${selectedStorage === spec ? 'active' : ''}`}
                        onClick={() => setSelectedStorage(spec)}
                      >
                        {spec}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="pd-porto-actions">
              {!isSeller && (
                <div className="pd-cart-section">
                  <div className="pd-porto-qty">
                    <button className="qty-btn-minus" onClick={decreaseQty}>-</button>
                    <input type="text" value={quantity} readOnly className="qty-input" />
                    <button className="qty-btn-plus" onClick={increaseQty}>+</button>
                  </div>

                  <button
                    className="pd-porto-add-btn"
                    onClick={handleAddToCart}
                    disabled={product.stock === 0 || adding}
                  >
                    <ShoppingCart size={18} />
                    {product.stock === 0 ? "OUT OF STOCK" : adding ? "ADDING..." : "ADD TO CART"}
                  </button>
                </div>
              )}
            </div>

            <div className="pd-footer-actions">
              <div className="pd-social-share">
                <button className="social-btn"><Facebook size={14} /></button>
                <button className="social-btn"><Twitter size={14} /></button>
                <button className="social-btn"><Linkedin size={14} /></button>
                <button className="social-btn"><Instagram size={14} /></button>
                <button className="social-btn"><Mail size={14} /></button>
              </div>
              <button 
                className="pd-message-btn" 
                onClick={() => setShowMessageModal(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'transparent',
                  border: '1px solid #e2e8f0',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  fontWeight: '700',
                  color: '#475569',
                  cursor: 'pointer',
                  marginRight: '10px'
                }}
              >
                <MessageCircle size={16} />
                MESSAGE STORE
              </button>
              <button 
                className={`pd-wishlist-link ${liked ? 'active' : ''}`}
                onClick={toggleWishlist}
              >
                <Heart size={16} fill={liked ? "currentColor" : "none"} />
                ADD TO WISHLIST
              </button>
              <button 
                className="pd-message-btn" 
                onClick={() => setShowReportModal(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'transparent',
                  border: '1px solid #fee2e2',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  fontWeight: '700',
                  color: '#ef4444',
                  cursor: 'pointer',
                  marginLeft: '10px'
                }}
              >
                <Flag size={16} />
                REPORT
              </button>
            </div>

            {/* Seller Card */}
            <div className="pd-porto-seller" onClick={() => navigate(`/seller/${product.sellerId}`)}>
              <span>Sold by: <strong>{product.sellerStoreName}</strong></span>
              <ChevronRight size={14} />
            </div>
          </div>
        </div>

        {/* Tabs Section */}
        <div className="pd-tabs-container">
          <div className="pd-tabs-header">
            <button 
              className={`tab-btn ${activeTab === 'description' ? 'active' : ''}`}
              onClick={() => setActiveTab('description')}
            >
              DESCRIPTION
            </button>
            <button 
              className={`tab-btn ${activeTab === 'specification' ? 'active' : ''}`}
              onClick={() => setActiveTab('specification')}
            >
              SPECIFICATIONS
            </button>
            <button 
              className={`tab-btn ${activeTab === 'additional' ? 'active' : ''}`}
              onClick={() => setActiveTab('additional')}
            >
              ADDITIONAL INFORMATION
            </button>
            <button 
              className={`tab-btn ${activeTab === 'reviews' ? 'active' : ''}`}
              onClick={() => setActiveTab('reviews')}
            >
              REVIEWS ({reviews.length})
            </button>
            <button 
              className={`tab-btn ${activeTab === 'report' ? 'active' : ''}`}
              onClick={() => setActiveTab('report')}
              style={{ color: '#ef4444' }}
            >
              REPORT
            </button>
          </div>

          <div className="pd-tabs-content">
            {activeTab === 'description' && (
              <div className="tab-pane fade-in">
                <p className="pd-full-desc">{product.description}</p>
              </div>
            )}
            {activeTab === 'specification' && (
              <div className="tab-pane fade-in">
                {product.specification ? (
                  <div className="pd-spec-content">
                    {product.specification.split('\n').filter(line => line.trim()).map((spec, i) => (
                      <p key={i} className="spec-line">{spec.trim()}</p>
                    ))}
                  </div>
                ) : (
                  <p>No detailed specifications available for this product.</p>
                )}
              </div>
            )}
            {activeTab === 'additional' && (
              <div className="tab-pane fade-in">
                <div className="additional-info-grid">
                  <div className="info-row">
                    <span>Warranty</span>
                    <span>{product.warrantyMonths} Months</span>
                  </div>
                  {product.manufactureDate && (
                    <div className="info-row">
                      <span>Manufactured</span>
                      <span>{new Date(product.manufactureDate).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
            {activeTab === 'reviews' && (
              <div className="tab-pane fade-in">
                {/* Reviews implementation moved here */}
                <div className="pd-porto-reviews-feed">
                  {reviews.length === 0 ? (
                    <p>No reviews yet.</p>
                  ) : (
                    reviews.slice(0, visibleReviews).map(r => (
                      <div className="pd-porto-review-item" key={r.id}>
                        <div className="pd-rev-avatar-circle">
                          {r.userName?.charAt(0).toUpperCase() || "U"}
                        </div>
                        <div className="pd-rev-content-block">
                          <div className="pd-rev-header-strip">
                            <div className="pd-rev-identity">
                              <span className="pd-rev-author">{r.userName}</span>
                              <div className="pd-rev-stars">
                                {Array.from({ length: 5 }).map((_, i) => (
                                  <Star 
                                    key={i} 
                                    size={12} 
                                    fill={i < r.rating ? "#f59e0b" : "none"} 
                                    color={i < r.rating ? "#f59e0b" : "#d1d5db"} 
                                  />
                                ))}
                              </div>
                            </div>
                            <span className="pd-rev-published-date">{new Date(r.createdAt).toLocaleDateString()}</span>
                          </div>
                          
                          <p className="pd-rev-body">"{r.comment}"</p>
                          
                          {r.imagePath && (
                            <div className="pd-rev-photo-attachment">
                              <img src={`${API_BASE}/${r.imagePath}`} alt="review proof" />
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
            {activeTab === 'report' && (
              <div className="tab-pane fade-in pd-report-tab">
                 <div className="pd-report-content">
                    <Flag size={40} color="#ef4444" style={{ marginBottom: '15px' }} />
                    <h3>Product Flagging & Support</h3>
                    <p style={{ maxWidth: '600px', margin: '0 auto 20px' }}>
                       {canReport 
                         ? "As a verified purchaser, your formal report will be prioritized by the seller and site administration to resolve any delivery or quality issues." 
                         : "Notice something wrong? Help us keep Jhapcham safe by reporting policy violations or listing inaccuracies. Verified purchasers get priority support."
                       }
                    </p>
                    <div className="pd-report-actions" style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                       {canReport && <span className="badge-verified"><Check size={14} /> Verified Buyer Status</span>}
                       <button 
                        className="ua-primary-btn" 
                        onClick={() => setShowReportModal(true)}
                        style={{ background: '#ef4444', border: 'none', minWidth: '240px' }}
                       >
                        {canReport ? "FILE VERIFIED REPORT" : "REPORT THIS PRODUCT"}
                       </button>
                    </div>
                 </div>
              </div>
            )}
          </div>
        </div>
        {/* Related Products Section */}
        {relatedProducts.length > 0 && (
          <div className="pd-porto-related">
            <h2 className="related-title">YOU MAY ALSO LIKE</h2>
            <div className="pd-related-grid">
              {relatedProducts.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        )}
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
    </>
  );
}
