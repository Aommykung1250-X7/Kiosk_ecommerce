import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/Home";
import MobileDelivery from "./pages/MobileDelivery";
import Login from "./pages/Login";
import Unauthorized from "./pages/Unauthorized";
import OrderQueue from "./pages/admin/OrderQueue";
import ProductManagement from "./pages/admin/ProductManagement";
import ScreensaverManagement from "./pages/admin/ScreensaverManagement";
import ProtectedRoute from "./components/ProtectedRoute";
import KioskLayout from "./components/KioskLayout";

function KioskOrCheckout() {
  const urlParams = new URLSearchParams(window.location.search);
  const kioskParam = urlParams.get("kiosk");

  if (kioskParam === "true") {
    localStorage.setItem("isKiosk", "true");
  }

  return (
    <KioskLayout>
      <Home />
    </KioskLayout>
  );
}

export default function App() {
  return (
    <Router>
      <Routes>
        {/* หน้าหลักของตู้สินค้า */}
        <Route path="/" element={<KioskOrCheckout />} />
        
        {/* หน้ายืนยันตัวตน */}
        <Route path="/ditc-portal-to-manager" element={<Login />} />
        <Route path="/unauthorized" element={<Unauthorized />} />
        <Route path="/mobile/delivery" element={<MobileDelivery />} />

        {/* ส่วนงานพนักงานหน้าร้านและแอดมิน (Staff & Admin) */}
        <Route element={<ProtectedRoute allowedRoles={["staff", "admin"]} />}>
          <Route path="/dashboard/orders" element={<OrderQueue />} />
        </Route>

        <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
          <Route path="/dashboard/products" element={<ProductManagement />} />
          <Route path="/dashboard/screensavers" element={<ScreensaverManagement />} />
        </Route>

        {/* เส้นทางกรณีไม่พบหน้าจอใดๆ ดีดกลับหน้าแรก */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
