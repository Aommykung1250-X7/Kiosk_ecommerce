import { useState, useEffect } from "react";
import { TagIcon, ShoppingCartIcon } from "@heroicons/react/24/solid";

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
  }, [product?.id]);

  if (!product) return null;

  const { name, price, image, images, promotion, status, quantity, category, views } = product;
  const isOutOfStock = status === "In Stock" && (quantity === undefined || quantity <= 0);
  const isMostViewed = (views || 0) > 0;
  const purchaseLimit = product.purchaseLimit || product.purchase_limit;

  const imagesList = Array.isArray(images) && images.length > 0
    ? images
    : (image && image.includes(".") ? [image] : []);

  const currentImg = imagesList[activeImageIndex] || image;

  // Other / Next products list (excluding current product)
  const otherProducts = allProducts.filter((p) => p.id !== product.id);
  const visibleOtherProducts = otherProducts.slice(otherPageIndex, otherPageIndex + 3);

  const handlePrevOther = (e) => {
    e?.stopPropagation();
    if (otherProducts.length <= 3) return;
    setOtherPageIndex((prev) => (prev === 0 ? Math.max(0, otherProducts.length - 3) : prev - 1));
  };

  const handleNextOther = (e) => {
    e?.stopPropagation();
    if (otherProducts.length <= 3) return;
    setOtherPageIndex((prev) => (prev + 3 >= otherProducts.length ? 0 : prev + 1));
  };

  const getCategoryLabel = () => {
    return "LOCAL EXPRESS";
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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/65 backdrop-blur-sm transition-opacity duration-200 font-['Prompt']"
      onClick={onClose}
    >
      {/* Modal Card matching mockup with top space for close button */}
      <div
        className="relative w-[92%] max-w-[460px] bg-white rounded-[36px] sm:rounded-[40px] pt-13 sm:pt-14 pb-6 sm:pb-7 px-6 sm:px-7 flex flex-col shadow-2xl overflow-hidden animate-in fade-in-50 zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Red Circle Close Button in top white area */}
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
          {/* Top-Right Badge matching mockup */}
          {isOutOfStock ? (
            <div className="absolute top-3.5 right-3.5 z-10 bg-[#F85153] text-white text-[10px] font-medium px-2.5 py-0.5 rounded-full shadow-xs tracking-wide">
              SOLD OUT
            </div>
          ) : isMostViewed ? (
            /* Comic Speech Bubble HOT badge */
            <div className="absolute top-3.5 right-3.5 z-10 select-none">
              <svg className="w-8 h-7 drop-shadow-xs" viewBox="0 0 36 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M4 2h28a2 2 0 0 1 2 2v18a2 2 0 0 1-2 2H12l-6 5v-5H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z" fill="#FFFFFF" stroke="#000000" strokeWidth="2.2" strokeLinejoin="round"/>
                <text x="18" y="16" fill="#000000" fontSize="9.5" fontWeight="700" textAnchor="middle" dominantBaseline="middle" fontFamily="'Prompt', sans-serif" letterSpacing="0.5">HOT</text>
              </svg>
            </div>
          ) : promotion ? (
            <div className="absolute top-3.5 right-3.5 z-10 bg-[#FF6B00] text-white text-[10px] font-medium px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-xs tracking-wide">
              <TagIcon className="w-3 h-3 text-white" />
              <span>PROMO</span>
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

          {/* Left / Right Arrow Buttons on Main Image */}
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
          {/* Subtitle */}
          <span className="text-[11px] sm:text-xs font-normal text-gray-400 uppercase tracking-wider truncate">
            {getCategoryLabel()}
          </span>

          {/* Product Name */}
          <h2 className="text-sm sm:text-base font-normal text-gray-900 leading-snug mt-1">
            {name}
          </h2>

          {/* Price & Quantity Stepper Row */}
          <div className="flex items-center justify-between mt-3.5 select-none">
            <span className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
              ฿{(price || 0).toLocaleString("th-TH", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>

            {/* Yellow Stepper Pill Button matching mockup */}
            <div className="bg-[#FABE2C] text-black rounded-full px-3.5 py-1 flex items-center gap-3.5 shadow-xs">
              <button
                type="button"
                onClick={() => setQty((prev) => Math.max(1, prev - 1))}
                className="text-base font-bold px-0.5 hover:opacity-70 active:scale-90 transition-all cursor-pointer select-none"
              >
                −
              </button>
              <span className="text-sm font-bold min-w-3 text-center">
                {qty}
              </span>
              <button
                type="button"
                onClick={() => setQty((prev) => (purchaseLimit ? Math.min(purchaseLimit, prev + 1) : prev + 1))}
                className="text-base font-bold px-0.5 hover:opacity-70 active:scale-90 transition-all cursor-pointer select-none"
              >
                +
              </button>
            </div>
          </div>
        </div>

        {/* 3. Next / Other Products Carousel Row (สินค้าชิ้นต่อไป) */}
        {otherProducts.length > 0 && (
          <div className="flex items-center justify-center gap-2.5 mt-5 select-none">
            <button
              type="button"
              onClick={handlePrevOther}
              className="w-7 h-7 rounded-full bg-gray-200 hover:bg-gray-300 text-gray-600 flex items-center justify-center cursor-pointer transition-all active:scale-90 text-[10px]"
              title="สินค้าก่อนหน้า"
            >
              ◀
            </button>

            <div className="flex items-center gap-2.5">
              {visibleOtherProducts.map((otherProd) => (
                <div
                  key={otherProd.id}
                  onClick={() => onSelectProduct && onSelectProduct(otherProd)}
                  className="w-18 h-18 sm:w-20 sm:h-20 bg-[#F4F5F7] hover:bg-[#ECEEF2] rounded-[20px] p-2 flex items-center justify-center overflow-hidden cursor-pointer transition-all active:scale-95 border-2 border-transparent hover:border-gray-400 shadow-2xs group"
                  title={otherProd.name}
                >
                  {otherProd.image && otherProd.image.includes(".") ? (
                    <img
                      src={otherProd.image.startsWith("/") || otherProd.image.startsWith("http") ? otherProd.image : `/uploads/products/${otherProd.image}`}
                      alt={otherProd.name}
                      className="max-w-full max-h-full object-contain group-hover:scale-105 transition-transform duration-150"
                    />
                  ) : (
                    <CategoryPlaceholder category={otherProd.category} />
                  )}
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={handleNextOther}
              className="w-7 h-7 rounded-full bg-gray-200 hover:bg-gray-300 text-gray-600 flex items-center justify-center cursor-pointer transition-all active:scale-90 text-[10px]"
              title="สินค้าถัดไป"
            >
              ▶
            </button>
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
          className={`mt-5 sm:mt-6 h-13 sm:h-14 w-full rounded-2xl flex items-center justify-center gap-2.5
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
