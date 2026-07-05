// src/components/Screensaver.jsx
import React from "react";
import { SparklesIcon } from "@heroicons/react/24/solid";

export default function Screensaver({ onWake }) {
  return (
    <div
      onClick={onWake}
      className="fixed inset-0 z-50 bg-[#0B0B0C] flex flex-col items-center justify-center p-6 select-none cursor-pointer overflow-hidden font-['Prompt']"
    >
      {/* Inject custom CSS keyframes for premium animations */}
      <style>{`
        @keyframes float-slow-1 {
          0%, 100% { transform: translate(0px, 0px) scale(1); }
          50% { transform: translate(40px, -60px) scale(1.1); }
        }
        @keyframes float-slow-2 {
          0%, 100% { transform: translate(0px, 0px) scale(1.1); }
          50% { transform: translate(-50px, 50px) scale(0.9); }
        }
        @keyframes pulse-glow {
          0%, 100% { opacity: 0.25; transform: scale(1); }
          50% { opacity: 0.45; transform: scale(1.05); }
        }
        @keyframes pulse-text {
          0%, 100% { opacity: 0.6; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.03); }
        }
        @keyframes border-glow {
          0%, 100% { border-color: rgba(248, 192, 50, 0.4); box-shadow: 0 0 15px rgba(248, 192, 50, 0.2); }
          50% { border-color: rgba(248, 192, 50, 0.8); box-shadow: 0 0 30px rgba(248, 192, 50, 0.5); }
        }
        .animate-float-1 {
          animation: float-slow-1 15s infinite ease-in-out;
        }
        .animate-float-2 {
          animation: float-slow-2 18s infinite ease-in-out;
        }
        .animate-pulse-glow {
          animation: pulse-glow 8s infinite ease-in-out;
        }
        .animate-pulse-text {
          animation: pulse-text 2s infinite ease-in-out;
        }
        .animate-border-glow {
          animation: border-glow 3s infinite ease-in-out;
        }
      `}</style>

      {/* Decorative Floating Glowing Background Blobs */}
      <div className="absolute top-1/4 left-1/4 w-[350px] h-[350px] bg-gradient-to-tr from-[#F8C032] to-[#FF9800] rounded-full filter blur-[90px] opacity-25 animate-float-1 animate-pulse-glow"></div>
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-gradient-to-br from-[#FF9800] to-[#E53935] rounded-full filter blur-[100px] opacity-25 animate-float-2 animate-pulse-glow"></div>

      {/* Glassmorphic Main Card Container */}
      <div className="relative z-10 w-full max-w-xl bg-white/[0.03] backdrop-blur-2xl border border-white/[0.08] rounded-[40px] p-12 text-center flex flex-col items-center gap-8 shadow-[0_30px_100px_rgba(0,0,0,0.5)]">
        
        {/* Glow Logo Area */}
        <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-[#F8C032] to-[#FF9800] p-0.5 flex items-center justify-center shadow-[0_10px_35px_rgba(248,192,50,0.3)] animate-pulse-text">
          <div className="w-full h-full bg-[#121214] rounded-[22px] flex items-center justify-center">
            <SparklesIcon className="w-12 h-12 text-[#F8C032]" />
          </div>
        </div>

        {/* Title & Tagline */}
        <div className="flex flex-col gap-3">
          <h1 className="text-4xl font-black text-white tracking-wide uppercase">
            DIIC SHOP
          </h1>
          <p className="text-lg text-gray-400 font-medium">
            ศูนย์นวัตกรรมและเทคโนโลยีสารสนเทศ
          </p>
          <div className="w-16 h-[2px] bg-gradient-to-r from-transparent via-[#F8C032] to-transparent mx-auto mt-2"></div>
        </div>

        {/* Dynamic Breathing Touch-to-Start Button */}
        <div className="w-full max-w-md mt-6">
          <button
            onClick={onWake}
            className="w-full h-20 rounded-3xl border-2 bg-gradient-to-b from-white/[0.06] to-transparent text-white font-bold text-xl tracking-wider select-none animate-border-glow hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 flex items-center justify-center gap-3"
          >
            <span className="relative flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#F8C032] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-[#F8C032]"></span>
            </span>
            <span className="animate-pulse-text">แตะหน้าจอเพื่อเริ่มต้นใช้งาน</span>
          </button>
        </div>

        <p className="text-xs text-gray-500 font-medium mt-4 tracking-widest uppercase">
          DIIC Smart Kiosk Experience
        </p>
      </div>
    </div>
  );
}
