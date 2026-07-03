// src/components/Sidebar.jsx
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
  { id: "all", label: "All" },
  { id: "drinks", label: "Drinks" },
  { id: "snacks", label: "Snacks" },
  { id: "instant", label: "Instant Food" },
  { id: "stationery", label: "Stationery" },
  { id: "promotion", label: "Promotion" },
];

const ICONS = {
  all: [Squares2X2Icon, Squares2X2Solid],
  drinks: [BeakerIcon, BeakerSolid],
  snacks: [ShoppingBagIcon, ShoppingBagSolid],
  instant: [FireIcon, FireSolid],
  stationery: [PencilSquareIcon, PencilSquareSolid],
  promotion: [TagIcon, TagSolid],
};

// Every dimension below uses clamp(min, fluid, max) so the sidebar scales
// smoothly with viewport size instead of snapping between layouts at
// fixed breakpoints. Structure (vertical column, left-docked) never changes.
export default function Sidebar({ selectedCategory, onSelectCategory }) {
  return (
    <aside
      className="w-[clamp(160px,16vw,260px)] h-full bg-[#F8F8F8] shrink-0 flex flex-col 
                 py-[clamp(16px,3vw,32px)] px-[clamp(10px,2vw,20px)] 
                 gap-[clamp(8px,1.2vw,12px)] overflow-y-auto"
    >
      <div className="px-1 pb-[clamp(10px,2vw,16px)]">
        <p className="text-[clamp(15px,1.6vw,24px)] font-bold text-[#2B2B2B] tracking-tight">
          CATEGORY
        </p>
        <span className="mt-2 block w-10 h-1 rounded-full bg-[#F8C032]" />
      </div>

      {CATEGORIES.map((cat) => {
        const isActive = selectedCategory === cat.id;
        const [OutlineIcon, SolidIcon] = ICONS[cat.id];
        const Icon = isActive ? SolidIcon : OutlineIcon;

        return (
          <button
            key={cat.id}
            onClick={() => onSelectCategory(cat.id)}
            className={`h-[clamp(60px,6vw,72px)] w-full rounded-2xl flex items-center 
                        gap-[clamp(8px,1.5vw,16px)] px-[clamp(10px,2vw,20px)] 
                        transition-all duration-150 active:scale-[0.97]
                        ${
                          isActive
                            ? "bg-[#F8C032] shadow-md"
                            : "bg-white hover:bg-white/70 shadow-[0_2px_8px_rgba(0,0,0,0.04)]"
                        }`}
          >
            <Icon
              className={`w-[clamp(18px,2vw,28px)] h-[clamp(18px,2vw,28px)] shrink-0 ${
                isActive ? "text-[#2B2B2B]" : "text-[#2B2B2B]/60"
              }`}
            />
            <span
              className={`text-[clamp(12px,1.3vw,18px)] text-left leading-tight ${
                isActive
                  ? "font-semibold text-[#2B2B2B]"
                  : "font-medium text-[#2B2B2B]/80"
              }`}
            >
              {cat.label}
            </span>
          </button>
        );
      })}
    </aside>
  );
}
