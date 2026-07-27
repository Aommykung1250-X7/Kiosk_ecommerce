// src/pages/MobileDelivery.jsx
import { useState, useEffect } from "react";
import { CheckCircleIcon, ArrowPathIcon, TruckIcon, MapPinIcon, UserIcon, EnvelopeIcon, PhoneIcon } from "@heroicons/react/24/outline";

export default function MobileDelivery() {
  const [orderId, setOrderId] = useState("");
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState(null);
  const [lineProfile, setLineProfile] = useState(null);

  // Form states
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [addressStreet, setAddressStreet] = useState("");
  const [subdistrict, setSubdistrict] = useState("");
  const [district, setDistrict] = useState("");
  const [province, setProvince] = useState("");
  const [zipcode, setZipcode] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [preorderShippingDate, setPreorderShippingDate] = useState("");
  const [isMixed, setIsMixed] = useState(false);

  // Read orderId from URL query param
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("orderId") || "";
    setOrderId(id);

    if (id) {
      // Fetch order details
      fetch(`/api/orders/${id}`)
        .then((res) => {
          if (!res.ok) throw new Error("Order not found");
          return res.json();
        })
        .then((data) => {
          setOrder(data);
          if (data.customerName) setName(data.customerName);
          if (data.customerPhone) setPhone(data.customerPhone);
          if (data.customerEmail) setEmail(data.customerEmail);

          // Check if mixed order and find preorder release dates
          const items = data.items || [];
          const hasInStock = items.some(item => item.product?.status === "In Stock");
          const hasPreOrder = items.some(item => item.product?.status === "Pre-Order");
          setIsMixed(hasInStock && hasPreOrder);

          if (hasPreOrder) {
            // Find latest pre-order release date
            const preOrderItems = items.filter(item => item.product?.status === "Pre-Order" && item.product?.preorder_release_date);
            if (preOrderItems.length > 0) {
              const dates = preOrderItems.map(item => new Date(item.product.preorder_release_date));
              const latestDate = new Date(Math.max(...dates));
              if (!isNaN(latestDate.getTime())) {
                const day = String(latestDate.getDate()).padStart(2, '0');
                const month = String(latestDate.getMonth() + 1).padStart(2, '0');
                const year = latestDate.getFullYear();
                setPreorderShippingDate(`${day}/${month}/${year}`);
              }
            }
          }
          setLoading(false);
        })
        .catch((err) => {
          console.error(err);
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, [orderId]);

  // Load LINE LIFF SDK
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://static.line-scdn.net/liff/edge/2/sdk.js";
    script.async = true;
    script.onload = () => {
      if (window.liff) {
        window.liff.init({ liffId: window.LIFF_ID || "2006371728-YxXgEPL0" }) // Fallback default or custom liff id
          .then(() => {
            if (window.liff.isLoggedIn()) {
              window.liff.getProfile().then((profile) => {
                setLineProfile(profile);
                // Pre-fill profile if available
                fetch(`/api/members/${profile.userId}`)
                  .then((res) => res.json())
                  .then((member) => {
                    if (member) {
                      if (!name) setName(member.name || "");
                      if (!phone) setPhone(member.phone || "");
                      if (!email) setEmail(member.email || "");
                      // Extract address fields if saved in custom standard
                      if (member.address) {
                        const parts = member.address.split(", ");
                        if (parts.length >= 4) {
                          setAddressStreet(parts[0] || "");
                          setSubdistrict(parts[1] || "");
                          setDistrict(parts[2] || "");
                          const provZip = parts[3] || "";
                          const pParts = provZip.trim().split(" ");
                          setProvince(pParts[0] || "");
                          setZipcode(pParts[1] || "");
                        } else {
                          setAddressStreet(member.address);
                        }
                      }
                    }
                  });
              });
            }
          })
          .catch((err) => console.error("LINE LIFF init error:", err));
      }
    };
    document.body.appendChild(script);
  }, [order]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name || !phone || !email || !addressStreet || !subdistrict || !district || !province || !zipcode) {
      return alert("กรุณากรอกข้อมูลให้ครบถ้วน");
    }

    setSubmitting(true);
    fetch(`/api/orders/${orderId}/address`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        phone,
        email,
        addressStreet,
        subdistrict,
        district,
        province,
        zipcode,
        lineUserId: lineProfile?.userId || null
      })
    })
      .then((res) => {
        if (!res.ok) throw new Error("ไม่สามารถบันทึกที่อยู่จัดส่งได้");
        return res.json();
      })
      .then(() => {
        setSubmitted(true);
      })
      .catch((err) => alert(err.message))
      .finally(() => setSubmitting(false));
  };

  const handleCloseLiff = () => {
    if (window.liff && window.liff.isInClient()) {
      window.liff.closeWindow();
    } else {
      window.close();
      // fallback
      alert("กรุณาปิดหน้าต่างนี้ด้วยตนเอง");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center font-['Prompt'] text-[#2B2B2B]">
        <ArrowPathIcon className="w-10 h-10 animate-spin text-[#F8C032] mb-3" />
        <p className="text-sm font-medium">กำลังโหลดข้อมูลคำสั่งซื้อ...</p>
      </div>
    );
  }

  if (!orderId) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center font-['Prompt'] text-[#2B2B2B] p-6 text-center">
        <p className="text-red-500 font-bold mb-4">ไม่พบรหัสคำสั่งซื้อ (Order ID)</p>
        <p className="text-xs text-gray-500">กรุณาเข้าใช้งานผ่านลิงก์ยืนยันในอีเมลใบเสร็จของคุณ</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-['Prompt'] text-[#2B2B2B]">
      {/* Top Header Banner */}
      <div className="bg-[#2B2B2B] text-white py-6 px-6 text-center flex flex-col gap-1.5 shadow-md">
        <div className="flex items-center justify-center gap-2 text-[#F8C032]">
          <TruckIcon className="w-7 h-7" />
          <h1 className="text-xl font-black">ที่อยู่สำหรับจัดส่งพัสดุ</h1>
        </div>
        <p className="text-xs text-gray-400">Order ID: {orderId}</p>
      </div>

      <div className="flex-1 flex flex-col max-w-md w-full mx-auto p-4 gap-6">
        {!submitted ? (
          <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex flex-col gap-5">
            <h2 className="text-base font-extrabold border-b border-gray-50 pb-3 flex items-center gap-2">
              <MapPinIcon className="w-5 h-5 text-[#F8C032]" />
              <span>กรอกข้อมูลที่อยู่จัดส่ง</span>
            </h2>

            {/* Line profile login prompt if not logged in */}
            {lineProfile && (
              <div className="flex items-center gap-3 bg-green-50/55 p-3 rounded-xl border border-green-100/60">
                <img
                  src={lineProfile.pictureUrl}
                  alt={lineProfile.displayName}
                  className="w-10 h-10 rounded-full border border-green-200"
                />
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-green-800">เชื่อมต่อบัญชี LINE สำเร็จ</span>
                  <span className="text-[10px] text-gray-400">ระบบจะจำที่อยู่นี้ไว้สำหรับการสั่งซื้อครั้งถัดไป</span>
                </div>
              </div>
            )}

            {/* Name */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-gray-400 flex items-center gap-1.5">
                <UserIcon className="w-3.5 h-3.5" /> ชื่อ-นามสกุล ผู้รับ
              </label>
              <input
                type="text"
                required
                placeholder="เช่น สมชาย ใจดี"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-11 px-3.5 rounded-xl border border-gray-200 focus:outline-none focus:border-[#F8C032] focus:ring-1 focus:ring-[#F8C032] text-sm"
              />
            </div>

            {/* Phone & Email */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-gray-400 flex items-center gap-1.5">
                  <PhoneIcon className="w-3.5 h-3.5" /> เบอร์โทรศัพท์
                </label>
                <input
                  type="tel"
                  required
                  maxLength={10}
                  pattern="[0-9]{10}"
                  placeholder="เช่น 0812345678"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                  className="h-11 px-3.5 rounded-xl border border-gray-200 focus:outline-none focus:border-[#F8C032] focus:ring-1 focus:ring-[#F8C032] text-sm"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-gray-400 flex items-center gap-1.5">
                  <EnvelopeIcon className="w-3.5 h-3.5" /> อีเมล
                </label>
                <input
                  type="email"
                  required
                  placeholder="name@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-11 px-3.5 rounded-xl border border-gray-200 focus:outline-none focus:border-[#F8C032] focus:ring-1 focus:ring-[#F8C032] text-sm"
                />
              </div>
            </div>

            {/* Street / Building address */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-gray-400">บ้านเลขที่, ถนน, ซอย, อาคาร</label>
              <input
                type="text"
                required
                placeholder="เช่น 123/45 หมู่ 5 ถนนสุขุมวิท"
                value={addressStreet}
                onChange={(e) => setAddressStreet(e.target.value)}
                className="h-11 px-3.5 rounded-xl border border-gray-200 focus:outline-none focus:border-[#F8C032] focus:ring-1 focus:ring-[#F8C032] text-sm"
              />
            </div>

            {/* Subdistrict & District */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-gray-400">แขวง / ตำบล</label>
                <input
                  type="text"
                  required
                  placeholder="แขวงดินแดง"
                  value={subdistrict}
                  onChange={(e) => setSubdistrict(e.target.value)}
                  className="h-11 px-3.5 rounded-xl border border-gray-200 focus:outline-none focus:border-[#F8C032] focus:ring-1 focus:ring-[#F8C032] text-sm"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-gray-400">เขต / อำเภอ</label>
                <input
                  type="text"
                  required
                  placeholder="เขตดินแดง"
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  className="h-11 px-3.5 rounded-xl border border-gray-200 focus:outline-none focus:border-[#F8C032] focus:ring-1 focus:ring-[#F8C032] text-sm"
                />
              </div>
            </div>

            {/* Province & Zipcode */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-gray-400">จังหวัด</label>
                <input
                  type="text"
                  required
                  placeholder="กรุงเทพมหานคร"
                  value={province}
                  onChange={(e) => setProvince(e.target.value)}
                  className="h-11 px-3.5 rounded-xl border border-gray-200 focus:outline-none focus:border-[#F8C032] focus:ring-1 focus:ring-[#F8C032] text-sm"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-gray-400">รหัสไปรษณีย์</label>
                <input
                  type="text"
                  required
                  maxLength={5}
                  pattern="[0-9]{5}"
                  placeholder="10400"
                  value={zipcode}
                  onChange={(e) => setZipcode(e.target.value.replace(/\D/g, ""))}
                  className="h-11 px-3.5 rounded-xl border border-gray-200 focus:outline-none focus:border-[#F8C032] focus:ring-1 focus:ring-[#F8C032] text-sm"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className={`h-12 w-full mt-2 rounded-2xl bg-[#F8C032] hover:bg-[#F0B420] text-[#2B2B2B] font-extrabold text-sm shadow-md active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer select-none
                ${submitting ? "bg-gray-100 text-gray-400 border border-gray-200" : ""}`}
            >
              {submitting ? (
                <>
                  <ArrowPathIcon className="w-5 h-5 animate-spin" />
                  <span>กำลังบันทึกที่อยู่...</span>
                </>
              ) : (
                <span>ยืนยันที่อยู่จัดส่ง</span>
              )}
            </button>
          </form>
        ) : (
          /* Success Screen satisfying custom preorder rules */
          <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm flex flex-col items-center text-center gap-6 animate-in zoom-in-95 duration-200">
            <CheckCircleIcon className="w-20 h-20 text-[#2E7D32] animate-bounce" />

            <div className="flex flex-col gap-2">
              <h2 className="text-2xl font-black text-[#2B2B2B]">สั่งซื้อสำเร็จ!</h2>
              <p className="text-sm font-semibold text-[#2E7D32]">
                บันทึกที่อยู่จัดส่งเรียบร้อยแล้ว
              </p>
            </div>

            <div className="w-full bg-gray-50 border border-gray-100 p-5 rounded-2xl text-left flex flex-col gap-3">
              <div className="flex justify-between items-center text-xs text-gray-400">
                <span>รหัสคำสั่งซื้อ:</span>
                <span className="font-bold text-[#2B2B2B] font-mono">{orderId}</span>
              </div>
              <div className="flex justify-between items-center text-xs text-gray-400">
                <span>ผู้รับพัสดุ:</span>
                <span className="font-bold text-[#2B2B2B]">{name}</span>
              </div>
              <div className="flex justify-between items-center text-xs text-gray-400">
                <span>เบอร์โทรศัพท์:</span>
                <span className="font-bold text-[#2B2B2B]">{phone}</span>
              </div>
              
              {/* Mixed / Pre-order release delivery rule details */}
              {isMixed && preorderShippingDate && (
                <div className="bg-[#F8C032]/10 border border-[#F8C032]/25 p-3.5 rounded-xl flex flex-col gap-1 mt-2">
                  <span className="text-[11px] font-extrabold text-[#A24B2C] uppercase tracking-wide">
                    ⚠️ ข้อมูลจัดส่งคำสั่งซื้อแบบผสม
                  </span>
                  <p className="text-xs text-gray-600 leading-normal">
                    คำสั่งซื้อนี้มีทั้งสินค้าพร้อมส่งและพรีออเดอร์ 
                    ทางร้านจะเริ่มจัดส่งพัสดุสินค้า Pre-order 
                    ตั้งแต่วันที่ <strong className="text-[#E53935]">{preorderShippingDate}</strong> เป็นต้นไป
                  </p>
                </div>
              )}
            </div>

            <button
              onClick={handleCloseLiff}
              className="h-12 w-full rounded-2xl bg-[#F8C032] hover:bg-[#F0B420] text-[#2B2B2B] font-bold text-sm shadow-md transition-transform active:scale-95 cursor-pointer"
            >
              ปิดหน้าต่าง LINE
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
