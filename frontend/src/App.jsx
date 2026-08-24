import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/Home";
import MobileDelivery from "./pages/MobileDelivery";
import Login from "./pages/Login";
import Unauthorized from "./pages/Unauthorized";
import OrderQueue from "./pages/admin/OrderQueue";
import ProductManagement from "./pages/admin/ProductManagement";
import ScreensaverManagement from "./pages/admin/ScreensaverManagement";
import ReportManagement from "./pages/admin/ReportManagement";
import ProtectedRoute from "./components/ProtectedRoute";
import NotificationDemo from "./pages/NotificationDemo";
import { NotificationProvider } from "./components/notify";

function KioskOrCheckout() {
  const urlParams = new URLSearchParams(window.location.search);
  const kioskParam = urlParams.get("kiosk");

  if (kioskParam === "true") {
    localStorage.setItem("isKiosk", "true");
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
          DITC CAMT Kiosk e-Commerce
        </span>
      </div>
    );
  }

  return <Home />;
}

export default function App() {
  return (
    <NotificationProvider>
      <Router>
        <Routes>
          {/* หน้าหลักของตู้สินค้า / หน้าจ่ายเงินบนมือถือ */}
          <Route path="/" element={<KioskOrCheckout />} />

          {/* หน้ายืนยันตัวตน */}
          <Route path="/ditc-portal-to-manager" element={<Login />} />
          <Route path="/unauthorized" element={<Unauthorized />} />
          <Route path="/mobile/delivery" element={<MobileDelivery />} />

          {/* ทางลัดชื่อสั้นของหลังบ้าน ชี้ไปที่เส้นทางจริงใต้ /dashboard */}
          <Route path="/orders" element={<Navigate to="/dashboard/orders" replace />} />
          <Route path="/products" element={<Navigate to="/dashboard/products" replace />} />
          <Route path="/screensavers" element={<Navigate to="/dashboard/screensavers" replace />} />
          <Route path="/reports" element={<Navigate to="/dashboard/reports" replace />} />

          {/* ส่วนงานพนักงานหน้าร้านและแอดมิน (Staff & Admin) */}
          <Route element={<ProtectedRoute allowedRoles={["staff", "admin"]} />}>
            <Route path="/dashboard/orders" element={<OrderQueue />} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
            <Route path="/dashboard" element={<Navigate to="/dashboard/products" replace />} />
            <Route path="/dashboard/products" element={<ProductManagement />} />
            <Route path="/dashboard/screensavers" element={<ScreensaverManagement />} />
            <Route path="/dashboard/reports" element={<ReportManagement />} />
          </Route>

          {/* หน้าสาธิตระบบแจ้งเตือน สำหรับนักพัฒนาและงานตรวจรับ UI */}
          <Route path="/dev/notifications" element={<NotificationDemo />} />

          {/* เส้นทางกรณีไม่พบหน้าจอใดๆ ดีดกลับหน้าแรก */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </NotificationProvider>
  );
}
