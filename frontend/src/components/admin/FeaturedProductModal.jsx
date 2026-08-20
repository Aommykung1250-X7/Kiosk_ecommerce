import React, { useState, useEffect } from "react";
import {
  XMarkIcon,
  MagnifyingGlassIcon,
  CheckIcon,
  TrashIcon,
  SparklesIcon
} from "@heroicons/react/24/outline";
import { notify } from "../notify";
import CustomDropdown from "./CustomDropdown";

export default function FeaturedProductModal({
  isOpen,
  onClose,
  initialSelectedIds = [],
  onSave
}) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [slots, setSlots] = useState([null, null, null, null]);

  useEffect(() => {
    if (isOpen) {
      fetchProducts();
    }
  }, [isOpen]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/products");
      if (!res.ok) throw new Error("ไม่สามารถดึงข้อมูลสินค้าได้");
      const data = await res.json();
      setProducts(data);

      // Populate initial selected slots
      const initialSlots = [null, null, null, null];
      initialSelectedIds.forEach((id, index) => {
        if (index < 4) {
          const found = data.find((p) => Number(p.id) === Number(id));
          if (found) {
            initialSlots[index] = found;
          }
        }
      });
      setSlots(initialSlots);
    } catch (err) {
      console.error("Error fetching products:", err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  // Filter products by search and category
  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.category?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      selectedCategory === "all" || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = ["all", ...new Set(products.map((p) => p.category).filter(Boolean))];

  const isProductSelected = (productId) => {
    return slots.some((slot) => slot && Number(slot.id) === Number(productId));
  };

  const handleToggleProduct = (product) => {
    const isSelected = isProductSelected(product.id);

    if (isSelected) {
      // Remove from slots
      setSlots((prev) => prev.map((s) => (s && Number(s.id) === Number(product.id) ? null : s)));
    } else {
      // Add to first available slot
      const emptyIndex = slots.findIndex((s) => s === null);
      if (emptyIndex === -1) {
        notify.warning("คุณเลือกครบ 4 รายการแล้ว กรุณายกเลิกชิ้นเดิมก่อนเลือกใหม่");
        return;
      }
      setSlots((prev) => {
        const next = [...prev];
        next[emptyIndex] = product;
        return next;
      });
    }
  };

  const handleRemoveSlot = (index) => {
    setSlots((prev) => {
      const next = [...prev];
      next[index] = null;
      return next;
    });
  };

  const handleSave = () => {
    const selectedIds = slots.filter(Boolean).map((p) => Number(p.id));
    onSave(selectedIds);
    onClose();
  };

  const activeCount = slots.filter(Boolean).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in font-['Prompt']">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden border border-gray-100">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-150 flex items-center justify-between bg-gradient-to-r from-amber-50 to-orange-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#F8C032] rounded-xl flex items-center justify-center text-[#2B2B2B] shadow-sm">
              <SparklesIcon className="w-6 h-6 stroke-[2]" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#2B2B2B]">
                เลือกสินค้าแนะนำสำหรับหน้าพักหน้าจอ (Master Screen)
              </h2>
              <p className="text-xs text-gray-500">
                เลือกสินค้าสูงสุด 4 รายการเพื่อแสดงบนหน้าจอพักหลักของตู้ Kiosk
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-white/80 transition-all cursor-pointer"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Selected Slots Preview (Top Bar inside modal) */}
        <div className="px-6 py-3.5 bg-gray-50 border-b border-gray-200 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
              <span>ตำแหน่งการ์ดสินค้าแนะนำบนหน้าพักหน้าจอ</span>
              <span className="bg-[#F8C032]/20 text-amber-800 px-2 py-0.5 rounded-full text-[11px] font-extrabold">
                {activeCount} / 4 ช่อง
              </span>
            </span>
            {activeCount < 4 && (
              <span className="text-[11px] text-amber-700 italic">
                * หากเลือกไม่ครบ 4 รายการ ระบบจะดึงสินค้าขายดี (Best Sellers) มาแสดงทดแทนในช่องที่เหลือ
              </span>
            )}
          </div>

          <div className="grid grid-cols-4 gap-3">
            {slots.map((slotProduct, idx) => (
              <div
                key={idx}
                className={`relative h-20 rounded-xl border p-2 flex items-center gap-2 transition-all ${
                  slotProduct
                    ? "border-amber-400 bg-amber-50/60 shadow-sm"
                    : "border-dashed border-gray-300 bg-white justify-center text-gray-400"
                }`}
              >
                <div className="absolute top-1 left-1.5 bg-amber-500 text-white text-[10px] font-black px-1.5 py-0.2 rounded-md shadow-xs">
                  ช่อง {idx + 1}
                </div>

                {slotProduct ? (
                  <>
                    <div className="w-10 h-10 min-w-[2.5rem] bg-white rounded-lg border border-amber-200 overflow-hidden flex items-center justify-center p-1 mt-3">
                      {slotProduct.image ? (
                        <img
                          src={slotProduct.image}
                          alt={slotProduct.name}
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <span className="text-xs">📦</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0 mt-3">
                      <p className="text-xs font-bold text-gray-800 truncate">
                        {slotProduct.name}
                      </p>
                      <p className="text-[11px] font-black text-amber-700">
                        ฿{parseFloat(slotProduct.price).toLocaleString("th-TH")}
                      </p>
                    </div>
                    <button
                      onClick={() => handleRemoveSlot(idx)}
                      className="text-gray-400 hover:text-red-500 p-1 rounded-lg hover:bg-red-50 transition-all cursor-pointer self-start mt-3"
                      title="นำออก"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </>
                ) : (
                  <div className="text-center mt-2">
                    <span className="text-xs font-medium text-gray-400">ว่าง (สล็อต {idx + 1})</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="px-6 py-3 border-b border-gray-150 flex items-center justify-between gap-4">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="ค้นหาชื่อสินค้า..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-100 focus:bg-white border border-transparent focus:border-amber-400 rounded-xl text-sm outline-none transition-all"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-gray-500 shrink-0">หมวดหมู่:</span>
            <CustomDropdown
              value={selectedCategory}
              onChange={(val) => setSelectedCategory(val)}
              className="w-40"
              size="sm"
              options={[
                { value: "all", label: "ทั้งหมด" },
                ...categories
                  .filter((c) => c !== "all")
                  .map((cat) => ({
                    value: cat,
                    label: cat
                  }))
              ]}
            />
          </div>
        </div>

        {/* Product Grid Area */}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-50/50">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-gray-400 text-sm">
              กำลังโหลดรายการสินค้า...
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-16 text-gray-400 text-sm">
              ไม่พบสินค้าที่ตรงกับการค้นหา
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredProducts.map((product) => {
                const selected = isProductSelected(product.id);
                return (
                  <div
                    key={product.id}
                    onClick={() => handleToggleProduct(product)}
                    className={`relative bg-white rounded-2xl border p-3 flex flex-col justify-between transition-all cursor-pointer hover:shadow-md ${
                      selected
                        ? "border-amber-500 ring-2 ring-amber-400/40 bg-amber-50/20"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    {selected && (
                      <div className="absolute top-2 right-2 w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center text-white shadow-xs z-10">
                        <CheckIcon className="w-4 h-4 stroke-[3]" />
                      </div>
                    )}

                    <div className="w-full h-28 bg-gray-50 rounded-xl mb-3 flex items-center justify-center overflow-hidden p-2">
                      {product.image ? (
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <div className="text-3xl">📦</div>
                      )}
                    </div>

                    <div>
                      <h4 className="text-xs font-bold text-gray-800 line-clamp-1">
                        {product.name}
                      </h4>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-xs font-black text-amber-700">
                          ฿{parseFloat(product.price).toLocaleString("th-TH")}
                        </span>
                        <span className="text-[10px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded-md font-medium">
                          {product.category || "ทั่วไป"}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      className={`mt-3 w-full py-1.5 rounded-xl text-xs font-bold transition-all ${
                        selected
                          ? "bg-amber-100 text-amber-800 hover:bg-amber-200"
                          : "bg-gray-100 text-gray-700 hover:bg-[#F8C032] hover:text-[#2B2B2B]"
                      }`}
                    >
                      {selected ? "ยกเลิกชิ้นนี้" : "+ เลือกสินค้านี้"}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="px-6 py-4 border-t border-gray-200 bg-white flex items-center justify-between">
          <div className="text-xs text-gray-500">
            เลือกไปแล้ว <span className="font-bold text-amber-600">{activeCount}</span> / 4 ชิ้น
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-gray-600 hover:text-gray-800 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all cursor-pointer"
            >
              ยกเลิก
            </button>

            <button
              onClick={handleSave}
              className="px-6 py-2 text-sm font-bold text-[#2B2B2B] bg-[#F8C032] hover:bg-[#F0B420] rounded-xl shadow-sm transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
            >
              <CheckIcon className="w-4 h-4 stroke-[3]" />
              บันทึกสินค้าแนะนำ
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
