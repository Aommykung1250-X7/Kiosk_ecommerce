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
      <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{category || "Product"}</span>
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
    return "Product";
  };
  const subText = getSubText(product);

  return (
    <div
      onClick={() => {
        if (!isOutOfStock) {
          onSelectProduct(product);
        }
      }}
      className={`relative w-[217px] h-[256px] shrink-0 font-['Prompt'] cursor-pointer group ${
        isOutOfStock ? "opacity-75 cursor-not-allowed" : ""
      }`}
    >
      {/* Stacked Card Behind (Borderless Black with Blurred Edges) */}
      <div 
        className="absolute inset-0 bg-black rounded-[20px] 
                   translate-x-1 translate-y-1 blur-[3px] opacity-75
                   pointer-events-none" 
      />

      {/* Main Foreground Card (Borderless) */}
      <div 
        className="relative z-10 w-full h-full bg-white rounded-[20px] 
                   flex flex-col overflow-hidden"
      >
        {/* Hot badge */}
        {isMostViewed && !isOutOfStock && (
          <div className="absolute top-2 left-2 z-10 bg-[#EC4E63] text-white text-[8px] font-black px-2 py-0.5 rounded-full flex items-center gap-0.5 uppercase tracking-wider">
            🔥 HOT
          </div>
        )}

        {/* Promo badge */}
        {promotion && !isMostViewed && !isOutOfStock && (
          <div className="absolute top-2 left-2 z-10 bg-[#F9C338] text-black text-[8px] font-black px-2 py-0.5 rounded-full flex items-center gap-0.5 uppercase tracking-wider">
            🏷️ PROMO
          </div>
        )}

        {/* Status Badge */}
        {status && (
          <div
            className={`absolute top-2 right-2 z-10 text-[8px] font-black px-2 py-0.5 rounded-full border ${
              isOutOfStock
                ? "bg-red-50 text-red-600 border-red-200"
                : status === "In Stock"
                  ? "bg-[#E0F2F1]/90 text-[#00796B] border-[#80CBC4]/40"
                  : "bg-[#FFF3E0] text-[#E65100] border-[#FFE0B2]"
            }`}
          >
            {isOutOfStock ? "Out of stock" : status === "In Stock" ? "Ready" : status}
          </div>
        )}

        {/* Image Area */}
        <div className={`w-full h-[125px] ${imgBg} border-b border-gray-300 relative overflow-hidden shrink-0`}>
          <div className={`absolute inset-0 flex items-center justify-center p-3 ${isOutOfStock ? "opacity-35 grayscale" : ""}`}>
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
              <span className="bg-red-600 text-white text-[10px] font-black px-2.5 py-1 rounded-lg shadow-md uppercase tracking-wider transform -rotate-12 border border-white">
                สินค้าหมด
              </span>
            </div>
          )}
        </div>

        {/* Content Area */}
        <div className="flex-1 flex flex-col p-2.5 justify-between text-left min-h-0">
          <div>
            <h3 className="text-xs font-bold text-black leading-tight line-clamp-1">
              {name}
            </h3>
            <p className="text-[9px] font-semibold text-gray-400 mt-0.5 line-clamp-1">
              {subText}
            </p>
          </div>

          {/* Price & Stock container */}
          <div className="bg-[#F6F6F6] rounded-lg px-2 py-1 flex items-center justify-between gap-1 w-full">
            <div className="flex flex-col">
              <span className="text-[7px] font-black text-gray-400 uppercase tracking-widest leading-none">PRICE</span>
              <span className="text-sm font-black text-[#D99A1C] mt-0.5 leading-none">
                ฿{price.toLocaleString('th-TH')}
              </span>
            </div>
            {status !== "Pre-Order" && !isOutOfStock && (
              <div className="flex flex-col items-end justify-center">
                <span className="text-[7px] font-black text-gray-400 uppercase tracking-widest leading-none">STOCK</span>
                <span className="text-[10px] font-black text-[#5EBAA8] mt-0.5 leading-none">
                  {quantity} ชิ้น
                </span>
              </div>
            )}
            {status === "Pre-Order" && (
              <div className="flex flex-col items-end">
                <span className="text-[7px] font-black text-[#E65100] uppercase tracking-widest leading-none">PRE-ORDER</span>
                <span className="text-[8px] font-bold text-[#E65100]/80 mt-0.5">
                  15 วัน
                </span>
              </div>
            )}
          </div>

          {/* Add to Cart Button */}
          <button
            disabled={isOutOfStock}
            onClick={(e) => {
              e.stopPropagation();
              onAddToCart(product);
            }}
            className={`h-8 w-full rounded-lg flex items-center justify-center gap-1 transition-all duration-150 shrink-0 cursor-pointer font-black text-[10px] uppercase ${
                       isOutOfStock
                         ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                         : "bg-[#F9C338] text-black hover:bg-[#F2BD2B] active:scale-[0.98]"
                     }`}
          >
            <ShoppingCartIcon className="w-3.5 h-3.5" />
            <span>{isOutOfStock ? "สินค้าหมด" : "Add to Cart"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
