import React, { useState, useEffect } from "react";
import "./AddProduct.css";
import {
  DollarSign,
  Info,
  Layers,
  FileText,
  Image as ImageIcon,
  Plus,
  X,
  PlusCircle
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getCurrentUserId } from "../../utils/authUtils";
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
    specification: "",
    sizes: []
  });

  const colorOptions = [
    "Black","White","Gray","Silver","Red","Blue","Green",
    "Yellow","Pink","Purple","Orange","Brown"
  ];

  const storageOptions = ["32GB", "64GB", "128GB", "256GB", "512GB", "1TB"];
  const sizeOptions = ["XS", "S", "M", "L", "XL", "XXL", "3XL", "Free Size"];

  const [toast, setToast] = useState({ visible: false, message: '', type: 'info' });
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [activeVariants, setActiveVariants] = useState({
    colors: false,
    storage: false,
    sizes: false
  });
  
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

  const toggleSize = (size) => {
    const selected = formData.sizes.includes(size)
      ? formData.sizes.filter((s) => s !== size)
      : [...formData.sizes, size];
    setFormData({ ...formData, sizes: selected });
  };

  const toggleVariantSection = (key) => {
    setActiveVariants(prev => ({ ...prev, [key]: !prev[key] }));
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

    if (!formData.image) {
      showToast("Primary product image is required", "error");
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
      
      // Fix: Join arrays into comma-separated strings for backend binding
      if (formData.colors.length > 0) {
        data.append("colorOptions", formData.colors.join(", "));
      }
      if (formData.storage.length > 0) {
        data.append("storageSpec", formData.storage.join(", "));
      }
      if (formData.sizes.length > 0) {
        data.append("sizeOptions", formData.sizes.join(", "));
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

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.message || "Conflict or Missing Data. Check all required fields.");
      }

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
          <h1 className="gt-h3">Product Blueprint</h1>
          <p className="gt-note">Configure your next marketplace listing with high-precision details.</p>
        </div>
        <button className="ap-btn-cancel" onClick={() => navigate(-1)}>Discard</button>
      </div>

      <form className="ap-workspace" onSubmit={handleSubmit}>

        <div className="ap-section">
          <div className="section-head">
            <Info size={18} strokeWidth={2.5} />
            <span className="gt-caption">Product Identity</span>
          </div>
          
          <div className="ap-grid-2">
            <div className="ap-field">
              <label className="gt-note">Official Listing Title <span className="req">*</span></label>
              <input 
                name="name" 
                placeholder="e.g. iPhone 15 Pro Max" 
                value={formData.name} 
                onChange={handleInput} 
                required 
              />
            </div>
            <div className="ap-field">
              <label className="gt-note">Manufacturer Brand</label>
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
            <input 
              list="category-list"
              name="category" 
              value={formData.category} 
              onChange={handleInput} 
              placeholder="Select or type a new category..."
              required 
              style={{ width: '100%', height: '45px', borderRadius: '8px', border: '1.5px solid #e4e4e7', padding: '0 16px' }}
            />
            <datalist id="category-list">
              {categories.map(cat => (
                <option key={cat.id} value={cat.name} />
              ))}
            </datalist>
          </div>
        </div>

        <div className="ap-section">
          <div className="section-head">
            <DollarSign size={18} strokeWidth={2.5} />
            <span className="gt-caption">Economics & Inventory</span>
          </div>
          <div className="ap-grid-2">
            <div className="ap-field">
              <label className="gt-note">Unit Price (NPR) <span className="req">*</span></label>
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
              <label className="gt-note">Available Stock</label>
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

        <div className="ap-section">
          <div className="section-head">
            <FileText size={18} strokeWidth={2.5} />
            <span className="gt-caption">Detailed Manifest</span>
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
            <label>Detailed Technical Brief <span className="req">*</span></label>
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

        <div className="ap-section">
          <div className="section-head">
            <Layers size={18} strokeWidth={2.5} />
            <span className="gt-caption">Specifications & Variants</span>
          </div>
          
          <div className="ap-field">
            <button 
              type="button" 
              className={`ap-variant-toggle ${activeVariants.colors ? 'active' : ''}`}
              onClick={() => toggleVariantSection('colors')}
            >
              <Plus size={14} /> Color Variants
            </button>
            {activeVariants.colors && (
              <div className="ap-chip-field lux-fade-in" style={{ marginTop: '12px' }}>
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
            )}
          </div>

          <div className="ap-field">
            <button 
              type="button" 
              className={`ap-variant-toggle ${activeVariants.storage ? 'active' : ''}`}
              onClick={() => toggleVariantSection('storage')}
            >
              <Plus size={14} /> Storage Configurations
            </button>
            {activeVariants.storage && (
              <div className="ap-chip-field lux-fade-in" style={{ marginTop: '12px' }}>
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
            )}
          </div>
          
          <div className="ap-field">
            <button 
              type="button" 
              className={`ap-variant-toggle ${activeVariants.sizes ? 'active' : ''}`}
              onClick={() => toggleVariantSection('sizes')}
            >
              <Plus size={14} /> Size Variants
            </button>
            {activeVariants.sizes && (
              <div className="ap-chip-field lux-fade-in" style={{ marginTop: '12px' }}>
                {sizeOptions.map(size => (
                  <button 
                    type="button" 
                    key={size}
                    className={`ap-chip ${formData.sizes.includes(size) ? 'active' : ''}`}
                    onClick={() => toggleSize(size)}
                  >
                    {size}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="ap-grid-3">
            <div className="ap-field">
              <label className="gt-note">Service Warranty (Months)</label>
              <input 
                type="number" 
                name="warranty" 
                placeholder="e.g. 12" 
                value={formData.warranty} 
                onChange={handleInput} 
              />
            </div>
            <div className="ap-field">
              <label className="gt-note">Manufacture Era</label>
              <input 
                type="date" 
                name="manufactureDate" 
                value={formData.manufactureDate} 
                onChange={handleInput} 
              />
            </div>
            <div className="ap-field">
              <label className="gt-note">Expiration Milestone</label>
              <input 
                type="date" 
                name="expiryDate" 
                value={formData.expiryDate} 
                onChange={handleInput} 
              />
            </div>
          </div>
        </div>

        <div className="ap-section">
          <div className="section-head">
            <PlusCircle size={18} strokeWidth={2.5} />
            <span className="gt-caption">Technical Audit</span>
          </div>
          <div className="ap-field">
            <label>Technical Specifications</label>
            <textarea 
              name="specification" 
              placeholder="Detailed technical specs (e.g. Processor: A17 Pro, RAM: 8GB...)" 
              value={formData.specification} 
              onChange={handleInput} 
              style={{minHeight: '150px', resize: 'vertical'}}
            />
          </div>
        </div>

        <div className="ap-section">
          <div className="section-head">
            <ImageIcon size={18} strokeWidth={2.5} />
            <span className="gt-caption">Visual Assets</span>
          </div>
          <div className="ap-media-grid">
            
            <div className="ap-upload-card primary">
              <label className="upload-label">
                <input type="file" name="image" accept="image/*" onChange={handleInput} hidden />
                {formData.image ? (
                  <div className="preview-wrap">
                    <img src={URL.createObjectURL(formData.image)} alt="Main" />
                    <div className="btn-edit-layer"><PlusCircle size={14} /> Replace</div>
                  </div>
                ) : (
                  <div className="upload-placeholder">
                    <Plus size={18} />
                    <span>Upload Primary Asset</span>
                    <p>800x800 recommended • JPG/PNG</p>
                  </div>
                )}
              </label>
            </div>

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
                    <Plus size={14} />
                  </label>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="ap-actions">
           <button className="ap-btn-publish gt-small" type="submit">
             Finalize & Publish Listing
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
