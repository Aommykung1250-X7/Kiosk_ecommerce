// frontend/src/pages/admin/ProductManagement.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { PlusIcon, PencilIcon, TrashIcon, ArrowRightOnRectangleIcon, ClipboardDocumentListIcon, Squares2X2Icon, TagIcon, ExclamationTriangleIcon, ChevronDownIcon, PhotoIcon } from "@heroicons/react/24/outline";

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

  // State เธชเธณเธซเธฃเธฑเธเธเธงเธเธเธธเธก Modal เธเธญเธฃเนเธก
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null); // NULL = เธชเธฃเนเธฒเธเนเธซเธกเน, เธกเธตเธเนเธฒ = เนเธเนเนเธเธ•เธฒเธก ID เธเธฑเนเธ
  const [form, setForm] = useState({
    name: "",
    description: "",
    price: 0,
    stock: 0,
    category: "drinks",
    image: "water",
    promotion: false,
    pickupLocation: "",
    status: "In Stock"
  });

  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [isCatDropdownOpen, setIsCatDropdownOpen] = useState(false);
  const [editingCatId, setEditingCatId] = useState(null);
  const [editingCatName, setEditingCatName] = useState("");

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const resized = await resizeImage(file, 600, 600);
      setSelectedFile(resized);
      setPreviewUrl(URL.createObjectURL(resized));
    } catch (err) {
      console.error(err);
      alert("เนเธกเนเธชเธฒเธกเธฒเธฃเธ–เธเธฃเธฑเธเธเธเธฒเธ”เธฃเธนเธเธ เธฒเธเนเธ”เน: " + err.message);
    }
  };

  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [newCatId, setNewCatId] = useState("");

  const navigate = useNavigate();

  // เนเธ—เนเธเธ—เธณเธเธฒเธ: products = เธเธฑเธ”เธเธฒเธฃเธชเธดเธเธเนเธฒ, users = เธเธฑเธ”เธเธฒเธฃเธเธเธฑเธเธเธฒเธ
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

  const [shippingSettings, setShippingSettings] = useState({ baseShippingFee: 40, additionalSplitShippingFee: 30 });
  const [baseShippingFeeInput, setBaseShippingFeeInput] = useState("40");

  const fetchShippingSettings = async () => {
    try {
      const res = await fetch("/api/settings/shipping");
      const data = await res.json();
      if (res.ok) {
        setShippingSettings(data);
        setBaseShippingFeeInput(data.baseShippingFee.toString());
      }
    } catch (err) {
      console.error("Error loading shipping settings:", err);
    }
  };

  const handleSaveShippingSettings = async () => {
    const feeVal = parseFloat(baseShippingFeeInput);
    if (isNaN(feeVal) || feeVal < 0) {
      return alert("เธเธฃเธธเธ“เธฒเธฃเธฐเธเธธเธเนเธฒเธเธฑเธ”เธชเนเธเธ—เธตเนเธ–เธนเธเธ•เนเธญเธ");
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
      if (!res.ok) throw new Error(data.error || "เน€เธเธดเธ”เธเนเธญเธเธดเธ”เธเธฅเธฒเธ”เนเธเธเธฒเธฃเธเธฑเธเธ—เธถเธเธเนเธฒเธเธฑเธ”เธชเนเธ");

      alert("เธเธฑเธเธ—เธถเธเธเนเธฒเธเธฑเธ”เธชเนเธเธฃเธฐเธเธเธชเธณเน€เธฃเนเธ!");
      fetchShippingSettings();
    } catch (err) {
      alert(err.message);
    }
  };

  useEffect(() => {
    const userString = localStorage.getItem("user");
    if (userString) {
      setCurrentUser(JSON.parse(userString));
    }
    fetchProducts();
    fetchCategories();
    fetchStats();
    fetchShippingSettings();
  }, []);

  // เธ”เธถเธเธเนเธญเธกเธนเธฅเน€เธกเธทเนเธญเนเธ—เนเธเธชเธกเธฒเธเธดเธเน€เธเธดเธ”เธ—เธณเธเธฒเธ
  useEffect(() => {
    if (activeTab === "users") {
      fetchUsers();
    }
  }, [activeTab]);

  const fetchProducts = async () => {
    try {
      const res = await fetch("/api/products");
      const data = await res.json();
      if (!res.ok) throw new Error("เนเธกเนเธชเธฒเธกเธฒเธฃเธ–เน€เธฃเธตเธขเธเธฃเธฒเธขเธเธฒเธฃเธชเธดเธเธเนเธฒเนเธ”เน");
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
      if (!res.ok) throw new Error(data.error || "เนเธกเนเธชเธฒเธกเธฒเธฃเธ–เธ”เธถเธเธเนเธญเธกเธนเธฅเธฃเธฒเธขเธเธทเนเธญเธเธเธฑเธเธเธฒเธเนเธ”เน");
      setUsers(data);
    } catch (err) {
      alert(err.message);
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
      if (!res.ok) throw new Error(data.error || "เน€เธเธดเธ”เธเนเธญเธเธดเธ”เธเธฅเธฒเธ”เนเธเธเธฒเธฃเธเธฑเธเธ—เธถเธเธฃเธฒเธขเธเธทเนเธญเธเธเธฑเธเธเธฒเธ");

      alert("เน€เธเธดเนเธกเธเธเธฑเธเธเธฒเธเธชเธณเน€เธฃเนเธ!");
      setIsUserModalOpen(false);
      setUserForm({ username: "", password: "", role: "staff", name: "" });
      fetchUsers();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm("เธเธธเธ“เธ•เนเธญเธเธเธฒเธฃเธฅเธเธเธฑเธเธเธตเธเธนเนเนเธเนเธเธฒเธเธเธตเนเธเธฃเธดเธเธซเธฃเธทเธญเนเธกเน?")) {
      return;
    }
    try {
      const res = await fetch(`/api/auth/users/${id}`, {
        method: "DELETE",
        credentials: "include"
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "เน€เธเธดเธ”เธเนเธญเธเธดเธ”เธเธฅเธฒเธ”เนเธเธเธฒเธฃเธฅเธเธเธเธฑเธเธเธฒเธ");

      alert("เธฅเธเธเธเธฑเธเธเธฒเธเธชเธณเน€เธฃเนเธ!");
      fetchUsers();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleSaveNewCategoryInline = async () => {
    if (!newCatName.trim() || !newCatId.trim()) {
      return alert("เธเธฃเธธเธ“เธฒเธเธฃเธญเธเธเนเธญเธกเธนเธฅเนเธซเนเธเธฃเธเธ–เนเธงเธเธ—เธฑเนเธเธเธทเนเธญเนเธ—เธขเนเธฅเธฐเธเธตเธขเนเธ เธฒเธฉเธฒเธญเธฑเธเธเธคเธฉ");
    }
    
    const formattedId = newCatId.trim().toLowerCase();
    if (categories.some(c => c.id === formattedId)) {
      return alert("เธกเธตเธเธตเธขเนเธซเธกเธงเธ”เธซเธกเธนเนเธเธตเนเธญเธขเธนเนเนเธฅเนเธงเนเธเธฃเธฐเธเธ");
    }

    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ id: formattedId, name: newCatName.trim() })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "เน€เธเธดเธ”เธเนเธญเธเธดเธ”เธเธฅเธฒเธ”เนเธเธเธฒเธฃเธเธฑเธเธ—เธถเธเธซเธกเธงเธ”เธซเธกเธนเน");

      await fetchCategories();
      setForm(prev => ({ ...prev, category: formattedId }));
      setIsAddingCategory(false);
      setNewCatName("");
      setNewCatId("");
      alert(`เน€เธเธดเนเธกเธซเธกเธงเธ”เธซเธกเธนเน "${data.name}" เธชเธณเน€เธฃเนเธ!`);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteCategoryById = async (catId) => {
    const categoryName = categories.find(c => c.id === catId)?.name || catId;

    const isUsed = products.some(p => p.category === catId);
    if (isUsed) {
      alert(`เนเธกเนเธชเธฒเธกเธฒเธฃเธ–เธฅเธเธซเธกเธงเธ”เธซเธกเธนเน "${categoryName}" เนเธ”เน เน€เธเธทเนเธญเธเธเธฒเธเธกเธตเธชเธดเธเธเนเธฒเธ—เธตเนเนเธเนเธซเธกเธงเธ”เธซเธกเธนเนเธเธตเนเธญเธขเธนเน`);
      return;
    }

    if (!window.confirm(`เธเธธเธ“เธ•เนเธญเธเธเธฒเธฃเธฅเธเธซเธกเธงเธ”เธซเธกเธนเน "${categoryName}" เนเธเนเธซเธฃเธทเธญเนเธกเน?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/categories/${catId}`, {
        method: "DELETE",
        credentials: "include"
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "เนเธกเนเธชเธฒเธกเธฒเธฃเธ–เธฅเธเธซเธกเธงเธ”เธซเธกเธนเนเนเธ”เน");

      await fetchCategories();
      if (form.category === catId) {
        setForm(prev => ({ ...prev, category: "" }));
      }
      alert(`เธฅเธเธซเธกเธงเธ”เธซเธกเธนเน "${categoryName}" เน€เธฃเธตเธขเธเธฃเนเธญเธขเนเธฅเนเธง`);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleSaveCategoryNameInline = async (catId) => {
    const trimmed = editingCatName.trim();
    if (!trimmed) {
      alert("เธเธทเนเธญเธซเธกเธงเธ”เธซเธกเธนเนเนเธกเนเธชเธฒเธกเธฒเธฃเธ–เน€เธเนเธเธเนเธฒเธงเนเธฒเธเนเธ”เน");
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
      if (!res.ok) throw new Error(data.error || "เนเธกเนเธชเธฒเธกเธฒเธฃเธ–เนเธเนเนเธเธซเธกเธงเธ”เธซเธกเธนเนเนเธ”เน");

      await fetchCategories();
      setEditingCatId(null);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleOpenAddModal = () => {
    setEditingId(null);
    setIsAddingCategory(false);
    setNewCatName("");
    setNewCatId("");
    setSelectedFile(null);
    setPreviewUrl("");
    setForm({
      name: "",
      description: "",
      price: 0,
      stock: 0,
      category: "drinks",
      image: "",
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
    setSelectedFile(null);
    setPreviewUrl(p.image && p.image.includes(".") ? `/uploads/products/${p.image}` : "");
    setForm({
      name: p.name,
      description: p.description || "",
      price: p.price,
      stock: p.stock || p.quantity || 0, // เธฃเธญเธเธฃเธฑเธเธเธฃเธ“เธตเธเธดเธฅเธ”เนเธ—เธฑเธเธเนเธญเธ
      category: p.category || "drinks",
      image: p.image || "",
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
    setSelectedFile(null);
    setPreviewUrl("");
    setEditingCatId(null);
    setEditingCatName("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const url = editingId ? `/api/products/${editingId}` : "/api/products";
    const method = editingId ? "PUT" : "POST";

    let finalImage = form.image;

    if (selectedFile) {
      const formData = new FormData();
      formData.append("image", selectedFile);

      try {
        const uploadRes = await fetch("/api/products/upload", {
          method: "POST",
          body: formData,
          credentials: "include"
        });
        const uploadData = await uploadRes.json();
        if (!uploadRes.ok) throw new Error(uploadData.error || "เน€เธเธดเธ”เธเนเธญเธเธดเธ”เธเธฅเธฒเธ”เนเธเธเธฒเธฃเธญเธฑเธเนเธซเธฅเธ”เธฃเธนเธเธ เธฒเธ");
        finalImage = uploadData.image;
      } catch (err) {
        alert(err.message);
        return;
      }
    }

    // เธเธฃเธฑเธเธเธเธดเธ”เธ•เธฑเธงเน€เธฅเธ
    const payload = {
      ...form,
      image: finalImage,
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
      if (!res.ok) throw new Error(data.error || "เน€เธเธดเธ”เธเนเธญเธเธดเธ”เธเธฅเธฒเธ”เนเธเธเธฒเธฃเธเธฑเธเธ—เธถเธเธชเธดเธเธเนเธฒ");

      alert(editingId ? "เนเธเนเนเธเธชเธดเธเธเนเธฒเธชเธณเน€เธฃเนเธ!" : "เน€เธเธดเนเธกเธชเธดเธเธเนเธฒเนเธซเธกเนเธชเธณเน€เธฃเนเธ!");
      setIsModalOpen(false);
      fetchProducts();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("เธเธธเธ“เธ•เนเธญเธเธเธฒเธฃเธฅเธเธชเธดเธเธเนเธฒเธเธดเนเธเธเธตเนเธเธฃเธดเธเธซเธฃเธทเธญเนเธกเน? เธเธฒเธฃเธเธฃเธฐเธ—เธณเธเธตเนเนเธกเนเธชเธฒเธกเธฒเธฃเธ–เธขเนเธญเธเธเธฅเธฑเธเนเธ”เน")) {
      return;
    }

    try {
      const res = await fetch(`/api/products/${id}`, {
        method: "DELETE",
        credentials: "include"
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "เน€เธเธดเธ”เธเนเธญเธเธดเธ”เธเธฅเธฒเธ”เนเธเธเธฒเธฃเธฅเธเธชเธดเธเธเนเธฒ");

      alert("เธฅเธเธชเธดเธเธเนเธฒเธชเธณเน€เธฃเนเธ!");
      fetchProducts();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/ditc-portal-to-manager");
  };

  // เธเธณเธเธงเธ“เธชเธ–เธดเธ•เธด
  const totalProducts = products.length;
  const outOfStock = products.filter(p => (p.stock || p.quantity) <= 0).length;
  const lowStock = products.filter(p => {
    const qty = p.stock || p.quantity;
    return qty > 0 && qty <= 5;
  }).length;

  return (
    <div className="min-h-screen bg-gray-50 font-['Prompt'] flex flex-col">
      {/* Top Navbar */}
      <nav className="bg-white border-b border-gray-150 px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#F8C032]/10 rounded-xl flex items-center justify-center text-[#F8C032]">
            <Squares2X2Icon className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-[#2B2B2B]">เธฃเธฐเธเธเธเธฑเธ”เธเธฒเธฃเธชเธดเธเธเนเธฒเธซเธเนเธฒเธฃเนเธฒเธ</h1>
            <p className="text-xs text-gray-400">เธเธนเนเธเธฑเธ”เน€เธ•เธฃเธตเธขเธกเธชเธ•เนเธญเธเนเธฅเธฐเธเธฅเธฑเธเธชเธดเธเธเนเธฒ (Admin/Manager)</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/dashboard/screensavers")}
            className="flex items-center gap-1.5 px-3.5 py-2 text-sm text-gray-600 hover:text-[#2B2B2B] font-semibold bg-gray-100 hover:bg-gray-200 rounded-xl transition-all cursor-pointer"
          >
            <PhotoIcon className="w-4.5 h-4.5" />
            <span>เธเธฑเธ”เธเธฒเธฃเนเธเธฉเธ“เธฒ</span>
          </button>

          <button
            onClick={() => navigate("/dashboard/orders")}
            className="flex items-center gap-1.5 px-3.5 py-2 text-sm text-gray-600 hover:text-[#2B2B2B] font-semibold bg-gray-100 hover:bg-gray-200 rounded-xl transition-all cursor-pointer"
          >
            <ClipboardDocumentListIcon className="w-4.5 h-4.5" />
            <span>เนเธเธซเธเนเธฒเธเธฑเธ”เธเธฒเธฃเธเธดเธง</span>
          </button>

          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3.5 py-2 text-sm text-red-600 font-semibold bg-red-50 hover:bg-red-100 border border-red-100 rounded-xl transition-all"
          >
            <ArrowRightOnRectangleIcon className="w-4.5 h-4.5" />
            <span>เธญเธญเธเธเธฒเธเธฃเธฐเธเธ</span>
          </button>
        </div>
      </nav>

      <main className="flex-1 p-6 max-w-7xl w-full mx-auto flex flex-col gap-6">

        {/* Dashboard Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-6">
          <div className="bg-white p-5 rounded-2xl border border-gray-150 shadow-sm flex flex-col gap-1">
            <span className="text-xs font-semibold text-gray-400 uppercase">เธชเธดเธเธเนเธฒเธ—เธฑเนเธเธซเธกเธ”</span>
            <span className="text-3xl font-black text-gray-700">{totalProducts} เธฃเธฒเธขเธเธฒเธฃ</span>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-gray-150 shadow-sm flex flex-col gap-1">
            <span className="text-xs font-semibold text-gray-400 uppercase">เธเธณเธเธงเธเธเธนเนเน€เธเนเธฒเนเธเนเธเธฒเธ (เธ•เธนเน Kiosk)</span>
            <span className="text-3xl font-black text-indigo-650">{kioskStats.wakeups} เธเธฃเธฑเนเธ</span>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-gray-150 shadow-sm flex flex-col gap-1">
            <span className="text-xs font-semibold text-gray-400 uppercase">เธขเธญเธ”เธเธฒเธฃเน€เธเนเธฒเธเธกเธชเธดเธเธเนเธฒเธชเธฐเธชเธก</span>
            <span className="text-3xl font-black text-emerald-600">{kioskStats.totalViews} เธเธฃเธฑเนเธ</span>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-gray-150 shadow-sm flex flex-col gap-1">
            <span className="text-xs font-semibold text-gray-400 uppercase">เธชเธดเธเธเนเธฒเธซเธกเธ”เธชเธ•เนเธญเธ</span>
            <span className="text-3xl font-black text-red-600">{outOfStock} เธฃเธฒเธขเธเธฒเธฃ</span>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-gray-150 shadow-sm flex flex-col gap-1">
            <span className="text-xs font-semibold text-gray-400 uppercase">เธชเธดเธเธเนเธฒเนเธเธฅเนเธซเธกเธ”</span>
            <span className="text-3xl font-black text-orange-500">{lowStock} เธฃเธฒเธขเธเธฒเธฃ</span>
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
            เธเธฑเธ”เธเธฒเธฃเธเธฅเธฑเธเธชเธดเธเธเนเธฒ
          </button>
          <button
            onClick={() => setActiveTab("users")}
            className={`pb-3 font-bold text-sm border-b-2 px-1 transition-all ${activeTab === "users"
              ? "border-[#F8C032] text-[#2B2B2B]"
              : "border-transparent text-gray-400 hover:text-gray-600"
              }`}
          >
            เธเธฑเธ”เธเธฒเธฃเธเธเธฑเธเธเธฒเธ & เธชเธกเธฒเธเธดเธ
          </button>
          <button
            onClick={() => setActiveTab("settings")}
            className={`pb-3 font-bold text-sm border-b-2 px-1 transition-all ${activeTab === "settings"
              ? "border-[#F8C032] text-[#2B2B2B]"
              : "border-transparent text-gray-400 hover:text-gray-600"
              }`}
          >
            เธ•เธฑเนเธเธเนเธฒเธฃเธฐเธเธ
          </button>
        </div>

        {activeTab === "products" && (
          <>
            {/* Action Header for Products */}
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-800">เธเธฅเธฑเธเธชเธดเธเธเนเธฒ Kiosk Shop</h2>
              <button
                onClick={handleOpenAddModal}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-[#F8C032] hover:bg-[#F0B420] text-[#2B2B2B] font-bold rounded-xl active:scale-95 transition-all text-sm shadow-sm"
              >
                <PlusIcon className="w-5 h-5" />
                เน€เธเธดเนเธกเธชเธดเธเธเนเธฒเนเธซเธกเน
              </button>
            </div>

            {error && (
              <div className="p-4 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm font-semibold">
                {error}
              </div>
            )}

            {/* Table list */}
            {loading ? (
              <div className="text-center py-20 text-gray-400">เธเธณเธฅเธฑเธเนเธซเธฅเธ”เธชเธดเธเธเนเธฒ...</div>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-150 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100 text-xs font-bold text-gray-400 uppercase">
                        <th className="py-4 px-6">เธเธทเนเธญเธชเธดเธเธเนเธฒ</th>
                        <th className="py-4 px-6">เธซเธกเธงเธ”เธซเธกเธนเน</th>
                        <th className="py-4 px-6">เธฃเธฒเธเธฒ</th>
                        <th className="py-4 px-6">เธเธณเธเธงเธเธชเธ•เนเธญเธ</th>
                        <th className="py-4 px-6">เธชเธ–เธฒเธเธฐ</th>
                        <th className="py-4 px-6">เธขเธญเธ”เธเธฒเธฃเน€เธเนเธฒเธเธก</th>
                        <th className="py-4 px-6 text-center">เธเธฑเธ”เธเธฒเธฃ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
                      {products.map((p) => {
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
                                  <span className="text-[10px] font-bold text-gray-400 uppercase">{p.category.slice(0, 3)}</span>
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
                                      เธเธณเธเธฑเธ” {p.purchaseLimit || p.purchase_limit} เธเธดเนเธ
                                    </span>
                                  )}
                                  {p.status === "Pre-Order" && (p.preorderReleaseDate || p.preorder_release_date) && (
                                    <span className="text-[9px] font-bold text-[#E65100] bg-[#FFF3E0] py-0.5 px-1.5 rounded-full border border-[#FFE0B2]">
                                      เธชเนเธเธกเธญเธ {new Date(p.preorderReleaseDate || p.preorder_release_date).toLocaleDateString("th-TH")}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-6 capitalize">
                              {categories.find(c => c.id === p.category)?.name || p.category}
                            </td>
                            <td className="py-4 px-6 font-bold text-gray-800">เธฟ{parseFloat(p.price).toFixed(0)}</td>
                            <td className="py-4 px-6">
                              <div className="flex items-center gap-1.5 font-bold">
                                <span className={stockVal <= 0 ? "text-red-600" : stockVal <= 5 ? "text-orange-500" : "text-gray-800"}>
                                  {stockVal} เธเธดเนเธ
                                </span>
                                {stockVal <= 5 && (
                                  <ExclamationTriangleIcon className="w-4 h-4 text-orange-500 shrink-0" />
                                )}
                              </div>
                            </td>
                            <td className="py-4 px-6">
                              <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${p.status === "In Stock"
                                ? "bg-green-50 text-green-700 border border-green-150"
                                : "bg-orange-50 text-orange-700 border border-orange-150"
                                }`}>
                                {p.status}
                              </span>
                            </td>
                            <td className="py-4 px-6 font-bold text-gray-700 font-mono">
                              {p.views || 0} เธเธฃเธฑเนเธ
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
                      })}
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
              <h2 className="text-lg font-bold text-gray-800">เธเธฑเธเธเธตเธเธเธฑเธเธเธฒเธเธฃเนเธฒเธเธเนเธฒ CAMT</h2>
              <button
                onClick={() => setIsUserModalOpen(true)}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-[#F8C032] hover:bg-[#F0B420] text-[#2B2B2B] font-bold rounded-xl active:scale-95 transition-all text-sm shadow-sm"
              >
                <PlusIcon className="w-5 h-5" />
                เน€เธเธดเนเธกเธเธเธฑเธเธเธฒเธเนเธซเธกเน
              </button>
            </div>

            {loadingUsers ? (
              <div className="text-center py-20 text-gray-400">เธเธณเธฅเธฑเธเนเธซเธฅเธ”เธเธฑเธเธเธตเธเธนเนเนเธเนเธเธฒเธ...</div>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-150 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100 text-xs font-bold text-gray-400 uppercase">
                        <th className="py-4 px-6">เธเธทเนเธญ-เธเธฒเธกเธชเธเธธเธฅ</th>
                        <th className="py-4 px-6">เธเธทเนเธญเธเธฑเธเธเธตเธเธนเนเนเธเน (Username)</th>
                        <th className="py-4 px-6">เธ•เธณเนเธซเธเนเธเธชเธดเธ—เธเธดเน (Role)</th>
                        <th className="py-4 px-6">เธงเธฑเธเธ—เธตเนเธชเธฃเนเธฒเธเธเธฑเธเธเธต</th>
                        <th className="py-4 px-6 text-center">เธเธฑเธ”เธเธฒเธฃ</th>
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
                              {u.role === "admin" ? "เธเธนเนเธ”เธนเนเธฅเธฃเธฐเธเธ (Admin)" : "เธเธเธฑเธเธเธฒเธ (Staff)"}
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
                                <span className="text-xs text-gray-300 italic">เธเธฑเธเธเธตเธเธธเธ“เนเธเธเธฑเธเธเธธเธเธฑเธ</span>
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
          <div className="bg-white p-8 rounded-3xl border border-gray-150 shadow-sm max-w-lg flex flex-col gap-6 font-['Prompt'] animate-in fade-in duration-200">
            <div>
              <h3 className="text-lg font-black text-gray-800">เธ•เธฑเนเธเธเนเธฒเธเธฒเธฃเธเธฃเธดเธเธฒเธฃเธเธฑเธ”เธชเนเธ</h3>
              <p className="text-xs text-gray-400 mt-1">เธเธณเธซเธเธ”เธญเธฑเธ•เธฃเธฒเธเนเธฒเธเธฑเธ”เธชเนเธเธเธฑเธชเธ”เธธเธชเธณเธซเธฃเธฑเธเธ•เธนเนเธชเธดเธเธเนเธฒ Kiosk</p>
            </div>
            
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">เธเนเธฒเธเธฑเธ”เธชเนเธเธเธฑเธชเธ”เธธเน€เธฃเธดเนเธกเธ•เนเธ (เธเธฒเธ—)</label>
              <input
                type="number"
                value={baseShippingFeeInput}
                onChange={(e) => setBaseShippingFeeInput(e.target.value)}
                placeholder="40"
                className="h-12 w-full px-4 rounded-xl border border-gray-200 focus:outline-none focus:border-[#5EBAA8] font-bold text-[#2B2B2B]"
              />
            </div>

            <div className="bg-gray-50 rounded-2xl p-4 border border-gray-150 flex flex-col gap-2">
              <span className="text-xs font-bold text-gray-500">เธเธฃเธตเธงเธดเธงเธญเธฑเธ•เธฃเธฒเธเนเธฒเธเธฑเธ”เธชเนเธ:</span>
              <div className="flex justify-between items-center text-sm font-medium text-gray-600 border-b border-gray-100/50 pb-2">
                <span>๐“ฆ เธเธฑเธ”เธชเนเธเธฃเธญเธเน€เธ”เธตเธขเธง (Combined)</span>
                <span className="font-bold text-[#2B2B2B]">เธฟ{parseFloat(baseShippingFeeInput || 0).toLocaleString('th-TH')}</span>
              </div>
              <div className="flex justify-between items-center text-sm font-medium text-gray-600 pt-1">
                <span>๐ เนเธขเธเธเธฑเธ”เธชเนเธเธชเธดเธเธเนเธฒเธเธฃเธตเธญเธญเน€เธ”เธญเธฃเน (Split)</span>
                <div className="flex flex-col items-end">
                  <span className="font-bold text-[#E53935]">เธฟ{(parseFloat(baseShippingFeeInput || 0) * 2).toLocaleString('th-TH')}</span>
                  <span className="text-[10px] text-red-500 font-bold">(เธเนเธฒเธชเนเธเธเธนเธ“ 2)</span>
                </div>
              </div>
            </div>

            <button
              onClick={handleSaveShippingSettings}
              className="h-12 w-full rounded-xl bg-[#F8C032] hover:bg-[#F0B420] active:scale-95 transition-all text-[#2B2B2B] font-bold text-sm cursor-pointer flex items-center justify-center shadow-sm"
            >
              เธเธฑเธเธ—เธถเธเธเธฒเธฃเธ•เธฑเนเธเธเนเธฒ
            </button>
          </div>
        )}
      </main>

      {/* Edit/Add Modal Overlay */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-6 backdrop-blur-xs">
          <div className="max-w-xl w-full max-h-[90vh] bg-white rounded-3xl border border-gray-150 shadow-[0_20px_50px_rgba(0,0,0,0.12)] p-8 flex flex-col gap-5 animate-in fade-in zoom-in-95 duration-200">
            <div>
              <h3 className="text-xl font-bold text-gray-800">
                {editingId ? "เนเธเนเนเธเธฃเธฒเธขเธฅเธฐเน€เธญเธตเธขเธ”เธชเธดเธเธเนเธฒ" : "เน€เธเธดเนเธกเธชเธดเธเธเนเธฒเธเธดเนเธเนเธซเธกเนเนเธเธเธฅเธฑเธ"}
              </h3>
              <p className="text-xs text-gray-400">เธเธฃเธญเธเธเนเธญเธกเธนเธฅเนเธซเนเธเธฃเธเธ–เนเธงเธเน€เธเธทเนเธญเธญเธฑเธเน€เธ”เธ•เธฅเธเธฃเธฐเธเธเธเธตเธญเธญเธช</p>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
              {/* Scrollable inputs container */}
              <div className="flex-1 overflow-y-auto pr-1.5 grid grid-cols-2 gap-4 max-h-[calc(90vh-220px)] custom-scrollbar">
                <div className="col-span-2 flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-500">เธเธทเนเธญเธชเธดเธเธเนเธฒ (Name)</label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="เธเธฃเธญเธเธเธทเนเธญเธ เธฒเธฉเธฒเนเธ—เธข..."
                    className="w-full h-11 bg-gray-50 border border-gray-100 focus:border-[#F8C032] rounded-xl px-4 text-sm outline-none transition-all"
                  />
                </div>

                <div className="col-span-2 flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-500">เธฃเธฒเธขเธฅเธฐเน€เธญเธตเธขเธ”เธชเธดเธเธเนเธฒ (Description)</label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="เธเธฃเธญเธเธฃเธฒเธขเธฅเธฐเน€เธญเธตเธขเธ”เธชเธฑเนเธเน..."
                    className="w-full h-20 py-2 bg-gray-50 border border-gray-100 focus:border-[#F8C032] rounded-xl px-4 text-sm outline-none transition-all resize-none"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-500">เธฃเธฒเธเธฒ (Price)</label>
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
                  <label className="text-xs font-semibold text-gray-500">เธเธณเธเธงเธเธชเธ•เนเธญเธ (Stock Count)</label>
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
                        <span className="text-xs font-bold text-gray-800">เธชเธฃเนเธฒเธเธซเธกเธงเธ”เธซเธกเธนเนเนเธซเธกเน</span>
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
                        เธขเธเน€เธฅเธดเธ
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[11px] font-semibold text-gray-500">เธเธทเนเธญเธซเธกเธงเธ”เธซเธกเธนเน (เธ เธฒเธฉเธฒเนเธ—เธข)</label>
                        <input
                          type="text"
                          value={newCatName}
                          onChange={(e) => setNewCatName(e.target.value)}
                          placeholder="เน€เธเนเธ: เธเธญเธเน€เธฅเนเธ"
                          className="h-10 bg-white border border-gray-200 focus:border-[#F8C032] rounded-xl px-3 text-xs outline-none transition-all"
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[11px] font-semibold text-gray-500">เธเธตเธขเนเธ เธฒเธฉเธฒเธญเธฑเธเธเธคเธฉ (เธญเธฑเธเธเธคเธฉเธเธดเธกเธเนเน€เธฅเนเธ)</label>
                        <input
                          type="text"
                          value={newCatId}
                          onChange={(e) => setNewCatId(e.target.value)}
                          placeholder="เน€เธเนเธ: toys"
                          className="h-10 bg-white border border-gray-200 focus:border-[#F8C032] rounded-xl px-3 text-xs outline-none transition-all font-mono"
                        />
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleSaveNewCategoryInline}
                      className="w-full h-9.5 bg-[#F8C032] hover:bg-[#F0B420] text-[#2B2B2B] text-xs font-bold rounded-xl transition-all cursor-pointer shadow-xs active:scale-[0.98]"
                    >
                      เธเธฑเธเธ—เธถเธเธซเธกเธงเธ”เธซเธกเธนเนเนเธซเธกเน
                    </button>
                  </div>
                ) : (
                  <div className="col-span-2 flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-gray-500">เธซเธกเธงเธ”เธซเธกเธนเน (Category)</label>
                    <div className="flex gap-2 relative">
                      <div className="flex-1 relative">
                        <button
                          type="button"
                          onClick={() => setIsCatDropdownOpen(!isCatDropdownOpen)}
                          className="w-full h-11 bg-gray-50 border border-gray-100 focus:border-[#F8C032] rounded-xl px-4 text-sm text-left flex items-center justify-between transition-all cursor-pointer"
                        >
                          <span className="font-semibold text-gray-800">
                            {categories.find(c => c.id === form.category)?.name || "เน€เธฅเธทเธญเธเธซเธกเธงเธ”เธซเธกเธนเน"}
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
                                        โ“
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => setEditingCatId(null)}
                                        className="w-6 h-6 rounded-lg bg-gray-100 text-gray-500 flex items-center justify-center font-bold hover:bg-gray-200 cursor-pointer"
                                      >
                                        โ•
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
                                          title="เนเธเนเนเธเธเธทเนเธญเธซเธกเธงเธ”เธซเธกเธนเน"
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
                                            title={isUsed ? "เธซเธกเธงเธ”เธซเธกเธนเนเธเธตเนเธเธณเธฅเธฑเธเธกเธตเธชเธดเธเธเนเธฒเนเธเนเธญเธขเธนเน" : "เธฅเธเธซเธกเธงเธ”เธซเธกเธนเน"}
                                            className={`w-5 h-5 rounded-lg flex items-center justify-center text-xs transition-colors font-bold ${
                                              isUsed 
                                                ? "text-gray-300 cursor-not-allowed" 
                                                : "text-red-500 hover:bg-red-50 hover:text-red-700 cursor-pointer"
                                            }`}
                                          >
                                            โ•
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
                        <span>เน€เธเธดเนเธกเธซเธกเธงเธ”เธซเธกเธนเน</span>
                      </button>
                    </div>
                  </div>
                )}

                <div className="col-span-2 flex flex-col gap-2 bg-gray-50 p-4.5 rounded-2xl border border-gray-150">
                  <span className="text-xs font-bold text-gray-700">เธฃเธนเธเธ เธฒเธเธชเธดเธเธเนเธฒ (Product Image)</span>
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-4">
                      {previewUrl && (
                        <div className="w-16 h-16 bg-white border border-gray-250 rounded-xl overflow-hidden shrink-0 flex items-center justify-center">
                          <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                        </div>
                      )}
                      <div className="flex-1 flex flex-col gap-1">
                        <label className="text-[11px] font-bold text-gray-500">เนเธเธฅเนเธฃเธนเธเธ เธฒเธ (JPG, PNG, WEBP)</label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFileChange}
                          required={!editingId && !form.image}
                          className="text-xs text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-[#F8C032]/10 file:text-[#F8C032] hover:file:bg-[#F8C032]/20 cursor-pointer"
                        />
                      </div>
                    </div>
                    {selectedFile && (
                      <p className="text-[10px] text-emerald-600 font-bold">
                        โ“ เธเธฃเธฑเธเธเธเธฒเธ”เธฃเธนเธเธ เธฒเธเน€เธฃเธตเธขเธเธฃเนเธญเธข (เธเธเธฒเธ”เธเธฃเธดเธ: {(selectedFile.size / 1024).toFixed(1)} KB)
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-500">เธเธธเธ”เธฃเธฑเธเธชเธดเธเธเนเธฒ (Pickup Location)</label>
                  <input
                    type="text"
                    value={form.pickupLocation}
                    onChange={(e) => setForm({ ...form, pickupLocation: e.target.value })}
                    placeholder="เน€เธเนเธ เธ•เธนเนเธเธณเธซเธเนเธฒเธขเธชเธดเธเธเนเธฒ A เธเธฑเนเธ 1"
                    className="w-full h-11 bg-gray-50 border border-gray-100 focus:border-[#F8C032] rounded-xl px-4 text-sm outline-none transition-all"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-500">เธชเธ–เธฒเธเธฐเธชเธดเธเธเนเธฒ (Status)</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                    className="w-full h-11 bg-gray-50 border border-gray-100 focus:border-[#F8C032] rounded-xl px-3 text-sm outline-none transition-all"
                  >
                    <option value="In Stock">เธเธฃเนเธญเธกเธเธณเธซเธเนเธฒเธข (In Stock)</option>
                    <option value="Pre-Order">เธชเธฑเนเธเธเธญเธเธฅเนเธงเธเธซเธเนเธฒ (Pre-Order)</option>
                  </select>
                </div>

                {form.status === "Pre-Order" && (
                  <div className="flex flex-col gap-1.5 animate-in fade-in duration-200">
                    <label className="text-xs font-semibold text-[#A24B2C]">เธงเธฑเธเธ—เธตเนเธเธฅเนเธญเธขเธชเธดเธเธเนเธฒเธเธฃเธตเธญเธญเน€เธ”เธญเธฃเน (Release Date)</label>
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
                  <label className="text-xs font-semibold text-gray-500">เธเธณเธเธฑเธ”เธชเธดเธ—เธเธดเนเธเธฒเธฃเธเธทเนเธญเธ•เนเธญเธเธ (Purchase Limit)</label>
                  <input
                    type="number"
                    min="1"
                    placeholder="เธงเนเธฒเธเธซเธฒเธเนเธกเนเธเธณเธเธฑเธ”"
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
                    เน€เธเนเธเธชเธดเธเธเนเธฒเนเธเธฃเนเธกเธเธฑเนเธ (Promotion Product)
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
                  เธขเธเน€เธฅเธดเธ
                </button>
                <button
                  type="submit"
                  className="px-6 h-11 rounded-xl bg-[#F8C032] hover:bg-[#F0B420] text-[#2B2B2B] font-bold transition-all text-sm shadow-sm cursor-pointer"
                >
                  เธเธฑเธเธ—เธถเธเธเนเธญเธกเธนเธฅ
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
                เน€เธเธดเนเธกเธเธฑเธเธเธตเธเธเธฑเธเธเธฒเธเนเธซเธกเน
              </h3>
              <p className="text-xs text-gray-400">เธชเธฃเนเธฒเธเธเธฑเธเธเธตเธชเธณเธซเธฃเธฑเธเธเธเธฑเธเธเธฒเธ (Staff) เธซเธฃเธทเธญเธเธนเนเธเธฑเธ”เธเธฒเธฃ (Admin)</p>
            </div>

            <form onSubmit={handleCreateUser} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-500">เธเธทเนเธญ-เธเธฒเธกเธชเธเธธเธฅเธเธเธฑเธเธเธฒเธ (Display Name)</label>
                <input
                  type="text"
                  required
                  value={userForm.name}
                  onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                  placeholder="เน€เธเนเธ เธชเธกเธเธฒเธข เนเธเธ”เธต"
                  className="w-full h-11 bg-gray-50 border border-gray-100 focus:border-[#F8C032] rounded-xl px-4 text-sm outline-none transition-all"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-500">เธเธทเนเธญเธเธฑเธเธเธตเธเธนเนเนเธเน (Username)</label>
                <input
                  type="text"
                  required
                  value={userForm.username}
                  onChange={(e) => setUserForm({ ...userForm, username: e.target.value })}
                  placeholder="เน€เธเนเธ staff3"
                  className="w-full h-11 bg-gray-50 border border-gray-100 focus:border-[#F8C032] rounded-xl px-4 text-sm outline-none transition-all font-mono"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-500">เธฃเธซเธฑเธชเธเนเธฒเธเธชเธณเธซเธฃเธฑเธเธฅเนเธญเธเธญเธดเธ (Password)</label>
                <input
                  type="password"
                  required
                  min={4}
                  value={userForm.password}
                  onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                  placeholder="เธเธณเธซเธเธ”เธฃเธซเธฑเธชเธเนเธฒเธ..."
                  className="w-full h-11 bg-gray-50 border border-gray-100 focus:border-[#F8C032] rounded-xl px-4 text-sm outline-none transition-all"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-500">เธชเธดเธ—เธเธดเนเธเธญเธเธเธฑเธเธเธตเธเธตเน (Account Role)</label>
                <select
                  value={userForm.role}
                  onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
                  className="w-full h-11 bg-gray-50 border border-gray-100 focus:border-[#F8C032] rounded-xl px-3 text-sm outline-none transition-all"
                >
                  <option value="staff">เธเธเธฑเธเธเธฒเธ (Staff / Runner)</option>
                  <option value="admin">เธเธนเนเธ”เธนเนเธฅเธฃเธฐเธเธ (Admin / Manager)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 mt-4 border-t border-gray-100 pt-5">
                <button
                  type="button"
                  onClick={() => setIsUserModalOpen(false)}
                  className="px-5 h-11 rounded-xl bg-gray-100 hover:bg-gray-200 text-[#2B2B2B] font-semibold transition-all text-sm"
                >
                  เธขเธเน€เธฅเธดเธ
                </button>
                <button
                  type="submit"
                  className="px-6 h-11 rounded-xl bg-[#F8C032] hover:bg-[#F0B420] text-[#2B2B2B] font-bold transition-all text-sm shadow-sm"
                >
                  เน€เธเธดเนเธกเธเธเธฑเธเธเธฒเธ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
