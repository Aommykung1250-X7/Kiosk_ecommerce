import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/Home";
import MobileCheckout from "./pages/MobileCheckout";
import Login from "./pages/Login";
import Unauthorized from "./pages/Unauthorized";
import OrderQueue from "./pages/admin/OrderQueue";
import ProductManagement from "./pages/admin/ProductManagement";
import ProtectedRoute from "./components/ProtectedRoute";

// ฟังก์ชันดึงออเดอร์เพื่อสลับไปหน้าจ่ายเงินบนมือถือ หรือกลับหน้าหลักของคีออส
function KioskOrCheckout() {
  const urlParams = new URLSearchParams(window.location.search);
  const orderId = urlParams.get("orderId");
  const kioskParam = urlParams.get("kiosk");

  // หากระบุพารามิเตอร์ kiosk=true ให้เปิดการยืนยันสิทธิ์เครื่องนี้
  if (kioskParam === "true") {
    localStorage.setItem("isKiosk", "true");
  }

  // อนุญาตการสแกนจ่ายของบนมือถือ
  if (orderId) {
    return <MobileCheckout />;
  }

  // ตรวจสอบสิทธิ์ว่าได้รับการยืนยันเป็นเครื่องตู้ Kiosk หรือไม่
  const isKiosk = localStorage.getItem("isKiosk") === "true";
  if (!isKiosk) {
    return (
      <div style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        backgroundColor: "#161819",
        color: "#FFFFFF",
        fontFamily: "'Prompt', sans-serif",
        padding: "20px",
        textAlign: "center"
      }}>
        <div style={{
          width: "120px",
          height: "120px",
          background: "linear-gradient(135deg, #FF6B00 0%, #FFA800 100%)",
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "50px",
          marginBottom: "24px",
          boxShadow: "0 8px 30px rgba(255, 107, 0, 0.4)"
        }}>
          🖥️
        </div>
        <h1 style={{
          fontSize: "24px",
          fontWeight: "900",
          margin: "0 0 12px 0",
          background: "linear-gradient(135deg, #FF6B00 0%, #FFA800 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent"
        }}>
          กรุณาสั่งซื้อสินค้าผ่านหน้าจอ Kiosk
        </h1>
        <p style={{
          fontSize: "14px",
          color: "#AAAAAA",
          lineHeight: "1.6",
          maxWidth: "340px",
          margin: "0"
        }}>
          ขออภัยในความไม่สะดวก ระบบสั่งซื้อออนไลน์หน้าร้านนี้เปิดให้บริการเฉพาะผ่านตู้อุปกรณ์ Kiosk ณ สาขาโดยตรงเท่านั้น
        </p>
        <span style={{
          fontSize: "11px",
          color: "#555555",
          marginTop: "40px"
        }}>
          DIIC CAMT Kiosk e-Commerce
        </span>
      </div>
    );
  }

  return <Home />;
}

export default function App() {
  return (
    <Router>
      <Routes>
        {/* หน้าหลักของตู้สินค้า / หน้าจ่ายเงินบนมือถือ */}
        <Route path="/" element={<KioskOrCheckout />} />
        
        {/* หน้ายืนยันตัวตน */}
        <Route path="/ditc-portal-to-manager" element={<Login />} />
        <Route path="/unauthorized" element={<Unauthorized />} />

        {/* ส่วนงานพนักงานหน้าร้านและแอดมิน (Staff & Admin) */}
        <Route element={<ProtectedRoute allowedRoles={["staff", "admin"]} />}>
          <Route path="/dashboard/orders" element={<OrderQueue />} />
        </Route>

        {/* ส่วนงานจัดการระบบเฉพาะแอดมินเท่านั้น (Admin Only) */}
        <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
          <Route path="/dashboard/products" element={<ProductManagement />} />
        </Route>

        {/* เส้นทางกรณีไม่พบหน้าจอใดๆ ดีดกลับหน้าแรก */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
