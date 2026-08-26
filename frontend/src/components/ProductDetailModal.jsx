import { useState, useEffect } from "react";
import { TagIcon, ShoppingCartIcon } from "@heroicons/react/24/solid";
import { notify } from "./notify";

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

export default function ProductDetailModal({
  product,
  allProducts = [],
  onSelectProduct,
  onClose,
  onAddToCart
}) {
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [qty, setQty] = useState(1);
  const [otherPageIndex, setOtherPageIndex] = useState(0);

  // Reset states whenever active product changes
  useEffect(() => {
    setQty(1);
    setActiveImageIndex(0);
    setOtherPageIndex(0);
  }, [product?.id]);

  if (!product) return null;

  const { name, price, originalPrice, discountType, discountValue, discountAmount, image, images, status, quantity, category, description } = product;
  // ส่วนลดจากหลังบ้าน — price คือราคาหลังลดแล้ว
  const isDiscounted = discountAmount > 0 && originalPrice > price;
  // ลดเป็นบาทให้โชว์ "-฿50" ลดเป็นเปอร์เซ็นต์ให้โชว์ "-15%"
  const discountLabel =
    discountType === "amount"
      ? `-฿${discountValue.toLocaleString("th-TH")}`
      : `-${discountValue}%`;
  const isOutOfStock = status === "In Stock" && (quantity === undefined || quantity <= 0);
  const purchaseLimit = Number(product.purchaseLimit || product.purchase_limit) || 0;

  const imagesList = Array.isArray(images) && images.length > 0
    ? images
    : (image && image.includes(".") ? [image] : []);

  const currentImg = imagesList[activeImageIndex] || image;

  // Filter products in the SAME category (excluding current product)
  const currentCat = product.category_id || product.category;
  const sameCategoryProducts = allProducts.filter(
    (p) => p.id !== product.id && ((p.category_id && p.category_id === currentCat) || (p.category && p.category === currentCat))
  );
  const otherProducts = sameCategoryProducts.length > 0
    ? sameCategoryProducts
    : allProducts.filter((p) => p.id !== product.id);
  const maxOtherIndex = Math.max(0, otherProducts.length - 3);

  const [touchStartX, setTouchStartX] = useState(null);
  const [touchDeltaX, setTouchDeltaX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const handlePrevOther = (e) => {
    e?.stopPropagation();
    if (otherProducts.length <= 3) return;
    setOtherPageIndex((prev) => (prev <= 0 ? maxOtherIndex : prev - 1));
  };

  const handleNextOther = (e) => {
    e?.stopPropagation();
    if (otherProducts.length <= 3) return;
    setOtherPageIndex((prev) => (prev >= maxOtherIndex ? 0 : prev + 1));
  };

  const handleTouchStart = (e) => {
    setTouchStartX(e.touches ? e.touches[0].clientX : e.clientX);
    setTouchDeltaX(0);
    setIsDragging(true);
  };

  const handleTouchMove = (e) => {
    if (!isDragging || touchStartX === null) return;
    const currentX = e.touches ? e.touches[0].clientX : e.clientX;
    setTouchDeltaX(currentX - touchStartX);
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;
    if (touchDeltaX < -40) {
      handleNextOther();
    } else if (touchDeltaX > 40) {
      handlePrevOther();
    }
    setTouchStartX(null);
    setTouchDeltaX(0);
    setIsDragging(false);
  };

  const getCategoryLabel = () => {
    return category ? String(category).toUpperCase() : "LOCAL EXPRESS";
  };

  const handlePrevImage = (e) => {
    e?.stopPropagation();
    if (imagesList.length <= 1) return;
    setActiveImageIndex((prev) => (prev === 0 ? imagesList.length - 1 : prev - 1));
  };

  const handleNextImage = (e) => {
    e?.stopPropagation();
    if (imagesList.length <= 1) return;
    setActiveImageIndex((prev) => (prev === imagesList.length - 1 ? 0 : prev + 1));
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/65 backdrop-blur-sm transition-opacity duration-200 font-['DIN_Pro_Cond',_'Prompt',_sans-serif]"
      onClick={onClose}
    >
      {/* Modal Card matching mockup */}
      <div
        className="relative w-[92%] max-w-[460px] bg-white rounded-[36px] sm:rounded-[40px] pt-13 sm:pt-14 pb-6 sm:pb-7 px-6 sm:px-7 flex flex-col shadow-2xl overflow-hidden animate-in fade-in-50 zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Red Circle Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3.5 right-4 sm:top-4 sm:right-5 z-20 w-7 h-7 bg-[#F85153] hover:bg-[#e04547] text-white rounded-full flex items-center justify-center font-bold text-xs shadow-md cursor-pointer transition-all active:scale-90 select-none"
          title="ปิด"
        >
          ✕
        </button>

        {/* 1. Main Product Image Box */}
        <div className="w-full aspect-[4/3] bg-[#F4F5F7] rounded-[28px] relative flex items-center justify-center p-6 overflow-hidden select-none">
          {/* Purchase Limit Badge on top-left */}
          {purchaseLimit > 0 && (
            <div className="absolute top-3.5 left-3.5 z-10 bg-[#E53935] text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-xs tracking-wide flex items-center gap-1">
              <span>จำกัด {purchaseLimit} ชิ้น</span>
            </div>
          )}

          {/* Badges */}
          {isOutOfStock ? (
            <div className="absolute top-3.5 right-3.5 z-10 bg-[#F85153] text-white text-[10px] font-medium px-2.5 py-0.5 rounded-full shadow-xs tracking-wide">
              SOLD OUT
            </div>
          ) : status === "Pre-Order" ? (
            <div className="absolute top-3.5 right-3.5 z-10 bg-[#F5A623] text-white text-[10px] font-medium px-2.5 py-0.5 rounded-full shadow-xs tracking-wide">
              PRE-ORDER
            </div>
          ) : (
            <div className="absolute top-3.5 right-3.5 z-10 bg-[#1CD0A2] text-white text-[10px] font-medium px-2.5 py-0.5 rounded-full shadow-xs tracking-wide">
              In-stock
            </div>
          )}

          {/* Left / Right Arrow Buttons */}
          {imagesList.length > 1 && (
            <>
              <button
                type="button"
                onClick={handlePrevImage}
                className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/10 hover:bg-black/20 text-gray-700 flex items-center justify-center cursor-pointer transition-all active:scale-90 text-xs font-bold z-10"
                title="รูปก่อนหน้า"
              >
                ◀
              </button>
              <button
                type="button"
                onClick={handleNextImage}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/10 hover:bg-black/20 text-gray-700 flex items-center justify-center cursor-pointer transition-all active:scale-90 text-xs font-bold z-10"
                title="รูปถัดไป"
              >
                ▶
              </button>
            </>
          )}

          {/* Product Image */}
          <div className="w-full h-full flex items-center justify-center">
            {currentImg && currentImg.includes(".") ? (
              <img
                src={currentImg.startsWith("/") || currentImg.startsWith("http") ? currentImg : `/uploads/products/${currentImg}`}
                alt={name}
                className="max-w-full max-h-full w-auto h-auto object-contain drop-shadow-sm transition-transform duration-200"
              />
            ) : (
              <CategoryPlaceholder category={category} />
            )}
          </div>
        </div>

        {/* 2. Text Details Below Image */}
        <div className="flex flex-col mt-3.5 px-0.5 text-left">
          <span className="text-[11px] sm:text-xs font-normal text-gray-400 uppercase tracking-wider truncate">
            {getCategoryLabel()}
          </span>

          <h2 className="text-sm sm:text-base font-normal text-gray-900 leading-snug mt-1">
            {name}
          </h2>

          {/* Price & Quantity Stepper Row */}
          <div className="flex items-center justify-between mt-3.5 select-none">
            <span className="flex flex-col min-w-0">
              <span className="flex items-center gap-2 flex-wrap">
                <span className={`text-xl sm:text-2xl font-bold tracking-tight ${isDiscounted ? "text-[#E01E5A]" : "text-gray-900"}`}>
                  ฿{(price || 0).toLocaleString("th-TH", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
                {isDiscounted && (
                  <span className="text-sm text-gray-400 line-through">
                    ฿{originalPrice.toLocaleString("th-TH", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                )}
                {isDiscounted && (
                  <span className="bg-[#E01E5A] text-white text-[11px] font-bold px-2.5 py-0.5 rounded-full tracking-wide shadow-xs">
                    {discountLabel}
                  </span>
                )}
              </span>
            </span>

            {/* Stepper Button (Longer & Wider) */}
            <div className="bg-[#FABE2C] text-black rounded-full w-[130px] sm:w-[145px] h-10 px-3 flex items-center justify-between shadow-xs select-none">
              <button
                type="button"
                onClick={() => setQty((prev) => Math.max(1, prev - 1))}
                className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-black/10 text-lg font-black active:scale-90 transition-all cursor-pointer select-none"
              >
                −
              </button>
              <span className="text-sm sm:text-base font-black min-w-5 text-center">
                {qty}
              </span>
              <button
                type="button"
                onClick={() => {
                  if (purchaseLimit > 0 && qty >= purchaseLimit) {
                    notify.warning(`ขออภัย สินค้านี้จำกัดการซื้อไม่เกิน ${purchaseLimit} ชิ้นต่อรายการ`);
                    return;
                  }
                  setQty((prev) => prev + 1);
                }}
                className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-black/10 text-lg font-black active:scale-90 transition-all cursor-pointer select-none"
              >
                +
              </button>
            </div>
          </div>

          {/* Description & Additional Info Section */}
          <div className="flex flex-col gap-1.5 mt-3">
            {purchaseLimit > 0 && (
              <div className="text-xs font-bold text-[#D32F2F] bg-[#FFEBEE] px-3.5 py-2 rounded-xl border border-[#FFCDD2]/70 flex items-center gap-2 shadow-2xs w-fit">
                <span className="text-sm">⚠️</span>
                <span>จำกัดการซื้อไม่เกิน {purchaseLimit} ชิ้นต่อรายการ</span>
              </div>
            )}
            {description && (
              <p className="text-gray-600 text-xs sm:text-sm leading-relaxed font-normal">
                {description}
              </p>
            )}
            {product.status === "Pre-Order" && (product.preorderReleaseDate || product.preorder_release_date) && (
              <div className="text-xs font-bold text-[#E65100] bg-[#FFF3E0] px-3 py-1.5 rounded-xl border border-[#FFE0B2]/50 w-fit">
                📦 วันที่ปล่อยสินค้าส่งมอบ: {(() => {
                  const d = new Date(product.preorderReleaseDate || product.preorder_release_date);
                  const day = String(d.getDate()).padStart(2, '0');
                  const month = String(d.getMonth() + 1).padStart(2, '0');
                  const year = d.getFullYear();
                  return `${day}/${month}/${year}`;
                })()}
              </div>
            )}
            {(product.additional_info || product.additionalInfo) && (
              <div className="mt-1 text-xs text-gray-700 bg-gray-50 p-2.5 rounded-xl border border-gray-200 flex flex-col gap-0.5">
                <span className="font-bold text-gray-400 uppercase text-[9px] tracking-wider">ข้อมูลเพิ่มเติม (Additional Info)</span>
                <p className="whitespace-pre-line text-xs font-medium text-gray-700">
                  {product.additional_info || product.additionalInfo}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* 3. Next / Other Products Smooth Sliding Carousel (สินค้าอื่นๆ ในหมวดหมู่เดียวกัน) */}
        {otherProducts.length > 0 && (
          <div className="flex flex-col mt-4 pt-3 border-t border-gray-150 select-none">
            <div className="flex items-center justify-between px-1 mb-1.5">
              <span className="text-xs sm:text-sm font-bold text-gray-900 tracking-tight">
                สินค้าอื่นๆ
              </span>
              {sameCategoryProducts.length > 0 && (
                <span className="text-[10px] sm:text-[11px] font-medium text-gray-500">
                  หมวดหมู่เดียวกัน
                </span>
              )}
            </div>

            <div className="flex items-center justify-center gap-2 sm:gap-3">
            {/* Prev Button */}
            <button
              type="button"
              onClick={handlePrevOther}
              disabled={otherProducts.length <= 3}
              className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center cursor-pointer transition-all active:scale-85 text-xs font-bold shrink-0 ${
                otherProducts.length <= 3
                  ? "opacity-30 cursor-not-allowed bg-gray-100 text-gray-400"
                  : "bg-gray-100 hover:bg-[#FABE2C] text-gray-700 hover:text-black shadow-2xs hover:shadow-xs"
              }`}
              title="สินค้าก่อนหน้า"
            >
              ◀
            </button>

            {/* Smooth Viewport (3 items wide with smooth transform track) */}
            <div
              className="w-[242px] sm:w-[260px] overflow-hidden py-1"
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              onMouseDown={handleTouchStart}
              onMouseMove={handleTouchMove}
              onMouseUp={handleTouchEnd}
              onMouseLeave={handleTouchEnd}
            >
              <div
                className="flex items-center gap-2.5 sm:gap-3 transition-transform duration-400 ease-[cubic-bezier(0.25,1,0.5,1)]"
                style={{
                  transform: `translateX(calc(-${otherPageIndex * 84}px + ${isDragging ? touchDeltaX : 0}px))`
                }}
              >
                {otherProducts.map((otherProd) => (
                  <div
                    key={otherProd.id}
                    onClick={() => {
                      if (Math.abs(touchDeltaX) < 8) {
                        onSelectProduct && onSelectProduct(otherProd);
                      }
                    }}
                    className="w-[74px] h-[74px] sm:w-[78px] sm:h-[78px] shrink-0 bg-[#F4F5F7] hover:bg-[#ECEEF2] rounded-[8px] p-2.5 flex items-center justify-center overflow-hidden cursor-pointer transition-all duration-200 active:scale-95 hover:border-[#FABE2C] hover:shadow-md shadow-2xs group select-none"
                    title={otherProd.name}
                  >
                    {otherProd.image && otherProd.image.includes(".") ? (
                      <img
                        src={
                          otherProd.image.startsWith("/") || otherProd.image.startsWith("http")
                            ? otherProd.image
                            : `/uploads/products/${otherProd.image}`
                        }
                        alt={otherProd.name}
                        className="max-w-full max-h-full object-contain group-hover:scale-110 transition-transform duration-300 pointer-events-none"
                      />
                    ) : (
                      <CategoryPlaceholder category={otherProd.category} />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Next Button */}
            <button
              type="button"
              onClick={handleNextOther}
              disabled={otherProducts.length <= 3}
              className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center cursor-pointer transition-all active:scale-85 text-xs font-bold shrink-0 ${
                otherProducts.length <= 3
                  ? "opacity-30 cursor-not-allowed bg-gray-100 text-gray-400"
                  : "bg-gray-100 hover:bg-[#FABE2C] text-gray-700 hover:text-black shadow-2xs hover:shadow-xs"
              }`}
              title="สินค้าถัดไป"
            >
              ▶
            </button>
          </div>
        </div>
      )}

        {/* 4. Bottom Action Button: ADD TO CART */}
        <button
          type="button"
          disabled={isOutOfStock}
          onClick={() => {
            if (!isOutOfStock) {
              onAddToCart(product, qty);
              onClose();
            }
          }}
          className={`mt-4 sm:mt-5 h-13 sm:h-14 w-full rounded-2xl flex items-center justify-center gap-2.5
                     transition-all font-bold text-sm sm:text-base uppercase cursor-pointer select-none ${
                       isOutOfStock
                         ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                         : "bg-[#101C38] hover:bg-[#152554] text-white active:scale-[0.98] shadow-md"
                     }`}
        >
          <ShoppingCartIcon className="w-5 h-5 text-white" />
          <span>{isOutOfStock ? "SOLD OUT" : "ADD TO CART"}</span>
        </button>
      </div>
    </div>
  );
}
