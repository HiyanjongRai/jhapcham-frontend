import React, { useState, useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import SellerSidebar from "./SellerSidebar";
import { getCurrentUserId } from "../../utils/authUtils";
import { API_BASE } from "../config/config";
import "./seller.css";
import DashboardNavbar from "../Admin/DashboardNavbar";

export default function SellerLayout() {
  const [storeInfo, setStoreInfo] = useState(null);
  const sellerId = getCurrentUserId();
  const navigate = useNavigate();

  useEffect(() => {
    if (!sellerId) {
      navigate("/login");
      return;
    }

    const fetchStoreInfo = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/seller/${sellerId}/dashboard`);
        if (res.ok) {
          const data = await res.json();
          setStoreInfo(data);
        }
      } catch (err) {
        console.error("Layout store fetch error", err);
      }
    };

    fetchStoreInfo();
  }, [sellerId, navigate]);

  return (
    <div className="dashboard">
      <SellerSidebar storeInfo={storeInfo} />
      <div className="dashboard-content">
        <DashboardNavbar 
          title="Dashboard" 
          role="SELLER" 
          showSearch={false}
          customUserName={storeInfo?.shopName || storeInfo?.storeName}
        />
        <div className="seller-page-wrapper">
          <Outlet context={{ storeInfo }} />
        </div>
      </div>
    </div>
  );
}
