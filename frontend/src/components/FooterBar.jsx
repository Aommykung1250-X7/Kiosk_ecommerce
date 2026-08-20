import React from "react";
import { ExclamationTriangleIcon, PhoneIcon, ChevronRightIcon } from "@heroicons/react/24/solid";

export default function FooterBar({ onOpenSupport }) {
  return (
    <footer className="w-full h-16 bg-[#1B1B1C] text-white border-t border-gray-800 flex items-center justify-between px-4 shrink-0 font-['DIN_Pro_Cond',_'Prompt',_sans-serif] z-30 shadow-lg relative">
      
      {/* Left: Support text & Icon */}
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-[#E53935]/20 text-[#E53935] border border-[#E53935]/40 animate-pulse">
          <ExclamationTriangleIcon className="w-5 h-5" />
        </div>
        <div className="flex flex-col leading-tight">
          <span className="text-xs font-bold text-gray-200">
            ระบบมีปัญหา? , มีเหตุขัดข้อง? | แจ้งปัญหาได้ที่&nbsp;--&gt;
          </span>
          <span className="text-[10px] text-gray-400 font-medium hidden sm:inline">
            กดปุ่มติดต่อเจ้าหน้าที่เพื่อขอความช่วยเหลือได้ตลอดเวลา
          </span>
        </div>
      </div>

      {/* Right: Phone Hotline Pill & Contact Button */}
      <div className="flex items-center gap-3">
        
        {/* Phone badge for quick view */}
        <div className="hidden md:flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-xl border border-white/10 text-xs font-semibold text-gray-300">
          <PhoneIcon className="w-3.5 h-3.5 text-[#F8C032]" />
          <span>Hotline: 02-123-4567</span>
        </div>

        {/* Action Button */}
        <button
          onClick={onOpenSupport}
          className="flex items-center gap-2 bg-gradient-to-r from-[#E53935] to-[#D32F2F] hover:from-[#D32F2F] hover:to-[#C62828] text-white px-4 py-2 rounded-xl text-xs font-extrabold cursor-pointer active:scale-95 transition-all shadow-md border border-white/10"
        >
          <span>ติดต่อเจ้าหน้าที่</span>
          <ChevronRightIcon className="w-4 h-4" />
        </button>
      </div>

    </footer>
  );
}
