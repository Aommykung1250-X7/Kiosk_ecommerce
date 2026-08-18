// src/components/CartDrawer.jsx
import { useState, useEffect } from "react";
import { XMarkIcon, MinusIcon, PlusIcon, TrashIcon } from "@heroicons/react/24/outline";
import { ShoppingCartIcon, ShoppingBagIcon } from "@heroicons/react/24/solid";
import { notify } from "./notify";

function CategoryPlaceholder({ category }) {
  const getIcon = () => {
    switch (category) {
      case "drinks":
        return (
          <svg className="w-10 h-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9V5.25c0-.414.168-.75.375-.75h3.75c.207 0 .375.336.375.75V9m-4.5 0h4.5m-4.5 0a3 3 0 0 1-3-3V3.75c0-.414.168-.75.375-.75h6.75c.207 0 .375.336.375.75V6a3 3 0 0 1-3 3M3.75 21h16.5M12 9v12m-5.25-6h10.5" />
          </svg>
        );
      case "snacks":
        return (
          <svg className="w-10 h-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" />
          </svg>
        );
      case "instant":
        return (
          <svg className="w-10 h-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
          </svg>
        );
      case "stationery":
        return (
          <svg className="w-10 h-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487Zm0 0L19.5 7.125" />
          </svg>
        );
      default:
        return (
          <svg className="w-10 h-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
          </svg>
        );
    }
  };

  return (
    <div className="flex flex-col items-center justify-center gap-0.5 opacity-60">
      {getIcon()}
      <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">{category || "Product"}</span>
    </div>
  );
}

export default function CartDrawer({ isOpen, onClose, cart, onUpdateQuantity, onRemoveItem, onClearCart, onCheckout }) {
  const [deliveryOption, setDeliveryOption] = useState("pickup");
  const [shippingOption, setShippingOption] = useState("combined");
  const [shippingSettings, setShippingSettings] = useState({ baseShippingFee: 40, additionalSplitShippingFee: 30 });

  useEffect(() => {
    fetch("/api/settings/shipping")
      .then(res => res.json())
      .then(data => {
        if (data.baseShippingFee !== undefined) {
          setShippingSettings(data);
        }
      })
      .catch(err => console.error("Error loading shipping settings:", err));
  }, []);

  if (!isOpen) return null;

  const { items = [], totalPrice = 0, totalItems = 0 } = cart || {};
  const hasInStock = items.some(item => item.product && item.product.status === "In Stock");
  const hasPreOrder = items.some(item => item.product && item.product.status === "Pre-Order");
  const isMixed = hasInStock && hasPreOrder;

  let shippingFee = 0;
  if (deliveryOption === "delivery") {
    if (isMixed && shippingOption === "split") {
      shippingFee = shippingSettings.baseShippingFee + (shippingSettings.additionalSplitShippingFee !== undefined ? shippingSettings.additionalSplitShippingFee : shippingSettings.baseShippingFee);
    } else {
      shippingFee = shippingSettings.baseShippingFee;
    }
  }

  return (
    <div
      className="absolute inset-0 z-50 bg-[#FAF9F6] flex flex-col animate-in fade-in zoom-in-95 duration-200 font-['Prompt'] overflow-hidden"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Premium Fullscreen Header */}
      <div className="bg-white border-b border-gray-100 px-5 py-4 flex items-center justify-between shadow-sm shrink-0">
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-extrabold text-[#2B2B2B]">ตะกร้าสินค้าของคุณ</h2>
            {totalItems > 0 && (
              <span className="bg-[#F8C032] text-[#2B2B2B] text-xs font-extrabold px-2.5 py-0.5 rounded-full shadow-sm">
                {totalItems} รายการ
              </span>
            )}
          </div>
          <p className="text-[11px] text-gray-400">รายการพัสดุและค่าจัดส่งคำนวณตามมาตรฐานตู้สินค้า Kiosk</p>
        </div>

        <button
          onClick={onClose}
          className="p-2 rounded-full hover:bg-gray-100 border border-gray-100 transition-colors cursor-pointer"
        >
          <XMarkIcon className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      {/* Cart Content Body */}
      <div className="flex-1 flex flex-col p-4 gap-4 overflow-hidden">
        {totalItems === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 bg-white rounded-[32px] border border-gray-100">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center text-gray-300">
              <ShoppingBagIcon className="w-10 h-10" />
            </div>
            <div className="text-center">
              <h3 className="text-lg font-bold text-gray-700">ไม่มีสินค้าในตะกร้า</h3>
              <p className="text-sm text-gray-400 mt-1">กรุณาเลือกหยิบสินค้าจากหน้าร้านเพื่อดำเนินการต่อ</p>
            </div>
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

                  return (
                    <div
                      key={product.id}
                      className="flex gap-6 p-4 bg-white border border-gray-100 rounded-3xl shadow-[0_4px_15px_rgba(0,0,0,0.02)] hover:shadow-md transition-all duration-200"
                    >
                      {/* Product Illustration / Image */}
                      <div className="w-28 h-28 bg-gray-50 flex items-center justify-center p-3 rounded-2xl border border-gray-100 shrink-0">
                        {product.image && product.image.includes(".") ? (
                          <img
                            src={`/uploads/products/${product.image}`}
                            alt={product.name}
                            className="max-w-full max-h-full w-auto h-auto object-contain rounded-xl"
                          />
                        ) : (
                          <CategoryPlaceholder category={product.category} />
                        )}
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
                            {(product.purchaseLimit || product.purchase_limit) && (
                              <span className="text-[10px] text-red-500 bg-red-50 px-2.5 py-0.5 rounded-full font-bold">
                                จำกัดไม่เกิน {product.purchaseLimit || product.purchase_limit} ชิ้น
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
                            ฿{(product.price * quantity).toLocaleString('th-TH')}
                          </span>
                          <span className="text-xs text-gray-400">
                            (฿{product.price.toLocaleString('th-TH')}/ชิ้น)
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
                            onClick={() => {
                              const limit = product.purchaseLimit || product.purchase_limit;
                              if (limit && quantity >= limit) {
                                notify.warning(`ขออภัย สินค้านี้จำกัดการซื้อไม่เกิน ${limit} ชิ้นต่อรายการ`);
                                return;
                              }
                              onUpdateQuantity(product.id, quantity + 1);
                            }}
                            className={`p-1.5 rounded-xl text-gray-500 transition-colors cursor-pointer active:scale-90 ${(product.purchaseLimit || product.purchase_limit) && quantity >= (product.purchaseLimit || product.purchase_limit) ? "opacity-30 cursor-not-allowed" : "hover:bg-gray-200"}`}
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

            {/* Order Summary Section */}
            <div className="w-full bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between shrink-0 gap-3 animate-in slide-in-from-bottom duration-300">
              <div className="flex flex-col gap-2.5">
                <h3 className="text-base font-black text-[#2B2B2B] border-b border-gray-50 pb-2">สรุปยอดชำระเงิน</h3>

                {/* รูปแบบการรับสินค้า (Delivery Method Selection) */}
                <div className="flex flex-col gap-2">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">รูปแบบการรับสินค้า</span>
                  <div className="grid grid-cols-2 gap-2 bg-gray-50 p-1.5 rounded-2xl border border-gray-100">
                    <button
                      onClick={() => setDeliveryOption("pickup")}
                      className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        deliveryOption === "pickup"
                          ? "bg-white text-[#2B2B2B] shadow-sm border border-gray-200/40"
                          : "text-gray-400 hover:text-gray-600"
                      }`}
                    >
                      🏪 รับสินค้าเองที่นี่
                    </button>
                    <button
                      onClick={() => setDeliveryOption("delivery")}
                      className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        deliveryOption === "delivery"
                          ? "bg-white text-[#2B2B2B] shadow-sm border border-gray-200/40"
                          : "text-gray-400 hover:text-gray-600"
                      }`}
                    >
                      🚚 จัดส่งพัสดุ
                    </button>
                  </div>
                </div>

                {/* แยกจัดส่งสำหรับออเดอร์ผสม (Split Shipping Selector) */}
                {deliveryOption === "delivery" && isMixed && (
                  <div className="flex flex-col gap-2 bg-[#F8C032]/5 p-4 rounded-2xl border border-[#F8C032]/10 animate-in fade-in slide-in-from-top-2 duration-200">
                    <span className="text-xs font-bold text-[#A24B2C] uppercase tracking-wide">ตัวเลือกจัดส่งสินค้าผสม</span>
                    <div className="flex flex-col gap-2 mt-1">
                      <label className="flex items-start gap-2.5 cursor-pointer select-none">
                        <input
                          type="radio"
                          name="shipping_option"
                          checked={shippingOption === "combined"}
                          onChange={() => setShippingOption("combined")}
                          className="mt-1 accent-[#A24B2C]"
                        />
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-[#2B2B2B]">จัดส่งพร้อมกันทั้งหมด</span>
                          <span className="text-[10px] text-gray-400">รอส่งรอบเดียวเมื่อสินค้า Pre-Order ครบ (ค่าส่งปกติ ฿{shippingSettings.baseShippingFee.toLocaleString('th-TH')})</span>
                        </div>
                      </label>
                      
                      <label className="flex items-start gap-2.5 cursor-pointer select-none border-t border-gray-100 pt-2 mt-1">
                        <input
                          type="radio"
                          name="shipping_option"
                          checked={shippingOption === "split"}
                          onChange={() => setShippingOption("split")}
                          className="mt-1 accent-[#A24B2C]"
                        />
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-[#2B2B2B]">แยกจัดส่งสินค้า (บวกค่าส่งเพิ่ม)</span>
                          <span className="text-[10px] text-gray-400">ส่งของพร้อมส่งทันที + Pre-Order ตามหลัง (ค่าส่งรวม ฿{(shippingSettings.baseShippingFee + (shippingSettings.additionalSplitShippingFee !== undefined ? shippingSettings.additionalSplitShippingFee : shippingSettings.baseShippingFee)).toLocaleString('th-TH')})</span>
                        </div>
                      </label>
                    </div>
                  </div>
                )}

                {/* Cost Breakdown Rows */}
                <div className="flex flex-col gap-3">
                  <div className="flex justify-between items-center text-sm text-gray-400">
                    <span>จำนวนรายการทั้งหมด</span>
                    <span className="font-bold text-[#2B2B2B]">{totalItems} ชิ้น</span>
                  </div>
                  <div className="flex justify-between items-center text-sm text-gray-400">
                    <span>วิธีกระจายสินค้า</span>
                    <span className="font-bold text-[#2B2B2B]">
                      {deliveryOption === "pickup" ? "🏪 รับที่ตู้ Kiosk" : "🚚 จัดส่งพัสดุ"}
                    </span>
                  </div>
                  {deliveryOption === "delivery" && (
                    <div className="flex justify-between items-center text-sm text-gray-400">
                      <span>ค่าบริการจัดส่ง</span>
                      <span className="font-bold text-[#E53935]">฿{shippingFee}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center text-sm text-gray-400">
                    <span>การชำระเงิน</span>
                    <span className="font-medium text-[#2B2B2B]">PromptPay Dynamic QR</span>
                  </div>
                </div>

                <hr className="border-gray-100 my-2" />

                {/* Grand Total display */}
                <div className="flex justify-between items-end">
                  <span className="text-sm font-bold text-gray-400 uppercase tracking-wide">ยอดรวมสุทธิ</span>
                  <span className="text-3xl font-black text-[#E53935] leading-none">
                    ฿{(totalPrice + shippingFee).toLocaleString('th-TH')}
                  </span>
                </div>
              </div>

              {/* Checkout / Clear Action buttons */}
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => {
                    onCheckout(deliveryOption, shippingOption);
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
