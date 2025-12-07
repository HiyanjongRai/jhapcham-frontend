import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { getCurrentUserId } from "../AddCart/cartUtils"; // Fixed import path
import "./SellerAuth.css";
import { API_BASE } from "../config/config";
import { Upload } from "lucide-react";

export default function SellerApplication() {
  const navigate = useNavigate();
  const userId = getCurrentUserId();

  const [form, setForm] = useState({
    storeName: "",
    address: "",
  });

  const [files, setFiles] = useState({
    idDocument: null,
    businessLicense: null,
    taxCertificate: null,
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function handleFileChange(e) {
    setFiles({ ...files, [e.target.name]: e.target.files[0] });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    if (!userId) {
      setMessage({ type: "error", text: "User ID missing. Please login again." });
      setTimeout(() => navigate("/login"), 2000);
      setLoading(false);
      return;
    }

    const data = new FormData();
    data.append("userId", userId);
    data.append("storeName", form.storeName);
    data.append("address", form.address);

    if (files.idDocument) data.append("idDocument", files.idDocument);
    if (files.businessLicense) data.append("businessLicense", files.businessLicense);
    if (files.taxCertificate) data.append("taxCertificate", files.taxCertificate);

    try {
      const res = await axios.post(`${API_BASE}/api/sellers/application`, data, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const userStatus = res.data.userStatus;

      if (userStatus === "PENDING") {
        setMessage({ type: "success", text: "Application submitted! Please wait for admin approval." });
        setTimeout(() => navigate("/login"), 3000);
      } else {
        setMessage({ type: "success", text: "Application submitted successfully." });
      }

    } catch (err) {
      console.error(err);
      setMessage({
        type: "error",
        text: err.response?.data?.message || "Failed to submit application. Please check your inputs."
      });
    } finally {
      setLoading(false);
    }
  }

  // Helper component for file input
  const FileInput = ({ name, label, file }) => (
    <div className="sa-form-group">
      <label className="sa-label">{label}</label>
      <div className="sa-file-input-wrapper" onClick={() => document.getElementById(name).click()}>
        <input
          type="file"
          id={name}
          name={name}
          onChange={handleFileChange}
          style={{ display: "none" }}
        />
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem" }}>
          <Upload size={24} color="#6b7280" />
          <span style={{ color: "#374151", fontSize: "0.9rem" }}>
            {file ? file.name : "Click to upload document"}
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="sa-container">
      <div className="sa-card" style={{ maxWidth: "600px" }}>
        <h1 className="sa-title">Seller Application</h1>
        <p className="sa-subtitle">Complete your profile to start selling</p>

        <form onSubmit={handleSubmit}>

          <div className="sa-section-title">Store Information</div>

          <div className="sa-form-group">
            <label className="sa-label">Store Name</label>
            <input
              className="sa-input"
              type="text"
              name="storeName"
              placeholder="Enter your store name"
              value={form.storeName}
              onChange={handleChange}
              required
            />
          </div>

          <div className="sa-form-group">
            <label className="sa-label">Business Address</label>
            <input
              className="sa-input"
              type="text"
              name="address"
              placeholder="Full business address"
              value={form.address}
              onChange={handleChange}
              required
            />
          </div>

          <div className="sa-section-title" style={{ marginTop: "2rem" }}>Documents</div>
          <p style={{ fontSize: "0.85rem", color: "#666", marginBottom: "1rem" }}>
            Please upload clear copies of the following documents.
          </p>

          <FileInput name="idDocument" label="ID Document (Passport/National ID)" file={files.idDocument} />
          <FileInput name="businessLicense" label="Business License" file={files.businessLicense} />
          <FileInput name="taxCertificate" label="Tax Certificate" file={files.taxCertificate} />

          {message && (
            <div className={`sa-message ${message.type === "error" ? "sa-error" : "sa-success"}`}>
              {message.text}
            </div>
          )}

          <button type="submit" className="sa-btn" disabled={loading}>
            {loading ? "Submitting..." : "Submit Application"}
          </button>
        </form>
      </div>
    </div>
  );
}