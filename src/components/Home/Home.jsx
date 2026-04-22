import React, { useEffect, useState, useRef, useCallback, memo } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ChevronRight, ChevronLeft, Package, Truck, Smartphone,
  Home as HomeIcon, Shirt, Heart, Gamepad2, Clock,
  CircleDollarSign, ArrowRight, Zap, TrendingUp,
  ShieldCheck, Headphones, RotateCcw, Star, Flame,
  Gift, Sparkles, BadgePercent, Tag, Eye
} from "lucide-react";
import "./Home.css";
import ProductCard from "../productCard/ProductCard";
import Footer from "../FooterSection/Footer";
import { API_BASE } from "../config/config";
import api from "../../api/axios";
import CountdownTimer from "./CountdownTimer";

const MemoizedProductCard = memo(ProductCard);

/* ─── Skeleton Loaders ─── */
const ProductSkeleton = () => (
  <div className="product-skeleton">
    <div className="skeleton-image"></div>
    <div className="skeleton-text skeleton-title"></div>
    <div className="skeleton-text skeleton-price"></div>
    <div className="skeleton-text skeleton-rating"></div>
  </div>
);

const CategorySkeleton = () => (
  <div className="jpc-cat-card jpc-cat-skeleton">
    <div className="skeleton-circle"></div>
    <div className="skeleton-text" style={{ width: '60%', height: 12 }}></div>
  </div>
);

/* ─── Horizontal Scroll Hook ─── */
const useHorizontalScroll = () => {
  const ref = useRef(null);
  const scroll = (direction) => {
    if (ref.current) {
      const scrollAmount = ref.current.offsetWidth * 0.75;
      ref.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };
  return { ref, scroll };
};

/* ─── Main Home Component ─── */
function Home() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [activeSlide, setActiveSlide] = useState(0);
  const [heroTransitioning, setHeroTransitioning] = useState(false);
  const heroTimerRef = useRef(null);

  // Scroll refs for product rows
  const featuredScroll = useHorizontalScroll();
  const newArrivalsScroll = useHorizontalScroll();
  const trendingScroll = useHorizontalScroll();
  const dealsScroll = useHorizontalScroll();

  const CATEGORY_ICONS = {
    fashion: Shirt, clothing: Shirt, cloth: Shirt, apparel: Shirt,
    electronics: Smartphone, phone: Smartphone, mobile: Smartphone, computer: Smartphone,
    home: HomeIcon, living: HomeIcon, furniture: HomeIcon, kitchen: HomeIcon,
    game: Gamepad2, toy: Gamepad2, gaming: Gamepad2,
    beauty: Heart, health: Heart, makeup: Heart, skincare: Heart,
    sports: TrendingUp, fitness: TrendingUp,
    gift: Gift, accessories: Sparkles,
  };

  const getCategoryIcon = (name) => {
    if (!name) return Package;
    const lower = name.toLowerCase();
    for (const [key, icon] of Object.entries(CATEGORY_ICONS)) {
      if (lower.includes(key)) return icon;
    }
    return Package;
  };


  useEffect(() => {
    const fetchData = async () => {
      try {
        // ⚡ PERFORMANCE: Parallel API calls instead of sequential
        const [prodRes, catRes, campRes] = await Promise.all([
          api.get("/api/products").catch(err => {
            console.warn("Product fetch error", err);
            return { data: [] };
          }),
          api.get("/api/categories").catch(err => {
            console.warn("Category fetch error", err);
            return { data: [] };
          }),
          api.get("/api/campaigns").catch(err => {
            console.warn("Campaign fetch error", err);
            return { data: [] };
          })
        ]);

        // Products
        if (prodRes.data) {
          const mapped = prodRes.data.map(dto => ({
            ...dto,
            imagePath: (dto.imagePaths && dto.imagePaths.length > 0) ? dto.imagePaths[0] : (dto.imagePath || ""),
            rating: dto.averageRating || 0,
            stock: dto.stockQuantity ?? dto.stock ?? 0,
          }));
          setProducts(mapped);
        }

        // Categories
        if (catRes.data) setCategories(catRes.data);

        // Campaigns
        if (campRes.data && campRes.data.length > 0) {
          const activeOnly = campRes.data.filter(c => c.status === 'ACTIVE');
          setCampaigns(activeOnly.length > 0 ? activeOnly : campRes.data.slice(0, 3));
        }
      } finally { 
        setLoading(false); 
      }
    };
    fetchData();
  }, []);

  /* ─── Hero Auto-Slide ─── */
  const heroSlides = campaigns.length > 0 ? campaigns : [
    { id: 'default-1', name: 'Discover Amazing Deals', description: 'Shop the best products at unbeatable prices', discountPercent: 30 },
    { id: 'default-2', name: 'New Season Collection', description: 'Fresh styles for the new season', discountPercent: 25 },
    { id: 'default-3', name: 'Flash Sale Today', description: 'Limited time offers on top brands', discountPercent: 50 },
  ];

  const goToSlide = useCallback((index) => {
    setHeroTransitioning(true);
    setTimeout(() => {
      setActiveSlide(index);
      setTimeout(() => setHeroTransitioning(false), 50);
    }, 300);
  }, []);

  const nextSlide = useCallback(() => {
    goToSlide((activeSlide + 1) % heroSlides.length);
  }, [activeSlide, heroSlides.length, goToSlide]);

  const prevSlide = useCallback(() => {
    goToSlide((activeSlide - 1 + heroSlides.length) % heroSlides.length);
  }, [activeSlide, heroSlides.length, goToSlide]);

  useEffect(() => {
    if (heroSlides.length <= 1) return;
    heroTimerRef.current = setInterval(nextSlide, 6000);
    return () => clearInterval(heroTimerRef.current);
  }, [nextSlide, heroSlides.length]);

  /* ─── Product Sections ─── */
  const featuredProducts = products.slice(0, 10);
  const newArrivals = [...products].reverse().slice(0, 10);
  const trendingProducts = [...products]
    .sort((a, b) => (b.totalViews || 0) - (a.totalViews || 0))
    .slice(0, 10);
  const onSaleProducts = products.filter(p => p.onSale).slice(0, 10);

  // Get the next campaign end date for countdown
  const nextEndDate = campaigns.find(c => c.endDate)?.endDate;

  const currentCampaign = heroSlides[activeSlide];

  const getHeroImage = (campaign) => {
    if (campaign?.imagePath) {
      return campaign.imagePath.startsWith("http")
        ? campaign.imagePath
        : `${API_BASE}/${campaign.imagePath}`;
    }
    return null;
  };

  /* ─── Render ─── */
  return (
    <div className="jpc-home">

      {/* ═══════ HERO SECTION ═══════ */}
      <section className="jpc-hero" aria-labelledby="jpc-hero-heading">
        <div className="jpc-hero-layout">

          {/* Category Sidebar */}
          <aside className="jpc-hero-sidebar">
            <div className="jpc-sidebar-title">
              <Package size={16} />
              <span>All Categories</span>
            </div>
            <nav className="jpc-sidebar-nav">
              {categories.length > 0 ? (
                categories.slice(0, 10).map((cat, i) => {
                  const Icon = getCategoryIcon(cat.name);
                  return (
                    <Link
                      key={cat.id}
                      to={`/products?category=${encodeURIComponent(cat.name)}`}
                      className="jpc-sidebar-item"
                    >
                      <div className="jpc-sidebar-item-left">
                        <Icon size={15} />
                        <span>{cat.name}</span>
                      </div>
                      <ChevronRight size={12} />
                    </Link>
                  );
                })
              ) : (
                Array(8).fill(0).map((_, i) => (
                  <div key={i} className="jpc-sidebar-skeleton"></div>
                ))
              )}
              <Link to="/products" className="jpc-sidebar-item jpc-sidebar-viewall">
                <span>View All</span>
                <ArrowRight size={14} />
              </Link>
            </nav>
          </aside>

          {/* Hero Carousel */}
          <div className="jpc-hero-carousel">
            <div className={`jpc-hero-slide ${heroTransitioning ? 'transitioning' : 'active'}`}>
              
              {/* Slide Background */}
              {getHeroImage(currentCampaign) ? (
                <img
                  src={getHeroImage(currentCampaign)}
                  alt={currentCampaign?.name || 'Campaign'} 
                  className="jpc-hero-bg-img"
                  loading="eager"
                  decoding="async"
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
              ) : (
                <div className="jpc-hero-bg-gradient" data-slide={activeSlide % 3}></div>
              )}
              <div className="jpc-hero-overlay"></div>

              {/* Slide Content */}
              <div className="jpc-hero-content">
                <div className="jpc-hero-badge-tag">
                  <Zap size={14} />
                  <span>{currentCampaign?.discountPercent ? `UP TO ${currentCampaign.discountPercent}% OFF` : 'HOT DEAL'}</span>
                </div>
                <h1 id="jpc-hero-heading" className="jpc-hero-title">
                  {currentCampaign?.name || 'Discover Amazing Deals'}
                </h1>
                <p className="jpc-hero-desc">
                  {currentCampaign?.description || 'Shop the best products at unbeatable prices'}
                </p>
                <div className="jpc-hero-btns">
                  <button
                    className="jpc-btn-primary"
                    onClick={() => navigate(currentCampaign?.id && !String(currentCampaign.id).startsWith('default')
                      ? `/products?campaign=${currentCampaign.id}`
                      : '/products'
                    )}
                  >
                    Shop Now <ArrowRight size={16} />
                  </button>
                  <button
                    className="jpc-btn-outline"
                    onClick={() => navigate('/campaigns')}
                  >
                    View All Campaigns
                  </button>
                </div>
              </div>
            </div>

            {/* Carousel Controls */}
            {heroSlides.length > 1 && (
              <>
                <button className="jpc-hero-arrow jpc-hero-prev" onClick={prevSlide} aria-label="Previous slide">
                  <ChevronLeft size={22} />
                </button>
                <button className="jpc-hero-arrow jpc-hero-next" onClick={nextSlide} aria-label="Next slide">
                  <ChevronRight size={22} />
                </button>
                <div className="jpc-hero-indicators">
                  {heroSlides.map((_, i) => (
                    <button
                      key={i}
                      className={`jpc-hero-dot ${i === activeSlide ? 'active' : ''}`}
                      onClick={() => goToSlide(i)}
                      aria-label={`Go to slide ${i + 1}`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Hero Side Banners */}
          <div className="jpc-hero-side-banners">
            <div className="jpc-side-banner jpc-side-banner-1" onClick={() => navigate('/new-arrivals')}>
              <div className="jpc-side-banner-content">
                <span className="jpc-side-banner-label">NEW ARRIVALS</span>
                <strong>Fresh This Week</strong>
                <span className="jpc-side-banner-cta">Shop Now →</span>
              </div>
            </div>
            <div className="jpc-side-banner jpc-side-banner-2" onClick={() => navigate('/on-sale')}>
              <div className="jpc-side-banner-content">
                <span className="jpc-side-banner-label">
                  <Flame size={14} /> HOT DEALS
                </span>
                <strong>Up to 70% Off</strong>
                <span className="jpc-side-banner-cta">Shop Now →</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════ TRUST BAR ═══════ */}
      <section className="jpc-trust-bar">
        <div className="jpc-container">
          <div className="jpc-trust-grid">
            {[
              { icon: <Truck size={28} strokeWidth={1.5} />, title: "Free Shipping", sub: "On orders over Rs 5,000" },
              { icon: <ShieldCheck size={28} strokeWidth={1.5} />, title: "Secure Payment", sub: "100% secure checkout" },
              { icon: <RotateCcw size={28} strokeWidth={1.5} />, title: "Easy Returns", sub: "30-day return policy" },
              { icon: <Headphones size={28} strokeWidth={1.5} />, title: "24/7 Support", sub: "Dedicated support team" },
            ].map((f, i) => (
              <div key={i} className="jpc-trust-item">
                <div className="jpc-trust-icon">{f.icon}</div>
                <div className="jpc-trust-text">
                  <strong>{f.title}</strong>
                  <span>{f.sub}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ CATEGORY SHOWCASE ═══════ */}
      <section className="jpc-section">
        <div className="jpc-container">
          <div className="jpc-section-header">
            <div className="jpc-section-header-left">
              <h2 className="jpc-section-title">Shop by Category</h2>
              <p className="jpc-section-subtitle">Browse our wide range of categories</p>
            </div>
            <Link to="/products" className="jpc-section-link">
              View All <ArrowRight size={14} />
            </Link>
          </div>
          <div className="jpc-category-grid">
            {loading ? (
              Array(8).fill(0).map((_, i) => <CategorySkeleton key={i} />)
            ) : categories.length > 0 ? (
              categories.slice(0, 8).map((cat, i) => {
                const Icon = getCategoryIcon(cat.name);
                return (
                  <Link
                    key={cat.id}
                    to={`/products?category=${encodeURIComponent(cat.name)}`}
                    className="jpc-cat-card"
                  >
                    <div className="jpc-cat-icon-wrap">
                      <Icon size={22} />
                    </div>
                    <span className="jpc-cat-name">{cat.name}</span>
                    <span className="jpc-cat-arrow"><ChevronRight size={14} /></span>
                  </Link>
                );
              })
            ) : (
              <p className="jpc-empty">No categories found.</p>
            )}
          </div>
        </div>
      </section>

      {/* ═══════ FLASH DEALS ═══════ */}
      {onSaleProducts.length > 0 && (
        <section className="jpc-section jpc-deals-section">
          <div className="jpc-container">
            <div className="jpc-section-header jpc-deals-header">
              <div className="jpc-section-header-left">
                <div className="jpc-deals-title-row">
                  <Zap size={22} className="jpc-deals-icon" />
                  <h2 className="jpc-section-title jpc-deals-title">Flash Deals</h2>
                </div>
                {nextEndDate && (
                  <div className="jpc-deals-timer">
                    <span>Ends in</span>
                    <CountdownTimer targetDate={nextEndDate} />
                  </div>
                )}
              </div>
              <Link to="/on-sale" className="jpc-section-link jpc-deals-link">
                View All Deals <ArrowRight size={14} />
              </Link>
            </div>
            <div className="jpc-scroll-container">
              <button className="jpc-scroll-btn jpc-scroll-left" onClick={() => dealsScroll.scroll('left')}>
                <ChevronLeft size={20} />
              </button>
              <div className="jpc-product-scroll" ref={dealsScroll.ref}>
                {onSaleProducts.map(p => (
                  <div key={p.id} className="jpc-scroll-card">
                    <MemoizedProductCard product={p} />
                  </div>
                ))}
              </div>
              <button className="jpc-scroll-btn jpc-scroll-right" onClick={() => dealsScroll.scroll('right')}>
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        </section>
      )}

      {/* ═══════ PROMOTIONAL BANNERS ═══════ */}
      <section className="jpc-promo-section">
        <div className="jpc-container">
          <div className="jpc-promo-grid">
            <div className="jpc-promo-card jpc-promo-large" onClick={() => navigate('/products')}>
              <div className="jpc-promo-card-content">
                <span className="jpc-promo-label">TRENDING NOW</span>
                <h3>Top Picks for You</h3>
                <p>Curated collection of bestsellers</p>
                <span className="jpc-promo-cta">Shop Collection <ArrowRight size={14} /></span>
              </div>
              <div className="jpc-promo-decoration">
                <TrendingUp size={80} strokeWidth={0.5} />
              </div>
            </div>
            <div className="jpc-promo-card jpc-promo-small" onClick={() => navigate('/new-arrivals')}>
              <div className="jpc-promo-card-content">
                <span className="jpc-promo-label">JUST DROPPED</span>
                <h3>New Arrivals</h3>
                <span className="jpc-promo-cta">Explore <ArrowRight size={14} /></span>
              </div>
              <div className="jpc-promo-decoration">
                <Sparkles size={50} strokeWidth={0.5} />
              </div>
            </div>
            <div className="jpc-promo-card jpc-promo-small jpc-promo-accent" onClick={() => navigate('/brands')}>
              <div className="jpc-promo-card-content">
                <span className="jpc-promo-label">BRANDS</span>
                <h3>Shop by Brand</h3>
                <span className="jpc-promo-cta">View All <ArrowRight size={14} /></span>
              </div>
              <div className="jpc-promo-decoration">
                <Tag size={50} strokeWidth={0.5} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════ FEATURED PRODUCTS ═══════ */}
      <section className="jpc-section">
        <div className="jpc-container">
          <div className="jpc-section-header">
            <div className="jpc-section-header-left">
              <h2 className="jpc-section-title">Featured Products</h2>
              <p className="jpc-section-subtitle">Handpicked just for you</p>
            </div>
            <Link to="/products" className="jpc-section-link">
              View All <ArrowRight size={14} />
            </Link>
          </div>
          <div className="jpc-scroll-container">
            <button className="jpc-scroll-btn jpc-scroll-left" onClick={() => featuredScroll.scroll('left')}>
              <ChevronLeft size={20} />
            </button>
            <div className="jpc-product-scroll" ref={featuredScroll.ref}>
              {loading ? (
                Array(6).fill(0).map((_, i) => (
                  <div key={i} className="jpc-scroll-card"><ProductSkeleton /></div>
                ))
              ) : featuredProducts.length > 0 ? (
                featuredProducts.map(p => (
                  <div key={p.id} className="jpc-scroll-card">
                    <MemoizedProductCard product={p} />
                  </div>
                ))
              ) : (
                <div className="jpc-empty"><p>No products found.</p></div>
              )}
            </div>
            <button className="jpc-scroll-btn jpc-scroll-right" onClick={() => featuredScroll.scroll('right')}>
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      </section>

      {/* ═══════ TRENDING PRODUCTS ═══════ */}
      {trendingProducts.length > 0 && (
        <section className="jpc-section jpc-trending-section">
          <div className="jpc-container">
            <div className="jpc-section-header">
              <div className="jpc-section-header-left">
                <div className="jpc-deals-title-row">
                  <Flame size={20} className="jpc-trending-icon" />
                  <h2 className="jpc-section-title">Trending Now</h2>
                </div>
                <p className="jpc-section-subtitle">Most viewed products this week</p>
              </div>
              <Link to="/products" className="jpc-section-link">
                View All <ArrowRight size={14} />
              </Link>
            </div>
            <div className="jpc-scroll-container">
              <button className="jpc-scroll-btn jpc-scroll-left" onClick={() => trendingScroll.scroll('left')}>
                <ChevronLeft size={20} />
              </button>
              <div className="jpc-product-scroll" ref={trendingScroll.ref}>
                {trendingProducts.map(p => (
                  <div key={p.id} className="jpc-scroll-card">
                    <MemoizedProductCard product={p} />
                  </div>
                ))}
              </div>
              <button className="jpc-scroll-btn jpc-scroll-right" onClick={() => trendingScroll.scroll('right')}>
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        </section>
      )}

      {/* ═══════ NEW ARRIVALS GRID ═══════ */}
      <section className="jpc-section">
        <div className="jpc-container">
          <div className="jpc-section-header">
            <div className="jpc-section-header-left">
              <h2 className="jpc-section-title">New Arrivals</h2>
              <p className="jpc-section-subtitle">Recently added products</p>
            </div>
            <Link to="/new-arrivals" className="jpc-section-link">
              View All <ArrowRight size={14} />
            </Link>
          </div>
          <div className="jpc-product-grid">
            {loading ? (
              Array(5).fill(0).map((_, i) => <ProductSkeleton key={i} />)
            ) : newArrivals.length > 0 ? (
              newArrivals.slice(0, 10).map(p => (
                <div key={p.id} className="jpc-grid-card">
                  <MemoizedProductCard product={p} />
                </div>
              ))
            ) : (
              <div className="jpc-empty"><p>No new arrivals found.</p></div>
            )}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

export default Home;
