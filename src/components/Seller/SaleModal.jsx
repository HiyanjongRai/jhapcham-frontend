import React, { useState } from "react";
import axios from "axios";
import "./ProductManagement.css";

export default function SaleModal({ product, setProduct, setProducts, showSuccess, showError, currentUserId, BASE_URL }) {
  const [discount, setDiscount] = useState(product.discountPercent || 10);

  async function applySale() {
    try {
      const sellerId = product.sellerId || currentUserId;
      const res = await axios.patch(`${BASE_URL}/api/products/${product.id}/sale`, null, { params: { sellerId, discountPercent: discount }});
      setProducts(prev => prev.map(p => p.id === res.data.id ? { ...res.data, imagePath: `${BASE_URL}/api/products/images/${res.data.imagePath}` } : p));
      showSuccess("Sale applied successfully"); setProduct(null);
    } catch (err) { console.error(err); showError("Sale update failed"); }
  }

  async function removeSale() {
    try {
      const sellerId = product.sellerId || currentUserId;
      const res = await axios.delete(`${BASE_URL}/api/products/${product.id}/sale`, { params: { sellerId }});
      setProducts(prev => prev.map(p => p.id === res.data.id ? { ...res.data, imagePath: `${BASE_URL}/api/products/images/${res.data.imagePath}` } : p));
      showSuccess("Sale removed successfully"); setProduct(null);
    } catch (err) { console.error(err); showError("Remove sale failed"); }
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
