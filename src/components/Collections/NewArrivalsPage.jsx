import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { API_BASE } from "../config/config";
import ProductCard from "../productCard/ProductCard";
import ErrorToast from "../ErrorToast/ErrorToast";
import { apiAddToCart, getCurrentUserId } from "../AddCart/cartUtils";
import "./CollectionPage.css";

export default function NewArrivalsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState("newest");
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadNewArrivals();
  }, []);

  const loadNewArrivals = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/api/products`);
      const data = await response.json();
      
      // Map to frontend format
      const mapped = data.map(dto => ({
        ...dto,
        imagePath: dto.imagePaths && dto.imagePaths.length > 0 ? dto.imagePaths[0] : (dto.imagePath || ""),
        rating: dto.averageRating || 0,
        stock: dto.stockQuantity || 0,
      }));

      // Filter for newest products (e.g., last 30 days or top 20 newest)
      const activeProducts = mapped.filter(product => 
        product.status === "ACTIVE" 
        // && product.visible === true
      );
      
      // Sort by ID (newest first) and take top 20
      const newArrivals = activeProducts
        .sort((a, b) => b.id - a.id)
        .slice(0, 20);
      
      setProducts(newArrivals);
    } catch (error) {
      console.error("Failed to load new arrivals:", error);
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

  if (loading) {
    return (
      <div className="collection-page">
        <div className="collection-loading">Loading new arrivals...</div>
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
          <h1>New Arrivals</h1>
          <p>Check out our latest products just added to the store</p>
        </div>

        {products.length > 0 ? (
          <>
            <div className="collection-filters">
              <div className="collection-count">
                Showing <strong>{products.length}</strong> new products
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
                />
              ))}
            </div>
          </>
        ) : (
          <div className="collection-empty">
            <div className="collection-empty-icon">✨</div>
            <h2>No New Arrivals</h2>
            <p>We're always adding new products. Check back soon!</p>
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
