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
            
            <div style={{ maxWidth: "800px", margin: "0 auto" }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', borderBottom: '1px solid #000', paddingBottom: '0.5rem' }}>
                    <div style={{ background: '#000', color: '#fff', padding: '6px', borderRadius: '4px' }}>
                        <Settings size={14} />
                    </div>
                    <div>
                        <h1 className="spp-title" style={{ margin: 0, fontSize: '1.1rem', textTransform: 'uppercase' }}>Store Settings</h1>
                        <p style={{ color: '#666', margin: 0, fontWeight: '700', fontSize: '0.65rem', textTransform: 'uppercase' }}>Manage brand & logistics</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="spp-main-layout" style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1rem' }}>
                    
                    {/* LEFT COLUMN */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div className="spp-card" style={{ padding: '0.75rem' }}>
                            <h3 className="spp-card-title" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', fontWeight: '900', textTransform: 'uppercase', marginBottom: '1rem' }}>
                                <Store size={14} className="spp-icon-accent" /> Identity
                            </h3>
                            
                            {/* Logo Upload */}
                            <div style={{ padding: '1rem', background: '#fafafa', borderRadius: '4px', marginBottom: '1rem', textAlign: 'center', border: '1px solid #eee' }}>
                                <div style={{ 
                                    width: "60px", height: "60px", borderRadius: "2px",
                                    overflow: "hidden", margin: "0 auto 0.75rem", border: "1px solid #000",
                                    display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#fff"
                                }}>
                                    {previewUrl ? (
                                        <img src={previewUrl} alt="Store Logo" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                    ) : (
                                        <ImageIcon size={20} color="#ccc" />
                                    )}
                                </div>
                                
                                <label htmlFor="logo-upload" style={{
                                    cursor: "pointer", padding: "6px 12px", background: "#000", color: '#fff',
                                    borderRadius: "2px", display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: '800',
                                    fontSize: '0.65rem', textTransform: 'uppercase'
                                }}>
                                    <Upload size={12} /> Upload Logo
                                </label>
                                <input
                                    id="logo-upload"
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                    style={{ display: "none" }}
                                />
                            </div>

                            <div className="report-form-group" style={{ marginBottom: "0.75rem" }}>
                                <label className="spp-subtitle" style={{ fontSize: '0.55rem', fontWeight: '900' }}>Store Name</label>
                                <input
                                    type="text"
                                    name="storeName"
                                    value={formData.storeName}
                                    onChange={handleChange}
                                    className="report-textarea"
                                    style={{ minHeight: 'auto', padding: '8px', fontSize: '0.75rem', borderRadius: '2px', border: '1px solid #000' }}
                                    required
                                />
                            </div>

                            <div className="report-form-group" style={{ marginBottom: "0.75rem" }}>
                                <label className="spp-subtitle" style={{ fontSize: '0.55rem', fontWeight: '900' }}>Contact Number</label>
                                <div style={{ position: 'relative' }}>
                                    <Phone size={12} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#999' }} />
                                    <input
                                        type="text"
                                        name="contactNumber"
                                        value={formData.contactNumber}
                                        onChange={handleChange}
                                        className="report-textarea"
                                        style={{ minHeight: 'auto', padding: '8px 8px 8px 32px', fontSize: '0.75rem', borderRadius: '2px', border: '1px solid #000' }}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="spp-card" style={{ padding: '0.75rem' }}>
                            <h3 className="spp-card-title" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', fontWeight: '900', textTransform: 'uppercase', marginBottom: '1rem' }}>
                                <FileText size={14} className="spp-icon-accent" /> Descriptions
                            </h3>
                            
                            <div className="report-form-group" style={{ marginBottom: "0.75rem" }}>
                                <label className="spp-subtitle" style={{ fontSize: '0.55rem', fontWeight: '900' }}>Short Tagline</label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleChange}
                                    className="report-textarea"
                                    style={{ padding: '8px', fontSize: '0.75rem', minHeight: '60px', borderRadius: '2px', border: '1px solid #000' }}
                                    placeholder="Brief tagline..."
                                />
                            </div>

                            <div className="report-form-group">
                                <label className="spp-subtitle" style={{ fontSize: '0.55rem', fontWeight: '900' }}>Detailed About</label>
                                <textarea
                                    name="about"
                                    value={formData.about}
                                    onChange={handleChange}
                                    className="report-textarea"
                                    style={{ minHeight: '100px', padding: '8px', fontSize: '0.75rem', borderRadius: '2px', border: '1px solid #000' }}
                                    placeholder="Story and values..."
                                />
                            </div>
                        </div>
                    </div>

                    {/* RIGHT COLUMN */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div className="spp-card" style={{ padding: '0.75rem' }}>
                            <h3 className="spp-card-title" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', fontWeight: '900', textTransform: 'uppercase', marginBottom: '1rem' }}>
                                <Truck size={14} className="spp-icon-accent" /> Logistics
                            </h3>
                            
                            <div className="report-form-group" style={{ marginBottom: "0.75rem" }}>
                                <label className="spp-subtitle" style={{ fontSize: '0.55rem', fontWeight: '900' }}>Address</label>
                                <div style={{ position: 'relative' }}>
                                    <MapPin size={12} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#999' }} />
                                    <input
                                        type="text"
                                        name="address"
                                        value={formData.address}
                                        onChange={handleChange}
                                        className="report-textarea"
                                        style={{ minHeight: 'auto', padding: '8px 8px 8px 32px', fontSize: '0.75rem', borderRadius: '2px', border: '1px solid #000' }}
                                    />
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '0.75rem' }}>
                                <div className="report-form-group">
                                    <label className="spp-subtitle" style={{ fontSize: '0.55rem', fontWeight: '900' }}>Inside (₹)</label>
                                    <input
                                        type="number"
                                        name="insideValleyDeliveryFee"
                                        value={formData.insideValleyDeliveryFee}
                                        onChange={handleChange}
                                        className="report-textarea"
                                        style={{ minHeight: 'auto', padding: '8px', fontSize: '0.75rem', borderRadius: '2px', border: '1px solid #000' }}
                                    />
                                </div>
                                <div className="report-form-group">
                                    <label className="spp-subtitle" style={{ fontSize: '0.55rem', fontWeight: '900' }}>Outside (₹)</label>
                                    <input
                                        type="number"
                                        name="outsideValleyDeliveryFee"
                                        value={formData.outsideValleyDeliveryFee}
                                        onChange={handleChange}
                                        className="report-textarea"
                                        style={{ minHeight: 'auto', padding: '8px', fontSize: '0.75rem', borderRadius: '2px', border: '1px solid #000' }}
                                    />
                                </div>
                            </div>

                            <div style={{ background: '#fafafa', padding: '10px', borderRadius: '4px', border: '1px solid #eee' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: formData.freeShippingEnabled ? '8px' : '0' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <div style={{ background: '#000', color: '#fff', padding: '4px', borderRadius: '2px' }}>
                                            <CreditCard size={12} />
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: '900', fontSize: '0.7rem', textTransform: 'uppercase' }}>Free Ship</div>
                                        </div>
                                    </div>
                                    <input
                                        type="checkbox"
                                        name="freeShippingEnabled"
                                        checked={formData.freeShippingEnabled}
                                        onChange={handleChange}
                                        style={{ width: '16px', height: '16px', accentColor: '#000', cursor: 'pointer' }}
                                    />
                                </div>
                                
                                {formData.freeShippingEnabled && (
                                    <div className="fade-in">
                                        <label className="spp-subtitle" style={{ fontSize: '0.55rem', fontWeight: '900' }}>Min Order (₹)</label>
                                        <input
                                            type="number"
                                            name="freeShippingMinOrder"
                                            value={formData.freeShippingMinOrder}
                                            onChange={handleChange}
                                            className="report-textarea"
                                            style={{ minHeight: 'auto', padding: '6px', background: '#fff', fontSize: '0.75rem', borderRadius: '2px', border: '1px solid #000' }}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="spp-card" style={{ background: '#000', border: 'none', padding: '0.75rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#fff' }}>
                                <div style={{ background: 'rgba(255,255,255,0.1)', padding: '6px', borderRadius: '4px' }}>
                                    <CheckCircle size={14} />
                                </div>
                                <div>
                                    <h4 style={{ margin: 0, fontWeight: '900', fontSize: '0.75rem', textTransform: 'uppercase' }}>Commit</h4>
                                    <p style={{ margin: 0, fontSize: '0.55rem', opacity: 0.7, textTransform: 'uppercase' }}>Update live profile</p>
                                </div>
                            </div>
                            
                            <button
                                type="submit"
                                disabled={loading}
                                style={{
                                    width: "100%",
                                    marginTop: '0.75rem',
                                    padding: "10px",
                                    backgroundColor: "#fff",
                                    color: "#000",
                                    border: "none",
                                    borderRadius: "2px",
                                    fontSize: "0.75rem",
                                    fontWeight: '900',
                                    cursor: loading ? "not-allowed" : "pointer",
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '6px',
                                    textTransform: 'uppercase'
                                }}
                            >
                                {loading ? (
                                    "Saving..."
                                ) : (
                                    <>
                                        <Save size={14} /> Update Settings
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
