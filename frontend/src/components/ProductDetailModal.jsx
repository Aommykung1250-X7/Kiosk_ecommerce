import { useState } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { ShoppingCartIcon } from "@heroicons/react/24/solid";

function CategoryPlaceholder({ category }) {
  const getIcon = () => {
    switch (category) {
      case "drinks":
        return (
          <svg className="w-16 h-16 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9V5.25c0-.414.168-.75.375-.75h3.75c.207 0 .375.336.375.75V9m-4.5 0h4.5m-4.5 0a3 3 0 0 1-3-3V3.75c0-.414.168-.75.375-.75h6.75c.207 0 .375.336.375.75V6a3 3 0 0 1-3 3M3.75 21h16.5M12 9v12m-5.25-6h10.5" />
          </svg>
        );
      case "snacks":
        return (
          <svg className="w-16 h-16 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" />
          </svg>
        );
      case "instant":
        return (
          <svg className="w-16 h-16 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
          </svg>
        );
      case "stationery":
        return (
          <svg className="w-16 h-16 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487Zm0 0L19.5 7.125" />
          </svg>
        );
      default:
        return (
          <svg className="w-16 h-16 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
          </svg>
        );
    }
  };

  return (
    <div className="flex flex-col items-center justify-center gap-1 opacity-60">
      {getIcon()}
      <span className="text-xs font-black text-gray-400 uppercase tracking-widest">{category || "Product"}</span>
    </div>
  );
}

export default function ProductDetailModal({ product, onClose, onAddToCart }) {
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  if (!product) return null;

  const { name, price, image, images, promotion, description, status, quantity } = product;
  const isOutOfStock = status === "In Stock" && quantity <= 0;

  const imagesList = Array.isArray(images) && images.length > 0 
    ? images 
    : (image && image.includes(".") ? [image] : []);

  const currentImg = imagesList[activeImageIndex] || image;

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
  const imgBg = bgColors[currentImg] || "bg-gray-50";

  const handlePrevImage = (e) => {
    e.stopPropagation();
    setActiveImageIndex(prev => (prev === 0 ? imagesList.length - 1 : prev - 1));
  };

  const handleNextImage = (e) => {
    e.stopPropagation();
    setActiveImageIndex(prev => (prev === imagesList.length - 1 ? 0 : prev + 1));
  };

  return (
    <div 
      className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity duration-300 font-['Prompt']"
      onClick={onClose}
    >
      {/* Modal Container */}
      <div 
        className="relative w-full max-w-lg bg-white rounded-[32px] border-2 border-[#1B1B1C] shadow-[8px_8px_0px_0px_#1B1B1C] overflow-hidden flex flex-col animate-in fade-in-50 zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white text-[#1B1B1C] hover:bg-gray-100 shadow-md border-2 border-[#1B1B1C] transition-colors cursor-pointer"
        >
          <XMarkIcon className="w-5 h-5" />
        </button>

        {/* Product Image Area / Carousel */}
        <div className={`w-full aspect-[8/5] ${imgBg} border-b-2 border-[#1B1B1C] relative overflow-hidden group`}>
          <div className="absolute inset-0 flex items-center justify-center p-10">
            <div className="w-full h-full max-w-[200px] flex items-center justify-center">
              {currentImg && currentImg.includes(".") ? (
                <img
                  src={currentImg.startsWith("/") || currentImg.startsWith("http") ? currentImg : `/uploads/products/${currentImg}`}
                  alt={name}
                  className="max-w-full max-h-full w-auto h-auto object-contain rounded-lg transition-all duration-300"
                />
              ) : (
                <CategoryPlaceholder category={product.category} />
              )}
            </div>
          </div>

          {/* Carousel Navigation Controls */}
          {imagesList.length > 1 && (
            <>
              <button
                type="button"
                onClick={handlePrevImage}
                className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 text-[#1B1B1C] border-2 border-[#1B1B1C] shadow-md flex items-center justify-center hover:bg-amber-400 active:scale-95 transition-all cursor-pointer z-10"
                title="รูปก่อนหน้า"
              >
                ◀
              </button>
              <button
                type="button"
                onClick={handleNextImage}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 text-[#1B1B1C] border-2 border-[#1B1B1C] shadow-md flex items-center justify-center hover:bg-amber-400 active:scale-95 transition-all cursor-pointer z-10"
                title="รูปถัดไป"
              >
                ▶
              </button>

              {/* Thumbnails indicator */}
              <div className="absolute bottom-3 inset-x-0 flex items-center justify-center gap-2 z-10">
                {imagesList.map((imgItem, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveImageIndex(idx);
                    }}
                    className={`w-3 h-3 rounded-full transition-all border border-[#1B1B1C] cursor-pointer ${
                      activeImageIndex === idx ? "bg-amber-400 scale-125" : "bg-white/80 hover:bg-white"
                    }`}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {/* Content Area */}
        <div className="p-8 flex flex-col gap-5">
          {/* Badges */}
          <div className="flex items-center gap-2">
            {promotion && (
              <span className="bg-[#F9C338] text-black text-[10px] font-black px-3 py-1.5 rounded-full border border-[#1B1B1C] tracking-wider uppercase">
                🏷️ PROMO
              </span>
            )}
            {status && (
              <span className={`text-[10px] font-black px-3 py-1.5 rounded-full border ${
                isOutOfStock
                  ? "bg-red-50 text-red-600 border-red-200"
                  : status === "In Stock"
                    ? "bg-[#E0F2F1]/60 text-[#00796B] border-[#80CBC4]/40"
                    : "bg-[#FFF3E0] text-[#E65100] border-[#FFE0B2]"
              }`}>
                {isOutOfStock ? "สินค้าหมด" : status === "In Stock" ? "พร้อมส่ง" : status}
              </span>
            )}
            {(product.purchaseLimit || product.purchase_limit) && (
              <span className="bg-red-50 text-red-600 text-[10px] font-black px-3 py-1.5 rounded-full border border-red-200 tracking-wider">
                จำกัดไม่เกิน {product.purchaseLimit || product.purchase_limit} ชิ้น
              </span>
            )}
          </div>

          {/* Title and Price */}
          <div className="flex flex-col gap-1.5 text-left">
            <h2 className="text-2xl font-black text-black leading-tight">
              {name}
            </h2>
            <div className="text-3xl font-black text-[#D99A1C] mt-1">
              ฿{price.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>

          <hr className="border-gray-200" />

          {/* Description */}
          <div className="flex flex-col gap-1.5 text-left">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
              รายละเอียดสินค้า
            </span>
            <p className="text-gray-600 text-sm leading-relaxed font-semibold">
              {description}
            </p>
            {product.status === "Pre-Order" && (product.preorderReleaseDate || product.preorder_release_date) && (
              <div className="mt-2 text-xs font-bold text-[#E65100] bg-[#FFF3E0] px-3.5 py-2 rounded-xl border border-[#FFE0B2]/50 w-fit">
                📦 วันที่ปล่อยสินค้าส่งมอบ: {(() => {
                  const d = new Date(product.preorderReleaseDate || product.preorder_release_date);
                  const day = String(d.getDate()).padStart(2, '0');
                  const month = String(d.getMonth() + 1).padStart(2, '0');
                  const year = d.getFullYear();
                  return `${day}/${month}/${year}`;
                })()}
              </div>
            )}
          </div>

          {/* Add to Cart Button */}
          <button
            disabled={isOutOfStock}
            onClick={() => {
              if (!isOutOfStock) {
                onAddToCart(product);
                onClose();
              }
            }}
            className={`mt-4 h-14 w-full rounded-2xl flex items-center justify-center gap-2 border-2 border-[#1B1B1C]
                       transition-all duration-150 font-black text-sm uppercase cursor-pointer ${
                         isOutOfStock
                           ? "bg-gray-100 text-gray-400 cursor-not-allowed border-gray-300"
                           : "bg-[#F9C338] text-black hover:bg-[#F2BD2B] active:scale-[0.98]"
                       }`}
          >
            <ShoppingCartIcon className="w-5 h-5" />
            <span>{isOutOfStock ? "สินค้าหมด" : "ใส่ตะกร้าสินค้า"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
