import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { API_BASE } from "../config/config";
import ProductCard from "../productCard/ProductCard";
import ErrorToast from "../ErrorToast/ErrorToast";
import "./CollectionPage.css";

export default function OnSalePage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState("newest");
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadSaleProducts();
  }, []);

  const loadSaleProducts = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/api/products`);
      const data = await response.json();
      
      // Filter for products that are on sale
      const saleProducts = data.filter(product => 
        product.onSale === true && 
        product.status === "ACTIVE" && 
        product.visible === true
      );
      
      setProducts(saleProducts);
    } catch (error) {
      console.error("Failed to load sale products:", error);
    } finally {
      setLoading(false);
    }
  };

  const getSortedProducts = () => {
    let sorted = [...products];
    
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

  const addToCart = async (product) => {
    const userId = localStorage.getItem("userId");
    if (!userId) {
      navigate("/login");
      return;
    }

    try {
      setError(null);
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

      const currentCount = Number(localStorage.getItem("cartCount")) || 0;
      localStorage.setItem("cartCount", currentCount + 1);
      window.dispatchEvent(new Event("cart-updated"));
    } catch (err) {
      console.error("Failed to add to cart:", err);
      setError({
        status: 500,
        message: "Failed to Add Item",
        details: err.message || "An unexpected error occurred",
        timestamp: new Date().toISOString()
      });
    }
  };

  if (loading) {
    return (
      <div className="collection-page">
        <div className="collection-loading">Loading sale products...</div>
      </div>
    );
  }

  const sortedProducts = getSortedProducts();

  return (
    <>
      <ErrorToast error={error} onClose={() => setError(null)} />

      <div className="collection-page">
        <div className="collection-container">
        <div className="collection-header">
          <h1>On Sale</h1>
          <p>Discover amazing deals on your favorite products</p>
        </div>

        {products.length > 0 ? (
          <>
            <div className="collection-filters">
              <div className="collection-count">
                Showing <strong>{products.length}</strong> products
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
        ) : (
          <div className="collection-empty">
            <div className="collection-empty-icon">🏷️</div>
            <h2>No Sale Items Yet</h2>
            <p>Check back soon for amazing deals!</p>
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
