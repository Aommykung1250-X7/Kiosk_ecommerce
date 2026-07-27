import React, { useState, useEffect } from "react";

export default function Sidebar({ selectedCategory, onSelectCategory }) {
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    fetch("/api/categories")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch categories");
        return res.json();
      })
      .then((data) => {
        const mapped = (data || []).map((c) => ({
          id: c.id,
          label: c.name,
        }));
        setCategories([
          { id: "all", label: "ทั้งหมด" },
          ...mapped,
          { id: "promotion", label: "โปรโมชั่น" }
        ]);
      })
      .catch((err) => {
        console.error("Error loading categories in Sidebar:", err);
        setCategories([
          { id: "all", label: "ทั้งหมด" },
          { id: "drinks", label: "เครื่องดื่ม" },
          { id: "snacks", label: "ขนมขบเคี้ยว" },
          { id: "instant", label: "อาหารพร้อมทาน" },
          { id: "stationery", label: "เครื่องเขียน" },
          { id: "promotion", label: "โปรโมชั่น" }
        ]);
      });
  }, []);

  return (
    <aside
      className="w-36 sm:w-44 h-full bg-white border-r border-gray-200 shrink-0 flex flex-col 
                 py-6 px-2.5 gap-2 overflow-y-auto font-['Prompt'] select-none"
    >
      <div className="px-2 pb-2">
        <p className="text-[10px] font-black text-gray-400 tracking-widest uppercase">
          CATEGORY
        </p>
      </div>

      {categories.map((cat) => {
        const isActive = selectedCategory === cat.id;

        return (
          <button
            key={cat.id}
            onClick={() => onSelectCategory(cat.id)}
            className={`h-11 w-full rounded-xl flex items-center justify-start
                        px-3.5 transition-all duration-150 active:scale-[0.97] cursor-pointer
                        ${
                          isActive
                            ? "bg-[#F9C338] text-black font-black shadow-xs border border-black/10"
                            : "bg-transparent text-gray-600 hover:bg-gray-50 hover:text-black font-bold"
                        }`}
          >
            <span className="text-xs uppercase tracking-wider text-left truncate">
              {cat.label}
            </span>
          </button>
        );
      })}
    </aside>
  );
}
