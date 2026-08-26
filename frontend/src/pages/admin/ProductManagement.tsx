import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { useSearchParams } from "react-router-dom";
import { removeBackground } from "@imgly/background-removal";
import {
  AlertTriangle,
  Eye,
  Package,
  PackageX,
  Pencil,
  Plus,
  RefreshCw,
  Tag,
  Trash2,
  Users,
} from "lucide-react";
import type {
  Category,
  KioskStats,
  Product,
  ProductFormState,
} from "../../types/admin";
import { notify, confirmDialog } from "../../components/notify";
import { AdminLayout } from "../../components/admin/AdminLayout";
import type { SessionUser } from "../../components/admin/AdminSidebar";
import {
  Badge,
  Button,
  Card,
  CategoryTag,
  EmptyState,
  ErrorBanner,
  FilterChips,
  IconButton,
  LoadingState,
  LOW_STOCK_THRESHOLD,
  SearchInput,
  Select,
  StatCard,
  StockCell,
  TBody,
  Table,
  TableShell,
  Td,
  Th,
  THead,
  Toggle,
  Tr,
  UnderlineTabs,
  formatBaht,
  formatBahtShort,
  formatCount,
  formatThaiDate,
  resolveUploadUrl,
  type TabItem,
} from "../../components/admin/ui";
import {
  ProductFormModal,
  MAX_PRODUCT_IMAGES,
} from "../../components/admin/products/ProductFormModal";
import { ProductPromotionModal } from "../../components/admin/products/ProductPromotionModal";
import type { PromotionDraft } from "../../components/admin/products/ProductPromotionModal";
import { CategoryManagerModal } from "../../components/admin/products/CategoryManagerModal";
import { StaffPanel } from "../../components/admin/products/StaffPanel";
import { StoreSettingsPanel } from "../../components/admin/products/StoreSettingsPanel";

type PageTab = "products" | "users" | "settings";
type StockFilter = "all" | "in_stock" | "pre_order" | "low_stock" | "out_of_stock" | "promotion";

const PAGE_TABS: TabItem<PageTab>[] = [
  { key: "products", label: "รายการสินค้า" },
  { key: "users", label: "พนักงานและสิทธิ์" },
  { key: "settings", label: "ตั้งค่าร้าน" },
];

const EMPTY_FORM: ProductFormState = {
  name: "",
  description: "",
  additional_info: "",
  price: 0,
  stock: 0,
  category: "",
  image: "",
  images: [],
  promotion: false,
  promotionType: "percent",
  promotionValue: 10,
  promotionStartDate: "",
  promotionEndDate: "",
  pickupLocation: "",
  status: "In Stock",
  preorderReleaseDate: "",
  purchaseLimit: "",
};

/** จำนวนคงเหลือของสินค้า — backend ส่งมาทั้ง stock และ quantity แล้วแต่ endpoint */
function stockOf(product: Product): number {
  return product.stock ?? product.quantity ?? 0;
}

/** ย่อรูปก่อนอัปโหลด เพื่อไม่ให้ไฟล์จากกล้องมือถือกินแบนด์วิดท์ของตู้ */
function resizeImage(file: File, maxWidth = 600, maxHeight = 600): Promise<File> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const image = new Image();
      image.onload = () => {
        let { width, height } = image;

        if (width > height && width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        } else if (height >= width && height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        canvas.getContext("2d")?.drawImage(image, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(new File([blob], file.name, { type: file.type }));
            } else {
              reject(new Error("แปลงรูปภาพไม่สำเร็จ"));
            }
          },
          file.type || "image/jpeg",
          0.85,
        );
      };
      image.onerror = () => reject(new Error("อ่านไฟล์รูปภาพไม่ได้"));
      image.src = String(event.target?.result ?? "");
    };
    reader.onerror = () => reject(new Error("อ่านไฟล์รูปภาพไม่ได้"));
    reader.readAsDataURL(file);
  });
}

/**
 * Smart Instant Flood-fill Background Removal (Zero-latency fallback)
 */
const removeSolidBackground = (imageSource: File | Blob | string): Promise<Blob | null> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "Anonymous";

    let urlToRevoke: string | null = null;
    if (typeof imageSource === "string") {
      img.src = imageSource;
    } else {
      urlToRevoke = URL.createObjectURL(imageSource);
      img.src = urlToRevoke;
    }

    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (!ctx) {
          if (urlToRevoke) URL.revokeObjectURL(urlToRevoke);
          return resolve(null);
        }

        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imgData.data;
        const width = canvas.width;
        const height = canvas.height;

        let sampleR = 0, sampleG = 0, sampleB = 0, sampleCount = 0;
        const samplePoints = [
          [0, 0], [width - 1, 0], [0, height - 1], [width - 1, height - 1],
          [Math.floor(width / 2), 0], [Math.floor(width / 2), height - 1],
          [0, Math.floor(height / 2)], [width - 1, Math.floor(height / 2)]
        ];

        for (const [sx, sy] of samplePoints) {
          const idx = (sy * width + sx) * 4;
          sampleR += data[idx];
          sampleG += data[idx + 1];
          sampleB += data[idx + 2];
          sampleCount++;
        }

        const bgR = sampleR / sampleCount;
        const bgG = sampleG / sampleCount;
        const bgB = sampleB / sampleCount;

        const tolerance = 48;
        const visited = new Uint8Array(width * height);
        const queue: number[] = [];

        for (let x = 0; x < width; x++) {
          queue.push(x, 0);
          queue.push(x, height - 1);
          visited[0 * width + x] = 1;
          visited[(height - 1) * width + x] = 1;
        }
        for (let y = 0; y < height; y++) {
          queue.push(0, y);
          queue.push(width - 1, y);
          visited[y * width + 0] = 1;
          visited[y * width + (width - 1)] = 1;
        }

        let head = 0;
        while (head < queue.length) {
          const cx = queue[head++];
          const cy = queue[head++];
          const idx = (cy * width + cx) * 4;

          const r = data[idx];
          const g = data[idx + 1];
          const b = data[idx + 2];

          const diff = Math.sqrt((r - bgR) ** 2 + (g - bgG) ** 2 + (b - bgB) ** 2);

          if (diff < tolerance) {
            data[idx + 3] = 0;

            const neighbors = [
              [cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]
            ];

            for (const [nx, ny] of neighbors) {
              if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                const nPos = ny * width + nx;
                if (!visited[nPos]) {
                  visited[nPos] = 1;
                  queue.push(nx, ny);
                }
              }
            }
          }
        }

        ctx.putImageData(imgData, 0, 0);

        canvas.toBlob((blob) => {
          if (urlToRevoke) URL.revokeObjectURL(urlToRevoke);
          resolve(blob);
        }, "image/png");
      } catch (err) {
        if (urlToRevoke) URL.revokeObjectURL(urlToRevoke);
        resolve(null);
      }
    };

    img.onerror = () => {
      if (urlToRevoke) URL.revokeObjectURL(urlToRevoke);
      resolve(null);
    };
  });
};

/**
 * สแกนหาขอบวัตถุและตัดส่วนเกิน (Crop) พร้อมจัดกึ่งกลาง (Center) บนภาพโปร่งใส
 */
const cropAndCenterImage = (imageSource: Blob | File | string, paddingPercent = 0.08): Promise<Blob | null> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "Anonymous";

    let urlToRevoke: string | null = null;
    if (typeof imageSource === "string") {
      img.src = imageSource;
    } else {
      urlToRevoke = URL.createObjectURL(imageSource);
      img.src = urlToRevoke;
    }

    img.onload = () => {
      try {
        const srcCanvas = document.createElement("canvas");
        srcCanvas.width = img.width;
        srcCanvas.height = img.height;
        const srcCtx = srcCanvas.getContext("2d", { willReadFrequently: true });
        if (!srcCtx) {
          if (urlToRevoke) URL.revokeObjectURL(urlToRevoke);
          return resolve(null);
        }

        srcCtx.drawImage(img, 0, 0);
        const imgData = srcCtx.getImageData(0, 0, img.width, img.height);
        const data = imgData.data;
        const w = img.width;
        const h = img.height;

        let minX = w, minY = h, maxX = -1, maxY = -1;

        for (let y = 0; y < h; y++) {
          for (let x = 0; x < w; x++) {
            const alpha = data[(y * w + x) * 4 + 3];
            if (alpha > 15) {
              if (x < minX) minX = x;
              if (x > maxX) maxX = x;
              if (y < minY) minY = y;
              if (y > maxY) maxY = y;
            }
          }
        }

        if (maxX < minX || maxY < minY) {
          if (urlToRevoke) URL.revokeObjectURL(urlToRevoke);
          return resolve(null);
        }

        const cropWidth = maxX - minX + 1;
        const cropHeight = maxY - minY + 1;

        const maxDim = Math.max(cropWidth, cropHeight);
        const padding = Math.round(maxDim * paddingPercent);
        const targetSize = maxDim + padding * 2;

        const outCanvas = document.createElement("canvas");
        outCanvas.width = targetSize;
        outCanvas.height = targetSize;
        const outCtx = outCanvas.getContext("2d");
        if (!outCtx) {
          if (urlToRevoke) URL.revokeObjectURL(urlToRevoke);
          return resolve(null);
        }

        const destX = Math.round((targetSize - cropWidth) / 2);
        const destY = Math.round((targetSize - cropHeight) / 2);

        outCtx.drawImage(
          srcCanvas,
          minX, minY, cropWidth, cropHeight,
          destX, destY, cropWidth, cropHeight
        );

        outCanvas.toBlob((blob) => {
          if (urlToRevoke) URL.revokeObjectURL(urlToRevoke);
          resolve(blob);
        }, "image/png");
      } catch (err) {
        console.error("cropAndCenterImage error:", err);
        if (urlToRevoke) URL.revokeObjectURL(urlToRevoke);
        resolve(null);
      }
    };

    img.onerror = () => {
      if (urlToRevoke) URL.revokeObjectURL(urlToRevoke);
      resolve(null);
    };
  });
};

/**
 * ทำความสะอาดขอบวัตถุและลบขอบสีขาวลอยรอบตัวสินค้า (Alpha Edge Despill & Smoothing)
 */
const refineAlphaMatte = (imageSource: Blob | File | string): Promise<Blob | null> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "Anonymous";

    let urlToRevoke: string | null = null;
    if (typeof imageSource === "string") {
      img.src = imageSource;
    } else {
      urlToRevoke = URL.createObjectURL(imageSource);
      img.src = urlToRevoke;
    }

    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (!ctx) {
          if (urlToRevoke) URL.revokeObjectURL(urlToRevoke);
          return resolve(null);
        }

        ctx.drawImage(img, 0, 0);
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imgData.data;

        for (let i = 0; i < data.length; i += 4) {
          const a = data[i + 3];
          if (a > 0 && a < 235) {
            const factor = a / 255;
            data[i] = Math.round(data[i] * factor);
            data[i + 1] = Math.round(data[i + 1] * factor);
            data[i + 2] = Math.round(data[i + 2] * factor);
            if (a < 25) {
              data[i + 3] = 0;
            }
          }
        }

        ctx.putImageData(imgData, 0, 0);

        canvas.toBlob((blob) => {
          if (urlToRevoke) URL.revokeObjectURL(urlToRevoke);
          resolve(blob);
        }, "image/png");
      } catch (err) {
        console.error("refineAlphaMatte error:", err);
        if (urlToRevoke) URL.revokeObjectURL(urlToRevoke);
        resolve(null);
      }
    };

    img.onerror = () => {
      if (urlToRevoke) URL.revokeObjectURL(urlToRevoke);
      resolve(null);
    };
  });
};

/**
 * High-Precision AI Background Removal Runner (Full Float32 Model + Despill & Auto Crop/Center)
 */
const processBackgroundRemoval = async (imageSource: File | Blob | string): Promise<Blob | null> => {
  let resultBlob: Blob | null = null;
  try {
    const blob = await removeBackground(imageSource, {
      model: "isnet", // High-Precision Full Float32 neural network model
      device: "gpu",  // Hardware accelerated GPU inference
      publicPath: "https://staticimgly.com/@imgly/background-removal-data/1.7.0/dist/",
      debug: false
    });
    if (blob && blob.size > 100) resultBlob = blob;
  } catch (aiErr) {
    console.warn("High-precision AI removeBackground failed, retrying with fp16 fallback:", aiErr);
    try {
      const fallbackAiBlob = await removeBackground(imageSource, {
        model: "isnet_fp16",
        publicPath: "https://staticimgly.com/@imgly/background-removal-data/1.7.0/dist/",
        debug: false
      });
      if (fallbackAiBlob && fallbackAiBlob.size > 100) resultBlob = fallbackAiBlob;
    } catch (retryErr) {
      console.warn("AI removeBackground retry failed, using flood-fill fallback:", retryErr);
    }
  }

  if (!resultBlob) {
    try {
      const fallbackBlob = await removeSolidBackground(imageSource);
      if (fallbackBlob) resultBlob = fallbackBlob;
    } catch (fallbackErr) {
      console.error("Fallback removeSolidBackground error:", fallbackErr);
    }
  }

  // Auto-Crop & Center non-transparent product object with Alpha Edge Despill
  if (resultBlob) {
    try {
      const refinedBlob = await refineAlphaMatte(resultBlob);
      const targetBlob = refinedBlob || resultBlob;
      const croppedBlob = await cropAndCenterImage(targetBlob);
      if (croppedBlob) return croppedBlob;
    } catch (cropErr) {
      console.warn("cropAndCenterImage failed, using original uncropped blob:", cropErr);
    }
    return resultBlob;
  }

  return null;
};

export default function ProductManagement() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get("tab") as PageTab | null;
  const activeTab: PageTab =
    tabParam === "users" || tabParam === "settings" ? tabParam : "products";

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [kioskStats, setKioskStats] = useState<KioskStats>({ wakeups: 0, totalViews: 0 });
  const [currentUser, setCurrentUser] = useState<SessionUser | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [stockFilter, setStockFilter] = useState<StockFilter>("all");

  const [formOpen, setFormOpen] = useState(false);
  const [categoryManagerOpen, setCategoryManagerOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<ProductFormState>(EMPTY_FORM);
  const [uploading, setUploading] = useState(false);
  const [autoRemoveBg, setAutoRemoveBg] = useState(true);
  const [processingBgIndex, setProcessingBgIndex] = useState<number | null>(null);
  const [promotionTarget, setPromotionTarget] = useState<Product | null>(null);
  const [togglingId, setTogglingId] = useState<number | null>(null);

  /* ------------------------------------------------------------- โหลดข้อมูล */

  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch("/api/kiosk/stats", { credentials: "include" });
      if (response.ok) setKioskStats(await response.json());
    } catch (loadError) {
      console.error("Error loading kiosk stats:", loadError);
    }
  }, []);

  const fetchProducts = useCallback(async () => {
    try {
      // pricing=original — หน้านี้เขียนราคาที่โหลดมากลับลง DB ตอนแก้ไข/สลับโปรโมชั่น
      // ถ้ารับราคาที่หักส่วนลดแล้วมา ราคาจริงของสินค้าจะถูกทับถาวร
      const response = await fetch("/api/products?pricing=original");
      const data = await response.json();
      if (!response.ok) throw new Error("ไม่สามารถเรียกรายการสินค้าได้");
      setProducts(data);
      setError("");
      void fetchStats();
    } catch (loadError) {
      setError((loadError as Error).message);
    } finally {
      setLoading(false);
    }
  }, [fetchStats]);

  const fetchCategories = useCallback(async () => {
    try {
      const response = await fetch("/api/categories");
      if (response.ok) setCategories(await response.json());
    } catch (loadError) {
      console.error("Error fetching categories:", loadError);
    }
  }, []);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("user");
      if (raw) setCurrentUser(JSON.parse(raw) as SessionUser);
    } catch {
      // ไม่มีข้อมูลผู้ใช้ใน localStorage ก็ยังแสดงหน้าได้ตามปกติ
    }
    void fetchProducts();
    void fetchCategories();
    void fetchStats();
  }, [fetchProducts, fetchCategories, fetchStats]);

  /* ------------------------------------------------------------- ตัวกรอง */

  const outOfStockCount = products.filter((product) => stockOf(product) <= 0).length;
  const lowStockCount = products.filter((product) => {
    const quantity = stockOf(product);
    return quantity > 0 && quantity <= LOW_STOCK_THRESHOLD;
  }).length;
  const promotionCount = products.filter((product) => product.promotion).length;
  const preOrderCount = products.filter((product) => product.status === "Pre-Order").length;
  const inStockCount = products.filter(
    (product) => product.status === "In Stock" && stockOf(product) > 0,
  ).length;

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();

    return products.filter((product) => {
      if (query) {
        const haystack = [
          product.name,
          product.description ?? "",
          product.category ?? "",
          product.pickupLocation ?? product.pickup_location ?? "",
          String(product.id),
        ]
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(query)) return false;
      }

      if (categoryFilter !== "all" && product.category !== categoryFilter) return false;

      const quantity = stockOf(product);
      switch (stockFilter) {
        case "in_stock":
          return product.status === "In Stock" && quantity > 0;
        case "pre_order":
          return product.status === "Pre-Order";
        case "low_stock":
          return quantity > 0 && quantity <= LOW_STOCK_THRESHOLD;
        case "out_of_stock":
          return quantity <= 0;
        case "promotion":
          return Boolean(product.promotion);
        default:
          return true;
      }
    });
  }, [products, search, categoryFilter, stockFilter]);

  const filtersActive =
    search.trim() !== "" || categoryFilter !== "all" || stockFilter !== "all";

  const clearFilters = () => {
    setSearch("");
    setCategoryFilter("all");
    setStockFilter("all");
  };

  /* --------------------------------------------------------------- ฟอร์ม */

  const openCreate = () => {
    setEditingId(null);
    setForm({ ...EMPTY_FORM, category: categories[0]?.id ?? "" });
    setFormOpen(true);
  };

  const openEdit = (product: Product) => {
    const images =
      product.images && product.images.length > 0
        ? product.images
        : product.image
          ? [product.image]
          : [];

    setEditingId(product.id);
    setForm({
      name: product.name,
      description: product.description ?? "",
      additional_info: product.additional_info ?? product.additionalInfo ?? "",
      price: product.price,
      stock: stockOf(product),
      category: product.category ?? "",
      image: product.image ?? "",
      images: images.slice(0, MAX_PRODUCT_IMAGES),
      promotion: Boolean(product.promotion),
      promotionType: product.promotionType === "amount" ? "amount" : "percent",
      promotionValue: product.promotionValue || 10,
      promotionStartDate: product.promotionStartDate ?? "",
      promotionEndDate: product.promotionEndDate ?? "",
      pickupLocation: product.pickupLocation ?? product.pickup_location ?? "",
      status: product.status ?? "In Stock",
      preorderReleaseDate:
        product.preorderReleaseDate ?? product.preorder_release_date ?? "",
      purchaseLimit: product.purchaseLimit ?? product.purchase_limit ?? "",
    });
    setFormOpen(true);
  };

  const handleUploadImages = async (files: File[]) => {
    const current = form.images ?? [];
    const remaining = MAX_PRODUCT_IMAGES - current.length;
    if (remaining <= 0) {
      notify.warning(`เพิ่มรูปได้สูงสุด ${MAX_PRODUCT_IMAGES} รูป ลบรูปเดิมก่อนเพิ่มรูปใหม่`);
      return;
    }

    setUploading(true);
    try {
      const body = new FormData();
      for (const file of files.slice(0, remaining)) {
        let processedFile = await resizeImage(file);

        if (autoRemoveBg) {
          try {
            notify.info("กำลังตัดพื้นหลังรูปภาพด้วย AI...");
            const bgBlob = await processBackgroundRemoval(processedFile);
            if (bgBlob) {
              const fileNameWithoutExt = file.name.replace(/\.[^/.]+$/, "");
              processedFile = new File([bgBlob], `${fileNameWithoutExt}_nobg.png`, { type: "image/png" });
            }
          } catch (bgErr) {
            console.warn("Auto background removal failed, using original:", bgErr);
          }
        }

        body.append("images", processedFile);
      }

      const response = await fetch("/api/products/upload", {
        method: "POST",
        credentials: "include",
        body,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "อัปโหลดรูปภาพไม่สำเร็จ");

      const uploaded: string[] = data.images ?? [data.image];
      const merged = [...current, ...uploaded].slice(0, MAX_PRODUCT_IMAGES);
      setForm((previous) => ({ ...previous, image: merged[0] ?? "", images: merged }));
      if (autoRemoveBg) notify.success("อัปโหลดและตัดพื้นหลังเรียบร้อยแล้ว");
    } catch (uploadError) {
      notify.error((uploadError as Error).message);
    } finally {
      setUploading(false);
    }
  };

  const handleProcessSingleBg = async (index: number) => {
    const currentImages = form.images ?? [];
    const filename = currentImages[index];
    if (!filename) return;

    const imageUrl = resolveUploadUrl(filename, "products");
    if (!imageUrl) return;

    setProcessingBgIndex(index);
    try {
      notify.info(`กำลังตัดพื้นหลังรูปที่ ${index + 1}...`);
      const bgBlob = await processBackgroundRemoval(imageUrl);
      if (!bgBlob) throw new Error("ไม่สามารถตัดพื้นหลังรูปภาพนี้ได้");

      const body = new FormData();
      const newFile = new File([bgBlob], `bg_removed_${Date.now()}.png`, { type: "image/png" });
      body.append("images", newFile);

      const response = await fetch("/api/products/upload", {
        method: "POST",
        credentials: "include",
        body,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "อัปโหลดรูปภาพใหม่ไม่สำเร็จ");

      const newUploadedName = data.images?.[0] || data.image;
      const updatedImages = [...currentImages];
      updatedImages[index] = newUploadedName;

      setForm((previous) => ({
        ...previous,
        image: updatedImages[0] ?? "",
        images: updatedImages,
      }));

      notify.success(`ตัดพื้นหลังรูปที่ ${index + 1} เรียบร้อยแล้ว`);
    } catch (err) {
      notify.error((err as Error).message);
    } finally {
      setProcessingBgIndex(null);
    }
  };

  const handleRemoveImage = (index: number) => {
    setForm((previous) => {
      const images = (previous.images ?? []).filter((_, position) => position !== index);
      return { ...previous, image: images[0] ?? "", images };
    });
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const images = form.images ?? [];
    if (images.length === 0) {
      notify.warning("เพิ่มรูปสินค้าอย่างน้อย 1 รูปก่อนบันทึก");
      return;
    }
    if (!form.category) {
      notify.warning("เลือกหมวดหมู่ก่อนบันทึก");
      return;
    }

    const payload = {
      ...form,
      image: images[0],
      images: images.slice(0, MAX_PRODUCT_IMAGES),
      price: parseFloat(String(form.price)),
      stock: parseInt(String(form.stock), 10),
    };

    try {
      const response = await fetch(
        editingId ? `/api/products/${editingId}` : "/api/products",
        {
          method: editingId ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(payload),
        },
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "บันทึกสินค้าไม่สำเร็จ");

      notify.success(editingId ? "บันทึกการแก้ไขแล้ว" : "เพิ่มสินค้าแล้ว");
      setFormOpen(false);
      void fetchProducts();
    } catch (submitError) {
      notify.error((submitError as Error).message);
    }
  };

  const handleDelete = async (product: Product) => {
    const confirmed = await confirmDialog({
      title: "ลบสินค้าชิ้นนี้?",
      message: `"${product.name}" และรูปภาพทั้งหมดจะถูกลบออกจากระบบ`,
      confirmText: "ลบสินค้า",
      variant: "danger",
    });
    if (!confirmed) return;

    try {
      const response = await fetch(`/api/products/${product.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "ลบสินค้าไม่สำเร็จ");

      notify.success("ลบสินค้าแล้ว");
      void fetchProducts();
    } catch (deleteError) {
      notify.error((deleteError as Error).message);
    }
  };

  /**
   * บันทึกสถานะโปรโมชั่นของสินค้าชิ้นเดียว
   * ส่งข้อมูลสินค้าทั้งชุดกลับไปเพราะ PUT /api/products/:id เขียนทับทุกฟิลด์
   */
  const savePromotion = async (
    product: Product,
    next: boolean,
    draft: PromotionDraft | null,
  ) => {
    setTogglingId(product.id);
    const images =
      product.images && product.images.length > 0
        ? product.images
        : product.image
          ? [product.image]
          : [];

    try {
      const response = await fetch(`/api/products/${product.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: product.name,
          description: product.description ?? "",
          additional_info: product.additional_info ?? product.additionalInfo ?? "",
          price: product.originalPrice ?? product.price,
          stock: stockOf(product),
          category: product.category,
          image: images[0] ?? product.image,
          images,
          promotion: next,
          promotionType: draft ? draft.promotionType : (product.promotionType ?? "percent"),
          promotionValue: draft ? draft.promotionValue : (product.promotionValue || product.discountValue || 10),
          promotionStartDate: draft ? draft.promotionStartDate : (product.promotionStartDate ?? ""),
          promotionEndDate: draft ? draft.promotionEndDate : (product.promotionEndDate ?? ""),
          pickupLocation: product.pickupLocation ?? product.pickup_location ?? "",
          status: product.status ?? "In Stock",
          preorderReleaseDate:
            product.preorderReleaseDate ?? product.preorder_release_date ?? null,
          purchaseLimit: product.purchaseLimit ?? product.purchase_limit ?? null,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "เปลี่ยนสถานะโปรโมชั่นไม่สำเร็จ");

      setPromotionTarget(null);
      notify.success(next ? "เปิดโปรโมชั่นแล้ว" : "ปิดโปรโมชั่นแล้ว");
      // ราคาหลังลดคำนวณที่ backend จึงต้องโหลดใหม่แทนการแก้ state ในเครื่อง
      void fetchProducts();
    } catch (toggleError) {
      notify.error((toggleError as Error).message);
    } finally {
      setTogglingId(null);
    }
  };

  /** เปิดสวิตช์ = ถามส่วนลดก่อน / ปิดสวิตช์ = ล้างส่วนลดทิ้งได้เลย */
  const handleTogglePromotion = (product: Product, next: boolean) => {
    if (next) {
      setPromotionTarget(product);
      return;
    }
    void savePromotion(product, false, null);
  };

  /* ---------------------------------------------------------- หมวดหมู่ */

  const handleCreateCategory = async (id: string, name: string) => {
    if (categories.some((category) => category.id === id)) {
      notify.warning("มีคีย์หมวดหมู่นี้อยู่แล้ว");
      return;
    }

    try {
      const response = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ id, name }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "บันทึกหมวดหมู่ไม่สำเร็จ");

      await fetchCategories();
      notify.success(`เพิ่มหมวดหมู่ "${data.name}" แล้ว`);
    } catch (categoryError) {
      notify.error((categoryError as Error).message);
    }
  };

  const handleRenameCategory = async (id: string, name: string) => {
    if (!name) {
      notify.warning("ชื่อหมวดหมู่ว่างไม่ได้");
      return;
    }

    try {
      const response = await fetch(`/api/categories/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "แก้ไขหมวดหมู่ไม่สำเร็จ");

      await fetchCategories();
      void fetchProducts();
    } catch (categoryError) {
      notify.error((categoryError as Error).message);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    const name = categories.find((category) => category.id === id)?.name ?? id;
    const confirmed = await confirmDialog({
      title: "ลบหมวดหมู่สินค้า?",
      message: `หมวดหมู่ "${name}" จะหายไปจากตัวกรองและฟอร์มสินค้า`,
      confirmText: "ลบหมวดหมู่",
      variant: "danger",
    });
    if (!confirmed) return;

    try {
      const response = await fetch(`/api/categories/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "ลบหมวดหมู่ไม่สำเร็จ");

      await fetchCategories();
      if (form.category === id) setForm((previous) => ({ ...previous, category: "" }));
      if (categoryFilter === id) setCategoryFilter("all");
      notify.success(`ลบหมวดหมู่ "${name}" แล้ว`);
    } catch (categoryError) {
      notify.error((categoryError as Error).message);
    }
  };

  /* ------------------------------------------------------------- แสดงผล */

  const categoryName = (id: string | null | undefined) =>
    categories.find((category) => category.id === id)?.name ?? id ?? "ไม่ระบุ";

  return (
    <AdminLayout
      title="สินค้า"
      description="คลังสินค้าที่แสดงบนตู้ พร้อมสต็อก ราคา และสิทธิ์การเข้าถึงระบบ"
      actions={
        activeTab === "products" ? (
          <>
            <Button icon={RefreshCw} onClick={() => void fetchProducts()}>
              รีเฟรช
            </Button>
            <Button variant="primary" icon={Plus} onClick={openCreate}>
              เพิ่มสินค้า
            </Button>
          </>
        ) : undefined
      }
    >
      {/* การ์ดสรุป */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard
          emphasis
          label="สินค้าทั้งหมด"
          value={formatCount(products.length)}
          unit="รายการ"
          icon={Package}
          hint={`${formatCount(inStockCount)} รายการพร้อมขายอยู่ตอนนี้`}
        />
        <StatCard
          label="ผู้เข้าใช้งานตู้"
          value={formatCount(kioskStats.wakeups)}
          unit="ครั้ง"
          icon={Users}
          accent="accent"
          hint="จำนวนครั้งที่ตู้ถูกแตะเริ่มใช้งาน"
        />
        <StatCard
          label="ยอดเข้าชมสินค้าสะสม"
          value={formatCount(kioskStats.totalViews)}
          unit="ครั้ง"
          icon={Eye}
          accent="success"
          hint="รวมทุกรายการในคลัง"
        />
        <StatCard
          label="หมดสต็อก"
          value={formatCount(outOfStockCount)}
          unit="รายการ"
          icon={PackageX}
          accent="danger"
          hint={outOfStockCount > 0 ? "ต้องเติมของก่อนลูกค้ากดสั่ง" : "ไม่มีรายการที่หมด"}
        />
        <StatCard
          label={`ใกล้หมด (เหลือ ≤ ${LOW_STOCK_THRESHOLD})`}
          value={formatCount(lowStockCount)}
          unit="รายการ"
          icon={AlertTriangle}
          accent="lowstock"
          hint={lowStockCount > 0 ? "เตรียมของรอบถัดไปไว้ล่วงหน้า" : "ระดับสต็อกปกติ"}
        />
      </div>

      <UnderlineTabs
        items={PAGE_TABS}
        value={activeTab}
        onChange={(key) => setSearchParams(key === "products" ? {} : { tab: key })}
      />

      {activeTab === "products" && (
        <>
          <Card className="flex flex-col gap-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <SearchInput
                className="flex-1"
                value={search}
                onChange={setSearch}
                placeholder="ค้นหาชื่อสินค้า รหัส หมวดหมู่ หรือจุดรับของ"
                aria-label="ค้นหาสินค้า"
              />
              <Select
                className="sm:w-56"
                value={categoryFilter}
                onChange={setCategoryFilter}
                options={[
                  { value: "all", label: "ทุกหมวดหมู่", count: products.length },
                  ...categories.map((category) => ({
                    value: category.id,
                    label: category.name,
                    count: products.filter((product) => product.category === category.id)
                      .length,
                  })),
                ]}
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-bo-line pt-4">
              <FilterChips<StockFilter>
                value={stockFilter}
                onChange={setStockFilter}
                items={[
                  { key: "all", label: "ทั้งหมด", count: products.length },
                  { key: "in_stock", label: "พร้อมขาย", count: inStockCount },
                  { key: "pre_order", label: "พรีออเดอร์", count: preOrderCount },
                  { key: "low_stock", label: "ใกล้หมด", count: lowStockCount },
                  { key: "out_of_stock", label: "หมดสต็อก", count: outOfStockCount },
                  { key: "promotion", label: "โปรโมชั่น", count: promotionCount },
                ]}
              />

              {filtersActive && (
                <Button size="sm" variant="ghost" onClick={clearFilters}>
                  ล้างตัวกรอง
                </Button>
              )}
            </div>
          </Card>

          {error && <ErrorBanner message={error} />}

          <TableShell>
            {loading ? (
              <LoadingState label="กำลังโหลดรายการสินค้า" />
            ) : filteredProducts.length === 0 ? (
              <EmptyState
                icon={Package}
                title={filtersActive ? "ไม่มีสินค้าที่ตรงกับตัวกรอง" : "ยังไม่มีสินค้าในคลัง"}
                description={
                  filtersActive
                    ? "ลองค้นด้วยคำอื่น หรือล้างตัวกรองเพื่อดูรายการทั้งหมด"
                    : "เพิ่มสินค้าชิ้นแรกเพื่อให้ขึ้นแสดงบนหน้าตู้"
                }
                action={
                  filtersActive ? (
                    <Button onClick={clearFilters}>ล้างตัวกรอง</Button>
                  ) : (
                    <Button variant="primary" icon={Plus} onClick={openCreate}>
                      เพิ่มสินค้า
                    </Button>
                  )
                }
              />
            ) : (
              <Table>
                <THead>
                  {/* ตรึงความกว้างคอลัมน์ชื่อสินค้าไว้ ชื่อยาวๆ จะถูกตัดด้วย truncate
                      แทนที่จะดันคอลัมน์ที่เหลือไปกองอยู่ขอบขวาจนตัวหนังสือตกบรรทัด */}
                  <Th className="w-[260px]">สินค้า</Th>
                  <Th>หมวดหมู่</Th>
                  <Th align="right">ราคา</Th>
                  <Th align="right">ขายได้</Th>
                  {/* เว้นช่องซ้ายเพิ่ม ไม่ให้ตัวเลขที่ชิดขวาไปติดกับจำนวนคงเหลือที่ชิดซ้าย */}
                  <Th className="pl-8">คงเหลือ</Th>
                  <Th>สถานะ</Th>
                  <Th align="center">โปรโมชั่น</Th>
                  <Th align="center">ส่วนลด</Th>
                  <Th align="right">ยอดเข้าชม</Th>
                  <Th align="right">จัดการ</Th>
                </THead>

                <TBody>
                  {filteredProducts.map((product) => {
                    const quantity = stockOf(product);
                    const isPreOrder = product.status === "Pre-Order";
                    const releaseDate =
                      product.preorderReleaseDate ?? product.preorder_release_date;
                    const limit = product.purchaseLimit ?? product.purchase_limit;
                    const cover = resolveUploadUrl(product.image, "products");

                    return (
                      <Tr key={product.id}>
                        <Td className="max-w-[260px]">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-bo-line bg-slate-100">
                              {cover ? (
                                <img
                                  src={cover}
                                  alt=""
                                  loading="lazy"
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <span className="flex h-full w-full items-center justify-center text-[10px] font-semibold text-slate-400 uppercase">
                                  {(product.category ?? "prd").slice(0, 3)}
                                </span>
                              )}
                            </div>

                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium text-bo-text">
                                {product.name}
                              </p>
                              {(isPreOrder && releaseDate) || limit ? (
                                <div className="mt-1 flex flex-wrap items-center gap-1.5">
                                  {isPreOrder && releaseDate && (
                                    <Badge tone="preorder" size="sm">
                                      พร้อมส่ง {formatThaiDate(releaseDate)}
                                    </Badge>
                                  )}
                                  {limit ? (
                                    <Badge tone="preorder" size="sm">
                                      จำกัด {limit} ชิ้น
                                    </Badge>
                                  ) : null}
                                </div>
                              ) : null}
                            </div>
                          </div>
                        </Td>

                        <Td>
                          <CategoryTag>{categoryName(product.category)}</CategoryTag>
                        </Td>

                        <Td align="right" className="bo-nums font-semibold">
                          {formatBahtShort(product.price)}
                        </Td>

                        <Td align="right" className="bo-nums text-sm font-medium">
                          {formatCount(product.soldCount)}
                        </Td>

                        <Td className="pl-8">
                          <StockCell stock={quantity} isPreOrder={isPreOrder} />
                        </Td>

                        <Td>
                          {isPreOrder ? (
                            <Badge tone="preorder" dot pulse>
                              Pre-order
                            </Badge>
                          ) : quantity <= 0 ? (
                            <Badge tone="danger" dot>
                              หมดสต็อก
                            </Badge>
                          ) : quantity <= LOW_STOCK_THRESHOLD ? (
                            <Badge tone="lowstock" dot>
                              ใกล้หมด
                            </Badge>
                          ) : (
                            <Badge tone="success" dot>
                              พร้อมขาย
                            </Badge>
                          )}
                        </Td>

                        <Td align="center">
                          <div className="flex items-center justify-center gap-2">
                            <Toggle
                              checked={Boolean(product.promotion)}
                              disabled={togglingId === product.id}
                              onChange={(next) => handleTogglePromotion(product, next)}
                              label={`${product.promotion ? "ปิด" : "เปิด"}โปรโมชั่นของ ${product.name}`}
                            />
                            {product.promotion && (
                              <Tag className="h-3.5 w-3.5 text-bo-accent" />
                            )}
                          </div>
                        </Td>

                        <Td align="center">
                          {product.discountType ? (
                            <span className="inline-flex flex-col items-center gap-0.5">
                              <span className="bo-nums text-sm font-medium text-bo-lowstock">
                                {product.discountType === "amount"
                                  ? `-${formatBahtShort(product.discountValue)}`
                                  : `-${product.discountValue}%`}
                              </span>
                              <span className="bo-nums text-[10px] text-bo-muted">
                                -{formatBaht(product.discountAmount)}
                              </span>
                            </span>
                          ) : (
                            <span className="text-sm text-bo-muted">—</span>
                          )}
                        </Td>

                        <Td align="right" className="bo-nums text-sm text-bo-muted">
                          {formatCount(product.views)}
                        </Td>

                        <Td align="right">
                          <div className="flex items-center justify-end gap-1">
                            <IconButton
                              icon={Pencil}
                              label={`แก้ไข ${product.name}`}
                              onClick={() => openEdit(product)}
                            />
                            <IconButton
                              icon={Trash2}
                              tone="danger"
                              label={`ลบ ${product.name}`}
                              onClick={() => void handleDelete(product)}
                            />
                          </div>
                        </Td>
                      </Tr>
                    );
                  })}
                </TBody>
              </Table>
            )}
          </TableShell>

          {!loading && filteredProducts.length > 0 && (
            <p className="text-xs text-bo-muted">
              แสดง {formatCount(filteredProducts.length)} จากทั้งหมด{" "}
              {formatCount(products.length)} รายการ
            </p>
          )}
        </>
      )}

      {activeTab === "users" && <StaffPanel currentUserId={currentUser?.id} />}

      {activeTab === "settings" && <StoreSettingsPanel onStatsReset={fetchStats} />}

      <ProductFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={handleSubmit}
        form={form}
        setForm={setForm}
        categories={categories}
        editing={editingId !== null}
        uploading={uploading}
        onUploadImages={(files) => void handleUploadImages(files)}
        onRemoveImage={handleRemoveImage}
        onManageCategories={() => setCategoryManagerOpen(true)}
        autoRemoveBg={autoRemoveBg}
        onToggleAutoRemoveBg={setAutoRemoveBg}
        onProcessBgRemoval={(index) => void handleProcessSingleBg(index)}
        processingBgIndex={processingBgIndex}
      />

      <ProductPromotionModal
        product={promotionTarget}
        saving={togglingId === promotionTarget?.id}
        onCancel={() => setPromotionTarget(null)}
        onConfirm={(draft) => {
          if (promotionTarget) void savePromotion(promotionTarget, true, draft);
        }}
      />

      <CategoryManagerModal
        open={categoryManagerOpen}
        onClose={() => setCategoryManagerOpen(false)}
        categories={categories}
        products={products}
        onCreate={handleCreateCategory}
        onRename={handleRenameCategory}
        onDelete={handleDeleteCategory}
      />
    </AdminLayout>
  );
}
