/**
 * ชนิดข้อมูลของระบบหลังบ้าน (Back-office)
 *
 * ทุกฟิลด์ในไฟล์นี้สะท้อนสิ่งที่ API ส่งกลับมาจริง (ดู backend/src/repositories/*)
 * ไม่ได้ตั้งขึ้นใหม่ ที่มีทั้ง camelCase และ snake_case คู่กัน เพราะ backend
 * ส่งมาทั้งสองแบบในบางจุด จึงประกาศไว้ทั้งคู่เพื่อให้ฝั่งหน้าเว็บอ่านได้ปลอดภัย
 */

export type ProductStatus = "In Stock" | "Pre-Order";

/** ส่วนลดของสินค้า — ลดเป็นเปอร์เซ็นต์ หรือลดเป็นจำนวนเงินบาท */
export type DiscountType = "percent" | "amount";

export interface Category {
  id: string;
  name: string;
}

export interface Product {
  id: number;
  name: string;
  description?: string | null;
  additional_info?: string | null;
  additionalInfo?: string | null;
  price: number;
  /** จำนวนคงเหลือ — backend ส่ง stock และ quantity เป็นค่าเดียวกัน */
  stock?: number;
  quantity?: number;
  category?: string | null;
  image?: string | null;
  images?: string[];
  promotion?: boolean;
  pickupLocation?: string | null;
  pickup_location?: string | null;
  status?: ProductStatus;
  preorderReleaseDate?: string | null;
  preorder_release_date?: string | null;
  purchaseLimit?: number | null;
  purchase_limit?: number | null;
  views?: number;
  /** ราคาเต็มก่อนหักส่วนลดโปรโมชั่น — backend ส่งมาคู่กับ price เสมอ */
  originalPrice?: number;
  /** ชนิดส่วนลดที่มีผลอยู่จริง (null = ไม่ลด) */
  discountType?: DiscountType | null;
  /** ค่าส่วนลดที่มีผลอยู่จริง — เป็น % หรือจำนวนบาท ตาม discountType */
  discountValue?: number;
  /** ส่วนลดที่ได้จริงคิดเป็นบาท (originalPrice - price) */
  discountAmount?: number;
  /** ชนิดส่วนลดที่แอดมินตั้งไว้ที่สินค้าชิ้นนี้ */
  promotionType?: DiscountType;
  /** ค่าส่วนลดที่แอดมินตั้งไว้ (คนละตัวกับ discountValue ที่เป็นผลลัพธ์) */
  promotionValue?: number;
  /** YYYY-MM-DD — ว่าง = เริ่มทันที */
  promotionStartDate?: string;
  /** YYYY-MM-DD — ว่าง = ไม่หมดอายุ */
  promotionEndDate?: string;
}

/** ค่าที่ผูกกับฟอร์มเพิ่ม/แก้ไขสินค้า (เก็บเป็น string ระหว่างพิมพ์) */
export interface ProductFormState {
  name: string;
  description: string;
  additional_info: string;
  additionalInfo?: string;
  price: number | string;
  stock: number | string;
  category: string;
  image: string;
  images: string[];
  promotion: boolean;
  promotionType: DiscountType;
  promotionValue: number | string;
  promotionStartDate: string;
  promotionEndDate: string;
  pickupLocation: string;
  status: ProductStatus;
  preorderReleaseDate: string;
  purchaseLimit: number | "";
}

export type UserRole = "admin" | "staff";

export interface StaffUser {
  id: number;
  username: string;
  name: string;
  role: UserRole;
  createdAt: string;
}

export interface UserFormState {
  username: string;
  password: string;
  role: UserRole;
  name: string;
}

export interface KioskStats {
  wakeups: number;
  totalViews: number;
}

/* ---------------------------------------------------------------- Orders */

export type FulfillmentState = "pending" | "fulfilled" | "none";

export interface OrderItemProduct {
  id: number;
  name: string;
  price: number;
  status: ProductStatus;
  image?: string | null;
  imageUrl?: string | null;
  preorder_release_date?: string | null;
  preorderReleaseDate?: string | null;
  pickup_location?: string | null;
  pickupLocation?: string | null;
  category?: string | null;
  category_name?: string | null;
  categoryName?: string | null;
}

export interface OrderItem {
  id: number;
  quantity: number;
  price: number;
  fulfillmentStatus: FulfillmentState;
  fulfilledAt?: string | null;
  product?: OrderItemProduct;
}

export interface OrderShipment {
  id: number;
  order_id: number;
  shipment_type: "instock" | "preorder" | "combined";
  courier_name?: string | null;
  tracking_number?: string | null;
  status?: string | null;
}

export type DeliveryOption = "pickup" | "delivery";
export type ShippingOption = "combined" | "split";
/** สถานะการชำระเงิน — backend แปลง "paid" เป็น "success" ก่อนส่งกลับ */
export type PaymentState = "success" | "pending" | "failed";

export interface Order {
  id: string;
  dbId: number;
  items: OrderItem[];
  shipments: OrderShipment[];
  totalPrice: number;
  status: PaymentState;
  customerName?: string | null;
  customerPhone?: string | null;
  customerEmail?: string | null;
  customerAddress?: string | null;
  createdAt: string;
  paidAt?: string | null;
  fulfillmentStatus?: FulfillmentState;
  fulfillmentStatusInstock?: FulfillmentState;
  fulfillmentStatusPreorder?: FulfillmentState;
  fulfilledAt?: string | null;
  deliveryOption: DeliveryOption;
  shippingOption: ShippingOption;
  trackingNumber1?: string | null;
  courier1?: string | null;
  trackingNumber2?: string | null;
  courier2?: string | null;
  paymentGatewayRef?: string | null;
  handlerName?: string | null;
}

/** สถานะรวมของออเดอร์ที่คำนวณจากหลายฟิลด์ ใช้เป็นตัวกรองในหน้าคำสั่งซื้อ */
export type OrderStageKey =
  | "pending"
  | "waiting_pickup"
  | "waiting_preorder"
  | "waiting_address"
  | "ready_to_ship"
  | "partially_shipped"
  | "fulfilled";

export type StageTone =
  | "neutral"
  | "info"
  | "accent"
  | "warning"
  | "danger"
  | "success"
  | "preorder"
  | "lowstock";

export interface OrderStage {
  key: OrderStageKey;
  label: string;
  tone: StageTone;
}

/* ---------------------------------------------------------- Screensavers */

export interface Screensaver {
  id: number;
  title: string;
  mediaUrl: string;
  duration: number;
  displayOrder: number;
  isActive: boolean;
}

export interface ScreensaverConfig {
  masterEnabled: boolean;
  masterDuration: number;
  featuredProductIds: number[];
  featuredProducts: Product[];
}

/* --------------------------------------------------------------- Reports */

export interface DeliveryBreakdownRow {
  delivery_option: DeliveryOption;
  order_count: number;
  total_amount: string | number;
}

export interface DailyTrendOrder {
  id: string;
  created_at: string;
  delivery_option: DeliveryOption;
  total_amount: string | number;
}

export interface DailyTrendRow {
  date: string;
  orders_count: number;
  daily_revenue: string | number;
  orders?: DailyTrendOrder[];
}

export interface ProductReportRow {
  id: number;
  name: string;
  category: string;
  price: number;
  stock: number;
  views: number;
  unitsSold: number;
  totalRevenue: number;
  conversionRate: string;
}

export interface HourlyTrafficRow {
  hour: string;
  orders: number;
  revenue: number;
}

export interface ReportSummary {
  totalRevenue: number;
  paidOrdersCount: number;
  totalProducts: number;
  lowStockCount: number;
  totalWakeups: number;
  deliveryBreakdown: DeliveryBreakdownRow[];
  dailyTrend: DailyTrendRow[];
  productReportList: ProductReportRow[];
  hourlyDistribution: HourlyTrafficRow[];
  popularTags: string[];
}

export type ReportTab = "sales" | "products" | "kiosk";
export type ExportFormat = "excel" | "csv" | "pdf";
export type DatePreset = "today" | "7days" | "30days" | "all" | "custom";

/* -------------------------------------------------------------- Settings */

export interface ContactSettings {
  hotline: string;
  lineId: string;
  lineUrl: string;
  lineQrImage: string;
  serviceHours: string;
  website: string;
  facebook: string;
}
