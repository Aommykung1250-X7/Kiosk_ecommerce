// src/data/products.js

// Category keys must match Sidebar.jsx category ids
export const CATEGORIES = [
  { id: "all", label: "All" },
  { id: "drinks", label: "Drinks" },
  { id: "snacks", label: "Snacks" },
  { id: "instant", label: "Instant Food" },
  { id: "stationery", label: "Stationery" },
  { id: "promotion", label: "Promotion" },
];

// `illustration` selects a hand-built SVG icon in ProductCard.jsx —
// used instead of real product photography to avoid reproducing
// trademarked packaging/logos.
const products = [
  {
    id: "p01",
    name: "น้ำดื่มคริสตัล 600 มล.",
    price: 10,
    category: "drinks",
    illustration: "water",
    promotion: false,
  },
  {
    id: "p02",
    name: "โค้ก กระป๋อง 325 มล.",
    price: 20,
    category: "drinks",
    illustration: "cola",
    promotion: false,
  },
  {
    id: "p03",
    name: "เลย์มันฝรั่งแท้ รสออริจินัล",
    price: 20,
    category: "snacks",
    illustration: "chips",
    promotion: true,
  },
  {
    id: "p04",
    name: "ทิวลี่กรอบ รสชีส",
    price: 15,
    category: "snacks",
    illustration: "wafer",
    promotion: false,
  },
  {
    id: "p05",
    name: "มาม่าคัพ รสต้มยำกุ้ง",
    price: 15,
    category: "instant",
    illustration: "noodle",
    promotion: true,
  },
  {
    id: "p06",
    name: "ไมโล ยูเอชที 180 มล.",
    price: 12,
    category: "drinks",
    illustration: "milo",
    promotion: false,
  },
  {
    id: "p07",
    name: "ปากกาลูกลื่น Pilot 0.5 มม.",
    price: 12,
    category: "stationery",
    illustration: "pen",
    promotion: false,
  },
  {
    id: "p08",
    name: "สมุดโน้ต DIIC",
    price: 25,
    category: "stationery",
    illustration: "notebook",
    promotion: false,
  },
];

export default products;
