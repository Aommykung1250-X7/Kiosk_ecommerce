import { ShoppingCartIcon } from "@heroicons/react/24/solid";

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

export default function Header({ cart = { totalPrice: 0, totalItems: 0 }, onCartClick }) {
  return (
    <header
      className="w-full h-[100px] bg-[#F9C338] border-b border-black/10 flex items-center justify-between 
                 px-[clamp(16px,2.5vw,40px)] shrink-0 font-['Prompt'] shadow-sm"
    >
      {/* Left: Store name + Subtitle matching home.jpg */}
      <div className="flex flex-col leading-tight min-w-0">
        <span className="text-[clamp(22px,2.5vw,28px)] font-black text-black tracking-tight uppercase">
          DITC SHOP
        </span>
        <span className="text-[11px] font-bold text-black/70 tracking-widest uppercase mt-0.5">
          KIOSK
        </span>
      </div>

      {/* Right: Total Price & Cart Button */}
      <div className="flex items-center gap-5 shrink-0">
        <div className="flex flex-col items-end leading-tight">
          <span className="text-[10px] font-black text-black/70 uppercase tracking-widest">
            TOTAL
          </span>
          <span className="text-[clamp(20px,2.4vw,28px)] font-black text-black mt-0.5">
            ฿{(cart.totalPrice || 0).toFixed(2)}
          </span>
        </div>

        <button
          onClick={onCartClick}
          className="flex items-center gap-2.5 bg-[#1B1B1C] hover:bg-black text-white px-5 py-3 rounded-2xl font-black cursor-pointer active:scale-[0.97] transition-all shadow-sm"
        >
          <div className="relative">
            <ShoppingCartIcon className="w-5 h-5 text-white" />
            <span className="absolute -top-2.5 -right-2.5 bg-[#5EBAA8] text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-[#1B1B1C]">
              {cart.totalItems || 0}
            </span>
          </div>
          <span className="uppercase text-xs tracking-widest font-black">
            CART
          </span>
        </button>
      </div>
    </header>
  );
}

