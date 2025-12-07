import React, { useState } from "react";
import axios from "axios";
import "./AddProduct.css";
import { getCurrentUserId } from "../config/authUtils";

export default function AddProductPage() {
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    category: "",
    description: "",
    shortDescription: "",
    brand: "",
    stock: "",
    others: "",
    colors: [],
    storage: [],        // 🔥 Storage options
    image: null,
    additionalImages: [],
    manufactureDate: "",
    expiryDate: "",
    warranty: "",
    features: "",       // 🔥 Features
    specifications: ""  // 🔥 Specifications
  });

  const [message, setMessage] = useState("");

  const colorOptions = [
    "Black","White","Gray","Silver","Red","Blue","Green",
    "Yellow","Pink","Purple","Orange","Brown"
  ];

  const storageOptions = ["32GB", "64GB", "128GB", "256GB", "512GB", "1TB"]; // 🔥 Storage options

  const handleInput = (e) => {
    const { name, value, files } = e.target;
    if (files) {
      if (name === "image") {
        setFormData({ ...formData, image: files[0] });
      } else if (name === "additionalImages") {
        setFormData({ ...formData, additionalImages: Array.from(files) });
      }
    } else {
      setFormData({ ...formData, [name]: value });
    }
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    const sellerId = getCurrentUserId();
    if (!sellerId) {
      setMessage("Seller login required");
      return;
    }

    try {
      const data = new FormData();
      data.append("name", formData.name);
      data.append("price", formData.price);
      data.append("category", formData.category);
      data.append("description", formData.description);
      data.append("shortDescription", formData.shortDescription);
      data.append("brand", formData.brand);
      data.append("stock", formData.stock);
      data.append("others", formData.others);
      data.append("sellerId", sellerId);
      data.append("colors", JSON.stringify(formData.colors));
      data.append("storage", JSON.stringify(formData.storage)); // 🔥 Storage
      if (formData.manufactureDate) data.append("manufactureDate", formData.manufactureDate);
      if (formData.expiryDate) data.append("expiryDate", formData.expiryDate);
      if (formData.warranty) data.append("warranty", formData.warranty);
      if (formData.features) data.append("features", formData.features.trim());
      if (formData.specifications) data.append("specifications", formData.specifications.trim());

      if (formData.image) data.append("image", formData.image);
      formData.additionalImages.forEach((img) => data.append("additionalImages", img));

      await axios.post(
        "http://localhost:8080/api/products/add",
        data,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      setMessage("Product added successfully!");
      setFormData({
        name: "", price: "", category: "", description: "", shortDescription: "",
        brand: "", stock: "", others: "", colors: [], storage: [],
        image: null, additionalImages: [], manufactureDate: "",
        expiryDate: "", warranty: "", features: "", specifications: ""
      });
    } catch (error) {
      console.error(error);
      setMessage("Error saving product");
    }
  };

  return (
    <div className="add-container">
      <h1>Add New Product</h1>
      <p>Fill in the details below to add a new product to your store.</p>

      <form className="add-card" onSubmit={handleSubmit}>

        {/* Name and Price */}
        <div className="row">
          <div className="field">
            <label>Product Name *</label>
            <input name="name" value={formData.name} onChange={handleInput} required />
          </div>
          <div className="field">
            <label>Price *</label>
            <input type="number" name="price" value={formData.price} onChange={handleInput} required />
          </div>
        </div>

        {/* Description */}
        <div className="field">
          <label>Full Description *</label>
          <textarea name="description" value={formData.description} onChange={handleInput} required />
        </div>

        <div className="field">
          <label>Short Description</label>
          <input name="shortDescription" value={formData.shortDescription} onChange={handleInput} />
        </div>

        {/* Category and Stock */}
        <div className="row">
          <div className="field">
            <label>Category *</label>
            <select name="category" value={formData.category} onChange={handleInput} required>
              <option value="">Select a category</option>
              <option value="electronics">Electronics</option>
              <option value="clothing">Clothing</option>
              <option value="food">Food</option>
              <option value="toys">Toys</option>
              <option value="vehicles">Vehicles</option>
            </select>
          </div>
          <div className="field">
            <label>Stock Quantity</label>
            <input type="number" name="stock" value={formData.stock} onChange={handleInput} />
          </div>
        </div>

        {/* Brand, Others, Warranty */}
        <div className="row">
          <div className="field">
            <label>Brand</label>
            <input name="brand" value={formData.brand} onChange={handleInput} />
          </div>
          <div className="field">
            <label>Other Details</label>
            <textarea name="others" value={formData.others} onChange={handleInput} />
          </div>
          <div className="field">
            <label>Warranty</label>
            <input name="warranty" value={formData.warranty} onChange={handleInput} placeholder="e.g., 1 year" />
          </div>
        </div>

        {/* Features */}
        <div className="field">
          <label>Features (one per line)</label>
          <textarea
            name="features"
            value={formData.features}
            onChange={handleInput}
            placeholder="• Feature 1&#10;• Feature 2&#10;• Feature 3"
          />
        </div>

        {/* Specifications */}
        <div className="field">
          <label>Specifications (one per line)</label>
          <textarea
            name="specifications"
            value={formData.specifications}
            onChange={handleInput}
            placeholder="• Spec 1&#10;• Spec 2&#10;• Spec 3"
          />
        </div>

        {/* Colors */}
        <div className="field">
          <label>Available Colors</label>
          <div className="color-list">
            {colorOptions.map((color) => (
              <button
                type="button"
                key={color}
                className={formData.colors.includes(color) ? "color-item active" : "color-item"}
                onClick={() => toggleColor(color)}
              >
                {color}
              </button>
            ))}
          </div>
        </div>

        {/* Storage */}
        <div className="field">
          <label>Storage Options</label>
          <div className="color-list">
            {storageOptions.map((option) => (
              <button
                type="button"
                key={option}
                className={formData.storage.includes(option) ? "color-item active" : "color-item"}
                onClick={() => toggleStorage(option)}
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        {/* Manufacture & Expiry */}
        <div className="row">
          <div className="field">
            <label>Manufacture Date</label>
            <input type="date" name="manufactureDate" value={formData.manufactureDate} onChange={handleInput} />
          </div>
          <div className="field">
            <label>Expiry Date</label>
            <input type="date" name="expiryDate" value={formData.expiryDate} onChange={handleInput} />
          </div>
        </div>

        {/* Images */}
        <div className="field">
          <label>Main Image</label>
          <div className="upload-box">
            <input type="file" name="image" accept="image/*" onChange={handleInput} />
            <p>Click to upload main product image<br />PNG, JPG up to 10MB</p>
          </div>
        </div>

        <div className="field">
          <label>Additional Images</label>
          <div className="upload-box">
            <input type="file" name="additionalImages" accept="image/*" multiple onChange={handleInput} />
            <p>Upload extra images for the product</p>
          </div>
        </div>

        <button className="submit-btn">Add Product</button>
        {message && <p className="message">{message}</p>}
      </form>
    </div>
  );
}
