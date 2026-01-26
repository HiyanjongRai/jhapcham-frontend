import React, { useState, useEffect } from "react";
import { API_BASE } from "../config/config";
import "./SellerProfilePage.css"; 
import { 
  Save, 
  Upload, 
  Store, 
  MapPin, 
  Phone, 
  FileText, 
  Info, 
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

    useEffect(() => {
        if (userId) {
            fetchProfile();
        }
    }, [userId]);

    const showToast = (message, type) => {
        setToast({ show: true, message, type });
    };

    const fetchProfile = async () => {
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
    };

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
                setLogoFile(null); // Clear selected file
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
        <div className="spp-settings-container" style={{maxWidth: '1200px', margin: '0 auto'}}>
            {toast.show && (
                <Toast 
                    message={toast.message} 
                    type={toast.type} 
                    onClose={() => setToast({ ...toast, show: false })} 
                />
            )}
            
            <div style={{ maxWidth: "900px", margin: "0 auto" }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2.5rem' }}>
                    <div style={{ background: '#000', color: '#fff', padding: '12px', borderRadius: '16px' }}>
                        <Settings size={28} />
                    </div>
                    <div>
                        <h1 className="spp-title" style={{ margin: 0, fontSize: '2.5rem' }}>Store Settings</h1>
                        <p style={{ color: '#64748b', margin: 0, fontWeight: '600' }}>Manage your brand identity and shipping preferences</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="spp-main-layout" style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '32px' }}>
                    
                    {/* LEFT COLUMN */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        <div className="spp-card">
                            <h3 className="spp-card-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <Store size={20} className="spp-icon-accent" /> Identity & Branding
                            </h3>
                            
                            {/* Logo Upload */}
                            <div style={{ padding: '24px', background: '#f8fafc', borderRadius: '24px', marginBottom: '24px', textAlign: 'center', border: '2px dashed #e2e8f0' }}>
                                <div style={{ 
                                    width: "140px", height: "140px", borderRadius: "32px",
                                    overflow: "hidden", margin: "0 auto 1.5rem", border: "4px solid #fff",
                                    boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)',
                                    display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#fff"
                                }}>
                                    {previewUrl ? (
                                        <img src={previewUrl} alt="Store Logo" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                    ) : (
                                        <ImageIcon size={48} color="#cbd5e1" />
                                    )}
                                </div>
                                
                                <label htmlFor="logo-upload" style={{
                                    cursor: "pointer", padding: "12px 24px", background: "#000", color: '#fff',
                                    borderRadius: "14px", display: 'inline-flex', alignItems: 'center', gap: '10px', fontWeight: '700',
                                    transition: 'all 0.3s'
                                }}
                                className="spp-action-btn"
                                >
                                    <Upload size={18} /> Update Store Logo
                                </label>
                                <input
                                    id="logo-upload"
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                    style={{ display: "none" }}
                                />
                                <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '12px' }}>Recommended: Square PNG/JPG (Min 512x512px)</p>
                            </div>

                            <div className="report-form-group" style={{ marginBottom: "1.5rem" }}>
                                <label className="spp-subtitle">Store Name</label>
                                <input
                                    type="text"
                                    name="storeName"
                                    value={formData.storeName}
                                    onChange={handleChange}
                                    className="report-textarea"
                                    style={{ minHeight: 'auto', padding: '16px' }}
                                    required
                                />
                            </div>

                            <div className="report-form-group" style={{ marginBottom: "1.5rem" }}>
                                <label className="spp-subtitle">Official Contact Number</label>
                                <div style={{ position: 'relative' }}>
                                    <Phone size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                                    <input
                                        type="text"
                                        name="contactNumber"
                                        value={formData.contactNumber}
                                        onChange={handleChange}
                                        className="report-textarea"
                                        style={{ minHeight: 'auto', padding: '16px 16px 16px 48px' }}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="spp-card">
                            <h3 className="spp-card-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <FileText size={20} className="spp-icon-accent" /> Descriptions
                            </h3>
                            
                            <div className="report-form-group" style={{ marginBottom: "1.5rem" }}>
                                <label className="spp-subtitle">Short Tagline/Description</label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleChange}
                                    className="report-textarea"
                                    placeholder="Briefly describe what your store offers..."
                                />
                            </div>

                            <div className="report-form-group">
                                <label className="spp-subtitle">Detailed About Section</label>
                                <textarea
                                    name="about"
                                    value={formData.about}
                                    onChange={handleChange}
                                    className="report-textarea"
                                    style={{ minHeight: '180px' }}
                                    placeholder="Tell customers about your brand journey and values..."
                                />
                            </div>
                        </div>
                    </div>

                    {/* RIGHT COLUMN */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        <div className="spp-card">
                            <h3 className="spp-card-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <Truck size={20} className="spp-icon-accent" /> Shipping Logistics
                            </h3>
                            
                            <div className="report-form-group" style={{ marginBottom: "1.5rem" }}>
                                <label className="spp-subtitle">Business Address</label>
                                <div style={{ position: 'relative' }}>
                                    <MapPin size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                                    <input
                                        type="text"
                                        name="address"
                                        value={formData.address}
                                        onChange={handleChange}
                                        className="report-textarea"
                                        style={{ minHeight: 'auto', padding: '16px 16px 16px 48px' }}
                                    />
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '1.5rem' }}>
                                <div className="report-form-group">
                                    <label className="spp-subtitle">Inside Valley (₹)</label>
                                    <input
                                        type="number"
                                        name="insideValleyDeliveryFee"
                                        value={formData.insideValleyDeliveryFee}
                                        onChange={handleChange}
                                        className="report-textarea"
                                        style={{ minHeight: 'auto', padding: '16px' }}
                                    />
                                </div>
                                <div className="report-form-group">
                                    <label className="spp-subtitle">Outside Valley (₹)</label>
                                    <input
                                        type="number"
                                        name="outsideValleyDeliveryFee"
                                        value={formData.outsideValleyDeliveryFee}
                                        onChange={handleChange}
                                        className="report-textarea"
                                        style={{ minHeight: 'auto', padding: '16px' }}
                                    />
                                </div>
                            </div>

                            <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '20px', border: '1px solid #e2e8f0' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: formData.freeShippingEnabled ? '16px' : '0' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <div style={{ background: '#ecfdf5', color: '#10b981', padding: '8px', borderRadius: '10px' }}>
                                            <CreditCard size={18} />
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: '800', fontSize: '0.9rem' }}>Free Shipping</div>
                                            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Over custom amount</div>
                                        </div>
                                    </div>
                                    <input
                                        type="checkbox"
                                        name="freeShippingEnabled"
                                        checked={formData.freeShippingEnabled}
                                        onChange={handleChange}
                                        style={{ width: '24px', height: '24px', accentColor: '#000', cursor: 'pointer' }}
                                    />
                                </div>
                                
                                {formData.freeShippingEnabled && (
                                    <div className="fade-in">
                                        <label className="spp-subtitle" style={{ fontSize: '0.75rem' }}>Threshold Amount (₹)</label>
                                        <input
                                            type="number"
                                            name="freeShippingMinOrder"
                                            value={formData.freeShippingMinOrder}
                                            onChange={handleChange}
                                            className="report-textarea"
                                            style={{ minHeight: 'auto', padding: '12px', background: '#fff' }}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="spp-card" style={{ background: '#000', border: 'none' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', color: '#fff' }}>
                                <div style={{ background: 'rgba(255,255,255,0.1)', padding: '12px', borderRadius: '14px' }}>
                                    <CheckCircle size={24} color="#10b981" />
                                </div>
                                <div>
                                    <h4 style={{ margin: 0, fontWeight: '800' }}>Save Progress</h4>
                                    <p style={{ margin: 0, fontSize: '0.8rem', opacity: 0.7 }}>Changes go live instantly</p>
                                </div>
                            </div>
                            
                            <button
                                type="submit"
                                disabled={loading}
                                style={{
                                    width: "100%",
                                    marginTop: '24px',
                                    padding: "18px",
                                    backgroundColor: "#fff",
                                    color: "#000",
                                    border: "none",
                                    borderRadius: "16px",
                                    fontSize: "1rem",
                                    fontWeight: '800',
                                    cursor: loading ? "not-allowed" : "pointer",
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '12px',
                                    transition: 'all 0.3s'
                                }}
                            >
                                {loading ? (
                                    "Saving Changes..."
                                ) : (
                                    <>
                                        <Save size={20} /> Update Profile
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
