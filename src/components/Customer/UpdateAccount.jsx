import React, { useEffect, useState } from "react";
import { getCurrentUserId } from "../AddCart/cartUtils";
import { API_BASE } from "../config/config";
import "./UpdateAccount.css";

export default function UpdateAccount() {
  const [profile, setProfile] = useState({
    fullName: "",
    email: "", // Read-only
    contactNumber: "",
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
      // Assuming GET /api/users/{userId} or similar exists to fetch data. 
      // If not, we might need to rely on what was previously working or use the new controller if it had a GET.
      // The user only provided PUT for CustomerController. 
      // Let's stick to the existing fetch endpoint for reading, assuming it still works.
      const res = await fetch(`${API_BASE}/users/profile/${userId}`);
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
            : `${API_BASE}/uploads/customer-profile/${data.profileImagePath}`
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
      const formData = new FormData();
      formData.append("fullName", profile.fullName);
      formData.append("contactNumber", profile.contactNumber);
      
      if (selectedFile) {
        formData.append("profileImage", selectedFile);
      }

      if (changePasswordMode && passwords.newPassword) {
        formData.append("currentPassword", passwords.currentPassword);
        formData.append("newPassword", passwords.newPassword);
        formData.append("confirmPassword", passwords.confirmPassword);
      }

      // Updated endpoint: PUT /api/customers/{userId}
      const res = await fetch(`${API_BASE}/api/customers/${userId}`, {
        method: "PUT",
        body: formData,
      });

      if (res.ok) {
        const updatedUser = await res.json();
        alert("Profile updated successfully!");
        // Update local state with response
        setProfile(prev => ({
            ...prev,
            fullName: updatedUser.fullName,
            contactNumber: updatedUser.contactNumber
        }));
        if (updatedUser.profileImagePath) {
             setPreviewImage(`${API_BASE}/uploads/customer-profile/${updatedUser.profileImagePath}`);
        }
        setSelectedFile(null); // Clear file selection
        
        // Reset password fields
        setPasswords({ currentPassword: "", newPassword: "", confirmPassword: "" });
        setChangePasswordMode(false);
        
      } else {
        const errorData = await res.json();
        alert(errorData.message || "Failed to update profile");
      }
    } catch (err) {
      console.error(err);
      alert("Error updating profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ua-wrapper">
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
