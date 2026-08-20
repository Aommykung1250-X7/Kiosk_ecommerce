// src/components/KioskPayment.jsx
import { useState, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";
import { CheckCircleIcon, ArrowPathIcon, EnvelopeIcon, PhoneIcon, ClockIcon } from "@heroicons/react/24/outline";
import { notify } from "./notify";

export default function KioskPayment({ orderId, totalPrice, qrPayload, onPaymentSuccess, onCancel }) {
  const [paymentStatus, setPaymentStatus] = useState("pending");
  const [countdown, setCountdown] = useState(60); // 1 minute (60 seconds)
  const [payTimerSeconds, setPayTimerSeconds] = useState(300); // 5 minutes (300 seconds)

  const formatMMSS = (totalSec) => {
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  // 5-minute Payment Countdown Timer
  useEffect(() => {
    if (paymentStatus === "pending") {
      const timer = setInterval(() => {
        setPayTimerSeconds((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            notify.warning("หมดเวลาชำระเงิน ระบบยกเลิกคำสั่งซื้อเรียบร้อยแล้ว");
            onCancel();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [paymentStatus, onCancel]);

  // Form states for contact info
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [contactSubmitted, setContactSubmitted] = useState(false);
  const [submittingContact, setSubmittingContact] = useState(false);

  useEffect(() => {
    if (contactSubmitted && paymentStatus === "pending") {
      // 1. Set up Server-Sent Events (SSE) for real-time notification
      const sse = new EventSource(`/api/orders/${orderId}/sse`);
      
      sse.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.status === "success") {
            setPaymentStatus("success");
            sse.close();
          }
        } catch (err) {
          console.error("Error parsing SSE data:", err);
        }
      };

      sse.onerror = () => {
        console.warn("SSE connection error, falling back to polling.");
        sse.close();
      };

      // 2. Set up Short Polling fallback (resilient network check every 3s)
      const pollInterval = setInterval(() => {
        fetch(`/api/orders/${orderId}/status`)
          .then((res) => {
            if (!res.ok) throw new Error();
            return res.json();
          })
          .then((data) => {
            if (data.status === "success") {
              setPaymentStatus("success");
              clearInterval(pollInterval);
              sse.close();
            }
          })
          .catch(() => {});
      }, 3000);

      // Clean up SSE & polling on unmount
      return () => {
        sse.close();
        clearInterval(pollInterval);
      };
    }

    if (paymentStatus === "success") {
      // Start 60-second countdown to auto-close and return to catalog
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            onPaymentSuccess(); // triggers clearing cart and resets states
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [orderId, paymentStatus, contactSubmitted, onPaymentSuccess]);

  const handleContactSubmit = (e) => {
    e.preventDefault();
    if (!phone || !/^\d{10}$/.test(phone)) {
      notify.warning("กรุณากรอกเบอร์โทรศัพท์ 10 หลักให้ถูกต้อง");
      return;
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      notify.warning("กรุณากรอกอีเมลให้ถูกต้อง");
      return;
    }

    setSubmittingContact(true);
    fetch(`/api/orders/${orderId}/contact-info`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, email })
    })
      .then((res) => {
        if (!res.ok) throw new Error("ไม่สามารถบันทึกข้อมูลติดต่อได้");
        return res.json();
      })
      .then(() => {
        setContactSubmitted(true);
      })
      .catch((err) => notify.error(err.message))
      .finally(() => setSubmittingContact(false));
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#F2F2F2] flex items-center justify-center p-4 font-['Prompt'] select-none">
      <div className="w-[92%] max-w-[430px] bg-white rounded-[32px] sm:rounded-[36px] shadow-2xl overflow-hidden flex flex-col animate-in fade-in-50 zoom-in-95 duration-200">
        
        {/* Top Dark Navy Strip with DITC Logo */}
        <div className="w-full bg-[#0E1B3E] py-3 px-6 flex items-center justify-center shrink-0">
          <img
            src="/ditc_logo.png"
            alt="DITC"
            className="h-7 sm:h-8 w-auto object-contain mix-blend-screen"
          />
        </div>

        {/* Modal Body */}
        <div className="p-6 sm:p-7 flex flex-col gap-4">
          {!contactSubmitted ? (
            <>
              {/* Step 1: Input Contact Info BEFORE paying */}
              <div className="text-center flex flex-col gap-1">
                <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
                  ข้อมูลผู้สั่งซื้อ
                </h2>
                <p className="text-xs text-gray-500 font-normal leading-relaxed">
                  กรุณากรอกเบอร์โทรและอีเมลเพื่อรับใบเสร็จก่อนสแกนชำระเงิน
                </p>
              </div>

              {/* Total Price Box */}
              <div className="flex flex-col items-center justify-center gap-0.5 bg-[#FFF9EC] py-3.5 px-6 rounded-[22px] border border-[#FFE7B8] text-center shadow-2xs">
                <span className="text-xs font-semibold text-gray-700">
                  ยอดเงินชำระทั้งหมด
                </span>
                <span className="text-3xl sm:text-4xl font-black text-[#FF0000] tracking-tight">
                  ฿{totalPrice.toLocaleString("th-TH")}
                </span>
              </div>

              <form onSubmit={handleContactSubmit} className="flex flex-col gap-3.5">
                {/* Field 1: Phone */}
                <div className="flex flex-col gap-1.5 text-left">
                  <label className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                    <PhoneIcon className="w-4 h-4 text-[#FABE2C] stroke-[2.2]" />
                    <span>เบอร์โทรศัพท์ติดต่อ (10 หลัก)</span>
                  </label>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    pattern="[0-9]{10}"
                    placeholder="เช่น 0812345678"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                    className="h-12 px-4 rounded-2xl border border-gray-200 focus:outline-none focus:border-[#FABE2C] text-sm font-medium text-gray-800 placeholder-gray-400 transition-colors"
                  />
                </div>

                {/* Field 2: Email */}
                <div className="flex flex-col gap-1.5 text-left">
                  <label className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                    <EnvelopeIcon className="w-4 h-4 text-[#FABE2C] stroke-[2.2]" />
                    <span>อีเมลสำหรับรับใบเสร็จ</span>
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="example@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-12 px-4 rounded-2xl border border-gray-200 focus:outline-none focus:border-[#FABE2C] text-sm font-medium text-gray-800 placeholder-gray-400 transition-colors"
                  />
                </div>

                {/* Buttons */}
                <div className="flex flex-col gap-2 mt-2">
                  <button
                    type="submit"
                    disabled={submittingContact}
                    className={`h-13 sm:h-14 rounded-2xl w-full font-bold text-base bg-[#FABE2C] hover:bg-[#F5B41C] text-black shadow-[0_10px_25px_rgba(245,180,28,0.4)] hover:shadow-[0_14px_30px_rgba(245,180,28,0.55)] flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-[0.98] select-none
                      ${submittingContact ? "opacity-70 cursor-not-allowed" : ""}`}
                  >
                    {submittingContact ? (
                      <>
                        <ArrowPathIcon className="w-5 h-5 animate-spin text-black" />
                        <span>กำลังบันทึกข้อมูล...</span>
                      </>
                    ) : (
                      <span>สแกนชำระเงิน</span>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={onCancel}
                    className="text-xs sm:text-sm font-bold text-[#E53935] hover:underline cursor-pointer text-center py-1 select-none transition-colors"
                  >
                    ยกเลิกคำสั่งซื้อ
                  </button>
                </div>
              </form>
            </>
          ) : paymentStatus === "pending" ? (
            <>
              {/* Step 2: Payment Pending UI (QR Code) */}
              <div className="text-center flex flex-col gap-1">
                <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
                  สแกนเพื่อชำระเงิน
                </h2>
                <p className="text-xs text-gray-500 font-normal">
                  กรุณาสแกน QR Code เพื่อโอนเงินผ่านแอปพลิเคชันธนาคาร
                </p>
              </div>

              {/* Total Due Price */}
              <div className="flex flex-col items-center justify-center mt-1 text-center select-none">
                <span className="text-xs sm:text-sm font-bold text-gray-800">
                  ยอดรวมที่ต้องชำระ
                </span>
                <span className="text-3xl sm:text-4xl font-black text-[#FF0000] tracking-tight mt-0.5">
                  ฿ {totalPrice.toLocaleString("th-TH")}
                </span>
              </div>

              {/* QR Code Container */}
              <div className="flex flex-col items-center justify-center gap-2.5 py-4 px-6 bg-[#F8F9FA] rounded-[24px] border border-gray-100 mt-1 select-none">
                <div className="p-3 bg-white rounded-2xl shadow-xs border border-gray-100 flex flex-col items-center justify-center gap-1.5 w-[210px] sm:w-[220px]">
                  <div className="w-full bg-[#003B71] text-white py-1 px-2.5 rounded-md text-[9px] font-bold flex items-center justify-center gap-1.5 uppercase tracking-wider">
                    <svg className="w-3 h-3 text-white fill-current" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z"/>
                    </svg>
                    <span>THAI QR PAYMENT</span>
                  </div>
                  <div className="text-[9px] font-bold text-[#003B71] tracking-widest uppercase">
                    PromptPay
                  </div>

                  <div className="flex items-center justify-center py-1">
                    {qrPayload ? (
                      qrPayload.startsWith("http://") || qrPayload.startsWith("https://") ? (
                        <img src={qrPayload} alt="PromptPay QR Code" className="w-[160px] h-[160px] object-contain" />
                      ) : (
                        <QRCodeSVG value={qrPayload} size={160} />
                      )
                    ) : (
                      <div className="h-[160px] w-[160px] flex flex-col items-center justify-center text-gray-400">
                        <ArrowPathIcon className="w-8 h-8 animate-spin mb-1.5 text-[#FABE2C]" />
                        <span className="text-[10px]">กำลังสร้าง QR Code...</span>
                      </div>
                    )}
                  </div>
                </div>

                <span className="text-xs font-mono text-gray-400 tracking-wider select-all">
                  ID: {orderId}
                </span>
              </div>

              {/* Dots Divider */}
              <div className="text-center text-gray-300 text-xs tracking-widest select-none -my-1 font-bold">
                ...
              </div>

              {/* 5-minute Payment Countdown Badge */}
              <div className={`flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl border text-xs font-bold transition-all ${
                payTimerSeconds <= 60
                  ? "bg-rose-50 border-rose-200 text-rose-600 animate-pulse"
                  : "bg-[#FFF9EC] border-[#FFE7B8] text-[#D97706]"
              }`}>
                <ClockIcon className="w-4 h-4 text-[#D97706] shrink-0" />
                <span>กรุณาสแกนชำระเงินภายใน: <strong className="font-mono text-xs font-black">{formatMMSS(payTimerSeconds)}</strong> นาที</span>
              </div>

              {/* Real-time Loader */}
              <div className="flex items-center justify-center gap-2 text-[#2E7D32] bg-[#E8F5E9] py-2.5 px-4 rounded-xl border border-[#C8E6C9] font-bold text-xs">
                <ArrowPathIcon className="w-4 h-4 animate-spin shrink-0 text-[#2E7D32]" />
                <span>ระบบตรวจสอบการชำระเงินเรียลไทม์...</span>
              </div>

              {/* Cancel Order Button */}
              <button
                type="button"
                onClick={onCancel}
                className="h-10 rounded-xl bg-rose-50 hover:bg-rose-100 text-[#E53935] font-bold border border-rose-200 active:scale-95 transition-all text-center text-xs cursor-pointer select-none"
              >
                ยกเลิกคำสั่งซื้อ
              </button>
            </>
          ) : (
            <>
              {/* Step 3: Payment & Contact Success Final Screen */}
              <div className="text-center flex flex-col items-center justify-center py-2 gap-3">
                <CheckCircleIcon className="w-16 h-16 text-[#2E7D32] animate-bounce" />
                
                <div className="flex flex-col gap-1">
                  <h2 className="text-2xl font-black text-gray-900 tracking-tight">
                    ชำระเงินสำเร็จ!
                  </h2>
                  <p className="text-xs text-gray-500 px-2 leading-relaxed">
                    ระบบได้ส่งใบเสร็จการชำระเงินไปยัง <span className="font-semibold text-gray-800">{email}</span> เรียบร้อยแล้ว
                  </p>
                </div>

                <div className="w-full flex flex-col gap-1 bg-[#E8F5E9]/50 p-3 rounded-2xl border border-[#C8E6C9]/40 mt-1">
                  <span className="text-[10px] text-gray-400 font-semibold font-mono uppercase tracking-wider">
                    Order Reference
                  </span>
                  <span className="text-xs font-bold text-gray-800 font-mono">
                    {orderId}
                  </span>
                </div>

                {/* Mobile Delivery QR Code Card */}
                <div className="w-full flex flex-col items-center gap-2 bg-gradient-to-br from-[#FFF9E6] to-[#FFF3CC] p-3.5 rounded-2xl border border-[#F8C032]/40 shadow-2xs">
                  <div className="flex items-center gap-1.5 text-[#8A6200]">
                    <span className="text-xs font-black text-center leading-tight">
                      📱 สามารถสแกน QR Code เพื่อกรอกข้อมูลสำหรับการจัดส่งสินค้า
                    </span>
                  </div>
                  <div className="p-2.5 bg-white rounded-xl shadow-2xs border border-[#F8C032]/30">
                    <QRCodeSVG value={`${window.location.origin}/mobile/delivery?orderId=${orderId}`} size={135} level="M" />
                  </div>
                  <span className="text-[10px] text-gray-500 text-center font-medium">
                    สแกนด้วยกล้องมือถือ เพื่อระบุชื่อและที่อยู่จัดส่งสินค้า (หรือกดลิงก์ในอีเมล)
                  </span>
                </div>
              </div>

              {/* Auto Close Info */}
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={onPaymentSuccess}
                  className="h-12 w-full rounded-2xl bg-[#FABE2C] hover:bg-[#F5B41C] active:scale-95
                             flex items-center justify-center gap-2 transition-transform shadow-md font-bold text-black cursor-pointer text-sm"
                >
                  กลับสู่หน้าหลัก
                </button>
                <p className="text-center text-[11px] text-gray-400 font-medium">
                  ระบบจะนำคุณกลับสู่หน้าหลักอัตโนมัติใน <strong className="text-gray-700 font-mono font-bold">{countdown}</strong> วินาที
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
