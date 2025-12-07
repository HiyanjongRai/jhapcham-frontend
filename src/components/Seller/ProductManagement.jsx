import React, { useEffect, useState } from "react";
import axios from "axios";
import "./SellerProducts.css";
import EditProductDrawer from "./EditProductDrawer";
import SaleModal from "./SaleModal";
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Tag, 
  AlertCircle, 
  CheckCircle, 
  XCircle,
  Eye,
  EyeOff
} from "lucide-react";

const BASE_URL = "http://localhost:8080";

function getCurrentUserId() {
  try {
    const encoded = localStorage.getItem("userId");
    if (!encoded) return null;
    const decoded = window.atob(encoded);
    const idNum = Number(decoded);
    return Number.isNaN(idNum) ? null : idNum;
  } catch (e) {
    console.error("Error decoding userId:", e);
    return null;
  }
}

function mapDtoToProduct(dto) {
  return {
    id: dto.id,
    name: dto.name || "",
    brand: dto.brand || "",
    category: dto.category || "",
    price: dto.price || 0,
    onSale: dto.onSale || false,
    discountPercent: dto.discountPercent || 0,
    salePrice: dto.salePrice != null ? dto.salePrice : dto.price || 0,
    stock: dto.stock || 0,
    status: dto.status || "ACTIVE",
    visible: dto.visible != null ? dto.visible : true,
    expiryDate: dto.expiryDate || "",
    manufacturingDate: dto.manufacturingDate || "",
    imagePath: dto.imagePath ? dto.imagePath : "",
    additionalImages: dto.additionalImages || [],
    shortDescription: dto.shortDescription || "",
    description: dto.description || "",
    colors: dto.colors || [],
    others: dto.others || "",
    sellerId: dto.sellerId || null,
  };
}

function expiryInfo(expiryDate) {
  if (!expiryDate) return { isSoon: false, isExpired: false, label: "" };
  const today = new Date();
  const exp = new Date(expiryDate);
  if (Number.isNaN(exp.getTime())) return { isSoon: false, isExpired: false, label: "" };

  const diff = exp.getTime() - today.getTime();
  const fourteenDays = 14 * 24 * 60 * 60 * 1000;

  if (diff < 0) return { isSoon: true, isExpired: true, label: "Expired" };
  if (diff <= fourteenDays) return { isSoon: true, isExpired: false, label: "Expiring Soon" };
  return { isSoon: false, isExpired: false, label: "" };
}

export default function ProductManagement() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState(null);
  const [showExpiringOnly, setShowExpiringOnly] = useState(false);

  const [editingProduct, setEditingProduct] = useState(null);
  const [saleProduct, setSaleProduct] = useState(null);
  const [deleteProduct, setDeleteProduct] = useState(null);

  const currentUserId = getCurrentUserId();

  useEffect(() => { loadProducts(); }, []);

  async function loadProducts() {
    setLoading(true); setMessage("");
    try {
      const res = await axios.get(`${BASE_URL}/api/products/my-products?sellerId=${currentUserId}`);
      setProducts(res.data.map(mapDtoToProduct));
    } catch (err) { console.error(err); showError("Failed to load products"); }
    setLoading(false);
  }

  function showSuccess(text) { setMessage(text); setMessageType("success"); setTimeout(() => setMessage(""), 2500); }
  function showError(text) { setMessage(text); setMessageType("error"); setTimeout(() => setMessage(""), 3000); }

  const expiringProducts = products.filter((p) => expiryInfo(p.expiryDate).isSoon);
  const displayedProducts = showExpiringOnly ? expiringProducts : products;

  function openDeleteDialog(p) { setDeleteProduct(p); }
  function closeDeleteDialog() { setDeleteProduct(null); }
  async function confirmDelete() {
    if (!deleteProduct) return;
    try {
      await axios.delete(`${BASE_URL}/api/products/delete/${deleteProduct.id}`, { params: { sellerId: currentUserId }});
      setProducts((prev) => prev.filter(p => p.id !== deleteProduct.id));
      showSuccess("Product deleted"); closeDeleteDialog();
    } catch (err) { console.error(err); showError("Delete failed"); }
  }

  return (
    <div className="sp-container">
      <div className="sp-header">
        <div>
          <h1 className="sp-title">Product Management</h1>
          <p className="sp-subtitle">Manage your inventory, pricing, and stock levels.</p>
        </div>
        <button className="sp-add-btn" onClick={() => setEditingProduct({})}>
          <Plus size={20} /> Add Product
        </button>
      </div>

      <div className="sp-controls">
        <button 
          className={`sp-filter-btn ${showExpiringOnly ? "active" : ""}`}
          onClick={() => setShowExpiringOnly(prev => !prev)}
        >
          <AlertCircle size={16} />
          Expiring Soon ({expiringProducts.length})
        </button>
      </div>

      {message && (
        <div style={{
          padding: '1rem', marginBottom: '1rem', borderRadius: '8px',
          background: messageType === 'error' ? '#fee2e2' : '#dcfce7',
          color: messageType === 'error' ? '#991b1b' : '#166534'
        }}>
          {message}
        </div>
      )}

      <div className="sp-table-wrapper">
        {loading ? (
          <div className="sp-empty">Loading products...</div>
        ) : displayedProducts.length === 0 ? (
          <div className="sp-empty">No products found.</div>
        ) : (
          <table className="sp-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Category</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Status</th>
                <th>Expiry</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {displayedProducts.map(p => {
                const exp = expiryInfo(p.expiryDate);
                return (
                  <tr key={p.id}>
                    <td>
                      <div className="sp-product-cell">
                        <img 
                          src={p.imagePath ? `${BASE_URL}/api/products/images/${p.imagePath}` : "https://via.placeholder.com/48"} 
                          alt={p.name} 
                          className="sp-product-img"
                        />
                        <div>
                          <div className="sp-product-name">{p.name}</div>
                          <div className="sp-product-brand">{p.brand}</div>
                        </div>
                      </div>
                    </td>
                    <td>{p.category}</td>
                    <td>
                      {p.onSale ? (
                        <div>
                          <span style={{textDecoration: 'line-through', color: '#9ca3af', fontSize: '0.85rem'}}>₹{p.price}</span>
                          <div style={{fontWeight: '600', color: '#dc2626'}}>₹{p.salePrice}</div>
                        </div>
                      ) : (
                        <div style={{fontWeight: '600'}}>₹{p.price}</div>
                      )}
                    </td>
                    <td>
                      <span className={`sp-badge ${p.stock === 0 ? 'sp-badge-danger' : p.stock < 10 ? 'sp-badge-warning' : 'sp-badge-success'}`}>
                        {p.stock === 0 ? 'Out of Stock' : `${p.stock} in Stock`}
                      </span>
                    </td>
                    <td>
                      <div style={{display: 'flex', gap: '0.5rem', flexDirection: 'column'}}>
                        <span className={`sp-badge ${p.status === 'ACTIVE' ? 'sp-badge-success' : 'sp-badge-gray'}`}>
                          {p.status}
                        </span>
                        <span style={{fontSize: '0.8rem', color: '#6b7280', display: 'flex', alignItems: 'center', gap: '4px'}}>
                          {p.visible ? <Eye size={12}/> : <EyeOff size={12}/>} {p.visible ? 'Visible' : 'Hidden'}
                        </span>
                      </div>
                    </td>
                    <td>
                      {exp.isSoon ? (
                        <span className="sp-badge sp-badge-danger">{exp.label}</span>
                      ) : (
                        <span style={{color: '#6b7280'}}>{p.expiryDate ? new Date(p.expiryDate).toLocaleDateString() : '-'}</span>
                      )}
                    </td>
                    <td>
                      <div className="sp-actions">
                        <button className="sp-action-btn" onClick={() => setEditingProduct(p)} title="Edit">
                          <Edit2 size={16} />
                        </button>
                        <button className="sp-action-btn" onClick={() => setSaleProduct(p)} title="Sale">
                          <Tag size={16} color={p.onSale ? "#dc2626" : "currentColor"} />
                        </button>
                        <button className="sp-action-btn delete" onClick={() => openDeleteDialog(p)} title="Delete">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Edit Product Drawer */}
      {editingProduct && (
        <EditProductDrawer
          product={editingProduct}
          setProduct={setEditingProduct}
          onClose={() => setEditingProduct(null)}
          setProducts={setProducts}
          showSuccess={showSuccess}
          showError={showError}
          currentUserId={currentUserId}
          BASE_URL={BASE_URL}
        />
      )}

      {/* Sale Modal */}
      {saleProduct && (
        <SaleModal
          product={saleProduct}
          setProduct={setSaleProduct}
          setProducts={setProducts}
          showSuccess={showSuccess}
          showError={showError}
          currentUserId={currentUserId}
          BASE_URL={BASE_URL}
        />
      )}

      {/* Delete Confirmation */}
      {deleteProduct && (
        <div className="sp-modal-overlay">
          <div className="sp-modal">
            <h3 style={{marginTop: 0, fontSize: '1.25rem'}}>Delete Product</h3>
            <p style={{color: '#4b5563'}}>
              Are you sure you want to delete <strong>{deleteProduct.name}</strong>? This action cannot be undone.
            </p>
            <div className="sp-modal-actions">
              <button className="sp-btn-secondary" onClick={closeDeleteDialog}>Cancel</button>
              <button className="sp-btn-danger" onClick={confirmDelete}>Delete Product</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
