import React, { useState, useEffect } from "react";
import "./AddProduct.css";
import {
  Package,
  DollarSign,
  Tag,
  Info,
  Layers,
  ShieldCheck,
  FileText,
  Image as ImageIcon,
  Plus,
  X,
  PlusCircle
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getCurrentUserId } from "../config/authUtils";
import { API_BASE } from "../config/config";
import Toast from "../Toast/Toast";

export default function AddProductPage() {
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    category: "",
    description: "",
    shortDescription: "",
    brand: "",
    stock: "",
    colors: [],
    storage: [],
    image: null,
    additionalImages: [],
    manufactureDate: "",
    expiryDate: "",
    warranty: "",
    features: "",
    specification: ""
  });

  const colorOptions = [
    "Black","White","Gray","Silver","Red","Blue","Green",
    "Yellow","Pink","Purple","Orange","Brown"
  ];

  const storageOptions = ["32GB", "64GB", "128GB", "256GB", "512GB", "1TB"];

  const [toast, setToast] = useState({ visible: false, message: '', type: 'info' });
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  
  useEffect(() => {
    // Fetch categories
    fetch(`${API_BASE}/api/categories`)
      .then(res => res.json())
      .then(data => setCategories(data))
      .catch(err => console.error("Failed to load categories", err));
  }, []);

  const handleInput = (e) => {
    const { name, value, files } = e.target;
    if (files) {
      if (name === "image") {
        setFormData({ ...formData, image: files[0] });
      } else if (name === "additionalImages") {
        setFormData({ ...formData, additionalImages: [...formData.additionalImages, ...Array.from(files)].slice(0, 5) });
      }
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const removeAdditionalImage = (index) => {
    setFormData({
      ...formData,
      additionalImages: formData.additionalImages.filter((_, i) => i !== index)
    });
  };

  const toggleColor = (color) => {
    const selected = formData.colors.includes(color)
      ? formData.colors.filter((c) => c !== color)
      : [...formData.colors, color];
    setFormData({ ...formData, colors: selected });
  };

  const toggleStorage = (option) => {
    const selected = formData.storage.includes(option)
      ? formData.storage.filter((s) => s !== option)
      : [...formData.storage, option];
    setFormData({ ...formData, storage: selected });
  };

  const showToast = (message, type) => {
    setToast({ visible: true, message, type });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const sellerId = getCurrentUserId();
    if (!sellerId) {
      showToast("Seller login required", "error");
      return;
    }

    try {
      const data = new FormData();
      data.append("sellerId", sellerId);
      data.append("name", formData.name);
      data.append("price", formData.price);
      data.append("category", formData.category);
      data.append("description", formData.description);
      data.append("shortDescription", formData.shortDescription);
      data.append("brand", formData.brand);
      data.append("stockQuantity", formData.stock || "0");
      
      if (formData.colors.length > 0) {
        formData.colors.forEach(color => data.append("colorOptions", color));
      }
      if (formData.storage.length > 0) {
        formData.storage.forEach(storage => data.append("storageSpec", storage));
      }
      
      if (formData.manufactureDate) data.append("manufactureDate", formData.manufactureDate);
      if (formData.expiryDate) data.append("expiryDate", formData.expiryDate);
      if (formData.warranty) data.append("warrantyMonths", formData.warranty);
      if (formData.features) data.append("features", formData.features.trim());
      if (formData.specification) data.append("specification", formData.specification.trim());
      
      if (formData.image) {
        data.append("images", formData.image);
      }
      formData.additionalImages.forEach((img) => {
        data.append("images", img);
      });

      const response = await fetch(`${API_BASE}/api/products/seller/${sellerId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: data
      });

      if (!response.ok) throw new Error("Failed to save product");

      showToast("Listing published successfully!", "success");
      setTimeout(() => navigate('/seller/products'), 1500);
      
    } catch (error) {
      console.error("Add Product Error:", error);
      showToast(error.message || "Error saving product", "error");
    }
  };

  return (
    <div className="ap-container fade-in">
      <div className="ap-header">
        <div className="header-left">
          <h1>Publish New Listing</h1>
          <p>Globalize your product by filling out the blueprint below.</p>
        </div>
        <button className="ap-btn-cancel" onClick={() => navigate(-1)}>Discard</button>
      </div>

      <form className="ap-workspace" onSubmit={handleSubmit}>
        
        {/* SECTION 1: Blueprints & Identity */}
        <div className="ap-section">
          <div className="section-head">
            <Info size={18} className="text-blue" />
            <span>Product Identity</span>
          </div>
          
          <div className="ap-grid-2">
            <div className="ap-field">
              <label>Official Product Name <span className="req">*</span></label>
              <input 
                name="name" 
                placeholder="e.g. iPhone 15 Pro Max" 
                value={formData.name} 
                onChange={handleInput} 
                required 
              />
            </div>
            <div className="ap-field">
              <label>Manufacturer Brand</label>
              <input 
                name="brand" 
                placeholder="e.g. Apple" 
                value={formData.brand} 
                onChange={handleInput} 
              />
            </div>
          </div>

          <div className="ap-field">
            <label>Product Category <span className="req">*</span></label>
            <select name="category" value={formData.category} onChange={handleInput} required>
              <option value="">Choose a specialized category</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.name}>{cat.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* SECTION 2: Economics & Inventory */}
        <div className="ap-section">
          <div className="section-head">
            <DollarSign size={18} className="text-emerald" />
            <span>Economics & Inventory</span>
          </div>
          <div className="ap-grid-2">
            <div className="ap-field">
              <label>Unit Price (NPR) <span className="req">*</span></label>
              <div className="input-group">
                <span className="input-prefix">Rs.</span>
                <input 
                  type="number" 
                  name="price" 
                  value={formData.price} 
                  onChange={handleInput} 
                  required 
                />
              </div>
            </div>
            <div className="ap-field">
              <label>Available Stock</label>
              <input 
                type="number" 
                name="stock" 
                value={formData.stock} 
                onChange={handleInput} 
                placeholder="0"
              />
            </div>
          </div>
        </div>

        {/* SECTION 3: Content Audit */}
        <div className="ap-section">
          <div className="section-head">
            <FileText size={18} className="text-blue" />
            <span>Detailed Manifest</span>
          </div>
          <div className="ap-field">
            <label>Short Pitch (Teaser)</label>
            <textarea 
              name="shortDescription" 
              placeholder="A brief 1-2 sentence hook..."
              value={formData.shortDescription} 
              onChange={handleInput} 
              style={{height: '80px', resize: 'none'}}
            />
          </div>
          <div className="ap-field">
            <label>Complete Technical Description <span className="req">*</span></label>
            <textarea 
              name="description" 
              placeholder="Deep dive into your product's capabilities..."
              value={formData.description} 
              onChange={handleInput} 
              required 
              style={{minHeight: '150px', resize: 'vertical'}}
            />
          </div>
        </div>

        {/* SECTION 4: System Specs & Variants */}
        <div className="ap-section">
          <div className="section-head">
            <Layers size={18} className="text-blue" />
            <span>Specifications & Variants</span>
          </div>
          
          <div className="ap-field">
            <label>Color Gamut</label>
            <div className="ap-chip-field">
              {colorOptions.map(color => (
                <button 
                  type="button" 
                  key={color}
                  className={`ap-chip ${formData.colors.includes(color) ? 'active' : ''}`}
                  onClick={() => toggleColor(color)}
                >
                  <div className="chip-dot" style={{background: color.toLowerCase()}}></div>
                  {color}
                </button>
              ))}
            </div>
          </div>

          <div className="ap-field">
            <label>Storage Configurations</label>
            <div className="ap-chip-field">
              {storageOptions.map(opt => (
                <button 
                  type="button" 
                  key={opt}
                  className={`ap-chip ${formData.storage.includes(opt) ? 'active' : ''}`}
                  onClick={() => toggleStorage(opt)}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>

          <div className="ap-grid-3">
            <div className="ap-field">
              <label>Service Warranty (Months)</label>
              <input 
                type="number" 
                name="warranty" 
                placeholder="e.g. 12" 
                value={formData.warranty} 
                onChange={handleInput} 
              />
            </div>
            <div className="ap-field">
              <label>Manufacture Era</label>
              <input 
                type="date" 
                name="manufactureDate" 
                value={formData.manufactureDate} 
                onChange={handleInput} 
              />
            </div>
            <div className="ap-field">
              <label>Expiration Milestone</label>
              <input 
                type="date" 
                name="expiryDate" 
                value={formData.expiryDate} 
                onChange={handleInput} 
              />
            </div>
          </div>
        </div>

        {/* SECTION 5: Media Intelligence */}
        <div className="ap-section">
          <div className="section-head">
            <ImageIcon size={18} className="text-blue" />
            <span>Visual Assets</span>
          </div>
          <div className="ap-media-grid">
            {/* Primary Image */}
            <div className="ap-upload-card primary">
              <label className="upload-label">
                <input type="file" name="image" accept="image/*" onChange={handleInput} hidden />
                {formData.image ? (
                  <div className="preview-wrap">
                    <img src={URL.createObjectURL(formData.image)} alt="Main" />
                    <div className="btn-edit-layer"><PlusCircle /> Replace</div>
                  </div>
                ) : (
                  <div className="upload-placeholder">
                    <Plus size={32} />
                    <span>Blueprinting Image</span>
                    <p>Primary asset for your product</p>
                  </div>
                )}
              </label>
            </div>

            {/* Additional Images */}
            <div className="ap-multi-upload">
              <div className="multi-head">Perspective Gallery ({formData.additionalImages.length}/5)</div>
              <div className="gallery-grid">
                {formData.additionalImages.map((img, idx) => (
                  <div key={idx} className="gallery-item">
                    <img src={URL.createObjectURL(img)} alt="" />
                    <button type="button" className="btn-remove" onClick={() => removeAdditionalImage(idx)}><X size={12}/></button>
                  </div>
                ))}
                {formData.additionalImages.length < 5 && (
                  <label className="gallery-add">
                    <input type="file" name="additionalImages" accept="image/*" multiple onChange={handleInput} hidden />
                    <Plus size={20} />
                  </label>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="ap-actions">
           <button className="ap-btn-publish" type="submit">
             Confirm & Publish Listing
           </button>
        </div>
      </form>

      {toast.visible && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast(prev => ({ ...prev, visible: false }))} 
        />
      )}
    </div>
  );
}
