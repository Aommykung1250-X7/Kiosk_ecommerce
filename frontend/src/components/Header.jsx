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
      className="w-full h-[88px] bg-[#0E1B3E] flex items-center justify-between 
                 px-6 sm:px-8 gap-4 shrink-0 font-['Prompt'] shadow-md z-20"
    >
      {/* Left: DITC Logo */}
      <div className="flex items-center gap-3 shrink-0 select-none pl-1">
        <img
          src="/ditc_logo.png"
          alt="DITC"
          className="h-8 sm:h-9 w-auto object-contain mix-blend-screen"
        />
      </div>

      {/* Center: Search Bar */}
      <div className="flex-1 max-w-md lg:max-w-xl mx-2 sm:mx-6">
        <div className="relative flex items-center w-full">
          <MagnifyingGlassIcon className="w-5 h-5 text-gray-500 absolute left-4 pointer-events-none stroke-[2]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="ค้นหาสินค้า..."
            className="w-full h-11 bg-[#E8ECEF] text-gray-900 placeholder:text-gray-400 font-medium rounded-full pl-11 pr-10 border border-transparent focus:border-white focus:bg-white outline-none transition-all shadow-inner text-sm"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              className="absolute right-3.5 p-1 text-gray-400 hover:text-gray-700 rounded-full transition-colors cursor-pointer"
              title="ล้างคำค้นหา"
            >
              <XMarkIcon className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Right: Total Price & Cart Pill Button */}
      <div className="flex items-center gap-4 sm:gap-6 shrink-0">
        <div className="flex flex-col items-end leading-tight select-none">
          <span className="text-[10px] font-semibold text-white/80 uppercase tracking-widest">
            TOTAL
          </span>
          <span className="text-lg sm:text-xl font-medium text-white whitespace-nowrap">
            ฿{(cart.totalPrice || 0).toLocaleString("th-TH", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </span>
        </div>

        <button
          type="button"
          onClick={onCartClick}
          className="flex items-center gap-2 bg-[#FABE2C] hover:bg-[#F5B41C] text-white px-4 sm:px-5 py-2.5 rounded-full font-bold cursor-pointer active:scale-[0.98] transition-all shadow-md shrink-0 select-none"
        >
          <div className="relative flex items-center">
            <ShoppingCartIcon className="w-5 h-5 text-white" />
            {(cart.totalItems || 0) > 0 && (
              <span className="absolute -top-2.5 -right-2.5 bg-[#20C997] text-white text-[10px] font-bold min-w-4 h-4 px-1 rounded-full flex items-center justify-center border-2 border-[#FABE2C] shadow-xs">
                {cart.totalItems}
              </span>
            )}
          </div>
          <span className="uppercase text-xs tracking-wider font-bold text-white">
            CART
          </span>
        </button>
      </div>
    </header>
  );
}

