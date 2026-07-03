// src/components/CartDrawer.jsx
import { XMarkIcon, MinusIcon, PlusIcon, TrashIcon } from "@heroicons/react/24/outline";
import { ShoppingCartIcon, ShoppingBagIcon } from "@heroicons/react/24/solid";

// Re-using flat minimal SVG illustrations for cart view.
function WaterBottle() {
  return (
    <svg viewBox="0 0 120 160" className="w-full h-full">
      <rect x="50" y="6" width="20" height="14" rx="3" fill="#4FA8D8" />
      <path d="M42 24 h36 l4 20 -6 8 v92 a6 6 0 0 1 -6 6 H50 a6 6 0 0 1 -6 -6 V52 l-6 -8 Z"
            fill="#EAF6FB" stroke="#BFE3F2" strokeWidth="2" />
      <rect x="38" y="78" width="44" height="30" rx="4" fill="#4FA8D8" opacity="0.85" />
      <rect x="38" y="78" width="44" height="8" fill="#ffffff" opacity="0.5" />
    </svg>
  );
}

function ColaCan() {
  return (
    <svg viewBox="0 0 120 160" className="w-full h-full">
      <rect x="30" y="16" width="60" height="128" rx="12" fill="#E5342B" />
      <ellipse cx="60" cy="16" rx="30" ry="8" fill="#C7C7C7" />
      <ellipse cx="60" cy="16" rx="24" ry="5" fill="#EDEDED" />
      <rect x="30" y="70" width="60" height="26" fill="#ffffff" opacity="0.85" />
      <rect x="30" y="70" width="60" height="7" fill="#E5342B" opacity="0.7" />
      <rect x="30" y="89" width="60" height="7" fill="#E5342B" opacity="0.7" />
    </svg>
  );
}

function ChipsBag() {
  return (
    <svg viewBox="0 0 120 160" className="w-full h-full">
      <path d="M28 30 L92 30 L104 140 a8 8 0 0 1 -8 8 H24 a8 8 0 0 1 -8 -8 Z"
            fill="#F7C531" />
      <path d="M28 30 l6 -14 h52 l6 14 Z" fill="#E8A800" />
      <ellipse cx="60" cy="92" rx="30" ry="34" fill="#FFFFFF" opacity="0.9" />
      <ellipse cx="60" cy="92" rx="22" ry="26" fill="#F0472B" opacity="0.9" />
    </svg>
  );
}

function WaferBag() {
  return (
    <svg viewBox="0 0 120 160" className="w-full h-full">
      <path d="M28 30 L92 30 L104 140 a8 8 0 0 1 -8 8 H24 a8 8 0 0 1 -8 -8 Z"
            fill="#2E6DB4" />
      <path d="M28 30 l6 -14 h52 l6 14 Z" fill="#1F5290" />
      <rect x="34" y="70" width="52" height="46" rx="6" fill="#FFD84D" />
      <rect x="34" y="70" width="52" height="12" rx="4" fill="#FFE98A" />
    </svg>
  );
}

function CupNoodle() {
  return (
    <svg viewBox="0 0 120 160" className="w-full h-full">
      <path d="M34 54 h52 l-8 78 a8 8 0 0 1 -8 7 H50 a8 8 0 0 1 -8 -7 Z" fill="#D6362A" />
      <ellipse cx="60" cy="54" rx="26" ry="9" fill="#EFEFEF" />
      <ellipse cx="60" cy="50" rx="26" ry="9" fill="#FFFFFF" />
      <path d="M40 66 h40 v18 h-40 Z" fill="#F6B23B" opacity="0.9" />
    </svg>
  );
}

function MiloBox() {
  return (
    <svg viewBox="0 0 120 160" className="w-full h-full">
      <rect x="34" y="26" width="52" height="104" rx="6" fill="#1E7A3D" />
      <rect x="34" y="26" width="52" height="26" rx="6" fill="#2C9B4F" />
      <path d="M34 52 L86 26" stroke="#166030" strokeWidth="3" />
      <circle cx="60" cy="94" r="16" fill="#F6B23B" opacity="0.9" />
    </svg>
  );
}

function Pen() {
  return (
    <svg viewBox="0 0 120 160" className="w-full h-full">
      <rect x="52" y="18" width="16" height="90" rx="6" fill="#2E6DB4" />
      <rect x="52" y="18" width="16" height="20" rx="6" fill="#1F5290" />
      <polygon points="52,108 68,108 60,132" fill="#2B2B2B" />
      <rect x="56" y="10" width="8" height="14" rx="2" fill="#F7C531" />
    </svg>
  );
}

function Notebook() {
  return (
    <svg viewBox="0 0 120 160" className="w-full h-full">
      <rect x="28" y="20" width="64" height="112" rx="8" fill="#F7C531" />
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <circle key={i} cx="28" cy="34 + i * 17" r="4" fill="#FFFFFF" stroke="#E8A800" strokeWidth="2" />
      ))}
      <rect x="42" y="52" width="36" height="36" rx="4" fill="#FFFFFF" opacity="0.9" />
    </svg>
  );
}

const ILLUSTRATIONS = {
  water: WaterBottle,
  cola: ColaCan,
  chips: ChipsBag,
  wafer: WaferBag,
  noodle: CupNoodle,
  milo: MiloBox,
  pen: Pen,
  notebook: Notebook,
};

export default function CartDrawer({ isOpen, onClose, cart, onUpdateQuantity, onRemoveItem, onClearCart, onCheckout }) {
  if (!isOpen) return null;

  const { items = [], totalPrice = 0, totalItems = 0 } = cart || {};

  return (
    <div 
      className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm transition-opacity duration-300 font-['Prompt']"
      onClick={onClose}
    >
      {/* Drawer Container */}
      <div 
        className="w-full max-w-md h-full bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-[#2B2B2B]">ตะกร้าสินค้า</h2>
            {totalItems > 0 && (
              <span className="bg-[#F8C032]/25 text-[#2B2B2B] text-xs font-bold px-2 py-0.5 rounded-full">
                {totalItems} ชิ้น
              </span>
            )}
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center gap-4 text-gray-400">
              <ShoppingBagIcon className="w-16 h-16 text-gray-200" />
              <div>
                <p className="text-lg font-semibold text-[#2B2B2B]/60">ตะกร้าของคุณยังว่างเปล่า</p>
                <p className="text-sm text-gray-400 mt-1">เลือกซื้อสินค้าโปรดของคุณเพื่อเริ่มต้นกันเลย</p>
              </div>
              <button 
                onClick={onClose}
                className="mt-2 px-6 py-2 bg-gray-100 hover:bg-gray-200 text-[#2B2B2B] text-sm font-semibold rounded-xl transition-colors"
              >
                เลือกซื้อสินค้า
              </button>
            </div>
          ) : (
            items.map((item) => {
              const { product, quantity } = item;
              const Illustration = ILLUSTRATIONS[product.image] || WaterBottle;

              return (
                <div 
                  key={product.id}
                  className="flex gap-4 p-3 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-shadow"
                >
                  {/* Product Thumbnail */}
                  <div className="w-20 h-20 bg-gray-50 flex items-center justify-center p-2 rounded-xl border border-gray-100 shrink-0">
                    <Illustration />
                  </div>

                  {/* Product Details */}
                  <div className="flex-1 flex flex-col justify-between min-w-0">
                    <div>
                      <h4 className="text-sm font-bold text-[#2B2B2B] truncate leading-snug">
                        {product.name}
                      </h4>
                      {product.status === "Pre-Order" ? (
                        <span className="text-[10px] text-[#E65100] bg-[#FFF3E0] px-2 py-0.5 rounded-full font-medium inline-block mt-1">
                          Pre-Order (15-20 วัน)
                        </span>
                      ) : (
                        <span className="text-[10px] text-[#2E7D32] bg-[#E8F5E9] px-2 py-0.5 rounded-full font-medium inline-block mt-1">
                          พร้อมรับสินค้า
                        </span>
                      )}
                    </div>

                    <div className="text-base font-extrabold text-[#E53935]">
                      ฿{(product.price * quantity).toFixed(0)}
                      <span className="text-xs text-gray-400 font-normal ml-1">
                        (฿{product.price}/ชิ้น)
                      </span>
                    </div>
                  </div>

                  {/* Quantity Actions */}
                  <div className="flex flex-col items-end justify-between shrink-0">
                    {/* Delete Icon */}
                    <button 
                      onClick={() => onRemoveItem(product.id)}
                      className="p-1 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-lg transition-colors"
                    >
                      <TrashIcon className="w-5 h-5" />
                    </button>

                    {/* Quantity Selector */}
                    <div className="flex items-center border border-gray-200 rounded-xl bg-gray-50 h-8 px-1">
                      <button 
                        onClick={() => onUpdateQuantity(product.id, quantity - 1)}
                        className="p-1 hover:bg-gray-200 rounded-lg text-gray-500 transition-colors"
                      >
                        <MinusIcon className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-6 text-center text-xs font-bold text-[#2B2B2B]">
                        {quantity}
                      </span>
                      <button 
                        onClick={() => onUpdateQuantity(product.id, quantity + 1)}
                        className="p-1 hover:bg-gray-200 rounded-lg text-gray-500 transition-colors"
                      >
                        <PlusIcon className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer summary */}
        {items.length > 0 && (
          <div className="p-6 bg-gray-50 border-t border-gray-100 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-500">ราคารวมทั้งหมด:</span>
              <span className="text-2xl font-extrabold text-[#E53935]">
                ฿{totalPrice.toFixed(0)}
              </span>
            </div>

            <div className="flex flex-col gap-2">
              <button 
                onClick={() => {
                  onCheckout();
                  onClose();
                }}
                className="h-12 w-full rounded-2xl bg-[#F8C032] hover:bg-[#F0B420] active:scale-95
                           flex items-center justify-center gap-2 transition-transform duration-150 shadow-md font-semibold text-[#2B2B2B]"
              >
                <ShoppingCartIcon className="w-5 h-5" />
                ชำระเงิน
              </button>
              
              <button 
                onClick={onClearCart}
                className="text-xs text-red-500 hover:text-red-700 hover:underline text-center py-1 transition-colors font-medium"
              >
                ล้างตะกร้าสินค้าทั้งหมด
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
