// src/components/Header.jsx
import { ShoppingCartIcon } from "@heroicons/react/24/solid";

// Simple pagoda-silhouette mark for the store logo (generic, not a
// reproduction of any specific institution's logo).
function PagodaMark() {
  return (
    <svg viewBox="0 0 64 64" className="w-full h-full">
      <path
        d="M32 4 L38 12 H26 Z M32 10 v6 M20 20 h24 l4 8 H16 Z M22 28 h20 l3 7 H19 Z
           M24 35 h16 v20 h-16 Z M18 55 h28 v5 H18 Z"
        fill="#F8C032"
        stroke="#2B2B2B"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// Fixed 100px bar height + fluid clamp() sizing inside, so the header
// scales down smoothly on smaller displays without changing structure.
export default function Header({ cartCount = 0, onCartClick }) {
  return (
    <header
      className="w-full h-[100px] bg-[#F8C032] flex items-center justify-between 
                 px-[clamp(16px,2.5vw,40px)] shrink-0"
    >
      {/* Left: Logo + Store name */}
      <div className="flex items-center gap-[clamp(8px,1.2vw,16px)] min-w-0">
        <div
          className="w-[clamp(40px,4.5vw,64px)] h-[clamp(40px,4.5vw,64px)] p-2 
                     rounded-2xl bg-white flex items-center 
                     justify-center shrink-0 shadow-sm"
        >
          <PagodaMark />
        </div>
        <div className="flex flex-col leading-tight min-w-0">
          <span className="text-[clamp(16px,2vw,30px)] font-bold text-[#2B2B2B] tracking-tight truncate">
            DIIC SHOP
          </span>
          <span className="text-[clamp(9px,0.9vw,14px)] font-medium text-[#2B2B2B]/70 truncate">
            Digital Innovation and Information Center
          </span>
        </div>
      </div>

      {/* Right: Cart button */}
      <button
        onClick={onCartClick}
        className="relative h-[clamp(60px,5.5vw,68px)] px-[clamp(12px,2vw,28px)] 
                   rounded-full bg-white 
                   hover:bg-[#FFFBF0] active:scale-95 shadow-md
                   flex items-center gap-[clamp(6px,1vw,12px)] shrink-0 transition-transform duration-150"
        aria-label="Open cart"
      >
        <ShoppingCartIcon className="w-[clamp(18px,2vw,28px)] h-[clamp(18px,2vw,28px)] text-[#2B2B2B]" />
        <span className="text-[clamp(12px,1.3vw,18px)] font-semibold text-[#2B2B2B]">Cart</span>

        {cartCount > 0 && (
          <span
            className="absolute -top-2.5 -right-2.5 min-w-[clamp(20px,2.2vw,30px)] h-[clamp(20px,2.2vw,30px)] px-1.5 
                       rounded-full bg-[#E53935] text-white text-[clamp(10px,1.1vw,14px)] font-bold 
                       flex items-center justify-center shadow-md border-2 border-white"
          >
            {cartCount > 99 ? "99+" : cartCount}
          </span>
        )}
      </button>
    </header>
  );
}
