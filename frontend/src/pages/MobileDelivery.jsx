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
  PlusIcon,
  TrashIcon,
  CheckIcon,
  BuildingOffice2Icon,
  PencilSquareIcon
} from "@heroicons/react/24/outline";
import { notify, confirmDialog } from "../components/notify";

export default function MobileDelivery() {
  const [orderId, setOrderId] = useState("");
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState(null);

  // Multi-address States (Max 3 addresses)
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState(null);

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
  const [savedAddressText, setSavedAddressText] = useState("");
  const [preorderShippingDate, setPreorderShippingDate] = useState("");
  const [hasInStock, setHasInStock] = useState(false);
  const [hasPreOrder, setHasPreOrder] = useState(false);
  const [isMixed, setIsMixed] = useState(false);

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

  // Helper to load addresses from API response
  const applyMemberProfile = (member) => {
    if (!member) {
      setSavedAddresses([]);
      setShowAddressForm(true);
      return;
    }

    if (member.name) setName(member.name);
    if (member.phone) setPhone(member.phone);
    if (member.email) setEmail(member.email);

    const addrList = Array.isArray(member.addresses) ? member.addresses : [];
    setSavedAddresses(addrList);

    if (addrList.length > 0) {
      const defaultAddr = addrList.find(a => a.isDefault) || addrList[0];
      setSelectedAddressId(defaultAddr.id);
      if (defaultAddr.name) setName(defaultAddr.name);
      if (defaultAddr.phone) setPhone(defaultAddr.phone);
      if (defaultAddr.address) parseAndFillAddress(defaultAddr.address);
      setShowAddressForm(false);
    } else {
      if (member.address) parseAndFillAddress(member.address);
      setShowAddressForm(true);
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
          if (currentAddress) setSavedAddressText(currentAddress);

          if (currentAddress && currentAddress.trim() !== "") {
            setAlreadySubmitted(true);
          }

          // Check if mixed order and find preorder release dates
          const items = data.items || [];
          const inStockExist = items.some(item => item.product?.status === "In Stock");
          const preOrderExist = items.some(item => item.product?.status === "Pre-Order");
          setHasInStock(inStockExist);
          setHasPreOrder(preOrderExist);
          setIsMixed(inStockExist && preOrderExist);

          if (hasPreOrder) {
            const releaseDates = items
              .filter(item => item.product?.status === "Pre-Order")
              .map(item => item.product?.preorderReleaseDate || item.product?.preorder_release_date)
              .filter(Boolean)
              .map(d => new Date(d));

            if (releaseDates.length > 0) {
              const maxDate = new Date(Math.max(...releaseDates));
              setPreorderShippingDate(maxDate.toLocaleDateString("th-TH", {
                year: "numeric",
                month: "long",
                day: "numeric"
              }));
            }
          }

          // Auto-fetch saved member addresses by email if available
          if (currentEmail) {
            fetch(`/api/members/email/${encodeURIComponent(currentEmail)}`)
              .then((res) => res.json())
              .then((member) => applyMemberProfile(member))
              .catch((err) => {
                console.error("Member address lookup error:", err);
                setShowAddressForm(true);
              });
          } else {
            setShowAddressForm(true);
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

  const handleSelectAddressCard = (addrObj) => {
    setSelectedAddressId(addrObj.id);
    if (addrObj.name) setName(addrObj.name);
    if (addrObj.phone) setPhone(addrObj.phone);
    if (addrObj.address) parseAndFillAddress(addrObj.address);
  };

  const handleEditAddressCard = (item, e) => {
    e.stopPropagation();
    setEditingAddressId(item.id);
    if (item.name) setName(item.name);
    if (item.phone) setPhone(item.phone);
    if (item.address) parseAndFillAddress(item.address);
    setShowAddressForm(true);
  };

  const handleDeleteAddressCard = async (addrId, e) => {
    e.stopPropagation();
    const confirmed = await confirmDialog({
      title: "ลบที่อยู่จัดส่ง?",
      message: "คุณต้องการลบที่อยู่นี้ออกจากประวัติใช่หรือไม่?",
      confirmText: "ลบที่อยู่",
      variant: "danger",
    });
    if (!confirmed) return;

    try {
      const targetEmail = email || order?.customerEmail;
      const res = await fetch("/api/members/address", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: targetEmail,
          addressId: addrId
        })
      });

      const data = await res.json();
      if (res.ok && data.addresses) {
        setSavedAddresses(data.addresses);
        if (selectedAddressId === addrId) {
          if (data.addresses.length > 0) {
            handleSelectAddressCard(data.addresses[0]);
          } else {
            setShowAddressForm(true);
          }
        }
      }
    } catch (err) {
      console.error("Error deleting address:", err);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // If using address cards view (not editing)
    if (!showAddressForm && savedAddresses.length > 0) {
      const activeCard = savedAddresses.find(a => a.id === selectedAddressId) || savedAddresses[0];
      if (!activeCard || !activeCard.address) {
        notify.warning("กรุณาเลือกที่อยู่จัดส่ง");
        return;
      }

      setSubmitting(true);
      fetch(`/api/orders/${orderId}/address`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: activeCard.name || name,
          phone: activeCard.phone || phone,
          email: email || order?.customerEmail,
          customerAddressFormatted: activeCard.address
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
          if (activeCard.name) setName(activeCard.name);
          else if (order?.customerName) setName(order.customerName);

          if (activeCard.phone) setPhone(activeCard.phone);
          else if (order?.customerPhone) setPhone(order.customerPhone);

          setSavedAddressText(activeCard.address);
          setSubmitted(true);
        })
        .catch((err) => notify.error(err.message))
        .finally(() => setSubmitting(false));
      return;
    }

    // If using address form view (New or Edit)
    if (!name || !phone || !email || !addressStreet || !subdistrict || !district || !province || !zipcode) {
      notify.warning("กรุณากรอกข้อมูลให้ครบถ้วน");
      return;
    }

    const fullAddress = `${addressStreet}, ${subdistrict}, ${district}, ${province} ${zipcode}`;
    setSubmitting(true);

    // Case 2: If EDITING an existing saved address card (editingAddressId !== null)
    if (editingAddressId) {
      const updatedAddresses = savedAddresses.map(a => {
        if (a.id === editingAddressId) {
          return {
            ...a,
            name,
            phone,
            address: fullAddress
          };
        }
        return a;
      });

      // Save/update customer profile in backend
      fetch("/api/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          phone,
          email,
          address: fullAddress,
          addresses: updatedAddresses
        })
      })
        .then(async (res) => {
          if (!res.ok) throw new Error("ไม่สามารถบันทึกการแก้ไขที่อยู่ได้");
          return res.json();
        })
        .then(() => {
          setSavedAddresses(updatedAddresses);
          setSelectedAddressId(editingAddressId);
          setShowAddressForm(false);
          setEditingAddressId(null);
        })
        .catch((err) => notify.error(err.message))
        .finally(() => setSubmitting(false));
      return;
    }

    // Case 3: Adding a NEW address or submitting as Guest
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
        zipcode
      })
    })
      .then(async (res) => {
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || "ไม่สามารถบันทึกที่อยู่จัดส่งได้");
        }
        return res.json();
      })
      .then(async () => {
        // Save to customer profile in backend
        await fetch("/api/members", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            phone,
            email,
            address: fullAddress
          })
        }).catch((err) => console.error("Error saving member profile:", err));

        setSavedAddressText(fullAddress);
        setSubmitted(true);
      })
      .catch((err) => notify.error(err.message))
      .finally(() => setSubmitting(false));
  };

  const handleCloseWindow = () => {
    window.close();
    notify.info("หากหน้าต่างไม่ปิดลง กรุณาปิดแท็บนี้ด้วยตนเอง");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center font-['Prompt'] text-[#2B2B2B]">
        <ArrowPathIcon className="w-10 h-10 animate-spin text-[#F8C032] mb-3" />
        <p className="text-sm font-semibold text-slate-600">กำลังโหลดข้อมูลคำสั่งซื้อ...</p>
      </div>
    );
  }

  if (!orderId) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center font-['Prompt'] text-[#2B2B2B] p-6 text-center">
        <div className="w-16 h-16 rounded-full bg-rose-100 text-rose-500 flex items-center justify-center mb-4">
          <TruckIcon className="w-8 h-8" />
        </div>
        <p className="text-rose-600 font-extrabold text-base mb-1">ไม่พบรหัสคำสั่งซื้อ (Order ID)</p>
        <p className="text-xs text-slate-400 max-w-xs">กรุณาเข้าใช้งานผ่านปุ่มลิงก์ยืนยันในอีเมลใบเสร็จของคุณ</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100/70 flex flex-col font-['Prompt'] text-[#2B2B2B]">
      {/* Top Header Banner */}
      <div className="bg-[#2B2B2B] text-white py-5 px-6 shadow-md border-b border-amber-500/20 sticky top-0 z-20">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-[#F8C032] flex items-center justify-center shrink-0 border border-amber-500/30">
              <TruckIcon className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <h1 className="text-base font-black tracking-wide">ระบุที่อยู่จัดส่งพัสดุ</h1>
              <p className="text-[11px] text-gray-400 font-medium">Order ID: <span className="text-amber-400 font-mono font-bold">{orderId}</span></p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col max-w-md w-full mx-auto p-4 sm:p-5 gap-5">
        {/* Step 1 & 2: Form or Address Cards view */}
        {!submitted && !alreadySubmitted && (
          <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-md flex flex-col gap-6 animate-in fade-in-50 duration-200">
            {/* Header with Email display directly underneath */}
            <div className="flex flex-col gap-2 border-b border-slate-100 pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <MapPinIcon className="w-5 h-5 text-[#F8C032]" />
                  <h2 className="text-base font-black text-slate-800">
                    {!showAddressForm && savedAddresses.length > 0 
                      ? "เลือกที่อยู่จัดส่ง" 
                      : (editingAddressId ? "แก้ไขที่อยู่จัดส่ง" : "กรอกข้อมูลที่อยู่จัดส่ง")}
                  </h2>
                </div>
                {savedAddresses.length > 0 && showAddressForm && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddressForm(false);
                      setEditingAddressId(null);
                    }}
                    className="text-xs font-bold text-slate-400 hover:text-slate-600 bg-slate-100 px-3 py-1.5 rounded-full transition-colors cursor-pointer"
                  >
                    ยกเลิก
                  </button>
                )}
              </div>

              {/* Display Email below "เลือกที่อยู่จัดส่ง" heading */}
              {(email || order?.customerEmail) && (
                <div className="flex items-center gap-1.5 text-xs text-slate-500 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100 w-fit font-medium">
                  <EnvelopeIcon className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span>อีเมลบัญชีผู้ซื้อ: <strong className="text-slate-700">{email || order?.customerEmail}</strong></span>
                </div>
              )}
            </div>

            {/* VIEW A: Address Cards List (Spacious & Clean Mobile UI) */}
            {!showAddressForm && savedAddresses.length > 0 && (
              <div className="flex flex-col gap-5">
                <div className="flex items-center justify-between px-1">
                  <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">
                    ประวัติที่อยู่ของคุณ ({savedAddresses.length}/3)
                  </span>
                </div>

                <div className="flex flex-col gap-4">
                  {savedAddresses.map((item) => {
                    const isSelected = selectedAddressId === item.id;
                    return (
                      <div
                        key={item.id}
                        onClick={() => handleSelectAddressCard(item)}
                        className={`p-4 rounded-2xl border-2 transition-all cursor-pointer relative flex flex-col gap-3 ${
                          isSelected
                            ? "border-[#F8C032] bg-amber-50/40 shadow-md ring-2 ring-[#F8C032]/20"
                            : "border-slate-100 hover:border-slate-200 bg-white shadow-sm"
                        }`}
                      >
                        {/* Top Info Row */}
                        <div className="flex items-start justify-between gap-2 border-b border-slate-100/80 pb-2.5">
                          <div className="flex items-center gap-3">
                            {/* Large Touch-friendly Radio Button */}
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                              isSelected ? "border-[#F8C032] bg-[#F8C032]" : "border-slate-300"
                            }`}>
                              {isSelected && <CheckIcon className="w-3.5 h-3.5 text-white stroke-[3]" />}
                            </div>

                            <div className="flex flex-col">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-extrabold text-slate-800">
                                  {item.name || name || "ไม่ระบุชื่อ"}
                                </span>
                                {item.isDefault && (
                                  <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-md shrink-0">
                                    หลัก
                                  </span>
                                )}
                              </div>
                              <span className="text-xs text-slate-500 font-medium flex items-center gap-1 mt-0.5">
                                <PhoneIcon className="w-3 h-3 text-slate-400" />
                                {item.phone || phone || "ไม่ระบุเบอร์"}
                              </span>
                            </div>
                          </div>

                          {/* Action Buttons (Edit & Delete side-by-side, Icon only) */}
                          <div className="flex items-center gap-1 shrink-0">
                            {/* Edit Button (Icon Only) */}
                            <button
                              type="button"
                              onClick={(e) => handleEditAddressCard(item, e)}
                              className="p-1.5 rounded-xl text-amber-600 hover:text-amber-700 hover:bg-amber-50 transition-colors cursor-pointer"
                              title="แก้ไขที่อยู่นี้"
                            >
                              <PencilSquareIcon className="w-4 h-4 stroke-[2]" />
                            </button>

                            {/* Delete Button */}
                            <button
                              type="button"
                              onClick={(e) => handleDeleteAddressCard(item.id, e)}
                              className="p-1.5 rounded-xl text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-colors cursor-pointer"
                              title="ลบที่อยู่นี้"
                            >
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Address Text Box */}
                        <div className="bg-slate-50/90 rounded-xl p-3 border border-slate-100">
                          <p className="text-xs text-slate-700 leading-relaxed font-normal">
                            {item.address}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Add New Address Option Button */}
                {savedAddresses.length < 3 ? (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingAddressId(null);
                      setName("");
                      setPhone("");
                      setAddressStreet("");
                      setSubdistrict("");
                      setDistrict("");
                      setProvince("");
                      setZipcode("");
                      setShowAddressForm(true);
                    }}
                    className="w-full py-3.5 px-4 rounded-2xl border-2 border-dashed border-[#F8C032] text-[#E0A000] hover:bg-amber-50/60 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer mt-1 active:scale-[0.99]"
                  >
                    <PlusIcon className="w-4 h-4 stroke-[3]" />
                    <span>เพิ่มที่อยู่ใหม่ (บันทึกได้สูงสุด 3 ที่อยู่)</span>
                  </button>
                ) : (
                  <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl text-center text-xs text-slate-400 font-medium">
                    * บันทึกที่อยู่ครบโควตาสูงสุด 3 รายการแล้ว (ลบที่อยู่ออกหากต้องการเพิ่มใหม่)
                  </div>
                )}

                {/* Submit button for selected Card */}
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-4 rounded-2xl bg-[#F8C032] hover:bg-[#F0B420] active:scale-[0.98] disabled:opacity-50 text-white font-black text-sm shadow-md shadow-amber-500/20 transition-all cursor-pointer mt-2"
                >
                  {submitting ? "กำลังบันทึก..." : "ยืนยันจัดส่งไปยังที่อยู่นี้"}
                </button>
              </div>
            )}

            {/* VIEW B: Full Address Form (Clean & Spacious Mobile Inputs) */}
            {(showAddressForm || savedAddresses.length === 0) && (
              <div className="flex flex-col gap-5">
                {/* Receiver Info Section */}
                <div className="flex flex-col gap-3.5">
                  <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-1.5 flex items-center gap-1.5">
                    <UserIcon className="w-4 h-4 text-[#F8C032]" /> 1. ข้อมูลผู้รับพัสดุ
                  </span>

                  {/* Name */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-600">ชื่อ-นามสกุล ผู้รับ</label>
                    <input
                      type="text"
                      required
                      placeholder="เช่น สมชาย ใจดี"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="h-12 px-4 rounded-xl border border-slate-200 focus:outline-none focus:border-[#F8C032] focus:ring-2 focus:ring-[#F8C032]/20 text-sm font-medium text-slate-800 placeholder:text-slate-300"
                    />
                  </div>

                  {/* Phone & Email */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-slate-600">เบอร์โทรศัพท์มือถือ</label>
                      <input
                        type="tel"
                        required
                        maxLength={10}
                        pattern="[0-9]{10}"
                        placeholder="เช่น 0812345678"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                        className="h-12 px-4 rounded-xl border border-slate-200 focus:outline-none focus:border-[#F8C032] focus:ring-2 focus:ring-[#F8C032]/20 text-sm font-medium text-slate-800 placeholder:text-slate-300"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-slate-600">อีเมลรับแจ้งสถานะ (ไม่อนุญาตให้แก้ไข)</label>
                      <input
                        type="email"
                        required
                        readOnly
                        value={email || order?.customerEmail || ""}
                        className="h-12 px-4 rounded-xl border border-slate-200 bg-slate-100 text-slate-500 font-semibold text-sm cursor-not-allowed select-none focus:outline-none"
                        title="อีเมลถูกล็อกตามคำสั่งซื้อนี้"
                      />
                    </div>
                  </div>
                </div>

                {/* Address Details Section */}
                <div className="flex flex-col gap-3.5 pt-2">
                  <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-1.5 flex items-center gap-1.5">
                    <BuildingOffice2Icon className="w-4 h-4 text-[#F8C032]" /> 2. รายละเอียดที่อยู่
                  </span>

                  {/* Street / Building address */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-600">บ้านเลขที่, ถนน, ซอย, อาคาร</label>
                    <input
                      type="text"
                      required
                      placeholder="เช่น 123/45 หมู่ 5 ถนนสุขุมวิท"
                      value={addressStreet}
                      onChange={(e) => setAddressStreet(e.target.value)}
                      className="h-12 px-4 rounded-xl border border-slate-200 focus:outline-none focus:border-[#F8C032] focus:ring-2 focus:ring-[#F8C032]/20 text-sm font-medium text-slate-800 placeholder:text-slate-300"
                    />
                  </div>

                  {/* Subdistrict & District */}
                  <div className="grid grid-cols-2 gap-3.5">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-slate-600">แขวง / ตำบล</label>
                      <input
                        type="text"
                        required
                        placeholder="เช่น ดินแดง"
                        value={subdistrict}
                        onChange={(e) => setSubdistrict(e.target.value)}
                        className="h-12 px-4 rounded-xl border border-slate-200 focus:outline-none focus:border-[#F8C032] focus:ring-2 focus:ring-[#F8C032]/20 text-sm font-medium text-slate-800 placeholder:text-slate-300"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-slate-600">เขต / อำเภอ</label>
                      <input
                        type="text"
                        required
                        placeholder="เช่น ดินแดง"
                        value={district}
                        onChange={(e) => setDistrict(e.target.value)}
                        className="h-12 px-4 rounded-xl border border-slate-200 focus:outline-none focus:border-[#F8C032] focus:ring-2 focus:ring-[#F8C032]/20 text-sm font-medium text-slate-800 placeholder:text-slate-300"
                      />
                    </div>
                  </div>

                  {/* Province & Zipcode */}
                  <div className="grid grid-cols-2 gap-3.5">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-slate-600">จังหวัด</label>
                      <input
                        type="text"
                        required
                        placeholder="เช่น กรุงเทพมหานคร"
                        value={province}
                        onChange={(e) => setProvince(e.target.value)}
                        className="h-12 px-4 rounded-xl border border-slate-200 focus:outline-none focus:border-[#F8C032] focus:ring-2 focus:ring-[#F8C032]/20 text-sm font-medium text-slate-800 placeholder:text-slate-300"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-slate-600">รหัสไปรษณีย์</label>
                      <input
                        type="text"
                        required
                        onChange={(e) => setZipcode(e.target.value.replace(/\D/g, ""))}
                        className="h-12 px-4 rounded-xl border border-slate-200 focus:outline-none focus:border-[#F8C032] focus:ring-2 focus:ring-[#F8C032]/20 text-sm font-medium text-slate-800 placeholder:text-slate-300"
                      />
                    </div>
                  </div>
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-4 rounded-2xl bg-[#F8C032] hover:bg-[#F0B420] active:scale-[0.98] disabled:opacity-50 text-white font-black text-sm shadow-md shadow-amber-500/20 transition-all cursor-pointer mt-3"
                >
                  {submitting ? "กำลังบันทึก..." : (editingAddressId ? "บันทึกการแก้ไขที่อยู่นี้" : "ยืนยันและบันทึกที่อยู่จัดส่ง")}
                </button>
              </div>
            )}
          </form>
        )}

        {/* Step 3: Confirmation Screen */}
        {(submitted || alreadySubmitted) && (
          <div className="bg-white rounded-3xl p-7 sm:p-8 border border-slate-200/80 shadow-md flex flex-col items-center text-center gap-6 animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-500 flex items-center justify-center shadow-inner">
              <CheckCircleIcon className="w-10 h-10" />
            </div>

            <div className="flex flex-col gap-1.5">
              <h2 className="text-lg font-black text-slate-800">
                {submitted ? "บันทึกที่อยู่จัดส่งเรียบร้อยแล้ว!" : "คำสั่งซื้อนี้มีข้อมูลจัดส่งแล้ว"}
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed max-w-xs mx-auto">
                พนักงานจะทำการแพ็กและจัดส่งสินค้าไปยังที่อยู่ของคุณโดยเร็วที่สุด
              </p>
            </div>

            {/* Split / Combined Preorder Shipping Info Badge */}
            {preorderShippingDate && (
              <div className="w-full p-4 rounded-2xl bg-amber-50 border border-amber-200 text-left flex flex-col gap-1.5 shadow-sm">
                <span className="text-xs font-bold text-amber-800 flex items-center gap-1.5">
                  <SparklesIcon className="w-4 h-4 text-amber-600" />
                  <span>
                    {isMixed && order?.shippingOption === "combined"
                      ? "🚚 การจัดส่งสินค้าแบบรวมส่ง (Combined Shipping)"
                      : "📦 กำหนดการจัดส่งสินค้าพรีออเดอร์ (Pre-Order)"}
                  </span>
                </span>
                <p className="text-xs text-amber-900 leading-relaxed font-medium">
                  {isMixed && order?.shippingOption === "combined" ? (
                    <>
                      ออเดอร์นี้มีสินค้า Pre-Order และท่านเลือกจัดส่งแบบรวมส่ง <strong>ทางร้านจะจัดส่งสินค้าทุกรายการพร้อมกันทั้งหมด เมื่อสินค้า Pre-Order ผลิตเสร็จเรียบร้อยแล้ว</strong> (คาดว่าเริ่มจัดส่งตั้งแต่วันที่: <strong className="underline font-bold text-amber-950">{preorderShippingDate}</strong> เป็นต้นไป)
                    </>
                  ) : (
                    <>
                      คาดว่าจะเริ่มดำเนินการจัดส่งพัสดุสินค้า Pre-Order ตั้งแต่วันที่: <strong className="underline font-bold text-amber-950">{preorderShippingDate}</strong> เป็นต้นไป
                    </>
                  )}
                </p>
                {isMixed && order?.shippingOption !== "combined" && (
                  <p className="text-[11px] text-amber-700/90 leading-tight pt-1 border-t border-amber-200/60 mt-1">
                    *สำหรับสินค้าพร้อมส่ง (In Stock) จะจัดส่งแยกให้ก่อนตามรอบปกติ
                  </p>
                )}
              </div>
            )}

            {/* Tracking Cards for Packages (Combined vs Split vs Single) */}
            <div className="w-full flex flex-col gap-3">
              {isMixed && order?.shippingOption === "combined" ? (
                /* Combined Package Tracking Box (Only when order is mixed and combined shipping is chosen) */
                <div className="w-full bg-[#FFF3E0]/70 border border-[#FFE0B2] rounded-2xl p-4 text-left flex flex-col gap-2 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-[#E65100] flex items-center gap-1.5">
                      <TruckIcon className="w-4 h-4 text-[#E65100]" />
                      พัสดุรวมส่ง
                    </span>
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                      order?.fulfillmentStatus === "fulfilled" 
                        ? "bg-emerald-100 text-emerald-700" 
                        : "bg-amber-100 text-amber-800"
                    }`}>
                      {order?.fulfillmentStatus === "fulfilled" ? "จัดส่งแล้ว" : "รอสินค้า Pre-Order ผลิตเสร็จ"}
                    </span>
                  </div>

                  {preorderShippingDate && (
                    <p className="text-[11px] text-[#BF360C] font-semibold">
                      คาดว่าจะจัดส่งสินค้าทั้งหมดพร้อมกันตั้งแต่วันที่: <strong>{preorderShippingDate}</strong>
                    </p>
                  )}

                  {(order?.courier2 || order?.trackingNumber2 || order?.courier1 || order?.trackingNumber1) ? (
                    <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-[#FFE0B2] mt-1">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[10px] font-bold text-slate-400">ขนส่ง: {order?.courier2 || order?.courier1 || "พัสดุทั่วไป"}</span>
                        <span className="text-sm font-black text-slate-800 tracking-wide font-mono">{order?.trackingNumber2 || order?.trackingNumber1 || "รอดำเนินการ"}</span>
                      </div>
                      {(order?.trackingNumber2 || order?.trackingNumber1) && (
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(order.trackingNumber2 || order.trackingNumber1);
                            notify.success("คัดลอกเลขติดตามพัสดุเรียบร้อยแล้ว");
                          }}
                          className="px-3 py-1.5 bg-[#E65100] text-white text-[11px] font-bold rounded-lg hover:bg-[#D84315] transition-colors"
                        >
                          คัดลอกเลข
                        </button>
                      )}
                    </div>
                  ) : (
                    <p className="text-[11px] text-slate-500 italic pt-1">
                      * สินค้าทุกรายการจะจัดส่งพร้อมกัน เมื่อสินค้า Pre-Order ผลิตเสร็จเรียบร้อยแล้ว
                    </p>
                  )}
                </div>
              ) : (
                /* Single or Split Package Tracking Boxes */
                <>
                  {/* Package 1: In-Stock Package Tracking */}
                  {(hasInStock || (!hasPreOrder && (order?.courier1 || order?.trackingNumber1))) && (
                    <div className="w-full bg-[#E0F2F1]/40 border border-[#80CBC4]/60 rounded-2xl p-4 text-left flex flex-col gap-2 shadow-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-[#00796B] flex items-center gap-1.5">
                          <TruckIcon className="w-4 h-4 text-[#00796B]" />
                          {isMixed ? "📦 พัสดุ 1: สินค้าพร้อมส่ง" : "📦 พัสดุจัดส่งสินค้า"}
                        </span>
                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                          order?.fulfillmentStatusInstock === "fulfilled" || order?.fulfillmentStatus === "fulfilled"
                            ? "bg-emerald-100 text-emerald-700" 
                            : "bg-amber-100 text-amber-800"
                        }`}>
                          {order?.fulfillmentStatusInstock === "fulfilled" || order?.fulfillmentStatus === "fulfilled" ? "จัดส่งแล้ว" : "กำลังเตรียมจัดส่ง"}
                        </span>
                      </div>
                      {(order?.courier1 || order?.trackingNumber1) ? (
                        <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-[#80CBC4]/40 mt-1">
                          <div className="flex flex-col gap-0.5">
                            <span className="text-[10px] font-bold text-slate-400">ขนส่ง: {order?.courier1 || "พัสดุทั่วไป"}</span>
                            <span className="text-sm font-black text-slate-800 tracking-wide font-mono">{order?.trackingNumber1 || "รอดำเนินการ"}</span>
                          </div>
                          {order?.trackingNumber1 && (
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(order.trackingNumber1);
                                notify.success("คัดลอกเลขติดตามพัสดุเรียบร้อยแล้ว");
                              }}
                              className="px-3 py-1.5 bg-[#00796B] text-white text-[11px] font-bold rounded-lg hover:bg-[#00695C] transition-colors"
                            >
                              คัดลอกเลข
                            </button>
                          )}
                        </div>
                      ) : (
                        <p className="text-[11px] text-slate-500 italic pt-1">
                          * พนักงานกำลังจัดเตรียมพัสดุพร้อมส่ง เลขติดตามจะปรากฏเมื่อดำเนินการจัดส่ง
                        </p>
                      )}
                    </div>
                  )}

                  {/* Package 2: Pre-Order Package Tracking */}
                  {(hasPreOrder || (!hasInStock && (order?.courier2 || order?.trackingNumber2))) && (
                    <div className="w-full bg-[#FFF3E0]/60 border border-[#FFE0B2] rounded-2xl p-4 text-left flex flex-col gap-2 shadow-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-[#E65100] flex items-center gap-1.5">
                          <SparklesIcon className="w-4 h-4 text-[#E65100]" />
                          {isMixed ? "⏳ พัสดุ 2: สินค้าพรีออเดอร์" : "📦 พัสดุสินค้าพรีออเดอร์"}
                        </span>
                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                          order?.fulfillmentStatusPreorder === "fulfilled" || order?.fulfillmentStatus === "fulfilled"
                            ? "bg-emerald-100 text-emerald-700" 
                            : "bg-amber-100 text-amber-800"
                        }`}>
                          {order?.fulfillmentStatusPreorder === "fulfilled" || order?.fulfillmentStatus === "fulfilled" ? "จัดส่งแล้ว" : "รอสินค้าพรีออเดอร์"}
                        </span>
                      </div>
                      {preorderShippingDate && (
                        <p className="text-[11px] text-[#BF360C] font-semibold">
                          คาดว่าจะจัดส่งตั้งแต่วันที่: <strong>{preorderShippingDate}</strong>
                        </p>
                      )}
                      {(order?.courier2 || order?.trackingNumber2 || order?.courier1 || order?.trackingNumber1) ? (
                        <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-[#FFE0B2] mt-1">
                          <div className="flex flex-col gap-0.5">
                            <span className="text-[10px] font-bold text-[#A34000]">ขนส่ง: {order?.courier2 || order?.courier1 || "พัสดุทั่วไป"}</span>
                            <span className="text-sm font-black text-slate-800 tracking-wide font-mono">{order?.trackingNumber2 || order?.trackingNumber1 || "รอดำเนินการ"}</span>
                          </div>
                          {(order?.trackingNumber2 || order?.trackingNumber1) && (
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(order.trackingNumber2 || order.trackingNumber1);
                                notify.success("คัดลอกเลขติดตามพัสดุ Pre-Order เรียบร้อยแล้ว");
                              }}
                              className="px-3 py-1.5 bg-[#E65100] text-white text-[11px] font-bold rounded-lg hover:bg-[#D84315] transition-colors"
                            >
                              คัดลอกเลข
                            </button>
                          )}
                        </div>
                      ) : (
                        <p className="text-[11px] text-slate-500 italic pt-1">
                          * สินค้าพรีออเดอร์อยู่ระหว่างรอดำเนินการสั่งผลิต/นำเข้า
                        </p>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Address Details Summary Card */}
            <div className="w-full bg-slate-50 rounded-2xl p-4 border border-slate-200/80 text-left flex flex-col gap-2 shadow-sm">
              <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">
                ที่อยู่สำหรับจัดส่งพัสดุ:
              </span>
              <p className="text-sm font-semibold text-slate-800 leading-relaxed">
                {savedAddressText || `${addressStreet}, ${subdistrict}, ${district}, ${province} ${zipcode}`}
              </p>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 pt-2.5 border-t border-slate-200/60 mt-1">
                <span>ผู้รับ: <strong className="text-slate-700">{name || order?.customerName || "ไม่ระบุ"}</strong></span>
                <span>โทร: <strong className="text-slate-700">{phone || order?.customerPhone || "ไม่ระบุ"}</strong></span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="w-full flex flex-col gap-2 pt-2">
              <button
                type="button"
                onClick={handleCloseWindow}
                className="w-full py-4 rounded-2xl bg-[#2B2B2B] hover:bg-black active:scale-[0.98] text-white font-bold text-sm shadow-md transition-all cursor-pointer"
              >
                ปิดหน้าต่างนี้
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
