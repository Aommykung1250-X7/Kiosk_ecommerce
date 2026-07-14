// src/components/CartDrawer.jsx
import { XMarkIcon, MinusIcon, PlusIcon, TrashIcon } from "@heroicons/react/24/outline";
import { ShoppingCartIcon, ShoppingBagIcon } from "@heroicons/react/24/solid";

function WaterDrop() {
  return (
    <svg viewBox="0 0 100 100" className="w-16 h-16">
      <defs>
        <linearGradient id="waterGradCart" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#80D0FF" />
          <stop offset="50%" stopColor="#41A5EE" />
          <stop offset="100%" stopColor="#2568D9" />
        </linearGradient>
      </defs>
      <path
        d="M50 15 C50 15 78 48 78 65 C78 80 65 90 50 90 C35 90 22 80 22 65 C22 48 50 15 50 15 Z"
        fill="url(#waterGradCart)"
      />
      <ellipse cx="44" cy="55" rx="3" ry="8" fill="#FFFFFF" opacity="0.35" transform="rotate(-20 44 55)" />
      <ellipse cx="40" cy="45" rx="1.5" ry="4" fill="#FFFFFF" opacity="0.4" transform="rotate(-20 40 45)" />
    </svg>
  );
}

function SodaCup() {
  return (
    <svg viewBox="0 0 120 160" className="w-16 h-20">
      {/* Cup body with pink/red stripes */}
      <path d="M35 50 L85 50 L77 140 L43 140 Z" fill="#EAEAEA" />
      <path d="M48 50 L54 50 L57 140 L51 140 Z" fill="#EC4E63" />
      <path d="M66 50 L72 50 L69 140 L63 140 Z" fill="#EC4E63" />
      {/* Lid */}
      <ellipse cx="60" cy="50" rx="27" ry="8" fill="#FFFFFF" stroke="#D1D1D6" strokeWidth="1" />
      <rect x="52" y="42" width="16" height="6" rx="2" fill="#FFFFFF" stroke="#D1D1D6" strokeWidth="1" />
      {/* Straw */}
      <path d="M57 42 L57 20 L75 20" stroke="#EC4E63" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d="M57 42 L57 20 L75 20" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.3" />
    </svg>
  );
}

function ChipsBag() {
  return (
    <svg viewBox="0 0 100 120" className="w-14 h-16">
      <path d="M20 20 L80 20 L90 105 L10 105 Z" fill="#F4B400" />
      <path d="M20 20 L28 10 L72 10 L80 20 Z" fill="#DBA000" />
      <path d="M10 105 L20 115 L80 115 L90 105 Z" fill="#DBA000" />
      <circle cx="50" cy="62" r="14" fill="#FFFFFF" />
      <ellipse cx="50" cy="62" rx="9" ry="6" fill="#E37400" />
    </svg>
  );
}

function WaferBag() {
  return (
    <svg viewBox="0 0 100 120" className="w-14 h-16">
      <path d="M20 20 L80 20 L90 105 L10 105 Z" fill="#4285F4" />
      <path d="M20 20 L28 10 L72 10 L80 20 Z" fill="#2A6CD6" />
      <path d="M10 105 L20 115 L80 115 L90 105 Z" fill="#2A6CD6" />
      <rect x="30" y="50" width="40" height="30" rx="3" fill="#FFD600" />
    </svg>
  );
}

function CupNoodle() {
  return (
    <svg viewBox="0 0 100 120" className="w-14 h-16">
      <path d="M25 35 L75 35 L68 105 L32 105 Z" fill="#EA4335" />
      <ellipse cx="50" cy="35" rx="25" ry="8" fill="#F1F3F4" />
      <ellipse cx="50" cy="31" rx="25" ry="8" fill="#FFFFFF" />
      <rect x="35" y="55" width="30" height="15" rx="2" fill="#F4B400" />
    </svg>
  );
}

function MiloBox() {
  return (
    <svg viewBox="0 0 100 120" className="w-12 h-16">
      <rect x="25" y="15" width="50" height="90" rx="4" fill="#0F9D58" />
      <rect x="25" y="15" width="50" height="20" rx="4" fill="#0B8043" />
      <circle cx="50" cy="65" r="12" fill="#F4B400" />
    </svg>
  );
}

function Pen() {
  return (
    <svg viewBox="0 0 100 120" className="w-10 h-18">
      <rect x="44" y="15" width="12" height="75" rx="6" fill="#4285F4" />
      <rect x="44" y="15" width="12" height="15" rx="3" fill="#1A73E8" />
      <polygon points="44,90 56,90 50,110" fill="#3C4043" />
    </svg>
  );
}

function Notebook() {
  return (
    <svg viewBox="0 0 100 120" className="w-14 h-16">
      <rect x="25" y="15" width="55" height="90" rx="4" fill="#FBBC05" />
      <rect x="20" y="20" width="8" height="8" rx="2" fill="#3C4043" />
      <rect x="20" y="36" width="8" height="8" rx="2" fill="#3C4043" />
      <rect x="20" y="52" width="8" height="8" rx="2" fill="#3C4043" />
      <rect x="20" y="68" width="8" height="8" rx="2" fill="#3C4043" />
      <rect x="20" y="84" width="8" height="8" rx="2" fill="#3C4043" />
    </svg>
  );
}

const ILLUSTRATIONS = {
  water: WaterDrop,
  cola: SodaCup,
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
