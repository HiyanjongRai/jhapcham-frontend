import React, { useState, useEffect } from "react";
import axios from "../../api/axios";
import { API_BASE } from "../config/config";
import { Calendar, Tag, Clock, AlertCircle, Plus, Trash2, CheckCircle2, ChevronRight, X, Eye } from "lucide-react";
import "./AdminDashboard.css"; 

const CreateCampaign = ({ showToast, confirmConfig, setConfirmConfig }) => {
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
        priority: 1,
        image: null
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
        const { name, value, files } = e.target;
        if (name === "image") {
            setFormData(prev => ({ ...prev, image: files[0] }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const data = new FormData();
            data.append("name", formData.name);
            data.append("type", formData.type);
            data.append("startTime", formData.startTime);
            data.append("endTime", formData.endTime);
            data.append("discountType", formData.discountType);
            data.append("priority", formData.priority);
            if (formData.image) {
                data.append("image", formData.image);
            }

            await axios.post(`${API_BASE}/api/admin/campaigns`, data, {
                headers: {
                    "Content-Type": "multipart/form-data"
                }
            });
            showToast("Campaign created successfully!", "success");
            setView("list");
            setFormData({
                name: "",
                type: "FLASH_SALE",
                startTime: "",
                endTime: "",
                discountType: "PERCENTAGE",
                priority: 1,
                image: null
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

    const handleDeleteCampaign = (campaignId) => {
        setConfirmConfig({
            isOpen: true,
            title: "Delete Campaign",
            message: "Are you sure you want to delete this campaign? All products will be reverted to their previous prices.",
            type: "danger",
            onConfirm: async () => {
                try {
                    await axios.delete(`${API_BASE}/api/admin/campaigns/${campaignId}`);
                    showToast("Campaign deleted successfully", "success");
                    fetchCampaigns();
                } catch (err) {
                    console.error(err);
                    showToast("Failed to delete campaign", "error");
                }
            }
        });
    };

    const renderList = () => (
        <div className="adm-campaign-list">
            <div className="adm-header">
                <div>
                    <h1 className="adm-page-title">Campaign Manager</h1>
                    <p className="adm-page-sub">Create and moderate sitewide sales, festivals, and flash deals</p>
                </div>
                <button className="adm-panel-btn primary" onClick={() => setView("create")}>
                    <Plus size={18} /> New Campaign
                </button>
            </div>
            
            <div className="adm-charts-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' }}>
                {Array.isArray(campaigns) && campaigns.map(campaign => (
                    <div key={campaign.id} className="adm-chart-card" style={{ padding: '0', overflow: 'hidden' }}>
                        <div style={{ padding: '20px', borderBottom: '1px solid var(--adm-border)' }}>
                            <div className="adm-chart-header" style={{ marginBottom: '8px' }}>
                                <h3 style={{ textTransform: 'capitalize', fontSize: '1rem' }}>{campaign.name}</h3>
                                <span className={`adm-badge badge-${campaign.status.toLowerCase()}`}>
                                    {campaign.status}
                                </span>
                            </div>
                            <div className="adm-mini-stats-row" style={{ marginTop: '4px', marginBottom: '0', display: 'flex', gap: '8px' }}>
                                <span className="adm-report-type-badge">
                                    <Tag size={10} style={{ marginRight: '4px' }} /> {campaign.type.replace('_', ' ')}
                                </span>
                                <span className="adm-report-type-badge" style={{ background: '#e0f2fe', color: '#0369a1', borderColor: '#bae6fd' }}>
                                    Priority {campaign.priority}
                                </span>
                            </div>
                        </div>

                        <div style={{ padding: '16px 20px', background: '#f8fafc' }}>
                            <div className="adm-detail-row">
                                <span className="adm-detail-label">Start</span>
                                <span className="adm-detail-val" style={{ fontSize: '0.75rem' }}>{new Date(campaign.startTime).toLocaleDateString()}</span>
                            </div>
                            <div className="adm-detail-row">
                                <span className="adm-detail-label">End</span>
                                <span className="adm-detail-val" style={{ fontSize: '0.75rem' }}>{new Date(campaign.endTime).toLocaleDateString()}</span>
                            </div>
                            <div className="adm-detail-row">
                                <span className="adm-detail-label">Discount</span>
                                <span className="adm-detail-val" style={{ color: 'var(--adm-blue)' }}>{campaign.discountType === 'PERCENTAGE' ? '%' : 'Rs'} Off</span>
                            </div>
                        </div>

                        <div className="adm-row-actions" style={{ padding: '16px 20px', borderTop: '1px solid var(--adm-border)', justifyContent: 'flex-start' }}>
                             <button className="adm-action-btn" onClick={() => handleManage(campaign)}>
                                <Eye size={16} /> Manage
                             </button>
                             <button 
                                className="adm-icon-btn danger" 
                                onClick={() => handleDeleteCampaign(campaign.id)} 
                                title="Delete Campaign"
                             >
                                <Trash2 size={16} />
                             </button>
                        </div>
                    </div>
                ))}
                
                {campaigns.length === 0 && (
                    <div className="adm-empty-state" style={{ gridColumn: '1 / -1' }}>
                        <h3>No Active Campaigns</h3>
                        <p>Launch your first promotion to boost platform sales.</p>
                    </div>
                )}
            </div>
        </div>
    );

    const renderForm = () => (
        <div className="adm-campaign-form">
            <div className="adm-header">
                <div>
                    <h1 className="adm-page-title">Create Campaign</h1>
                    <p className="adm-page-sub">Configure duration, exclusivity, and discount rules</p>
                </div>
                <button className="adm-panel-btn warn" onClick={() => setView("list")}>Cancel</button>
            </div>

            <div className="adm-chart-card">
                <form onSubmit={handleSubmit} className="adm-panel-actions">
                    <div className="form-group" style={{ marginBottom: '20px' }}>
                        <label className="adm-form-label">Campaign Name</label>
                        <input 
                            className="adm-select"
                            style={{ width: '100%', boxSizing: 'border-box' }}
                            type="text" 
                            name="name" 
                            value={formData.name} 
                            onChange={handleInputChange} 
                            required 
                            placeholder="e.g. Winter Clearance 2025"
                        />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                        <div>
                            <label className="adm-form-label">Campaign Type</label>
                            <select className="adm-select" style={{ width: '100%' }} name="type" value={formData.type} onChange={handleInputChange}>
                                <option value="FLASH_SALE">Flash Sale</option>
                                <option value="FESTIVAL">Festival</option>
                                <option value="SEASONAL">Seasonal</option>
                                <option value="CLEARANCE">Clearance</option>
                                <option value="OTHER">Other</option>
                            </select>
                        </div>
                        <div>
                            <label className="adm-form-label">Discount Type</label>
                            <select className="adm-select" style={{ width: '100%' }} name="discountType" value={formData.discountType} onChange={handleInputChange}>
                                <option value="PERCENTAGE">Percentage</option>
                                <option value="FIXED_AMOUNT">Fixed Amount</option>
                            </select>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                        <div>
                            <label className="adm-form-label">Start Time</label>
                            <input 
                                className="adm-select"
                                style={{ width: '100%', boxSizing: 'border-box' }}
                                type="datetime-local" 
                                name="startTime" 
                                value={formData.startTime} 
                                onChange={handleInputChange} 
                                required 
                            />
                        </div>
                        <div>
                            <label className="adm-form-label">End Time</label>
                            <input 
                                className="adm-select"
                                style={{ width: '100%', boxSizing: 'border-box' }}
                                type="datetime-local" 
                                name="endTime" 
                                value={formData.endTime} 
                                onChange={handleInputChange} 
                                required 
                            />
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                        <div>
                            <label className="adm-form-label">Priority (Higher overrides overlaps)</label>
                            <input 
                                className="adm-select"
                                style={{ width: '100%', boxSizing: 'border-box' }}
                                type="number" 
                                name="priority" 
                                value={formData.priority} 
                                onChange={handleInputChange} 
                                min="1"
                                required 
                            />
                        </div>
                        <div>
                            <label className="adm-form-label">Banner Image</label>
                            <input 
                                className="adm-select"
                                style={{ width: '100%', boxSizing: 'border-box' }}
                                type="file" 
                                name="image" 
                                onChange={handleInputChange} 
                                accept="image/*"
                            />
                        </div>
                    </div>

                    <div style={{ marginTop: '20px', display: 'flex', gap: '12px' }}>
                        <button type="submit" className="adm-submit-btn" style={{ width: 'auto', padding: '12px 32px' }} disabled={loading}>
                            {loading ? "Creating..." : "Create Campaign"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );

    return (
        <div className="adm-campaign-manager">
            {view === 'list' ? renderList() : renderForm()}

            {showManageModal && selectedCampaign && (
                <div className="adm-overlay" onClick={() => setShowManageModal(false)}>
                    <div className="adm-glass-modal" onClick={e => e.stopPropagation()}>
                        <div className="adm-modal-header-hero">
                            <div className="adm-modal-hero-title">
                                <h2>{selectedCampaign.name}</h2>
                                <p>Operational Moderation Hub · {selectedCampaign.type.replace('_', ' ')}</p>
                            </div>
                            <button className="adm-close-btn" style={{ background: 'rgba(255,255,255,0.2)', color: 'white' }} onClick={() => setShowManageModal(false)}>
                                <X size={24}/>
                            </button>
                        </div>
                        
                        <div className="adm-glass-tabs">
                            {["PENDING", "APPROVED", "REJECTED", "ALL"].map(tab => (
                                <button 
                                    key={tab}
                                    onClick={() => setModalTab(tab)}
                                    className={`adm-glass-tab ${modalTab === tab ? 'active' : ''}`}
                                >
                                    {tab} ({tab === 'ALL' ? campaignProducts.length : campaignProducts.filter(p => p.status === tab).length})
                                </button>
                            ))}
                        </div>

                        <div className="adm-panel-body" style={{ background: '#f8fafc', padding: '30px', overflowY: 'auto' }}>

                            {campaignProducts.filter(p => modalTab === 'ALL' || p.status === modalTab).length === 0 ? (
                                <div className="adm-empty-state">
                                    <p>No {modalTab.toLowerCase()} products found.</p>
                                </div>
                            ) : (
                                campaignProducts.filter(p => modalTab === 'ALL' || p.status === modalTab).map(cp => (
                                    <div key={cp.id} className="adm-row">
                                        <div className="adm-row-avatar">
                                            {cp.productName.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="adm-row-info">
                                            <h4 className="adm-row-title">{cp.productName}</h4>
                                            <p className="adm-row-sub">{cp.sellerName}</p>
                                            <div style={{ marginTop: '6px', display: 'flex', gap: '8px' }}>
                                                <span className="adm-report-type-badge">Limit: {cp.stockLimit}</span>
                                                <span className={`adm-badge badge-${cp.status.toLowerCase()}`}>{cp.status}</span>
                                            </div>
                                        </div>
                                        <div className="adm-price-block" style={{ minWidth: '100px', marginRight: '20px' }}>
                                            <span className="adm-price" style={{ color: 'var(--adm-danger)' }}>Rs. {cp.salePrice}</span>
                                            <span className="adm-price-old">Rs. {cp.originalPrice}</span>
                                        </div>
                                        <div className="adm-row-actions">
                                            {cp.status === 'PENDING' && (
                                                <>
                                                    <button 
                                                        className="adm-icon-btn success" 
                                                        onClick={() => handleApproveProduct(cp.id)}
                                                    >
                                                        <CheckCircle2 size={18} />
                                                    </button>
                                                    <button 
                                                        className="adm-icon-btn danger" 
                                                        onClick={() => handleRejectProduct(cp.id)}
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CreateCampaign;
