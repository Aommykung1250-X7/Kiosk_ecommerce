// src/components/Screensaver.jsx
import React, { useState, useEffect } from "react";
import { ClockIcon } from "@heroicons/react/24/outline";

// SVG Illustrations copied from ProductCard.jsx for self-containment
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

// src/components/Screensaver.jsx
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
        setBestSellers(data.slice(0, 4));
      })
      .catch((err) => {
        console.error("Error loading best sellers on screensaver:", err);
      });
  }, []);

  const getThaiDateString = (date) => {
    const months = [
      "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
      "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
    ];
    const day = date.getDate();
    const month = months[date.getMonth()];
    const yearBE = date.getFullYear() + 543;
    return `${day} ${month} ${yearBE}`;
  };

  const timeString = time.toLocaleTimeString("th-TH", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  const dateString = getThaiDateString(time);

  const renderCard = (index) => {
    const product = bestSellers[index];
    const leftPositions = [
      "left-[6.37cqw]",
      "left-[29.75cqw]",
      "left-[53.13cqw]",
      "left-[76.51cqw]"
    ];

    if (!product) {
      // Render a blank cover to hide the static cards in wait_screen.png
      return (
        <div
          key={`blank-${index}`}
          className={`absolute ${leftPositions[index]} top-[67.58cqh] w-[21.78cqw] h-[17.94cqh] bg-[#F2ECE4] rounded-[1.8cqw] border border-transparent`}
        />
      );
    }

    const { name, price, image } = product;
    const Illustration = ILLUSTRATIONS[image] || WaterDrop;
    const isCustomImage = image && (image.startsWith("http") || image.startsWith("/") || image.includes("."));

    return (
      <div
        key={product.id || index}
        className={`absolute ${leftPositions[index]} top-[67.58cqh] w-[21.78cqw] h-[17.94cqh] bg-[#FAF3EB] rounded-[1.8cqw] border border-[#E1D2C1] p-[1.2cqw] flex flex-col items-center justify-between shadow-[0_2px_6px_rgba(61,46,36,0.05)] hover:scale-105 transition-transform duration-300`}
      >
        <div className="w-full flex-1 flex items-center justify-center p-[0.2cqw] overflow-hidden">
          {isCustomImage ? (
            <img
              src={image}
              alt={name}
              className="w-auto h-full max-h-[8.5cqh] object-contain"
            />
          ) : (
            <div className="w-auto h-full max-h-[8.5cqh] flex items-center justify-center">
              <Illustration />
            </div>
          )}
        </div>
        <div className="text-center w-full mt-[0.5cqw]">
          <h4 className="text-[1.8cqw] font-bold text-[#3D2E24] line-clamp-1 px-[0.2cqw]">
            {name}
          </h4>
          <p className="text-[1.9cqw] font-black text-[#A24B2C] mt-[0.1cqw]">
            ฿ {parseFloat(price).toFixed(0)}
          </p>
        </div>
      </div>
    );
  };

  return (
    <div
      onClick={onWake}
      className="fixed inset-0 z-50 bg-[#121214] flex items-center justify-center select-none cursor-pointer overflow-hidden font-['Prompt']"
    >
      {/* Inject custom CSS keyframes for animations */}
      <style>{`
        @keyframes wiggle-scale {
          0%, 100% {
            transform: rotate(-2.5deg) scale(0.97);
          }
          50% {
            transform: rotate(2.5deg) scale(1.03);
          }
        }
        .animate-wiggle-scale {
          animation: wiggle-scale 2.5s infinite ease-in-out;
        }
      `}</style>

      {/* Main Kiosk Container maintaining exact portrait ratio */}
      <div
        className="relative aspect-[941/1672] h-full max-h-screen w-auto bg-[#F4EEE8] shadow-2xl overflow-hidden"
        style={{ containerType: "size" }}
      >
        {/* Full wait screen image background */}
        <img
          src="/wait_screen.png"
          alt="Lanna Souvenir Kiosk background"
          className="w-full h-full object-cover"
        />

        {/* Live Clock Overlay - exactly covering static clock */}
        <div
          className="absolute left-[78.4cqw] top-[1.2cqh] w-[19.8cqw] h-[7.17cqh] bg-[#E7DCCE] rounded-[1.6cqw] flex flex-col items-center justify-center shadow-[0_2px_8px_rgba(61,46,36,0.08)]"
          onClick={(e) => {
            // Wake up on click
            onWake();
            e.stopPropagation();
          }}
        >
          <div className="flex items-center gap-[0.5cqw] text-[#3D2E24]">
            <ClockIcon className="w-[2.2cqw] h-[2.2cqw] stroke-[2.5]" />
            <span className="text-[2.6cqw] font-bold leading-none">{timeString}</span>
          </div>
          <div className="text-[1.25cqw] font-medium text-[#3D2E24]/80 mt-[0.3cqw] leading-none text-center">
            {dateString}
          </div>
        </div>



        {/* Dynamic Product Cards Overlays - exactly covering static cards */}
        { [0, 1, 2, 3].map(index => renderCard(index)) }
      </div>
    </div>
  );
}
