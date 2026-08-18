import React, { useState, useEffect } from "react";

export default function Sidebar({ selectedCategory, onSelectCategory }) {
  const [categories, setCategories] = useState([
    { id: "all", label: "ALL" },
    { id: "promotion", label: "PROMOTION" },
  ]);

  useEffect(() => {
    Promise.all([
      fetch("/api/categories").then((res) => (res.ok ? res.json() : [])),
      fetch("/api/products").then((res) => (res.ok ? res.json() : []))
    ])
      .then(([categoriesData, productsData]) => {
        const allProducts = Array.isArray(productsData) ? productsData : [];
        let promoCategory = { id: "promotion", label: "PROMOTION" };
        const otherCategories = [];

        (categoriesData || []).forEach((c) => {
          const cleanId = String(c.id || "").trim().toLowerCase();
          const cleanName = String(c.name || "").trim().toLowerCase();

          if (cleanId === "all" || cleanName === "all" || cleanName === "ทั้งหมด") {
            return;
          }

          if (cleanId === "promotion" || cleanName === "promotion" || cleanName === "โปรโมชั่น") {
            promoCategory = { id: c.id, label: (c.name || "PROMOTION").toUpperCase() };
            return;
          }

          otherCategories.push({
            id: c.id,
            label: (c.name || "").toUpperCase(),
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

        const finalCategories = [{ id: "all", label: "ALL" }];
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
        setCategories([
          { id: "all", label: "ALL" },
          { id: "promotion", label: "PROMOTION" },
          { id: "drinks", label: "DRINKS" },
          { id: "snacks", label: "SNACKS" },
          { id: "instant", label: "INSTANT FOOD" },
          { id: "stationery", label: "STATIONERY" },
        ]);
      });
  }, []);

  return (
    <aside
      className="w-[180px] h-full bg-white border-r border-gray-150 shrink-0 flex flex-col 
                 py-8 px-5 gap-3 overflow-y-auto font-['Prompt']"
    >
      <div className="px-3 pb-3">
        <p className="text-xs font-black text-gray-400 tracking-widest uppercase">
          CATEGORY
        </p>
      </div>

      <div className="flex flex-col gap-2">
        {categories.map((cat) => {
          const isActive = selectedCategory === cat.id;

          return (
            <button
              key={cat.id}
              onClick={() => onSelectCategory(cat.id)}
              className={`h-12 w-full rounded-2xl flex items-center justify-start
                          px-5 transition-all duration-150 active:scale-[0.97] cursor-pointer font-black text-sm uppercase ${
                            isActive
                              ? "bg-[#F9C338] text-white shadow-sm"
                              : "bg-transparent text-gray-400 hover:text-gray-700"
                          }`}
            >
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>
    </aside>
  );
}
