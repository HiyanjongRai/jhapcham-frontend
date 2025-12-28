import React from "react";
import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar/Navbar";
import Home from "./components/Home/Home";
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
import OrderSuccess from "./components/Order/OrderSuccess.jsx";
import SellerOrders from "./components/Seller/SellerOrders";
import NotificationList from "./components/NotificationPage/NotificationList";
import ReviewForm from "./components/Review/ReviewForm.jsx";
import WishlistPage from "./components/WishlistPage/WishlistPage.jsx";
import AddProduct from "./components/Seller/AddProductPage.jsx";
import UpdateAccount from "./components/Profile/UpdateAccount.jsx";
import ProductManagement from "./components/Seller/ProductManagement.jsx";
import MessagesPage from "./components/Message/MessagesPage.jsx";
import OnSalePage from "./components/Collections/OnSalePage.jsx";
import NewArrivalsPage from "./components/Collections/NewArrivalsPage.jsx";
import BrandsPage from "./components/Collections/BrandsPage.jsx";

import SellerProfilePage from "./components/Seller/SellerProfilePage.jsx";
import SellerLayout from "./components/Seller/SellerLayout";

// Error Pages
import { 
  NotFoundPage, 
  ForbiddenPage, 
  ServerErrorPage, 
  NetworkErrorPage,
  BackendDownPage,
  AllErrorsPage
} from "./components/ErrorPage/ErrorPage.jsx";

// Error Boundary
import ErrorBoundary from "./components/ErrorBoundary/ErrorBoundary.jsx";

function App() {

  return (
    <ErrorBoundary>
      <Navbar />

      <Routes>

        {/* Home */}
        <Route path="/" element={<Home />} />
        
        {/* All Products */}
        <Route path="/products" element={<ProductGrid />} />

        {/* Auth */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />

        {/* Cart */}
        <Route path="/cart" element={<CartPage />} />

        {/* Customer */}
        <Route path="/customer/dashboard" element={<CustomerDashboard />} />

        {/* Seller Area (Grouped under Layout) */}
        <Route path="/seller" element={<SellerLayout />}>
          <Route path="dashboard" element={<SellerDashboard />} />
          <Route path="orders" element={<SellerOrders />} />
          <Route path="add-product" element={<AddProduct />} />
          <Route path="products" element={<ProductManagement />} />
          <Route path="settings" element={<UpdateAccount />} />
        </Route>

        <Route path="/seller/register" element={<SellerRegister />} />
        <Route path="/seller-application" element={<SellerApplication />} />
        <Route path="/seller/:id" element={<SellerProfilePage />} />

        {/* Product Details */}
        <Route path="/products/:id" element={<ProductDetailPage />} />

        {/* Checkout */}
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/order-success" element={<OrderSuccess />} />

        {/* Admin */}
        <Route path="/admin/dashboard" element={<AdminDashboard />} />

        {/* Account */}
        <Route path="/update-account" element={<UpdateAccount />} />

        {/* Notifications */}
        <Route path="/notifications" element={<NotificationList />} />
        <Route path="/review" element={<ReviewForm />} />

        {/* Wishlist */}
        <Route path="/wishlist" element={<WishlistPage />} />

        {/* Messages */}
        <Route path="/messages" element={<MessagesPage />} />

        {/* Collections */}
        <Route path="/on-sale" element={<OnSalePage />} />
        <Route path="/new-arrivals" element={<NewArrivalsPage />} />
        <Route path="/brands" element={<BrandsPage />} />

        {/* Error Pages */}
        <Route path="/403" element={<ForbiddenPage />} />
        <Route path="/500" element={<ServerErrorPage />} />
        <Route path="/network-error" element={<NetworkErrorPage />} />
        <Route path="/backend-down" element={<BackendDownPage />} />
        <Route path="/error" element={<AllErrorsPage />} />
        
        {/* 404 - Must be last to catch all undefined routes */}
        <Route path="*" element={<NotFoundPage />} />

      </Routes>
    </ErrorBoundary>
  );
}

export default App;
