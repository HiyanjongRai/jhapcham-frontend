import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function SellerRegister() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await axios.post("http://localhost:8080/api/auth/register/seller", form);

      // Save encoded userId and role in localStorage
      const userId = res.data.userId;
      const role = res.data.role;

      localStorage.setItem("userId", btoa(String(userId)));
      localStorage.setItem("userRole", role);

      alert(res.data.message || "Seller registered successfully!");

      // Redirect to seller application
      navigate("/seller-application");
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="seller-register-container">
      <h1>Seller Registration</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          name="username"
          placeholder="Username"
          value={form.username}
          onChange={handleChange}
          required
        />
        <input
          type="email"
          name="email"
          placeholder="Email"
          value={form.email}
          onChange={handleChange}
          required
        />
        <input
          type="password"
          name="password"
          placeholder="Password"
          value={form.password}
          onChange={handleChange}
          required
        />
        <button type="submit">{loading ? "Registering..." : "Register as Seller"}</button>
      </form>
    </div>
  );
}
