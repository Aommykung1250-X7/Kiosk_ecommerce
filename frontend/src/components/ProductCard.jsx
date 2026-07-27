import { ShoppingCartIcon } from "@heroicons/react/24/solid";

function WaterDrop() {
  return (
    <svg viewBox="0 0 100 100" className="w-20 h-20">
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
    <svg viewBox="0 0 120 160" className="w-20 h-26">
      {/* Cup body with pink/red stripes */}
      <path d="M35 50 L85 50 L77 140 L43 140 Z" fill="#EAEAEA" />
      <path d="M48 50 L54 50 L57 140 L51 140 Z" fill="#EC4E63" />
      <path d="M66 50 L72 50 L69 140 L63 140 Z" fill="#EC4E63" />
      {/* Lid */}
      <ellipse cx="60" cy="50" rx="27" ry="8" fill="#FFFFFF" stroke="#D1D1D6" strokeWidth="1" />
      <rect x="52" y="42" width="16" height="6" rx="2" fill="#FFFFFF" stroke="#D1D1D6" strokeWidth="1" />
      {/* Straw */}
      <path d="M57 42 L57 20 L75 20" stroke="#EC4E63" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d="M57 42 L57 20 L75 20" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.3" />
    </svg>
  );
}

function ChipsBag() {
  return (
    <svg viewBox="0 0 100 120" className="w-18 h-22">
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
    <svg viewBox="0 0 100 120" className="w-18 h-22">
      <path d="M20 20 L80 20 L90 105 L10 105 Z" fill="#4285F4" />
      <path d="M20 20 L28 10 L72 10 L80 20 Z" fill="#2A6CD6" />
      <path d="M10 105 L20 115 L80 115 L90 105 Z" fill="#2A6CD6" />
      <rect x="30" y="50" width="40" height="30" rx="3" fill="#FFD600" />
    </svg>
  );
}

function CupNoodle() {
  return (
    <svg viewBox="0 0 100 120" className="w-18 h-22">
      <path d="M25 35 L75 35 L68 105 L32 105 Z" fill="#EA4335" />
      <ellipse cx="50" cy="35" rx="25" ry="8" fill="#F1F3F4" />
      <ellipse cx="50" cy="31" rx="25" ry="8" fill="#FFFFFF" />
      <rect x="35" y="55" width="30" height="15" rx="2" fill="#F4B400" />
    </svg>
  );
}

function MiloBox() {
  return (
    <svg viewBox="0 0 100 120" className="w-16 h-22">
      <rect x="25" y="15" width="50" height="90" rx="4" fill="#0F9D58" />
      <rect x="25" y="15" width="50" height="20" rx="4" fill="#0B8043" />
      <circle cx="50" cy="65" r="14" fill="#F4B400" />
    </svg>
  );
}

function Pen() {
  return (
    <svg viewBox="0 0 100 120" className="w-12 h-24">
      <rect x="44" y="15" width="12" height="75" rx="6" fill="#4285F4" />
      <rect x="44" y="15" width="12" height="15" rx="3" fill="#1A73E8" />
      <polygon points="44,90 56,90 50,110" fill="#3C4043" />
    </svg>
  );
}

function Notebook() {
  return (
    <svg viewBox="0 0 100 120" className="w-18 h-22">
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

export default function ProductCard({ product, onAddToCart, onSelectProduct, isMostViewed }) {
  const { name, price, image, promotion, status, quantity } = product;
  const Illustration = ILLUSTRATIONS[image] || WaterDrop;
  const isOutOfStock = status === "In Stock" && quantity <= 0;

  const bgColors = {
    water: "bg-[#E9F4FA]",
    cola: "bg-[#FDF1F0]",
    chips: "bg-[#FEF9EB]",
    wafer: "bg-[#FFF5F3]",
    noodle: "bg-[#FFF3E6]",
    milo: "bg-[#EDF7EE]",
    pen: "bg-[#F1F0FA]",
    notebook: "bg-[#FBF6EB]",
  };
  const imgBg = bgColors[image] || "bg-gray-50";

  const getSubText = (prod) => {
    if (prod.image === "water") return "600ml • Mineral Water";
    if (prod.image === "cola") return "325ml • Soft Drink";
    if (prod.image === "chips") return "Original • Snack";
    if (prod.image === "wafer") return "Cheese • Wafer";
    if (prod.image === "noodle") return "Cup • Instant Noodles";
    if (prod.image === "milo") return "180ml • Malt Drink";
    if (prod.image === "pen") return "0.5mm • Blue ink";
    if (prod.image === "notebook") return "Grid • Notebook";
    return "Product";
  };
  const subText = getSubText(product);

  const getMaxStock = (prod) => {
    if (prod.id === 1) return 20;
    if (prod.id === 2) return 24;
    if (prod.id === 6) return 24;
    return 20;
  };
  const maxStock = getMaxStock(product);
  const stockPercent = Math.min(100, Math.max(0, Math.round((quantity / maxStock) * 100)));

  return (
    <div
      onClick={() => {
        if (!isOutOfStock) {
          onSelectProduct(product);
        }
      }}
      className={`w-full bg-white rounded-[24px] border-2 border-black/90 
                 shadow-[0_4px_16px_rgba(0,0,0,0.06)] flex flex-col overflow-hidden relative 
                 transition-all duration-200 cursor-pointer hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(0,0,0,0.1)] font-['Prompt']
                 ${isOutOfStock ? "opacity-90" : ""}`}
    >
      {/* Hot badge */}
      {isMostViewed && (
        <div className="absolute top-2.5 left-2.5 z-10 bg-[#FF5252] text-white text-[9px] font-black px-2 py-0.5 rounded-full flex items-center gap-0.5 uppercase tracking-wider shadow-xs">
          🔥 Hot
        </div>
      )}

      {/* Promo badge */}
      {promotion && !isMostViewed && (
        <div className="absolute top-2.5 left-2.5 z-10 bg-[#F9C338] text-black text-[9px] font-black px-2 py-0.5 rounded-full flex items-center gap-0.5 uppercase tracking-wider border border-black/20 shadow-xs">
          🏷️ Promo
        </div>
      )}

      {/* Status Badge matching home.jpg */}
      <div
        className={`absolute top-2.5 right-2.5 z-10 text-[9px] font-black px-2 py-0.5 rounded-full ${
          isOutOfStock
            ? "bg-red-50 text-[#FF5252]"
            : status === "In Stock" || status === "Ready"
              ? "bg-[#E0F2F1] text-[#00796B]"
              : "bg-[#FFF3E0] text-[#E65100]"
        }`}
      >
        {isOutOfStock ? "Out of stock" : "Ready"}
      </div>

      {/* Image Area */}
      <div className="w-full aspect-[8/5] bg-white flex items-center justify-center p-3 border-b-2 border-black/90 relative">
        <div className={`w-full h-full flex items-center justify-center ${isOutOfStock ? "opacity-40 grayscale" : ""}`}>
          <Illustration />
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 flex flex-col px-3.5 py-3 gap-2.5 text-left min-w-0">
        <div className="min-w-0">
          <h3 className="text-sm font-black text-black leading-tight truncate">
            {name}
          </h3>
          <p className="text-[11px] font-semibold text-gray-400 mt-0.5 truncate">
            {subText || "Small detail"}
          </p>
        </div>

        {/* Price Box matching home.jpg */}
        <div className="bg-[#F4F4F6] rounded-xl px-3 py-2 flex items-center justify-between w-full min-w-0">
          <span className="text-xs font-black text-[#8E8E93] uppercase tracking-wider">PRICE</span>
          <span className="text-lg font-black text-[#F9C338]">
            ฿{price.toFixed(0)}
          </span>
        </div>

        {/* Add to Cart Button matching home.jpg */}
        <button
          disabled={isOutOfStock}
          onClick={(e) => {
            e.stopPropagation();
            onAddToCart(product);
          }}
          className={`h-10 w-full rounded-xl flex items-center justify-center gap-1.5 border-2 border-black/90
                     transition-all duration-150 shrink-0 font-extrabold text-[11px] uppercase cursor-pointer select-none whitespace-nowrap px-1 ${
                       isOutOfStock
                         ? "bg-[#E5E5E7] text-[#8E8E93] border-[#D1D1D6] cursor-not-allowed"
                         : "bg-[#F9C338] text-black hover:bg-[#F2BD2B] active:scale-[0.98] shadow-xs"
                     }`}
        >
          <ShoppingCartIcon className="w-3.5 h-3.5 shrink-0" />
          <span>{isOutOfStock ? "OUT OF STOCK" : "ADD TO CART"}</span>
        </button>
      </div>
    </div>
  );
}
