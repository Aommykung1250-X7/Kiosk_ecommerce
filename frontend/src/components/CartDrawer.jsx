// src/components/CartDrawer.jsx
import { useState, useEffect } from "react";
import { XMarkIcon, MinusIcon, PlusIcon, TrashIcon } from "@heroicons/react/24/outline";
import { ShoppingCartIcon, ShoppingBagIcon } from "@heroicons/react/24/solid";

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
      <div className="bg-white border-b border-gray-100 px-8 py-5 flex items-center justify-between shadow-xs shrink-0">
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl sm:text-3xl font-black text-black">Shopping basket</h2>
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

        <button
          onClick={onClose}
          className="p-2.5 rounded-full hover:bg-gray-100 border border-gray-200 transition-colors cursor-pointer"
        >
          <XMarkIcon className="w-6 h-6 text-black" />
        </button>
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

              <div className="flex flex-col gap-3.5">
                {items.map((item) => {
                  const { product, quantity } = item;

                  return (
                    <div
                      key={product.id}
                      className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-3xl shadow-sm hover:shadow-md transition-all duration-200"
                    >
                      <div className="flex items-center gap-4 min-w-0">
                        {/* Product Image */}
                        <div className="w-20 h-20 bg-[#F6F6F6] flex items-center justify-center p-2 rounded-2xl shrink-0 overflow-hidden">
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

                        {/* Product Details */}
                        <div className="flex flex-col gap-1 min-w-0">
                          <h4 className="text-base font-black text-black leading-tight truncate">
                            {product.name}
                          </h4>
                          <div>
                            <span className="bg-[#E0F2F1] text-[#00796B] text-[10px] font-black px-2.5 py-0.5 rounded-full inline-block">
                              {product.status || "Ready"}
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
                            onClick={() => {
                              const limit = product.purchaseLimit || product.purchase_limit;
                              if (limit && quantity >= limit) {
                                alert(`ขออภัย สินค้านี้จำกัดการซื้อไม่เกิน ${limit} ชิ้นต่อรายการ`);
                                return;
                              }
                              onUpdateQuantity(product.id, quantity + 1);
                            }}
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
