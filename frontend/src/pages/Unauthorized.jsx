// frontend/src/pages/Unauthorized.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import { ShieldExclamationIcon } from "@heroicons/react/24/outline";

export default function Unauthorized() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 font-['Prompt']">
      <div className="max-w-md w-full bg-white rounded-3xl border border-gray-100 shadow-[0_15px_30px_rgba(0,0,0,0.05)] p-8 text-center flex flex-col items-center gap-6">
        <ShieldExclamationIcon className="w-20 h-20 text-red-500 animate-pulse" />
        
        <div className="flex flex-col gap-2">
          <h2 className="text-2xl font-extrabold text-[#2B2B2B]">ไม่มีสิทธิ์เข้าถึงหน้านี้</h2>
          <p className="text-sm text-gray-500">
            บัญชีผู้ใช้งานของคุณไม่ได้รับอนุญาตให้เข้าดูหรือจัดการข้อมูลในหน้านี้
          </p>
        </div>

        <div className="w-full flex flex-col gap-3 mt-2">
          <button
            onClick={() => navigate(-1)}
            className="w-full h-12 rounded-xl bg-gray-100 hover:bg-gray-200 text-[#2B2B2B] font-semibold active:scale-95 transition-all"
          >
            ย้อนกลับ
          </button>
          
          <button
            onClick={() => {
              localStorage.clear();
              navigate("/ditc-portal-to-manager");
            }}
            className="w-full h-12 rounded-xl bg-red-550 hover:bg-red-600 text-white font-semibold active:scale-95 transition-all bg-red-600"
          >
            ออกจากระบบ
          </button>
        </div>
      </div>
    </div>
  );
}
