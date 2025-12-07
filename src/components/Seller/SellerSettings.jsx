import React, { useState, useEffect } from "react";
import { API_BASE } from "../config/config";
import "./SellerProfilePage.css"; // Reusing styles or create new ones if needed
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSave, faUpload, faStore } from "@fortawesome/free-solid-svg-icons";

export default function SellerSettings() {
    const [formData, setFormData] = useState({
        storeName: "",
        description: "",
        about: "",
        address: "",
    });
    const [logoFile, setLogoFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");

    const userId = localStorage.getItem("userId")
        ? window.atob(localStorage.getItem("userId"))
        : null;

    useEffect(() => {
        if (userId) {
            fetchProfile();
        }
    }, [userId]);

    const fetchProfile = async () => {
        try {
            const res = await fetch(`${API_BASE}/api/seller-profiles/${userId}`);
            if (res.ok) {
                const data = await res.json();
                setFormData({
                    storeName: data.storeName || "",
                    description: data.description || "",
                    about: data.about || "",
                    address: data.address || "",
                });
                if (data.logoImagePath) {
                    setPreviewUrl(`${API_BASE}/seller-logos/${data.logoImagePath}`);
                }
            }
        } catch (err) {
            console.error("Failed to fetch profile", err);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
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
        setMessage("");

        try {
            const data = new FormData();
            data.append("storeName", formData.storeName);
            data.append("description", formData.description);
            data.append("about", formData.about);
            data.append("address", formData.address);
            if (logoFile) {
                data.append("logoImage", logoFile);
            }

            const res = await fetch(`${API_BASE}/api/seller-profiles/${userId}`, {
                method: "POST",
                body: data,
            });

            if (res.ok) {
                setMessage("Profile updated successfully!");
                fetchProfile(); // Refresh data
            } else {
                setMessage("Failed to update profile.");
            }
        } catch (err) {
            console.error("Update error:", err);
            setMessage("An error occurred.");
        } finally {
            setLoading(false);
        }
    };

    if (!userId) return <div className="spp-loading">Please log in as a seller.</div>;

    return (
        <div className="spp-wrapper" style={{ padding: "2rem", maxWidth: "800px", margin: "0 auto" }}>
            <h1 className="spp-title" style={{ marginBottom: "2rem" }}>Store Settings</h1>

            <div className="spp-card">
                <form onSubmit={handleSubmit}>
                    {/* Logo Upload */}
                    <div className="form-group" style={{ marginBottom: "1.5rem", textAlign: "center" }}>
                        <div
                            style={{
                                width: "120px",
                                height: "120px",
                                borderRadius: "50%",
                                overflow: "hidden",
                                margin: "0 auto 1rem",
                                border: "2px solid #eee",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                backgroundColor: "#f9f9f9"
                            }}
                        >
                            {previewUrl ? (
                                <img src={previewUrl} alt="Store Logo" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            ) : (
                                <FontAwesomeIcon icon={faStore} size="3x" color="#ccc" />
                            )}
                        </div>
                        <label htmlFor="logo-upload" className="btn-secondary" style={{ cursor: "pointer", padding: "0.5rem 1rem", background: "#f0f0f0", borderRadius: "4px" }}>
                            <FontAwesomeIcon icon={faUpload} /> Change Logo
                        </label>
                        <input
                            id="logo-upload"
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            style={{ display: "none" }}
                        />
                    </div>

                    <div className="form-group" style={{ marginBottom: "1rem" }}>
                        <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600" }}>Store Name</label>
                        <input
                            type="text"
                            name="storeName"
                            value={formData.storeName}
                            onChange={handleChange}
                            className="form-control"
                            style={{ width: "100%", padding: "0.8rem", borderRadius: "4px", border: "1px solid #ddd" }}
                            required
                        />
                    </div>

                    <div className="form-group" style={{ marginBottom: "1rem" }}>
                        <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600" }}>Short Description</label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            className="form-control"
                            style={{ width: "100%", padding: "0.8rem", borderRadius: "4px", border: "1px solid #ddd", minHeight: "80px" }}
                        />
                    </div>

                    <div className="form-group" style={{ marginBottom: "1rem" }}>
                        <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600" }}>About the Seller</label>
                        <textarea
                            name="about"
                            value={formData.about}
                            onChange={handleChange}
                            className="form-control"
                            style={{ width: "100%", padding: "0.8rem", borderRadius: "4px", border: "1px solid #ddd", minHeight: "120px" }}
                        />
                    </div>

                    <div className="form-group" style={{ marginBottom: "1rem" }}>
                        <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600" }}>Business Address</label>
                        <input
                            type="text"
                            name="address"
                            value={formData.address}
                            onChange={handleChange}
                            className="form-control"
                            style={{ width: "100%", padding: "0.8rem", borderRadius: "4px", border: "1px solid #ddd" }}
                        />
                    </div>

                    {message && (
                        <div style={{
                            padding: "1rem",
                            marginBottom: "1rem",
                            borderRadius: "4px",
                            backgroundColor: message.includes("success") ? "#d4edda" : "#f8d7da",
                            color: message.includes("success") ? "#155724" : "#721c24"
                        }}>
                            {message}
                        </div>
                    )}

                    <button
                        type="submit"
                        className="btn-primary"
                        disabled={loading}
                        style={{
                            width: "100%",
                            padding: "1rem",
                            backgroundColor: "#000",
                            color: "#fff",
                            border: "none",
                            borderRadius: "4px",
                            fontSize: "1rem",
                            cursor: loading ? "not-allowed" : "pointer",
                            opacity: loading ? 0.7 : 1
                        }}
                    >
                        {loading ? "Saving..." : <><FontAwesomeIcon icon={faSave} /> Save Changes</>}
                    </button>
                </form>
            </div>
        </div>
    );
}
