// src/components/Screensaver.jsx
import React, { useState, useEffect } from "react";
import { ClockIcon, SparklesIcon, CursorArrowRaysIcon } from "@heroicons/react/24/outline";

// SVG Illustrations as fallbacks
function WaterDrop() {
  return (
    <svg viewBox="0 0 100 100" className="w-full h-full">
      <defs>
        <linearGradient id="waterGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#80D0FF" />
          <stop offset="50%" stopColor="#41A5EE" />
          <stop offset="100%" stopColor="#2568D9" />
        </linearGradient>
      </defs>
      <path
        d="M50 15 C50 15 78 48 78 65 C78 80 65 90 50 90 C35 90 22 80 22 65 C22 48 50 15 50 15 Z"
        fill="url(#waterGrad)"
      />
      <ellipse cx="44" cy="55" rx="4" ry="10" fill="#FFFFFF" opacity="0.35" transform="rotate(-20 44 55)" />
      <ellipse cx="40" cy="45" rx="2" ry="5" fill="#FFFFFF" opacity="0.4" transform="rotate(-20 40 45)" />
    </svg>
  );
}

function SodaCup() {
  return (
    <svg viewBox="0 0 120 160" className="w-auto h-full">
      <path d="M35 50 L85 50 L77 140 L43 140 Z" fill="#EAEAEA" />
      <path d="M48 50 L54 50 L57 140 L51 140 Z" fill="#EC4E63" />
      <path d="M66 50 L72 50 L69 140 L63 140 Z" fill="#EC4E63" />
      <ellipse cx="60" cy="50" rx="27" ry="8" fill="#FFFFFF" stroke="#D1D1D6" strokeWidth="1" />
      <rect x="52" y="42" width="16" height="6" rx="2" fill="#FFFFFF" stroke="#D1D1D6" strokeWidth="1" />
      <path d="M57 42 L57 20 L75 20" stroke="#EC4E63" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d="M57 42 L57 20 L75 20" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.3" />
    </svg>
  );
}

function ChipsBag() {
  return (
    <svg viewBox="0 0 100 120" className="w-auto h-full">
      <path d="M20 20 L80 20 L90 105 L10 105 Z" fill="#F4B400" />
      <path d="M20 20 L28 10 L72 10 L80 20 Z" fill="#DBA000" />
      <path d="M10 105 L20 115 L80 115 L90 105 Z" fill="#DBA000" />
      <circle cx="50" cy="62" r="16" fill="#FFFFFF" />
      <ellipse cx="50" cy="62" rx="10" ry="7" fill="#E37400" />
    </svg>
  );
}

function WaferBag() {
  return (
    <svg viewBox="0 0 100 120" className="w-auto h-full">
      <path d="M20 20 L80 20 L90 105 L10 105 Z" fill="#4285F4" />
      <path d="M20 20 L28 10 L72 10 L80 20 Z" fill="#2A6CD6" />
      <path d="M10 105 L20 115 L80 115 L90 105 Z" fill="#2A6CD6" />
      <rect x="30" y="50" width="40" height="30" rx="3" fill="#FFD600" />
    </svg>
  );
}

function CupNoodle() {
  return (
    <svg viewBox="0 0 100 120" className="w-auto h-full">
      <path d="M25 35 L75 35 L68 105 L32 105 Z" fill="#EA4335" />
      <ellipse cx="50" cy="35" rx="25" ry="8" fill="#F1F3F4" />
      <ellipse cx="50" cy="31" rx="25" ry="8" fill="#FFFFFF" />
      <rect x="35" y="55" width="30" height="15" rx="2" fill="#F4B400" />
    </svg>
  );
}

function MiloBox() {
  return (
    <svg viewBox="0 0 100 120" className="w-auto h-full">
      <rect x="25" y="15" width="50" height="90" rx="4" fill="#0F9D58" />
      <rect x="25" y="15" width="50" height="20" rx="4" fill="#0B8043" />
      <circle cx="50" cy="65" r="14" fill="#F4B400" />
    </svg>
  );
}

function Pen() {
  return (
    <svg viewBox="0 0 100 120" className="w-auto h-full">
      <rect x="44" y="15" width="12" height="75" rx="6" fill="#4285F4" />
      <rect x="44" y="15" width="12" height="15" rx="3" fill="#1A73E8" />
      <polygon points="44,90 56,90 50,110" fill="#3C4043" />
    </svg>
  );
}

function Notebook() {
  return (
    <svg viewBox="0 0 100 120" className="w-auto h-full">
      <rect x="25" y="15" width="55" height="90" rx="4" fill="#FBBC05" />
      <rect x="20" y="20" width="8" height="8" rx="2" fill="#3C4043" />
      <rect x="20" y="36" width="8" height="8" rx="2" fill="#3C4043" />
      <rect x="20" y="52" width="8" height="8" rx="2" fill="#3C4043" />
      <rect x="20" y="68" width="8" height="8" rx="2" fill="#3C4043" />
      <rect x="20" y="84" width="8" height="8" rx="2" fill="#3C4043" />
    </svg>
  );
}

const ILLUSTRATIONS = {
  water: WaterDrop,
  cola: SodaCup,
  chips: ChipsBag,
  wafer: WaferBag,
  noodle: CupNoodle,
  milo: MiloBox,
  pen: Pen,
  notebook: Notebook,
};

export default function Screensaver({ onWake }) {
  const [time, setTime] = useState(new Date());
  const [bestSellers, setBestSellers] = useState([]);
  const [slides, setSlides] = useState([]);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    fetch("/api/products/bestsellers")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch best sellers");
        return res.json();
      })
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setBestSellers(data.slice(0, 4));
        } else {
          // Fallback to fetch normal products if bestsellers empty
          fetch("/api/products")
            .then((r) => r.json())
            .then((pData) => setBestSellers((pData || []).slice(0, 4)))
            .catch(() => {});
        }
      })
      .catch((err) => {
        console.error("Error loading best sellers on screensaver:", err);
      });
  }, []);

  useEffect(() => {
    fetch("/api/screensavers/active")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch screensavers");
        return res.json();
      })
      .then((data) => {
        setSlides(data || []);
      })
      .catch((err) => {
        console.error("Error loading screensavers:", err);
      });
  }, []);

  useEffect(() => {
    if (slides.length <= 1) return;

    const currentSlide = slides[currentSlideIndex];
    const durationMs = (currentSlide?.duration || 10) * 1000;

    const slideTimer = setTimeout(() => {
      setCurrentSlideIndex((prevIndex) => (prevIndex + 1) % slides.length);
    }, durationMs);

    return () => clearTimeout(slideTimer);
  }, [slides, currentSlideIndex]);

  const thaiMonths = [
    "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
    "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
  ];
  const thaiDays = ["อาทิตย์", "จันทร์", "อังคาร", "พุธ", "พฤหัสบดี", "ศุกร์", "เสาร์"];

  const timeString = time.toLocaleTimeString("th-TH", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  const dateString = `วัน${thaiDays[time.getDay()]}ที่ ${time.getDate()} ${thaiMonths[time.getMonth()]} ${time.getFullYear() + 543}`;

  return (
    <div
      onClick={onWake}
      className="fixed inset-0 z-50 bg-[#121214] flex items-center justify-center select-none cursor-pointer overflow-hidden font-['Prompt']"
    >
      <style>{`
        @keyframes subtle-pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.03); opacity: 0.95; }
        }
        @keyframes float-glow {
          0%, 100% { box-shadow: 0 10px 30px rgba(162, 75, 44, 0.35); }
          50% { box-shadow: 0 18px 45px rgba(248, 192, 50, 0.5); }
        }
        .animate-subtle-pulse {
          animation: subtle-pulse 3s infinite ease-in-out;
        }
        .animate-float-glow {
          animation: float-glow 2.5s infinite ease-in-out;
        }
      `}</style>

      {/* Main Kiosk Portrait Frame (9:16) */}
      <div className="relative aspect-[9/16] h-full max-h-screen w-auto bg-gradient-to-b from-[#FAF3EB] via-[#F5ECE2] to-[#EFE4D6] shadow-2xl flex flex-col justify-between p-6 sm:p-8 overflow-hidden">
        
        {/* Lanna Pattern Texture Subtle Overlay */}
        <div className="absolute inset-0 opacity-[0.035] pointer-events-none bg-[radial-gradient(#A24B2C_1.5px,transparent_1.5px)] [background-size:24px_24px]" />

        {/* 1. TOP HEADER: BRAND + CLOCK & DATE */}
        <header className="relative z-10 flex justify-between items-center bg-white/80 backdrop-blur-md px-5 py-3.5 rounded-2xl sm:rounded-3xl border border-[#E8DCCF] shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#A24B2C] to-[#F8C032] flex items-center justify-center shadow-md shadow-[#A24B2C]/20 text-white font-black text-lg">
              D
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-[#A24B2C] tracking-tight leading-none">
                DIIC SHOP
              </h1>
              <p className="text-[10px] sm:text-xs font-semibold text-[#8C7A6B] uppercase tracking-widest mt-0.5">
                Lanna Souvenir Kiosk
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-3 text-right">
            <div className="flex flex-col">
              <span className="text-xl sm:text-2xl font-black text-[#3D2E24] leading-none">
                {timeString}
              </span>
              <span className="text-[10px] sm:text-xs font-medium text-[#7D6B5C] mt-1">
                {dateString}
              </span>
            </div>
            <div className="w-9 h-9 rounded-xl bg-[#F8C032]/20 flex items-center justify-center text-[#A24B2C]">
              <ClockIcon className="w-5 h-5 stroke-[2.2]" />
            </div>
          </div>
        </header>

        {/* 2. CENTER HERO AREA (Slideshow or Attract Presentation) */}
        <main className="relative z-10 flex-1 flex flex-col items-center justify-center my-4 sm:my-6 text-center">
          {slides.length > 0 ? (
            /* Custom Slide Media */
            <div className="w-full max-h-[38vh] rounded-3xl overflow-hidden shadow-xl border border-white/70 mb-5 relative bg-black/5">
              <img
                src={
                  slides[currentSlideIndex].mediaUrl.startsWith("http") ||
                  slides[currentSlideIndex].mediaUrl.startsWith("blob")
                    ? slides[currentSlideIndex].mediaUrl
                    : `/uploads/screensavers/${slides[currentSlideIndex].mediaUrl}`
                }
                alt={slides[currentSlideIndex].title || "Screensaver Banner"}
                className="w-full h-full object-cover transition-all duration-700"
              />
              {slides.length > 1 && (
                <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5 z-10">
                  {slides.map((_, idx) => (
                    <div
                      key={idx}
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        idx === currentSlideIndex ? "bg-[#F8C032] w-6" : "bg-white/60 w-2"
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* Default Brand Attract Content */
            <div className="flex flex-col items-center mb-6 animate-subtle-pulse">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-tr from-[#A24B2C] via-[#C85E38] to-[#F8C032] flex items-center justify-center shadow-xl shadow-[#A24B2C]/25 mb-4 sm:mb-6">
                <SparklesIcon className="w-10 h-10 sm:w-12 sm:h-12 text-white" />
              </div>
              <h2 className="text-3xl sm:text-4xl font-black text-[#3D2E24] leading-tight">
                ยินดีต้อนรับสู่ <br />
                <span className="bg-gradient-to-r from-[#A24B2C] to-[#E37400] bg-clip-text text-transparent">
                  DIIC Shop
                </span> ของฝากล้านนา
              </h2>
              <p className="text-xs sm:text-sm text-[#6E5D4F] mt-2 sm:mt-3 max-w-xs leading-relaxed">
                คัดสรรของฝากและงานหัตถกรรมคุณภาพ ชำระเงินง่ายผ่านพร้อมเพย์ รับสินค้าได้ทันที
              </p>
            </div>
          )}

          {/* 3. INTERACTIVE TOUCH TO START BUTTON */}
          <button
            onClick={onWake}
            className="group relative px-8 sm:px-10 py-4 sm:py-4.5 rounded-full bg-gradient-to-r from-[#A24B2C] to-[#C85E38] text-white font-bold text-lg sm:text-xl animate-float-glow flex items-center gap-3 border border-white/40 transform hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer shadow-lg"
          >
            <CursorArrowRaysIcon className="w-6 h-6 text-[#F8C032] animate-bounce" />
            <span>แตะหน้าจอเพื่อเริ่มสั่งซื้อ</span>
            <span className="text-[10px] sm:text-xs bg-black/25 py-0.5 px-2.5 rounded-full text-white/95 font-medium">
              Touch to Start
            </span>
          </button>
        </main>

        {/* 4. BOTTOM BEST SELLERS SHOWCASE */}
        <footer className="relative z-10 bg-white/75 backdrop-blur-md p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-[#E8DCCF]">
          <div className="flex justify-between items-center mb-3 px-1">
            <span className="text-[11px] sm:text-xs font-bold text-[#A24B2C] uppercase tracking-wider flex items-center gap-1.5">
              <SparklesIcon className="w-4 h-4 text-[#F8C032]" /> สินค้ายอดนิยม
            </span>
            <span className="text-[10px] sm:text-[11px] text-[#8C7A6B]">
              สัมผัสเพื่อเลือกดูทั้งหมด
            </span>
          </div>

          <div className="grid grid-cols-4 gap-2.5 sm:gap-3">
            {(bestSellers.length > 0 ? bestSellers : [1, 2, 3, 4]).map((item, idx) => {
              const isObj = typeof item === "object";
              const name = isObj ? item.name : `สินค้าแนะนำ ${idx + 1}`;
              const price = isObj ? parseFloat(item.price).toLocaleString("th-TH") : "20";
              const imgKey = isObj ? item.image : "water";
              const Illustration = ILLUSTRATIONS[imgKey] || WaterDrop;
              const isCustomImage = isObj && item.image && (item.image.startsWith("http") || item.image.startsWith("/") || item.image.includes("."));

              return (
                <div
                  key={isObj ? item.id : idx}
                  className="bg-[#FAF3EB] rounded-xl sm:rounded-2xl p-2 sm:p-2.5 border border-[#E1D2C1] flex flex-col items-center text-center shadow-sm hover:scale-105 transition-transform duration-200"
                >
                  <div className="w-full h-14 sm:h-16 rounded-lg bg-white/60 flex items-center justify-center p-1 overflow-hidden mb-1.5">
                    {isCustomImage ? (
                      <img src={item.image} alt={name} className="h-full object-contain" />
                    ) : (
                      <div className="h-full flex items-center justify-center">
                        <Illustration />
                      </div>
                    )}
                  </div>
                  <h4 className="text-[10px] sm:text-xs font-bold text-[#3D2E24] line-clamp-1 w-full">
                    {name}
                  </h4>
                  <p className="text-[10px] sm:text-xs font-black text-[#A24B2C] mt-0.5">
                    ฿{price}
                  </p>
                </div>
              );
            })}
          </div>
        </footer>

      </div>
    </div>
  );
}
