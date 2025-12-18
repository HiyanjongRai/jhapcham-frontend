import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  ChevronRight, ChevronLeft, Zap, Smartphone, 
  Home as HomeIcon, Shirt, Heart, Dumbbell, 
  BookOpen, Car, Gamepad2, Baby, Armchair, 
  Utensils, Gift, ArrowRight
} from "lucide-react";
import "./Home.css";
import ProductCard from "../productCard/ProductCard";
import { API_BASE } from "../config/config";
import api from "../../api/axios";

// --- Mock Data for Carousel ---
const CAROUSEL_SLIDES = [
  {
    id: 1,
    image: "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?q=80&w=2070&auto=format&fit=crop",
    title: "Big Summer Sale",
    subtitle: "Up to 80% Off on Electronics",
    btnText: "Shop Now",
    link: "/products?category=Electronics & Gadgets"
  },
  {
    id: 2,
    image: "https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=2070&auto=format&fit=crop", 
    title: "New Fashion Trends",
    subtitle: "Upgrade your wardrobe today",
    btnText: "View Collection",
    link: "/products?category=Fashion & Apparel"
  },
  {
    id: 3,
    image: "https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?q=80&w=2070&auto=format&fit=crop",
    title: "Home & Living",
    subtitle: "Make your home beautiful",
    btnText: "Explore",
    link: "/products?category=Home & Living"
  }
];

// --- Simple Categories Row ---
const TOP_CATEGORIES = [
  { name: "Electronics", icon: Smartphone, val: "Electronics & Gadgets" },
  { name: "Fashion", icon: Shirt, val: "Fashion & Apparel" },
  { name: "Home", icon: HomeIcon, val: "Home & Living" },
  { name: "Beauty", icon: Heart, val: "Beauty & Personal Care" },
  { name: "Sports", icon: Dumbbell, val: "Sports & Fitness" },
  { name: "Books", icon: BookOpen, val: "Books & Education" },
  { name: "Auto", icon: Car, val: "Automobiles & Accessories" },
  { name: "Toys", icon: Gamepad2, val: "Toys, Games & Entertainment" },
  { name: "More", icon: ChevronRight, val: "all" }
];

function Home() {
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch Products
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await api.get("/api/products");
        const data = res.data;
        // Sort and map
        const mapped = data.map(dto => ({
          ...dto,
          // Legacy backend uses 'imagePaths' array
          imagePath: (dto.imagePaths && dto.imagePaths.length > 0) ? dto.imagePaths[0] : (dto.imagePath || ""),
          rating: dto.averageRating || 0,
          stock: dto.stockQuantity ?? dto.stock ?? 0,
          originalImagePath: dto.imagePaths // Keep for reference if needed
        }));
        setProducts(mapped);
      } catch (err) {
        console.error("Failed to fetch products", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  // Carousel Logic
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % CAROUSEL_SLIDES.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const nextSlide = () => setCurrentSlide((currentSlide + 1) % CAROUSEL_SLIDES.length);
  const prevSlide = () => setCurrentSlide((currentSlide - 1 + CAROUSEL_SLIDES.length) % CAROUSEL_SLIDES.length);

  // Derived Lists
  const electronics = products.filter(p => p.category === "Electronics & Gadgets").slice(0, 8);
  const fashion = products.filter(p => p.category === "Fashion & Apparel").slice(0, 8);
  const trending = [...products].sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0)).slice(0, 8);
  const newArrivals = [...products].sort((a, b) => b.id - a.id).slice(0, 12);

  return (
    <div className="amazon-home">
      
      {/* 1. Hero Carousel */}
      <section className="amz-carousel-container">
        <button className="amz-arrow left" onClick={prevSlide}><ChevronLeft /></button>
        <div className="amz-slides" style={{ transform: `translateX(-${currentSlide * 100}%)` }}>
          {CAROUSEL_SLIDES.map((slide, index) => (
            <div 
              className="amz-slide" 
              key={slide.id} 
              style={{ backgroundImage: `url(${slide.image})` }}
            >
              <div className="amz-slide-content">
                <h2>{slide.title}</h2>
                <p>{slide.subtitle}</p>
                <button 
                  className="amz-hero-btn" 
                  onClick={() => navigate(slide.link)}
                >
                  {slide.btnText}
                </button>
              </div>
            </div>
          ))}
        </div>
        <button className="amz-arrow right" onClick={nextSlide}><ChevronRight /></button>
        
        {/* Dots */}
        <div className="amz-dots">
          {CAROUSEL_SLIDES.map((_, i) => (
            <span 
              key={i} 
              className={`amz-dot ${i === currentSlide ? "active" : ""}`}
              onClick={() => setCurrentSlide(i)} 
            />
          ))}
        </div>
      </section>

      {/* 2. Top Categories Bar (Mobile Style / Quick Links) */}
      <section className="amz-cat-row-section">
        <div className="amz-container">
          <div className="amz-cat-row">
            {TOP_CATEGORIES.map((cat, idx) => (
              <div 
                key={idx} 
                className="amz-cat-item" 
                onClick={() => cat.val === 'all' ? navigate('/products') : navigate(`/products?category=${cat.val}`)}
              >
                <div className="amz-cat-icon">
                  <cat.icon size={24} />
                </div>
                <span>{cat.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. Flash Sale / Deal of the Day */}
      <section className="amz-section bg-white">
        <div className="amz-container">
          <div className="amz-header-flex">
             <h2 className="amz-title">Deal of the Day <Zap size={24} fill="#eab308" className="inline-icon" /></h2>
             <Link to="/products" className="amz-link">See all deals</Link>
          </div>
          <div className="amz-info-bar">
             <span className="scarcity-text">Ends in <strong>12:30:45</strong></span>
          </div>
          
          <div className="amz-scroll-row">
             {loading ? <p>Loading deals...</p> : trending.map(p => (
                <div className="amz-card-mini" key={p.id}>
                   <ProductCard product={p} />
                </div>
             ))}
          </div>
        </div>
      </section>

      {/* Banner Strip */}
      <div className="amz-banner-strip">
         <img src="https://images.unsplash.com/photo-1557821552-17105176677c?q=80&w=2000&auto=format&fit=crop" alt="Sale Banner" />
      </div>

      {/* 4. Best Sellers in Electronics (Horizontal Scroll) */}
      <section className="amz-section bg-gray">
        <div className="amz-container">
          <h2 className="amz-title">Best Sellers in Electronics</h2>
          <div className="amz-scroll-row">
             {electronics.length > 0 ? electronics.map(p => (
                <div className="amz-card-mini" key={p.id}>
                   <ProductCard product={p} />
                </div>
             )) : <p className="no-items">No electronics found.</p>}
          </div>
        </div>
      </section>

      {/* 5. New Arrivals (Grid Layout) */}
      <section className="amz-section bg-white">
        <div className="amz-container">
          <div className="amz-header-flex">
             <h2 className="amz-title">New Arrivals</h2>
             <Link to="/products?sort=new" className="amz-link">Browse All</Link>
          </div>
          <div className="amz-grid-4">
             {newArrivals.map(p => (
               <div key={p.id} className="amz-grid-item">
                 <ProductCard product={p} />
               </div>
             ))}
          </div>
        </div>
      </section>

      {/* 6. Just For You (Personalized / Random) */}
      <section className="amz-section bg-gray">
        <div className="amz-container">
          <h2 className="amz-title">Just For You</h2>
          <div className="amz-grid-5">
             {(() => {
               // Fisher-Yates shuffle for better performance
               const shuffled = [...products.slice(0, 10)];
               for (let i = shuffled.length - 1; i > 0; i--) {
                 const j = Math.floor(Math.random() * (i + 1));
                 [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
               }
               return shuffled.map(p => (
                 <div key={p.id} className="amz-grid-item-sm">
                   <ProductCard product={p} />
                 </div>
               ));
             })()}
          </div>
        </div>
      </section>
      
      {/* Footer Info / Promise */}
      <section className="amz-promise-section">
         <div className="amz-container amz-promise-grid">
            <div className="promise-item">
               <div className="p-icon">🛡️</div>
               <h3>100% Secure Payments</h3>
            </div>
            <div className="promise-item">
               <div className="p-icon">🚚</div>
               <h3>Fast & Free Shipping</h3>
            </div>
            <div className="promise-item">
               <div className="p-icon">🔄</div>
               <h3>Easy Returns</h3>
            </div>
            <div className="promise-item">
               <div className="p-icon">🎧</div>
               <h3>24/7 Support</h3>
            </div>
         </div>
      </section>

    </div>
  );
}

export default Home;
