import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  ChevronRight, ChevronLeft, Zap, Smartphone, 
  Home as HomeIcon, Shirt, Heart, Dumbbell, 
  BookOpen, Car, Gamepad2, Package, 
  ArrowRight, TrendingUp, Award, BarChart3, 
  Sparkles, Star, Clock, Flame
} from "lucide-react";
import "./Home.css";
import ProductCard from "../productCard/ProductCard";
import CountdownTimer from "./CountdownTimer";
import Footer from "../Footer/Footer";
import { API_BASE } from "../config/config";
import api from "../../api/axios";

// --- Enhanced Carousel Data ---
const CAROUSEL_SLIDES = [
  {
    id: 1,
    image: "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?q=80&w=2070&auto=format&fit=crop",
    title: "Premium Tech Experience",
    subtitle: "Discover cutting-edge gadgets and electronics that redefine innovation.",
    btnText: "Shop Now",
    link: "/products?category=Electronics & Gadgets",
    badge: "New Arrivals"
  },
  {
    id: 2,
    image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=2070&auto=format&fit=crop", 
    title: "Elevate Your Style",
    subtitle: "Curated fashion collections for the modern trendsetter.",
    btnText: "View Collection",
    link: "/products?category=Fashion & Apparel",
    badge: "Trending Now"
  },
  {
    id: 3,
    image: "https://images.unsplash.com/photo-1616489953149-9984763b4b59?q=80&w=2070&auto=format&fit=crop",
    title: "Home Redefined",
    subtitle: "Transform your space with elegant furniture and premium decor.",
    btnText: "Explore More",
    link: "/products?category=Home & Living",
    badge: "Best Sellers"
  }
];

const TOP_CATEGORIES = [
  { name: "Electronics", icon: Smartphone, val: "Electronics & Gadgets", gradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" },
  { name: "Fashion", icon: Shirt, val: "Fashion & Apparel", gradient: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)" },
  { name: "Home", icon: HomeIcon, val: "Home & Living", gradient: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)" },
  { name: "Beauty", icon: Heart, val: "Beauty & Personal Care", gradient: "linear-gradient(135deg, #fa709a 0%, #fee140 100%)" },
  { name: "Sports", icon: Dumbbell, val: "Sports & Fitness", gradient: "linear-gradient(135deg, #30cfd0 0%, #330867 100%)" },
  { name: "Books", icon: BookOpen, val: "Books & Education", gradient: "linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)" },
  { name: "Auto", icon: Car, val: "Automobiles & Accessories", gradient: "linear-gradient(135deg, #ff9a56 0%, #ff6a88 100%)" },
  { name: "More", icon: Package, val: "all", gradient: "linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)" }
];

// Skeleton Loader Component
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
  const [currentSlide, setCurrentSlide] = useState(0);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [slideDirection, setSlideDirection] = useState('next');

  // Fetch Products
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await api.get("/api/products");
        const data = res.data;
        
        if (!data || data.length === 0) throw new Error("No products returned");

        const mapped = data.map(dto => ({
          ...dto,
          imagePath: (dto.imagePaths && dto.imagePaths.length > 0) ? dto.imagePaths[0] : (dto.imagePath || ""),
          rating: dto.averageRating || 0,
          stock: dto.stockQuantity ?? dto.stock ?? 0,
          originalImagePath: dto.imagePaths
        }));
        setProducts(mapped);
      } catch (err) {
        console.warn("Backend error. Using static products.", err);
        import("../config/staticProducts").then(module => {
           setProducts(module.STATIC_PRODUCTS);
        });
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  // Enhanced Carousel Logic
  useEffect(() => {
    const timer = setInterval(() => {
      setSlideDirection('next');
      setCurrentSlide(prev => (prev + 1) % CAROUSEL_SLIDES.length);
    }, 7000);
    return () => clearInterval(timer);
  }, []);

  const nextSlide = () => {
    setSlideDirection('next');
    setCurrentSlide((currentSlide + 1) % CAROUSEL_SLIDES.length);
  };
  
  const prevSlide = () => {
    setSlideDirection('prev');
    setCurrentSlide((currentSlide - 1 + CAROUSEL_SLIDES.length) % CAROUSEL_SLIDES.length);
  };

  // Derived Lists
  const featuredHero = [...products].sort((a,b) => (b.totalViews || 0) - (a.totalViews || 0)).slice(0, 5);
  const topSelling = [...products].sort((a, b) => (b.totalViews || 0) - (a.totalViews || 0)).slice(0, 10);
  const mostRated = [...products].sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0)).slice(0, 10);
  const newArrivals = [...products].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)).slice(0, 10);
  
  // Group Sale Products by Campaign
  const saleProducts = products.filter(p => p.onSale && p.saleLabel);
  const campaignGroups = saleProducts.reduce((acc, p) => {
    if (!acc[p.saleLabel]) {
      acc[p.saleLabel] = {
        name: p.saleLabel,
        endTime: p.saleEndTime,
        list: []
      };
    }
    acc[p.saleLabel].list.push(p);
    return acc;
  }, {});

  const campaigns = Object.values(campaignGroups);

  return (
    <div className="home-wrapper">
      
      {/* 1. Premium Hero Banner Section */}
      <section className="hero-master">
        <div className="hero-slider">
          {CAROUSEL_SLIDES.map((slide, index) => (
            <div 
              className={`hero-slide ${index === currentSlide ? "active" : ""} ${slideDirection}`} 
              key={slide.id} 
              style={{ backgroundImage: `url(${slide.image})` }}
            >
              <div className="hero-overlay-gradient"></div>
              <div className="hero-content-wrapper">
                <div className="hero-text-content">
                  <span className="hero-badge">
                    <Sparkles size={14} />
                    {slide.badge}
                  </span>
                  <h1 className="hero-title">{slide.title}</h1>
                  <p className="hero-subtitle">{slide.subtitle}</p>
                  <div className="hero-actions">
                    <button onClick={() => navigate(slide.link)} className="hero-btn-primary">
                      {slide.btnText}
                      <ArrowRight size={20} />
                    </button>
                    <button onClick={() => navigate('/products')} className="hero-btn-secondary">
                      Browse All
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
          
          {/* Navigation Controls */}
          <div className="hero-nav-controls">
            <button className="hero-nav-btn hero-nav-prev" onClick={prevSlide} aria-label="Previous slide">
              <ChevronLeft size={24}/>
            </button>
            <button className="hero-nav-btn hero-nav-next" onClick={nextSlide} aria-label="Next slide">
              <ChevronRight size={24}/>
            </button>
          </div>

          {/* Slide Indicators */}
          <div className="hero-indicators">
            {CAROUSEL_SLIDES.map((_, index) => (
              <button
                key={index}
                className={`indicator ${index === currentSlide ? "active" : ""}`}
                onClick={() => setCurrentSlide(index)}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* 2. Featured Products Showcase - 5 Products */}
      <section className="featured-showcase">
        <div className="home-container">
          <div className="featured-header">
            <div className="featured-header-content">
              <h2 className="section-title-large">
                <Flame size={32} className="icon-flame" />
                Trending Now
              </h2>
              <p className="section-subtitle">Handpicked products loved by our community</p>
            </div>
          </div>
          
          <div className="featured-products-grid">
            {loading ? (
              Array(5).fill(0).map((_, i) => <ProductSkeleton key={i} />)
            ) : featuredHero.length > 0 ? (
              featuredHero.map((product, idx) => (
                <div className="featured-product-item" key={product.id} style={{ animationDelay: `${idx * 0.1}s` }}>
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
        </div>
      </section>



      {/* 3. Top Selling */}
      <section className="products-section">
        <div className="home-container">
          <div className="section-header-inline">
            <div>
              <h2 className="section-title-medium">
                <TrendingUp size={28} className="icon-trend" />
                Top Selling
              </h2>
              <p className="section-subtitle">Most popular products this month</p>
            </div>
            <Link to="/products?sort=popular" className="section-link">
              See All
              <ArrowRight size={18}/>
            </Link>
          </div>
          
          <div className="products-scroll-container">
            {loading ? (
              Array(5).fill(0).map((_, i) => <ProductSkeleton key={i} />)
            ) : (
              topSelling.map(product => (
                <div className="product-scroll-item" key={product.id}>
                  <ProductCard product={product} />
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* 6. Customer's Choice */}
      <section className="products-section section-alt">
        <div className="home-container">
          <div className="section-header-center">
            <h2 className="section-title-medium">
              <Award size={32} className="icon-award" />
              Customer's Choice
            </h2>
            <p className="section-subtitle">Highest rated products by our community</p>
          </div>
          
          <div className="products-grid-container">
            {loading ? (
              Array(10).fill(0).map((_, i) => <ProductSkeleton key={i} />)
            ) : mostRated.length > 0 ? (
              mostRated.map(product => (
                <div className="product-grid-item" key={product.id}>
                  <ProductCard product={product} />
                </div>
              ))
            ) : (
              <div className="no-products-message">
                <Star size={48} />
                <p>No rated products yet</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 7. Footer */}
      <Footer />

    </div>
  );
}

export default Home;
