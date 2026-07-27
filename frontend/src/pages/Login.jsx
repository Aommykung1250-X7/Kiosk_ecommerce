// frontend/src/pages/Login.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { LockClosedIcon, UserIcon } from "@heroicons/react/24/solid";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "เกิดข้อผิดพลาดในการล็อกอิน");
      }

      localStorage.setItem("user", JSON.stringify(data.user));

      // นำทางไปยัง Dashboard ตามสิทธิ์
      if (data.user.role === "admin") {
        navigate("/dashboard/products");
      } else {
        navigate("/dashboard/orders");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6 font-['Prompt']">
      <div className="max-w-md w-full bg-white rounded-3xl border border-gray-100 shadow-[0_15px_30px_rgba(0,0,0,0.05)] overflow-hidden flex flex-col p-8 gap-8 animate-in fade-in-50 duration-200">
        
        {/* CAMT Branding Header */}
        <div className="text-center flex flex-col gap-2">
          <div className="w-16 h-16 bg-[#F8C032]/10 rounded-2xl flex items-center justify-center mx-auto text-[#F8C032] font-bold text-2xl">
            CO
          </div>
          <h2 className="text-2xl font-extrabold text-[#2B2B2B] mt-2">ระบบหลังบ้านร้านค้าคีออส</h2>
          <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold">คณะ CAMT มช.</p>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm font-medium">
            {error}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin} className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-500">ชื่อผู้ใช้งาน (Username)</label>
            <div className="relative flex items-center">
              <UserIcon className="w-5 h-5 text-gray-300 absolute left-4" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                placeholder="กรอกชื่อผู้ใช้งาน..."
                className="w-full h-12 bg-gray-50 border border-gray-100 hover:border-gray-200 focus:border-[#F8C032] rounded-xl pl-12 pr-4 text-sm outline-none transition-all"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-500">รหัสผ่าน (Password)</label>
            <div className="relative flex items-center">
              <LockClosedIcon className="w-5 h-5 text-gray-300 absolute left-4" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="กรอกรหัสผ่าน..."
                className="w-full h-12 bg-gray-50 border border-gray-100 hover:border-gray-200 focus:border-[#F8C032] rounded-xl pl-12 pr-4 text-sm outline-none transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="h-12 w-full rounded-xl bg-[#F8C032] hover:bg-[#F0B420] active:scale-95 disabled:opacity-50
                       flex items-center justify-center gap-2 transition-transform duration-150 shadow-md font-semibold text-[#2B2B2B] mt-2"
          >
            {loading ? "กำลังลงชื่อเข้าใช้งาน..." : "ลงชื่อเข้าใช้งาน"}
          </button>
        </form>
      </div>
    </div>
  );
}
