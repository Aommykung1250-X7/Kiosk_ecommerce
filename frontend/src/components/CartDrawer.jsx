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
  const hasPreOrder = items.some(item => item.product && item.product.status === "Pre-Order");
  const shippingFee = hasPreOrder ? 40 : 0;

  return (
    <div
      className="fixed inset-0 z-50 bg-[#FAF9F6] flex flex-col animate-in fade-in zoom-in-95 duration-200 font-['Prompt'] overflow-hidden"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Premium Fullscreen Header */}
      <div className="bg-white border-b border-gray-100 px-8 py-6 flex items-center justify-between shadow-sm">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-extrabold text-[#2B2B2B]">ตะกร้าสินค้าของคุณ</h2>
            {totalItems > 0 && (
              <span className="bg-[#F8C032] text-[#2B2B2B] text-xs font-extrabold px-3 py-1 rounded-full shadow-sm">
                {totalItems} รายการ
              </span>
            )}
          </div>
          <p className="text-xs text-gray-400">ตรวจสอบความถูกต้องและจำนวนรายการสินค้าก่อนดำเนินการชำระเงิน</p>
        </div>

      </div>

      {/* Cart Content Body */}
      <div className="flex-1 overflow-hidden p-8 flex flex-col lg:flex-row gap-8 max-w-7xl w-full mx-auto">
        {items.length === 0 ? (
          // Beautiful Empty State View
          <div className="flex-1 bg-white rounded-3xl border border-gray-100 shadow-sm flex flex-col items-center justify-center p-12 text-center gap-6">
            <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center border border-gray-100 shadow-inner">
              <ShoppingBagIcon className="w-12 h-12 text-gray-300 animate-pulse" />
            </div>
            <div className="flex flex-col gap-2 max-w-sm">
              <p className="text-xl font-bold text-[#2B2B2B]">ตะกร้าของคุณว่างเปล่า</p>
              <p className="text-sm text-gray-400 leading-relaxed">
                ดูเหมือนคุณยังไม่ได้เลือกสินค้าใส่ตะกร้าเลย สนุกกับการเลือกซื้อสินค้าโปรดของคุณได้ทันที!
              </p>
            </div>
            <button
              onClick={onClose}
              className="px-8 py-3.5 bg-[#F8C032] hover:bg-[#F0B420] active:scale-95 text-[#2B2B2B] font-bold rounded-2xl transition-all shadow-md select-none cursor-pointer"
            >
              เลือกซื้อสินค้าเลย
            </button>
          </div>
        ) : (
          <>
            {/* Left Column: Cart Items List */}
            <div className="flex-1 flex flex-col gap-4 overflow-y-auto pr-2">
              <div className="flex justify-between items-center px-2">
                <span className="text-sm font-bold text-gray-400 uppercase tracking-wider">รายการสินค้าในตะกร้า</span>
                <button
                  onClick={onClearCart}
                  className="text-xs text-red-500 hover:text-red-700 font-semibold hover:underline select-none cursor-pointer"
                >
                  ล้างสินค้าทั้งหมด
                </button>
              </div>

              <div className="flex flex-col gap-4">
                {items.map((item) => {
                  const { product, quantity } = item;
                  const Illustration = ILLUSTRATIONS[product.image] || WaterBottle;

                  return (
                    <div
                      key={product.id}
                      className="flex gap-6 p-4 bg-white border border-gray-100 rounded-3xl shadow-[0_4px_15px_rgba(0,0,0,0.02)] hover:shadow-md transition-all duration-200"
                    >
                      {/* Product Illustration / Image */}
                      <div className="w-28 h-28 bg-gray-50 flex items-center justify-center p-3 rounded-2xl border border-gray-100 shrink-0">
                        <Illustration />
                      </div>

                      {/* Product Detail Text */}
                      <div className="flex-1 flex flex-col justify-between min-w-0 py-1">
                        <div>
                          <h4 className="text-base font-extrabold text-[#2B2B2B] leading-tight truncate">
                            {product.name}
                          </h4>
                          <div className="flex items-center gap-2 mt-2">
                            {product.status === "Pre-Order" ? (
                              <span className="text-[10px] text-[#E65100] bg-[#FFF3E0] px-2.5 py-0.5 rounded-full font-bold">
                                Pre-Order (15-20 วัน)
                              </span>
                            ) : (
                              <span className="text-[10px] text-[#2E7D32] bg-[#E8F5E9] px-2.5 py-0.5 rounded-full font-bold">
                                พร้อมส่งหน้าร้าน
                              </span>
                            )}
                            {product.pickup_location && (
                              <span className="text-[10px] text-gray-400 font-medium font-mono">
                                {product.pickup_location}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Calculated Unit Price */}
                        <div className="flex items-baseline gap-2">
                          <span className="text-xl font-black text-[#E53935]">
                            ฿{(product.price * quantity).toFixed(0)}
                          </span>
                          <span className="text-xs text-gray-400">
                            (฿{product.price}/ชิ้น)
                          </span>
                        </div>
                      </div>

                      {/* Quantity & Delete Controls */}
                      <div className="flex flex-col items-end justify-between py-1 shrink-0">
                        {/* Delete Button */}
                        <button
                          onClick={() => onRemoveItem(product.id)}
                          className="p-2 hover:bg-red-50 active:bg-red-100 text-red-500 hover:text-red-700 rounded-xl transition-colors cursor-pointer"
                          title="ลบออกจากตะกร้า"
                        >
                          <TrashIcon className="w-5 h-5" />
                        </button>

                        {/* Quantity Selector controls */}
                        <div className="flex items-center border border-gray-200 rounded-2xl bg-gray-50 h-10 px-1.5 shadow-inner">
                          <button
                            onClick={() => onUpdateQuantity(product.id, quantity - 1)}
                            className="p-1.5 hover:bg-gray-200 rounded-xl text-gray-500 transition-colors cursor-pointer active:scale-90"
                          >
                            <MinusIcon className="w-4 h-4" />
                          </button>
                          <span className="w-8 text-center text-sm font-black text-[#2B2B2B]">
                            {quantity}
                          </span>
                          <button
                            onClick={() => onUpdateQuantity(product.id, quantity + 1)}
                            className="p-1.5 hover:bg-gray-200 rounded-xl text-gray-500 transition-colors cursor-pointer active:scale-90"
                          >
                            <PlusIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right Column: Order Summary Card */}
            <div className="w-full lg:w-96 bg-white p-6 rounded-3xl border border-gray-100 shadow-[0_10px_30px_rgba(0,0,0,0.03)] flex flex-col justify-between shrink-0 h-fit lg:sticky lg:top-8 gap-6 animate-in slide-in-from-bottom duration-300">
              <div className="flex flex-col gap-4">
                <h3 className="text-lg font-black text-[#2B2B2B] border-b border-gray-50 pb-3">สรุปยอดชำระเงิน</h3>

                {/* Cost Breakdown Rows */}
                <div className="flex flex-col gap-3">
                  <div className="flex justify-between items-center text-sm text-gray-400">
                    <span>จำนวนรายการทั้งหมด</span>
                    <span className="font-bold text-[#2B2B2B]">{totalItems} ชิ้น</span>
                  </div>
                  <div className="flex justify-between items-center text-sm text-gray-400">
                    <span>ค่าจัดส่งสินค้า (Pre-Order)</span>
                    {shippingFee > 0 ? (
                      <span className="font-bold text-[#E53935]">฿{shippingFee}</span>
                    ) : (
                      <span className="font-bold text-[#2E7D32]">ฟรี</span>
                    )}
                  </div>
                  <div className="flex justify-between items-center text-sm text-gray-400">
                    <span>การชำระเงิน</span>
                    <span className="font-medium text-[#2B2B2B]">สแกนโอนเงิน QR</span>
                  </div>
                </div>

                <hr className="border-gray-100 my-2" />

                {/* Grand Total display */}
                <div className="flex justify-between items-end">
                  <span className="text-sm font-bold text-gray-400 uppercase tracking-wide">ยอดรวมสุทธิ</span>
                  <span className="text-3xl font-black text-[#E53935] leading-none">
                    ฿{(totalPrice + shippingFee).toFixed(0)}
                  </span>
                </div>
              </div>

              {/* Checkout / Clear Action buttons */}
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => {
                    onCheckout();
                    onClose();
                  }}
                  className="h-14 w-full rounded-2xl bg-[#F8C032] hover:bg-[#F0B420] active:scale-95
                             flex items-center justify-center gap-2.5 transition-all duration-150 shadow-md hover:shadow-lg font-bold text-base text-[#2B2B2B] cursor-pointer"
                >
                  <ShoppingCartIcon className="w-5 h-5 shrink-0" />
                  <span>ดำเนินการชำระเงิน</span>
                </button>
                <button
                  onClick={onClose}
                  className="h-12 w-full rounded-2xl bg-gray-50 hover:bg-gray-100 text-gray-500 font-bold text-sm transition-all active:scale-95 border border-gray-100/50 cursor-pointer flex items-center justify-center"
                >
                  เลือกซื้อสินค้าต่อ
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
