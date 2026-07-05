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

  if (orderId) {
    return <MobileCheckout />;
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
