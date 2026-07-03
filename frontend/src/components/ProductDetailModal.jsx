// src/components/ProductDetailModal.jsx
import { XMarkIcon } from "@heroicons/react/24/outline";
import { ShoppingCartIcon, TagIcon } from "@heroicons/react/24/solid";

// Re-using flat minimal SVG illustrations for details view.
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

// Visual SVG representing a generic pen
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

// Visual SVG representing a spiral notebook
function Notebook() {
  return (
    <svg viewBox="0 0 120 160" className="w-full h-full">
      <rect x="28" y="20" width="64" height="112" rx="8" fill="#F7C531" />
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <circle key={i} cx="28" cy="34 + i * 17" r="4" fill="#FFFFFF" stroke="#E8A800" strokeWidth="2" />
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

export default function ProductDetailModal({ product, onClose, onAddToCart }) {
  if (!product) return null;

  const { name, price, image, promotion, description, pickupLocation, status } = product;
  const Illustration = ILLUSTRATIONS[image] || WaterBottle;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity duration-300 font-['Prompt']"
      onClick={onClose}
    >
      {/* Modal Container */}
      <div 
        className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in-50 zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/80 hover:bg-white text-[#2B2B2B]/60 hover:text-[#2B2B2B] shadow-md border border-gray-100 transition-colors"
        >
          <XMarkIcon className="w-6 h-6" />
        </button>

        {/* Product Image Area */}
        <div className="w-full aspect-[8/5] bg-gray-50 flex items-center justify-center p-12 border-b border-gray-100">
          <div className="w-full h-full max-w-[200px] flex items-center justify-center">
            <Illustration />
          </div>
        </div>

        {/* Content Area */}
        <div className="p-8 flex flex-col gap-6">
          {/* Badges */}
          <div className="flex items-center gap-2">
            {promotion && (
              <span className="flex items-center gap-1 bg-[#F8C032] text-[#2B2B2B] text-xs font-bold px-3 py-1 rounded-full shadow-sm">
                <TagIcon className="w-3.5 h-3.5" />
                PROMO
              </span>
            )}
            {status && (
              <span className={`text-xs font-bold px-3 py-1 rounded-full border shadow-sm ${
                status === "In Stock"
                  ? "bg-[#E8F5E9] text-[#2E7D32] border-[#C8E6C9]"
                  : "bg-[#FFF3E0] text-[#E65100] border-[#FFE0B2]"
              }`}>
                {status}
              </span>
            )}
          </div>

          {/* Title and Price */}
          <div className="flex flex-col gap-2">
            <h2 className="text-2xl font-bold text-[#2B2B2B] leading-tight">
              {name}
            </h2>
            <div className="text-3xl font-extrabold text-[#E53935]">
              ฿{price.toFixed(0)}
            </div>
          </div>

          <hr className="border-gray-100" />

          {/* Description */}
          <div className="flex flex-col gap-2">
            <span className="text-xs font-bold text-[#2B2B2B]/40 uppercase tracking-wider">
              รายละเอียดสินค้า
            </span>
            <p className="text-[#2B2B2B]/80 text-sm leading-relaxed font-normal">
              {description}
            </p>
          </div>


          {/* Add to Cart Button */}
          <button
            onClick={() => {
              onAddToCart(product);
              onClose();
            }}
            className="mt-4 h-14 w-full rounded-2xl bg-[#F8C032] hover:bg-[#F0B420] active:scale-[0.97]
                       flex items-center justify-center gap-2 transition-transform duration-150 shadow-md font-semibold text-lg text-[#2B2B2B]"
          >
            <ShoppingCartIcon className="w-6 h-6 text-[#2B2B2B]" />
            ใส่ตะกร้าสินค้า
          </button>
        </div>
      </div>
    </div>
  );
}
