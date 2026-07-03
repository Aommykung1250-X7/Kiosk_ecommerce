// src/pages/Home.jsx
import { useState, useEffect } from "react";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import ProductCard from "../components/ProductCard";
import ProductDetailModal from "../components/ProductDetailModal";
import CartDrawer from "../components/CartDrawer";
import KioskPayment from "../components/KioskPayment";
import { ShoppingCartIcon } from "@heroicons/react/24/solid";





export default function Home() {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [cart, setCart] = useState({ items: [], totalPrice: 0, totalItems: 0 });
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [activeOrder, setActiveOrder] = useState(null);


  // Fetch cart details on mount
  const fetchCart = () => {
    fetch("/api/cart")
      .then((res) => res.json())
      .then((data) => setCart(data))
      .catch((err) => console.error("Error loading cart:", err));
  };

  useEffect(() => {
    fetchCart();
  }, []);



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

  const handleAddToCart = (product) => {
    fetch("/api/cart", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId: product.id, quantity: 1 })
    })
      .then((res) => res.json())
      .then((data) => setCart(data))
      .catch((err) => console.error("Error adding to cart:", err));
  };

  const handleUpdateQuantity = (productId, quantity) => {
    fetch("/api/cart", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId, quantity })
    })
      .then((res) => res.json())
      .then((data) => setCart(data))
      .catch((err) => console.error("Error updating quantity:", err));
  };

  const handleRemoveItem = (productId) => {
    fetch(`/api/cart/${productId}`, {
      method: "DELETE"
    })
      .then((res) => res.json())
      .then((data) => setCart(data))
      .catch((err) => console.error("Error removing item:", err));
  };

  const handleClearCart = () => {
    fetch("/api/cart/clear", {
      method: "POST"
    })
      .then((res) => res.json())
      .then((data) => setCart(data))
      .catch((err) => console.error("Error clearing cart:", err));
  };

  const handleCartClick = () => {
    setIsCartOpen(true);
  };

  const handleCheckout = () => {
    if (cart.items.length === 0) return;

    fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: cart.items, totalPrice: cart.totalPrice })
    })
      .then((res) => {
        if (!res.ok) throw new Error("ไม่สามารถสร้างออเดอร์ได้");
        return res.json();
      })
      .then((data) => {
        setActiveOrder({ orderId: data.orderId, totalPrice: data.totalPrice });
      })
      .catch((err) => alert(err.message));
  };

  const handlePaymentSuccess = () => {
    handleClearCart();
    setActiveOrder(null);
  };



  return (
    <div className="w-screen h-screen bg-[#F8F8F8] flex flex-col overflow-hidden font-['Prompt']">
      <Header />

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
                    onSelectProduct={setSelectedProduct}
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

      {selectedProduct && (
        <ProductDetailModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onAddToCart={handleAddToCart}
        />
      )}

      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onClearCart={handleClearCart}
        onCheckout={handleCheckout}
      />

      {/* Floating Cart Pop-up Bar at Bottom */}
      {cart.totalItems > 0 && (
        <div 
          onClick={handleCartClick}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 
                     w-[90%] max-w-lg h-16 bg-[#2B2B2B] text-white rounded-2xl 
                     shadow-[0_10px_30px_rgba(0,0,0,0.3)] border border-white/10
                     flex items-center justify-between px-6 cursor-pointer 
                     hover:bg-[#3A3A3A] active:scale-[0.98] transition-all duration-200
                     animate-in slide-in-from-bottom-10"
        >
          <div className="flex items-center gap-3">
            <div className="relative p-2 bg-[#F8C032] rounded-xl text-[#2B2B2B]">
              <ShoppingCartIcon className="w-6 h-6" />
              <span className="absolute -top-1.5 -right-1.5 bg-[#E53935] text-white text-[10px] font-extrabold w-5 h-5 rounded-full flex items-center justify-center border-2 border-[#2B2B2B]">
                {cart.totalItems}
              </span>
            </div>
            <span className="font-bold text-[clamp(14px,1.5vw,16px)]">ดูตะกร้าสินค้าของคุณ</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-white/60">ยอดรวม:</span>
            <span className="text-xl font-extrabold text-[#F8C032]">
              ฿{cart.totalPrice.toFixed(0)}
            </span>
            <span className="text-xs font-semibold text-[#F8C032] bg-[#F8C032]/10 px-2 py-0.5 rounded-lg ml-1">
              เปิด {'>'}
            </span>
          </div>
        </div>
      )}
      {selectedProduct && (
        <ProductDetailModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onAddToCart={handleAddToCart}
        />
      )}

      {activeOrder && (
        <KioskPayment
          orderId={activeOrder.orderId}
          totalPrice={activeOrder.totalPrice}
          onPaymentSuccess={handlePaymentSuccess}
          onCancel={() => setActiveOrder(null)}
        />
      )}
    </div>
  );
}