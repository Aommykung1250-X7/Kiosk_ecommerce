import React, { useState, useRef, useEffect } from "react";
import { ChevronDownIcon, CheckIcon } from "@heroicons/react/24/outline";

export default function CustomDropdown({
  options = [],
  value,
  onChange,
  placeholder = "เลือกรายการ...",
  disabled = false,
  className = "",
  buttonClassName = "",
  menuClassName = "",
  size = "md" // "sm" | "md"
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  // Normalize options: support string[] or object[]
  const normalizedOptions = options.map((opt) => {
    if (typeof opt === "object" && opt !== null) {
      return {
        value: opt.value !== undefined ? opt.value : opt.id,
        label: opt.label || opt.name || String(opt.value),
        count: opt.count,
        icon: opt.icon,
        disabled: opt.disabled
      };
    }
    return { value: opt, label: String(opt) };
  });

  const selectedOption = normalizedOptions.find((opt) => opt.value === value);

  const isSmall = size === "sm";

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        className={`w-full ${
          isSmall ? "h-10 px-3 text-xs" : "h-11 px-4 text-sm"
        } bg-gray-50 hover:bg-gray-100/70 border border-gray-150 focus:border-[#F8C032] focus:bg-white rounded-xl text-left flex items-center justify-between gap-2 transition-all cursor-pointer select-none disabled:opacity-50 disabled:cursor-not-allowed ${
          isOpen ? "border-[#F8C032] bg-white ring-2 ring-[#F8C032]/20" : ""
        } ${buttonClassName}`}
      >
        <span
          className={`truncate font-semibold ${
            selectedOption ? "text-gray-800" : "text-gray-400 font-normal"
          }`}
        >
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDownIcon
          className={`w-4 h-4 text-gray-400 shrink-0 transform transition-transform duration-200 ${
            isOpen ? "rotate-180 text-[#F8C032]" : ""
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className={`absolute top-[calc(100%+4px)] left-0 right-0 z-40 min-w-full bg-white border border-gray-150 rounded-2xl shadow-xl max-h-56 overflow-y-auto p-1.5 flex flex-col gap-0.5 animate-in fade-in slide-in-from-top-1 duration-150 scrollbar-thin ${menuClassName}`}
        >
          {normalizedOptions.length === 0 ? (
            <div className="px-3.5 py-2.5 text-xs text-gray-400 text-center font-medium">
              ไม่มีตัวเลือก
            </div>
          ) : (
            normalizedOptions.map((opt) => {
              const isSelected = opt.value === value;
              return (
                <div
                  key={String(opt.value)}
                  onClick={() => {
                    if (opt.disabled) return;
                    onChange(opt.value);
                    setIsOpen(false);
                  }}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl ${
                    isSmall ? "text-xs" : "text-sm"
                  } transition-colors cursor-pointer select-none ${
                    opt.disabled
                      ? "opacity-40 cursor-not-allowed text-gray-400"
                      : isSelected
                      ? "bg-[#F8C032]/15 text-[#2B2B2B] font-bold"
                      : "hover:bg-gray-50 text-gray-700 font-medium"
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    {opt.icon && <span className="shrink-0">{opt.icon}</span>}
                    <span className="truncate">{opt.label}</span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 ml-2">
                    {opt.count !== undefined && (
                      <span
                        className={`text-[11px] font-bold px-1.5 py-0.5 rounded-md ${
                          isSelected
                            ? "bg-[#F8C032]/30 text-[#2B2B2B]"
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {opt.count}
                      </span>
                    )}
                    {isSelected && (
                      <CheckIcon className="w-4 h-4 text-[#2B2B2B] stroke-[2.5]" />
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
