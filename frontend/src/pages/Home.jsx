// src/pages/Home.jsx
import { useState, useEffect } from "react";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import ProductCard from "../components/ProductCard";
import ProductDetailModal from "../components/ProductDetailModal";
import CartDrawer from "../components/CartDrawer";
import KioskPayment from "../components/KioskPayment";
import Screensaver from "../components/Screensaver";
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
  const [isIdle, setIsIdle] = useState(false);
  const [isWaking, setIsWaking] = useState(false);
  const [sessionViewedProductIds, setSessionViewedProductIds] = useState([]);

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

  // Fetch products catalog
  const fetchProducts = () => {
    setLoading(true);
    setError(null);
    const query = selectedCategory !== "all" ? `?category=${selectedCategory}` : "";
    return fetch(`/api/products${query}`)
      .then((res) => {
        if (!res.ok) {
          throw new Error("Failed to load products");
        }
        return res.json();
      })
      .then((data) => {
        const sorted = [...data];
        if (sorted.length > 0) {
          let maxIndex = 0;
          for (let i = 1; i < sorted.length; i++) {
            if ((sorted[i].views || 0) > (sorted[maxIndex].views || 0)) {
              maxIndex = i;
            }
          }
          if ((sorted[maxIndex].views || 0) > 0) {
            const [mostViewed] = sorted.splice(maxIndex, 1);
            sorted.unshift(mostViewed);
          }
        }
        setProducts(sorted);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchProducts();
  }, [selectedCategory]);

  // Idle detection timer (2 minutes)
  useEffect(() => {
    let idleTimer;
    const timeoutDuration = 120000; // 2 minutes in ms

    const resetTimer = () => {
      clearTimeout(idleTimer);
      idleTimer = setTimeout(() => {
        setIsIdle(true);
      }, timeoutDuration);
    };

    const activityEvents = ["mousemove", "mousedown", "keypress", "touchstart", "scroll"];

    if (!isIdle) {
      activityEvents.forEach((event) => {
        window.addEventListener(event, resetTimer);
      });
      resetTimer();
    }

    return () => {
      clearTimeout(idleTimer);
      activityEvents.forEach((event) => {
        window.removeEventListener(event, resetTimer);
      });
    };
  }, [isIdle]);

  // Clear cart and close active modals when entering screensaver mode
  useEffect(() => {
    if (isIdle) {
      fetch("/api/cart/clear", { method: "POST" })
        .then((res) => res.json())
        .then((data) => setCart(data))
        .catch((err) => console.error("Error clearing cart on idle:", err));

      setIsCartOpen(false);
      setSelectedProduct(null);
      setActiveOrder(null);
      setSessionViewedProductIds([]);
    }
  }, [isIdle]);

  const handleWakeUp = () => {
    setIsWaking(true);
    setIsIdle(false);

    // Increment wakeup statistic in backend
    fetch("/api/kiosk/wakeup", { method: "POST" })
      .catch((err) => console.error("Error logging kiosk wakeup:", err));

    // Re-fetch only the updated products catalog on wakeup
    fetchProducts()
      .finally(() => {
        setTimeout(() => {
          setIsWaking(false);
        }, 1000); // 1-second transition loader
      });
  };

  const trackProductView = (productId) => {
    if (!productId) return;
    if (sessionViewedProductIds.includes(productId)) return; // Avoid double-counting in single session

    // Optimistically update local session viewed list
    setSessionViewedProductIds((prev) => [...prev, productId]);

    // Send tracking request to backend
    fetch(`/api/products/${productId}/view`, { method: "POST" })
      .catch((err) => console.error("Error logging product view:", err));
  };

  const handleSelectProduct = (product) => {
    setSelectedProduct(product);
    if (product && product.id) {
      trackProductView(product.id);
    }
  };

  const handleAddToCart = (product) => {
    if (product && product.id) {
      trackProductView(product.id);
    }

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

    const hasPreOrder = cart.items.some(item => item.product && item.product.status === "Pre-Order");
    const shippingFee = hasPreOrder ? 40 : 0;
    const grandTotal = cart.totalPrice + shippingFee;

    fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: cart.items, totalPrice: grandTotal })
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
    fetch("/api/cart/clear", {
      method: "POST"
    })
      .finally(() => {
        window.location.reload();
      });
  };



  const bottomHasPreOrder = cart.items.some(item => item.product && item.product.status === "Pre-Order");
  const bottomShippingFee = bottomHasPreOrder ? 40 : 0;
  const bottomDisplayTotal = cart.totalPrice + bottomShippingFee;

  return (
    <div className="w-screen h-screen bg-[#F8F8F8] flex flex-col overflow-hidden font-['Prompt']">
      <Header cart={cart} onCartClick={handleCartClick} />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
        />

        <main className="flex-1 overflow-y-auto min-w-0 bg-[#F8F8F8]">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-[60vh] text-[#2B2B2B]/60">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#5EBAA8] mb-4"></div>
              <p className="text-lg font-medium animate-pulse">กำลังโหลดข้อมูลสินค้า...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-[60vh] text-[#E53935]">
              <p className="text-xl font-semibold">เกิดข้อผิดพลาด: {error}</p>
              <button
                onClick={() => setSelectedCategory(selectedCategory)}
                className="mt-4 px-6 py-2 bg-[#F9C338] text-black border-2 border-black rounded-xl font-semibold active:scale-95 transition-all shadow-sm"
              >
                ลองใหม่
              </button>
            </div>
          ) : (
            <>
              {/* Category Heading matching the screenshot */}
              <div className="px-8 pt-8 flex items-end justify-between">
                <div className="flex flex-col">
                  <span className="text-[10px] text-gray-400 font-black uppercase tracking-widest leading-none">Now Showing</span>
                  <h1 className="text-3xl font-black text-black mt-1.5 leading-none">
                    {selectedCategory === "all" ? "ทั้งหมด" :
                      selectedCategory === "drinks" ? "เครื่องดื่ม" :
                        selectedCategory === "snacks" ? "ขนมขบเคี้ยว" :
                          selectedCategory === "instant" ? "อาหารพร้อมทาน" :
                            selectedCategory === "stationery" ? "เครื่องเขียน" :
                              selectedCategory === "promotion" ? "โปรโมชั่น" : "สินค้า"}
                  </h1>
                </div>
                <span className="text-sm font-black text-gray-400">
                  {products.length} รายการ
                </span>
              </div>

              <div
                className="grid grid-cols-2 gap-6 p-8"
              >
                {(() => {
                  const maxViews = products.length > 0 ? Math.max(...products.map(p => p.views || 0)) : 0;
                  return products.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      onAddToCart={handleAddToCart}
                      onSelectProduct={handleSelectProduct}
                      isMostViewed={maxViews > 0 && product.views === maxViews}
                    />
                  ));
                })()}
              </div>

              {products.length === 0 && (
                <div className="flex flex-col items-center justify-center h-[60vh] text-[#2B2B2B]/40">
                  <p className="text-xl font-medium">ไม่มีสินค้าในหมวดหมู่นี้ในขณะนี้</p>
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

          <div className="flex items-center gap-4">
            <div className="flex flex-col items-end justify-center leading-none">
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-white/60">ยอดรวมสุทธิ:</span>
                <span className="text-xl font-extrabold text-[#F8C032]">
                  ฿{bottomDisplayTotal.toFixed(0)}
                </span>
              </div>
              {bottomShippingFee > 0 && (
                <span className="text-[10px] text-red-400 font-bold mt-1">
                  (รวมค่าส่ง Pre-Order ฿40)
                </span>
              )}
            </div>
            <span className="text-xs font-semibold text-[#F8C032] bg-[#F8C032]/10 px-2 py-0.5 rounded-lg">
              เปิด {'>'}
            </span>
          </div>
        </div>
      )}


      {activeOrder && (
        <KioskPayment
          orderId={activeOrder.orderId}
          totalPrice={activeOrder.totalPrice}
          onPaymentSuccess={handlePaymentSuccess}
          onCancel={() => setActiveOrder(null)}
        />
      )}

      {/* Screensaver overlay */}
      {isIdle && (
        <Screensaver onWake={handleWakeUp} />
      )}

      {/* Waking / loading transition */}
      {isWaking && (
        <div className="fixed inset-0 z-[60] bg-[#0B0B0C]/90 backdrop-blur-md flex flex-col items-center justify-center font-['Prompt'] text-white animate-in fade-in-50 duration-200">
          <div className="w-16 h-16 rounded-full border-4 border-t-[#F8C032] border-[#F8C032]/20 animate-spin mb-4"></div>
          <p className="text-lg font-semibold tracking-wider text-gray-200 animate-pulse">กำลังอัปเดตข้อมูลสินค้าล่าสุด...</p>
        </div>
      )}
    </div>
  );
}