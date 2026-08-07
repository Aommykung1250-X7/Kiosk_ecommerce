import { ShoppingCartIcon } from "@heroicons/react/24/solid";

function CategoryPlaceholder({ category }) {
  const getIcon = () => {
    switch (category) {
      case "drinks":
        return (
          <svg className="w-12 h-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9V5.25c0-.414.168-.75.375-.75h3.75c.207 0 .375.336.375.75V9m-4.5 0h4.5m-4.5 0a3 3 0 0 1-3-3V3.75c0-.414.168-.75.375-.75h6.75c.207 0 .375.336.375.75V6a3 3 0 0 1-3 3M3.75 21h16.5M12 9v12m-5.25-6h10.5" />
          </svg>
        );
      case "snacks":
        return (
          <svg className="w-12 h-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" />
          </svg>
        );
      case "instant":
        return (
          <svg className="w-12 h-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
          </svg>
        );
      case "stationery":
        return (
          <svg className="w-12 h-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487Zm0 0L19.5 7.125" />
          </svg>
        );
      default:
        return (
          <svg className="w-12 h-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
          </svg>
        );
    }
  };

  return (
    <div className="flex flex-col items-center justify-center gap-1 opacity-60">
      {getIcon()}
      <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{category || ""}</span>
    </div>
  );
}

export default function ProductCard({ product, onAddToCart, onSelectProduct, isMostViewed }) {
  const { name, price, image, promotion, status, quantity } = product;
  const isOutOfStock = status === "In Stock" && quantity <= 0;

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
  const imgBg = bgColors[image] || "bg-gray-50";

  const getSubText = (prod) => {
    if (prod.image === "water") return "600ml • Mineral Water";
    if (prod.image === "cola") return "325ml • Soft Drink";
    if (prod.image === "chips") return "Original • Snack";
    if (prod.image === "wafer") return "Cheese • Wafer";
    if (prod.image === "noodle") return "Cup • Instant Noodles";
    if (prod.image === "milo") return "180ml • Malt Drink";
    if (prod.image === "pen") return "0.5mm • Blue ink";
    if (prod.image === "notebook") return "Grid • Notebook";
    return "";
  };
  const subText = getSubText(product);

  return (
    <div
      onClick={() => {
        if (!isOutOfStock) {
          onSelectProduct(product);
        }
      }}
      className={`w-full bg-white rounded-[24px] border-2 border-[#1B1B1C] 
                 shadow-[6px_6px_0px_0px_#1B1B1C] flex flex-col overflow-hidden relative 
                 transition-all duration-200 cursor-pointer hover:-translate-y-0.5 hover:shadow-[8px_8px_0px_0px_#1B1B1C] font-['Prompt']
                 ${isOutOfStock ? "opacity-75 cursor-not-allowed" : ""}`}
    >
      {/* Hot badge - reduced size */}
      {isMostViewed && !isOutOfStock && (
        <div className="absolute top-2.5 left-2.5 z-10 bg-[#EC4E63] text-white text-[8px] font-black px-2 py-0.5 rounded-full flex items-center gap-0.5 uppercase tracking-wider shadow-sm">
          🔥 HOT
        </div>
      )}

      {/* Promo badge - reduced size */}
      {promotion && !isMostViewed && !isOutOfStock && (
        <div className="absolute top-2.5 left-2.5 z-10 bg-[#F9C338] text-black text-[8px] font-black px-2 py-0.5 rounded-full flex items-center gap-0.5 uppercase tracking-wider border border-[#1B1B1C] shadow-sm">
          🏷️ PROMO
        </div>
      )}

      {/* Image Area */}
      <div className={`w-full aspect-[8/5] ${imgBg} border-b-2 border-[#1B1B1C] relative overflow-hidden`}>
        <div className={`absolute inset-0 flex items-center justify-center p-6 ${isOutOfStock ? "opacity-35 grayscale" : ""}`}>
          {image && image.includes(".") ? (
            <img
              src={`/uploads/products/${image}`}
              alt={name}
              className="max-w-full max-h-full w-auto h-auto object-contain rounded-lg"
            />
          ) : (
            <CategoryPlaceholder category={product.category} />
          )}
        </div>
        {isOutOfStock && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="bg-red-600 text-white text-[12px] font-black px-3.5 py-1.5 rounded-xl shadow-md uppercase tracking-wider transform -rotate-12 border-2 border-white">
              สินค้าหมด
            </span>
          </div>
        )}
      </div>

      {/* Content Area */}
      <div className="flex-1 flex flex-col px-3.5 py-3.5 gap-2.5 text-left">
        <div>
          <div className="flex items-center justify-between gap-1.5">
            <h3 className="text-sm font-bold text-black leading-snug line-clamp-1 flex-1">
              {name}
            </h3>
            {/* Status Badge moved to right of Product Name */}
            {status && (
              <span
                className={`text-[9px] font-black px-2 py-0.5 rounded-full border shrink-0 ${
                  isOutOfStock
                    ? "bg-red-50 text-red-600 border-red-200"
                    : status === "In Stock"
                      ? "bg-[#E0F2F1] text-[#00796B] border-[#80CBC4]"
                      : "bg-[#FFF3E0] text-[#E65100] border-[#FFE0B2]"
                }`}
              >
                {isOutOfStock ? "หมด" : status === "In Stock" ? "พร้อมส่ง" : status}
              </span>
            )}
          </div>
          {subText && (
            <p className="text-[11px] font-semibold text-gray-400 mt-0.5">
              {subText}
            </p>
          )}
        </div>

        {/* Price & Stock container */}
        <div className="bg-[#F6F6F6] rounded-2xl p-2.5 flex flex-col gap-1 w-full">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest leading-none">PRICE</span>
              <span className="text-lg font-black text-[#D99A1C] mt-1 leading-none">
                ฿{price.toLocaleString('th-TH')}
              </span>
            </div>
            {status !== "Pre-Order" && !isOutOfStock && (
              <div className="flex flex-col items-end justify-center">
                <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest leading-none">STOCK</span>
                <span className="text-[11px] font-black text-[#5EBAA8] mt-1 leading-none">
                  เหลือ {quantity} ชิ้น
                </span>
              </div>
            )}
            {status === "Pre-Order" && (
              <div className="flex flex-col items-end">
                <span className="text-[8px] font-black text-[#E65100] uppercase tracking-widest leading-none">PRE-ORDER</span>
                <span className="text-[9px] font-bold text-[#E65100]/80 mt-1">
                  รอ 15 วัน
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Add to Cart Button */}
        <button
          disabled={isOutOfStock}
          onClick={(e) => {
            e.stopPropagation();
            onAddToCart(product);
          }}
          className={`h-10 w-full rounded-xl flex items-center justify-center gap-1.5 border-2 border-[#1B1B1C]
                     transition-all duration-150 shrink-0 cursor-pointer font-black text-[11px] uppercase ${
                       isOutOfStock
                         ? "bg-gray-100 text-gray-400 cursor-not-allowed border-gray-300"
                         : "bg-[#F9C338] text-black hover:bg-[#F2BD2B] active:scale-[0.98]"
                     }`}
        >
          <ShoppingCartIcon className="w-3.5 h-3.5" />
          <span>{isOutOfStock ? "สินค้าหมด" : "Add to Cart"}</span>
        </button>
      </div>
    </div>
  );
}
