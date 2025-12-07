import React, { useEffect, useState } from "react";
import { getCurrentUserId } from "../AddCart/cartUtils";
import "./UpdateAccount.css";


const API_BASE = "http://localhost:8080";

export default function UpdateAccount() {
  const [profile, setProfile] = useState({
    fullName: "",
    email: "",
    contactNumber: "",
    profileImageUrl: "",
  });

  const [selectedFile, setSelectedFile] = useState(null);
  const userId = getCurrentUserId();

  // Load user profile
  async function loadProfile() {
    try {
      const res = await fetch(`${API_BASE}/users/profile/${userId}`);
      if (!res.ok) throw new Error("Failed to load profile");
      const data = await res.json();
      setProfile({
        fullName: data.fullName || "",
        email: data.email || "",
        contactNumber: data.contactNumber || "",
        profileImageUrl: data.profileImagePath
          ? `${API_BASE}/uploads/customer-profile/${data.profileImagePath}`
          : "",
      });
    } catch (err) {
      console.error(err);
      alert("Error loading profile");
    }
  }

  useEffect(() => {
    loadProfile();
  }, []);

  // Update text fields
  async function handleUpdate(e) {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/users/profile/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: profile.fullName,
          email: profile.email,
          contactNumber: profile.contactNumber,
        }),
      });

      if (res.ok) {
        alert("Profile updated successfully!");
      } else {
        alert("Failed to update profile");
      }
    } catch (err) {
      console.error(err);
      alert("Error updating profile");
    }
  }

  // Upload profile image
  async function handleFileUpload(e) {
    e.preventDefault();
    if (!selectedFile) {
      alert("Please select an image first!");
      return;
    }

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const res = await fetch(
        `${API_BASE}/users/profile/${userId}/profile-image`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (res.ok) {
        const data = await res.json();
        setProfile((prev) => ({
          ...prev,
          profileImageUrl: `${API_BASE}/uploads/customer-profile/${data.profileImagePath}`,
        }));
        alert("Profile image updated successfully!");
        setSelectedFile(null);
      } else {
        alert("Failed to upload profile image");
      }
    } catch (err) {
      console.error(err);
      alert("Error uploading profile image");
    }
  }

  return (
    <div className="ua-wrapper">
      <div className="ua-card">
        {/* Profile Image */}
        <div className="ua-img-section">
          <img
            src={profile.profileImageUrl || "/default-avatar.png"}
            alt="Profile"
            className="ua-profile-img"
          />
          <label className="ua-upload-btn">
            Upload New Image
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setSelectedFile(e.target.files[0])}
              style={{ display: "none" }}
            />
          </label>
        </div>

        {/* Update Text Info */}
        <form className="ua-form" onSubmit={handleUpdate}>
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
            onChange={(e) =>
              setProfile({ ...profile, email: e.target.value })
            }
            required
          />

          <label className="ua-label">Contact Number</label>
          <input
            className="ua-input"
            type="text"
            value={profile.contactNumber}
            onChange={(e) =>
              setProfile({ ...profile, contactNumber: e.target.value })
            }
          />

          <button className="ua-primary-btn" type="submit">
            Update Profile
          </button>
        </form>

        {/* Update Profile Image */}
        <form onSubmit={handleFileUpload}>
          <button className="ua-secondary-btn" type="submit">
            Update Profile Image
          </button>
        </form>
      </div>
    </div>
  );
}
