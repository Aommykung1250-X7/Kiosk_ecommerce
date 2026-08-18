import React from "react";
import { ShoppingCartIcon } from "@heroicons/react/24/solid";
import { MagnifyingGlassIcon, XMarkIcon } from "@heroicons/react/24/outline";

export default function Header({
  cart = { totalPrice: 0, totalItems: 0 },
  onCartClick,
  searchQuery = "",
  onSearchChange = () => {},
}) {
  return (
    <header
      className="w-full h-[90px] bg-[#F9C338] flex items-center justify-between 
                 px-6 sm:px-8 gap-4 shrink-0 font-['Prompt'] shadow-xs"
    >
      {/* Left: Store name & Kiosk subtitle */}
      <div className="flex flex-col leading-tight min-w-0 shrink-0">
        <h1 className="text-2xl font-black text-black tracking-tight uppercase select-none">
          DITC SHOP
        </h1>
        <span className="text-xs font-black text-black/60 tracking-wider uppercase select-none">
          KIOSK
        </span>
      </div>

      {/* Center: Search Bar */}
      <div className="flex-1 max-w-md lg:max-w-xl mx-2">
        <div className="relative flex items-center w-full">
          <MagnifyingGlassIcon className="w-5 h-5 text-black/45 absolute left-4 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="ค้นหาสินค้า เช่น น้ำดื่ม, ขนม, ปากกา..."
            className="w-full h-12 bg-white/95 text-black placeholder:text-black/45 font-medium rounded-full pl-11 pr-10 border-2 border-black/10 focus:border-black focus:bg-white outline-none transition-all shadow-2xs text-sm"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              className="absolute right-3.5 p-1 text-black/40 hover:text-black rounded-full transition-colors cursor-pointer"
              title="ล้างคำค้นหา"
            >
              <XMarkIcon className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Right: Total Price & Cart Pill Button */}
      <div className="flex items-center gap-4 sm:gap-6 shrink-0">
        <div className="flex flex-col items-end leading-tight hidden xs:flex">
          <span className="text-[10px] font-black text-black/60 uppercase tracking-widest">
            TOTAL
          </span>
          <span className="text-xl sm:text-2xl font-black text-black mt-0.5 whitespace-nowrap">
            ฿{(cart.totalPrice || 0).toLocaleString("th-TH", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </span>
        </div>

        <button
          onClick={onCartClick}
          className="flex items-center gap-2.5 bg-[#1B1B1C] text-white px-4 sm:px-5 py-2.5 rounded-full font-black cursor-pointer hover:bg-black active:scale-[0.98] transition-all shadow-sm shrink-0"
        >
          <div className="relative">
            <ShoppingCartIcon className="w-5 h-5 text-white" />
            <span className="absolute -top-2 -right-2 bg-[#5EBAA8] text-white text-[10px] font-black w-4.5 h-4.5 rounded-full flex items-center justify-center border border-[#1B1B1C]">
              {cart.totalItems || 0}
            </span>
          </div>
          <span className="uppercase text-xs tracking-wider font-black hidden sm:inline">
            CART
          </span>
        </button>
      </div>
    </header>
  );
}
