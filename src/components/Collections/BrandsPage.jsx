import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { API_BASE } from "../config/config";
import ProductCard from "../productCard/ProductCard";
import ErrorToast from "../ErrorToast/ErrorToast";
import "./CollectionPage.css";

export default function BrandsPage() {
  const [products, setProducts] = useState([]);
  const [brands, setBrands] = useState([]);
  const [selectedBrand, setSelectedBrand] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState("newest");
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/api/products`);
      const data = await response.json();
      
      // Filter for active products
      const activeProducts = data.filter(product => 
        product.status === "ACTIVE" && 
        product.visible === true
      );
      
      setProducts(activeProducts);
      
      // Extract unique brands
      const uniqueBrands = [...new Set(activeProducts.map(p => p.brand).filter(Boolean))];
      setBrands(uniqueBrands.sort());
    } catch (error) {
      console.error("Failed to load products:", error);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredProducts = () => {
    if (!selectedBrand) return [];
    return products.filter(p => p.brand === selectedBrand);
  };

  const getSortedProducts = () => {
    let sorted = [...getFilteredProducts()];
    
    switch (sortBy) {
      case "price-low":
        return sorted.sort((a, b) => (a.salePrice || a.price) - (b.salePrice || b.price));
      case "price-high":
        return sorted.sort((a, b) => (b.salePrice || b.price) - (a.salePrice || a.price));
      case "name":
        return sorted.sort((a, b) => a.name.localeCompare(b.name));
      case "newest":
      default:
        return sorted.sort((a, b) => b.id - a.id);
    }
  };

  const getBrandProductCount = (brand) => {
    return products.filter(p => p.brand === brand).length;
  };

  const addToCart = async (product) => {
    const userId = localStorage.getItem("userId");
    if (!userId) {
      navigate("/login");
      return;
    }

    try {
      setError(null); // Clear previous errors
      const decodedId = atob(userId);
      const url = `${API_BASE}/api/cart/add`;
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: parseInt(decodedId),
          productId: product.id,
          quantity: 1,
        }),
      });

      if (!response.ok) {
        // Parse backend error response
        try {
          const errorData = await response.json();
          setError({
            status: response.status,
            message: errorData.message || 'Failed to add to cart',
            details: errorData.details || errorData.error || response.statusText,
            errors: errorData.errors || {},
            timestamp: errorData.timestamp || new Date().toISOString(),
            path: errorData.path || url,
            trace: errorData.trace
          });
        } catch (e) {
          setError({
            status: response.status,
            message: 'Failed to add to cart',
            details: await response.text().catch(() => 'Unknown error'),
            timestamp: new Date().toISOString(),
            path: url
          });
        }
        return;
      }

      // Success
      const currentCount = Number(localStorage.getItem("cartCount")) || 0;
      localStorage.setItem("cartCount", currentCount + 1);
      window.dispatchEvent(new Event("cart-updated"));
    } catch (err) {
      console.error("Failed to add to cart:", err);
      setError({
        status: 500,
        message: "Failed to Add Item",
        details: err.message || "An unexpected error occurred while adding the item to cart",
        timestamp: new Date().toISOString()
      });
    }
  };

  if (loading) {
    return (
      <div className="collection-page">
        <div className="collection-loading">Loading brands...</div>
      </div>
    );
  }

  const sortedProducts = getSortedProducts();

  return (
    <>
      {/* Error Toast Notification */}
      <ErrorToast error={error} onClose={() => setError(null)} />

      <div className="collection-page">
        <div className="collection-container">
        <div className="collection-header">
          <h1>Shop by Brand</h1>
          <p>Discover products from your favorite brands</p>
        </div>

        {brands.length > 0 ? (
          <>
            {!selectedBrand ? (
              <div className="brand-grid">
                {brands.map((brand) => (
                  <div
                    key={brand}
                    className="brand-card"
                    onClick={() => setSelectedBrand(brand)}
                  >
                    <h3>{brand}</h3>
                    <p>{getBrandProductCount(brand)} products</p>
                  </div>
                ))}
              </div>
            ) : (
              <>
                <div style={{ marginBottom: "2rem" }}>
                  <button
                    onClick={() => setSelectedBrand(null)}
                    style={{
                      background: "transparent",
                      border: "1px solid #e5e7eb",
                      padding: "0.5rem 1rem",
                      borderRadius: "8px",
                      cursor: "pointer",
                      fontSize: "0.9rem",
                      marginBottom: "1rem",
                    }}
                  >
                    ← Back to All Brands
                  </button>
                  <h2 style={{ fontSize: "1.75rem", margin: "0.5rem 0", fontWeight: 600 }}>
                    {selectedBrand}
                  </h2>
                </div>

                <div className="collection-filters">
                  <div className="collection-count">
                    Showing <strong>{sortedProducts.length}</strong> products
                  </div>
                  <div className="collection-sort">
                    <label htmlFor="sort">Sort by:</label>
                    <select 
                      id="sort" 
                      value={sortBy} 
                      onChange={(e) => setSortBy(e.target.value)}
                    >
                      <option value="newest">Newest First</option>
                      <option value="price-low">Price: Low to High</option>
                      <option value="price-high">Price: High to Low</option>
                      <option value="name">Name: A to Z</option>
                    </select>
                  </div>
                </div>

                <div className="collection-grid">
                  {sortedProducts.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      onAddToCart={() => addToCart(product)}
                    />
                  ))}
                </div>
              </>
            )}
          </>
        ) : (
          <div className="collection-empty">
            <div className="collection-empty-icon">🏪</div>
            <h2>No Brands Available</h2>
            <p>Brands will appear here once products are added.</p>
            <Link to="/" className="collection-empty-btn">
              Browse All Products
            </Link>
          </div>
        )}
        </div>
      </div>
    </>
  );
}
