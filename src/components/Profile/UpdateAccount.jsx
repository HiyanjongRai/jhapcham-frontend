import React, { useEffect, useState } from "react";
import { getCurrentUserId } from "../../utils/authUtils"; // Corrected path
import { API_BASE } from "../config/config";
import api from "../../api/axios";
import "./UpdateAccount.css";

export default function UpdateAccount({ onUpdateSuccess }) {
  const [profile, setProfile] = useState({
    fullName: "",
    email: "",
    contactNumber: "",
    username: "",
    role: ""
  });
  
  const [passwords, setPasswords] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  const [selectedFile, setSelectedFile] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [changePasswordMode, setChangePasswordMode] = useState(false);

  const userId = getCurrentUserId();

  // Load user profile
  async function loadProfile() {
    try {
      const res = await api.get(`/api/users/${userId}`);
      const data = res.data;
      setProfile({
        fullName: data.fullName || "",
        email: data.email || "",
        contactNumber: data.contactNumber || "",
        username: data.username || "",
        role: data.role || ""
      });
      
      if (data.profileImagePath) {
        setPreviewImage(`${API_BASE}/api/users/${userId}/profile-image`);
      }
    } catch (err) {
      console.error("Failed to load profile:", err);
    }
  }

  useEffect(() => {
    if (userId) loadProfile();
  }, [userId]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreviewImage(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("fullName", profile.fullName);
      formData.append("contactNumber", profile.contactNumber);

      if (changePasswordMode && passwords.newPassword) {
        if (passwords.newPassword !== passwords.confirmPassword) {
          throw new Error("New passwords do not match!");
        }
        formData.append("currentPassword", passwords.currentPassword);
        formData.append("newPassword", passwords.newPassword);
        formData.append("confirmPassword", passwords.confirmPassword);
      }

      if (selectedFile) {
        formData.append("profileImage", selectedFile);
      }

      // Universal endpoint for self-profile update
      const res = await api.put(`/api/auth/profile/${userId}`, formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      alert("Profile updated successfully!");
      
      const updatedUser = res.data;
      setProfile(prev => ({
        ...prev,
        fullName: updatedUser.fullName,
        contactNumber: updatedUser.contactNumber
      }));

      if (updatedUser.profileImagePath) {
        setPreviewImage(`${API_BASE}/api/users/${userId}/profile-image?t=${Date.now()}`);
      }
      
      setSelectedFile(null);
      setPasswords({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setChangePasswordMode(false);
      
      if (onUpdateSuccess) onUpdateSuccess(updatedUser);
        
    } catch (err) {
      console.error("Update error:", err);
      alert(err.response?.data?.message || err.message || "Error updating profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ua-card">
      <div className="ua-header">
        <h2 className="ua-title">Account Settings</h2>
        <p className="ua-subtitle">Update your personal information and profile picture.</p>
      </div>
      
      <form className="ua-form" onSubmit={handleSubmit}>
        {/* Profile Image Section */}
        <div className="ua-img-section">
          <div className="ua-profile-img-container">
            <img
              src={previewImage || "https://via.placeholder.com/150"}
              alt="Profile"
              className="ua-profile-img"
            />
          </div>
          <label className="ua-upload-btn">
            Change Photo
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              style={{ display: "none" }}
            />
          </label>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
          <div>
            <label className="ua-label">Full Name</label>
            <input
              className="ua-input"
              type="text"
              value={profile.fullName}
              onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="ua-label">Username</label>
            <input
              className="ua-input"
              type="text"
              value={profile.username}
              disabled
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
          <div>
            <label className="ua-label">Email Address</label>
            <input
              className="ua-input"
              type="email"
              value={profile.email}
              disabled
            />
          </div>
          <div>
            <label className="ua-label">Phone Number</label>
            <input
              className="ua-input"
              type="text"
              value={profile.contactNumber}
              onChange={(e) => setProfile({ ...profile, contactNumber: e.target.value })}
            />
          </div>
        </div>

        <div className="ua-password-toggle" onClick={() => setChangePasswordMode(!changePasswordMode)}>
          {changePasswordMode ? "Cancel Password Change" : "Change Account Password?"}
        </div>

        {changePasswordMode && (
          <div className="ua-password-section">
            <label className="ua-label" style={{ marginTop: 0 }}>Current Password</label>
            <input
              className="ua-input"
              type="password"
              placeholder="Required to set new password"
              value={passwords.currentPassword}
              onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })}
              required={changePasswordMode}
            />
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div>
                <label className="ua-label">New Password</label>
                <input
                  className="ua-input"
                  type="password"
                  value={passwords.newPassword}
                  onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                  required={changePasswordMode}
                />
              </div>
              <div>
                <label className="ua-label">Confirm New Password</label>
                <input
                  className="ua-input"
                  type="password"
                  value={passwords.confirmPassword}
                  onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
                  required={changePasswordMode}
                />
              </div>
            </div>
          </div>
        )}

        <button className="ua-primary-btn" type="submit" disabled={loading}>
          {loading ? "Saving Changes..." : "Save Changes"}
        </button>
      </form>
    </div>
  );
}
