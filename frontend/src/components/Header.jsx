import { ShoppingCartIcon } from "@heroicons/react/24/solid";

export default function Header({ cart = { totalPrice: 0, totalItems: 0 }, onCartClick }) {
  return (
    <header
      className="w-full h-[90px] bg-[#F9C338] flex items-center justify-between 
                 px-8 shrink-0 font-['Prompt']"
    >
      {/* Left: Store name & Kiosk subtitle */}
      <div className="flex flex-col leading-tight min-w-0">
        <h1 className="text-2xl font-black text-black tracking-tight uppercase">
          DITC SHOP
        </h1>
        <span className="text-xs font-black text-black/60 tracking-wider uppercase">
          KIOSK
        </span>
      </div>

      {/* Right: Total Price & Cart Pill Button */}
      <div className="flex items-center gap-6 shrink-0">
        <div className="flex flex-col items-end leading-tight">
          <span className="text-[10px] font-black text-black/60 uppercase tracking-widest">
            TOTAL
          </span>
          <span className="text-2xl font-black text-black mt-0.5">
            ฿{(cart.totalPrice || 0).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>

        <button
          onClick={onCartClick}
          className="flex items-center gap-2.5 bg-[#1B1B1C] text-white px-5 py-2.5 rounded-full font-black cursor-pointer hover:bg-black active:scale-[0.98] transition-all shadow-sm"
        >
          <div className="relative">
            <ShoppingCartIcon className="w-5 h-5 text-white" />
            <span className="absolute -top-2 -right-2 bg-[#5EBAA8] text-white text-[10px] font-black w-4.5 h-4.5 rounded-full flex items-center justify-center border border-[#1B1B1C]">
              {cart.totalItems || 0}
            </span>
          </div>
          <span className="uppercase text-xs tracking-wider font-black">
            CART
          </span>
        </button>
      </div>
    </header>
  );
}

