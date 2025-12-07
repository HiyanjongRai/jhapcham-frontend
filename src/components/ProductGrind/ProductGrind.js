import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import ProductCard from "../productCard/ProductCard";
import "./ProjectGrind.css";
import "./ProductGridFilters.css";
import { Filter, X } from "lucide-react";

import { getCurrentUserId, addToGuestCart, apiAddToCart } from "../AddCart/cartUtils";

const API_BASE = "http://localhost:8080";

function ProductGrid() {
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

  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const navigate = useNavigate();
  const userId = getCurrentUserId();
  const isLoggedIn = !!userId;

  // Fetch products
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError("");

        let data;

        // Use search endpoint if there's a search keyword
        if (search && search.trim()) {
          const params = new URLSearchParams();
          params.append("keyword", search.trim());
          if (userId) params.append("userId", userId);

          const res = await fetch(`${API_BASE}/api/products/search?${params.toString()}`);
          if (!res.ok) throw new Error(`Failed to search products. Status: ${res.status}`);
          
          data = await res.json();
          
          // Apply client-side filters to search results
          let filtered = Array.isArray(data) ? data : [];
          
          // Filter by category
          if (categoryFilter && categoryFilter !== "ALL") {
            filtered = filtered.filter(p => p.category?.toLowerCase() === categoryFilter.toLowerCase());
          }
          
          // Filter by price range
          if (minPrice) {
            filtered = filtered.filter(p => p.price >= parseFloat(minPrice));
          }
          if (maxPrice) {
            filtered = filtered.filter(p => p.price <= parseFloat(maxPrice));
          }
          
          // Filter by rating
          if (minRating) {
            filtered = filtered.filter(p => (p.rating || 0) >= parseFloat(minRating));
          }
          
          // Sort results
          if (sortBy) {
            const [field, direction] = sortBy.split(',');
            filtered.sort((a, b) => {
              const aVal = a[field] || 0;
              const bVal = b[field] || 0;
              return direction === 'asc' ? aVal - bVal : bVal - aVal;
            });
          }
          
          setProducts(filtered);
        } else {
          // Use filter endpoint for browsing without search
          const params = new URLSearchParams();
          if (categoryFilter && categoryFilter !== "ALL") params.append("category", categoryFilter);
          if (sortBy) params.append("sort", sortBy);
          if (minPrice) params.append("minPrice", minPrice);
          if (maxPrice) params.append("maxPrice", maxPrice);
          if (minRating) params.append("minRating", minRating);
          if (maxRating) params.append("maxRating", maxRating);
          if (minViews) params.append("minViews", minViews);
          if (maxViews) params.append("maxViews", maxViews);
          if (brand) params.append("brand", brand);
          if (onSale !== "") params.append("onSale", onSale);
          if (mfgStart) params.append("mfgStart", mfgStart);
          if (mfgEnd) params.append("mfgEnd", mfgEnd);
          if (expStart) params.append("expStart", expStart);
          if (expEnd) params.append("expEnd", expEnd);
          
          // Handle array parameters
          if (selectedColors && selectedColors.length > 0) {
            selectedColors.forEach(color => params.append("colors", color));
          }
          if (selectedStorage && selectedStorage.length > 0) {
            selectedStorage.forEach(storage => params.append("storage", storage));
          }
          
          // Ensure visible products only
          params.append("visible", "true");
          params.append("status", "ACTIVE");

          const res = await fetch(`${API_BASE}/api/products/filter?${params.toString()}`);
          if (!res.ok) throw new Error(`Failed to load products. Status: ${res.status}`);

          data = await res.json();
          setProducts(Array.isArray(data.content) ? data.content : []);
        }
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
      <aside className={`pg-sidebar ${showMobileFilters ? 'show' : ''}`}>
        <div className="pg-filter-group">
          <div className="pg-filter-title">
            Filters
            <button className="pg-clear-btn" onClick={clearFilters} style={{width: 'auto', marginTop: 0}}>Clear All</button>
          </div>
        </div>

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
        <div className="products-header">
          <div>
            <h2 className="products-title">Shop Products</h2>
            <p className="products-subtitle">
              {loading ? "Loading..." : `Showing ${products.length} results`}
            </p>
          </div>

          <div className="products-toolbar">
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
            
            <button 
              className="products-filter-toggle" // Add CSS for this if needed for mobile
              onClick={() => setShowMobileFilters(!showMobileFilters)}
              style={{display: 'none'}} // Hidden on desktop usually
            >
              <Filter size={20} />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="products-loading">Loading products...</div>
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
