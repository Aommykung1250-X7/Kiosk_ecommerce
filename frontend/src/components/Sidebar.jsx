import React, { useState, useEffect } from "react";
import { Squares2X2Icon, TagIcon, CheckIcon, GlobeAltIcon } from "@heroicons/react/24/outline";
import { QRCodeSVG } from "qrcode.react";

export default function Sidebar({
  selectedCategory,
  selectedCategories = ["all"],
  onSelectCategory,
  onToggleCategory
}) {
  const [categories, setCategories] = useState([]);
  const [externalUrl, setExternalUrl] = useState("https://www.ditc.co.th");

  useEffect(() => {
    // Fetch contact settings for external website URL
    fetch("/api/settings/contact")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && (data.externalWebsiteUrl || data.website)) {
          setExternalUrl(data.externalWebsiteUrl || data.website);
        }
      })
      .catch((err) => console.error("Error fetching contact settings in Sidebar:", err));

    fetch("/api/categories")
      .then((res) => (res.ok ? res.json() : []))
      .then((categoriesData) => {
        const rawCategories = Array.isArray(categoriesData) ? categoriesData : [];

        const filteredCategories = rawCategories.filter((c) => {
          const cleanId = String(c.id || "").trim().toLowerCase();
          const cleanName = String(c.name || "").trim().toLowerCase();
          if (cleanId === "all" || cleanName === "all" || cleanName === "ทั้งหมด") return false;
          if (cleanId === "promotion" || cleanName === "promotion" || cleanName === "โปรโมชั่น") return false;
          return true;
        });

        setCategories(filteredCategories);
      })
      .catch((err) => {
        console.error("Error loading categories in Sidebar:", err);
      });
  }, []);

  const activeCategories = Array.isArray(selectedCategories)
    ? selectedCategories
    : (selectedCategory ? (Array.isArray(selectedCategory) ? selectedCategory : [selectedCategory]) : ["all"]);

  const isAll = activeCategories.length === 0 || activeCategories.includes("all");
  const isPromo = activeCategories.includes("promotion");
  const isHot = activeCategories.includes("hot");

  const handleToggle = (catId) => {
    if (onToggleCategory) {
      onToggleCategory(catId);
    } else if (onSelectCategory) {
      onSelectCategory(catId);
    }
  };

  return (
    <aside
      className="w-[190px] sm:w-[210px] h-full bg-white border-r border-gray-200 shrink-0 flex flex-col 
                 pt-5 pb-4 px-3.5 sm:px-4 font-['DIN_Pro_Cond',_'Prompt',_sans-serif] select-none z-10 overflow-hidden justify-between"
    >
      {/* Scrollable Category List Container */}
      <div className="flex-1 min-h-0 overflow-y-auto pr-1 flex flex-col gap-2.5">
        {/* Category Header */}
        <div className="px-1 pb-0.5 sticky top-0 bg-white z-10">
          <h2 className="text-xs sm:text-sm font-bold text-gray-900 tracking-wider uppercase">
            CATEGORY
          </h2>
        </div>

        {/* Primary Pill Buttons: ALL & Promotion */}
        <div className="flex flex-col gap-2.5">
          {/* ALL Button */}
          <button
            type="button"
            onClick={() => handleToggle("all")}
            className={`h-11 w-full rounded-xl flex items-center gap-3 px-4 transition-all duration-150 active:scale-[0.98] cursor-pointer font-bold text-sm uppercase ${
              isAll
                ? "bg-[#101C38] text-white shadow-xs"
                : "bg-[#F1F4F8] text-gray-800 hover:bg-gray-200/80"
            }`}
          >
            <Squares2X2Icon className={`w-5 h-5 shrink-0 ${isAll ? "text-white" : "text-gray-700"}`} />
            <span className="tracking-wide font-bold">ALL</span>
          </button>

          {/* Promotion Button */}
          <button
            type="button"
            onClick={() => handleToggle("promotion")}
            className={`h-11 w-full rounded-xl flex items-center gap-3 px-4 transition-all duration-150 active:scale-[0.98] cursor-pointer text-sm ${
              isPromo
                ? "bg-[#101C38] text-white shadow-xs font-bold"
                : "bg-[#F1F4F8] text-gray-800 hover:bg-gray-200/80 font-medium"
            }`}
          >
            <TagIcon className={`w-5 h-5 shrink-0 ${isPromo ? "text-white" : "text-gray-700"}`} />
            <span className="tracking-wide">Promotion</span>
          </button>
        </div>

        {/* Divider */}
        <div className="w-full border-t border-gray-300 my-1" />

        {/* Checkbox-style Category List */}
        <div className="flex flex-col gap-3 px-1">
          {categories.map((cat) => {
            const isSelected = !isAll && activeCategories.includes(cat.id);
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => handleToggle(cat.id)}
                className="flex items-center gap-3 w-full text-left cursor-pointer group py-1"
              >
                <div
                  className={`w-5 h-5 rounded-[4px] flex items-center justify-center transition-all shrink-0 ${
                    isSelected
                      ? "bg-[#101C38] border-2 border-[#101C38] text-white"
                      : "border-2 border-gray-900 bg-white group-hover:border-black"
                  }`}
                >
                  {isSelected && <CheckIcon className="w-3.5 h-3.5 stroke-[3]" />}
                </div>
                <span
                  className={`text-sm tracking-tight truncate transition-colors ${
                    isSelected ? "font-bold text-gray-900" : "font-medium text-gray-800 group-hover:text-black"
                  }`}
                >
                  {cat.name || cat.label || cat.id}
                </span>
              </button>
            );
          })}

          {/* HOT NOW Filter */}
          <button
            type="button"
            onClick={() => handleToggle("hot")}
            className="flex items-center gap-3 w-full text-left cursor-pointer group py-1"
          >
            <div
              className={`w-5 h-5 rounded-[4px] flex items-center justify-center transition-all shrink-0 ${
                isHot
                  ? "bg-[#101C38] border-2 border-[#101C38] text-white"
                  : "border-2 border-gray-900 bg-white group-hover:border-black"
              }`}
            >
              {isHot && <CheckIcon className="w-3.5 h-3.5 stroke-[3]" />}
            </div>
            <span
              className={`text-sm tracking-tight truncate transition-colors ${
                isHot ? "font-bold text-gray-900" : "font-medium text-gray-800 group-hover:text-black"
              }`}
            >
              HOT NOW
            </span>
          </button>
        </div>
      </div>

      {/* External Website QR Code Card - Permanently Pinned at Bottom (shrink-0) */}
      <div className="shrink-0 pt-2.5 border-t border-gray-200 mt-2">
        <div className="w-full bg-[#101C38] text-white p-2.5 rounded-2xl flex flex-col items-center gap-1 shadow-md text-center border border-gray-800 animate-in fade-in-50 duration-300">
          <div className="flex items-center justify-center gap-1 text-[#FABE2C]">
            <GlobeAltIcon className="w-3.5 h-3.5" />
            <span className="text-[10px] font-black uppercase tracking-wide">เว็บไซต์หลัก</span>
          </div>
          <div className="p-1.5 bg-white rounded-xl shadow-xs border border-white/20">
            <QRCodeSVG value={externalUrl} size={90} level="M" />
          </div>
          <span className="text-[9px] text-gray-300 font-medium leading-tight px-1">
            สแกนเพื่อเข้าชมบนมือถือ
          </span>
        </div>
      </div>
    </aside>
  );
}
