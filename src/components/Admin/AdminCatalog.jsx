import React, { useState, useEffect } from "react";
import { Boxes, Search, Eye, EyeOff, ExternalLink } from "lucide-react";
import { Badge } from "./AdminCommon";
import axios from "../../api/axios";
import { useNavigate } from "react-router-dom";
import { API_BASE } from "../config/config";
import "./AdminDashboard.css";

export default function AdminCatalog() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await axios.get("/api/admin/products");
      setProducts(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProducts(); }, []);

  const toggleProduct = async (id, status) => {
    try {
      const newVisible = status !== "ACTIVE";
      await axios.put(`${API_BASE}/api/admin/products/${id}/visibility?visible=${newVisible}`);
      fetchProducts();
    } catch (err) {
      console.error(err);
    }
  };

  const filtered = products.filter(p =>
    [p.name, p.category, p.sellerFullName]
      .some(k => String(k || "").toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="adm-catalog-container fade-in">
      <div className="adm-welcome-banner">
        <div>
          <h2 className="adm-welcome-title">Product Catalog</h2>
          <p className="adm-welcome-sub">Manage global product visibility and moderation.</p>
        </div>
        <div className="adm-search-bar" style={{ maxWidth: '300px' }}>
          <Search size={18} />
          <input 
            type="text" 
            placeholder="Search products..." 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="adm-table-card">
        {filtered.map(p => (
          <div className="adm-row clickable" key={p.id} onClick={() => navigate(`/products/${p.id}`)}>
            <div className="adm-row-avatar">
              {p.imagePaths?.[0] ? <img src={`${API_BASE}/${p.imagePaths[0]}`} alt=""/> : <Boxes size={20}/>}
            </div>
            <div className="adm-row-info">
              <span className="adm-row-title">{p.name}</span>
              <span className="adm-row-sub">{p.category} · {p.sellerFullName}</span>
            </div>
            <Badge status={p.status} />
            <div className="adm-row-actions" onClick={e => e.stopPropagation()}>
               <button className={`adm-icon-btn ${p.status === "ACTIVE" ? "danger" : "success"}`} onClick={() => toggleProduct(p.id, p.status)} title={p.status === "ACTIVE" ? "Hide from Store" : "Show in Store"}>
                  {p.status === "ACTIVE" ? <EyeOff size={16}/> : <Eye size={16}/>}
               </button>
               <button className="adm-icon-btn" onClick={() => navigate(`/products/${p.id}`)} title="View Product Page"><ExternalLink size={14}/></button>
            </div>
          </div>
        ))}
        {loading ? (
             <div className="adm-empty">Loading catalog...</div>
        ) : filtered.length === 0 && (
             <div className="adm-empty">No products match your search.</div>
        )}
      </div>
    </div>
  );
}
