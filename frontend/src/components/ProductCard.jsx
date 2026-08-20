import React from "react";
import { TagIcon } from "@heroicons/react/24/solid";

function CategoryPlaceholder({ category }) {
  return (
    <div className="flex flex-col items-center justify-center gap-1 opacity-40">
      <svg className="w-12 h-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
      </svg>
      <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{category || "PRODUCT"}</span>
    </div>
  );
}

export default function ProductCard({ product, onAddToCart, onSelectProduct, isMostViewed }) {
  const { name, price, image, promotion, status, quantity, category } = product;
  const isOutOfStock = status === "In Stock" && (quantity === undefined || quantity <= 0);

  // Subtitle category label
  const getCategoryLabel = () => {
    const cat = String(category || "").toLowerCase();
    if (cat === "drinks") return "LOCAL EXPRESS";
    if (cat === "snacks") return "LOCAL EXPRESS";
    if (cat === "stationery") return "LOCAL EXPRESS";
    if (cat === "souvenirs" || cat === "merchandise") return "LOCAL EXPRESS";
    return "LOCAL EXPRESS";
  };

  return (
    <div
      onClick={() => onSelectProduct(product)}
      className="group cursor-pointer select-none flex flex-col w-full font-['Prompt'] transition-all"
    >
      {/* 1. Large Rounded Grey Image Box */}
      <div className="w-full aspect-square bg-[#F4F5F7] group-hover:bg-[#ECEEF2] rounded-[28px] sm:rounded-[10px] p-5 sm:p-6 relative flex items-center justify-center overflow-hidden transition-colors duration-200">
        {/* Top-Right Badge matching mockup */}
        {isOutOfStock ? (
          <div className="absolute top-3 right-3 z-10 bg-[#F85153] text-white text-[10px] font-medium px-2.5 py-0.5 rounded-full shadow-xs tracking-wide">
            SOLD OUT
          </div>
        ) : isMostViewed ? (
          /* Comic Speech Bubble HOT badge */
          <div className="absolute top-3 right-3 z-10 select-none">
            <svg className="w-8 h-7 drop-shadow-xs" viewBox="0 0 36 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M4 2h28a2 2 0 0 1 2 2v18a2 2 0 0 1-2 2H12l-6 5v-5H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z" fill="#FFFFFF" stroke="#000000" strokeWidth="2.2" strokeLinejoin="round"/>
              <text x="18" y="16" fill="#000000" fontSize="9.5" fontWeight="700" textAnchor="middle" dominantBaseline="middle" fontFamily="'Prompt', sans-serif" letterSpacing="0.5">HOT</text>
            </svg>
          </div>
        ) : promotion ? (
          <div className="absolute top-3 right-3 z-10 bg-[#FF6B00] text-white text-[10px] font-medium px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-xs tracking-wide">
            <TagIcon className="w-3 h-3 text-white" />
            <span>PROMO</span>
          </div>
        ) : status === "Pre-Order" ? (
          <div className="absolute top-3 right-3 z-10 bg-[#F5A623] text-white text-[10px] font-medium px-2.5 py-0.5 rounded-full shadow-xs tracking-wide">
            PRE-ORDER
          </div>
        ) : (
          <div className="absolute top-3 right-3 z-10 bg-[#1CD0A2] text-white text-[10px] font-medium px-2.5 py-0.5 rounded-full shadow-xs tracking-wide">
            In-stock
          </div>
        )}

        {/* Product Image */}
        <div className={`w-full h-full flex items-center justify-center ${isOutOfStock ? "opacity-40 grayscale" : ""}`}>
          {image && image.includes(".") ? (
            <img
              src={`/uploads/products/${image}`}
              alt={name}
              className="max-w-full max-h-full w-auto h-auto object-contain transition-transform duration-200 group-hover:scale-105 drop-shadow-xs"
            />
          ) : (
            <CategoryPlaceholder category={category} />
          )}
        </div>
      </div>

      {/* 2. Text Details Below Image */}
      <div className="flex flex-col mt-2 px-1 text-left">
        {/* Subtitle */}
        <span className="text-[10px] sm:text-[11px] font-normal text-gray-400 uppercase tracking-wider truncate">
          {getCategoryLabel()}
        </span>

        {/* Product Name */}
        <h3
          className="text-xs sm:text-[13px] font-normal text-gray-800 line-clamp-2 leading-snug mt-0.5 min-h-[2.2rem]"
          title={name}
        >
          {name}
        </h3>

        {/* Price & Stock Row */}
        <div className="flex items-center justify-between mt-1 pt-0.5">
          <span className="text-sm sm:text-base font-medium text-gray-900 tracking-tight">
            ฿{(price || 0).toLocaleString("th-TH", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </span>

          <span
            className={`text-xs font-normal ${
              isOutOfStock
                ? "text-red-500 font-medium"
                : status === "Pre-Order"
                ? "text-[#E65100] font-medium"
                : "text-gray-700"
            }`}
          >
            {isOutOfStock
              ? "สินค้าหมด"
              : status === "Pre-Order"
              ? "พรีออเดอร์"
              : `เหลือ ${quantity || 0} ชิ้น`}
          </span>
        </div>
      </div>
    </div>
  );
}

