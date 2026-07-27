import { useState } from "react";
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
  const [deliveryMethod, setDeliveryMethod] = useState("pickup"); // "pickup" (รับที่นี่ - ฿0) or "home" (ส่งไปบ้าน - ฿20)

  if (!isOpen) return null;

  const { items = [], totalPrice = 0, totalItems = 0 } = cart || {};
  const shippingFee = deliveryMethod === "home" ? 20 : 0;

  return (
    <div
      className="absolute inset-0 z-50 bg-[#FAF9F6] flex flex-col animate-in fade-in zoom-in-95 duration-200 font-['Prompt'] overflow-hidden"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Fullscreen Header matching cart.png */}
      <div className="bg-white border-b border-gray-100 px-8 py-6 flex flex-col gap-1 shadow-xs shrink-0">
        <div className="flex items-center gap-3">
          <h2 className="text-3xl font-black text-black">Shopping basket</h2>
          {totalItems > 0 && (
            <span className="bg-[#F9C338] text-black text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider">
              {totalItems} ITEM
            </span>
          )}
        </div>
        <p className="text-xs font-semibold text-gray-400">
          Verify the accuracy and quantity of the items before proceeding with payment.
        </p>
      </div>

      {/* Cart Content Body */}
      <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 max-w-2xl w-full mx-auto">
        {items.length === 0 ? (
          // Empty State View
          <div className="flex-1 bg-white rounded-3xl border border-gray-100 shadow-sm flex flex-col items-center justify-center p-12 text-center gap-6 my-auto">
            <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center border border-gray-100 shadow-inner">
              <ShoppingBagIcon className="w-12 h-12 text-gray-300 animate-pulse" />
            </div>
            <div className="flex flex-col gap-2 max-w-sm">
              <p className="text-xl font-black text-black">Shopping cart is empty</p>
              <p className="text-sm font-semibold text-gray-400 leading-relaxed">
                Add products from the catalog to proceed with payment.
              </p>
            </div>
            <button
              onClick={onClose}
              className="px-8 py-3.5 bg-[#F9C338] hover:bg-[#F2BD2B] active:scale-95 text-black font-extrabold rounded-2xl transition-all shadow-sm select-none cursor-pointer border-2 border-black"
            >
              Continue shopping
            </button>
          </div>
        ) : (
          <>
            {/* Cart Items List matching cart.png */}
            <div className="flex flex-col gap-4">
              <div className="flex justify-between items-center px-1">
                <span className="text-xs font-bold text-gray-400">Items in the shopping cart</span>
                <button
                  onClick={onClearCart}
                  className="text-xs text-[#FF5252] hover:text-red-700 font-bold hover:underline select-none cursor-pointer"
                >
                  Clear cart
                </button>
              </div>

              <div className="flex flex-col gap-4">
                {items.map((item) => {
                  const { product, quantity } = item;
                  const Illustration = ILLUSTRATIONS[product.image] || WaterDrop;

                  return (
                    <div
                      key={product.id}
                      className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-3xl shadow-sm hover:shadow-md transition-all duration-200"
                    >
                      <div className="flex items-center gap-4 min-w-0">
                        {/* Product Image */}
                        <div className="w-20 h-20 bg-[#F6F6F6] flex items-center justify-center p-2 rounded-2xl shrink-0">
                          <Illustration />
                        </div>

                        {/* Product Details */}
                        <div className="flex flex-col gap-1 min-w-0">
                          <h4 className="text-base font-black text-black leading-tight truncate">
                            {product.name}
                          </h4>
                          <div>
                            <span className="bg-[#E0F2F1] text-[#00796B] text-[10px] font-black px-2.5 py-0.5 rounded-full inline-block">
                              Ready
                            </span>
                          </div>
                          <div className="flex items-baseline gap-1.5 mt-0.5">
                            <span className="text-lg font-black text-[#E53935]">
                              ฿{(product.price * quantity).toFixed(0)}
                            </span>
                            <span className="text-[11px] font-semibold text-gray-400">
                              (฿{product.price}/piece)
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Controls on right matching cart.png */}
                      <div className="flex flex-col items-end justify-between h-20 shrink-0">
                        {/* Trash Delete Button */}
                        <button
                          onClick={() => onRemoveItem(product.id)}
                          className="p-1 hover:bg-red-50 text-[#FF5252] rounded-lg transition-colors cursor-pointer"
                          title="Remove item"
                        >
                          <TrashIcon className="w-5 h-5" />
                        </button>

                        {/* Quantity Selector matching cart.png */}
                        <div className="flex items-center bg-[#F4F4F6] border border-gray-200 rounded-full h-9 px-2 shadow-inner gap-2">
                          <button
                            onClick={() => onUpdateQuantity(product.id, quantity - 1)}
                            className="w-6 h-6 flex items-center justify-center text-gray-600 hover:text-black font-bold text-base cursor-pointer active:scale-90"
                          >
                            -
                          </button>
                          <span className="w-5 text-center text-sm font-black text-black">
                            {quantity}
                          </span>
                          <button
                            onClick={() => onUpdateQuantity(product.id, quantity + 1)}
                            className="w-6 h-6 flex items-center justify-center text-gray-600 hover:text-black font-bold text-base cursor-pointer active:scale-90"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Delivery Option Selection (รับที่นี่ ฿0 / ส่งไปบ้าน ฿20) */}
            <div className="bg-white p-5 rounded-[28px] border border-gray-100 shadow-sm flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-black uppercase tracking-wider">
                  รูปแบบการรับสินค้า / Delivery option
                </span>
                <span className="text-[10px] font-extrabold text-gray-400">
                  {deliveryMethod === "home" ? "ค่าจัดส่ง ฿20" : "ไม่มีค่าจัดส่ง"}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Pick up here option */}
                <button
                  type="button"
                  onClick={() => setDeliveryMethod("pickup")}
                  className={`p-3.5 rounded-2xl border-2 flex items-center justify-between transition-all cursor-pointer select-none ${
                    deliveryMethod === "pickup"
                      ? "border-black bg-[#F9C338]/20 text-black font-black shadow-xs"
                      : "border-gray-200 bg-[#F4F4F6] text-gray-600 font-bold hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🏪</span>
                    <div className="flex flex-col text-left leading-tight">
                      <span className="text-xs font-black">รับที่นี่</span>
                      <span className="text-[10px] text-gray-500 font-semibold">Pick up</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-black text-[#00796B] bg-[#E0F2F1] px-2 py-0.5 rounded-full">
                    FREE
                  </span>
                </button>

                {/* Delivery to home option */}
                <button
                  type="button"
                  onClick={() => setDeliveryMethod("home")}
                  className={`p-3.5 rounded-2xl border-2 flex items-center justify-between transition-all cursor-pointer select-none ${
                    deliveryMethod === "home"
                      ? "border-black bg-[#F9C338]/20 text-black font-black shadow-xs"
                      : "border-gray-200 bg-[#F4F4F6] text-gray-600 font-bold hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🏠</span>
                    <div className="flex flex-col text-left leading-tight">
                      <span className="text-xs font-black">ส่งไปบ้าน</span>
                      <span className="text-[10px] text-gray-500 font-semibold">Home</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-black text-[#E53935] bg-red-50 px-2 py-0.5 rounded-full">
                    ฿20
                  </span>
                </button>
              </div>
            </div>

            {/* Summary of Payments Card matching cart.png */}
            <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-md flex flex-col gap-4 mt-auto">
              <h3 className="text-2xl font-black text-black">Summary of Payments</h3>

              <div className="flex flex-col gap-2 font-semibold text-sm">
                <div className="flex justify-between items-center text-gray-400">
                  <span>Total number of items</span>
                  <span className="font-bold text-black">{totalItems} items</span>
                </div>
                <div className="flex justify-between items-center text-gray-400">
                  <span>Shipping cost</span>
                  {shippingFee > 0 ? (
                    <span className="font-bold text-[#E53935]">฿{shippingFee} (ส่งไปบ้าน)</span>
                  ) : (
                    <span className="font-bold text-[#00796B]">Free (รับที่นี่)</span>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-1 mt-1">
                <span className="text-sm font-bold text-gray-400">Total</span>
                <span className="text-4xl font-black text-[#E53935]">
                  ฿{(totalPrice + shippingFee).toFixed(0)}
                </span>
              </div>

              {/* Action Buttons matching cart.png */}
              <div className="flex flex-col gap-3 mt-2">
                <button
                  onClick={() => {
                    onCheckout(shippingFee, deliveryMethod);
                    onClose();
                  }}
                  className="h-14 w-full rounded-2xl bg-[#F9C338] hover:bg-[#F2BD2B] active:scale-[0.98]
                             flex items-center justify-center gap-2 transition-all duration-150 shadow-sm border-2 border-black font-extrabold text-base text-black cursor-pointer uppercase"
                >
                  <ShoppingCartIcon className="w-5 h-5" />
                  <span>Proceed with payment</span>
                </button>
                <button
                  onClick={onClose}
                  className="h-14 w-full rounded-2xl bg-[#F4F4F6] hover:bg-gray-200 text-gray-700 font-extrabold text-base transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center"
                >
                  Continue shopping
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
