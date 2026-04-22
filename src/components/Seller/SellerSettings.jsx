import React, { useState, useEffect, useCallback } from "react";
import { API_BASE } from "../config/config";
import "./SellerProfilePage.css"; 
import { 
  Save, 
  Upload, 
  Store, 
  MapPin, 
  Phone, 
  FileText, 
  Truck, 
  CreditCard,
  Image as ImageIcon,
  CheckCircle,
  Settings
} from "lucide-react";
import Toast from "../Toast/Toast";
import api from "../../api/axios";

export default function SellerSettings() {
    const [formData, setFormData] = useState({
        storeName: "",
        description: "",
        about: "",
        address: "",
        contactNumber: "",
        insideValleyDeliveryFee: "",
        outsideValleyDeliveryFee: "",
        freeShippingEnabled: false,
        freeShippingMinOrder: ""
    });
    const [logoFile, setLogoFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState({ show: false, message: "", type: "info" });

    const userId = localStorage.getItem("userId")
        ? window.atob(localStorage.getItem("userId"))
        : null;

    const showToast = (message, type) => {
        setToast({ show: true, message, type });
    };

    const fetchProfile = useCallback(async () => {
        try {
            const res = await api.get(`/api/seller/${userId}`);
            const data = res.data;
            
            setFormData({
                storeName: data.storeName || "",
                description: data.description || "",
                about: data.about || "",
                address: data.address || "",
                contactNumber: data.contactNumber || "",
                insideValleyDeliveryFee: data.insideValleyDeliveryFee || "",
                outsideValleyDeliveryFee: data.outsideValleyDeliveryFee || "",
                freeShippingEnabled: data.freeShippingEnabled || false,
                freeShippingMinOrder: data.freeShippingMinOrder || ""
            });
            if (data.logoImagePath) {
                setPreviewUrl(buildImageUrl(data.logoImagePath));
            }
        } catch (err) {
            console.error("Failed to fetch profile", err);
            showToast("Failed to load settings.", "error");
        }
    }, [userId]);

    useEffect(() => {
        if (userId) {
            fetchProfile();
        }
    }, [userId, fetchProfile]);

    const buildImageUrl = (path) => {
        if (!path) return null;
        if (path.startsWith('http') || path.startsWith('blob:')) return path;
        const base = API_BASE.endsWith('/') ? API_BASE.slice(0, -1) : API_BASE;
        const cleanPath = path.startsWith('/') ? path : `/${path}`;
        return `${base}${cleanPath}`;
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value
        }));
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setLogoFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const data = new FormData();
            data.append("storeName", formData.storeName);
            data.append("description", formData.description);
            data.append("about", formData.about);
            data.append("address", formData.address);
            data.append("contactNumber", formData.contactNumber);
            data.append("insideValleyDeliveryFee", formData.insideValleyDeliveryFee || 0);
            data.append("outsideValleyDeliveryFee", formData.outsideValleyDeliveryFee || 0);
            data.append("freeShippingEnabled", formData.freeShippingEnabled);
            data.append("freeShippingMinOrder", formData.freeShippingMinOrder || 0);

            if (logoFile) {
                data.append("logoImage", logoFile);
            }

            const res = await api.put(`/api/seller/${userId}`, data, {
                headers: { "Content-Type": "multipart/form-data" }
            });

            if (res.status === 200) {
                showToast("Settings updated successfully!", "success");
                setLogoFile(null);
                window.dispatchEvent(new Event('profile-updated'));
                fetchProfile(); 
            }
        } catch (err) {
            console.error("Update error:", err);
            showToast("Failed to update settings.", "error");
        } finally {
            setLoading(false);
        }
    };

    if (!userId) return <div className="spp-loading">Please log in as a seller.</div>;

    return (
        <div className="spp-wrapper" style={{ width: '100%', margin: '0', boxSizing: 'border-box', backgroundColor: 'transparent' }}>
            {toast.show && (
                <Toast 
                    message={toast.message} 
                    type={toast.type} 
                    onClose={() => setToast({ ...toast, show: false })} 
                />
            )}
            
            <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
                
                <div className="spp-page-header">
                    <div className="spp-page-header-icon">
                        <Settings size={16} />
                    </div>
                    <div>
                        <h1 className="spp-title">Store Settings</h1>
                        <p className="spp-subtitle" style={{ marginBottom: 0 }}>Manage brand &amp; logistics</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '16px' }}>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

                        <div className="spp-card">
                            <h3 className="spp-card-title">
                                <Store size={15} className="spp-icon-accent" />
                                Identity
                            </h3>

                            <div className="spp-logo-upload-area">
                                <div className="spp-logo-preview">
                                    {previewUrl ? (
                                        <img src={previewUrl} alt="Store Logo" />
                                    ) : (
                                        <ImageIcon size={22} color="#ccc" />
                                    )}
                                </div>
                                <label htmlFor="logo-upload" className="spp-upload-btn">
                                    <Upload size={13} /> Upload Logo
                                </label>
                                <input
                                    id="logo-upload"
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                    style={{ display: "none" }}
                                />
                            </div>

                            <div className="spp-form-group">
                                <label className="spp-subtitle">Store Name</label>
                                <input
                                    type="text"
                                    name="storeName"
                                    value={formData.storeName}
                                    onChange={handleChange}
                                    className="spp-input"
                                    placeholder="Your store name..."
                                    required
                                />
                            </div>

                            <div className="spp-form-group">
                                <label className="spp-subtitle">Contact Number</label>
                                <div className="spp-input-icon-wrap">
                                    <Phone size={13} className="spp-input-icon" />
                                    <input
                                        type="text"
                                        name="contactNumber"
                                        value={formData.contactNumber}
                                        onChange={handleChange}
                                        className="spp-input"
                                        placeholder="9800000000"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="spp-card">
                            <h3 className="spp-card-title">
                                <FileText size={15} className="spp-icon-accent" />
                                Descriptions
                            </h3>
                            
                            <div className="spp-form-group">
                                <label className="spp-subtitle">Short Tagline</label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleChange}
                                    className="spp-textarea"
                                    style={{ minHeight: '65px' }}
                                    placeholder="Brief tagline for your store..."
                                />
                            </div>

                            <div className="spp-form-group">
                                <label className="spp-subtitle">Detailed About</label>
                                <textarea
                                    name="about"
                                    value={formData.about}
                                    onChange={handleChange}
                                    className="spp-textarea"
                                    style={{ minHeight: '100px' }}
                                    placeholder="Story and values..."
                                />
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

                        <div className="spp-card">
                            <h3 className="spp-card-title">
                                <Truck size={15} className="spp-icon-accent" />
                                Logistics
                            </h3>
                            
                            <div className="spp-form-group">
                                <label className="spp-subtitle">Address</label>
                                <div className="spp-input-icon-wrap">
                                    <MapPin size={13} className="spp-input-icon" />
                                    <input
                                        type="text"
                                        name="address"
                                        value={formData.address}
                                        onChange={handleChange}
                                        className="spp-input"
                                        placeholder="Kathmandu"
                                    />
                                </div>
                            </div>

                            <div className="spp-fee-grid">
                                <div className="spp-form-group" style={{ marginBottom: 0 }}>
                                    <label className="spp-subtitle">Inside (₹)</label>
                                    <input
                                        type="number"
                                        name="insideValleyDeliveryFee"
                                        value={formData.insideValleyDeliveryFee}
                                        onChange={handleChange}
                                        className="spp-input"
                                        placeholder="0"
                                    />
                                </div>
                                <div className="spp-form-group" style={{ marginBottom: 0 }}>
                                    <label className="spp-subtitle">Outside (₹)</label>
                                    <input
                                        type="number"
                                        name="outsideValleyDeliveryFee"
                                        value={formData.outsideValleyDeliveryFee}
                                        onChange={handleChange}
                                        className="spp-input"
                                        placeholder="0"
                                    />
                                </div>
                            </div>

                            <div className="spp-freeship-box">
                                <div className="spp-freeship-row">
                                    <div className="spp-freeship-label">
                                        <div className="spp-freeship-icon-box">
                                            <CreditCard size={13} />
                                        </div>
                                        <span className="spp-freeship-text">Free Ship</span>
                                    </div>
                                    <input
                                        type="checkbox"
                                        name="freeShippingEnabled"
                                        checked={formData.freeShippingEnabled}
                                        onChange={handleChange}
                                        className="spp-checkbox"
                                    />
                                </div>
                                
                                {formData.freeShippingEnabled && (
                                    <div className="fade-in" style={{ marginTop: '10px' }}>
                                        <label className="spp-subtitle">Min Order (₹)</label>
                                        <input
                                            type="number"
                                            name="freeShippingMinOrder"
                                            value={formData.freeShippingMinOrder}
                                            onChange={handleChange}
                                            className="spp-input"
                                            placeholder="0"
                                        />
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="spp-commit-card">
                            <div className="spp-commit-header">
                                <div className="spp-commit-icon">
                                    <CheckCircle size={16} />
                                </div>
                                <div>
                                    <h4 className="spp-commit-title">Commit</h4>
                                    <p className="spp-commit-sub">Update live profile</p>
                                </div>
                            </div>
                            
                            <button
                                type="submit"
                                disabled={loading}
                                className="spp-save-btn"
                            >
                                {loading ? (
                                    "Saving..."
                                ) : (
                                    <>
                                        <Save size={15} /> Update Settings
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}
