import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { API_BASE } from "../config/config";
import ProductCard from "../productCard/ProductCard";
import ErrorToast from "../ErrorToast/ErrorToast";
import { apiAddToCart, getCurrentUserId } from "../AddCart/cartUtils";
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
      
      // map dto to frontend
      const mapped = data.map(dto => ({
        ...dto,
        imagePath: dto.imagePaths && dto.imagePaths.length > 0 ? dto.imagePaths[0] : (dto.imagePath || ""),
        rating: dto.averageRating || 0,
        stock: dto.stockQuantity || 0,
      }));

      // Filter for products that are on sale
      const saleProducts = mapped.filter(product => 
        product.onSale === true && 
        product.status === "ACTIVE" 
        // && product.visible === true // optional specific check
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

  // Removed custom addToCart function as ProductCard handles it now

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
