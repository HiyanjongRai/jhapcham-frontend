import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { getCurrentUserId } from "../../utils/authUtils";

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

function handleChange(e) {
setForm({ ...form, [e.target.name]: e.target.value });
}

function handleFileChange(e) {
setFiles({ ...files, [e.target.name]: e.target.files[0] });
}

async function handleSubmit(e) {
e.preventDefault();

if (!userId) {
  alert("User ID missing. Login again");
  navigate("/seller-register");
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
const res = await axios.post("http://localhost:8080/api/sellers/application", data, {
headers: { "Content-Type": "multipart/form-data" },
});

const userStatus = res.data.userStatus;

alert("Application submitted successfully");

if (userStatus === "PENDING") {
navigate("/login");
} else {
alert("Your application is pending. Admin must approve it");
}

} catch (err) {
console.error(err);
alert(err.response?.data?.message || "Failed to submit application");
}

}

return (
<div className="seller-application-container">
<h1>Seller Application Form</h1>
<form onSubmit={handleSubmit}>
<input type="text" name="storeName" placeholder="Store Name" value={form.storeName} onChange={handleChange} required />

    <input
      type="text"
      name="address"
      placeholder="Address"
      value={form.address}
      onChange={handleChange}
      required
    />

    <label>ID Document</label>
    <input type="file" name="idDocument" onChange={handleFileChange} />

    <label>Business License</label>
    <input type="file" name="businessLicense" onChange={handleFileChange} />

    <label>Tax Certificate</label>
    <input type="file" name="taxCertificate" onChange={handleFileChange} />

    <button type="submit">Submit Application</button>
  </form>
</div>


);
}