import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../../api/axios";
import { CheckCircle, XCircle, Clock, ShoppingBag, ShoppingCart } from "lucide-react";
import { saveGuestCart, updateGlobalCartCount, loadGuestCart } from "../AddCart/cartUtils";

export default function EsewaCallbackPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [state, setState] = useState("verifying"); // "verifying" | "success" | "restoring" | "failed"
  const [transactionId, setTransactionId] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [restoredCount, setRestoredCount] = useState(0);

  const restoreCartAndCancel = async (reason) => {
    const orderId = sessionStorage.getItem("pendingEsewaOrderId");
    // Attempt to restore user credentials if they were lost during the redirect
    const savedToken = sessionStorage.getItem("pendingEsewaToken");
    const savedUserId = sessionStorage.getItem("pendingEsewaUserId");
    const savedRole = sessionStorage.getItem("pendingEsewaUserRole");

    setErrorMsg(reason || "Payment was not completed.");

    if (!orderId) {
      // No order info — just show failure
      setState("failed");
      return;
    }

    setState("restoring");

    // Ensure we use the raw number ID for the API path
    let userIdNum = savedUserId;
    if (typeof savedUserId === "string" && savedUserId.length > 5) {
       // It might be encoded (atob)
       try {
         const decoded = window.atob(savedUserId);
         userIdNum = Number(decoded);
        } catch (err) {
          // skip
        }
    }

    let restored = 0;
    try {
      // 1. Fetch the order to get its items
      const orderRes = await api.get(`/api/orders/${orderId}`);
      const order = orderRes.data;
      const orderItems = order?.items || [];

      // 2. Re-add each item back to the user's cart (DB or LocalStorage)
      for (const item of orderItems) {
        try {
          if (userIdNum) {
            await api.post(`/api/cart/${userIdNum}/add/${item.productId}`, {
              quantity: item.quantity,
              selectedColor: item.selectedColor || null,
              selectedStorage: item.selectedStorage || null,
            });
          } else {
            // Restore to Guest Cart
            const currentGuestCart = loadGuestCart();
            const newItem = {
              productId: item.productId,
              name: item.productName || "Product",
              price: item.unitPrice || 0,
              quantity: item.quantity || 1,
              selectedColor: item.selectedColor || null,
              selectedStorage: item.selectedStorage || null,
              image: item.imagePath || ""
            };
            currentGuestCart.push(newItem);
            saveGuestCart(currentGuestCart);
            updateGlobalCartCount(currentGuestCart.length);
          }
          restored++;
        } catch (addErr) {
          console.warn(`Could not restore cart item for product ${item.productId}:`, addErr);
        }
      }

      setRestoredCount(restored);
    } catch (fetchErr) {
      console.warn("Could not fetch order items to restore cart:", fetchErr);
    }

    // 3. Cancel the ghost order so it doesn't show in seller's orders
    try {
      const cancelPath = userIdNum ? `/api/orders/user/${userIdNum}/cancel/${orderId}` : `/api/orders/guest/cancel/${orderId}`;
      await api.put(cancelPath);
      console.info(`eSewa failure: cancelled ghost order ${orderId} and restored ${restored} item(s).`);
    } catch (cancelErr) {
      console.warn("Could not cancel ghost order:", cancelErr);
    } finally {
      sessionStorage.removeItem("pendingEsewaOrderId");
      sessionStorage.removeItem("pendingEsewaUserId");
      sessionStorage.removeItem("pendingEsewaToken");
    }

    // 4. Redirect to cart after a short moment so the user sees the message
    setTimeout(() => {
      navigate("/cart");
    }, 2500);
  };

  useEffect(() => {
    // ── SESSION RESTORATION ────────────────────────────
    // eSewa's cross-domain redirect can sometimes drop auth context.
    const savedToken = sessionStorage.getItem("pendingEsewaToken");
    const savedUserId = sessionStorage.getItem("pendingEsewaUserId");
    const savedRole = sessionStorage.getItem("pendingEsewaUserRole");

    if (savedToken && !localStorage.getItem("token")) {
      console.info("Restoring auth token from session storage...");
      localStorage.setItem("token", savedToken);
    }
    if (savedUserId && !localStorage.getItem("userId")) {
      localStorage.setItem("userId", savedUserId);
    }
    if (savedRole && !localStorage.getItem("userRole")) {
      localStorage.setItem("userRole", savedRole);
    }

    const data = searchParams.get("data");

    if (!data) {
      // No ?data param = user cancelled on eSewa's page
      restoreCartAndCancel("Payment was cancelled. No charges were made.");
      return;
    }

    const verify = async () => {
      try {
        const res = await api.post("/api/payment/esewa/verify", { data });

        if (res.data?.success) {
          // Payment confirmed — clear pending order from sessionStorage
          sessionStorage.removeItem("pendingEsewaOrderId");
          sessionStorage.removeItem("pendingEsewaUserId");
          setTransactionId(res.data.transactionId);
          setState("success");
        } else {
          // Verification returned an explicit failure — restore cart
          await restoreCartAndCancel(res.data?.error || "Payment could not be confirmed.");
        }
      } catch (err) {
        console.error("eSewa verification error:", err);
        await restoreCartAndCancel(err?.response?.data?.error || "Verification failed. Please contact support.");
      }
    };

    verify();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "#f6f8fb",
      fontFamily: "'Outfit', sans-serif",
      padding: "24px",
    }}>
      <div style={{
        background: "#fff",
        borderRadius: "20px",
        padding: "48px 40px",
        maxWidth: "440px",
        width: "100%",
        boxShadow: "0 20px 40px -8px rgba(0,0,0,0.08)",
        textAlign: "center",
      }}>

        {state === "verifying" && (
          <>
            <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#f0fdf4", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
              <Clock size={28} color="#166534" />
            </div>
            <h2 style={{ fontSize: "1.25rem", fontWeight: 800, marginBottom: 8, letterSpacing: "-0.02em" }}>Verifying Payment…</h2>
            <p style={{ color: "#6b7280", fontSize: "0.85rem", marginBottom: 24 }}>Please wait while we confirm your eSewa payment.</p>
            <div style={{ width: 32, height: 32, border: "3px solid #e5e7eb", borderTopColor: "#166534", borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto" }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </>
        )}

        {state === "restoring" && (
          <>
            <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#fffbeb", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
              <ShoppingCart size={28} color="#d97706" />
            </div>
            <h2 style={{ fontSize: "1.25rem", fontWeight: 800, marginBottom: 8, letterSpacing: "-0.02em", color: "#111827" }}>
              Restoring Your Cart…
            </h2>
            <p style={{ color: "#6b7280", fontSize: "0.85rem", marginBottom: 8 }}>
              {errorMsg}
            </p>
            <p style={{ color: "#6b7280", fontSize: "0.8rem", marginBottom: 24 }}>
              We're putting your items back in the cart. You'll be redirected shortly.
            </p>
            <div style={{ width: 32, height: 32, border: "3px solid #e5e7eb", borderTopColor: "#d97706", borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto" }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </>
        )}

        {state === "success" && (
          <>
            <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#f0fdf4", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
              <CheckCircle size={32} color="#16a34a" />
            </div>
            <h2 style={{ fontSize: "1.25rem", fontWeight: 800, marginBottom: 8, letterSpacing: "-0.02em", color: "#111827" }}>Payment Successful!</h2>
            <p style={{ color: "#6b7280", fontSize: "0.85rem", marginBottom: 4 }}>Your order has been confirmed and is now being processed.</p>
            {transactionId && (
              <p style={{ fontSize: "0.7rem", color: "#9ca3af", marginTop: 8, fontFamily: "monospace" }}>
                Transaction ID: <strong style={{ color: "#374151" }}>{transactionId}</strong>
              </p>
            )}
            <div style={{ marginTop: 28, display: "flex", flexDirection: "column", gap: 10 }}>
              <button
                onClick={() => navigate("/customer/dashboard?tab=orders")}
                style={{ background: "#111827", color: "#fff", border: "none", borderRadius: "100px", padding: "12px 24px", fontSize: "0.8rem", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
              >
                <ShoppingBag size={14} /> View My Orders
              </button>
              <button
                onClick={() => navigate("/")}
                style={{ background: "transparent", color: "#6b7280", border: "1px solid #e5e7eb", borderRadius: "100px", padding: "12px 24px", fontSize: "0.8rem", fontWeight: 600, cursor: "pointer" }}
              >
                Continue Shopping
              </button>
            </div>
          </>
        )}

        {state === "failed" && (
          <>
            <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#fef2f2", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
              <XCircle size={32} color="#dc2626" />
            </div>
            <h2 style={{ fontSize: "1.25rem", fontWeight: 800, marginBottom: 8, letterSpacing: "-0.02em", color: "#111827" }}>Payment Failed</h2>
            <p style={{ color: "#6b7280", fontSize: "0.85rem", marginBottom: 8 }}>
              We couldn't complete your payment. No charges were made.
            </p>
            {errorMsg && (
              <p style={{ fontSize: "0.75rem", color: "#dc2626", background: "#fef2f2", padding: "8px 12px", borderRadius: "8px", border: "1px solid #fecaca" }}>
                {errorMsg}
              </p>
            )}
            <div style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: 10 }}>
              <button
                onClick={() => navigate("/cart")}
                style={{ background: "#111827", color: "#fff", border: "none", borderRadius: "100px", padding: "12px 24px", fontSize: "0.8rem", fontWeight: 600, cursor: "pointer" }}
              >
                Go to Cart
              </button>
              <button
                onClick={() => navigate("/")}
                style={{ background: "transparent", color: "#6b7280", border: "1px solid #e5e7eb", borderRadius: "100px", padding: "12px 24px", fontSize: "0.8rem", fontWeight: 600, cursor: "pointer" }}
              >
                Continue Shopping
              </button>
            </div>
          </>
        )}

        <div style={{ marginTop: 32, paddingTop: 20, borderTop: "1px solid #f3f4f6", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
          <img src="https://esewa.com.np/common/images/esewa_logo.png" alt="eSewa" style={{ height: "14px", objectFit: "contain" }} />
          <span style={{ fontSize: "0.7rem", color: "#9ca3af" }}>Secured by <strong style={{ color: "#166534" }}>eSewa</strong></span>
        </div>
      </div>
    </div>
  );
}
