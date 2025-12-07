import React, { useState } from "react";
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
    setProduct(prev => ({
      ...prev,
      colors: prev.colors?.includes(color)
        ? prev.colors.filter(c => c !== color)
        : [...(prev.colors || []), color]
    }));
  }

  function toggleStorage(storage) {
    setProduct(prev => ({
      ...prev,
      storage: prev.storage?.includes(storage)
        ? prev.storage.filter(s => s !== storage)
        : [...(prev.storage || []), storage]
    }));
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
      // Basic fields
      Object.entries({
        name: product.name,
        description: product.description,
        shortDescription: product.shortDescription,
        price: product.price,
        category: product.category,
        brand: product.brand,
        stock: product.stock,
        sellerId
      }).forEach(([k, v]) => form.append(k, v));

      // Dates
      if (product.manufacturingDate) form.append("manufacturingDate", product.manufacturingDate);
      if (product.expiryDate) form.append("expiryDate", product.expiryDate);

      // Arrays
      product.colors?.forEach(c => form.append("colors", c));
      product.storage?.forEach(s => form.append("storage", s));

      // Others (optional)
      if (product.others) product.others.split(",").forEach(s => form.append("others", s.trim()));

      // Files
      if (imageFile) form.append("image", imageFile);
      if (additionalFiles.length) additionalFiles.forEach(f => form.append("additionalImages", f));

      const url = product.id
        ? `${BASE_URL}/api/products/update/${product.id}`
        : `${BASE_URL}/api/products/add`;
      const method = product.id ? "put" : "post";

      const res = await axios({
        url,
        method,
        data: form,
        headers: { "Content-Type": "multipart/form-data" }
      });

      const saved = {
        ...res.data,
        imagePath: res.data.imagePath ? `${BASE_URL}/api/products/images/${res.data.imagePath}` : ""
      };

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

  return (
    <div className="pm-drawer">
      <div className="pm-drawer-content">
        <h3>{product.id ? "Edit Product" : "Add Product"}</h3>
        <div className="pm-form">
          <label>Name:</label>
          <input type="text" value={product.name} onChange={e => handleFieldChange("name", e.target.value)} />

          <label>Brand:</label>
          <input type="text" value={product.brand} onChange={e => handleFieldChange("brand", e.target.value)} />

          <label>Category:</label>
          <input type="text" value={product.category} onChange={e => handleFieldChange("category", e.target.value)} />

          <label>Price:</label>
          <input type="number" value={product.price} onChange={e => handleFieldChange("price", e.target.value)} />

          <label>Stock:</label>
          <input type="number" value={product.stock} onChange={e => handleFieldChange("stock", e.target.value)} />

          <label>Colors:</label>
          <div className="pm-color-container">
            {product.colors?.map((c, i) => (
              <button
                key={i}
                className={`pm-color-btn ${product.colors.includes(c) ? "active" : ""}`}
                onClick={() => toggleColor(c)}
              >
                {c}
              </button>
            ))}
            <input
              type="text"
              placeholder="Add Color"
              value={colorInput}
              onChange={e => setColorInput(e.target.value)}
            />
            <button onClick={() => { if(colorInput){ toggleColor(colorInput); setColorInput(""); }}}>Add</button>
          </div>

          <label>Storage / Options:</label>
          <div className="pm-storage-container">
            {product.storage?.map((s, i) => (
              <button
                key={i}
                className={`pm-storage-btn ${product.storage.includes(s) ? "active" : ""}`}
                onClick={() => toggleStorage(s)}
              >
                {s}
              </button>
            ))}
            <input
              type="text"
              placeholder="Add Storage Option"
              value={storageInput}
              onChange={e => setStorageInput(e.target.value)}
            />
            <button onClick={() => { if(storageInput){ toggleStorage(storageInput); setStorageInput(""); }}}>Add</button>
          </div>

          <label>Main Image:</label>
          <input type="file" onChange={e => setImageFile(e.target.files[0])} />

          <label>Additional Images:</label>
          <input type="file" multiple onChange={e => setAdditionalFiles([...e.target.files])} />

          <label>Short Description:</label>
          <textarea value={product.shortDescription} onChange={e => handleFieldChange("shortDescription", e.target.value)} />

          <label>Description:</label>
          <textarea value={product.description} onChange={e => handleFieldChange("description", e.target.value)} />

          <div className="pm-drawer-buttons">
            <button onClick={saveProduct}>Save</button>
            <button onClick={onClose}>Cancel</button>
          </div>
        </div>
      </div>
    </div>
  );
}
