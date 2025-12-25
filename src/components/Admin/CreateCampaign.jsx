import React, { useState, useEffect } from "react";
import axios from "../../api/axios";
import { API_BASE } from "../config/config";
import { Calendar, Tag, Clock, AlertCircle, Plus, Trash2, CheckCircle2, ChevronRight, X, Eye } from "lucide-react";
import "./CreateCampaign.css"; 

const CreateCampaign = ({ showToast }) => {
    const [campaigns, setCampaigns] = useState([]);
    const [loading, setLoading] = useState(false);
    const [view, setView] = useState("list"); // 'list' or 'create'

    // Form State
    const [formData, setFormData] = useState({
        name: "",
        type: "FLASH_SALE",
        startTime: "",
        endTime: "",
        discountType: "PERCENTAGE",
        priority: 1
    });

    // Manage State
    const [selectedCampaign, setSelectedCampaign] = useState(null);
    const [campaignProducts, setCampaignProducts] = useState([]);
    const [showManageModal, setShowManageModal] = useState(false);
    const [modalTab, setModalTab] = useState("PENDING"); // Default to pending for actionability

    useEffect(() => {
        fetchCampaigns();
    }, []);

    const fetchCampaigns = async () => {
        try {
            const res = await axios.get(`${API_BASE}/api/admin/campaigns`);
            setCampaigns(Array.isArray(res.data) ? res.data : []);
        } catch (err) {
            console.error(err);
            setCampaigns([]);
            showToast("Failed to fetch campaigns", "error");
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await axios.post(`${API_BASE}/api/admin/campaigns`, formData);
            showToast("Campaign created successfully!", "success");
            setView("list");
            setFormData({
                name: "",
                type: "FLASH_SALE",
                startTime: "",
                endTime: "",
                discountType: "PERCENTAGE",
                priority: 1
            });
            fetchCampaigns();
        } catch (err) {
            console.error(err);
            showToast("Failed to create campaign", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleManage = async (campaign) => {
        setSelectedCampaign(campaign);
        setShowManageModal(true);
        setModalTab("PENDING"); 
        fetchCampaignProducts(campaign.id);
    };

    const fetchCampaignProducts = async (campaignId) => {
        try {
            const res = await axios.get(`${API_BASE}/api/admin/campaigns/${campaignId}/products`);
            setCampaignProducts(Array.isArray(res.data) ? res.data : []);
        } catch (err) {
            setCampaignProducts([]);
            showToast("Failed to fetch campaign products", "error");
        }
    };

    const handleApproveProduct = async (prodId) => {
        try {
            await axios.post(`${API_BASE}/api/admin/campaigns/approve-product/${prodId}`);
            showToast("Product approved for campaign", "success");
            fetchCampaignProducts(selectedCampaign.id);
        } catch (err) {
            showToast("Failed to approve product", "error");
        }
    };

    const handleRejectProduct = async (prodId) => {
        try {
            await axios.post(`${API_BASE}/api/admin/campaigns/reject-product/${prodId}`);
            showToast("Product rejected", "info");
            fetchCampaignProducts(selectedCampaign.id);
        } catch (err) {
             showToast("Failed to reject product", "error");
        }
    };

    const handleDeleteCampaign = async (campaignId) => {
        if (!window.confirm("Are you sure you want to delete this campaign? All products will be reverted to their previous prices.")) return;
        try {
            await axios.delete(`${API_BASE}/api/admin/campaigns/${campaignId}`);
            showToast("Campaign deleted successfully", "success");
            fetchCampaigns();
        } catch (err) {
            console.error(err);
            showToast("Failed to delete campaign", "error");
        }
    };

    const renderList = () => (
        <div className="campaign-list-container">
            <div className="campaign-header-action">
                <h2>All Campaigns</h2>
                <button className="btn-create-campaign" onClick={() => setView("create")}>
                    <Plus size={18} /> Create New Campaign
                </button>
            </div>
            
            <div className="campaign-grid">
                {Array.isArray(campaigns) && campaigns.map(campaign => (
                    <div key={campaign.id} className={`campaign-card status-${campaign.status.toLowerCase()}`}>
                        <div className="campaign-card-header">
                            <span className="campaign-type-badge">{campaign.type.replace('_', ' ')}</span>
                            <span className={`campaign-status-pill ${campaign.status.toLowerCase()}`}>
                                {campaign.status}
                            </span>
                        </div>
                        <h3 className="campaign-title">{campaign.name}</h3>
                        
                        <div className="campaign-details">
                            <div className="campaign-detail-item">
                                <Calendar size={14} />
                                <span>Start: {new Date(campaign.startTime).toLocaleString()}</span>
                            </div>
                            <div className="campaign-detail-item">
                                <Clock size={14} />
                                <span>End: {new Date(campaign.endTime).toLocaleString()}</span>
                            </div>
                            <div className="campaign-detail-item">
                                <Tag size={14} />
                                <span>Discount: {campaign.discountType}</span>
                            </div>
                            <div className="campaign-detail-item">
                                <AlertCircle size={14} />
                                <span>Priority: {campaign.priority}</span>
                            </div>
                        </div>

                        <div className="campaign-footer-actions">
                             <button className="btn-manage" onClick={() => handleManage(campaign)}>
                                <Eye size={16} /> Manage Items
                             </button>
                             <button className="btn-delete-campaign" onClick={() => handleDeleteCampaign(campaign.id)} style={{ marginLeft: '10px', background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626' }} title="Delete Campaign">
                                <Trash2 size={16} />
                             </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    const renderForm = () => (
        <div className="create-campaign-form-container">
            <button className="btn-back" onClick={() => setView("list")}>&larr; Back to List</button>
            <h2>Create New Campaign</h2>
            <form onSubmit={handleSubmit} className="campaign-form">
                <div className="form-group">
                    <label>Campaign Name</label>
                    <input 
                        type="text" 
                        name="name" 
                        value={formData.name} 
                        onChange={handleInputChange} 
                        required 
                        placeholder="e.g. Winter Clearance 2025"
                    />
                </div>

                <div className="form-row">
                    <div className="form-group">
                        <label>Campaign Type</label>
                        <select name="type" value={formData.type} onChange={handleInputChange}>
                            <option value="FLASH_SALE">Flash Sale</option>
                            <option value="FESTIVAL">Festival</option>
                            <option value="SEASONAL">Seasonal</option>
                            <option value="CLEARANCE">Clearance</option>
                            <option value="OTHER">Other</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Discount Type</label>
                        <select name="discountType" value={formData.discountType} onChange={handleInputChange}>
                            <option value="PERCENTAGE">Percentage</option>
                            <option value="FIXED_AMOUNT">Fixed Amount</option>
                        </select>
                    </div>
                </div>

                <div className="form-row">
                    <div className="form-group">
                        <label>Start Time</label>
                        <input 
                            type="datetime-local" 
                            name="startTime" 
                            value={formData.startTime} 
                            onChange={handleInputChange} 
                            required 
                        />
                    </div>
                    <div className="form-group">
                        <label>End Time</label>
                        <input 
                            type="datetime-local" 
                            name="endTime" 
                            value={formData.endTime} 
                            onChange={handleInputChange} 
                            required 
                        />
                    </div>
                </div>

                <div className="form-group">
                    <label>Priority (Higher value overrides overlaps)</label>
                    <input 
                        type="number" 
                        name="priority" 
                        value={formData.priority} 
                        onChange={handleInputChange} 
                        min="1"
                        required 
                    />
                </div>

                <div className="form-actions">
                    <button type="button" className="btn-cancel" onClick={() => setView("list")}>Cancel</button>
                    <button type="submit" className="btn-submit" disabled={loading}>
                        {loading ? "Creating..." : "Create Campaign"}
                    </button>
                </div>
            </form>
        </div>
    );

    return (
        <div className="campaign-manager">
            {view === 'list' ? renderList() : renderForm()}

            {showManageModal && selectedCampaign && (
                <div className="ad-modal-overlay">
                    <div className="ad-modal-content" style={{ maxWidth: '800px' }}>
                        <div className="ad-modal-header">
                            <h2>Manage Products: {selectedCampaign.name}</h2>
                            <button className="ad-modal-close" onClick={() => setShowManageModal(false)}><X size={20}/></button>
                        </div>
                        <div className="ad-modal-body" style={{ maxHeight: '65vh', overflowY: 'auto', padding: '0' }}>
                            <div className="modal-tabs" style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
                                {["PENDING", "APPROVED", "REJECTED", "ALL"].map(tab => (
                                    <button 
                                        key={tab}
                                        onClick={() => setModalTab(tab)}
                                        style={{
                                            padding: '12px 24px',
                                            border: 'none',
                                            background: modalTab === tab ? '#fff' : 'transparent',
                                            borderBottom: modalTab === tab ? '2px solid #3b82f6' : 'none',
                                            color: modalTab === tab ? '#3b82f6' : '#64748b',
                                            fontWeight: '600',
                                            cursor: 'pointer',
                                            flex: 1,
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        {tab} ({tab === 'ALL' ? campaignProducts.length : campaignProducts.filter(p => p.status === tab).length})
                                    </button>
                                ))}
                            </div>

                            <div style={{ padding: '20px' }}>
                                {campaignProducts.filter(p => modalTab === 'ALL' || p.status === modalTab).length === 0 ? (
                                    <p style={{ textAlign: 'center', color: '#64748b', padding: '40px' }}>No {modalTab.toLowerCase()} products for this campaign.</p>
                                ) : (
                                    <table className="ad-table">
                                        <thead>
                                            <tr>
                                                <th>Product / Seller</th>
                                                <th>Original</th>
                                                <th>Sale Price</th>
                                                <th>Stock Limit</th>
                                                <th>Status</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {campaignProducts.filter(p => modalTab === 'ALL' || p.status === modalTab).map(cp => (
                                                <tr key={cp.id}>
                                                    <td>
                                                        <div className="ad-user-name">{cp.productName}</div>
                                                        <div className="ad-user-email">{cp.sellerName} (ID: {cp.productId})</div>
                                                    </td>
                                                    <td>Rs. {cp.originalPrice}</td>
                                                    <td style={{ color: '#dc2626', fontWeight: 'bold' }}>Rs. {cp.salePrice}</td>
                                                    <td>{cp.stockLimit}</td>
                                                    <td>
                                                        <span className={`ad-badge badge-${cp.status.toLowerCase()}`}>
                                                            {cp.status}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <div className="ad-action-buttons">
                                                            {cp.status === 'PENDING' && (
                                                                <>
                                                                    <button 
                                                                        className="ad-action-btn action-approve" 
                                                                        title="Approve"
                                                                        onClick={() => handleApproveProduct(cp.id)}
                                                                    >
                                                                        <CheckCircle2 size={18} />
                                                                    </button>
                                                                    <button 
                                                                        className="ad-action-btn action-reject" 
                                                                        title="Reject"
                                                                        onClick={() => handleRejectProduct(cp.id)}
                                                                    >
                                                                        <Trash2 size={18} />
                                                                    </button>
                                                                </>
                                                            )}
                                                            {cp.status !== 'PENDING' && (
                                                                <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Processed</span>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CreateCampaign;
