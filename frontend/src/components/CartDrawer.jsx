// src/components/CartDrawer.jsx
import { useState, useEffect } from "react";
import { TrashIcon } from "@heroicons/react/24/outline";
import { ShoppingBagIcon } from "@heroicons/react/24/solid";
import { notify } from "./notify";

function CategoryPlaceholder({ category }) {
  return (
    <div className="flex flex-col items-center justify-center gap-0.5 opacity-40">
      <svg className="w-10 h-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
      </svg>
      <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">{category || "PRODUCT"}</span>
    </div>
  );
}

export default function CartDrawer({
  isOpen,
  onClose,
  cart,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onCheckout
}) {
  const [deliveryOption, setDeliveryOption] = useState("pickup");
  const [shippingOption, setShippingOption] = useState("combined");
  const [shippingSettings, setShippingSettings] = useState({
    baseShippingFee: 20,
    additionalSplitShippingFee: 20
  });

  useEffect(() => {
    fetch("/api/settings/shipping")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && typeof data.baseShippingFee === "number") {
          setShippingSettings(data);
        }
      })
      .catch((err) => console.error("Error loading shipping settings:", err));
  }, []);

  if (!isOpen) return null;

  const { items = [], totalPrice = 0, totalItems = 0 } = cart || {};
  const hasInStock = items.some((item) => item.product && item.product.status === "In Stock");
  const hasPreOrder = items.some((item) => item.product && item.product.status === "Pre-Order");
  const isMixed = hasInStock && hasPreOrder;

  let shippingFee = 0;
  if (deliveryOption === "delivery") {
    if (isMixed && shippingOption === "split") {
      shippingFee =
        shippingSettings.baseShippingFee +
        (shippingSettings.additionalSplitShippingFee !== undefined
          ? shippingSettings.additionalSplitShippingFee
          : shippingSettings.baseShippingFee);
    } else {
      shippingFee = shippingSettings.baseShippingFee;
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-[#F2F2F2] flex flex-col animate-in fade-in zoom-in-95 duration-200 font-['DIN_Pro_Cond',_'Prompt',_sans-serif] overflow-hidden"
      onClick={(e) => e.stopPropagation()}
    >
      {/* 1. Header: Dark Navy with DITC logo and Shopping basket title */}
      <header className="w-full bg-[#0E1B3E] px-6 py-4 sm:py-5 flex items-center justify-between shrink-0 shadow-md select-none z-10">
        {/* Left: DITC Logo */}
        <div className="flex items-center gap-3 shrink-0">
          <img
            src="/ditc_logo.png"
            alt="DITC"
            className="h-9 sm:h-10 w-auto object-contain mix-blend-screen"
          />
        </div>

        {/* Center / Right: Title, Badge & Subtitle */}
        <div className="flex flex-col items-end leading-tight">
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Shopping basket
            </h1>
            <span className="bg-[#FABE2C] text-black text-xs font-bold px-3 py-0.5 rounded-full uppercase tracking-wider shadow-xs">
              {totalItems} ITEM
            </span>
          </div>
          <p className="text-[10px] sm:text-[11px] text-white/70 font-normal mt-0.5">
            Verify the accuracy and quantity of the items before proceeding with payment.
          </p>
        </div>
      </header>

      {/* 2. Cart Content Body */}
      <main className="flex-1 flex flex-col p-4 sm:p-6 gap-4 overflow-y-auto min-h-0">
        {totalItems === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 bg-white rounded-[32px] border border-gray-100 p-8 shadow-xs">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center text-gray-400">
              <ShoppingBagIcon className="w-10 h-10" />
            </div>
            <div className="text-center">
              <h3 className="text-lg font-bold text-gray-800">ไม่มีสินค้าในตะกร้า</h3>
              <p className="text-xs text-gray-400 mt-1">กรุณาเลือกสินค้าจากหน้าร้านเพื่อดำเนินการต่อ</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="mt-2 px-6 py-2.5 bg-[#101C38] text-white font-bold rounded-2xl text-sm shadow-md active:scale-95 transition-all cursor-pointer"
            >
              กลับไปเลือกสินค้า
            </button>
          </div>
        ) : (
          <>
            {/* Top Row: Items label + Clear Cart */}
            <div className="w-full max-w-[569.39px] mx-auto flex justify-between items-center px-1 select-none shrink-0">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Items in the shopping cart
              </span>
              <button
                type="button"
                onClick={onClearCart}
                className="text-xs text-[#E53935] hover:text-red-700 font-bold hover:underline select-none cursor-pointer transition-colors"
              >
                ลบสินค้าทั้งหมด
              </button>
            </div>

            {/* Cart Items List: Shows 4 items by default, or 3 items when split-shipping options are visible */}
            <div
              className={`w-full max-w-[569.39px] mx-auto flex flex-col gap-3.5 overflow-y-auto pr-1 pb-1 scroll-smooth shrink-0 transition-all duration-300 ${
                deliveryOption === "delivery" && isMixed
                  ? "max-h-[430px] sm:max-h-[450px]"
                  : "max-h-[580px] sm:max-h-[600px]"
              }`}
            >
              {items.map((item) => {
                const { product, quantity } = item;
                const isOutOfStock = product.status === "In Stock" && product.quantity <= 0;

                return (
                  <div
                    key={product.id}
                    className="w-full max-w-[569.39px] min-h-[132px] sm:min-h-[140px] flex items-center justify-between p-4 sm:p-4.5 bg-white border border-gray-100 rounded-[10px] shadow-[0_6px_20px_rgba(0,0,0,0.04)] hover:shadow-md transition-all gap-4 shrink-0 mx-auto"
                  >
                    {/* Left: Larger Product Image */}
                    <div className="w-24 h-24 sm:w-26 sm:h-26 bg-[#F4F5F7] flex items-center justify-center p-2 rounded-[8px] shrink-0 overflow-hidden select-none">
                      {product.image && product.image.includes(".") ? (
                        <img
                          src={`/uploads/products/${product.image}`}
                          alt={product.name}
                          className="max-w-full max-h-full w-auto h-auto object-contain"
                        />
                      ) : (
                        <CategoryPlaceholder category={product.category} />
                      )}
                    </div>

                    {/* Middle: Details */}
                    <div className="flex-1 flex flex-col justify-between min-w-0 self-stretch py-1">
                      <div>
                        <h3 className="text-base sm:text-lg font-extrabold text-gray-900 leading-snug line-clamp-1">
                          {product.name}
                        </h3>
                        <div className="mt-1">
                          {isOutOfStock ? (
                            <span className="bg-[#F85153] text-white text-[10px] sm:text-xs font-bold px-2.5 py-0.5 rounded-full inline-block">
                              SOLD OUT
                            </span>
                          ) : product.status === "Pre-Order" ? (
                            <span className="bg-[#F5A623] text-white text-[10px] sm:text-xs font-bold px-2.5 py-0.5 rounded-full inline-block">
                              PRE-ORDER
                            </span>
                          ) : (
                            <span className="bg-[#1CD0A2] text-white text-[10px] sm:text-xs font-bold px-2.5 py-0.5 rounded-full inline-block">
                              In-stock
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Price & unit price */}
                      <div className="flex items-baseline gap-2 mt-2">
                        <span className="text-xl sm:text-2xl font-black text-[#E53935] tracking-tight">
                          ฿{(product.price * quantity).toLocaleString("th-TH", {
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 2,
                          })}
                        </span>
                        <span className="text-xs sm:text-sm text-gray-400 font-medium">
                          (฿{product.price}/piece)
                        </span>
                      </div>
                    </div>

                    {/* Right: Trash Icon & Larger Stepper */}
                    <div className="flex flex-col items-end justify-between self-stretch py-1 shrink-0">
                      {/* Delete button */}
                      <button
                        type="button"
                        onClick={() => onRemoveItem(product.id)}
                        className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                        title="ลบรายการนี้"
                      >
                        <TrashIcon className="w-5 h-5" />
                      </button>

                      {/* Longer & Wider Dark Navy Stepper Pill */}
                      <div className="flex items-center justify-between bg-[#101C38] text-white rounded-full w-[130px] sm:w-[145px] h-10 px-3 shadow-xs select-none">
                        <button
                          type="button"
                          onClick={() => onUpdateQuantity(product.id, quantity - 1)}
                          className="w-7 h-7 flex items-center justify-center rounded-full text-white hover:bg-white/20 font-black text-lg cursor-pointer active:scale-90 transition-all"
                        >
                          −
                        </button>
                        <span className="text-white text-sm sm:text-base font-black min-w-5 text-center">
                          {quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            const limit = product.purchaseLimit || product.purchase_limit;
                            if (limit && quantity >= limit) {
                              notify.warning(`ขออภัย สินค้านี้จำกัดการซื้อไม่เกิน ${limit} ชิ้นต่อรายการ`);
                              return;
                            }
                            onUpdateQuantity(product.id, quantity + 1);
                          }}
                          className="w-7 h-7 flex items-center justify-center rounded-full text-white hover:bg-white/20 font-black text-lg cursor-pointer active:scale-90 transition-all"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 3. Order Summary Card matching mockup */}
            <div className="w-full max-w-[569.39px] mx-auto bg-white p-5 sm:p-6 rounded-[28px] sm:rounded-[32px] border border-gray-100 shadow-[0_8px_30px_rgba(0,0,0,0.06)] flex flex-col gap-3.5 mt-auto select-none shrink-0 animate-in slide-in-from-bottom duration-300">
              <div className="flex flex-col gap-3">
                <h2 className="text-2xl font-black text-gray-900 tracking-tight">
                  Order Summary
                </h2>

                {/* Delivery Method Segmented Bar */}
                <div className="flex flex-col gap-1.5">
                  <span className="text-xs font-semibold text-gray-500">
                    รูปแบบสินค้า
                  </span>
                  <div className="flex items-center bg-[#F2F2F2] p-1.5 rounded-2xl gap-2">
                    <button
                      type="button"
                      onClick={() => setDeliveryOption("pickup")}
                      className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                        deliveryOption === "pickup"
                          ? "bg-white text-gray-900 shadow-xs"
                          : "text-gray-500 hover:text-gray-700"
                      }`}
                    >
                      <span>🛍️</span>
                      <span>รับสินค้าเองที่นี่</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeliveryOption("delivery")}
                      className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                        deliveryOption === "delivery"
                          ? "bg-white text-gray-900 shadow-xs"
                          : "text-gray-500 hover:text-gray-700"
                      }`}
                    >
                      <span>🚚</span>
                      <span>จัดส่งพัสดุ</span>
                    </button>
                  </div>
                </div>

                {/* Split Shipping Option if Mixed Pre-Order */}
                {deliveryOption === "delivery" && isMixed && (
                  <div className="flex flex-col gap-2 bg-amber-50/70 p-3.5 rounded-2xl border border-amber-200/60 animate-in fade-in duration-200">
                    <span className="text-xs font-bold text-[#A24B2C] uppercase tracking-wide">
                      ตัวเลือกจัดส่งสินค้าผสม (มีสินค้า PRE-ORDER)
                    </span>
                    <div className="flex flex-col gap-2 mt-0.5">
                      <label className="flex items-start gap-2.5 cursor-pointer select-none">
                        <input
                          type="radio"
                          name="shipping_option"
                          checked={shippingOption === "combined"}
                          onChange={() => setShippingOption("combined")}
                          className="mt-1 accent-[#101C38]"
                        />
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-gray-800">จัดส่งพร้อมกันทั้งหมด</span>
                          <span className="text-[10px] text-gray-500">
                            รอส่งรอบเดียวเมื่อสินค้า Pre-Order ครบ (ค่าส่งปกติ ฿{shippingSettings.baseShippingFee})
                          </span>
                        </div>
                      </label>

                      <label className="flex items-start gap-2.5 cursor-pointer select-none border-t border-amber-200/50 pt-2">
                        <input
                          type="radio"
                          name="shipping_option"
                          checked={shippingOption === "split"}
                          onChange={() => setShippingOption("split")}
                          className="mt-1 accent-[#101C38]"
                        />
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-gray-800">แยกจัดส่งสินค้า (บวกค่าส่งเพิ่ม)</span>
                          <span className="text-[10px] text-gray-500">
                            ส่งของพร้อมส่งทันที + Pre-Order ตามหลัง (ค่าส่งรวม ฿{shippingSettings.baseShippingFee + (shippingSettings.additionalSplitShippingFee !== undefined ? shippingSettings.additionalSplitShippingFee : shippingSettings.baseShippingFee)})
                          </span>
                        </div>
                      </label>
                    </div>
                  </div>
                )}

                {/* Cost Breakdown Rows */}
                <div className="flex flex-col gap-2 pt-1 text-xs sm:text-sm">
                  <div className="flex justify-between items-center text-gray-500 font-normal">
                    <span>จำนวนรายการทั้งหมด</span>
                    <span className="font-bold text-gray-800">{totalItems} รายการ</span>
                  </div>
                  <div className="flex justify-between items-center text-gray-500 font-normal">
                    <span>การจัดส่ง</span>
                    <span className="font-bold text-gray-800">
                      {deliveryOption === "pickup"
                        ? "รับสินค้าเองที่นี่"
                        : shippingOption === "split" && isMixed
                        ? "จัดส่งพัสดุ (แยกส่ง)"
                        : "จัดส่งพัสดุ"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-gray-500 font-normal">
                    <span>ค่าบริการจัดส่ง</span>
                    {shippingFee > 0 ? (
                      <span className="font-bold text-[#E53935]">฿{shippingFee}</span>
                    ) : (
                      <span className="font-bold text-[#00796B]">ฟรี (฿0)</span>
                    )}
                  </div>
                </div>

                <hr className="border-gray-200 my-1" />

                {/* Grand Total Row */}
                <div className="flex justify-between items-center pt-1">
                  <span className="text-sm sm:text-base font-bold text-gray-700">
                    ยอดรวมสุทธิ
                  </span>
                  <span className="text-3xl sm:text-4xl font-black text-[#E53935] tracking-tight">
                    ฿{(totalPrice + shippingFee).toLocaleString("th-TH")}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-2.5 mt-2">
                {/* 1. Proceed with payment button matching mockup */}
                <button
                  type="button"
                  onClick={() => {
                    onCheckout(shippingFee, deliveryOption, shippingOption);
                    onClose();
                  }}
                  className="h-14 sm:h-15 w-full rounded-2xl bg-[#FABE2C] hover:bg-[#F5B41C] active:scale-[0.98]
                             flex items-center justify-center gap-2.5 transition-all shadow-[0_10px_28px_rgba(245,180,28,0.4)] hover:shadow-[0_14px_32px_rgba(245,180,28,0.55)] font-bold text-base sm:text-lg text-gray-900 cursor-pointer select-none"
                >
                  {/* Scan / Barcode Frame Icon */}
                  <svg className="w-6 h-6 text-gray-900 stroke-[2.2]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 7V5a2 2 0 0 1 2-2h2" />
                    <path d="M17 3h2a2 2 0 0 1 2 2v2" />
                    <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
                    <path d="M3 17v2a2 2 0 0 0 2 2h2" />
                    <line x1="8" y1="8" x2="8" y2="16" />
                    <line x1="12" y1="8" x2="12" y2="16" />
                    <line x1="16" y1="8" x2="16" y2="16" />
                  </svg>
                  <span>Proceed with payment</span>
                </button>

                {/* 2. Continue shopping button matching mockup */}
                <button
                  type="button"
                  onClick={onClose}
                  className="h-13 sm:h-14 w-full rounded-2xl bg-white hover:bg-gray-50 text-gray-700 font-bold text-sm sm:text-base transition-all active:scale-[0.98] border-2 border-gray-200 cursor-pointer flex items-center justify-center shadow-xs select-none"
                >
                  Continue shopping
                </button>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}


