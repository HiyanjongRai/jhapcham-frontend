import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  ChevronRight, Package, ArrowRight, Search,
  ShieldCheck, Truck, Headphones, RotateCcw, 
  Star, Smartphone, Home as HomeIcon, Shirt, 
  Heart, Dumbbell, BookOpen, Car, Gamepad2
} from "lucide-react";
import "./Home.css";
import ProductCard from "../productCard/ProductCard";
import CountdownTimer from "./CountdownTimer";
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

function Home() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [campaignProducts, setCampaignProducts] = useState([]);
  const [activeCampaign, setActiveCampaign] = useState(null);

  // Icon Mapping Helper
  const getCategoryIcon = (name) => {
    if (!name) return Package;
    const lower = name.toLowerCase();
    if (lower.includes('fashion') || lower.includes('cloth')) return Shirt;
    if (lower.includes('electr') || lower.includes('phone') || lower.includes('mobile')) return Smartphone;
    if (lower.includes('home') || lower.includes('living')) return HomeIcon;
    if (lower.includes('kitchen') || lower.includes('cook')) return Package;
    if (lower.includes('furnit') || lower.includes('sofa')) return HomeIcon;
    if (lower.includes('food') || lower.includes('eat')) return Package;
    if (lower.includes('game') || lower.includes('toy')) return Gamepad2;
    if (lower.includes('beauty') || lower.includes('health') || lower.includes('makeup')) return Heart;
    return Package;
  };

  // Fetch Data
  useEffect(() => {
    const fetchData = async () => {
        try {
            // Fetch Products
            const prodRes = await api.get("/api/products");
            if (prodRes.data) {
                 const mapped = prodRes.data.map(dto => ({
                  ...dto,
                  imagePath: (dto.imagePaths && dto.imagePaths.length > 0) ? dto.imagePaths[0] : (dto.imagePath || ""),
                  rating: dto.averageRating || 0,
                  stock: dto.stockQuantity ?? dto.stock ?? 0,
                  originalImagePath: dto.imagePaths
                }));
                setProducts(mapped);
                
                // Extract unique brands from products for "from backend" brands
                const uniqueBrands = [...new Set(mapped.map(p => p.brand).filter(Boolean))];
                setBrands(uniqueBrands.sort());
            }
        } catch (err) {
            console.warn("Product fetch error", err);
        } finally {
            setLoading(false);
        }

        try {
            // Fetch Categories
            const catRes = await api.get("/api/categories");
            if (catRes.data) setCategories(catRes.data);
        } catch (err) {
            console.warn("Category fetch error", err);
        }

        try {
            // Fetch Campaigns
            const campRes = await api.get("/api/campaigns");
            if (campRes.data && campRes.data.length > 0) {
                setCampaigns(campRes.data);
                const firstCampaign = campRes.data[0];
                setActiveCampaign(firstCampaign);
                
                // Fetch campaign products
                try {
                    const campProdRes = await api.get(`/api/campaigns/${firstCampaign.id}/products`);
                    if (campProdRes.data) {
                        const mappedCampProducts = campProdRes.data.map(cp => ({
                            id: cp.productId,
                            name: cp.productName,
                            imagePath: cp.productImage,
                            price: cp.originalPrice,
                            salePrice: cp.salePrice,
                            onSale: true,
                            saleLabel: firstCampaign.name,
                            stock: cp.stockLimit,
                            category: "Campaign Deals",
                            rating: 5,
                            sellerName: cp.sellerName,
                            storeName: cp.sellerName
                        }));
                        setCampaignProducts(mappedCampProducts.slice(0, 8));
                    }
                } catch (err) {
                    console.warn("Campaign products fetch error", err);
                }
            }
        } catch (err) {
            console.warn("Campaign fetch error", err);
        }
    };
    
    fetchData();
  }, []);

  // Derived product lists
  const featuredProducts = [...products].sort((a,b) => (b.totalViews || 0) - (a.totalViews || 0)).slice(0, 8);
  const bestSellers = [...products].sort((a,b) => (b.salesCount || 0) - (a.salesCount || 0)).slice(0, 12);

  return (
    <div className="home-wrapper-v2">
      {/* Main Content Container */}
      <div className="main-content-wrapper">
        {/* Left Sidebar - Categories */}
        <aside className="categories-sidebar">
          <button className="browse-categories-btn">
            <Package size={20} />
            Browse Categories
          </button>
          
          <nav className="sidebar-nav">
            <div className="sidebar-section-header">
              <Package size={18} />
              <span>Categories</span>
            </div>
            {categories.length > 0 ? (
                categories.map((cat) => {
                  const Icon = getCategoryIcon(cat.name);
                  return (
                      <Link 
                        key={cat.id}
                        to={`/products?category=${encodeURIComponent(cat.name)}`}
                        className="sidebar-category-item"
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <Icon size={16} />
                            <span>{cat.name}</span>
                        </div>
                        <ChevronRight size={14} />
                      </Link>
                  );
                })
            ) : (
                <div className="sidebar-loading-text">Loading categories...</div>
            )}


            
            <Link 
              to="/products"
              className="sidebar-category-item view-all-categories"
            >
              <span>Explore All Products</span>
              <ChevronRight size={16} />
            </Link>
          </nav>

          {/* Service Features in Sidebar */}
          <div className="sidebar-features">
            <div className="feature-item">
              <div className="feature-icon">
                <Truck size={24} />
              </div>
              <div className="feature-text">
                <h4>Free Shipping</h4>
                <p>On orders over Rs 2000</p>
              </div>
            </div>

            <div className="feature-item">
              <div className="feature-icon">
                <Headphones size={24} />
              </div>
              <div className="feature-text">
                <h4>24/7 Support</h4>
                <p>Contact us 24 hours</p>
              </div>
            </div>

            <div className="feature-item">
              <div className="feature-icon">
                <ShieldCheck size={24} />
              </div>
              <div className="feature-text">
                <h4>Best Prices & offers</h4>
                <p>Order $50 or more</p>
              </div>
            </div>

            <div className="feature-item">
              <div className="feature-icon">
                <RotateCcw size={24} />
              </div>
              <div className="feature-text">
                <h4>Easy Returns</h4>
                <p>Within 7 days</p>
              </div>
            </div>
          </div>
        </aside>

        {/* Right Content Area */}
        <div className="main-content-area">
          {/* Hero Banner Section */}
          <section className="hero-banner-section">
            <div className="hero-banner-content">
              <div className="hero-text-area">
                <p className="hero-discount-badge">Up to 70% off on Black Friday</p>
                <h1 className="hero-main-title">
                  TRENDY <span className="hero-highlight">FASHION</span><br />
                  COLLECTION
                </h1>
                <button onClick={() => navigate('/products?category=Fashion')} className="hero-cta-button">
                  Buy Now
                </button>
              </div>
              <div className="hero-image-area">
                <img 
                  src="https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=800&auto=format&fit=crop" 
                  alt="Fashion model with shopping bags" 
                  className="hero-model-image"
                />
              </div>
            </div>
          </section>

          {/* Promotional / Campaigns Section */}
          <section className="promo-cards-section">
             {campaigns.length > 0 ? (
                <div className="promo-cards-grid">
                  {campaigns.slice(0, 10).map((campaign, idx) => (
                    <div className="promo-card" key={campaign.id || idx} onClick={() => navigate(`/products?campaign=${campaign.id}`)}>
                        <div className="promo-content">
                          <span className="promo-type-label">{campaign.type?.replace(/_/g, ' ')}</span>
                          <h3 className="promo-title">{campaign.name}</h3>
                          <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '16px', fontWeight: 500 }}>
                             Ends: {new Date(campaign.endTime).toLocaleDateString()}
                          </div>
                          <button className="promo-btn">
                            VIEW DEALS
                            <ArrowRight size={14} />
                          </button>
                        </div>
                        <div className="promo-image-wrapper">
                           <img 
                                src={campaign.imagePath ? (campaign.imagePath.startsWith('http') ? campaign.imagePath : `${API_BASE}/${campaign.imagePath}`) : `https://images.unsplash.com/photo-1556742049-0cfed4f7a07d?auto=format&fit=crop&w=300`} 
                                onError={(e) => {
                                    e.target.onerror = null; 
                                    e.target.src = 'https://images.unsplash.com/photo-1556742049-0cfed4f7a07d?auto=format&fit=crop&w=300';
                                }}
                                alt={campaign.name || "Campaign"} 
                           />
                        </div>
                    </div>
                  ))}
                </div>
             ) : (
                <div className="promo-cards-grid">
                    {/* Fallback Static Promos if no campaigns */}
                   <div className="promo-card">
                    <div className="promo-content">
                      <h3 className="promo-title">Seasonal Sale</h3>
                      <p className="promo-offer">Up to 50% Off</p>
                      <button onClick={() => navigate('/products')} className="promo-btn">
                        Shop Now
                        <ArrowRight size={18} />
                      </button>
                    </div>
                    <div className="promo-image">
                       <img 
                         src="https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?q=80&w=300&auto=format&fit=crop" 
                         alt="Sale" 
                         onError={(e) => {
                             e.target.onerror = null;
                             e.target.style.display = 'none'; // Hide if fails
                         }}
                       />
                    </div>
                  </div>
                   <div className="promo-card">
                    <div className="promo-content">
                      <h3 className="promo-title">New Arrivals</h3>
                      <p className="promo-offer">Fresh Looks</p>
                      <button onClick={() => navigate('/products?sort=newest')} className="promo-btn">
                         Explore
                         <ArrowRight size={18} />
                      </button>
                    </div>
                    <div className="promo-image">
                       <img 
                         src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=300&auto=format&fit=crop" 
                         alt="New" 
                         onError={(e) => {
                             e.target.onerror = null;
                             e.target.style.display = 'none';
                         }}
                       />
                    </div>
                  </div>
                </div>
             )}
          </section>

      </div>
    </div>

      {/* Full Width Sections Below Sidebar Grid */}
      <div className="full-width-content-wrapper">
          {/* Campaign Products Section */}
          {activeCampaign && campaignProducts.length > 0 && (
            <section className="campaign-products-section">
              <div className="campaign-section-header">
                <div className="campaign-header-left">
                  <div className="campaign-badge-row">
                    <span className="campaign-type-badge">{activeCampaign.type?.replace(/_/g, ' ')}</span>
                    <span className="live-indicator">
                      <span className="blink-dot"></span> LIVE NOW
                    </span>
                  </div>
                  <h2 className="campaign-section-title">{activeCampaign.name}</h2>
                </div>
                <div className="campaign-header-right">
                  <div className="campaign-countdown-wrapper">
                    <p className="countdown-label">Ends In:</p>
                    <CountdownTimer targetDate={activeCampaign.endTime} />
                  </div>
                  <button 
                    onClick={() => navigate(`/products?campaign=${activeCampaign.id}`)} 
                    className="view-all-campaign-btn"
                  >
                    View All Deals
                    <ArrowRight size={18} />
                  </button>
                </div>
              </div>

              <div className="featured-products-grid-v2">
                {campaignProducts.map(product => (
                  <div key={product.id} className="featured-product-wrapper">
                    <ProductCard product={product} />
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Featured Items Section */}
          <section className="featured-items-section">
            <div className="section-header-with-nav">
              <h2 className="section-title">Featured Item</h2>
              <div className="section-nav-arrows">
                <button className="nav-arrow-btn" aria-label="Previous">
                  <ChevronRight size={20} style={{ transform: 'rotate(180deg)' }} />
                </button>
                <button className="nav-arrow-btn" aria-label="Next">
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>

            <div className="featured-products-grid-v2">
              {loading ? (
                Array(8).fill(0).map((_, i) => <ProductSkeleton key={i} />)
              ) : featuredProducts.length > 0 ? (
                featuredProducts.map(product => (
                  <div key={product.id} className="featured-product-wrapper">
                    <ProductCard product={product} />
                  </div>
                ))
              ) : (
                <div className="no-products-message">
                  <Package size={48} />
                  <p>No featured products available</p>
                </div>
              )}
            </div>
          </section>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
}

export default Home;
