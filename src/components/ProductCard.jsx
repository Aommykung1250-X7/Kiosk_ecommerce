// src/components/ProductCard.jsx
import { ShoppingCartIcon, TagIcon } from "@heroicons/react/24/solid";

// Flat, minimal SVG illustrations standing in for product photography.
// Kept generic (no reproduced logos/trade dress) but color-coded per item.
// Each uses w-full/h-full so it scales with its fluid-sized wrapper.
function WaterBottle() {
  return (
    <svg viewBox="0 0 120 160" className="w-full h-full">
      <rect x="50" y="6" width="20" height="14" rx="3" fill="#4FA8D8" />
      <path d="M42 24 h36 l4 20 -6 8 v92 a6 6 0 0 1 -6 6 H50 a6 6 0 0 1 -6 -6 V52 l-6 -8 Z"
            fill="#EAF6FB" stroke="#BFE3F2" strokeWidth="2" />
      <rect x="38" y="78" width="44" height="30" rx="4" fill="#4FA8D8" opacity="0.85" />
      <rect x="38" y="78" width="44" height="8" fill="#ffffff" opacity="0.5" />
    </svg>
  );
}

function ColaCan() {
  return (
    <svg viewBox="0 0 120 160" className="w-full h-full">
      <rect x="30" y="16" width="60" height="128" rx="12" fill="#E5342B" />
      <ellipse cx="60" cy="16" rx="30" ry="8" fill="#C7C7C7" />
      <ellipse cx="60" cy="16" rx="24" ry="5" fill="#EDEDED" />
      <rect x="30" y="70" width="60" height="26" fill="#ffffff" opacity="0.85" />
      <rect x="30" y="70" width="60" height="7" fill="#E5342B" opacity="0.7" />
      <rect x="30" y="89" width="60" height="7" fill="#E5342B" opacity="0.7" />
    </svg>
  );
}

function ChipsBag() {
  return (
    <svg viewBox="0 0 120 160" className="w-full h-full">
      <path d="M28 30 L92 30 L104 140 a8 8 0 0 1 -8 8 H24 a8 8 0 0 1 -8 -8 Z"
            fill="#F7C531" />
      <path d="M28 30 l6 -14 h52 l6 14 Z" fill="#E8A800" />
      <ellipse cx="60" cy="92" rx="30" ry="34" fill="#FFFFFF" opacity="0.9" />
      <ellipse cx="60" cy="92" rx="22" ry="26" fill="#F0472B" opacity="0.9" />
    </svg>
  );
}

function WaferBag() {
  return (
    <svg viewBox="0 0 120 160" className="w-full h-full">
      <path d="M28 30 L92 30 L104 140 a8 8 0 0 1 -8 8 H24 a8 8 0 0 1 -8 -8 Z"
            fill="#2E6DB4" />
      <path d="M28 30 l6 -14 h52 l6 14 Z" fill="#1F5290" />
      <rect x="34" y="70" width="52" height="46" rx="6" fill="#FFD84D" />
      <rect x="34" y="70" width="52" height="12" rx="4" fill="#FFE98A" />
    </svg>
  );
}

function CupNoodle() {
  return (
    <svg viewBox="0 0 120 160" className="w-full h-full">
      <path d="M34 54 h52 l-8 78 a8 8 0 0 1 -8 7 H50 a8 8 0 0 1 -8 -7 Z" fill="#D6362A" />
      <ellipse cx="60" cy="54" rx="26" ry="9" fill="#EFEFEF" />
      <ellipse cx="60" cy="50" rx="26" ry="9" fill="#FFFFFF" />
      <path d="M40 66 h40 v18 h-40 Z" fill="#F6B23B" opacity="0.9" />
    </svg>
  );
}

function MiloBox() {
  return (
    <svg viewBox="0 0 120 160" className="w-full h-full">
      <rect x="34" y="26" width="52" height="104" rx="6" fill="#1E7A3D" />
      <rect x="34" y="26" width="52" height="26" rx="6" fill="#2C9B4F" />
      <path d="M34 52 L86 26" stroke="#166030" strokeWidth="3" />
      <circle cx="60" cy="94" r="16" fill="#F6B23B" opacity="0.9" />
    </svg>
  );
}

function Pen() {
  return (
    <svg viewBox="0 0 120 160" className="w-full h-full">
      <rect x="52" y="18" width="16" height="90" rx="6" fill="#2E6DB4" />
      <rect x="52" y="18" width="16" height="20" rx="6" fill="#1F5290" />
      <polygon points="52,108 68,108 60,132" fill="#2B2B2B" />
      <rect x="56" y="10" width="8" height="14" rx="2" fill="#F7C531" />
    </svg>
  );
}

function Notebook() {
  return (
    <svg viewBox="0 0 120 160" className="w-full h-full">
      <rect x="28" y="20" width="64" height="112" rx="8" fill="#F7C531" />
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <circle key={i} cx="28" cy={34 + i * 17} r="4" fill="#FFFFFF" stroke="#E8A800" strokeWidth="2" />
      ))}
      <rect x="42" y="52" width="36" height="36" rx="4" fill="#FFFFFF" opacity="0.9" />
    </svg>
  );
}

const ILLUSTRATIONS = {
  water: WaterBottle,
  cola: ColaCan,
  chips: ChipsBag,
  wafer: WaferBag,
  noodle: CupNoodle,
  milo: MiloBox,
  pen: Pen,
  notebook: Notebook,
};

// No fixed px width/height on the card — it fills its grid column and every
// internal dimension is a clamp(), so the whole card shrinks in proportion
// as the column narrows instead of wrapping/reflowing content.
export default function ProductCard({ product, onAddToCart }) {
  const { name, price, illustration, promotion } = product;
  const Illustration = ILLUSTRATIONS[illustration] || WaterBottle;

  return (
    <div
      className="w-full bg-white rounded-[clamp(14px,1.8vw,24px)]
                 border border-[#EAEAEA] shadow-[0_4px_16px_rgba(0,0,0,0.06)]
                 flex flex-col overflow-hidden relative"
    >
      {promotion && (
        <div
          className="absolute top-[clamp(8px,1vw,16px)] left-[clamp(8px,1vw,16px)] z-10 
                     flex items-center gap-1
                     bg-[#F8C032] text-[#2B2B2B] text-[clamp(9px,0.85vw,12px)] font-semibold
                     px-[clamp(6px,1vw,12px)] py-[clamp(4px,0.6vw,6px)] rounded-full shadow-sm"
        >
          <TagIcon className="w-[clamp(10px,1vw,14px)] h-[clamp(10px,1vw,14px)]" />
          PROMO
        </div>
      )}

      {/* Image area */}
      <div className="w-full aspect-[8/5] bg-white flex items-center justify-center p-[10%]">
        <Illustration />
      </div>

      {/* Info area */}
      <div className="flex-1 flex flex-col items-center justify-between 
                       px-[clamp(10px,1.6vw,24px)] py-[clamp(10px,1.4vw,20px)] text-center
                       gap-[clamp(8px,1.2vw,14px)]">
        <div className="flex flex-col items-center gap-[clamp(4px,0.5vw,6px)]">
          <h3 className="text-[clamp(12px,1.15vw,18px)] font-semibold text-[#2B2B2B] leading-snug line-clamp-2">
            {name}
          </h3>
          <p className="text-[clamp(16px,1.7vw,24px)] font-bold text-[#E53935]">
            ฿{price.toFixed(0)}
          </p>
        </div>

        <button
          onClick={() => onAddToCart(product)}
          className="h-[clamp(60px,6vw,72px)] w-full rounded-2xl bg-[#F8C032] hover:bg-[#F0B420]
                     active:scale-[0.97] flex items-center justify-center gap-[clamp(4px,0.7vw,8px)]
                     transition-transform duration-150 shadow-sm"
        >
          <ShoppingCartIcon className="w-[clamp(14px,1.3vw,20px)] h-[clamp(14px,1.3vw,20px)] text-[#2B2B2B]" />
          <span className="text-[clamp(11px,1.1vw,16px)] font-semibold text-[#2B2B2B]">
            Add to Cart
          </span>
        </button>
      </div>
    </div>
  );
}
