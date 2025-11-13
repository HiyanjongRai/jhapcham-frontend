// src/components/productGrid/ProductGrid.jsx
import React, { useEffect, useMemo, useState } from "react";
import ProductCard from "../productCard/ProductCard";
import "./ProjectGrind.css";

const API_BASE = "http://localhost:8080";

function ProductGrid() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [sortBy, setSortBy] = useState("newest");

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError("");
        const res = await fetch(`${API_BASE}/api/products`);
        if (!res.ok) {
          throw new Error(`Failed to load products. Status: ${res.status}`);
        }
        const data = await res.json();
        setProducts(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err.message || "Something went wrong");
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const categories = useMemo(() => {
    const set = new Set();
    products.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return Array.from(set);
  }, [products]);

  const filteredProducts = useMemo(() => {
    let list = [...products];

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) =>
          p.name?.toLowerCase().includes(q) ||
          p.shortDescription?.toLowerCase().includes(q)
      );
    }

    if (categoryFilter !== "ALL") {
      list = list.filter((p) => p.category === categoryFilter);
    }

    switch (sortBy) {
      case "priceLow":
        list.sort((a, b) => (a.price || 0) - (b.price || 0));
        break;
      case "priceHigh":
        list.sort((a, b) => (b.price || 0) - (a.price || 0));
        break;
      case "rating":
        list.sort(
          (a, b) => (b.averageRating || 0) - (a.averageRating || 0)
        );
        break;
      case "newest":
      default:
        list.sort((a, b) => (b.id || 0) - (a.id || 0));
        break;
    }

    return list;
  }, [products, search, categoryFilter, sortBy]);

  if (loading) return <div className="products-loading">Loading...</div>;
  if (error) return <div className="products-error">Error: {error}</div>;

  return (
    <div className="products-wrapper">
      <div className="products-header">
        <div>
          <h2 className="products-title">Products</h2>
          <p className="products-subtitle">
            Showing {filteredProducts.length} of {products.length}
          </p>
        </div>

        <div className="products-toolbar">
          <input
            type="text"
            className="products-search"
            value={search}
            placeholder="Search products..."
            onChange={(e) => setSearch(e.target.value)}
          />

          <select
            className="products-select"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="ALL">All categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <select
            className="products-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="newest">Newest</option>
            <option value="priceLow">Price: Low to High</option>
            <option value="priceHigh">Price: High to Low</option>
            <option value="rating">Top Rated</option>
          </select>
        </div>
      </div>

      <div className="products-grid">
        {filteredProducts.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </div>
  );
}

export default ProductGrid;
