import React, { useState } from "react";
import axios from "axios";
import "./ProductManagement.css";

export default function SaleModal({ product, setProduct, setProducts, showSuccess, showError, currentUserId, BASE_URL }) {
  const [discount, setDiscount] = useState(product.discountPercent || 10);

  async function applySale() {
    try {
      const form = new FormData();
      form.append("onSale", "true");
      form.append("salePercentage", discount.toString());
      
      const res = await axios.put(`${BASE_URL}/api/products/${product.id}`, form, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      
      setProducts(prev => prev.map(p => p.id === res.data.id ? { 
        ...res.data, 
        imagePath: res.data.imagePaths && res.data.imagePaths.length > 0 ? res.data.imagePaths[0] : res.data.imagePath 
      } : p));
      
      showSuccess("Sale applied successfully"); 
      setProduct(null);
    } catch (err) { 
      console.error(err); 
      showError("Sale update failed"); 
    }
  }

  async function removeSale() {
    try {
      const form = new FormData();
      form.append("onSale", "false");
      
      const res = await axios.put(`${BASE_URL}/api/products/${product.id}`, form, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      
      setProducts(prev => prev.map(p => p.id === res.data.id ? { 
        ...res.data, 
        imagePath: res.data.imagePaths && res.data.imagePaths.length > 0 ? res.data.imagePaths[0] : res.data.imagePath 
      } : p));
      
      showSuccess("Sale removed successfully"); 
      setProduct(null);
    } catch (err) { 
      console.error(err); 
      showError("Remove sale failed"); 
    }
  }

  return (
    <div className="pm-modal">
      <div className="pm-modal-content">
        <h3>{product.onSale ? "Remove Sale" : "Put on Sale"}</h3>
        {!product.onSale && (
          <div>
            <label>Discount %:</label>
            <input type="number" value={discount} onChange={e => setDiscount(Number(e.target.value))} />
          </div>
        )}
        <div className="pm-drawer-buttons">
          {product.onSale ? <button onClick={removeSale}>Remove Sale</button> : <button onClick={applySale}>Apply Sale</button>}
          <button onClick={() => setProduct(null)}>Cancel</button>
        </div>
      </div>
    </div>
  );
}
