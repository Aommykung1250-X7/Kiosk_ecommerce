// src/pages/Home.jsx
import { useState, useEffect } from "react";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import ProductCard from "../components/ProductCard";

export default function Home() {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [cartCount, setCartCount] = useState(0);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    const query = selectedCategory !== "all" ? `?category=${selectedCategory}` : "";
    fetch(`/api/products${query}`)
      .then((res) => {
        if (!res.ok) {
          throw new Error("Failed to load products");
        }
        return res.json();
      })
      .then((data) => {
        if (active) {
          setProducts(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (active) {
          setError(err.message);
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
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
          {loading ? (
            <div className="flex flex-col items-center justify-center h-[60vh] text-[#2B2B2B]/60">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#F8C032] mb-4"></div>
              <p className="text-lg font-medium animate-pulse">Loading products...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-[60vh] text-[#E53935]">
              <p className="text-xl font-semibold">Error: {error}</p>
              <button
                onClick={() => setSelectedCategory(selectedCategory)}
                className="mt-4 px-6 py-2 bg-[#F8C032] text-[#2B2B2B] rounded-xl font-semibold active:scale-95 transition-transform shadow-sm"
              >
                Retry
              </button>
            </div>
          ) : (
            <>
              <div
                className="grid grid-cols-2
                           gap-[clamp(12px,2vw,32px)] 
                           p-[clamp(12px,2vw,32px)]"
              >
                {products.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onAddToCart={handleAddToCart}
                  />
                ))}
              </div>

              {products.length === 0 && (
                <div className="flex flex-col items-center justify-center h-[60vh] text-[#2B2B2B]/40">
                  <p className="text-xl font-medium">No products in this category yet</p>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}