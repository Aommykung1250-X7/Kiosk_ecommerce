// src/pages/Home.jsx
import { useState, useMemo } from "react";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import ProductCard from "../components/ProductCard";
import products from "../data/products";

export default function Home() {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [cartCount, setCartCount] = useState(0);

  const filteredProducts = useMemo(() => {
    if (selectedCategory === "all") return products;
    if (selectedCategory === "promotion")
      return products.filter((p) => p.promotion);
    return products.filter((p) => p.category === selectedCategory);
  }, [selectedCategory]);

  const handleAddToCart = () => {
    setCartCount((prev) => prev + 1);
  };

  const handleCartClick = () => {
    // Cart page / drawer to be implemented separately
    console.log("Cart opened");
  };

  return (
    <div className="w-screen h-screen bg-[#F8F8F8] flex flex-col overflow-hidden font-['Prompt']">
      <Header cartCount={cartCount} onCartClick={handleCartClick} />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
        />

        <main className="flex-1 overflow-y-auto min-w-0">
          <div
            className="grid grid-cols-2 
                       gap-[clamp(12px,2vw,32px)] 
                       p-[clamp(12px,2vw,32px)]"
          >
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onAddToCart={handleAddToCart}
              />
            ))}
          </div>

          {filteredProducts.length === 0 && (
            <div className="flex flex-col items-center justify-center h-[60vh] text-[#2B2B2B]/40">
              <p className="text-xl font-medium">No products in this category yet</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}