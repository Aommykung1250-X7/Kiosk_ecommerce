import React, { useState, useEffect } from "react";
import {
  Squares2X2Icon,
  TagIcon,
} from "@heroicons/react/24/outline";
import {
  Squares2X2Icon as Squares2X2Solid,
  TagIcon as TagSolid,
} from "@heroicons/react/24/solid";

const ICONS = {
  all: [Squares2X2Icon, Squares2X2Solid],
  promotion: [TagIcon, TagSolid],
};

export default function Sidebar({ selectedCategory, onSelectCategory }) {
  const [categories, setCategories] = useState([
    { id: "all", label: "All" },
    { id: "promotion", label: "Promotion" },
  ]);

  useEffect(() => {
    Promise.all([
      fetch("/api/categories").then((res) => (res.ok ? res.json() : [])),
      fetch("/api/products").then((res) => (res.ok ? res.json() : []))
    ])
      .then(([categoriesData, productsData]) => {
        const allProducts = Array.isArray(productsData) ? productsData : [];
        let promoCategory = { id: "promotion", label: "Promotion" };
        const otherCategories = [];

        (categoriesData || []).forEach((c) => {
          const cleanId = String(c.id || "").trim().toLowerCase();
          const cleanName = String(c.name || "").trim().toLowerCase();

          if (cleanId === "all" || cleanName === "all" || cleanName === "ทั้งหมด") {
            return;
          }

          if (cleanId === "promotion" || cleanName === "promotion" || cleanName === "โปรโมชั่น") {
            promoCategory = { id: c.id, label: c.name || "Promotion" };
            return;
          }

          otherCategories.push({
            id: c.id,
            label: c.name,
          });
        });

        // Check if promotion category has any active products
        const hasPromoProducts = allProducts.some(
          (p) => p.promotion === true || p.promotion === 1 || String(p.promotion).toLowerCase() === "true"
        );

        // Filter categories: only keep categories that have at least 1 product
        const availableCategories = otherCategories.filter((cat) => {
          const cleanId = String(cat.id || "").trim().toLowerCase();
          const cleanLabel = String(cat.label || "").trim().toLowerCase();
          return allProducts.some((p) => {
            const prodCat = String(p.category || "").trim().toLowerCase();
            return prodCat === cleanId || prodCat === cleanLabel;
          });
        });

        const finalCategories = [{ id: "all", label: "All" }];
        if (hasPromoProducts) {
          finalCategories.push(promoCategory);
        }
        finalCategories.push(...availableCategories);

        setCategories(finalCategories);

        // Fallback to "all" if current selected category is no longer available
        if (selectedCategory && selectedCategory !== "all" && !finalCategories.some((c) => c.id === selectedCategory)) {
          onSelectCategory("all");
        }
      })
      .catch((err) => {
        console.error("Error loading categories in Sidebar:", err);
      });
  }, []);

  return (
    <aside
      className="w-[155px] h-full bg-white border-r border-gray-150 shrink-0 flex flex-col 
                 py-6 px-2.5 gap-2 overflow-y-auto font-['Prompt']"
    >
      <div className="px-2 pb-2">
        <p className="text-[10px] font-black text-gray-400 tracking-widest uppercase">
          CATEGORIES
        </p>
      </div>

      {categories.map((cat) => {
        const isActive = selectedCategory === cat.id;
        const isPromo = cat.id === "promotion" || String(cat.id).toLowerCase() === "promotion" || String(cat.label).toLowerCase() === "promotion" || cat.label === "โปรโมชั่น";
        const hasIcon = cat.id === "all" || isPromo;
        const iconKey = cat.id === "all" ? "all" : isPromo ? "promotion" : null;
        const iconConfig = iconKey ? ICONS[iconKey] : null;
        const Icon = iconConfig ? (isActive ? iconConfig[1] : iconConfig[0]) : null;

        return (
          <button
            key={cat.id}
            onClick={() => onSelectCategory(cat.id)}
            className={`h-14 w-full rounded-2xl flex items-center 
                        ${hasIcon ? "gap-3 px-4" : "px-4"} transition-all duration-150 active:scale-[0.97] cursor-pointer
                        ${isActive
                ? "bg-[#5EBAA8] text-white shadow-sm"
                : "bg-transparent text-gray-500 hover:bg-gray-50 hover:text-gray-700"
              }`}
          >
            {hasIcon && Icon && (
              <Icon
                className={`w-6 h-6 shrink-0 ${isActive ? "text-white" : "text-gray-400"
                  }`}
              />
            )}
            <span
              className={`text-sm text-left leading-tight ${isActive
                  ? "font-bold text-white"
                  : "font-semibold"
                }`}
            >
              {cat.label}
            </span>
          </button>
        );
      })}
    </aside>
  );
}
