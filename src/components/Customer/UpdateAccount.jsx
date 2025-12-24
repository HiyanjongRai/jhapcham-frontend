import React, { useEffect, useState } from "react";
import { getCurrentUserId } from "../AddCart/cartUtils";
import { API_BASE } from "../config/config";
import "./UpdateAccount.css";
import Toast from "../Toast/Toast";

export default function UpdateAccount() {
  const [profile, setProfile] = useState({
    fullName: "",
    email: "", 
    contactNumber: "",
  });
  

const [toast, setToast] = useState({ show: false, message: "", type: "info" });

const showToast = (message, type) => {
  setToast({ show: true, message, type });
};

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
      const res = await fetch(`${API_BASE}/api/users/${userId}`);
      if (!res.ok) throw new Error("Failed to load profile");
      const data = await res.json();
      setProfile({
        fullName: data.fullName || "",
        email: data.email || "",
        contactNumber: data.contactNumber || "",
      });
      // Set existing image
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
        showToast("New password and confirmation do not match", "error");
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

    // 1. Parse the data ONCE
    const resultData = await res.json();

    // 2. Check if the response was actually successful
    if (!res.ok) {
      showToast(resultData.message || "Failed to update profile", "error");
      setLoading(false);
      return; // Stop here if server said no
    }
    
    // 3. If we are here, it was successful
    let updatedUser = resultData;

    // ... Proceed with image upload logic ...
    if (selectedFile) {
      const formData = new FormData();
      formData.append("file", selectedFile);
      
      const imgRes = await fetch(`${API_BASE}/api/users/${userId}/profile-image`, {
           method: "POST",
           body: formData
      });
      
      if (imgRes.ok) {
           updatedUser = await imgRes.json();
      }
    }

    showToast("Profile updated successfully!", "success");
    
    // Update local profile state with the new data from server
    setProfile({
        fullName: updatedUser.fullName,
        email: updatedUser.email,
        contactNumber: updatedUser.contactNumber
    });

    if (updatedUser.profileImagePath) {
         setPreviewImage(`${API_BASE}/uploads/${updatedUser.profileImagePath}?t=${Date.now()}`);
    }
    
    setSelectedFile(null); 
    setPasswords({ currentPassword: "", newPassword: "", confirmPassword: "" });
    setChangePasswordMode(false);
      
  } catch (err) {
    console.error(err);
    showToast("A network error occurred", "error");
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
        <h2 className="ua-title">Update Profile</h2>
        
        <form className="ua-form" onSubmit={handleSubmit}>
          {/* Profile Image Section */}
          <div className="ua-img-section">
            <img
              src={previewImage || "https://via.placeholder.com/150"}
              alt="Profile"
              className="ua-profile-img"
            />
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

          <label className="ua-label">Full Name</label>
          <input
            className="ua-input"
            type="text"
            value={profile.fullName}
            onChange={(e) =>
              setProfile({ ...profile, fullName: e.target.value })
            }
            required
          />

          <label className="ua-label">Email</label>
          <input
            className="ua-input"
            type="email"
            value={profile.email}
            disabled 
            style={{ backgroundColor: "#f5f5f5", cursor: "not-allowed" }}
          />
          <small style={{ display: 'block', color: '#999', marginBottom: '1rem' }}>
            Email cannot be changed.
          </small>

          <label className="ua-label">Contact Number</label>
          <input
            className="ua-input"
            type="text"
            value={profile.contactNumber}
            onChange={(e) =>
              setProfile({ ...profile, contactNumber: e.target.value })
            }
          />

          {/* Password Change Toggle */}
          <div style={{ marginTop: '20px', marginBottom: '10px' }}>
            <span 
                style={{ color: '#5A67F8', cursor: 'pointer', fontWeight: '500' }}
                onClick={() => setChangePasswordMode(!changePasswordMode)}
            >
                {changePasswordMode ? "Cancel Password Change" : "Change Password?"}
            </span>
          </div>

          {changePasswordMode && (
              <div style={{ background: '#f9f9f9', padding: '15px', borderRadius: '12px', marginBottom: '15px' }}>
                  <label className="ua-label" style={{marginTop: 0}}>Current Password</label>
                  <input
                    className="ua-input"
                    type="password"
                    value={passwords.currentPassword}
                    onChange={(e) => setPasswords({...passwords, currentPassword: e.target.value})}
                  />
                  
                  <label className="ua-label">New Password</label>
                  <input
                    className="ua-input"
                    type="password"
                    value={passwords.newPassword}
                    onChange={(e) => setPasswords({...passwords, newPassword: e.target.value})}
                  />

                  <label className="ua-label">Confirm New Password</label>
                  <input
                    className="ua-input"
                    type="password"
                    value={passwords.confirmPassword}
                    onChange={(e) => setPasswords({...passwords, confirmPassword: e.target.value})}
                  />
              </div>
          )}


          <button className="ua-primary-btn" type="submit" disabled={loading}>
            {loading ? "Updating..." : "Save Changes"}
          </button>
        </form>
      </div>
    </div>
  );
}
