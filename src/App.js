import React from "react";
import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar/Navbar";
import CartPage from "./components/AddCart/CartPage";
import LoginPage from "./components/Login/LoginPage";
import SignupPage from "./components/Register/SignupPage";
import ProductGrid from "./components/ProductGrind/ProductGrind";
import CustomerDashboard from "./components/Customer/CustomerDashboard";
import SellerDashboard from "./components/Seller/SellerDashboard";
import ProductDetailPage from "./components/productCard/ProductDetailPage";
import SellerRegister from "./components/Seller/SellerRegister";
import SellerApplication from "./components/Seller/SellerApplication";
import AdminDashboard from "./components/Admin/AdminDashboard";
import CheckoutPage from "./components/Checkout/CheckoutPage";
import OrderSuccess from "./components/Oder/OrderSuccess.jsx";
import SellerOrders from "./components/Seller/SellerOrders";
import NotificationList from "./components/NotificationPage/NotificationList";
import ReviewForm from "./components/Review/ReviewForm.jsx";  


function App() {
  return (
    <>
      <Navbar />

      <Routes>
        <Route path="/" element={<ProductGrid />} />

        {/* Auth */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />

        {/* Cart */}
        <Route path="/cart" element={<CartPage />} />

        {/* Customer */}
        <Route path="/customer/dashboard" element={<CustomerDashboard />} />

        {/* Seller */}
        <Route path="/seller/orders" element={<SellerOrders />} />

        <Route path="/seller/dashboard" element={<SellerDashboard />} />
        <Route path="/seller/register" element={<SellerRegister />} />
        <Route path="/seller-application" element={<SellerApplication />} />

        {/* Products */}
        <Route path="/products/:id" element={<ProductDetailPage />} />

<Route path="/checkout" element={<CheckoutPage />} />
<Route path="/order-success" element={<OrderSuccess />} />

        {/* Admin  */}
                <Route path="/admin/dashboard" element={<AdminDashboard />} />


<Route path="/notification-list" element={<NotificationList />} />
<Route path="/review" element={<ReviewForm />} />

      </Routes>
    </>
  );
}

export default App;
