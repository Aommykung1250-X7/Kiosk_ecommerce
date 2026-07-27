import {
  Squares2X2Icon,
  BeakerIcon,
  ShoppingBagIcon,
  FireIcon,
  PencilSquareIcon,
  TagIcon,
} from "@heroicons/react/24/outline";
import {
  Squares2X2Icon as Squares2X2Solid,
  BeakerIcon as BeakerSolid,
  ShoppingBagIcon as ShoppingBagSolid,
  FireIcon as FireSolid,
  PencilSquareIcon as PencilSquareSolid,
  TagIcon as TagSolid,
} from "@heroicons/react/24/solid";

const CATEGORIES = [
  { id: "all", label: "ทั้งหมด" },
  { id: "drinks", label: "เครื่องดื่ม" },
  { id: "snacks", label: "ขนมขบเคี้ยว" },
  { id: "instant", label: "อาหารพร้อมทาน" },
  { id: "stationery", label: "เครื่องเขียน" },
  { id: "promotion", label: "โปรโมชั่น" },
];

const ICONS = {
  all: [Squares2X2Icon, Squares2X2Solid],
  drinks: [BeakerIcon, BeakerSolid],
  snacks: [ShoppingBagIcon, ShoppingBagSolid],
  instant: [FireIcon, FireSolid],
  stationery: [PencilSquareIcon, PencilSquareSolid],
  promotion: [TagIcon, TagSolid],
};

export default function Sidebar({ selectedCategory, onSelectCategory }) {
  return (
    <aside
      className="w-36 sm:w-44 h-full bg-white border-r border-gray-200 shrink-0 flex flex-col 
                 py-6 px-2.5 gap-2 overflow-y-auto font-['Prompt'] select-none"
    >
      <div className="px-2 pb-2">
        <p className="text-[10px] font-black text-gray-400 tracking-widest uppercase">
          CATEGORY
        </p>
      </div>

      {CATEGORIES.map((cat) => {
        const isActive = selectedCategory === cat.id;

        return (
          <button
            key={cat.id}
            onClick={() => onSelectCategory(cat.id)}
            className={`h-11 w-full rounded-xl flex items-center justify-start
                        px-3.5 transition-all duration-150 active:scale-[0.97] cursor-pointer
                        ${
                          isActive
                            ? "bg-[#F9C338] text-black font-black shadow-xs border border-black/10"
                            : "bg-transparent text-gray-600 hover:bg-gray-50 hover:text-black font-bold"
                        }`}
          >
            <span className="text-xs uppercase tracking-wider text-left truncate">
              {cat.label}
            </span>
          </button>
        );
      })}
    </aside>
  );
}

