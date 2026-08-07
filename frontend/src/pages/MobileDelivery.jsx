// src/pages/MobileDelivery.jsx
import { useState, useEffect } from "react";
import { 
  CheckCircleIcon, 
  ArrowPathIcon, 
  TruckIcon, 
  MapPinIcon, 
  UserIcon, 
  EnvelopeIcon, 
  PhoneIcon,
  SparklesIcon,
  ChatBubbleLeftRightIcon,
  ArrowLeftIcon,
  ChevronRightIcon,
  InformationCircleIcon
} from "@heroicons/react/24/outline";

export default function MobileDelivery() {
  const [orderId, setOrderId] = useState("");
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState(null);
  const [lineProfile, setLineProfile] = useState(null);

  // Environment Configs
  const ENABLE_LINE_LOGIN = import.meta.env.VITE_ENABLE_LINE_LOGIN !== "false";
  const USE_LINE_MOCK = import.meta.env.VITE_USE_LINE_MOCK === "true";
  const LIFF_ID = import.meta.env.VITE_LINE_LIFF_ID || "2006371728-YxXgEPL0";

  // Method selection state: null (selection screen) | "line" | "email" | "guest"
  const [selectedMethod, setSelectedMethod] = useState(null);

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
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);
  const [savedAddress, setSavedAddress] = useState("");
  const [preorderShippingDate, setPreorderShippingDate] = useState("");
  const [isMixed, setIsMixed] = useState(false);

  // Auto-fill indicators
  const [autoFilledFromEmail, setAutoFilledFromEmail] = useState(false);
  const [autoFilledFromLine, setAutoFilledFromLine] = useState(false);

  const parseAndFillAddress = (addrStr) => {
    if (!addrStr) return;
    const parts = addrStr.split(", ");
    if (parts.length >= 4) {
      setAddressStreet(parts[0] || "");
      setSubdistrict(parts[1] || "");
      setDistrict(parts[2] || "");
      const provZip = parts[3] || "";
      const pParts = provZip.trim().split(" ");
      setProvince(pParts[0] || "");
      setZipcode(pParts[1] || "");
    } else {
      setAddressStreet(addrStr);
    }
  };

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
          const currentName = data.customerName || "";
          const currentPhone = data.customerPhone || "";
          const currentEmail = data.customerEmail || "";
          const currentAddress = data.customerAddress || "";

          if (currentName) setName(currentName);
          if (currentPhone) setPhone(currentPhone);
          if (currentEmail) setEmail(currentEmail);
          if (currentAddress) setSavedAddress(currentAddress);

          if (currentAddress && currentAddress.trim() !== "") {
            setAlreadySubmitted(true);
          }

          // Check if mixed order and find preorder release dates
          const items = data.items || [];
          const hasInStock = items.some(item => item.product?.status === "In Stock");
          const hasPreOrder = items.some(item => item.product?.status === "Pre-Order");
          setIsMixed(hasInStock && hasPreOrder);

          if (hasPreOrder) {
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

  // Load Real LINE LIFF SDK when Enabled & not Mock
  useEffect(() => {
    if (!ENABLE_LINE_LOGIN || USE_LINE_MOCK) return;

    const script = document.createElement("script");
    script.src = "https://static.line-scdn.net/liff/edge/2/sdk.js";
    script.async = true;
    script.onload = () => {
      if (window.liff) {
        window.liff.init({ liffId: LIFF_ID })
          .then(() => {
            if (window.liff.isLoggedIn()) {
              window.liff.getProfile().then((profile) => {
                setLineProfile(profile);
              });
            }
          })
          .catch((err) => console.error("LINE LIFF init error:", err));
      }
    };
    document.body.appendChild(script);
  }, [order, ENABLE_LINE_LOGIN, USE_LINE_MOCK, LIFF_ID]);

  // Method Handlers
  const handleSelectLine = () => {
    if (!ENABLE_LINE_LOGIN) return;

    setSelectedMethod("line");

    // MOCK MODE
    if (USE_LINE_MOCK) {
      const mockProfile = {
        userId: "U_MOCK_LINE_USER_12345",
        displayName: "คุณสมชาย (LINE Mock)",
        pictureUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=SomchaiLine",
        isMock: true
      };
      setLineProfile(mockProfile);

      fetch(`/api/members/${mockProfile.userId}`)
        .then((res) => res.json())
        .then((member) => {
          if (member) {
            if (member.name) setName(member.name);
            if (member.phone) setPhone(member.phone);
            if (member.email) setEmail(member.email);
            if (member.address) {
              parseAndFillAddress(member.address);
              setAutoFilledFromLine(true);
            }
          }
        })
        .catch((err) => console.error("Mock LINE profile lookup error:", err));
      return;
    }

    // REAL LIFF MODE
    if (window.liff) {
      if (!window.liff.isLoggedIn()) {
        window.liff.login();
      } else {
        window.liff.getProfile().then((profile) => {
          setLineProfile(profile);
          fetch(`/api/members/${profile.userId}`)
            .then((res) => res.json())
            .then((member) => {
              if (member) {
                if (member.name) setName(member.name);
                if (member.phone) setPhone(member.phone);
                if (member.email) setEmail(member.email);
                if (member.address) {
                  parseAndFillAddress(member.address);
                  setAutoFilledFromLine(true);
                }
              }
            });
        });
      }
    }
  };

  const handleSelectEmail = () => {
    setSelectedMethod("email");
    const targetEmail = email || order?.customerEmail;
    if (targetEmail) {
      fetch(`/api/members/email/${encodeURIComponent(targetEmail)}`)
        .then((res) => res.json())
        .then((member) => {
          if (member && member.address) {
            parseAndFillAddress(member.address);
            if (member.name) setName(member.name);
            if (member.phone) setPhone(member.phone);
            setAutoFilledFromEmail(true);
          }
        })
        .catch((err) => console.error("Email lookup error:", err));
    }
  };

  const handleSelectGuest = () => {
    setSelectedMethod("guest");
  };

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
      .then(async (res) => {
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || "ไม่สามารถบันทึกที่อยู่จัดส่งได้");
        }
        return res.json();
      })
      .then(() => {
        setSavedAddress(`${addressStreet}, ${subdistrict}, ${district}, ${province} ${zipcode}`);
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
        {/* Step 1: Selection Screen */}
        {!submitted && !alreadySubmitted && selectedMethod === null && (
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex flex-col gap-5 animate-in fade-in-50 duration-200">
            <div className="flex flex-col gap-1 border-b border-gray-50 pb-3">
              <h2 className="text-base font-black text-[#2B2B2B] flex items-center gap-2">
                <MapPinIcon className="w-5 h-5 text-[#F8C032]" />
                <span>เลือกวิธีกรอกที่อยู่จัดส่ง</span>
              </h2>
              <p className="text-xs text-gray-400">
                เลือกช่องทางที่สะดวกเพื่อกรอกหรือดึงประวัติที่อยู่เดิมของคุณ
              </p>
            </div>

            <div className="flex flex-col gap-3">
              {/* Option A: LINE Login */}
              {ENABLE_LINE_LOGIN ? (
                <button
                  type="button"
                  onClick={handleSelectLine}
                  className="w-full text-left p-4 rounded-2xl bg-[#06C755]/10 border border-[#06C755]/30 hover:bg-[#06C755]/20 active:scale-[0.98] transition-all flex items-center justify-between group cursor-pointer"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-11 h-11 rounded-xl bg-[#06C755] text-white flex items-center justify-center shrink-0 shadow-sm">
                      <ChatBubbleLeftRightIcon className="w-6 h-6" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-extrabold text-[#06C755] flex items-center gap-1.5">
                        เข้าสู่ระบบด้วย LINE
                        {USE_LINE_MOCK && (
                          <span className="bg-amber-100 text-amber-800 text-[9px] px-1.5 py-0.5 rounded-full font-bold">
                            MOCK
                          </span>
                        )}
                      </span>
                      <span className="text-[11px] text-gray-500 leading-tight mt-0.5">
                        ดึงที่อยู่เดิมและซิงค์บัญชี LINE ของคุณ
                      </span>
                    </div>
                  </div>
                  <ChevronRightIcon className="w-5 h-5 text-[#06C755] group-hover:translate-x-1 transition-transform" />
                </button>
              ) : (
                <div className="w-full p-4 rounded-2xl bg-gray-100/70 border border-gray-200 text-gray-400 flex items-center gap-3.5 opacity-60 cursor-not-allowed">
                  <div className="w-11 h-11 rounded-xl bg-gray-400 text-white flex items-center justify-center shrink-0">
                    <ChatBubbleLeftRightIcon className="w-6 h-6" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-gray-500">
                      LINE Login (ปิดใช้งานชั่วคราว)
                    </span>
                    <span className="text-[11px] text-gray-400">
                      สามารถเปิดใช้งานได้ที่ไฟล์ .env (VITE_ENABLE_LINE_LOGIN)
                    </span>
                  </div>
                </div>
              )}

              {/* Option B: Email History */}
              <button
                type="button"
                onClick={handleSelectEmail}
                className="w-full text-left p-4 rounded-2xl bg-amber-50 border border-amber-200/80 hover:bg-amber-100/60 active:scale-[0.98] transition-all flex items-center justify-between group cursor-pointer"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-xl bg-[#F8C032] text-[#2B2B2B] flex items-center justify-center shrink-0 shadow-sm">
                    <EnvelopeIcon className="w-6 h-6" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-extrabold text-amber-900">
                      ใช้ที่อยู่เดิมจาก Email
                    </span>
                    <span className="text-[11px] text-amber-800 leading-tight mt-0.5">
                      {email ? `อีเมล: ${email}` : "ดึงที่อยู่เดิมที่เคยบันทึกไว้ในอีเมลนี้"}
                    </span>
                  </div>
                </div>
                <ChevronRightIcon className="w-5 h-5 text-amber-700 group-hover:translate-x-1 transition-transform" />
              </button>

              {/* Option C: Guest Mode */}
              <button
                type="button"
                onClick={handleSelectGuest}
                className="w-full text-left p-4 rounded-2xl bg-gray-50 border border-gray-200 hover:bg-gray-100 active:scale-[0.98] transition-all flex items-center justify-between group cursor-pointer"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-xl bg-gray-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                    <UserIcon className="w-6 h-6" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-extrabold text-gray-700">
                      ไม่เข้าสู่ระบบ (Guest)
                    </span>
                    <span className="text-[11px] text-gray-500 leading-tight mt-0.5">
                      กรอกข้อมูลที่อยู่ใหม่เฉพาะคำสั่งซื้อนี้
                    </span>
                  </div>
                </div>
                <ChevronRightIcon className="w-5 h-5 text-gray-400 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Address Form Screen */}
        {!submitted && !alreadySubmitted && selectedMethod !== null && (
          <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex flex-col gap-5 animate-in fade-in-50 duration-200">
            <div className="flex items-center justify-between border-b border-gray-50 pb-3">
              <h2 className="text-base font-extrabold flex items-center gap-2">
                <MapPinIcon className="w-5 h-5 text-[#F8C032]" />
                <span>กรอกข้อมูลที่อยู่จัดส่ง</span>
              </h2>
              
              <button
                type="button"
                onClick={() => setSelectedMethod(null)}
                className="text-xs font-bold text-gray-500 hover:text-[#2B2B2B] flex items-center gap-1 bg-gray-100 hover:bg-gray-200 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
              >
                <ArrowLeftIcon className="w-3.5 h-3.5" />
                <span>เปลี่ยนวิธี</span>
              </button>
            </div>

            {/* Smart Email Auto-fill Notification */}
            {selectedMethod === "email" && autoFilledFromEmail && (
              <div className="flex items-start gap-3 bg-amber-50/80 p-3.5 rounded-2xl border border-amber-200/80">
                <SparklesIcon className="w-5 h-5 text-[#F8C032] shrink-0 mt-0.5" />
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs font-bold text-amber-900">
                    ดึงที่อยู่เดิมจากอีเมลของคุณสำเร็จ!
                  </span>
                  <span className="text-[11px] text-amber-800 leading-normal">
                    ระบบนำข้อมูลประวัติที่อยู่เดิมมาเติมให้อัตโนมัติ สามารถตรวจสอบหรือแก้ไขข้อมูลในฟอร์มด้านล่างได้ทันที
                  </span>
                </div>
              </div>
            )}

            {/* Connected LINE profile status */}
            {selectedMethod === "line" && (
              <div className="flex items-center gap-3 bg-emerald-50 p-3 rounded-2xl border border-emerald-100">
                {lineProfile?.pictureUrl ? (
                  <img
                    src={lineProfile.pictureUrl}
                    alt={lineProfile.displayName}
                    className="w-10 h-10 rounded-full border border-emerald-300 shadow-sm"
                  />
                ) : (
                  <ChatBubbleLeftRightIcon className="w-8 h-8 text-emerald-600" />
                )}
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                    เชื่อมต่อบัญชี LINE {lineProfile ? `(${lineProfile.displayName})` : ""}
                    {lineProfile?.isMock && (
                      <span className="bg-amber-200 text-amber-900 text-[9px] px-1.5 py-0.2 rounded-full font-bold">
                        MOCK ACTIVE
                      </span>
                    )}
                  </span>
                  <span className="text-[10px] text-emerald-700">
                    ระบบจะบันทึกและจำที่อยู่นี้ไว้สำหรับการสั่งซื้อครั้งถัดไป
                  </span>
                </div>
              </div>
            )}

            {/* Guest Mode Indicator */}
            {selectedMethod === "guest" && (
              <div className="flex items-center gap-2 bg-gray-50 p-3 rounded-xl border border-gray-100 text-xs text-gray-500 font-medium">
                <UserIcon className="w-4 h-4 text-gray-400 shrink-0" />
                <span>โหมดไม่เข้าสู่ระบบ (Guest Mode) - กรอกที่อยู่จัดส่งได้ทันที</span>
              </div>
            )}

            {/* Name */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-gray-500 flex items-center gap-1.5">
                <UserIcon className="w-3.5 h-3.5 text-gray-400" /> ชื่อ-นามสกุล ผู้รับ
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
                <label className="text-xs font-bold text-gray-500 flex items-center gap-1.5">
                  <PhoneIcon className="w-3.5 h-3.5 text-gray-400" /> เบอร์โทรศัพท์
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
                <label className="text-xs font-bold text-gray-500 flex items-center gap-1.5">
                  <EnvelopeIcon className="w-3.5 h-3.5 text-gray-400" /> อีเมล
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
              <label className="text-xs font-bold text-gray-500">บ้านเลขที่, ถนน, ซอย, อาคาร</label>
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
                <label className="text-xs font-bold text-gray-500">แขวง / ตำบล</label>
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
                <label className="text-xs font-bold text-gray-500">เขต / อำเภอ</label>
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
                <label className="text-xs font-bold text-gray-500">จังหวัด</label>
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
                <label className="text-xs font-bold text-gray-500">รหัสไปรษณีย์</label>
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
        )}

        {/* Step 3: Success / Already Submitted Screen */}
        {(submitted || alreadySubmitted) && (
          <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm flex flex-col items-center text-center gap-6 animate-in zoom-in-95 duration-200">
            <CheckCircleIcon className="w-20 h-20 text-[#2E7D32]" />

            <div className="flex flex-col gap-2">
              <h2 className="text-2xl font-black text-[#2B2B2B]">
                {alreadySubmitted ? "บันทึกที่อยู่จัดส่งแล้ว" : "สั่งซื้อสำเร็จ!"}
              </h2>
              <p className="text-sm font-semibold text-[#2E7D32]">
                {alreadySubmitted 
                  ? "คำสั่งซื้อนี้มีข้อมูลที่อยู่จัดส่งในระบบเรียบร้อยแล้ว" 
                  : "บันทึกที่อยู่จัดส่งเรียบร้อยแล้ว"}
              </p>
            </div>

            {alreadySubmitted && (
              <div className="bg-amber-50 border border-amber-200/80 p-3.5 rounded-2xl text-amber-900 text-xs leading-relaxed flex items-start gap-2.5 text-left w-full">
                <InformationCircleIcon className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  ท่านได้ทำการบันทึกข้อมูลที่อยู่สำหรับคำสั่งซื้อนี้แล้ว ระบบไม่อนุญาตให้กรอกซ้ำหรือแก้ไขผ่านลิงก์นี้ หากต้องการเปลี่ยนแปลงข้อมูล กรุณาติดต่อเจ้าหน้าที่หน้าร้าน
                </span>
              </div>
            )}

            <div className="w-full bg-gray-50 border border-gray-100 p-5 rounded-2xl text-left flex flex-col gap-3">
              <div className="flex justify-between items-center text-xs text-gray-400">
                <span>รหัสคำสั่งซื้อ:</span>
                <span className="font-bold text-[#2B2B2B] font-mono">{orderId}</span>
              </div>
              <div className="flex justify-between items-center text-xs text-gray-400">
                <span>ผู้รับพัสดุ:</span>
                <span className="font-bold text-[#2B2B2B]">{name || order?.customerName || "-"}</span>
              </div>
              <div className="flex justify-between items-center text-xs text-gray-400">
                <span>เบอร์โทรศัพท์:</span>
                <span className="font-bold text-[#2B2B2B]">{phone || order?.customerPhone || "-"}</span>
              </div>
              <div className="flex justify-between items-center text-xs text-gray-400">
                <span>อีเมล:</span>
                <span className="font-bold text-[#2B2B2B]">{email || order?.customerEmail || "-"}</span>
              </div>

              {savedAddress && (
                <div className="flex flex-col gap-1 border-t border-gray-200/60 pt-2.5 mt-1">
                  <span className="text-xs text-gray-400 font-medium">ที่อยู่จัดส่งที่บันทึกไว้:</span>
                  <span className="text-xs font-bold text-[#2B2B2B] leading-relaxed break-words">{savedAddress}</span>
                </div>
              )}
              
              {/* Mixed / Pre-order release delivery details */}
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
              ปิดหน้าต่างนี้
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
