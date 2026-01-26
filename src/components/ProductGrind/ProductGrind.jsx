import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import ProductCard from "../productCard/ProductCard";
import "./ProjectGrind.css";
import "./ProductGridFilters.css";
import { Filter, X, ArrowLeft } from "lucide-react";
import CountdownTimer from "../Home/CountdownTimer";

import { getCurrentUserId, addToGuestCart, apiAddToCart } from "../AddCart/cartUtils";

import { API_BASE } from "../config/config";

const ProductSkeleton = () => (
  <div className="product-skeleton">
    <div className="skeleton-image"></div>
    <div className="skeleton-text skeleton-title"></div>
    <div className="skeleton-text skeleton-price"></div>
    <div className="skeleton-text skeleton-rating"></div>
  </div>
);


// Map backend ProductResponseDTO to frontend product format
function mapProductDto(dto) {
  return {
    ...dto,
    // Legacy uses 'imagePaths' array
    imagePath: (dto.imagePaths && dto.imagePaths.length > 0) ? dto.imagePaths[0] : (dto.imagePath || ""),
    rating: dto.averageRating || 0,
    stock: dto.stockQuantity ?? dto.stock ?? 0,
  };
}


function ProductGrid() {
  const [searchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filters
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [sortBy, setSortBy] = useState("id,desc");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [minRating, setMinRating] = useState("");
  const [maxRating, setMaxRating] = useState("");
  const [minViews, setMinViews] = useState("");
  const [maxViews, setMaxViews] = useState("");
  const [brand, setBrand] = useState("");
  const [onSale, setOnSale] = useState("");
  const [mfgStart, setMfgStart] = useState("");
  const [mfgEnd, setMfgEnd] = useState("");
  const [expStart, setExpStart] = useState("");
  const [expEnd, setExpEnd] = useState("");
  const [selectedColors, setSelectedColors] = useState([]);
  const [selectedStorage, setSelectedStorage] = useState([]);

  const [campaignInfo, setCampaignInfo] = useState(null);

  const [showFilters, setShowFilters] = useState(false);

  const navigate = useNavigate();
  const userId = getCurrentUserId();
  const isLoggedIn = !!userId;

  // Read category and search from URL on mount
  useEffect(() => {
    const categoryParam = searchParams.get('category');
    if (categoryParam) {
      setCategoryFilter(categoryParam);
    }
    const searchParam = searchParams.get('search');
    if (searchParam) {
      setSearch(searchParam);
    }
  }, [searchParams]);


  // Fetch products
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError("");


        
        let data = [];
        let url = "";
        const params = new URLSearchParams();
        
        const campaignId = searchParams.get('campaign');
        let fetchedCampaignName = null;

        // Fetch Campaign Info if applicable to get the name
        if (campaignId) {
             try {
                const cRes = await fetch(`${API_BASE}/api/campaigns`); 
                const cList = await cRes.json();
                const found = cList.find(c => c.id.toString() === campaignId);
                if (found) {
                    setCampaignInfo(found);
                    fetchedCampaignName = found.name;
                }
             } catch(e) { console.error("Failed to load campaign info"); }
        } else {
             setCampaignInfo(null);
        }

        // 1. Determine Endpoint & Primary Params
        if (search && search.trim()) {
           // Search Mode
           url = `${API_BASE}/api/products/search`;
           params.append("keyword", search.trim());
           if (userId) params.append("userId", userId);
        } else {
           // Filter Mode (or List All)
           
           if (campaignId) {
               // Campaign Mode
               url = `${API_BASE}/api/campaigns/${campaignId}/products`;
           } else {
               const hasBackendFilter = minPrice || maxPrice || (brand && brand.trim()) || (categoryFilter && categoryFilter !== "ALL");
               
               if (hasBackendFilter) {
                   url = `${API_BASE}/api/products/filter`;
                   if (minPrice) params.append("minPrice", minPrice);
                   if (maxPrice) params.append("maxPrice", maxPrice);
                   if (brand) params.append("brand", brand);
                   if (categoryFilter && categoryFilter !== "ALL") params.append("category", categoryFilter);
               } else {
                   url = `${API_BASE}/api/products`;
               }
           }
        }

        // 2. Fetch Data
        const queryString = params.toString();
        const fullUrl = queryString ? `${url}?${queryString}` : url;
        
        const res = await fetch(fullUrl);
        if (!res.ok) throw new Error(`Failed to load products. Status: ${res.status}`);
        
        data = await res.json();
        
        // 3. Map DTO
        let filtered = [];
        if (Array.isArray(data)) {
            if (searchParams.get('campaign')) {
                 filtered = data.map(cp => ({
                     id: cp.productId,
                     name: cp.productName,
                     imagePath: cp.productImage,
                     price: cp.originalPrice,
                     salePrice: cp.salePrice,
                     onSale: true,
                     saleLabel: fetchedCampaignName || "CAMPAIGN DEAL",
                     stock: cp.stockLimit,
                     category: "Campaign Deals",
                     rating: 5,
                     sellerName: cp.sellerName,
                     storeName: cp.sellerName
                 }));
            } else {
                 filtered = data.map(mapProductDto);
            }
        }
        
        // 4. Apply Client-Side Filters (for fields NOT handled by backend)
        
        // Note: Backend handles Category, Brand, Price Min/Max in logical filter.
        // But if we used Search endpoint, it ONLY does keyword. 
        // So for Search mode, we might need to re-apply basic filters client side if the user set them?
        // Usually search overrides category selectors, but Sidebar filters + Search bar = Multi-faceted search.
        // Current Backend Search ignores category/price params. So we MUST apply them client-side for search results.
        
        if (search && search.trim()) {
            if (categoryFilter && categoryFilter !== "ALL") {
                filtered = filtered.filter(p => p.category?.toLowerCase() === categoryFilter.toLowerCase());
            }
            if (minPrice) filtered = filtered.filter(p => p.price >= parseFloat(minPrice));
            if (maxPrice) filtered = filtered.filter(p => p.price <= parseFloat(maxPrice));
            if (brand) filtered = filtered.filter(p => p.brand?.toLowerCase().includes(brand.toLowerCase()));
        }

        // Common client-side filters (Rating, Views, OnSale - not in backend filter)
        if (minRating) {
            filtered = filtered.filter(p => (p.rating || 0) >= parseFloat(minRating));
        }
        if (maxRating) {
            filtered = filtered.filter(p => (p.rating || 0) <= parseFloat(maxRating));
        }
        
        if (minViews) {
            filtered = filtered.filter(p => (p.totalViews || 0) >= parseInt(minViews));
        }
        if (maxViews) {
            filtered = filtered.filter(p => (p.totalViews || 0) <= parseInt(maxViews));
        }
        
        if (onSale === "true") {
            filtered = filtered.filter(p => p.onSale === true);
        } else if (onSale === "false") {
            filtered = filtered.filter(p => !p.onSale);
        }
        
        // 5. Client-Side Sorting (Backend defaults to ID desc)
        if (sortBy) {
            const [field, direction] = sortBy.split(',');
            filtered.sort((a, b) => {
                const aVal = a[field] || 0;
                const bVal = b[field] || 0;
                return direction === 'asc' ? aVal - bVal : bVal - aVal;
            });
        }

        setProducts(filtered);

      } catch (err) {
        setError(err.message || "Something went wrong");
      } finally {
        setLoading(false);
      }
    };

    // Debounce search
    const timeoutId = setTimeout(() => {
      fetchProducts();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [search, categoryFilter, sortBy, minPrice, maxPrice, minRating, maxRating, 
      minViews, maxViews, brand, onSale, mfgStart, mfgEnd, expStart, expEnd, 
      selectedColors, selectedStorage, userId]);

  const handleAddToCart = async (product, quantity = 1) => {
    try {
      if (!isLoggedIn) {
        addToGuestCart(product, quantity);
      } else {
        await apiAddToCart(userId, product.id, quantity);
      }
      navigate("/cart");
    } catch (err) {
      console.error("Error adding to cart", err);
      alert(err.message || "Unable to add to cart");
    }
  };

  const clearFilters = () => {
    setSearch("");
    setCategoryFilter("ALL");
    setMinPrice("");
    setMaxPrice("");
    setMinRating("");
    setMaxRating("");
    setMinViews("");
    setMaxViews("");
    setBrand("");
    setOnSale("");
    setMfgStart("");
    setMfgEnd("");
    setExpStart("");
    setExpEnd("");
    setSelectedColors([]);
    setSelectedStorage([]);
    setSortBy("id,desc");
  };

  // Extract categories (mock or from loaded products if needed, but better to have a static list or separate API)
  // For now, we'll just use unique categories from the current list + some defaults if empty
  const categories = Array.from(new Set(products.map((p) => p.category).filter(Boolean)));

  return (
    <div className="pg-layout">
      
      {/* Sidebar Filters */}
      <aside className={`pg-sidebar ${showFilters ? 'show' : ''}`}>
        {/* Mobile Filter Header */}
        <div className="pg-filter-mobile-header">
          <h3 className="pg-filter-mobile-title">Filters</h3>
          <button className="pg-filter-close-btn" onClick={() => setShowFilters(false)}>
            <X size={20} />
          </button>
        </div>

        <div className="pg-filter-group">
          <div className="pg-filter-title">
            Filters
            <button className="pg-clear-btn" onClick={clearFilters}>Clear All</button>
          </div>
        </div>

        {/* Active Filters Chips */}
        {(categoryFilter !== "ALL" || minPrice || maxPrice || minRating || brand || onSale) && (
          <div className="pg-active-filters">
            {categoryFilter !== "ALL" && (
              <div className="pg-filter-chip" onClick={() => setCategoryFilter("ALL")}>
                {categoryFilter}
                <span className="pg-filter-chip-remove">×</span>
              </div>
            )}
            {minPrice && (
              <div className="pg-filter-chip" onClick={() => setMinPrice("")}>
                Min: Rs. {minPrice}
                <span className="pg-filter-chip-remove">×</span>
              </div>
            )}
            {maxPrice && (
              <div className="pg-filter-chip" onClick={() => setMaxPrice("")}>
                Max: Rs. {maxPrice}
                <span className="pg-filter-chip-remove">×</span>
              </div>
            )}
            {minRating && (
              <div className="pg-filter-chip" onClick={() => setMinRating("")}>
                {minRating}+ Stars
                <span className="pg-filter-chip-remove">×</span>
              </div>
            )}
            {brand && (
              <div className="pg-filter-chip" onClick={() => setBrand("")}>
                {brand}
                <span className="pg-filter-chip-remove">×</span>
              </div>
            )}
            {onSale && (
              <div className="pg-filter-chip" onClick={() => setOnSale("")}>
                On Sale
                <span className="pg-filter-chip-remove">×</span>
              </div>
            )}
          </div>
        )}

        <div className="pg-filter-group">
          <div className="pg-filter-title">Category</div>
          <select
            className="products-select"
            style={{width: '100%'}}
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="ALL">All Categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <div className="pg-filter-group">
          <div className="pg-filter-title">Brand</div>
          <input
            type="text"
            className="pg-price-input"
            placeholder="Enter brand name"
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
            style={{width: '100%'}}
          />
        </div>

        <div className="pg-filter-group">
          <div className="pg-filter-title">Price Range</div>
          <div className="pg-price-inputs">
            <input
              type="number"
              className="pg-price-input"
              placeholder="Min"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
            />
            <span className="pg-price-separator">-</span>
            <input
              type="number"
              className="pg-price-input"
              placeholder="Max"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
            />
          </div>
        </div>

        <div className="pg-filter-group">
          <div className="pg-filter-title">Rating</div>
          {[4, 3, 2, 1].map((star) => (
            <label key={star} className="pg-checkbox-label">
              <input
                type="radio"
                name="rating"
                className="pg-checkbox"
                checked={parseInt(minRating) === star}
                onChange={() => setMinRating(star.toString())}
              />
              {star} Stars & Up
            </label>
          ))}
        </div>

        <div className="pg-filter-group">
          <div className="pg-filter-title">On Sale</div>
          <select
            className="products-select"
            style={{width: '100%'}}
            value={onSale}
            onChange={(e) => setOnSale(e.target.value)}
          >
            <option value="">All Products</option>
            <option value="true">On Sale Only</option>
            <option value="false">Not On Sale</option>
          </select>
        </div>

        <div className="pg-filter-group">
          <div className="pg-filter-title">Views Range</div>
          <div className="pg-price-inputs">
            <input
              type="number"
              className="pg-price-input"
              placeholder="Min"
              value={minViews}
              onChange={(e) => setMinViews(e.target.value)}
            />
            <span className="pg-price-separator">-</span>
            <input
              type="number"
              className="pg-price-input"
              placeholder="Max"
              value={maxViews}
              onChange={(e) => setMaxViews(e.target.value)}
            />
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="pg-main">
        
        {/* Campaign Hero Banner in Products Page */}
        {campaignInfo && (
            <div className="pg-campaign-hero" style={{ 
                marginBottom: '32px', 
                borderRadius: '16px', 
                overflow: 'hidden', 
                background: 'linear-gradient(135deg, #fdfbfb 0%, #ebedee 100%)',
                border: '1px solid #e2e8f0',
                padding: '40px',
                display: 'grid',
                gridTemplateColumns: '1.2fr 0.8fr',
                gap: '40px',
                alignItems: 'center',
                position: 'relative'
            }}>
                <div className="pg-campaign-hero-content">
                    <div className="campaign-badge-row" style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                        <span className="hero-discount-badge" style={{ 
                            background: '#ef4444', 
                            color: 'white', 
                            border: 'none',
                            fontSize: '0.75rem', 
                            fontWeight: '800', 
                            padding: '6px 16px', 
                            borderRadius: '100px', 
                            textTransform: 'uppercase', 
                            letterSpacing: '1px'
                        }}>
                             {campaignInfo.type?.replace(/_/g, ' ')}
                        </span>
                        <span className="live-indicator" style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#ef4444', fontWeight: '700', fontSize: '0.8rem', textTransform: 'uppercase' }}>
                            <span className="blink-dot" style={{ width: '8px', height: '8px', background: '#ef4444', borderRadius: '50%', animation: 'blink 1.5s infinite running' }}></span> LIVE NOW
                        </span>
                        <style>{`
                            @keyframes blink {
                                0% { opacity: 1; transform: scale(1); }
                                50% { opacity: 0.4; transform: scale(1.2); }
                                100% { opacity: 1; transform: scale(1); }
                            }
                        `}</style>
                    </div>
                    
                    <h1 className="pg-campaign-title" style={{ fontSize: '2.5rem', fontWeight: '900', color: '#0f172a', margin: '10px 0', lineHeight: '1.1' }}>
                        {campaignInfo.name}
                    </h1>
                    
                    <div className="hero-countdown-container" style={{ marginTop: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                         <p style={{ fontWeight: '600', color: '#64748b', textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '0.05em' }}>Ending In:</p>
                         <CountdownTimer targetDate={campaignInfo.endTime} />
                    </div>
                </div>
                
                <div className="pg-campaign-hero-image" style={{ display: 'flex', justifyContent: 'center' }}>
                     <img 
                        src={campaignInfo.imagePath ? (campaignInfo.imagePath.startsWith('http') ? campaignInfo.imagePath : `${API_BASE}/${campaignInfo.imagePath}`) : "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?q=80&w=800&auto=format&fit=crop"} 
                        alt={campaignInfo.name} 
                        style={{ objectFit: 'contain', maxHeight: '250px', mixBlendMode: 'multiply' }}
                        onError={(e) => {
                            e.target.onerror = null; 
                            e.target.src = 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?q=80&w=800&auto=format&fit=crop';
                        }}
                      />
                </div>
            </div>
        )}

        <div className="products-header">
          <div className="products-header-left">
            <h2 className="products-title">{campaignInfo ? "Campaign Items" : "Shop Products"}</h2>
            <p className="products-subtitle">
              {loading ? "Loading..." : `Showing ${products.length} results`}
            </p>
          </div>

          <div className="products-toolbar">
            <button 
              className="products-filter-toggle"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter size={20} />
              <span>Filters</span>
            </button>

            <input
              type="text"
              className="products-search"
              value={search}
              placeholder="Search..."
              onChange={(e) => setSearch(e.target.value)}
            />

            <select
              className="products-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="id,desc">Newest</option>
              <option value="price,asc">Price: Low to High</option>
              <option value="price,desc">Price: High to Low</option>
              <option value="rating,desc">Top Rated</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="products-grid">
            {Array(8).fill(0).map((_, i) => <ProductSkeleton key={i} />)}
          </div>

        ) : error ? (
          <div className="products-error">{error}</div>
        ) : products.length === 0 ? (
          <div className="products-empty">No products found matching your filters.</div>
        ) : (
          <div className="products-grid">
            {products.map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                onAddToCart={() => handleAddToCart(p, 1)}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default ProductGrid;
