// src/components/Screensaver.jsx
import React, { useState, useEffect, useMemo } from "react";
import { ShoppingCartIcon, QuestionMarkCircleIcon, SparklesIcon } from "@heroicons/react/24/solid";
import { resolveUploadUrl } from "./admin/ui/format";

const FEATURED_SLOTS = 4;

export default function Screensaver({ onWake }) {
  const [ads, setAds] = useState([]);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [mainImage, setMainImage] = useState("");
  const [masterEnabled, setMasterEnabled] = useState(true);
  const [masterDuration, setMasterDuration] = useState(10);
  const [contactInfo, setContactInfo] = useState({
    website: "www.camt.cmu.ac.th",
    facebook: "CAMT Chiang Mai University",
    hotline: "053-942606"
  });

  useEffect(() => {
    // Fetch active screensaver ads, featured products config, and staff contact settings from backend
    Promise.all([
      fetch("/api/screensavers/active").then((res) => (res.ok ? res.json() : [])).catch(() => []),
      fetch("/api/screensavers/config").then((res) => (res.ok ? res.json() : null)).catch(() => null),
      fetch("/api/settings/contact").then((res) => (res.ok ? res.json() : null)).catch(() => null),
    ]).then(([adList, config, contact]) => {
      if (Array.isArray(adList) && adList.length > 0) {
        setAds(adList);
      }

      if (config) {
        setMainImage(config.mainImage || "");
        setMasterEnabled(config.masterEnabled !== false);
        setMasterDuration(config.masterDuration || 10);
      }

      // backend เติมสินค้าขายดีให้ครบ 4 ช่องมาแล้วใน displayProducts
      const configured =
        (config && Array.isArray(config.displayProducts) && config.displayProducts) ||
        (config && Array.isArray(config.featuredProducts) && config.featuredProducts) ||
        [];

      if (configured.length > 0) {
        setFeaturedProducts(configured.slice(0, FEATURED_SLOTS));
      } else {
        // Fallback ฝั่ง client เฉพาะกรณีเรียก config ไม่สำเร็จเลย ให้ดึงสินค้าขายดี (Best Sellers) เสมอ
        fetch("/api/products/bestsellers")
          .then((res) => (res.ok ? res.json() : []))
          .then((bData) => {
            if (Array.isArray(bData) && bData.length > 0) {
              setFeaturedProducts(bData.slice(0, FEATURED_SLOTS));
            } else {
              fetch("/api/products/bestsellers")
                .then((r) => (r.ok ? r.json() : []))
                .then((pData) => setFeaturedProducts((pData || []).slice(0, FEATURED_SLOTS)))
                .catch(() => {});
            }
          })
          .catch(() => {});
      }

      if (contact) {
        setContactInfo({
          website: contact.website || "www.camt.cmu.ac.th",
          facebook: contact.facebook || "CAMT Chiang Mai University",
          hotline: contact.hotline || "053-942606"
        });
      }
    });
  }, []);

  // รูปหลักของหน้าจอหลักเป็นสไลด์แรกของรอบ แล้วสลับไปสื่อโฆษณาต่อ
  const slides = useMemo(() => {
    const mainSlide =
      masterEnabled && mainImage
        ? [{ id: "main-screen", mediaUrl: mainImage, title: "DITC STORE", duration: masterDuration }]
        : [];
    return [...mainSlide, ...ads];
  }, [masterEnabled, mainImage, masterDuration, ads]);

  // กันกรณี index ค้างเกินความยาวรอบใหม่หลังโหลด config เสร็จ
  useEffect(() => {
    setCurrentSlideIndex(0);
  }, [slides.length]);

  // Automatic Carousel timer for advertisement area
  useEffect(() => {
    if (slides.length <= 1) return;

    const currentSlide = slides[currentSlideIndex];
    const durationMs = (currentSlide?.duration || 6) * 1000;

    const timer = setTimeout(() => {
      setCurrentSlideIndex((prev) => (prev + 1) % slides.length);
    }, durationMs);

    return () => clearTimeout(timer);
  }, [slides, currentSlideIndex]);

  const currentSlide = slides[currentSlideIndex];

  return (
    <div
      onClick={onWake}
      className="kiosk-screensaver fixed inset-0 z-50 bg-[#081028] flex flex-col justify-between p-3 sm:p-4 font-['DIN_Pro_Cond',_'Prompt',_sans-serif] select-none cursor-pointer overflow-hidden"
    >
      {/* 1. TOP HEADER BAR (Outside Card) */}
      <header className="w-full flex items-center justify-between px-2 sm:px-4 py-1 shrink-0 z-10 select-none">
        {/* Left: DITC Logo + SHOP */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          <img
            src="/ditc_logo.png"
            alt="DITC"
            className="h-9 sm:h-10 w-auto object-contain mix-blend-screen"
          />
          <span className="text-white font-bold text-lg sm:text-xl tracking-wider select-none font-['Prompt']">
            SHOP
          </span>
        </div>

        {/* Right: Help Button */}
        <div className="flex items-center gap-4 sm:gap-6">
          {/* Help Button */}
          <div className="flex items-center gap-1.5 text-white/90 hover:text-white font-bold text-xs sm:text-sm tracking-wide cursor-pointer transition-colors">
            <QuestionMarkCircleIcon className="w-4 h-4 sm:w-5 sm:h-5 text-white/90" />
            <span>HELP</span>
          </div>
        </div>
      </header>

      {/* 2. MAIN FLOATING WHITE CARD (Compact & Closer Spacing) */}
      <main className="kiosk-welcome relative w-full max-w-[calc(var(--kiosk-unit)*580)] mx-auto flex-1 bg-white rounded-[calc(var(--kiosk-unit)*36)] sm:rounded-[calc(var(--kiosk-unit)*42)] shadow-2xl p-4 sm:p-5 flex flex-col items-center justify-between gap-2.5 sm:gap-3 my-1 overflow-hidden border border-white/20">
        {/* Subtle Background Pattern */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(#0E1B3E_2px,transparent_2px)] [background-size:20px_20px]" />

        {/* EXPANDED ADVERTISEMENT AREA (รองรับสื่อ 9:16 แนวตั้ง ขยายขึ้นเต็มพื้นที่ด้านบน) */}
        <div className="kiosk-advert w-full max-w-[calc(var(--kiosk-unit)*530)] flex-1 rounded-3xl overflow-hidden shadow-lg relative bg-gray-100 border border-gray-150 flex items-center justify-center z-10 my-0.5">
          {slides.length > 0 && currentSlide ? (
            /* Active Screensaver / Promotional Ad */
            <div className="w-full h-full relative">
              {currentSlide.mediaType === "video" || currentSlide.type === "video" || (typeof currentSlide.mediaUrl === "string" && currentSlide.mediaUrl.endsWith(".mp4")) ? (
                <video
                  src={resolveUploadUrl(currentSlide.mediaUrl, "screensavers") ?? ""}
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                />
              ) : (
                <img
                  src={resolveUploadUrl(currentSlide.mediaUrl, "screensavers") ?? ""}
                  alt={currentSlide.title || "Advertisement"}
                  className="w-full h-full object-cover transition-opacity duration-700"
                />
              )}
              {slides.length > 1 && (
                <div className="absolute bottom-2.5 left-0 right-0 flex justify-center gap-1.5 z-10">
                  {slides.map((_, idx) => (
                    <div
                      key={idx}
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        idx === currentSlideIndex ? "bg-[#FABE2C] w-6" : "bg-white/70 w-2"
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* Default Red Promotional Box matching mockup when no custom ads uploaded */
            <div className="w-full h-full bg-[#E50914] flex flex-col items-center justify-center text-white p-6 relative overflow-hidden group">
              <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-white/10 blur-xl pointer-events-none" />
              <div className="absolute -left-10 -bottom-10 w-40 h-40 rounded-full bg-black/10 blur-xl pointer-events-none" />
              
              <span className="bg-white/20 backdrop-blur-xs text-white text-[calc(var(--kiosk-unit)*10)] sm:text-xs font-bold px-3 py-1 rounded-full uppercase tracking-widest mb-1.5 border border-white/30">
                PROMOTION & ADS
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight drop-shadow-sm text-center">
                DITC SPECIAL OFFERS
              </h3>
              <p className="text-xs sm:text-sm text-white/90 mt-1 font-medium text-center max-w-sm">
                สินค้าคุณภาพ ราคาพิเศษ พร้อมเสิร์ฟความสะดวกสบายทุกวัน
              </p>
            </div>
          )}
        </div>

        {/* CTA BUTTON: START SHOPPING (ชิดกับโฆษณาและสินค้า) */}
        <button
          type="button"
          onClick={onWake}
          className="w-full max-w-[calc(var(--kiosk-unit)*440)] h-13 sm:h-14 rounded-full bg-gradient-to-b from-[#FCD24E] to-[#F5B41C] text-black font-black text-base sm:text-lg shadow-[0_10px_25px_rgba(245,180,28,0.45)] hover:shadow-[0_14px_30px_rgba(245,180,28,0.6)] border border-[#FFE885]/60 flex items-center justify-center gap-2.5 active:scale-[0.97] transition-all duration-200 cursor-pointer select-none z-10 shrink-0"
        >
          <ShoppingCartIcon className="w-5 h-5 text-black stroke-[1.5]" />
          <span>START SHOPPING</span>
        </button>

        {/* BOTTOM SECTION: FEATURED PRODUCTS SHOWCASE (ชิดกับปุ่ม) */}
        <div className="w-full pt-1.5 sm:pt-2 border-t border-gray-100 z-10 select-none shrink-0">
          <div className="flex items-center justify-between px-1 mb-1">
            <span className="text-[calc(var(--kiosk-unit)*11)] sm:text-xs font-bold text-gray-800 flex items-center gap-1.5">
              <SparklesIcon className="w-3.5 h-3.5 text-[#FABE2C]" />
              <span>สินค้าแนะนำพิเศษ</span>
            </span>
            <span className="text-[calc(var(--kiosk-unit)*9)] sm:text-[calc(var(--kiosk-unit)*10)] text-gray-400 font-medium">
              สัมผัสหน้าจอเพื่อสั่งซื้อ
            </span>
          </div>

          <div className="grid grid-cols-4 gap-2.5 sm:gap-3 w-full">
            {Array.from({ length: FEATURED_SLOTS }, (_, idx) => featuredProducts[idx] ?? null).map(
              (item, idx) => {
                const isObj = Boolean(item && typeof item === "object");
                const name = isObj ? item.name : `สินค้า ${idx + 1}`;
                const image = isObj && item.image ? item.image : "";
                const usableImage =
                  image && (image.startsWith("http") || image.startsWith("/") || image.includes("."));
                const imageUrl = usableImage ? resolveUploadUrl(image, "products") : null;

                return (
                  <div
                    key={isObj ? (item.id ?? idx) : idx}
                    className="aspect-square bg-[#F4F5F7] rounded-[calc(var(--kiosk-unit)*20)] p-2.5 flex items-center justify-center shadow-xs border border-slate-200/60 overflow-hidden relative"
                  >
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt={name}
                        className="w-full h-full max-w-[90%] max-h-[90%] object-contain drop-shadow-xs transition-transform duration-200 hover:scale-105"
                      />
                    ) : (
                      <span className="text-2xl opacity-40">🛍️</span>
                    )}
                  </div>
                );
              }
            )}
          </div>
        </div>

        {/* STAFF CONTACT INFO STRIP (Inside Card, No Background, Separated by Dividing Lines) */}
        <div className="w-full pt-2 border-t border-gray-150 grid grid-cols-3 divide-x divide-gray-200 z-10 select-none mt-0.5 shrink-0">
          {/* 1. Website */}
          <div className="flex items-center justify-center gap-2 px-1">
            <div className="w-7 h-7 rounded-full border border-sky-500 bg-sky-50 flex items-center justify-center text-sky-600 shrink-0">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="2" y1="12" x2="22" y2="12" />
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
              </svg>
            </div>
            <div className="flex flex-col text-left leading-tight min-w-0">
              <span className="text-[calc(var(--kiosk-unit)*10)] sm:text-[calc(var(--kiosk-unit)*11)] font-bold text-[#C98B00]">เว็บไซต์:</span>
              <span className="text-[calc(var(--kiosk-unit)*10)] sm:text-[calc(var(--kiosk-unit)*11)] font-semibold text-gray-800 truncate max-w-[calc(var(--kiosk-unit)*120)]">
                {contactInfo.website}
              </span>
            </div>
          </div>

          {/* 2. Facebook */}
          <div className="flex items-center justify-center gap-2 px-1">
            <div className="w-7 h-7 rounded-full bg-[#1877F2] flex items-center justify-center text-white shrink-0 shadow-2xs">
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
            </div>
            <div className="flex flex-col text-left leading-tight min-w-0">
              <span className="text-[calc(var(--kiosk-unit)*10)] sm:text-[calc(var(--kiosk-unit)*11)] font-bold text-[#C98B00]">Facebook:</span>
              <span className="text-[calc(var(--kiosk-unit)*10)] sm:text-[calc(var(--kiosk-unit)*11)] font-semibold text-gray-800 truncate max-w-[calc(var(--kiosk-unit)*130)]">
                {contactInfo.facebook}
              </span>
            </div>
          </div>

          {/* 3. Phone */}
          <div className="flex items-center justify-center gap-2 px-1">
            <div className="w-7 h-7 rounded-full border border-sky-500 bg-sky-50 flex items-center justify-center text-sky-600 shrink-0">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            </div>
            <div className="flex flex-col text-left leading-tight min-w-0">
              <span className="text-[calc(var(--kiosk-unit)*10)] sm:text-[calc(var(--kiosk-unit)*11)] font-bold text-[#C98B00]">โทรศัพท์:</span>
              <span className="text-[calc(var(--kiosk-unit)*10)] sm:text-[calc(var(--kiosk-unit)*11)] font-semibold text-gray-800 truncate max-w-[calc(var(--kiosk-unit)*110)]">
                {contactInfo.hotline}
              </span>
            </div>
          </div>
        </div>
      </main>

      {/* 3. BOTTOM TOUCH SCREEN INSTRUCTION (ใช้รูปภาพต้นฉบับโดยตรง) */}
      <footer className="w-full flex items-center justify-center py-1 sm:py-2 select-none z-10">
        <img
          src="/touch_to_begin.png"
          alt="แตะหน้าจอเพื่อเริ่มใช้งาน - TOUCH SCREEN TO BEGIN"
          className="h-9 sm:h-11 w-auto object-contain select-none pointer-events-none drop-shadow-sm animate-pulse"
        />
      </footer>
    </div>
  );
}
