import React, { useState, useEffect } from "react";
import axios from "axios";
import { UploadCloud, Image as ImageIcon, Info } from "lucide-react";
import "./ProductManagement.css";

export default function EditProductDrawer({
  product,
  setProduct,
  onClose,
  setProducts,
  showSuccess,
  showError,
  currentUserId,
  BASE_URL
}) {
  const [imageFile, setImageFile] = useState(null);
  const [additionalFiles, setAdditionalFiles] = useState([]);
  const [colorInput, setColorInput] = useState("");
  const [storageInput, setStorageInput] = useState("");
  const [sizeInput, setSizeInput] = useState("");
  const [activeVariants, setActiveVariants] = useState({
    colors: false,
    storage: false,
    sizes: false
  });

  function handleFieldChange(field, value) {
    setProduct(prev => ({ ...prev, [field]: value }));
  }

  const [categories, setCategories] = useState([]);

  useEffect(() => {
     axios.get(`${BASE_URL}/api/categories`)
        .then(res => setCategories(res.data))
        .catch(err => console.error("Failed to fetch categories", err));
  }, [BASE_URL]);

  function toggleColor(color) {
    setProduct(prev => {
      const colors = prev.colors || [];
      return {
        ...prev,
        colors: colors.includes(color)
          ? colors.filter(c => c !== color)
          : [...colors, color]
      };
    });
  }

  function toggleStorage(storage) {
    setProduct(prev => {
      const storageArr = prev.storage || [];
      return {
        ...prev,
        storage: storageArr.includes(storage)
          ? storageArr.filter(s => s !== storage)
          : [...storageArr, storage]
      };
    });
  }

  function toggleSize(size) {
    setProduct(prev => {
      const sizeArr = prev.sizes || [];
      return {
        ...prev,
        sizes: sizeArr.includes(size)
          ? sizeArr.filter(s => s !== size)
          : [...sizeArr, size]
      };
    });
  }

  async function saveProduct() {
    if (!product) return;

    try {
      const sellerId = product.sellerId || currentUserId;
      if (!sellerId) {
        showError("Seller id missing");
        return;
      }

      const form = new FormData();

      // Append sellerId explicitely
      form.append("sellerId", sellerId);

      // Handle arrays correctly for List<String> binding
      if (product.colors && product.colors.length) {
          product.colors.forEach(c => form.append("colors", c));
      }
      if (product.storage && product.storage.length) {
          product.storage.forEach(s => form.append("storage", s));
      }
      if (product.sizes && product.sizes.length) {
          product.sizes.forEach(sz => form.append("sizes", sz));
      }

      const baseFields = {
        name: product.name,
        description: product.description,
        shortDescription: product.shortDescription,
        price: product.price,
        category: product.category,
        brand: product.brand,
        stockQuantity: product.stock,             
        warrantyMonths: product.warrantyMonths, 
        specification: product.specification, 
        features: product.features,
        onSale: product.onSale?.toString(), // Use toString for FormData
        freeShipping: product.freeShipping?.toString(),
        insideValleyShipping: product.insideValleyShipping,
        outsideValleyShipping: product.outsideValleyShipping
      };

      Object.entries(baseFields).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== "") {
          form.append(k, v);
        }
      });
      
      // Sale Logic
      if (product.onSale) {
          if (saleMode === "percentage") {
              if (product.salePercentage) form.append("salePercentage", product.salePercentage);
          } else {
              // Backend Logic: If 'salePercentage' is not provided, 
              // the 'discountPrice' field in DTO is treated as the FINAL SALE PRICE.
              if (product.salePrice) form.append("discountPrice", product.salePrice);
          }
      }

      if (product.manufactureDate) form.append("manufactureDate", product.manufactureDate);
      if (product.expiryDate) form.append("expiryDate", product.expiryDate);

      // Legacy backend expects 'images' (List<MultipartFile>) for create 
      // and 'newImages' (List<MultipartFile>) for update in ProductUpdateRequestDTO
      const filesToUpload = imageFile ? [imageFile, ...additionalFiles] : additionalFiles;
      
      const fileFieldName = product.id ? "newImages" : "images";
      filesToUpload.forEach(f => form.append(fileFieldName, f));

      const url = product.id
        ? `${BASE_URL}/api/products/${product.id}`
        : `${BASE_URL}/api/products/seller/${sellerId}`;
      const method = product.id ? "put" : "post";

      const res = await axios({
        url,
        method,
        data: form,
        headers: { "Content-Type": "multipart/form-data" }
      });

      const saved = { ...res.data };

      setProducts(prev =>
        prev.find(p => p.id === saved.id)
          ? prev.map(p => (p.id === saved.id ? saved : p))
          : [...prev, saved]
      );

      showSuccess("Product saved successfully");
      onClose();
    } catch (err) {
      console.error(err);
      showError("Save failed");
    }
  }

  const [saleMode, setSaleMode] = useState("percentage");
  const [activeTab, setActiveTab] = useState("essentials");

  useEffect(() => {
    if (product?.id) {
       // Heuristic: If we have a percentage, default to percentage mode.
       // Even fixed price sales have a percentage calculated by backend, 
       // but percentage is the safest default.
       // If user wants to see fixed price, they can toggle. 
       // Maybe we can check if percentage is "round" or if salePrice is "round"?
       // For now, default to percentage unless it's null/0.
       if (product.salePercentage && parseFloat(product.salePercentage) > 0) {
           setSaleMode("percentage");
       } else {
           setSaleMode("fixed");
       }
    }
  }, [product?.id, product?.salePercentage]);

  function handlePercentageChange(e) {
    const pct = e.target.value;
    handleFieldChange("salePercentage", pct);
    
    const priceVal = parseFloat(product.price);
    const pctVal = parseFloat(pct);
    
    if (!isNaN(priceVal) && !isNaN(pctVal) && pctVal >= 0) {
       const discountAmount = priceVal * (pctVal / 100);
       const finalPrice = priceVal - discountAmount;
       handleFieldChange("discountPrice", discountAmount.toFixed(2)); // Backend needs Amount Off
       handleFieldChange("salePrice", finalPrice.toFixed(2)); // For UI display
    }
  }

  function handleSalePriceChange(e) {
    const finalPrice = e.target.value;
    handleFieldChange("salePrice", finalPrice);

    const priceVal = parseFloat(product.price);
    const finalVal = parseFloat(finalPrice);

    if (!isNaN(priceVal) && !isNaN(finalVal) && priceVal > 0) {
        const discountAmount = priceVal - finalVal;
        const pct = (discountAmount / priceVal) * 100;
        
        handleFieldChange("discountPrice", discountAmount.toFixed(2));
        handleFieldChange("salePercentage", pct.toFixed(2));
    }
  }

  return (
    <div className="pm-modal-overlay" onClick={onClose}>
      <div className="pm-drawer modal-mode" onClick={e => e.stopPropagation()}>
        <div className="pm-drawer-header">
          <h3>{product.id ? "Edit Product" : "Add Product"}</h3>
          <button className="pm-close-btn" onClick={onClose}>&times;</button>
        </div>
      
      <div className="pm-drawer-tabs">
        <button className={activeTab === 'essentials' ? 'active' : ''} onClick={() => setActiveTab('essentials')}>Essentials</button>
        <button className={activeTab === 'pricing' ? 'active' : ''} onClick={() => setActiveTab('pricing')}>Pricing & Stock</button>
        <button className={activeTab === 'specs' ? 'active' : ''} onClick={() => setActiveTab('specs')}>Specs & Shipping</button>
        <button className={activeTab === 'media' ? 'active' : ''} onClick={() => setActiveTab('media')}>Images</button>
      </div>

      <div className="pm-drawer-content">

        {activeTab === 'essentials' && (
          <div className="pm-form-section">
            <div className="pm-form-group">
                <label>Product Name</label>
                <input
                    type="text"
                    value={product.name || ""}
                    onChange={e => handleFieldChange("name", e.target.value)}
                    placeholder="e.g. Wireless Headphones"
                />
            </div>

            <div className="pm-row-2">
                <div className="pm-form-group">
                    <label>Brand</label>
                    <input
                        type="text"
                        value={product.brand || ""}
                        onChange={e => handleFieldChange("brand", e.target.value)}
                    />
                </div>
              <div className="pm-form-group">
                  <label>Category</label>
                  <input
                      list="edit-category-list"
                      value={product.category || ""}
                      onChange={e => handleFieldChange("category", e.target.value)}
                      placeholder="Type or select a category..."
                  />
                  <datalist id="edit-category-list">
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.name} />
                    ))}
                  </datalist>
              </div>
            </div>

            <div className="pm-form-group">
                <label>Short Description (Summary)</label>
                <textarea
                    value={product.shortDescription || ""}
                    onChange={e => handleFieldChange("shortDescription", e.target.value)}
                    placeholder="Brief overview for cards and lists..."
                    style={{ height: '70px', resize: 'vertical' }}
                />
            </div>

            <div className="pm-form-group">
                <label>Full Description</label>
                <textarea
                    value={product.description || ""}
                    onChange={e => handleFieldChange("description", e.target.value)}
                    placeholder="Detailed product information..."
                    style={{ height: '120px', resize: 'vertical' }}
                />
            </div>
          </div>
        )}

        {activeTab === 'pricing' && (
          <div className="pm-form-section">
             <div className="pm-row-2">
                <div className="pm-form-group">
                    <label>Base Price (₹)</label>
                    <input
                        type="number"
                        value={product.price || ""}
                        onChange={e => handleFieldChange("price", e.target.value)}
                    />
                </div>
                <div className="pm-form-group">
                    <label>Stock Quantity</label>
                    <input
                        type="number"
                        value={product.stock || ""}
                        onChange={e => handleFieldChange("stock", e.target.value)}
                    />
                </div>
             </div>

             <div className="pm-sale-card">
                <div className="pm-switch-row">
                    <label className="switch">
                        <input
                            type="checkbox"
                            checked={product.onSale || false}
                            onChange={e => handleFieldChange("onSale", e.target.checked)}
                        />
                        <span className="slider round"></span>
                    </label>
                    <span className="pm-switch-label">Enable Sale / Discount</span>
                </div>

                {product.onSale && (
                    <div className="pm-sale-config">
                        <div className="pm-radio-group">
                            <label className={`pm-radio-btn ${saleMode === 'percentage' ? 'active' : ''}`}>
                                <input 
                                    type="radio" 
                                    name="saleMode" 
                                    value="percentage" 
                                    checked={saleMode === "percentage"} 
                                    onChange={() => setSaleMode("percentage")}
                                /> Percentage Off
                            </label>
                            <label className={`pm-radio-btn ${saleMode === 'fixed' ? 'active' : ''}`}>
                                <input 
                                    type="radio" 
                                    name="saleMode" 
                                    value="fixed" 
                                    checked={saleMode === "fixed"} 
                                    onChange={() => setSaleMode("fixed")}
                                /> Fixed Price
                            </label>
                        </div>

                        <div className="pm-row-2" style={{marginTop: '1rem', alignItems: 'flex-end'}}>
                             {saleMode === "percentage" ? (
                                <div className="pm-form-group">
                                    <label>Discount Percentage (%)</label>
                                    <input
                                        type="number"
                                        value={product.salePercentage || ""}
                                        onChange={handlePercentageChange}
                                        placeholder="e.g. 10"
                                    />
                                </div>
                             ) : (
                                <div className="pm-form-group">
                                    <label>Target Final Price (₹)</label>
                                    <input
                                        type="number"
                                        value={product.salePrice || ""}
                                        onChange={handleSalePriceChange}
                                        placeholder="e.g. 999"
                                    />
                                </div>
                             )}
                             
                             <div className="pm-price-preview">
                                <label>Final Customer Price:</label>
                                <div className="pm-price-display">
                                    ₹{product.salePrice || product.price || '0'}
                                </div>
                             </div>
                        </div>
                    </div>
                )}
             </div>

             <div className="pm-row-2">
                <div className="pm-form-group">
                    <label>Warranty (Months)</label>
                    <input
                        type="number"
                        value={product.warrantyMonths || ""}
                        onChange={e => handleFieldChange("warrantyMonths", e.target.value)}
                    />
                </div>
             </div>
          </div>
        )}

        {activeTab === 'specs' && (
          <div className="pm-form-section">
             <div className="pm-section-title">Dates</div>
             <div className="pm-row-2">
                 <div className="pm-form-group">
                    <label>Manufacture Date</label>
                    <input type="date" value={product.manufactureDate || ""} onChange={e => handleFieldChange("manufactureDate", e.target.value)} />
                 </div>
                 <div className="pm-form-group">
                    <label>Expiry Date</label>
                    <input type="date" value={product.expiryDate || ""} onChange={e => handleFieldChange("expiryDate", e.target.value)} />
                 </div>
             </div>

             <div className="pm-section-title">Shipping Configuration</div>
             <div className="pm-shipping-card">
                 <div className="pm-switch-row">
                    <label className="switch">
                        <input
                           type="checkbox"
                           checked={product.freeShipping || false}
                           onChange={e => handleFieldChange("freeShipping", e.target.checked)}
                        />
                        <span className="slider round"></span>
                    </label>
                    <span className="pm-switch-label">Free Shipping (All Regions)</span>
                 </div>

                 {!product.freeShipping && (
                    <div className="pm-row-2" style={{marginTop: '1rem'}}>
                        <div className="pm-form-group">
                           <label>Inside Valley Fee</label>
                           <input
                              type="number"
                              placeholder="Default Profile Fee"
                              value={product.insideValleyShipping || ""}
                              onChange={e => handleFieldChange("insideValleyShipping", e.target.value)}
                           />
                           <small>Leave empty to use profile default</small>
                        </div>
                        <div className="pm-form-group">
                           <label>Outside Valley Fee</label>
                           <input
                              type="number"
                              placeholder="Default Profile Fee"
                              value={product.outsideValleyShipping || ""}
                              onChange={e => handleFieldChange("outsideValleyShipping", e.target.value)}
                           />
                           <small>Leave empty to use profile default</small>
                        </div>
                    </div>
                 )}
             </div>

             <div className="pm-section-title">Variants & Specs</div>
             
             <div className="pm-form-group">
                 <button 
                    type="button" 
                    className={`pm-collapsible-variant-btn ${activeVariants.colors ? 'active' : ''}`}
                    onClick={() => setActiveVariants(prev => ({...prev, colors: !prev.colors}))}
                 >
                   Color Variants {product.colors?.length > 0 && <span className="variant-count">({product.colors.length})</span>}
                 </button>
                 
                 {activeVariants.colors && (
                   <div className="pm-tags-input lux-fade-in" style={{ marginTop: '10px' }}>
                      {product.colors?.map((c, i) => (
                          <span key={i} className="pm-tag">
                              {c} 
                              <button onClick={() => toggleColor(c)}>&times;</button>
                          </span>
                      ))}
                      <div className="pm-tag-adder">
                          <input
                              type="text"
                              placeholder="Add color..."
                              value={colorInput}
                              onChange={e => setColorInput(e.target.value)}
                              onKeyDown={e => {
                                  if(e.key === 'Enter') {
                                      e.preventDefault();
                                      if (colorInput) { toggleColor(colorInput); setColorInput(""); }
                                  }
                              }}
                          />
                          <button type="button" onClick={() => { if (colorInput) { toggleColor(colorInput); setColorInput(""); } }}>+</button>
                      </div>
                   </div>
                 )}
             </div>

             <div className="pm-form-group">
                 <button 
                    type="button" 
                    className={`pm-collapsible-variant-btn ${activeVariants.storage ? 'active' : ''}`}
                    onClick={() => setActiveVariants(prev => ({...prev, storage: !prev.storage}))}
                 >
                   Storage / Configurations {product.storage?.length > 0 && <span className="variant-count">({product.storage.length})</span>}
                 </button>

                 {activeVariants.storage && (
                   <div className="pm-tags-input lux-fade-in" style={{ marginTop: '10px' }}>
                      {product.storage?.map((s, i) => (
                          <span key={i} className="pm-tag">
                              {s} 
                              <button onClick={() => toggleStorage(s)}>&times;</button>
                          </span>
                      ))}
                      <div className="pm-tag-adder">
                          <input
                              type="text"
                              placeholder="Add option..."
                              value={storageInput}
                              onChange={e => setStorageInput(e.target.value)}
                              onKeyDown={e => {
                                  if(e.key === 'Enter') {
                                      e.preventDefault();
                                      if (storageInput) { toggleStorage(storageInput); setStorageInput(""); }
                                  }
                              }}
                          />
                          <button type="button" onClick={() => { if (storageInput) { toggleStorage(storageInput); setStorageInput(""); } }}>+</button>
                      </div>
                   </div>
                 )}
             </div>

             <div className="pm-form-group">
                 <button 
                    type="button" 
                    className={`pm-collapsible-variant-btn ${activeVariants.sizes ? 'active' : ''}`}
                    onClick={() => setActiveVariants(prev => ({...prev, sizes: !prev.sizes}))}
                 >
                   Size Variants {product.sizes?.length > 0 && <span className="variant-count">({product.sizes.length})</span>}
                 </button>

                 {activeVariants.sizes && (
                 <div className="pm-tags-input">
                    {product.sizes?.map((sz, i) => (
                        <span key={i} className="pm-tag">
                            {sz} 
                            <button onClick={() => toggleSize(sz)}>&times;</button>
                        </span>
                    ))}
                    <div className="pm-tag-adder">
                        <input
                            type="text"
                            placeholder="Add size (e.g. XL, 42)..."
                            value={sizeInput}
                            onChange={e => setSizeInput(e.target.value)}
                            onKeyDown={e => {
                                if(e.key === 'Enter') {
                                    e.preventDefault();
                                    if (sizeInput) { toggleSize(sizeInput); setSizeInput(""); }
                                }
                            }}
                        />
                        <button type="button" onClick={() => { if (sizeInput) { toggleSize(sizeInput); setSizeInput(""); } }}>+</button>
                    </div>
                 </div>
                 )}
             </div>

             <div className="pm-form-group">
                <label>Technical Specifications (JSON or Text)</label>
                <textarea
                    value={product.specification || ""}
                    onChange={e => handleFieldChange("specification", e.target.value)}
                />
             </div>
             
             <div className="pm-form-group">
                <label>Key Features (Bullet Points)</label>
                <textarea
                    value={product.features || ""}
                    onChange={e => handleFieldChange("features", e.target.value)}
                    placeholder="One feature per line..."
                />
             </div>
          </div>
        )}

        {activeTab === 'media' && (
          <div className="pm-form-section">
             <div className="pm-image-upload-section">
                 <div className="pm-section-title" style={{ marginTop: 0, border: 'none', paddingBottom: 0 }}>Main Product Image</div>
                 <div className="pm-file-drop">
                     <input type="file" onChange={e => setImageFile(e.target.files[0])} accept="image/*" />
                     <div className="pm-file-drop-content">
                       <UploadCloud size={36} strokeWidth={1.5} className="pm-file-icon" />
                       {imageFile ? <span className="file-name">{imageFile.name}</span> : <span className="placeholder">Drag & drop or <span className="browse-link">browse</span></span>}
                       <span className="file-hint">Supports: JPG, PNG, WEBP</span>
                     </div>
                 </div>
             </div>

             <div className="pm-image-upload-section" style={{ marginTop: '0.5rem' }}>
                 <div className="pm-section-title" style={{ marginTop: 0, border: 'none', paddingBottom: 0 }}>Gallery Images</div>
                 <div className="pm-file-drop">
                     <input
                        type="file"
                        multiple
                        onChange={e => setAdditionalFiles([...e.target.files])}
                         accept="image/*"
                      />
                     <div className="pm-file-drop-content">
                       <ImageIcon size={36} strokeWidth={1.5} className="pm-file-icon" />
                       <span className="placeholder">
                          {additionalFiles.length > 0 ? `${additionalFiles.length} files selected` : <span>Drag & drop or <span className="browse-link">browse</span> multiple</span>}
                       </span>
                       <span className="file-hint">Select up to 5 additional angles</span>
                     </div>
                 </div>
             </div>
             
             <div className="pm-alert-info">
                 <Info size={16} />
                 <span>Tip: Use high-quality flat-lay or white background images. Square aspect ratio (1:1) is recommended.</span>
             </div>
          </div>
        )}

      </div>

      <div className="pm-drawer-footer">
        <button className="pm-btn-cancel" onClick={onClose}>Cancel</button>
        <button className="pm-btn-save" onClick={saveProduct}>Save Product</button>
      </div>
      </div>
    </div>
  );
}
