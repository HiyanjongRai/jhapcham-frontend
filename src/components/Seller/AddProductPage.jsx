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

  const [message, setMessage] = useState("");

  const colorOptions = [
    "Black","White","Gray","Silver","Red","Blue","Green",
    "Yellow","Pink","Purple","Orange","Brown"
  ];

  const storageOptions = ["32GB", "64GB", "128GB", "256GB", "512GB", "1TB"];

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
      
      // Match ProductCreateRequestDTO fields
      data.append("name", formData.name);
      data.append("price", formData.price);
      data.append("category", formData.category);
      data.append("description", formData.description);
      data.append("shortDescription", formData.shortDescription);
      data.append("brand", formData.brand);
      data.append("stockQuantity", formData.stock || "0");
      
      // Color options as JSON string
      if (formData.colors.length > 0) {
        data.append("colorOptions", JSON.stringify(formData.colors));
      }
      
      // Storage spec as JSON string
      if (formData.storage.length > 0) {
        data.append("storageSpec", JSON.stringify(formData.storage));
      }
      
      // Optional fields
      if (formData.manufactureDate) data.append("manufactureDate", formData.manufactureDate);
      if (formData.expiryDate) data.append("expiryDate", formData.expiryDate);
      if (formData.warranty) {
        const warrantyMonths = parseInt(formData.warranty) || 0;
        data.append("warrantyMonths", warrantyMonths.toString());
      }
      if (formData.features) data.append("features", formData.features.trim());
      if (formData.specification) data.append("specification", formData.specification.trim());
      
      // Images - backend expects 'images' array
      if (formData.image) {
        data.append("images", formData.image);
      }
      formData.additionalImages.forEach((img) => {
        data.append("images", img);
      });

      // Use new endpoint with seller ID in path
      const response = await axios.post(
        `http://localhost:8080/api/products/seller/${sellerId}`,
        data,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      console.log("Product created:", response.data);
      setMessage("Product added successfully!");
      
      // Reset form
      setFormData({
        name: "", price: "", category: "", description: "", shortDescription: "",
        brand: "", stock: "", colors: [], storage: [],
        image: null, additionalImages: [], manufactureDate: "",
        expiryDate: "", warranty: "", features: ""
      });
    } catch (error) {
      console.error("Add Product Error:", error);
      const serverMsg = error.response?.data?.message || error.response?.data?.error || "Error saving product";
      setMessage(serverMsg);
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
          <textarea name="shortDescription" value={formData.shortDescription} onChange={handleInput} />
        </div>

        {/* Category and Stock */}
        <div className="row">
          <div className="field">
            <label>Category *</label>
            <select name="category" value={formData.category} onChange={handleInput} required>
              <option value="">Select a category</option>
              <option value="Fashion & Apparel">Fashion & Apparel</option>
              <option value="Electronics & Gadgets">Electronics & Gadgets</option>
              <option value="Home & Living">Home & Living</option>
              <option value="Beauty & Personal Care">Beauty & Personal Care</option>
              <option value="Health & Wellness">Health & Wellness</option>
              <option value="Books & Education">Books & Education</option>
              <option value="Furniture">Furniture</option>
              <option value="Mobile Accessories">Mobile Accessories</option>
              <option value="Jewelry & Watches">Jewelry & Watches</option>
              <option value="Pet Supplies">Pet Supplies</option>
              <option value="Industrial & Construction Supplies">Industrial & Construction Supplies</option>
              <option value="Software & Digital Products">Software & Digital Products</option>
              <option value="Vehicles (Cars, Bikes, Scooters)">Vehicles (Cars, Bikes, Scooters)</option>
              <option value="Others / Miscellaneous">Others / Miscellaneous</option>
            </select>
          </div>
          <div className="field">
            <label>Stock Quantity</label>
            <input type="number" name="stock" value={formData.stock} onChange={handleInput} />
          </div>
        </div>

        {/* Brand and Warranty */}
        <div className="row">
          <div className="field">
            <label>Brand</label>
            <input name="brand" value={formData.brand} onChange={handleInput} />
          </div>
          <div className="field">
            <label>Warranty (months)</label>
            <input type="number" name="warranty" value={formData.warranty} onChange={handleInput} placeholder="e.g., 12" />
          </div>
        </div>

        {/* Specification */}
        <div className="field">
          <label>Specification</label>
          <textarea
             name="specification"
             value={formData.specification}
             onChange={handleInput}
             placeholder="Technical specifications..."
          />
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
