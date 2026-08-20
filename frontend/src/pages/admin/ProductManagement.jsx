import React, { useState, useEffect } from "react";
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  Squares2X2Icon,
  TagIcon,
  ExclamationTriangleIcon,
  ChevronDownIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  FunnelIcon,
  ArrowPathIcon
} from "@heroicons/react/24/outline";
import { notify, confirmDialog } from "../../components/notify";
import AdminNavbar from "../../components/admin/AdminNavbar";
import CustomDropdown from "../../components/admin/CustomDropdown";

// CATEGORIES list is now loaded dynamically in component state

// IMAGES removed, uploads only

const resizeImage = (file, maxWidth = 600, maxHeight = 600) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              const resizedFile = new File([blob], file.name, {
                type: file.type,
                lastModified: Date.now()
              });
              resolve(resizedFile);
            } else {
              reject(new Error("Canvas to blob conversion failed"));
            }
          },
          file.type || "image/jpeg",
          0.85
        );
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
};

export default function ProductManagement() {
  const [categories, setCategories] = useState([]);

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentUser, setCurrentUser] = useState(null);

  // Search & Filter State สำหรับคลังสินค้า
  const [productSearchQuery, setProductSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [stockStatusFilter, setStockStatusFilter] = useState("all");

  // State สำหรับควบคุม Modal ฟอร์ม
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null); // NULL = สร้างใหม่, มีค่า = แก้ไขตาม ID นั้น
  const [form, setForm] = useState({
    name: "",
    description: "",
    additional_info: "",
    price: 0,
    stock: 0,
    category: "drinks",
    image: "water",
    promotion: false,
    pickupLocation: "",
    status: "In Stock"
  });

  const [isCatDropdownOpen, setIsCatDropdownOpen] = useState(false);
  const [editingCatId, setEditingCatId] = useState(null);
  const [editingCatName, setEditingCatName] = useState("");

  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [newCatId, setNewCatId] = useState("");

  // แท็บทำงาน: products = จัดการสินค้า, users = จัดการพนักงาน
  const [activeTab, setActiveTab] = useState("products");
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [userForm, setUserForm] = useState({
    username: "",
    password: "",
    role: "staff",
    name: ""
  });

  const [kioskStats, setKioskStats] = useState({ wakeups: 0, totalViews: 0 });

  const fetchStats = async () => {
    try {
      const res = await fetch("/api/kiosk/stats", {
        credentials: "include"
      });
      const data = await res.json();
      if (res.ok) {
        setKioskStats(data);
      }
    } catch (err) {
      console.error("Error loading stats:", err);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch("/api/categories");
      const data = await res.json();
      if (res.ok) {
        setCategories(data);
      }
    } catch (err) {
      console.error("Error fetching categories:", err);
    }
  };

  const [baseShippingFeeInput, setBaseShippingFeeInput] = useState("40");
  const [popularTagsInput, setPopularTagsInput] = useState("");
  const [isSavingTags, setIsSavingTags] = useState(false);

  // Contact settings state
  const [contactHotlineInput, setContactHotlineInput] = useState("053-942606");
  const [contactLineIdInput, setContactLineIdInput] = useState("@ditcsupport");
  const [contactLineUrlInput, setContactLineUrlInput] = useState("https://line.me/ti/p/@ditcsupport");
  const [contactLineQrImageInput, setContactLineQrImageInput] = useState("");
  const [contactServiceHoursInput, setContactServiceHoursInput] = useState("เปิดบริการ 08:00 - 20:00 น.");
  const [contactWebsiteInput, setContactWebsiteInput] = useState("www.camt.cmu.ac.th");
  const [contactFacebookInput, setContactFacebookInput] = useState("CAMT Chiang Mai University");
  const [isSavingContact, setIsSavingContact] = useState(false);
  const [isUploadingQr, setIsUploadingQr] = useState(false);

  const fetchShippingSettings = async () => {
    try {
      const res = await fetch("/api/settings/shipping");
      const data = await res.json();
      if (res.ok) {
        setBaseShippingFeeInput(data.baseShippingFee.toString());
      }
    } catch (err) {
      console.error("Error loading shipping settings:", err);
    }
  };

  const fetchPopularTags = async () => {
    try {
      const res = await fetch("/api/settings/search-tags");
      const data = await res.json();
      if (res.ok && data.popularSearchTags && Array.isArray(data.popularSearchTags)) {
        setPopularTagsInput(data.popularSearchTags.join(", "));
      }
    } catch (err) {
      console.error("Error loading popular search tags:", err);
    }
  };

  const fetchContactSettings = async () => {
    try {
      const res = await fetch("/api/settings/contact");
      const data = await res.json();
      if (res.ok) {
        if (data.hotline) setContactHotlineInput(data.hotline);
        if (data.lineId) setContactLineIdInput(data.lineId);
        if (data.lineUrl) setContactLineUrlInput(data.lineUrl);
        if (data.lineQrImage !== undefined) setContactLineQrImageInput(data.lineQrImage);
        if (data.serviceHours) setContactServiceHoursInput(data.serviceHours);
        if (data.website) setContactWebsiteInput(data.website);
        if (data.facebook) setContactFacebookInput(data.facebook);
      }
    } catch (err) {
      console.error("Error loading contact settings:", err);
    }
  };

  const handleSaveShippingSettings = async () => {
    const feeVal = parseFloat(baseShippingFeeInput);
    if (isNaN(feeVal) || feeVal < 0) {
      notify.warning("กรุณาระบุค่าจัดส่งที่ถูกต้อง");
      return;
    }

    try {
      const res = await fetch("/api/settings/shipping", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          baseShippingFee: feeVal,
          additionalSplitShippingFee: feeVal
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "เกิดข้อผิดพลาดในการบันทึกค่าจัดส่ง");

      notify.success("บันทึกค่าจัดส่งระบบสำเร็จ!");
      fetchShippingSettings();
    } catch (err) {
      notify.error(err.message);
    }
  };

  const handleSavePopularTags = async () => {
    setIsSavingTags(true);
    try {
      const tagArray = popularTagsInput
        .split(",")
        .map((t) => t.trim())
        .filter((t) => t.length > 0);

      const res = await fetch("/api/settings/search-tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ popularSearchTags: tagArray })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "ไม่สามารถบันทึกคำค้นหายอดนิยมได้");

      notify.success("บันทึกคำค้นหายอดนิยมเรียบร้อยแล้ว!");
      if (data.popularSearchTags && Array.isArray(data.popularSearchTags)) {
        setPopularTagsInput(data.popularSearchTags.join(", "));
      }
    } catch (err) {
      notify.error(err.message);
    } finally {
      setIsSavingTags(false);
    }
  };

  const handleSaveContactSettings = async () => {
    setIsSavingContact(true);
    try {
      const res = await fetch("/api/settings/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          hotline: contactHotlineInput,
          lineId: contactLineIdInput,
          lineUrl: contactLineUrlInput,
          lineQrImage: contactLineQrImageInput,
          serviceHours: contactServiceHoursInput,
          website: contactWebsiteInput,
          facebook: contactFacebookInput
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "ไม่สามารถบันทึกข้อมูลการติดต่อได้");
      notify.success("บันทึกข้อมูลการติดต่อเจ้าหน้าที่เรียบร้อยแล้ว!");
    } catch (err) {
      notify.error(err.message);
    } finally {
      setIsSavingContact(false);
    }
  };

  const handleQrImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("image", file);

    setIsUploadingQr(true);
    try {
      const res = await fetch("/api/settings/contact/upload-qr", {
        method: "POST",
        credentials: "include",
        body: formData
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "ไม่สามารถอัปโหลดรูปภาพได้");
      setContactLineQrImageInput(data.url);
      notify.success("อัปโหลดรูปภาพ LINE QR Code สำเร็จ!");
    } catch (err) {
      notify.error(err.message);
    } finally {
      setIsUploadingQr(false);
    }
  };

  // --- TEMPORARY RESET BUTTON HANDLERS ---
  const handleResetVisitorCount = async () => {
    const confirmed = await confirmDialog({
      title: "รีเซ็ตจำนวนผู้เข้าใช้งาน?",
      message: "คุณแน่ใจหรือไม่ว่าต้องการรีเซ็ตจำนวนผู้เข้าใช้งาน (Visitor Count) ทั้งหมดให้เป็น 0?",
      confirmText: "รีเซ็ตเป็น 0",
      variant: "danger",
    });
    if (!confirmed) return;
    try {
      const res = await fetch("/api/settings/reset-visitors", {
        method: "POST",
        credentials: "include"
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "เกิดข้อผิดพลาดในการรีเซ็ตจำนวนผู้เข้าใช้งาน");
      notify.success("รีเซ็ตจำนวนผู้เข้าใช้งานสำเร็จเรียบร้อยแล้ว (เป็น 0)");
    } catch (err) {
      notify.error(err.message);
    }
  };

  const handleResetProductViews = async () => {
    const confirmed = await confirmDialog({
      title: "รีเซ็ตยอดการเข้าชมสินค้า?",
      message: "คุณแน่ใจหรือไม่ว่าต้องการรีเซ็ตยอดการเข้าชมสินค้า (Product Views) ทุกรายการให้เป็น 0?",
      confirmText: "รีเซ็ตเป็น 0",
      variant: "danger",
    });
    if (!confirmed) return;
    try {
      const res = await fetch("/api/settings/reset-product-views", {
        method: "POST",
        credentials: "include"
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "เกิดข้อผิดพลาดในการรีเซ็ตยอดการเข้าชมสินค้า");
      notify.success("รีเซ็ตยอดการเข้าชมสินค้าสำเร็จเรียบร้อยแล้ว (เป็น 0)");
      fetchProducts();
    } catch (err) {
      notify.error(err.message);
    }
  };
  // ----------------------------------------

  useEffect(() => {
    const userString = localStorage.getItem("user");
    if (userString) {
      setCurrentUser(JSON.parse(userString));
    }
    fetchProducts();
    fetchCategories();
    fetchStats();
    fetchShippingSettings();
    fetchPopularTags();
    fetchContactSettings();
  }, []);

  // ดึงข้อมูลเมื่อแท็บสมาชิกเปิดทำงาน
  useEffect(() => {
    if (activeTab === "users") {
      fetchUsers();
    }
  }, [activeTab]);

  const fetchProducts = async () => {
    try {
      const res = await fetch("/api/products");
      const data = await res.json();
      if (!res.ok) throw new Error("ไม่สามารถเรียกรายการสินค้าได้");
      setProducts(data);
      fetchStats();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const res = await fetch("/api/auth/users", {
        credentials: "include"
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "ไม่สามารถดึงข้อมูลรายชื่อพนักงานได้");
      setUsers(data);
    } catch (err) {
      notify.error(err.message);
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/auth/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        credentials: "include",
        body: JSON.stringify(userForm)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "เกิดข้อผิดพลาดในการบันทึกรายชื่อพนักงาน");

      notify.success("เพิ่มพนักงานสำเร็จ!");
      setIsUserModalOpen(false);
      setUserForm({ username: "", password: "", role: "staff", name: "" });
      fetchUsers();
    } catch (err) {
      notify.error(err.message);
    }
  };

  const handleDeleteUser = async (id) => {
    const confirmed = await confirmDialog({
      title: "ลบบัญชีผู้ใช้งาน?",
      message: "คุณต้องการลบบัญชีผู้ใช้งานนี้จริงหรือไม่?",
      confirmText: "ลบบัญชี",
      variant: "danger",
    });
    if (!confirmed) return;
    try {
      const res = await fetch(`/api/auth/users/${id}`, {
        method: "DELETE",
        credentials: "include"
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "เกิดข้อผิดพลาดในการลบพนักงาน");

      notify.success("ลบพนักงานสำเร็จ!");
      fetchUsers();
    } catch (err) {
      notify.error(err.message);
    }
  };

  const handleSaveNewCategoryInline = async () => {
    if (!newCatName.trim() || !newCatId.trim()) {
      notify.warning("กรุณากรอกข้อมูลให้ครบถ้วนทั้งชื่อไทยและคีย์ภาษาอังกฤษ");
      return;
    }
    
    const formattedId = newCatId.trim().toLowerCase();
    if (categories.some(c => c.id === formattedId)) {
      notify.warning("มีคีย์หมวดหมู่นี้อยู่แล้วในระบบ");
      return;
    }

    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ id: formattedId, name: newCatName.trim() })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "เกิดข้อผิดพลาดในการบันทึกหมวดหมู่");

      await fetchCategories();
      setForm(prev => ({ ...prev, category: formattedId }));
      setIsAddingCategory(false);
      setNewCatName("");
      setNewCatId("");
      notify.success(`เพิ่มหมวดหมู่ "${data.name}" สำเร็จ!`);
    } catch (err) {
      notify.error(err.message);
    }
  };

  const handleDeleteCategoryById = async (catId) => {
    const categoryName = categories.find(c => c.id === catId)?.name || catId;

    const isUsed = products.some(p => p.category === catId);
    if (isUsed) {
      notify.warning(`ไม่สามารถลบหมวดหมู่ "${categoryName}" ได้ เนื่องจากมีสินค้าที่ใช้หมวดหมู่นี้อยู่`);
      return;
    }

    const confirmed = await confirmDialog({
      title: "ลบหมวดหมู่สินค้า?",
      message: `คุณต้องการลบหมวดหมู่ "${categoryName}" ใช่หรือไม่?`,
      confirmText: "ลบหมวดหมู่",
      variant: "danger",
    });
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/categories/${catId}`, {
        method: "DELETE",
        credentials: "include"
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "ไม่สามารถลบหมวดหมู่ได้");

      await fetchCategories();
      if (form.category === catId) {
        setForm(prev => ({ ...prev, category: "" }));
      }
      notify.success(`ลบหมวดหมู่ "${categoryName}" เรียบร้อยแล้ว`);
    } catch (err) {
      notify.error(err.message);
    }
  };

  const handleSaveCategoryNameInline = async (catId) => {
    const trimmed = editingCatName.trim();
    if (!trimmed) {
      notify.warning("ชื่อหมวดหมู่ไม่สามารถเป็นค่าว่างได้");
      return;
    }

    try {
      const res = await fetch(`/api/categories/${catId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name: trimmed })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "ไม่สามารถแก้ไขหมวดหมู่ได้");

      await fetchCategories();
      setEditingCatId(null);
    } catch (err) {
      notify.error(err.message);
    }
  };

  const handleOpenAddModal = () => {
    setEditingId(null);
    setIsAddingCategory(false);
    setNewCatName("");
    setNewCatId("");
    setForm({
      name: "",
      description: "",
      additional_info: "",
      price: 0,
      stock: 0,
      category: "drinks",
      image: "",
      images: [],
      promotion: false,
      pickupLocation: "",
      status: "In Stock",
      preorderReleaseDate: "",
      purchaseLimit: ""
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (p) => {
    setEditingId(p.id);
    setIsAddingCategory(false);
    setNewCatName("");
    setNewCatId("");
    const imgList = Array.isArray(p.images) && p.images.length > 0 ? p.images : (p.image ? [p.image] : []);
    setForm({
      name: p.name,
      description: p.description || "",
      additional_info: p.additional_info || p.additionalInfo || "",
      price: p.price,
      stock: p.stock || p.quantity || 0,
      category: p.category || "drinks",
      image: p.image || "",
      images: imgList.slice(0, 5),
      promotion: p.promotion || false,
      pickupLocation: p.pickupLocation || "",
      status: p.status || "In Stock",
      preorderReleaseDate: p.preorderReleaseDate || "",
      purchaseLimit: p.purchaseLimit || ""
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setIsAddingCategory(false);
    setNewCatName("");
    setNewCatId("");
    setEditingCatId(null);
    setEditingCatName("");
  };

  const handleMultipleFilesChange = async (e) => {
    const files = Array.from(e.target.files);
    if (!files || files.length === 0) return;

    const currentImages = Array.isArray(form.images) ? [...form.images] : [];
    const remainingSlots = 5 - currentImages.length;

    if (remainingSlots <= 0) {
      notify.warning("สามารถเพิ่มรูปภาพได้สูงสุด 5 รูปเท่านั้น");
      return;
    }

    const filesToUpload = files.slice(0, remainingSlots);
    const formData = new FormData();
    for (const f of filesToUpload) {
      const resized = await resizeImage(f, 600, 600);
      formData.append("images", resized);
    }

    try {
      const uploadRes = await fetch("/api/products/upload", {
        method: "POST",
        body: formData,
        credentials: "include"
      });
      const uploadData = await uploadRes.json();
      if (!uploadRes.ok) throw new Error(uploadData.error || "เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ");

      const newUploaded = uploadData.images || [uploadData.image];
      const updatedImages = [...currentImages, ...newUploaded].slice(0, 5);

      setForm(prev => ({
        ...prev,
        image: updatedImages[0] || "",
        images: updatedImages
      }));
    } catch (err) {
      notify.error(err.message);
    }
  };

  const handleRemoveImage = (indexToRemove) => {
    const updated = (form.images || []).filter((_, idx) => idx !== indexToRemove);
    setForm(prev => ({
      ...prev,
      image: updated[0] || "",
      images: updated
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const url = editingId ? `/api/products/${editingId}` : "/api/products";
    const method = editingId ? "PUT" : "POST";

    const currentImages = Array.isArray(form.images) ? form.images : (form.image ? [form.image] : []);
    if (currentImages.length === 0) {
      notify.warning("กรุณาเพิ่มรูปภาพสินค้าอย่างน้อย 1 รูป");
      return;
    }

    const payload = {
      ...form,
      image: currentImages[0],
      images: currentImages.slice(0, 5),
      price: parseFloat(form.price),
      stock: parseInt(form.stock, 10)
    };

    try {
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json"
        },
        credentials: "include",
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "เกิดข้อผิดพลาดในการบันทึกสินค้า");

      notify.success(editingId ? "แก้ไขสินค้าสำเร็จ!" : "เพิ่มสินค้าใหม่สำเร็จ!");
      setIsModalOpen(false);
      fetchProducts();
    } catch (err) {
      notify.error(err.message);
    }
  };

  const handleDelete = async (id) => {
    const confirmed = await confirmDialog({
      title: "ลบสินค้าชิ้นนี้?",
      message: "คุณต้องการลบสินค้าชิ้นนี้จริงหรือไม่? ข้อมูลและรูปภาพทั้งหมดจะถูกลบออกจากระบบ",
      confirmText: "ลบสินค้า",
      variant: "danger",
    });
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/products/${id}`, {
        method: "DELETE",
        credentials: "include"
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "เกิดข้อผิดพลาดในการลบสินค้า");

      notify.success("ลบสินค้าสำเร็จ!");
      fetchProducts();
    } catch (err) {
      notify.error(err.message);
    }
  };

  // คำนวณสถิติ
  const totalProducts = products.length;
  const outOfStock = products.filter(p => (p.stock || p.quantity) <= 0).length;
  const lowStock = products.filter(p => {
    const qty = p.stock || p.quantity;
    return qty > 0 && qty <= 5;
  }).length;

  // กรองรายการสินค้าตามคำค้นหา หมวดหมู่ และสถานะ
  const filteredProducts = products.filter((p) => {
    // 1. ค้นหาข้อความ
    if (productSearchQuery.trim()) {
      const q = productSearchQuery.trim().toLowerCase();
      const matchName = p.name && p.name.toLowerCase().includes(q);
      const matchDesc = p.description && p.description.toLowerCase().includes(q);
      const matchCat = (p.category || "").toLowerCase().includes(q);
      const matchPickup = (p.pickupLocation || p.pickup_location || "").toLowerCase().includes(q);
      const matchId = String(p.id).includes(q);
      if (!matchName && !matchDesc && !matchCat && !matchPickup && !matchId) {
        return false;
      }
    }

    // 2. กรองตามหมวดหมู่
    if (categoryFilter !== "all" && p.category !== categoryFilter) {
      return false;
    }

    // 3. กรองตามสถานะสต็อก / พรีออเดอร์ / โปรโมชั่น
    const stockVal = p.stock !== undefined ? p.stock : (p.quantity || 0);
    if (stockStatusFilter === "in_stock" && (p.status !== "In Stock" || stockVal <= 0)) return false;
    if (stockStatusFilter === "pre_order" && p.status !== "Pre-Order") return false;
    if (stockStatusFilter === "low_stock" && !(stockVal > 0 && stockVal <= 5)) return false;
    if (stockStatusFilter === "out_of_stock" && stockVal > 0) return false;
    if (stockStatusFilter === "promotion" && !p.promotion) return false;

    return true;
  });

  return (
    <div className="min-h-screen bg-gray-50 font-['Prompt'] flex flex-col">
      {/* Top Navbar */}
      <AdminNavbar
        title="ระบบจัดการสินค้าหน้าร้าน"
        subtitle="ผู้จัดเตรียมสต็อกและคลังสินค้า (Admin/Manager)"
        icon={Squares2X2Icon}
      />

      <main className="flex-1 p-6 max-w-7xl w-full mx-auto flex flex-col gap-6">

        {/* Dashboard Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-6">
          <div className="bg-white p-5 rounded-2xl border border-gray-150 shadow-sm flex flex-col gap-1">
            <span className="text-xs font-semibold text-gray-400 uppercase">สินค้าทั้งหมด</span>
            <span className="text-3xl font-black text-gray-700">{totalProducts} รายการ</span>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-gray-150 shadow-sm flex flex-col gap-1">
            <span className="text-xs font-semibold text-gray-400 uppercase">จำนวนผู้เข้าใช้งาน (ตู้ Kiosk)</span>
            <span className="text-3xl font-black text-indigo-650">{kioskStats.wakeups} ครั้ง</span>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-gray-150 shadow-sm flex flex-col gap-1">
            <span className="text-xs font-semibold text-gray-400 uppercase">ยอดการเข้าชมสินค้าสะสม</span>
            <span className="text-3xl font-black text-emerald-600">{kioskStats.totalViews} ครั้ง</span>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-gray-150 shadow-sm flex flex-col gap-1">
            <span className="text-xs font-semibold text-gray-400 uppercase">สินค้าหมดสต็อก</span>
            <span className="text-3xl font-black text-red-600">{outOfStock} รายการ</span>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-gray-150 shadow-sm flex flex-col gap-1">
            <span className="text-xs font-semibold text-gray-400 uppercase">สินค้าใกล้หมด</span>
            <span className="text-3xl font-black text-orange-500">{lowStock} รายการ</span>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-gray-200 gap-6 mt-2">
          <button
            onClick={() => setActiveTab("products")}
            className={`pb-3 font-bold text-sm border-b-2 px-1 transition-all ${activeTab === "products"
              ? "border-[#F8C032] text-[#2B2B2B]"
              : "border-transparent text-gray-400 hover:text-gray-600"
              }`}
          >
            จัดการคลังสินค้า
          </button>
          <button
            onClick={() => setActiveTab("users")}
            className={`pb-3 font-bold text-sm border-b-2 px-1 transition-all ${activeTab === "users"
              ? "border-[#F8C032] text-[#2B2B2B]"
              : "border-transparent text-gray-400 hover:text-gray-600"
              }`}
          >
            จัดการพนักงาน & สมาชิก
          </button>
          <button
            onClick={() => setActiveTab("settings")}
            className={`pb-3 font-bold text-sm border-b-2 px-1 transition-all ${activeTab === "settings"
              ? "border-[#F8C032] text-[#2B2B2B]"
              : "border-transparent text-gray-400 hover:text-gray-600"
              }`}
          >
            ตั้งค่าระบบ
          </button>
        </div>

        {activeTab === "products" && (
          <>
            {/* Action Header for Products */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-gray-800">คลังสินค้า Kiosk Shop</h2>
                <p className="text-xs text-gray-400">
                  {filteredProducts.length === products.length
                    ? `ทั้งหมด ${products.length} รายการ`
                    : `แสดง ${filteredProducts.length} จากทั้งหมด ${products.length} รายการ`}
                </p>
              </div>
              <button
                onClick={handleOpenAddModal}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-[#F8C032] hover:bg-[#F0B420] text-[#2B2B2B] font-bold rounded-xl active:scale-95 transition-all text-sm shadow-sm cursor-pointer"
              >
                <PlusIcon className="w-5 h-5" />
                เพิ่มสินค้าใหม่
              </button>
            </div>

            {/* Search & Filter Bar */}
            <div className="bg-white rounded-2xl border border-gray-150 p-4 shadow-sm flex flex-col gap-3">
              {/* Search Row */}
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <div className="relative flex-1 w-full">
                  <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={productSearchQuery}
                    onChange={(e) => setProductSearchQuery(e.target.value)}
                    placeholder="ค้นหาชื่อสินค้า, รหัสสินค้า, หมวดหมู่ หรือจุดรับของ..."
                    className="w-full h-11 bg-gray-50 border border-gray-150 hover:border-gray-250 focus:border-[#F8C032] focus:bg-white rounded-xl pl-11 pr-10 text-sm outline-none transition-all"
                  />
                  {productSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setProductSearchQuery("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 rounded-lg transition-colors cursor-pointer"
                      title="ล้างคำค้นหา"
                    >
                      <XMarkIcon className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Category Dropdown Filter */}
                <div className="w-full sm:w-auto shrink-0 flex items-center gap-2">
                  <CustomDropdown
                    value={categoryFilter}
                    onChange={(val) => setCategoryFilter(val)}
                    className="w-full sm:w-56"
                    options={[
                      { value: "all", label: "หมวดหมู่ทั้งหมด", count: products.length },
                      ...categories.map((c) => ({
                        value: c.id,
                        label: c.name,
                        count: products.filter((p) => p.category === c.id).length
                      }))
                    ]}
                  />

                  {/* Refresh Button */}
                  <button
                    type="button"
                    onClick={fetchProducts}
                    className="h-11 px-3.5 flex items-center gap-1.5 bg-gray-50 hover:bg-gray-100 border border-gray-150 rounded-xl text-sm font-semibold text-gray-600 transition-all cursor-pointer shrink-0"
                    title="รีเฟรชข้อมูลสินค้า"
                  >
                    <ArrowPathIcon className="w-4 h-4" />
                    <span className="hidden md:inline">รีเฟรช</span>
                  </button>
                </div>
              </div>

              {/* Quick Status Chips */}
              <div className="flex flex-wrap items-center gap-1.5 pt-2.5 border-t border-gray-100 text-xs">
                <span className="font-bold text-gray-400 uppercase tracking-wider mr-1 flex items-center gap-1">
                  <FunnelIcon className="w-3.5 h-3.5" />
                  กรองสถานะ:
                </span>
                {[
                  { key: "all", label: "ทั้งหมด", count: products.length },
                  { key: "in_stock", label: "พร้อมส่ง (In Stock)", count: products.filter(p => p.status === "In Stock" && (p.stock !== undefined ? p.stock : (p.quantity || 0)) > 0).length },
                  { key: "pre_order", label: "พรีออเดอร์ (Pre-Order)", count: products.filter(p => p.status === "Pre-Order").length },
                  { key: "low_stock", label: "⚠️ ใกล้หมด (≤5)", count: lowStock },
                  { key: "out_of_stock", label: "❌ หมดสต็อก (0)", count: outOfStock },
                  { key: "promotion", label: "🏷️ โปรโมชั่น", count: products.filter(p => p.promotion).length }
                ].map((chip) => {
                  const isSelected = stockStatusFilter === chip.key;
                  return (
                    <button
                      key={chip.key}
                      type="button"
                      onClick={() => setStockStatusFilter(chip.key)}
                      className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                        isSelected
                          ? "bg-[#F8C032] text-[#2B2B2B] shadow-2xs"
                          : "bg-gray-50 hover:bg-gray-100 text-gray-600 border border-gray-150"
                      }`}
                    >
                      <span>{chip.label}</span>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                        isSelected ? "bg-black/15 text-[#2B2B2B]" : "bg-gray-200 text-gray-600"
                      }`}>
                        {chip.count}
                      </span>
                    </button>
                  );
                })}

                {/* Reset Filters if any active */}
                {(productSearchQuery || categoryFilter !== "all" || stockStatusFilter !== "all") && (
                  <button
                    type="button"
                    onClick={() => {
                      setProductSearchQuery("");
                      setCategoryFilter("all");
                      setStockStatusFilter("all");
                    }}
                    className="text-xs text-red-600 hover:text-red-700 font-bold ml-auto flex items-center gap-1 hover:underline cursor-pointer py-1"
                  >
                    <XMarkIcon className="w-3.5 h-3.5" />
                    ล้างตัวกรองทั้งหมด
                  </button>
                )}
              </div>
            </div>

            {error && (
              <div className="p-4 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm font-semibold">
                {error}
              </div>
            )}

            {/* Table list */}
            {loading ? (
              <div className="text-center py-20 text-gray-400">กำลังโหลดสินค้า...</div>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-150 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100 text-xs font-bold text-gray-400 uppercase">
                        <th className="py-4 px-6">ชื่อสินค้า</th>
                        <th className="py-4 px-6">หมวดหมู่</th>
                        <th className="py-4 px-6">ราคา</th>
                        <th className="py-4 px-6">จำนวนสต็อก</th>
                        <th className="py-4 px-6">สถานะ</th>
                        <th className="py-4 px-6">ยอดการเข้าชม</th>
                        <th className="py-4 px-6 text-center">จัดการ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
                      {filteredProducts.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="text-center py-16 text-gray-400">
                            <div className="flex flex-col items-center justify-center gap-2">
                              <MagnifyingGlassIcon className="w-8 h-8 text-gray-300" />
                              <span className="text-sm font-semibold text-gray-600">ไม่พบสินค้าที่ตรงกับการค้นหา</span>
                              <span className="text-xs text-gray-400">ลองค้นหาด้วยคำอื่น หรือกดล้างตัวกรอง</span>
                              {(productSearchQuery || categoryFilter !== "all" || stockStatusFilter !== "all") && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setProductSearchQuery("");
                                    setCategoryFilter("all");
                                    setStockStatusFilter("all");
                                  }}
                                  className="mt-2 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-lg transition-all cursor-pointer"
                                >
                                  ล้างตัวกรองทั้งหมด
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ) : (
                        filteredProducts.map((p) => {
                          const stockVal = p.stock !== undefined ? p.stock : (p.quantity || 0);
                          return (
                            <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                            <td className="py-4 px-6 flex items-center gap-3">
                              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden border border-gray-250 shrink-0">
                                {p.image && p.image.includes(".") ? (
                                  <img 
                                    src={`/uploads/products/${p.image}`} 
                                    alt={p.name} 
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <span className="text-[10px] font-bold text-gray-400 uppercase">{(p.category || "PRD").slice(0, 3)}</span>
                                )}
                              </div>
                              <div className="flex flex-col">
                                <span className="font-semibold text-gray-800">{p.name}</span>
                                <div className="flex flex-wrap gap-1.5 mt-1 items-center">
                                  {p.promotion && (
                                    <span className="text-[10px] font-bold text-[#2B2B2B] bg-[#F8C032] py-0.5 px-2 rounded-full w-max flex items-center gap-0.5">
                                      <TagIcon className="w-3 h-3" /> PROMO
                                    </span>
                                  )}
                                  {(p.purchaseLimit || p.purchase_limit) && (
                                    <span className="text-[9px] font-bold text-red-700 bg-red-50 py-0.5 px-1.5 rounded-full border border-red-150">
                                      จำกัด {p.purchaseLimit || p.purchase_limit} ชิ้น
                                    </span>
                                  )}
                                  {p.status === "Pre-Order" && (p.preorderReleaseDate || p.preorder_release_date) && (
                                    <span className="text-[9px] font-bold text-[#E65100] bg-[#FFF3E0] py-0.5 px-1.5 rounded-full border border-[#FFE0B2]">
                                      ส่งมอบ {new Date(p.preorderReleaseDate || p.preorder_release_date).toLocaleDateString("th-TH")}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-6 capitalize">
                              {categories.find(c => c.id === p.category)?.name || p.category || "ทั่วไป"}
                            </td>
                            <td className="py-4 px-6 font-bold text-gray-800">฿{parseFloat(p.price).toFixed(0)}</td>
                            <td className="py-4 px-6">
                              <div className="flex items-center gap-1.5 font-bold">
                                <span className={stockVal <= 0 ? "text-red-600" : stockVal <= 5 ? "text-orange-500" : "text-gray-800"}>
                                  {stockVal} ชิ้น
                                </span>
                                {stockVal <= 5 && (
                                  <ExclamationTriangleIcon className="w-4 h-4 text-orange-500 shrink-0" />
                                )}
                              </div>
                            </td>
                            <td className="py-4 px-6">
                              {p.status === "Pre-Order" ? (
                                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-orange-50 text-orange-700 border border-orange-150 inline-flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span>
                                  Pre-Order
                                </span>
                              ) : stockVal <= 0 ? (
                                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-red-50 text-red-600 border border-red-150 inline-flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                                  หมดสต็อก (Out of Stock)
                                </span>
                              ) : (
                                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-green-50 text-green-700 border border-green-150 inline-flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                                  In Stock
                                </span>
                              )}
                            </td>
                            <td className="py-4 px-6 font-bold text-gray-700 font-mono">
                              {p.views || 0} ครั้ง
                            </td>
                            <td className="py-4 px-6">
                              <div className="flex items-center justify-center gap-3">
                                <button
                                  onClick={() => handleOpenEditModal(p)}
                                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-all"
                                >
                                  <PencilIcon className="w-4.5 h-4.5" />
                                </button>
                                <button
                                  onClick={() => handleDelete(p.id)}
                                  className="p-2 text-red-600 hover:bg-red-50 rounded-xl transition-all"
                                >
                                  <TrashIcon className="w-4.5 h-4.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      }))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}

        {activeTab === "users" && (
          <>
            {/* User Management Section */}
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-800">บัญชีพนักงานร้านค้า CAMT</h2>
              <button
                onClick={() => setIsUserModalOpen(true)}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-[#F8C032] hover:bg-[#F0B420] text-[#2B2B2B] font-bold rounded-xl active:scale-95 transition-all text-sm shadow-sm"
              >
                <PlusIcon className="w-5 h-5" />
                เพิ่มพนักงานใหม่
              </button>
            </div>

            {loadingUsers ? (
              <div className="text-center py-20 text-gray-400">กำลังโหลดบัญชีผู้ใช้งาน...</div>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-150 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100 text-xs font-bold text-gray-400 uppercase">
                        <th className="py-4 px-6">ชื่อ-นามสกุล</th>
                        <th className="py-4 px-6">ชื่อบัญชีผู้ใช้ (Username)</th>
                        <th className="py-4 px-6">ตำแหน่งสิทธิ์ (Role)</th>
                        <th className="py-4 px-6">วันที่สร้างบัญชี</th>
                        <th className="py-4 px-6 text-center">จัดการ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
                      {users.map((u) => (
                        <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="py-4 px-6 font-semibold text-gray-800">{u.name}</td>
                          <td className="py-4 px-6 font-mono text-xs">{u.username}</td>
                          <td className="py-4 px-6">
                            <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${u.role === "admin"
                              ? "bg-purple-50 text-purple-700 border border-purple-150"
                              : "bg-blue-50 text-blue-700 border border-blue-150"
                              }`}>
                              {u.role === "admin" ? "ผู้ดูแลระบบ (Admin)" : "พนักงาน (Staff)"}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-xs text-gray-400">
                            {new Date(u.createdAt).toLocaleDateString("th-TH")}
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex items-center justify-center">
                              {currentUser?.id !== u.id ? (
                                <button
                                  onClick={() => handleDeleteUser(u.id)}
                                  className="p-2 text-red-600 hover:bg-red-50 rounded-xl transition-all"
                                >
                                  <TrashIcon className="w-4.5 h-4.5" />
                                </button>
                              ) : (
                                <span className="text-xs text-gray-300 italic">บัญชีคุณในปัจจุบัน</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}

        {activeTab === "settings" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-7xl animate-in fade-in duration-200">
            {/* Shipping Settings Card */}
            <div className="bg-white p-8 rounded-3xl border border-gray-150 shadow-sm flex flex-col gap-6 font-['Prompt']">
              <div>
                <h3 className="text-lg font-black text-gray-800">ตั้งค่าการบริการจัดส่ง</h3>
                <p className="text-xs text-gray-400 mt-1">กำหนดอัตราค่าจัดส่งพัสดุสำหรับตู้สินค้า Kiosk</p>
              </div>
              
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">ค่าจัดส่งพัสดุเริ่มต้น (บาท)</label>
                <input
                  type="number"
                  value={baseShippingFeeInput}
                  onChange={(e) => setBaseShippingFeeInput(e.target.value)}
                  placeholder="40"
                  className="h-12 w-full px-4 rounded-xl border border-gray-200 focus:outline-none focus:border-[#5EBAA8] font-bold text-[#2B2B2B]"
                />
              </div>

              <div className="bg-gray-50 rounded-2xl p-4 border border-gray-150 flex flex-col gap-2">
                <span className="text-xs font-bold text-gray-500">พรีวิวอัตราค่าจัดส่ง:</span>
                <div className="flex justify-between items-center text-sm font-medium text-gray-600 border-b border-gray-100/50 pb-2">
                  <span>📦 จัดส่งรอบเดียว (Combined)</span>
                  <span className="font-bold text-[#2B2B2B]">฿{parseFloat(baseShippingFeeInput || 0).toLocaleString('th-TH')}</span>
                </div>
                <div className="flex justify-between items-center text-sm font-medium text-gray-600 pt-1">
                  <span>🚚 แยกจัดส่งสินค้าพรีออเดอร์ (Split)</span>
                  <div className="flex flex-col items-end">
                    <span className="font-bold text-[#E53935]">฿{(parseFloat(baseShippingFeeInput || 0) * 2).toLocaleString('th-TH')}</span>
                    <span className="text-[10px] text-red-500 font-bold">(ค่าส่งคูณ 2)</span>
                  </div>
                </div>
              </div>

              <button
                onClick={handleSaveShippingSettings}
                className="h-12 w-full rounded-xl bg-[#F8C032] hover:bg-[#F0B420] active:scale-95 transition-all text-[#2B2B2B] font-bold text-sm cursor-pointer flex items-center justify-center shadow-sm mt-auto"
              >
                บันทึกค่าจัดส่ง
              </button>
            </div>

            {/* Popular Search Tags Settings Card */}
            <div className="bg-white p-8 rounded-3xl border border-gray-150 shadow-sm flex flex-col gap-6 font-['Prompt']">
              <div>
                <h3 className="text-lg font-black text-gray-800">ตั้งค่าคำค้นหายอดนิยม (Popular Search Tags)</h3>
                <p className="text-xs text-gray-400 mt-1">กำหนดปุ่มทางลัดคำค้นหาด่วนที่จะแสดงผลบนตู้ Kiosk (คั่นด้วยเครื่องหมายจุลภาค ,)</p>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">คำค้นหา (คั่นด้วยเครื่องหมายจุลภาค ,)</label>
                <textarea
                  value={popularTagsInput}
                  onChange={(e) => setPopularTagsInput(e.target.value)}
                  rows={3}
                  placeholder="เช่น น้ำดื่ม, ชาเขียว, เลย์, KitKat, แก้วน้ำ, เสื้อ"
                  className="w-full p-4 rounded-xl border border-gray-200 focus:outline-none focus:border-[#5EBAA8] font-medium text-sm text-[#2B2B2B] resize-none"
                />
              </div>

              <div className="bg-gray-50 rounded-2xl p-4 border border-gray-150 flex flex-col gap-2">
                <span className="text-xs font-bold text-gray-500">พรีวิวปุ่มคำค้นหาบนตู้ Kiosk:</span>
                <div className="flex flex-wrap gap-2 pt-1">
                  {popularTagsInput.split(',').map(t => t.trim()).filter(Boolean).length > 0 ? (
                    popularTagsInput.split(',').map(t => t.trim()).filter(Boolean).map((tag, idx) => (
                      <span key={idx} className="text-xs px-3 py-1 bg-white text-gray-700 font-semibold rounded-full border border-gray-200 shadow-2xs">
                        {tag}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-gray-400 italic">ยังไม่มีคำค้นหา</span>
                  )}
                </div>
              </div>

              <button
                onClick={handleSavePopularTags}
                disabled={isSavingTags}
                className="h-12 w-full rounded-xl bg-[#5EBAA8] hover:bg-[#4ea896] active:scale-95 transition-all text-white font-bold text-sm cursor-pointer flex items-center justify-center shadow-sm disabled:opacity-50 mt-auto"
              >
                {isSavingTags ? "กำลังบันทึก..." : "บันทึกคำค้นหายอดนิยม"}
              </button>
            </div>

            {/* Staff Contact Settings Card */}
            <div className="bg-white p-8 rounded-3xl border border-gray-150 shadow-sm flex flex-col gap-6 font-['Prompt']">
              <div>
                <h3 className="text-lg font-black text-gray-800">ตั้งค่าข้อมูลติดต่อเจ้าหน้าที่ (Staff Contact)</h3>
                <p className="text-xs text-gray-400 mt-1">กำหนดเบอร์ Hotline, LINE ID, ลิงก์ และรูปภาพ LINE QR Code ที่แสดงในศูนย์ช่วยเหลือ</p>
              </div>

              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">เว็บไซต์ (Website)</label>
                  <input
                    type="text"
                    value={contactWebsiteInput}
                    onChange={(e) => setContactWebsiteInput(e.target.value)}
                    placeholder="เช่น www.camt.cmu.ac.th"
                    className="h-11 w-full px-4 rounded-xl border border-gray-200 focus:outline-none focus:border-[#5EBAA8] font-semibold text-sm text-[#2B2B2B]"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">ชื่อเพจ Facebook</label>
                  <input
                    type="text"
                    value={contactFacebookInput}
                    onChange={(e) => setContactFacebookInput(e.target.value)}
                    placeholder="เช่น CAMT Chiang Mai University"
                    className="h-11 w-full px-4 rounded-xl border border-gray-200 focus:outline-none focus:border-[#5EBAA8] font-semibold text-sm text-[#2B2B2B]"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">เบอร์โทรศัพท์ Hotline</label>
                  <input
                    type="text"
                    value={contactHotlineInput}
                    onChange={(e) => setContactHotlineInput(e.target.value)}
                    placeholder="เช่น 053-942606"
                    className="h-11 w-full px-4 rounded-xl border border-gray-200 focus:outline-none focus:border-[#5EBAA8] font-semibold text-sm text-[#2B2B2B]"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">เวลาทำการ</label>
                  <input
                    type="text"
                    value={contactServiceHoursInput}
                    onChange={(e) => setContactServiceHoursInput(e.target.value)}
                    placeholder="เช่น เปิดบริการ 08:00 - 20:00 น."
                    className="h-11 w-full px-4 rounded-xl border border-gray-200 focus:outline-none focus:border-[#5EBAA8] font-semibold text-sm text-[#2B2B2B]"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">LINE ID</label>
                  <input
                    type="text"
                    value={contactLineIdInput}
                    onChange={(e) => setContactLineIdInput(e.target.value)}
                    placeholder="เช่น @ditcsupport"
                    className="h-11 w-full px-4 rounded-xl border border-gray-200 focus:outline-none focus:border-[#5EBAA8] font-semibold text-sm text-[#2B2B2B]"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">ลิงก์ LINE Official (สร้าง QR Code อัตโนมัติ)</label>
                  <input
                    type="text"
                    value={contactLineUrlInput}
                    onChange={(e) => setContactLineUrlInput(e.target.value)}
                    placeholder="เช่น https://line.me/ti/p/@ditcsupport"
                    className="h-11 w-full px-4 rounded-xl border border-gray-200 focus:outline-none focus:border-[#5EBAA8] font-medium text-xs text-[#2B2B2B]"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">รูปภาพ LINE QR Code (อัปโหลดกำหนดเอง)</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleQrImageUpload}
                      disabled={isUploadingQr}
                      className="text-xs text-gray-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200 cursor-pointer"
                    />
                    {isUploadingQr && <span className="text-xs text-gray-400 font-bold">กำลังอัปโหลด...</span>}
                  </div>
                  {contactLineQrImageInput && (
                    <div className="flex items-center gap-2 mt-1.5 bg-gray-50 p-2 rounded-xl border border-gray-200">
                      <img src={contactLineQrImageInput} alt="LINE QR Preview" className="w-10 h-10 object-contain rounded-md bg-white border border-gray-200" />
                      <div className="flex-1 truncate">
                        <span className="text-[11px] text-emerald-600 font-bold block">มีรูป QR Code อัปโหลดแล้ว</span>
                        <span className="text-[10px] text-gray-400 block truncate">{contactLineQrImageInput}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setContactLineQrImageInput("")}
                        className="text-[11px] text-red-500 hover:underline font-bold px-2"
                      >
                        ลบรูป
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <button
                onClick={handleSaveContactSettings}
                disabled={isSavingContact}
                className="h-12 w-full rounded-xl bg-[#00C300] hover:bg-[#00B000] active:scale-95 transition-all text-white font-bold text-sm cursor-pointer flex items-center justify-center shadow-sm disabled:opacity-50 mt-auto"
              >
                {isSavingContact ? "กำลังบันทึก..." : "บันทึกข้อมูลการติดต่อ"}
              </button>
            </div>

            {/* TEMPORARY RESET TOOLS CARD */}
            <div className="bg-white p-8 rounded-3xl border border-red-200 bg-red-50/20 shadow-sm flex flex-col gap-6 font-['Prompt']">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 text-[10px] font-black bg-red-100 text-red-600 rounded-full uppercase tracking-wider border border-red-200">
                    เครื่องมือชั่วคราว
                  </span>
                </div>
                <h3 className="text-lg font-black text-gray-800 mt-2">รีเซ็ตสถิติระบบ (Reset Statistics)</h3>
                <p className="text-xs text-gray-400 mt-1">ปุ่มทางลัดสำหรับรีเซ็ตสถิติจำนวนผู้เข้าใช้งาน และยอดการเข้าชมสินค้า ให้เริ่มนับใหม่จาก 0</p>
              </div>

              <div className="flex flex-col gap-3.5 my-auto">
                <button
                  type="button"
                  onClick={handleResetVisitorCount}
                  className="h-12 w-full rounded-xl bg-red-500 hover:bg-red-600 active:scale-95 transition-all text-white font-bold text-sm cursor-pointer flex items-center justify-center gap-2 shadow-sm"
                >
                  <span>🔄 รีเซ็ตจำนวนผู้เข้าใช้งาน (Visitor Count)</span>
                </button>

                <button
                  type="button"
                  onClick={handleResetProductViews}
                  className="h-12 w-full rounded-xl bg-orange-500 hover:bg-orange-600 active:scale-95 transition-all text-white font-bold text-sm cursor-pointer flex items-center justify-center gap-2 shadow-sm"
                >
                  <span>👁️ รีเซ็ตยอดการเข้าชมสินค้า (Product Views)</span>
                </button>
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-800 font-medium">
                💡 <span className="font-bold">คำแนะนำ:</span> ปุ่มนี้เป็นเครื่องมือชั่วคราว สามารถลบโค้ดออกได้เมื่อไม่ใช้งานแล้ว
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Edit/Add Modal Overlay */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-6 backdrop-blur-xs">
          <div className="max-w-xl w-full max-h-[90vh] bg-white rounded-3xl border border-gray-150 shadow-[0_20px_50px_rgba(0,0,0,0.12)] p-8 flex flex-col gap-5 animate-in fade-in zoom-in-95 duration-200">
            <div>
              <h3 className="text-xl font-bold text-gray-800">
                {editingId ? "แก้ไขรายละเอียดสินค้า" : "เพิ่มสินค้าชิ้นใหม่ในคลัง"}
              </h3>
              <p className="text-xs text-gray-400">กรอกข้อมูลให้ครบถ้วนเพื่ออัปเดตลงระบบคีออส</p>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
              {/* Scrollable inputs container */}
              <div className="flex-1 overflow-y-auto pr-1.5 grid grid-cols-2 gap-4 max-h-[calc(90vh-220px)] custom-scrollbar">
                <div className="col-span-2 flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-500">ชื่อสินค้า (Name)</label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="กรอกชื่อภาษาไทย..."
                    className="w-full h-11 bg-gray-50 border border-gray-100 focus:border-[#F8C032] rounded-xl px-4 text-sm outline-none transition-all"
                  />
                </div>

                <div className="col-span-2 flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-500">รายละเอียดสินค้า (Description)</label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="กรอกรายละเอียดสั้นๆ..."
                    className="w-full h-20 py-2 bg-gray-50 border border-gray-100 focus:border-[#F8C032] rounded-xl px-4 text-sm outline-none transition-all resize-none"
                  />
                </div>

                <div className="col-span-2 flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-500 flex items-center justify-between">
                    <span>ข้อมูลเพิ่มเติม / หมายเหตุอื่น (Additional Info)</span>
                    <span className="text-[10px] text-gray-400 font-normal">(ไม่บังคับกรอก - Optional)</span>
                  </label>
                  <textarea
                    rows={3}
                    placeholder="เช่น ข้อมูลคุณสมบัติเพิ่มเติม, หมายเหตุการจัดส่ง, ข้อควรระวัง..."
                    value={form.additional_info || form.additionalInfo || ""}
                    onChange={(e) => setForm({ ...form, additional_info: e.target.value, additionalInfo: e.target.value })}
                    className="w-full py-2 bg-gray-50 border border-gray-100 focus:border-[#F8C032] focus:bg-white rounded-xl px-4 text-sm outline-none transition-all resize-none font-normal"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-500">ราคา (Price)</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    className="w-full h-11 bg-gray-50 border border-gray-100 focus:border-[#F8C032] rounded-xl px-4 text-sm outline-none transition-all"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-500">จำนวนสต็อก (Stock Count)</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={form.stock}
                    onChange={(e) => setForm({ ...form, stock: e.target.value })}
                    className="w-full h-11 bg-gray-50 border border-gray-100 focus:border-[#F8C032] rounded-xl px-4 text-sm outline-none transition-all"
                  />
                </div>

                {isAddingCategory ? (
                  <div className="col-span-2 bg-[#F8C032]/5 border border-[#F8C032]/35 p-4.5 rounded-2xl flex flex-col gap-3.5 animate-in slide-in-from-top-2 duration-200">
                    <div className="flex items-center justify-between border-b border-[#F8C032]/20 pb-2">
                      <div className="flex items-center gap-1.5">
                        <TagIcon className="w-4 h-4 text-[#F8C032]" />
                        <span className="text-xs font-bold text-gray-800">สร้างหมวดหมู่ใหม่</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setIsAddingCategory(false);
                          setNewCatName("");
                          setNewCatId("");
                        }}
                        className="text-xs text-red-500 hover:text-red-700 font-bold hover:underline cursor-pointer select-none"
                      >
                        ยกเลิก
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[11px] font-semibold text-gray-500">ชื่อหมวดหมู่ (ภาษาไทย)</label>
                        <input
                          type="text"
                          value={newCatName}
                          onChange={(e) => setNewCatName(e.target.value)}
                          placeholder="เช่น: ของเล่น"
                          className="h-10 bg-white border border-gray-200 focus:border-[#F8C032] rounded-xl px-3 text-xs outline-none transition-all"
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[11px] font-semibold text-gray-500">คีย์ภาษาอังกฤษ (อังกฤษพิมพ์เล็ก)</label>
                        <input
                          type="text"
                          value={newCatId}
                          onChange={(e) => setNewCatId(e.target.value)}
                          placeholder="เช่น: toys"
                          className="h-10 bg-white border border-gray-200 focus:border-[#F8C032] rounded-xl px-3 text-xs outline-none transition-all font-mono"
                        />
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleSaveNewCategoryInline}
                      className="w-full h-9.5 bg-[#F8C032] hover:bg-[#F0B420] text-[#2B2B2B] text-xs font-bold rounded-xl transition-all cursor-pointer shadow-xs active:scale-[0.98]"
                    >
                      บันทึกหมวดหมู่ใหม่
                    </button>
                  </div>
                ) : (
                  <div className="col-span-2 flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-gray-500">หมวดหมู่ (Category)</label>
                    <div className="flex gap-2 relative">
                      <div className="flex-1 relative">
                        <button
                          type="button"
                          onClick={() => setIsCatDropdownOpen(!isCatDropdownOpen)}
                          className="w-full h-11 bg-gray-50 border border-gray-100 focus:border-[#F8C032] rounded-xl px-4 text-sm text-left flex items-center justify-between transition-all cursor-pointer"
                        >
                          <span className="font-semibold text-gray-800">
                            {categories.find(c => c.id === form.category)?.name || "เลือกหมวดหมู่"}
                          </span>
                          <ChevronDownIcon className="w-4 h-4 text-gray-400" />
                        </button>

                        {isCatDropdownOpen && (
                          <div 
                            className="fixed inset-0 z-10" 
                            onClick={() => setIsCatDropdownOpen(false)}
                          />
                        )}

                        {isCatDropdownOpen && (
                          <div className="absolute top-12 left-0 right-0 z-25 bg-white border border-gray-150 rounded-2xl shadow-xl max-h-48 overflow-y-auto p-1.5 flex flex-col gap-0.5 animate-in fade-in slide-in-from-top-1 duration-150">
                            {categories.map((c) => {
                              const isUsed = products.some(p => p.category === c.id);
                              const isEditing = editingCatId === c.id;
                              return (
                                <div
                                  key={c.id}
                                  onClick={() => {
                                    if (!isEditing) {
                                      setForm(prev => ({ ...prev, category: c.id }));
                                      setIsCatDropdownOpen(false);
                                    }
                                  }}
                                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm transition-colors cursor-pointer ${
                                    form.category === c.id 
                                      ? "bg-[#F8C032]/10 text-gray-800 font-bold" 
                                      : "hover:bg-gray-50 text-gray-700"
                                  }`}
                                >
                                  {isEditing ? (
                                    <div 
                                      className="flex items-center gap-1.5 w-full"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <input
                                        type="text"
                                        value={editingCatName}
                                        onChange={(e) => setEditingCatName(e.target.value)}
                                        onKeyDown={(e) => {
                                          if (e.key === "Enter") {
                                            handleSaveCategoryNameInline(c.id);
                                          } else if (e.key === "Escape") {
                                            setEditingCatId(null);
                                          }
                                        }}
                                        autoFocus
                                        className="flex-1 h-8 px-2 bg-white border border-[#F8C032] rounded-lg text-xs font-normal outline-none focus:ring-1 focus:ring-[#F8C032]"
                                      />
                                      <button
                                        type="button"
                                        onClick={() => handleSaveCategoryNameInline(c.id)}
                                        className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold hover:bg-emerald-100 cursor-pointer"
                                      >
                                        ✓
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => setEditingCatId(null)}
                                        className="w-6 h-6 rounded-lg bg-gray-100 text-gray-500 flex items-center justify-center font-bold hover:bg-gray-200 cursor-pointer"
                                      >
                                        ✕
                                      </button>
                                    </div>
                                  ) : (
                                    <>
                                      <span>{c.name}</span>
                                      <div className="flex items-center gap-1 shrink-0">
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setEditingCatId(c.id);
                                            setEditingCatName(c.name);
                                          }}
                                          title="แก้ไขชื่อหมวดหมู่"
                                          className="w-5 h-5 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-700 cursor-pointer"
                                        >
                                          <PencilIcon className="w-3.5 h-3.5" />
                                        </button>
                                        {categories.length > 1 && (
                                          <button
                                            type="button"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleDeleteCategoryById(c.id);
                                            }}
                                            title={isUsed ? "หมวดหมู่นี้กำลังมีสินค้าใช้อยู่" : "ลบหมวดหมู่"}
                                            className={`w-5 h-5 rounded-lg flex items-center justify-center text-xs transition-colors font-bold ${
                                              isUsed 
                                                ? "text-gray-300 cursor-not-allowed" 
                                                : "text-red-500 hover:bg-red-50 hover:text-red-700 cursor-pointer"
                                            }`}
                                          >
                                            ✕
                                          </button>
                                        )}
                                      </div>
                                    </>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setIsAddingCategory(true);
                          setIsCatDropdownOpen(false);
                        }}
                        className="px-4 h-11 bg-[#F8C032]/10 hover:bg-[#F8C032]/20 text-[#F8C032] hover:text-[#F0B420] font-bold text-xs rounded-xl transition-all flex items-center gap-1 border border-[#F8C032]/25 cursor-pointer active:scale-95 shrink-0"
                      >
                        <PlusIcon className="w-4 h-4 text-[#F8C032]" />
                        <span>เพิ่มหมวดหมู่</span>
                      </button>
                    </div>
                  </div>
                )}

                <div className="col-span-2 flex flex-col gap-2.5 bg-gray-50 p-4.5 rounded-2xl border border-gray-150">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-700">รูปภาพสินค้า (อัปโหลดได้สูงสุด 5 รูป)</span>
                    <span className="text-[11px] font-bold text-gray-400">
                      {(form.images || []).length} / 5 รูป
                    </span>
                  </div>

                  {/* Thumbnail gallery list */}
                  <div className="flex flex-wrap gap-3 my-1">
                    {(form.images || []).map((imgFilename, idx) => (
                      <div key={idx} className="relative w-20 h-20 bg-white border border-gray-250 rounded-xl overflow-hidden shadow-sm group">
                        <img 
                          src={imgFilename.startsWith("/") || imgFilename.startsWith("http") ? imgFilename : `/uploads/products/${imgFilename}`} 
                          alt={`Product preview ${idx + 1}`} 
                          className="w-full h-full object-cover" 
                        />
                        {idx === 0 && (
                          <span className="absolute bottom-1 left-1 right-1 bg-amber-500/90 text-white text-[9px] font-bold py-0.5 text-center rounded">
                            รูปหลัก
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(idx)}
                          className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-bold shadow hover:bg-red-600 transition-colors"
                          title="ลบรูปนี้"
                        >
                          ✕
                        </button>
                      </div>
                    ))}

                    {(form.images || []).length < 5 && (
                      <label className="w-20 h-20 border-2 border-dashed border-amber-300 hover:border-amber-500 bg-amber-50/50 hover:bg-amber-50 rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all gap-1">
                        <PlusIcon className="w-6 h-6 text-amber-500" />
                        <span className="text-[10px] font-bold text-amber-700">เพิ่มรูป</span>
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handleMultipleFilesChange}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                  <p className="text-[10px] text-gray-400 font-medium">
                    * รูปแรกในอัลบั้มจะถูกใช้เป็นรูปภาพหลักบนหน้าจอ Kiosk
                  </p>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-500">จุดรับสินค้า (Pickup Location)</label>
                  <input
                    type="text"
                    value={form.pickupLocation}
                    onChange={(e) => setForm({ ...form, pickupLocation: e.target.value })}
                    placeholder="เช่น ตู้จำหน่ายสินค้า A ชั้น 1"
                    className="w-full h-11 bg-gray-50 border border-gray-100 focus:border-[#F8C032] rounded-xl px-4 text-sm outline-none transition-all"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-500">รูปแบบสินค้า / สถานะ (Product Type)</label>
                  <CustomDropdown
                    value={form.status}
                    onChange={(val) => setForm(prev => ({ ...prev, status: val }))}
                    options={[
                      { value: "In Stock", label: "สินค้าพร้อมส่งปกติ (In Stock)", icon: "🟢" },
                      { value: "Pre-Order", label: "สินค้าสั่งจองล่วงหน้า (Pre-Order)", icon: "📦" }
                    ]}
                  />
                  <span className="text-[10px] text-gray-400">
                    * สินค้า In Stock ที่สต็อกเป็น 0 ชิ้น ระบบจะแสดงสถานะเป็น "หมดสต็อก (Out of Stock)" ให้อัตโนมัติ
                  </span>
                </div>

                {form.status === "Pre-Order" && (
                  <div className="flex flex-col gap-1.5 animate-in fade-in duration-200">
                    <label className="text-xs font-semibold text-[#A24B2C]">วันที่ปล่อยสินค้าพรีออเดอร์ (Release Date)</label>
                    <input
                      type="date"
                      required
                      value={form.preorderReleaseDate ? form.preorderReleaseDate.substring(0, 10) : ""}
                      onChange={(e) => setForm({ ...form, preorderReleaseDate: e.target.value })}
                      className="w-full h-11 bg-[#F8C032]/5 border border-[#F8C032]/20 focus:border-[#F8C032] rounded-xl px-4 text-sm outline-none transition-all font-medium text-gray-800"
                    />
                  </div>
                )}

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-500">จำกัดสิทธิ์การซื้อต่อคน (Purchase Limit)</label>
                  <input
                    type="number"
                    min="1"
                    placeholder="ว่างหากไม่จำกัด"
                    value={form.purchaseLimit || ""}
                    onChange={(e) => setForm({ ...form, purchaseLimit: e.target.value ? parseInt(e.target.value, 10) : "" })}
                    className="w-full h-11 bg-gray-50 border border-gray-100 focus:border-[#F8C032] rounded-xl px-4 text-sm outline-none transition-all"
                  />
                </div>

                <div className="col-span-2 flex items-center gap-2 py-2">
                  <input
                    type="checkbox"
                    id="promotion"
                    checked={form.promotion}
                    onChange={(e) => setForm({ ...form, promotion: e.target.checked })}
                    className="w-4 h-4 text-[#F8C032] focus:ring-[#F8C032]"
                  />
                  <label htmlFor="promotion" className="text-xs font-semibold text-gray-600 cursor-pointer">
                    เป็นสินค้าโปรโมชั่น (Promotion Product)
                  </label>
                </div>
              </div>

              {/* Fixed footer outside scrollable content */}
              <div className="flex items-center justify-end gap-3 mt-4 border-t border-gray-100 pt-5">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-5 h-11 rounded-xl bg-gray-100 hover:bg-gray-200 text-[#2B2B2B] font-semibold transition-all text-sm cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-6 h-11 rounded-xl bg-[#F8C032] hover:bg-[#F0B420] text-[#2B2B2B] font-bold transition-all text-sm shadow-sm cursor-pointer"
                >
                  บันทึกข้อมูล
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add User Modal Overlay */}
      {isUserModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-6 backdrop-blur-xs">
          <div className="max-w-md w-full bg-white rounded-3xl border border-gray-150 shadow-[0_20px_50px_rgba(0,0,0,0.12)] p-8 flex flex-col gap-6 animate-in fade-in zoom-in-95 duration-200">
            <div>
              <h3 className="text-xl font-bold text-gray-800">
                เพิ่มบัญชีพนักงานใหม่
              </h3>
              <p className="text-xs text-gray-400">สร้างบัญชีสำหรับพนักงาน (Staff) หรือผู้จัดการ (Admin)</p>
            </div>

            <form onSubmit={handleCreateUser} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-500">ชื่อ-นามสกุลพนักงาน (Display Name)</label>
                <input
                  type="text"
                  required
                  value={userForm.name}
                  onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                  placeholder="เช่น สมชาย ใจดี"
                  className="w-full h-11 bg-gray-50 border border-gray-100 focus:border-[#F8C032] rounded-xl px-4 text-sm outline-none transition-all"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-500">ชื่อบัญชีผู้ใช้ (Username)</label>
                <input
                  type="text"
                  required
                  value={userForm.username}
                  onChange={(e) => setUserForm({ ...userForm, username: e.target.value })}
                  placeholder="เช่น staff3"
                  className="w-full h-11 bg-gray-50 border border-gray-100 focus:border-[#F8C032] rounded-xl px-4 text-sm outline-none transition-all font-mono"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-500">รหัสผ่านสำหรับล็อกอิน (Password)</label>
                <input
                  type="password"
                  required
                  min={4}
                  value={userForm.password}
                  onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                  placeholder="กำหนดรหัสผ่าน..."
                  className="w-full h-11 bg-gray-50 border border-gray-100 focus:border-[#F8C032] rounded-xl px-4 text-sm outline-none transition-all"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-500">สิทธิ์ของบัญชีนี้ (Account Role)</label>
                <CustomDropdown
                  value={userForm.role}
                  onChange={(val) => setUserForm(prev => ({ ...prev, role: val }))}
                  options={[
                    { value: "staff", label: "พนักงาน (Staff / Runner)", icon: "👤" },
                    { value: "admin", label: "ผู้ดูแลระบบ (Admin / Manager)", icon: "👑" }
                  ]}
                />
              </div>

              <div className="flex items-center justify-end gap-3 mt-4 border-t border-gray-100 pt-5">
                <button
                  type="button"
                  onClick={() => setIsUserModalOpen(false)}
                  className="px-5 h-11 rounded-xl bg-gray-100 hover:bg-gray-200 text-[#2B2B2B] font-semibold transition-all text-sm"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-6 h-11 rounded-xl bg-[#F8C032] hover:bg-[#F0B420] text-[#2B2B2B] font-bold transition-all text-sm shadow-sm"
                >
                  เพิ่มพนักงาน
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
