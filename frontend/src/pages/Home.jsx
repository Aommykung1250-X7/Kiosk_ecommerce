// src/pages/Home.jsx
import { useState, useEffect } from "react";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import ProductCard from "../components/ProductCard";
import ProductDetailModal from "../components/ProductDetailModal";
import CartDrawer from "../components/CartDrawer";
import KioskPayment from "../components/KioskPayment";
import Screensaver from "../components/Screensaver";
import FooterBar from "../components/FooterBar";
import SupportModal from "../components/SupportModal";
import { ShoppingCartIcon, MagnifyingGlassIcon, XMarkIcon } from "@heroicons/react/24/solid";
import { notify } from "../components/notify";

export default function Home() {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [popularSearchTags, setPopularSearchTags] = useState([]);
  const [cart, setCart] = useState({ items: [], totalPrice: 0, totalItems: 0 });
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isSupportOpen, setIsSupportOpen] = useState(false);
  const [products, setProducts] = useState([]);
  const [categoryList, setCategoryList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [activeOrder, setActiveOrder] = useState(null);
  const [isIdle, setIsIdle] = useState(false);
  const [isWaking, setIsWaking] = useState(false);
  const [sessionViewedProductIds, setSessionViewedProductIds] = useState([]);

  // Fetch cart details & categories on mount
  const fetchCart = () => {
    fetch("/api/cart")
      .then((res) => res.json())
      .then((data) => setCart(data))
      .catch((err) => console.error("Error loading cart:", err));
  };

  useEffect(() => {
    fetchCart();
    fetch("/api/categories")
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setCategoryList(data))
      .catch((err) => console.error("Error loading categories in Home:", err));

    fetch("/api/settings/search-tags")
      .then((res) => (res.ok ? res.json() : { popularSearchTags: [] }))
      .then((data) => {
        if (data.popularSearchTags && Array.isArray(data.popularSearchTags)) {
          setPopularSearchTags(data.popularSearchTags);
        }
      })
      .catch((err) => console.error("Error loading popular search tags:", err));
  }, []);

  // Fetch products catalog
  const fetchProducts = () => {
    setLoading(true);
    setError(null);
    const queryParams = new URLSearchParams();
    if (selectedCategory !== "all") {
      queryParams.append("category", selectedCategory);
    }
    if (searchQuery.trim() !== "") {
      queryParams.append("search", searchQuery.trim());
    }
    const queryString = queryParams.toString() ? `?${queryParams.toString()}` : "";

    return fetch(`/api/products${queryString}`)
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
  }, [selectedCategory, searchQuery]);

  // Idle detection timer (2 minutes) - Paused when payment modal (activeOrder) is open
  useEffect(() => {
    let idleTimer;
    const timeoutDuration = 240000; // 120 seconds in ms

    const resetTimer = () => {
      clearTimeout(idleTimer);
      if (!activeOrder) {
        idleTimer = setTimeout(() => {
          setIsIdle(true);
        }, timeoutDuration);
      }
    };

    const activityEvents = ["mousemove", "mousedown", "keypress", "touchstart", "scroll"];

    if (!isIdle && !activeOrder) {
      activityEvents.forEach((event) => {
        window.addEventListener(event, resetTimer);
      });
      resetTimer();
    } else if (activeOrder) {
      clearTimeout(idleTimer);
    }

    return () => {
      clearTimeout(idleTimer);
      activityEvents.forEach((event) => {
        window.removeEventListener(event, resetTimer);
      });
    };
  }, [isIdle, activeOrder]);

  // Clear cart and close active modals when entering screensaver mode
  useEffect(() => {
    if (isIdle) {
      fetch("/api/cart/clear", { method: "POST" })
        .then((res) => res.json())
        .then((data) => setCart(data))
        .catch((err) => console.error("Error clearing cart on idle:", err));

      setIsCartOpen(false);
      setIsSupportOpen(false);
      setSelectedProduct(null);
      setActiveOrder(null);
      setSearchQuery("");
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

    const existingItem = cart.items.find(item => item.product?.id === product.id);
    const limit = product.purchaseLimit || product.purchase_limit;
    if (existingItem && limit && existingItem.quantity >= limit) {
      notify.warning(`ขออภัย สินค้านี้จำกัดการซื้อไม่เกิน ${limit} ชิ้นต่อรายการ`);
      return;
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

  const handleCheckout = (deliveryOption, shippingOption) => {
    if (cart.items.length === 0) return;

    fetch("/api/settings/shipping")
      .then((res) => res.json())
      .then((shippingSettings) => {
        const hasInStock = cart.items.some(item => item.product && item.product.status === "In Stock");
        const hasPreOrder = cart.items.some(item => item.product && item.product.status === "Pre-Order");
        const isMixed = hasInStock && hasPreOrder;

        let shippingFee = 0;
        if (deliveryOption === "delivery") {
          if (isMixed && shippingOption === "split") {
            shippingFee = shippingSettings.baseShippingFee + (shippingSettings.additionalSplitShippingFee !== undefined ? shippingSettings.additionalSplitShippingFee : shippingSettings.baseShippingFee);
          } else {
            shippingFee = shippingSettings.baseShippingFee;
          }
        }

        const grandTotal = cart.totalPrice + shippingFee;

        return fetch("/api/orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            items: cart.items,
            totalPrice: grandTotal,
            deliveryOption,
            shippingOption
          })
        });
      })
      .then((res) => {
        if (!res.ok) throw new Error("ไม่สามารถสร้างออเดอร์ได้");
        return res.json();
      })
      .then((data) => {
        setActiveOrder({
          orderId: data.orderId,
          totalPrice: data.totalPrice,
          qrPayload: data.qrPayload
        });
      })
      .catch((err) => notify.error(err.message));
  };

  const handlePaymentSuccess = () => {
    fetch("/api/cart/clear", {
      method: "POST"
    })
      .finally(() => {
        window.location.reload();
      });
  };

  const handleCancelOrder = () => {
    if (activeOrder && activeOrder.orderId) {
      fetch(`/api/orders/${activeOrder.orderId}/cancel`, {
        method: "POST"
      }).catch((err) => console.error("Error cancelling order:", err));
    }
    setActiveOrder(null);
    setIsCartOpen(true);
  };



  const bottomHasPreOrder = cart.items.some(item => item.product && item.product.status === "Pre-Order");
  const bottomDisplayTotal = cart.totalPrice;

  return (
    <div className="kiosk-app-container flex flex-col font-['Prompt']">
      <Header
        cart={cart}
        onCartClick={handleCartClick}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

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
              {/* Quick Search Chips */}
              {popularSearchTags.length > 0 && (
                <div className="px-5 pt-4 flex flex-wrap items-center gap-2">
                  <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">คำค้นยอดนิยม:</span>
                  {popularSearchTags.map((tag) => {
                    const isSelected = searchQuery === tag;
                    return (
                      <button
                        key={tag}
                        onClick={() => setSearchQuery(isSelected ? "" : tag)}
                        className={`text-xs px-3 py-1 rounded-full border font-semibold transition-all active:scale-95 cursor-pointer ${
                          isSelected
                            ? "bg-[#1B1B1C] text-white border-[#1B1B1C] shadow-sm"
                            : "bg-white text-gray-700 border-gray-200 hover:border-gray-400"
                        }`}
                      >
                        {tag}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Category / Search Heading */}
              <div className="px-5 pt-3 flex items-end justify-between">
                <div className="flex flex-col min-w-0">
                  <span className="text-[10px] text-gray-400 font-black uppercase tracking-widest leading-none">
                    {searchQuery ? "Search Results" : "Now Showing"}
                  </span>
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    <h1 className="text-2xl font-black text-black leading-none">
                      {searchQuery ? `ค้นหา: "${searchQuery}"` : (() => {
                        if (selectedCategory === "all") return "ทั้งหมด";
                        if (selectedCategory === "promotion") return "โปรโมชั่น";
                        const match = categoryList.find(
                          (c) => String(c.id).toLowerCase() === String(selectedCategory).toLowerCase()
                        );
                        if (match && match.name) return match.name;
                        if (selectedCategory === "drinks") return "เครื่องดื่ม";
                        if (selectedCategory === "snacks") return "ขนมขบเคี้ยว";
                        if (selectedCategory === "instant") return "อาหารพร้อมทาน";
                        if (selectedCategory === "stationery") return "เครื่องเขียน";
                        if (selectedCategory === "souvenirs") return "ของที่ระลึก";
                        return "สินค้า";
                      })()}
                    </h1>
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery("")}
                        className="text-xs bg-gray-200 hover:bg-gray-300 text-gray-700 px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 active:scale-95 transition-all cursor-pointer"
                      >
                        <XMarkIcon className="w-3.5 h-3.5" />
                        ล้างค้นหา
                      </button>
                    )}
                  </div>
                </div>
                <span className="text-xs font-black text-gray-400 shrink-0">
                  {products.length} รายการ
                </span>
              </div>

              {products.length > 0 ? (
                <div
                  className={`grid grid-cols-2 gap-4 p-4 ${cart.totalItems > 0 ? "pb-36" : "pb-20"}`}
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
              ) : (
                <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
                  <div className="w-16 h-16 rounded-3xl bg-gray-200/60 flex items-center justify-center text-gray-400 mb-4 shadow-inner">
                    <MagnifyingGlassIcon className="w-8 h-8" />
                  </div>
                  <h3 className="text-lg font-bold text-[#1B1B1C]">ไม่พบสินค้าที่ตรงกับการค้นหา</h3>
                  <p className="text-xs font-medium text-gray-500 mt-1 max-w-xs leading-relaxed">
                    {searchQuery
                      ? `ไม่พบข้อมูลสำหรับคำว่า "${searchQuery}" ลองค้นหาด้วยคำอื่น หรือกดล้างการค้นหาเพื่อดูสินค้าทั้งหมด`
                      : `ไม่มีสินค้าในหมวดหมู่นี้ในขณะนี้`}
                  </p>
                  {(searchQuery || selectedCategory !== "all") && (
                    <button
                      onClick={() => {
                        setSearchQuery("");
                        setSelectedCategory("all");
                      }}
                      className="mt-5 px-6 py-2.5 bg-[#5EBAA8] text-white font-bold rounded-xl active:scale-95 transition-all shadow-md text-sm cursor-pointer"
                    >
                      ดูสินค้าทั้งหมด
                    </button>
                  )}
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
          className="absolute bottom-[70px] left-1/2 -translate-x-1/2 z-40 
                     w-[92%] h-14 bg-[#2B2B2B] text-white rounded-2xl 
                     shadow-[0_10px_30px_rgba(0,0,0,0.3)] border border-white/10
                     flex items-center justify-between px-4 cursor-pointer 
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
                  ฿{bottomDisplayTotal.toLocaleString('th-TH')}
                </span>
              </div>
              {bottomHasPreOrder && (
                <span className="text-[10px] text-red-400 font-bold mt-1">
                  (มีค่าจัดส่งเพิ่มเติมสำหรับสินค้า Pre-order)
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
          qrPayload={activeOrder.qrPayload}
          onPaymentSuccess={handlePaymentSuccess}
          onCancel={handleCancelOrder}
        />
      )}

      {/* Footer Bar at bottom of screen */}
      <FooterBar onOpenSupport={() => setIsSupportOpen(true)} />

      {/* Support / Contact Staff Modal */}
      <SupportModal
        isOpen={isSupportOpen}
        onClose={() => setIsSupportOpen(false)}
      />

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