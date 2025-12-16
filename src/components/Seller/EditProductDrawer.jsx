import React, { useState, useEffect } from "react";
import axios from "axios";
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

  function handleFieldChange(field, value) {
    setProduct(prev => ({ ...prev, [field]: value }));
  }

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

  async function saveProduct() {
    if (!product) return;

    try {
      const sellerId = product.sellerId || currentUserId;
      if (!sellerId) {
        showError("Seller id missing");
        return;
      }

      const form = new FormData();

      const colorOptionsText =
        product.colors && product.colors.length
          ? JSON.stringify(product.colors)
          : "[]";
      const storageSpecText =
        product.storage && product.storage.length
          ? JSON.stringify(product.storage)
          : "[]";

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
        colorOptions: colorOptionsText,
        storageSpec: storageSpecText,
        freeShipping: product.freeShipping || false,
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
          form.append("onSale", "true");
          
          if (saleMode === "percentage") {
              if (product.salePercentage) form.append("salePercentage", product.salePercentage);
          } else {
              // Backend Logic: If 'salePercentage' is not provided, 
              // the 'discountPrice' field in DTO is treated as the FINAL SALE PRICE.
              // So we send our 'salePrice' state (which is the final price) to 'discountPrice'.
              if (product.salePrice) form.append("discountPrice", product.salePrice);
          }
      } else {
          form.append("onSale", "false");
      }

      if (product.manufactureDate) form.append("manufactureDate", product.manufactureDate);
      if (product.expiryDate) form.append("expiryDate", product.expiryDate);

      if (product.id) {
        if (imageFile) form.append("newImages", imageFile);
        if (additionalFiles.length) {
          additionalFiles.forEach(f => form.append("newImages", f));
        }
      } else {
        if (imageFile) form.append("images", imageFile);
        if (additionalFiles.length) {
          additionalFiles.forEach(f => form.append("images", f));
        }
      }

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
  }, [product?.id]);

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
    <div className="pm-drawer">
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
        
        {/* TAB: ESSENTIALS */}
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
                    <select
                        value={product.category || ""}
                        onChange={e => handleFieldChange("category", e.target.value)}
                         style={{padding: '10px', borderRadius: '8px', border: '1px solid #ccc', width: '100%'}}
                    >
                      <option value="">Select a category</option>
                      <option value="Fashion & Apparel">Fashion & Apparel</option>
                      <option value="Electronics & Gadgets">Electronics & Gadgets</option>
                      <option value="Home & Living">Home & Living</option>
                      <option value="Beauty & Personal Care">Beauty & Personal Care</option>
                      <option value="Groceries & Daily Essentials">Groceries & Daily Essentials</option>
                      <option value="Health & Wellness">Health & Wellness</option>
                      <option value="Sports & Fitness">Sports & Fitness</option>
                      <option value="Books & Education">Books & Education</option>
                      <option value="Automobiles & Accessories">Automobiles & Accessories</option>
                      <option value="Toys, Games & Entertainment">Toys, Games & Entertainment</option>
                      <option value="Baby & Kids">Baby & Kids</option>
                      <option value="Furniture">Furniture</option>
                      <option value="Kitchen & Dining">Kitchen & Dining</option>
                      <option value="Mobile Accessories">Mobile Accessories</option>
                      <option value="Computer & Office Supplies">Computer & Office Supplies</option>
                      <option value="Jewelry & Watches">Jewelry & Watches</option>
                      <option value="Bags, Luggage & Travel Gear">Bags, Luggage & Travel Gear</option>
                      <option value="Pet Supplies">Pet Supplies</option>
                      <option value="Tools & Hardware">Tools & Hardware</option>
                      <option value="Industrial & Construction Supplies">Industrial & Construction Supplies</option>
                      <option value="Agriculture & Farming">Agriculture & Farming</option>
                      <option value="Electrical & Lighting">Electrical & Lighting</option>
                      <option value="Gifts & Occasions">Gifts & Occasions</option>
                      <option value="Art, Craft & Handmade">Art, Craft & Handmade</option>
                      <option value="Music, Movies & Media">Music, Movies & Media</option>
                      <option value="Software & Digital Products">Software & Digital Products</option>
                      <option value="Services">Services</option>
                      <option value="Real Estate">Real Estate</option>
                      <option value="Vehicles (Cars, Bikes, Scooters)">Vehicles (Cars, Bikes, Scooters)</option>
                      <option value="Others / Miscellaneous">Others / Miscellaneous</option>
                    </select>
                </div>
            </div>

            <div className="pm-form-group">
                <label>Short Description (Summary)</label>
                <textarea
                    value={product.shortDescription || ""}
                    onChange={e => handleFieldChange("shortDescription", e.target.value)}
                    placeholder="Brief overview for cards and lists..."
                    style={{height: '80px'}}
                />
            </div>

            <div className="pm-form-group">
                <label>Full Description</label>
                <textarea
                    value={product.description || ""}
                    onChange={e => handleFieldChange("description", e.target.value)}
                    placeholder="Detailed product information..."
                    style={{height: '150px'}}
                />
            </div>
          </div>
        )}


        {/* TAB: PRICING & STOCK */}
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

        {/* TAB: SPECS & SHIPPING */}
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
                 <label>Available Colors</label>
                 <div className="pm-tags-input">
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
             </div>

             <div className="pm-form-group">
                 <label>Storage / Size Options</label>
                 <div className="pm-tags-input">
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

        {/* TAB: IMAGES */}
        {activeTab === 'media' && (
          <div className="pm-form-section">
             <div className="pm-image-upload-section">
                 <h4>Main Product Image</h4>
                 <div className="pm-file-drop">
                     <input type="file" onChange={e => setImageFile(e.target.files[0])} accept="image/*" />
                     {imageFile ? <span className="file-name">{imageFile.name}</span> : <span className="placeholder">Choose Main Image</span>}
                 </div>
             </div>

             <div className="pm-image-upload-section">
                 <h4>Gallery Images</h4>
                 <div className="pm-file-drop">
                     <input
                        type="file"
                        multiple
                        onChange={e => setAdditionalFiles([...e.target.files])}
                         accept="image/*"
                      />
                      <span className="placeholder">
                          {additionalFiles.length > 0 ? `${additionalFiles.length} files selected` : "Choose Additional Images"}
                      </span>
                 </div>
             </div>
             
             <div className="pm-alert-info">
                 Tip: Use high-quality JPG or PNG images. Square aspect ratio (1:1) is recommended.
             </div>
          </div>
        )}

      </div>

      <div className="pm-drawer-footer">
        <button className="pm-btn-cancel" onClick={onClose}>Cancel</button>
        <button className="pm-btn-save" onClick={saveProduct}>Save Product</button>
      </div>
    </div>
  );
}
