import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/Home";
import MobileCheckout from "./pages/MobileCheckout";
import Login from "./pages/Login";
import Unauthorized from "./pages/Unauthorized";
import OrderQueue from "./pages/admin/OrderQueue";
import ProductManagement from "./pages/admin/ProductManagement";
import ProtectedRoute from "./components/ProtectedRoute";
import KioskLayout from "./components/KioskLayout";

// ฟังก์ชันดึงออเดอร์เพื่อสลับไปหน้าจ่ายเงินบนมือถือ หรือกลับหน้าหลักของคีออส
function KioskOrCheckout() {
  const urlParams = new URLSearchParams(window.location.search);
  const orderId = urlParams.get("orderId");

  if (orderId) {
    return (
      <KioskLayout>
        <MobileCheckout />
      </KioskLayout>
    );
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
        {/* หน้าหลักของตู้สินค้า / หน้าจ่ายเงินบนมือถือ */}
        <Route path="/" element={<KioskOrCheckout />} />
        
        {/* หน้ายืนยันตัวตน (ยกเว้น Login ไม่ครอบ KioskLayout) */}
        <Route path="/ditc-portal-to-manager" element={<Login />} />
        <Route 
          path="/unauthorized" 
          element={
            <KioskLayout>
              <Unauthorized />
            </KioskLayout>
          } 
        />

        {/* ส่วนงานพนักงานหน้าร้านและแอดมิน (ยกเว้น Dashboard OrderQueue ไม่ครอบ KioskLayout) */}
        <Route element={<ProtectedRoute allowedRoles={["staff", "admin"]} />}>
          <Route path="/dashboard/orders" element={<OrderQueue />} />
        </Route>

        {/* ส่วนงานจัดการระบบเฉพาะแอดมินเท่านั้น (ProductManagement ครอบ KioskLayout) */}
        <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
          <Route 
            path="/dashboard/products" 
            element={
              <KioskLayout>
                <ProductManagement />
              </KioskLayout>
            } 
          />
        </Route>

        {/* เส้นทางกรณีไม่พบหน้าจอใดๆ ดีดกลับหน้าแรก */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
