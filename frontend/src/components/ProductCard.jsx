import React from "react";

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

export default function ProductCard({ product, onAddToCart, onSelectProduct, isHot }) {
  const { name, price, originalPrice, discountType, discountValue, discountAmount, image, status, quantity, category } = product;
  const isOutOfStock = status === "In Stock" && (quantity === undefined || quantity <= 0);
  // ส่วนลดจากหลังบ้าน — price คือราคาหลังลดแล้ว
  const isDiscounted = discountAmount > 0 && originalPrice > price;

  const handleClick = () => {
    if (!isOutOfStock && onSelectProduct) {
      onSelectProduct(product);
    }
  };

  return (
    <div
      onClick={handleClick}
      className={`group select-none flex flex-col w-full font-['DIN_Pro_Cond',_'Prompt',_sans-serif] transition-all ${
        isOutOfStock ? "cursor-not-allowed opacity-90" : "cursor-pointer"
      }`}
    >
      {/* 1. Rounded Grey Image Box (มุมโค้ง 10px) */}
      <div className="w-full aspect-square bg-[#F4F5F7] group-hover:bg-[#ECEEF2] rounded-[10px] p-5 sm:p-6 relative flex items-center justify-center overflow-hidden transition-colors duration-200">
        {/* Top-Left HOT NOW Badge — สินค้าขายดีที่สุดที่ยังมีของ
            เช็ค isOutOfStock ซ้ำอีกชั้น กันป้ายไปโผล่ซ่อนอยู่ใต้แถบ SOLD OUT */}
        {isHot && !isOutOfStock && (
          <div className="absolute top-2.5 left-0 z-10 bg-[#F85153] text-white text-[10px] font-extrabold px-2 py-0.5 rounded-r-[3px] uppercase tracking-wider shadow-xs">
            HOT NOW
          </div>
        )}

        {/* Top-Right Status Badge (Hidden when sold out) */}
        {!isOutOfStock && (
          status === "Pre-Order" ? (
            <div className="absolute top-2.5 right-2.5 z-10 bg-[#F5A623] text-white text-[10px] font-medium px-2.5 py-0.5 rounded-full shadow-xs tracking-wide">
              PRE-ORDER
            </div>
          ) : (
            <div className="absolute top-2.5 right-2.5 z-10 bg-[#1CD0A2] text-white text-[10px] font-medium px-2.5 py-0.5 rounded-full shadow-xs tracking-wide">
              In-stock
            </div>
          )
        )}

        {/* Diagonal SOLD OUT Banner across the center when out of stock */}
        {isOutOfStock && (
          <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
            <div className="bg-[#EF4444] text-white text-sm sm:text-base font-black px-5 py-1.5 rounded-xl shadow-lg -rotate-12 tracking-widest uppercase border-2 border-white">
              SOLD OUT
            </div>
          </div>
        )}

        {/* Product Image */}
        <div className={`w-full h-full flex items-center justify-center ${isOutOfStock ? "opacity-35 grayscale" : ""}`}>
          {image && image.includes(".") ? (
            <img
              src={`/uploads/products/${image}`}
              alt={name}
              className={`max-w-full max-h-full w-auto h-auto object-contain transition-transform duration-200 drop-shadow-xs ${
                isOutOfStock ? "" : "group-hover:scale-105"
              }`}
            />
          ) : (
            <CategoryPlaceholder category={category} />
          )}
        </div>
      </div>

      {/* 2. Text Details Below Image */}
      <div className="flex flex-col mt-2 px-1 text-left">
        {/* Product Name */}
        <h3
          className="text-xs sm:text-[13px] font-normal text-gray-800 line-clamp-2 leading-snug mt-0.5 min-h-[2.2rem]"
          title={name}
        >
          {name}
        </h3>

        {/* Price & Stock Row */}
        <div className="flex items-center justify-between mt-1 pt-0.5">
          <span className="flex items-baseline gap-1.5 min-w-0">
            <span className={`text-sm sm:text-base font-medium tracking-tight ${isDiscounted ? "text-[#E01E5A]" : "text-gray-900"}`}>
              ฿{(price || 0).toLocaleString("th-TH", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
            {isDiscounted && (
              <span className="text-[10px] sm:text-[11px] text-gray-400 line-through">
                ฿{originalPrice.toLocaleString("th-TH", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            )}
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

