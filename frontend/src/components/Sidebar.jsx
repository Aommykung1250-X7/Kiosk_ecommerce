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

export default function Sidebar({ selectedCategory, onSelectCategory }) {
  const categories = (() => {
    const stored = localStorage.getItem("kiosk_categories");
    let custom = [];
    if (stored) {
      try {
        custom = JSON.parse(stored);
      } catch (e) { }
    }

    const defaultList = [
      { id: "all", label: "All" },
      { id: "drinks", label: "Drinks" },
      { id: "snacks", label: "Snacks" },
      { id: "instant", label: "Instant Food" },
      { id: "stationery", label: "Stationery" }
    ];

    const filteredCustom = custom
      .filter(c => !["drinks", "snacks", "instant", "stationery"].includes(c.id))
      .map(c => ({ id: c.id, label: c.name }));

    return [...defaultList, ...filteredCustom, { id: "promotion", label: "Promotion" }];
  })();

  return (
    <aside
      className="w-[clamp(180px,18vw,260px)] h-full bg-white border-r border-gray-150 shrink-0 flex flex-col 
                 py-8 px-4 gap-2 overflow-y-auto font-['Prompt']"
    >
      <div className="px-2 pb-4">
        <p className="text-xs font-black text-gray-400 tracking-widest uppercase">
          CATEGORIES
        </p>
      </div>

      {categories.map((cat) => {
        const isActive = selectedCategory === cat.id;
        const [OutlineIcon, SolidIcon] = ICONS[cat.id] || [ShoppingBagIcon, ShoppingBagSolid];
        const Icon = isActive ? SolidIcon : OutlineIcon;

        return (
          <button
            key={cat.id}
            onClick={() => onSelectCategory(cat.id)}
            className={`h-14 w-full rounded-2xl flex items-center 
                        gap-3 px-4 transition-all duration-150 active:scale-[0.97] cursor-pointer
                        ${isActive
                ? "bg-[#5EBAA8] text-white shadow-sm"
                : "bg-transparent text-gray-500 hover:bg-gray-50 hover:text-gray-700"
              }`}
          >
            <Icon
              className={`w-6 h-6 shrink-0 ${isActive ? "text-white" : "text-gray-400"
                }`}
            />
            <span
              className={`text-sm text-left leading-tight ${isActive
                  ? "font-bold text-white"
                  : "font-semibold"
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

