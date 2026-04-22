import React, { useState, useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import SellerSidebar from "./SellerSidebar";
import { getCurrentUserId } from "../../utils/authUtils";
import { API_BASE } from "../config/config";
import api from "../../api/axios";
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
        // Verify the user status to block pending sellers from bypassing login
        try {
          const userRes = await api.get(`/api/users/${sellerId}`);
          if (userRes.status === 200) {
            const userData = userRes.data;
            const userStatus = userData.status || userData.userStatus;
            if (userStatus === "PENDING" || userStatus === "pending") {
               localStorage.clear();
               navigate("/login");
               return;
            }
          }
        } catch (err) {
          console.error("Failed to check user status in layout", err);
        }

        const res = await api.get(`/api/seller/${sellerId}/stats`);
        if (res.status === 200) {
          setStoreInfo(res.data);
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
