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
      className={`w-full bg-white rounded-[24px] border-2 border-black/90 
                 shadow-[0_4px_16px_rgba(0,0,0,0.06)] flex flex-col overflow-hidden relative 
                 transition-all duration-200 cursor-pointer hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(0,0,0,0.1)] font-['Prompt']
                 ${isOutOfStock ? "opacity-90" : ""}`}
    >
      {/* Hot badge */}
      {isMostViewed && (
        <div className="absolute top-2.5 left-2.5 z-10 bg-[#FF5252] text-white text-[9px] font-black px-2 py-0.5 rounded-full flex items-center gap-0.5 uppercase tracking-wider shadow-xs">
          🔥 Hot
        </div>
      )}

      {/* Promo badge */}
      {promotion && !isMostViewed && (
        <div className="absolute top-2.5 left-2.5 z-10 bg-[#F9C338] text-black text-[9px] font-black px-2 py-0.5 rounded-full flex items-center gap-0.5 uppercase tracking-wider border border-black/20 shadow-xs">
          🏷️ Promo
        </div>
      )}

      {/* Status Badge matching home.jpg */}
      <div
        className={`absolute top-2.5 right-2.5 z-10 text-[9px] font-black px-2 py-0.5 rounded-full ${
          isOutOfStock
            ? "bg-red-50 text-[#FF5252]"
            : status === "In Stock" || status === "Ready"
              ? "bg-[#E0F2F1] text-[#00796B]"
              : "bg-[#FFF3E0] text-[#E65100]"
        }`}
      >
        {isOutOfStock ? "Out of stock" : "Ready"}
      </div>

      {/* Image Area */}
      {/* Image Area */}
      <div className="w-full aspect-[8/5] bg-white flex items-center justify-center p-3 border-b-2 border-black/90 relative overflow-hidden">
        <div className={`w-full h-full flex items-center justify-center ${isOutOfStock ? "opacity-40 grayscale" : ""}`}>
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
      </div>

      {/* Content Area */}
      <div className="flex-1 flex flex-col px-3.5 py-3 gap-2.5 text-left min-w-0">
        <div className="min-w-0">
          <h3 className="text-sm font-black text-black leading-tight truncate">
            {name}
          </h3>
          <p className="text-[11px] font-semibold text-gray-400 mt-0.5 truncate">
            {subText || "Small detail"}
          </p>
        </div>

        {/* Price Box matching home.jpg */}
        <div className="bg-[#F4F4F6] rounded-xl px-3 py-2 flex items-center justify-between w-full min-w-0">
          <span className="text-xs font-black text-[#8E8E93] uppercase tracking-wider">PRICE</span>
          <span className="text-lg font-black text-[#F9C338]">
            ฿{Number(price || 0).toFixed(0)}
          </span>
        </div>

        {/* Add to Cart Button matching home.jpg */}
        <button
          disabled={isOutOfStock}
          onClick={(e) => {
            e.stopPropagation();
            onAddToCart(product);
          }}
          className={`h-10 w-full rounded-xl flex items-center justify-center gap-1.5 border-2 border-black/90
                     transition-all duration-150 shrink-0 font-extrabold text-[11px] uppercase cursor-pointer select-none whitespace-nowrap px-1 ${
                       isOutOfStock
                         ? "bg-[#E5E5E7] text-[#8E8E93] border-[#D1D1D6] cursor-not-allowed"
                         : "bg-[#F9C338] text-black hover:bg-[#F2BD2B] active:scale-[0.98] shadow-xs"
                     }`}
        >
          <ShoppingCartIcon className="w-3.5 h-3.5 shrink-0" />
          <span>{isOutOfStock ? "OUT OF STOCK" : "ADD TO CART"}</span>
        </button>
      </div>
    </div>
  );
}
