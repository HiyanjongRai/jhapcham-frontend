import React, { useEffect, useState } from "react";
import { getCurrentUserId } from "../AddCart/cartUtils";
import { API_BASE } from "../config/config";
import "./UpdateAccount.css";
import Toast from "../Toast/Toast";

export default function UpdateAccount({ onUpdateSuccess }) {
  const [profile, setProfile] = useState({
    fullName: "",
    email: "", 
    contactNumber: "",
  });
  
  const [toast, setToast] = useState({ show: false, message: "", type: "info" });
  const showToast = (message, type) => setToast({ show: true, message, type });

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

  async function loadProfile() {
    try {
      const res = await fetch(`${API_BASE}/api/users/${userId}`);
      if (!res.ok) throw new Error("Failed to load profile");
      const data = await res.json();
      setProfile({
        fullName: data.fullName || "",
        email: data.email || "",
        contactNumber: data.contactNumber || "",
      });
      if (data.profileImagePath) {
        setPreviewImage(
          data.profileImagePath.startsWith("http") 
            ? data.profileImagePath 
            : `${API_BASE}/uploads/${data.profileImagePath}`
        );
      }
    } catch (err) {
      console.error(err);
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
      const updateBody = {
        fullName: profile.fullName,
        contactNumber: profile.contactNumber,
        email: profile.email
      };

      if (changePasswordMode && passwords.newPassword) {
        if (passwords.newPassword !== passwords.confirmPassword) {
          showToast("Passwords do not match", "error");
          setLoading(false);
          return;
        }
        updateBody.password = passwords.newPassword;
      }

      const res = await fetch(`${API_BASE}/api/users/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateBody),
      });

      const resultData = await res.json();
      if (!res.ok) {
        showToast(resultData.message || "Update failed", "error");
        setLoading(false);
        return;
      }
      
      let updatedUser = resultData;

      if (selectedFile) {
        const formData = new FormData();
        formData.append("file", selectedFile);
        const imgRes = await fetch(`${API_BASE}/api/users/${userId}/profile-image`, {
             method: "POST",
             body: formData
        });
        if (imgRes.ok) updatedUser = await imgRes.json();
      }

      showToast("Profile updated!", "success");
      setProfile({
          fullName: updatedUser.fullName,
          email: updatedUser.email,
          contactNumber: updatedUser.contactNumber
      });

      if (updatedUser.profileImagePath) {
           setPreviewImage(`${API_BASE}/uploads/${updatedUser.profileImagePath}?t=${Date.now()}`);
      }
      
      if (onUpdateSuccess) onUpdateSuccess(updatedUser);

      setSelectedFile(null); 
      setPasswords({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setChangePasswordMode(false);
        
    } catch (err) {
      console.error(err);
      showToast("Network error", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ua-wrapper">
      {toast.show && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast({ ...toast, show: false })} 
        />
      )}
      <div className="ua-card">
        <form className="ua-form" onSubmit={handleSubmit}>
          <div className="ua-img-section">
            <img src={previewImage || "https://via.placeholder.com/150"} alt="" className="ua-profile-img" />
            <label className="ua-upload-btn">
              Change Image
              <input type="file" accept="image/*" onChange={handleFileChange} style={{ display: "none" }} />
            </label>
          </div>

          <div className="ua-field">
            <label className="ua-label">Full Name</label>
            <input className="ua-input" type="text" value={profile.fullName} onChange={(e) => setProfile({ ...profile, fullName: e.target.value })} required />
          </div>

          <div className="ua-field">
            <label className="ua-label">Email Address</label>
            <input className="ua-input" type="email" value={profile.email} disabled />
          </div>

          <div className="ua-field">
            <label className="ua-label">Contact Number</label>
            <input className="ua-input" type="text" value={profile.contactNumber} onChange={(e) => setProfile({ ...profile, contactNumber: e.target.value })} />
          </div>

          <div className="ua-field" style={{ marginTop: '8px' }}>
            <span className="ua-password-toggle" onClick={() => setChangePasswordMode(!changePasswordMode)}>
                {changePasswordMode ? "Cancel Password Change" : "Change Password"}
            </span>
          </div>

          {changePasswordMode && (
              <div className="ua-password-section">
                  <div className="ua-field">
                    <label className="ua-label">Current Password</label>
                    <input className="ua-input" type="password" value={passwords.currentPassword} onChange={(e) => setPasswords({...passwords, currentPassword: e.target.value})} />
                  </div>
                  <div className="ua-field">
                    <label className="ua-label">New Password</label>
                    <input className="ua-input" type="password" value={passwords.newPassword} onChange={(e) => setPasswords({...passwords, newPassword: e.target.value})} />
                  </div>
                  <div className="ua-field">
                    <label className="ua-label">Confirm New Password</label>
                    <input className="ua-input" type="password" value={passwords.confirmPassword} onChange={(e) => setPasswords({...passwords, confirmPassword: e.target.value})} />
                  </div>
              </div>
          )}

          <button className="ua-primary-btn" type="submit" disabled={loading}>
            {loading ? "Saving..." : "Save Profile"}
          </button>
        </form>
      </div>
    </div>
  );
}
