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
  const [selectedCategories, setSelectedCategories] = useState(["all"]);
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

  const isAllSelected = selectedCategories.length === 0 || selectedCategories.includes("all");

  const handleToggleCategory = (catId) => {
    if (catId === "all") {
      setSelectedCategories(["all"]);
      return;
    }

    setSelectedCategories((prev) => {
      const withoutAll = prev.filter((c) => c !== "all");
      if (withoutAll.includes(catId)) {
        const next = withoutAll.filter((c) => c !== catId);
        return next.length === 0 ? ["all"] : next;
      } else {
        return [...withoutAll, catId];
      }
    });
  };

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
    if (!isAllSelected) {
      queryParams.append("category", selectedCategories.join(","));
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
  }, [selectedCategories, searchQuery]);

  // Idle detection timer - ปรับเวลารอพักหน้าจอตรงนี้ (หน่วยเป็นมิลลิวินาที ms)
  useEffect(() => {
    let idleTimer;
    // ตัวอย่าง: 30 * 1000 (30 วินาที), 60 * 1000 (1 นาที), 120 * 1000 (2 นาที)
    const timeoutDuration = 24 * 1000; // 24 วินาที (0.4 นาที)

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

  const handleAddToCart = (product, quantityToAdd = 1) => {
    if (product && product.id) {
      trackProductView(product.id);
    }

    const qty = typeof quantityToAdd === "number" && quantityToAdd > 0 ? quantityToAdd : 1;
    const existingItem = cart.items.find(item => item.product?.id === product.id);
    const limit = product.purchaseLimit || product.purchase_limit;
    if (existingItem && limit && (existingItem.quantity + qty) > limit) {
      notify.warning(`ขออภัย สินค้านี้จำกัดการซื้อไม่เกิน ${limit} ชิ้นต่อรายการ`);
      return;
    }

    fetch("/api/cart", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId: product.id, quantity: qty })
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

  const handleCheckout = (param1, param2, param3) => {
    if (cart.items.length === 0) return;

    let shippingFee = 0;
    let deliveryOption = "pickup";
    let shippingOption = "combined";

    if (typeof param1 === "number") {
      shippingFee = param1;
      deliveryOption = param2 || "pickup";
      shippingOption = param3 || "combined";
    } else if (typeof param1 === "string") {
      deliveryOption = param1;
      shippingFee = (param1 === "delivery" || param1 === "home") ? 20 : 0;
    }

    const grandTotal = cart.totalPrice + shippingFee;

    fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: cart.items,
        totalPrice: grandTotal,
        deliveryOption,
        shippingOption
      })
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
          selectedCategories={selectedCategories}
          onToggleCategory={handleToggleCategory}
        />

        <main className="flex-1 overflow-y-auto min-w-0 bg-white pb-24 font-['Prompt']">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-[60vh] text-[#2B2B2B]/60">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#101C3D] mb-4"></div>
              <p className="text-lg font-medium animate-pulse">กำลังโหลดข้อมูลสินค้า...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-[60vh] text-[#E53935]">
              <p className="text-xl font-semibold">เกิดข้อผิดพลาด: {error}</p>
              <button
                onClick={() => setSelectedCategories(["all"])}
                className="mt-4 px-6 py-2 bg-[#101C3D] text-white rounded-xl font-semibold active:scale-95 transition-all shadow-sm cursor-pointer"
              >
                ลองใหม่
              </button>
            </div>
          ) : (
            <>
              {/* 1. Quick Popular Search Tags Bar matching mockup */}
              <div className="flex items-center gap-3 px-6 pt-5 pb-1 overflow-x-auto scrollbar-none select-none">
                <span className="text-sm font-semibold text-gray-800 shrink-0">
                  คำค้นหายอดนิยม
                </span>
                <div className="flex items-center gap-2 flex-nowrap">
                  {(popularSearchTags.length > 0
                    ? popularSearchTags
                    : ["น้ำดื่ม", "ชาเขียว", "นม", "kitkat"]
                  ).map((tag) => {
                    const isSelected = searchQuery === tag;
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => setSearchQuery(isSelected ? "" : tag)}
                        className={`px-3.5 py-1 rounded-full border text-xs font-normal transition-all cursor-pointer shadow-2xs whitespace-nowrap active:scale-95 ${
                          isSelected
                            ? "bg-[#101C38] text-white border-[#101C38] font-medium"
                            : "bg-white text-gray-700 border-gray-300 hover:border-gray-400 hover:bg-gray-50"
                        }`}
                      >
                        {tag}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. Category Title & Item Count matching mockup */}
              {(() => {
                let filteredProducts = products;
                if (selectedCategories.includes("hot") && !isAllSelected) {
                  filteredProducts = products.filter(p => (p.views || 0) > 0 || p.promotion);
                  if (filteredProducts.length === 0) filteredProducts = products.slice(0, 4);
                }

                const isPromoSelected = selectedCategories.includes("promotion");
                const isHotSelected = selectedCategories.includes("hot");
                const regularCategoryIds = selectedCategories.filter(
                  (c) => c !== "promotion" && c !== "hot" && c !== "all"
                );

                const categoryTitle = searchQuery
                  ? `SEARCH: "${searchQuery}"`
                  : isAllSelected
                  ? "ALL"
                  : (() => {
                      const regularNames = regularCategoryIds.map((catId) => {
                        const match = categoryList.find(
                          (c) => String(c.id).toLowerCase() === String(catId).toLowerCase()
                        );
                        return (match?.name || catId).toUpperCase();
                      });

                      if (isPromoSelected && regularNames.length > 0) {
                        return `PROMOTION: ${regularNames.join(", ")}`;
                      }
                      if (isPromoSelected && regularNames.length === 0) {
                        return "PROMOTION";
                      }
                      if (isHotSelected && regularNames.length === 0) {
                        return "HOT NOW";
                      }
                      if (isHotSelected && regularNames.length > 0) {
                        return `${regularNames.join(", ")} (HOT NOW)`;
                      }
                      return regularNames.join(", ");
                    })();

                return (
                  <>
                    <div className="px-6 pt-4 pb-1 flex items-end justify-between select-none">
                      <div className="flex flex-col">
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight uppercase leading-none">
                          {categoryTitle}
                        </h1>
                        <span className="text-[10px] sm:text-[11px] font-bold text-gray-700 tracking-wider uppercase mt-1">
                          NOW SHOWING
                        </span>
                      </div>

                      <span className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                        {filteredProducts.length} ITEM
                      </span>
                    </div>

                    {/* 3. Product Grid matching mockup */}
                    {filteredProducts.length > 0 ? (
                      <div
                        className={`grid grid-cols-2 gap-x-4 sm:gap-x-5 gap-y-6 sm:gap-y-7 p-4 sm:p-5 ${
                          cart.totalItems > 0 ? "pb-36" : "pb-24"
                        }`}
                      >
                        {(() => {
                          const maxViews = filteredProducts.length > 0 ? Math.max(...filteredProducts.map(p => p.views || 0)) : 0;
                          return filteredProducts.map((product) => (
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
                      <div className="flex flex-col items-center justify-center py-20 px-4 text-center select-none">
                        <div className="w-16 h-16 rounded-3xl bg-gray-100 flex items-center justify-center text-gray-400 mb-4 shadow-inner">
                          <MagnifyingGlassIcon className="w-8 h-8" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900">ไม่พบสินค้าที่ตรงกับการค้นหา</h3>
                        <p className="text-xs font-medium text-gray-500 mt-1 max-w-xs leading-relaxed">
                          {searchQuery
                            ? `ไม่พบข้อมูลสำหรับคำว่า "${searchQuery}" ลองค้นหาด้วยคำอื่น หรือกดล้างการค้นหาเพื่อดูสินค้าทั้งหมด`
                            : `ไม่มีสินค้าในหมวดหมู่นี้ในขณะนี้`}
                        </p>
                        {(searchQuery || !isAllSelected) && (
                          <button
                            type="button"
                            onClick={() => {
                              setSearchQuery("");
                              setSelectedCategories(["all"]);
                            }}
                            className="mt-5 px-6 py-2.5 bg-[#101C3D] text-white font-bold rounded-xl active:scale-95 transition-all shadow-md text-sm cursor-pointer"
                          >
                            ดูสินค้าทั้งหมด
                          </button>
                        )}
                      </div>
                    )}
                  </>
                );
              })()}
            </>
          )}
        </main>
      </div>

      {selectedProduct && (
        <ProductDetailModal
          product={selectedProduct}
          allProducts={products}
          onSelectProduct={handleSelectProduct}
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
          className="absolute bottom-5 left-1/2 -translate-x-1/2 z-40 
                     w-[92%] max-w-[620px] h-16 bg-[#0E1B3E] text-white rounded-2xl 
                     shadow-[0_12px_36px_rgba(14,27,62,0.45)] border border-white/15
                     flex items-center justify-between px-5 cursor-pointer 
                     hover:bg-[#152554] active:scale-[0.98] transition-all duration-200
                     animate-in slide-in-from-bottom-10 select-none"
        >
          <div className="flex items-center gap-3">
            <div className="relative p-2.5 bg-[#FABE2C] rounded-xl text-white shadow-sm">
              <ShoppingCartIcon className="w-6 h-6" />
              <span className="absolute -top-1.5 -right-1.5 bg-[#20C997] text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-[#0E1B3E]">
                {cart.totalItems}
              </span>
            </div>
            <span className="font-extrabold text-sm sm:text-base">ดูตะกร้าสินค้าของคุณ</span>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex flex-col items-end justify-center leading-tight">
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-white/70 font-medium">ยอดรวม:</span>
                <span className="text-xl font-black text-[#FABE2C]">
                  ฿{(bottomDisplayTotal || 0).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              {bottomHasPreOrder && (
                <span className="text-[9px] text-[#F8A838] font-bold mt-0.5">
                  (มีค่าจัดส่งสินค้า Pre-order)
                </span>
              )}
            </div>
<span className="text-xs font-black text-[#F8C032] bg-[#F8C032]/10 px-2.5 py-1 rounded-xl">
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
        <div className="absolute inset-0 z-[60] bg-[#0B0B0C]/90 backdrop-blur-md flex flex-col items-center justify-center font-['Prompt'] text-white animate-in fade-in-50 duration-200">
          <div className="w-16 h-16 rounded-full border-4 border-t-[#F8C032] border-[#F8C032]/20 animate-spin mb-4"></div>
          <p className="text-lg font-semibold tracking-wider text-gray-200 animate-pulse">กำลังอัปเดตข้อมูลสินค้าล่าสุด...</p>
        </div>
      )}
    </div>
  );
}