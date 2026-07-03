// src/components/KioskPayment.jsx
import { useState, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";
import { CheckCircleIcon, ArrowPathIcon } from "@heroicons/react/24/outline";

export default function KioskPayment({ orderId, totalPrice, onPaymentSuccess, onCancel }) {
  const [paymentStatus, setPaymentStatus] = useState("pending");
  const [countdown, setCountdown] = useState(10);

  // Build the dynamic checkout URL for mobile scanning
  const checkoutUrl = `${window.location.origin}/?orderId=${orderId}`;

  useEffect(() => {
    if (paymentStatus === "success") {
      // Start 10-second countdown to auto-close and return to catalog
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
        .catch(() => {
          // Fail silently on polling network issues
        });
    }, 3000);

    // Clean up SSE & polling on unmount
    return () => {
      sse.close();
      clearInterval(pollInterval);
    };
  }, [orderId, paymentStatus, onPaymentSuccess]);

  const handleSimulatePayment = () => {
    window.open(checkoutUrl, "_blank");
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#F8F8F8] flex flex-col items-center justify-center p-6 font-['Prompt']">
      <div className="w-full max-w-md bg-white rounded-3xl border border-gray-100 shadow-[0_15px_40px_rgba(0,0,0,0.06)] overflow-hidden flex flex-col p-8 gap-8 animate-in fade-in-50 duration-200">
        
        {paymentStatus === "pending" ? (
          <>
            {/* Payment Pending UI */}
            <div className="text-center flex flex-col gap-2">
              <h2 className="text-2xl font-bold text-[#2B2B2B]">สแกนเพื่อชำระเงิน</h2>
              <p className="text-sm text-gray-500">กรุณาใช้มือถือสแกนคิวอาร์โค้ดเพื่อกรอกข้อมูลและแนบสลิป</p>
            </div>

            {/* QR Code Container */}
            <div className="flex flex-col items-center justify-center gap-4 py-4 bg-gray-50 rounded-2xl border border-gray-100 relative">
              <div className="p-4 bg-white rounded-2xl shadow-sm border border-gray-100">
                <QRCodeSVG value={checkoutUrl} size={200} />
              </div>
              <span className="text-xs font-mono text-gray-400 select-all">
                ID: {orderId}
              </span>
            </div>

            {/* Price & Ref details */}
            <div className="flex flex-col gap-3 text-center bg-[#F8C032]/10 p-4 rounded-2xl border border-[#F8C032]/20">
              <span className="text-sm text-gray-500 font-medium">ยอดเงินชำระทั้งหมด</span>
              <span className="text-3xl font-extrabold text-[#E53935]">
                ฿{totalPrice.toFixed(0)}
              </span>
            </div>

            {/* Real-time Loader */}
            <div className="flex items-center justify-center gap-2.5 text-[#2E7D32] bg-[#E8F5E9] py-3.5 px-4 rounded-xl border border-[#C8E6C9] font-medium text-sm">
              <ArrowPathIcon className="w-4.5 h-4.5 animate-spin shrink-0" />
              <span>ระบบกำลังตรวจสอบสลิปของท่านแบบเรียลไทม์...</span>
            </div>

            {/* Cancel Order Button */}
            <button
              onClick={onCancel}
              className="py-3 px-4 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 font-semibold border border-red-200 active:scale-95 transition-all text-center"
            >
              ยกเลิกคำสั่งซื้อ
            </button>
          </>
        ) : (
          <>
            {/* Payment Success UI */}
            <div className="text-center flex flex-col items-center justify-center py-6 gap-6">
              <CheckCircleIcon className="w-24 h-24 text-[#2E7D32] animate-bounce" />
              
              <div className="flex flex-col gap-2">
                <h2 className="text-3xl font-extrabold text-[#2B2B2B]">ชำระเงินสำเร็จ!</h2>
                <p className="text-sm text-gray-500 px-4">
                  ขอบคุณที่ใช้บริการ DIIC SHOP ออเดอร์ของคุณกำลังดำเนินการจัดเตรียมสินค้า
                </p>
              </div>

              <div className="w-full flex flex-col gap-3 bg-[#E8F5E9]/50 p-5 rounded-2xl border border-[#C8E6C9]/40 mt-2">
                <span className="text-xs text-gray-400 font-semibold font-mono uppercase tracking-wider">
                  Order Reference
                </span>
                <span className="text-base font-bold text-[#2B2B2B] font-mono">
                  {orderId}
                </span>
              </div>
            </div>

            {/* Auto Close Info */}
            <div className="flex flex-col gap-3">
              <button
                onClick={onPaymentSuccess}
                className="h-12 w-full rounded-2xl bg-[#F8C032] hover:bg-[#F0B420] active:scale-95
                           flex items-center justify-center gap-2 transition-transform duration-150 shadow-md font-semibold text-[#2B2B2B]"
              >
                กลับสู่หน้าหลัก
              </button>
              <p className="text-center text-xs text-gray-400">
                ระบบจะนำคุณกลับสู่หน้าหลักอัตโนมัติใน {countdown} วินาที
              </p>
            </div>
          </>
        )}

      </div>
    </div>
  );
}
