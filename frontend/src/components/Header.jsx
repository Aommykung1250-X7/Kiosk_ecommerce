import { ShoppingCartIcon, MagnifyingGlassIcon, XMarkIcon } from "@heroicons/react/24/solid";

function DiamondLogo() {
  return (
    <svg viewBox="0 0 64 64" className="w-7 h-7 text-[#F9C338]">
      <rect
        x="18"
        y="18"
        width="28"
        height="28"
        rx="2"
        transform="rotate(45 32 32)"
        fill="none"
        stroke="currentColor"
        strokeWidth="4"
      />
    </svg>
  );
}

export default function Header({
  cart = { totalPrice: 0, totalItems: 0 },
  onCartClick,
  searchQuery = "",
  onSearchChange
}) {
  return (
    <header
      className="w-full h-[88px] bg-white border-b border-gray-150 flex items-center justify-between 
                 px-4 shrink-0 font-['Prompt'] gap-2"
    >
      {/* Left: Logo + Store name */}
      <div className="flex items-center gap-3 shrink-0">
        <div
          className="w-12 h-12 rounded-2xl bg-[#1B1B1C] flex items-center 
                     justify-center shrink-0 shadow-sm"
        >
          <DiamondLogo />
        </div>
        <div className="hidden sm:flex flex-col leading-tight min-w-0">
          <span className="text-[clamp(16px,1.8vw,22px)] font-black text-[#1B1B1C] tracking-tight uppercase">
            DITC SHOP
          </span>
          <span className="text-[10px] font-extrabold text-gray-400 tracking-wider uppercase">
            Smart Retail Kiosk
          </span>
        </div>
      </div>

      {/* Center: Search Bar */}
      <div className="flex-1 max-w-sm lg:max-w-md mx-2 relative">
        <div className="relative flex items-center">
          <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 absolute left-3.5 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
            placeholder="ค้นหาชื่อสินค้า หมวดหมู่ หรือคำสำคัญ..."
            className="w-full bg-[#F3F4F6] text-[#1B1B1C] placeholder-gray-400 text-sm font-medium pl-10 pr-10 py-2.5 rounded-2xl border border-transparent focus:border-[#5EBAA8] focus:bg-white focus:outline-none transition-all shadow-inner"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange && onSearchChange("")}
              className="absolute right-2.5 p-1 rounded-full text-gray-400 hover:text-black hover:bg-gray-200 transition-colors"
              title="ล้างคำค้นหา"
            >
              <XMarkIcon className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Right: Total Price & Cart Button */}
      <div className="flex items-center gap-4 sm:gap-6 shrink-0">
        <div className="flex flex-col items-end leading-tight">
          <span className="text-[10px] font-black text-black/70 uppercase tracking-widest">
            TOTAL
          </span>
          <span className="text-[clamp(16px,2vw,24px)] font-black text-black mt-0.5">
            ฿{(cart.totalPrice || 0).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>

        <button
          onClick={onCartClick}
          className="flex items-center gap-2 bg-[#1B1B1C] text-white px-4 sm:px-5 py-3 rounded-2xl font-bold cursor-pointer hover:bg-black active:scale-[0.98] transition-all"
        >
          <div className="relative">
            <ShoppingCartIcon className="w-5 h-5 text-white" />
            <span className="absolute -top-2.5 -right-2.5 bg-[#5EBAA8] text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-[#1B1B1C]">
              {cart.totalItems || 0}
            </span>
          </div>
          <span className="uppercase text-xs tracking-widest font-black hidden sm:inline">
            Cart
          </span>
        </button>
      </div>
    </header>
  );
}

