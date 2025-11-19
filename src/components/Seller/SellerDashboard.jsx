import React, { useState } from "react";
import axios from "axios";
import "./seller.css";
import { Home, Package, Users, ShoppingBag, Truck, Settings, Share2, MessageCircle, HelpCircle } from "lucide-react";
import { getCurrentUserId } from "../config/authUtils";
import { useNavigate } from "react-router-dom";



export default function SellerDashboard() {
  const [showAddProductCard, setShowAddProductCard] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    shortDescription: "",
    price: "",
    category: "",
    stock: "",
    others: "",
    image: null,
  });
  const [message, setMessage] = useState("");

  const menuItems = [
    { icon: <Home size={18} />, label: "Overview", active: true },
    { icon: <Package size={18} />, label: "Add Products" },
    { icon: <Package size={18} />, label: "Products" },
    { icon: <Users size={18} />, label: "Customer" },
    { icon: <ShoppingBag size={18} />, label: "Orders" },
    { icon: <Truck size={18} />, label: "Shipment" },
    { icon: <Settings size={18} />, label: "Store Setting" },
    { icon: <Share2 size={18} />, label: "Platform Partner" },
    { icon: <MessageCircle size={18} />, label: "Feedback" },
    { icon: <HelpCircle size={18} />, label: "Help & Support" },
  ];
  
const navigate = useNavigate();
 const handleMenuClick = (label) => {
  if (label === "Add Products") {
    setShowAddProductCard(!showAddProductCard);
  }
  if (label === "Orders") {
    navigate("/seller/orders");
  }
};


  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (files) {
      setFormData({ ...formData, image: files[0] });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const sellerId = getCurrentUserId();
    if (!sellerId) {
      setMessage("You are not logged in as a seller!");
      return;
    }

    try {
      const data = new FormData();
      data.append("name", formData.name);
      data.append("description", formData.description);
      data.append("shortDescription", formData.shortDescription);
      data.append("price", formData.price);
      data.append("category", formData.category);
      data.append("stock", formData.stock);
      data.append("others", formData.others);
      data.append("sellerId", sellerId); // dynamically from localStorage
      if (formData.image) data.append("image", formData.image);

      const res = await axios.post("http://localhost:8080/api/products/add", data, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setMessage("Product added successfully!");
      console.log(res.data);

      setFormData({
        name: "",
        description: "",
        shortDescription: "",
        price: "",
        category: "",
        stock: "",
        others: "",
        image: null,
      });
    } catch (err) {
      console.error(err);
      setMessage(err.response?.data?.error || "Error adding product");
    }
  };

  return (
    <div className="dashboard">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header"><span>Seller Panel</span></div>
        <nav className="sidebar-menu">
          {menuItems.map((item) => (
            <button
              key={item.label}
              className={"sidebar-menu-item" + (item.active ? " active" : "")}
              onClick={() => handleMenuClick(item.label)}
            >
              {item.icon}<span>{item.label}</span>
            </button>
          ))}
        </nav>
      </aside>

      {/* Add Product Card */}
      {showAddProductCard && (
        <div className="add-product-card">
          <h2>Add New Product</h2>
          <form onSubmit={handleSubmit}>
            <label>Product Name:</label>
            <input name="name" value={formData.name} onChange={handleChange} required />

            <label>Price:</label>
            <input name="price" type="number" value={formData.price} onChange={handleChange} required />

            <label>Description:</label>
            <textarea name="description" value={formData.description} onChange={handleChange} required />

            <label>Short Description:</label>
            <textarea name="shortDescription" value={formData.shortDescription} onChange={handleChange} />

            <label>Stock:</label>
            <input name="stock" type="number" value={formData.stock} onChange={handleChange} />

            <label>Category:</label>
            <input name="category" value={formData.category} onChange={handleChange} required />

            <label>Others:</label>
            <input name="others" value={formData.others} onChange={handleChange} />

            <label>Image:</label>
            <input name="image" type="file" accept="image/*" onChange={handleChange} />

            <button type="submit">Add Product</button>
          </form>
          {message && <p className="message">{message}</p>}
        </div>
      )}
    </div>
  );
}
