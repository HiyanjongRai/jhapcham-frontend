import React, { useState, useEffect } from "react";
import axios from "../../api/axios";
import { API_BASE } from "../config/config";
import { getCurrentUserId } from "../config/authUtils";
import { Calendar, Tag, Check, AlertCircle, Plus, ChevronRight, X } from "lucide-react";
import "./SellerCampaigns.css";
import Toast from "../Toast/Toast";

const SellerCampaigns = () => {
    const sellerId = getCurrentUserId();
    const [campaigns, setCampaigns] = useState([]);
    const [loading, setLoading] = useState(false);
    
    // Join Logic
    const [selectedCampaign, setSelectedCampaign] = useState(null);
    const [myProducts, setMyProducts] = useState([]);
    const [productsToJoin, setProductsToJoin] = useState([]);
    
    const [toast, setToast] = useState({ visible: false, message: '', type: 'info' });

    useEffect(() => {
        fetchUpcomingCampaigns();
    }, []);

    const showToast = (message, type) => {
        setToast({ visible: true, message, type });
    };

    const fetchUpcomingCampaigns = async () => {
        try {
            setLoading(true);
            const res = await axios.get(`${API_BASE}/api/seller/campaigns/upcoming`);
            setCampaigns(Array.isArray(res.data) ? res.data : []);
        } catch (err) {
            console.error(err);
            setCampaigns([]); // Reset to empty array on error
        } finally {
            setLoading(false);
        }
    };

    const handleJoinClick = async (campaign) => {
        setSelectedCampaign(campaign);
        try {
            // Fetch seller's active products
            const res = await axios.get(`${API_BASE}/api/products/seller/${sellerId}`);
            setMyProducts(res.data);
            setProductsToJoin([]);
        } catch (err) {
            showToast("Failed to load your products", "error");
        }
    };

    const handleProductSelect = (product) => {
        // Validation: Stock must be >= 10
        if (product.stockQuantity < 10) {
            showToast("Product must have at least 10 stock to join a campaign", "error");
            return;
        }

        // Toggle selection
        if (productsToJoin.some(p => p.productId === product.id)) {
            setProductsToJoin(prev => prev.filter(p => p.productId !== product.id));
        } else {
            setProductsToJoin(prev => [
                ...prev, 
                { 
                    productId: product.id, 
                    name: product.name,
                    originalPrice: product.price,
                    salePrice: product.price, // default
                    stockLimit: product.stockQuantity // default
                }
            ]);
        }
    };

    const handleJoinChange = (productId, field, value) => {
        setProductsToJoin(prev => prev.map(p => {
            if (p.productId === productId) {
                return { ...p, [field]: value };
            }
            return p;
        }));
    };

    const submitJoin = async () => {
        if (productsToJoin.length === 0) {
            showToast("Please select at least one product", "error");
            return;
        }

        // Validate
        for (let p of productsToJoin) {
            if (p.salePrice >= p.originalPrice) {
                 showToast(`Sale price for ${p.name} must be lower than original price`, "error");
                 return;
            }
            // Re-validate stock limit against current selection if needed, 
            // but the primary constraint is the product's total stock.
        }

        try {
            await axios.post(`${API_BASE}/api/seller/campaigns/join?sellerId=${sellerId}`, {
                campaignId: selectedCampaign.id,
                products: productsToJoin.map(p => ({
                    productId: p.productId,
                    salePrice: Number(p.salePrice),
                    stockLimit: Number(p.stockLimit)
                }))
            });
            showToast("Successfully joined the campaign!", "success");
            setSelectedCampaign(null);
            fetchUpcomingCampaigns(); // refresh
        } catch (err) {
            console.error(err);
            const errMsg = err.response?.data?.message || "Failed to join campaign. Try again.";
            showToast(errMsg, "error");
        }
    };

    if (loading && campaigns.length === 0) return <div className="sc-loading">Loading campaigns...</div>;

    return (
        <div className="sc-container">
            <h2 className="sc-title">Upcoming Campaigns</h2>
            <p className="sc-subtitle">Join platform-wide sales to boost your revenue.</p>

            <div className="sc-grid">
                {Array.isArray(campaigns) && campaigns.map(c => (
                    <div key={c.id} className="sc-card">
                        <div className="sc-card-badge">{c.type.replace('_',' ')}</div>
                        <h3>{c.name}</h3>
                        <div className="sc-dates">
                            <span>Start: {new Date(c.startTime).toLocaleString()}</span>
                            <span>End: {new Date(c.endTime).toLocaleString()}</span>
                        </div>
                        <div className="sc-discount-tag">
                            Discount Type: {c.discountType}
                        </div>
                        <button className="sc-btn-join" onClick={() => handleJoinClick(c)}>
                            Join Campaign <ChevronRight size={16} />
                        </button>
                    </div>
                ))}
                {campaigns.length === 0 && (
                    <div className="sc-empty">No upcoming campaigns available at the moment.</div>
                )}
            </div>

            {/* JOIN MODAL / OVERLAY */}
            {selectedCampaign && (
                <div className="sc-modal-overlay">
                    <div className="sc-modal">
                        <div className="sc-modal-header">
                            <h3>Join: {selectedCampaign.name}</h3>
                            <button className="sc-close-btn" onClick={() => setSelectedCampaign(null)}><X size={20}/></button>
                        </div>
                        <div className="sc-modal-body">
                            <p className="sc-modal-instruction">Select products to add to this sale.</p>
                            
                            <div className="sc-product-list">
                                {myProducts.map(prod => {
                                    const isSelected = productsToJoin.find(p => p.productId === prod.id);
                                    const lowStock = prod.stockQuantity < 10;
                                    
                                    return (
                                        <div key={prod.id} className={`sc-product-row ${isSelected ? 'selected' : ''} ${lowStock ? 'disabled' : ''}`}>
                                            <div className="sc-prod-check">
                                                    <input 
                                                        type="checkbox" 
                                                        checked={!!isSelected} 
                                                        onChange={() => handleProductSelect(prod)}
                                                    />
                                            </div>
                                            <div className="sc-prod-img">
                                                {prod.imagePaths?.[0] ? (
                                                    <img src={`${API_BASE}/${prod.imagePaths[0]}`} alt="" />
                                                ) : <div className="placeholder-img" />}
                                            </div>
                                            <div className="sc-prod-info">
                                                <div className="name">{prod.name}</div>
                                                <div className="price">Original: Rs. {prod.price}</div>
                                            </div>
                                            
                                            {isSelected && (
                                                <div className="sc-join-inputs">
                                                    <div>
                                                        <label>Sale Price</label>
                                                        <input 
                                                            type="number" 
                                                            value={isSelected.salePrice} 
                                                            onChange={(e) => handleJoinChange(prod.id, 'salePrice', e.target.value)}
                                                        />
                                                    </div>
                                                    <div>
                                                        <label>Stock Limit</label>
                                                        <input 
                                                            type="number" 
                                                            value={isSelected.stockLimit}
                                                            onChange={(e) => handleJoinChange(prod.id, 'stockLimit', e.target.value)}
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                        <div className="sc-modal-footer">
                            <span className="sc-summary-text">
                                {productsToJoin.length} products selected
                            </span>
                            <button className="sc-btn-submit" onClick={submitJoin}>
                                Confirm & Join
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {toast.visible && (
                <Toast 
                    message={toast.message} 
                    type={toast.type} 
                    onClose={() => setToast(prev => ({ ...prev, visible: false }))} 
                />
            )}
        </div>
    );
};

export default SellerCampaigns;
