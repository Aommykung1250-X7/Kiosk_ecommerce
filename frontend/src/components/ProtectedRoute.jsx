// frontend/src/components/ProtectedRoute.jsx
import React from "react";
import { Navigate, Outlet } from "react-router-dom";

/**
 * Component สำหรับปกป้อง Route เพื่อตรวจสอบสิทธิ์เข้าใช้งานระบบหลังบ้าน
 * @param {Array<string>} allowedRoles - บทบาทที่อนุญาตให้เข้าถึงได้ เช่น ['admin', 'staff']
 */
const ProtectedRoute = ({ allowedRoles }) => {
  const token = localStorage.getItem("token");
  const userString = localStorage.getItem("user");

  // หากไม่มี Token หรือข้อมูลผู้ใช้ ให้รีไดเรกต์ไปหน้า Login
  if (!token || !userString) {
    return <Navigate to="/ditc-portal-to-manager" replace />;
  }

  try {
    const user = JSON.parse(userString);

    // ตรวจสอบว่าผู้ใช้มีบทบาทอยู่ในกลุ่มที่อนุญาตหรือไม่
    const hasPermission = allowedRoles.includes(user.role);

    if (!hasPermission) {
      // หากล็อกอินแล้วแต่สิทธิ์ไม่เพียงพอ ให้ดีดไปหน้าบอกสิทธิ์หมดสิทธิ์เข้าถึง (Unauthorized)
      return <Navigate to="/unauthorized" replace />;
    }

    // อนุญาตให้เรนเดอร์คอมโพเนนต์ย่อยด้านใน
    return <Outlet />;
  } catch (error) {
    // ป้องกันกรณีมีข้อมูลขยะใน localStorage
    localStorage.clear();
    return <Navigate to="/ditc-portal-to-manager" replace />;
  }
};

export default ProtectedRoute;
