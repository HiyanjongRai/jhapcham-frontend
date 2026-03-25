import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  ChevronRight, Package, ArrowRight,
  ShieldCheck, Truck, Headphones, 
  Smartphone, Home as HomeIcon, Shirt, 
  Heart, Gamepad2, Menu, Clock, CircleDollarSign
} from "lucide-react";
import "./Home.css";
import ProductCard from "../productCard/ProductCard";
import Footer from "../FooterSection/Footer";
import { API_BASE } from "../config/config";
import api from "../../api/axios";

// Product Skeleton Loader
const ProductSkeleton = () => (
  <div className="product-skeleton">
    <div className="skeleton-image"></div>
    <div className="skeleton-text skeleton-title"></div>
    <div className="skeleton-text skeleton-price"></div>
    <div className="skeleton-text skeleton-rating"></div>
  </div>
);

// Helper functions for formatting
const formatRs = (price) => {
  if (price === null || price === undefined) return null;
  return new Intl.NumberFormat('en-IN').format(price);
};

const formatCampaignLabel = (type) => {
  if (!type) return "LIMITED EDITION";
  return type.replace(/_/g, ' ').toUpperCase();
};

function Home() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [activeCampaign, setActiveCampaign] = useState(null);

  // Icon Mapping Helper for Porto Sidebar
  const getCategoryIcon = (name) => {
    if (!name) return Package;
    const lower = name.toLowerCase();
    if (lower.includes('fashion') || lower.includes('cloth')) return Shirt;
    if (lower.includes('electr') || lower.includes('phone') || lower.includes('mobile')) return Smartphone;
    if (lower.includes('home') || lower.includes('living') || lower.includes('furnit')) return HomeIcon;
    if (lower.includes('game') || lower.includes('toy')) return Gamepad2;
    if (lower.includes('beauty') || lower.includes('health') || lower.includes('makeup')) return Heart;
    return Package;
  };

  useEffect(() => {
    const fetchData = async () => {
      // 1. Fetch Products
      try {
        const prodRes = await api.get("/api/products");
        if (prodRes.data) {
          const mapped = prodRes.data.map(dto => ({
            ...dto,
            imagePath: (dto.imagePaths && dto.imagePaths.length > 0) ? dto.imagePaths[0] : (dto.imagePath || ""),
            rating: dto.averageRating || 0,
            stock: dto.stockQuantity ?? dto.stock ?? 0,
          }));
          setProducts(mapped);
        }
      } catch (err) { console.warn("Product fetch error", err); }
      finally { setLoading(false); }

      // 2. Fetch Categories
      try {
        const catRes = await api.get("/api/categories");
        if (catRes.data) setCategories(catRes.data);
      } catch (err) { console.warn("Category fetch error", err); }

      // 3. Fetch Campaigns for Hero & Promos
      try {
        const campRes = await api.get("/api/campaigns");
        if (campRes.data && campRes.data.length > 0) {
          const activeOnly = campRes.data.filter(c => c.status === 'ACTIVE');
          setCampaigns(activeOnly.length > 0 ? activeOnly : campRes.data);
          setActiveCampaign(activeOnly.length > 0 ? activeOnly[0] : campRes.data[0]);
        }
      } catch (err) { console.warn("Campaign fetch error", err); }
    };
    fetchData();
  }, []);

  // Campaign Auto-Slider
  useEffect(() => {
    if (campaigns.length <= 1) return;
    
    const sliderInterval = setInterval(() => {
      setActiveCampaign(prev => {
        const currentIndex = campaigns.findIndex(c => c.id === prev.id);
        const nextIndex = (currentIndex + 1) % campaigns.length;
        return campaigns[nextIndex];
      });
    }, 5000);

    return () => clearInterval(sliderInterval);
  }, [campaigns]);

  // Sections
  const featuredProducts = products.slice(0, 12);
  const newArrivals = [...products].reverse().slice(0, 12);

  return (
    <div className="home-wrapper-v2">
      <div className="home-main-layout">
        
        {/* Category Sidebar (Sticky) */}
        <aside className="porto-cat-sidebar">
          <div className="porto-cat-title">
            <strong>TOP CATEGORIES</strong>
          </div>
          
          <nav className="porto-cat-nav">
            {categories.length > 0 ? (
              categories.slice(0, 10).map((cat) => {
                const Icon = getCategoryIcon(cat.name);
                return (
                  <Link 
                    key={cat.id}
                    to={`/products?category=${encodeURIComponent(cat.name)}`}
                    className="porto-cat-item gt-small"
                  >
                    <div className="porto-cat-item-left">
                      <Icon size={14} />
                      <span>{cat.name}</span>
                    </div>
                    <ChevronRight size={11} />
                  </Link>
                );
              })
            ) : (
              Array(6).fill(0).map((_, i) => <div key={i} className="porto-cat-skeleton"></div>)
            )}
            <Link to="/products" className="porto-cat-item porto-cat-view-all">
              <span>View All Products</span>
              <ChevronRight size={11} />
            </Link>
          </nav>

          <div className="porto-cat-sale-banner" onClick={() => navigate('/products')}>
             <span className="sale-text gt-h3">HUGE SALE — 70% OFF</span>
          </div>
        </aside>

        {/* Scrollable Content Area */}
        <div className="home-scrollable-content">
          
          {/* Hero Banner Area */}
          <section className="porto-hero" aria-labelledby="home-hero-heading">
            <div className="porto-hero-inner">
              <div className="porto-hero-text">
                <p className="porto-hero-eyebrow">Find the Boundaries. Push Through!</p>
                <h1 id="home-hero-heading" className="porto-hero-title">
                  <span className="porto-hero-title-line">Summer Sale</span>
                  <span className="porto-hero-title-large">30% OFF</span>
                </h1>
                
                <div className="porto-hero-price-display">
                  <span className="starting-at">STARTING AT</span>
                  <div className="price-tag-row">
                    <span className="price-red">
                      <span className="price-currency">$</span>199<span className="price-cents">99</span>
                    </span>
                  </div>
                </div>

                <div className="porto-hero-actions">
                  <button
                    type="button"
                    className="porto-shop-btn-primary"
                    onClick={() => navigate(activeCampaign ? `/products?campaign=${activeCampaign.id}` : "/products")}
                  >
                    GET YOURS!
                  </button>
                </div>
              </div>

              <div className="porto-hero-img-area">
                <div className="img-glow-bg" aria-hidden />
                <img
                  src={activeCampaign?.imagePath
                    ? (activeCampaign.imagePath.startsWith("http") ? activeCampaign.imagePath : `${API_BASE}/${activeCampaign.imagePath}`)
                    : "https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=1200&auto=format&fit=crop"
                  }
                  alt={activeCampaign?.name ? `${activeCampaign.name} — campaign` : "Featured collection"}
                  className="porto-hero-img-hero"
                  key={activeCampaign?.id}
                />
              </div>

              <div className="porto-hero-dots">
                <button className="hero-dot active" aria-label="Slide 1"></button>
                <button className="hero-dot" aria-label="Slide 2"></button>
                <button className="hero-dot" aria-label="Slide 3"></button>
              </div>
            </div>
          </section>

          {/* Features Bar */}
          <div className="porto-features-bar">
            {[
              { icon: <Truck size={38} strokeWidth={1}/>, title: "FREE SHIPPING & RETURN", sub: "Free shipping on all orders over $99." },
              { icon: <CircleDollarSign size={38} strokeWidth={1}/>, title: "MONEY BACK GUARANTEE", sub: "100% money back guarantee" },
              { icon: <Clock size={38} strokeWidth={1}/>, title: "ONLINE SUPPORT 24/7", sub: "Lorem ipsum dolor sit amet." },
            ].map((f, i) => (
              <div key={i} className="porto-feature-item">
                <div className="porto-feature-icon">{f.icon}</div>
                <div className="porto-feature-text">
                  <strong className="gt-caption">{f.title}</strong>
                  <span>{f.sub}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="porto-content-wrapper">
            {/* Featured Section */}
            <section className="porto-section">
              <div className="porto-section-header">
                <h2 className="porto-section-title-centered gt-h2">FEATURED PRODUCTS</h2>
              </div>
              <div className="porto-product-grid">
                {loading ? (
                  Array(6).fill(0).map((_, i) => <ProductSkeleton key={i} />)
                ) : (featuredProducts && featuredProducts.length > 0) ? (
                  featuredProducts.map(p => (
                    <div key={p.id} className="porto-product-wrapper">
                      <ProductCard product={p} />
                    </div>
                  ))
                ) : (
                  <div className="porto-empty"><p>No featured products found.</p></div>
                )}
              </div>
            </section>

            {/* Arrivals Section */}
            <section className="porto-section">
              <div className="porto-section-header">
                <h2 className="porto-section-title-centered gt-h2">NEW ARRIVALS</h2>
              </div>
              <div className="porto-product-grid">
                {loading ? (
                  Array(6).fill(0).map((_, i) => <ProductSkeleton key={i} />)
                ) : (newArrivals && newArrivals.length > 0) ? (
                  newArrivals.map(p => (
                    <div key={p.id} className="porto-product-wrapper">
                      <ProductCard product={p} />
                    </div>
                  ))
                ) : (
                  <div className="porto-empty"><p>No new arrivals found.</p></div>
                )}
              </div>
            </section>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default Home;
