import React, { useState, useRef, useEffect } from "react";
import { LuChevronDown, LuClock } from "react-icons/lu";

export const WheelDropdown = ({
  label,
  value,
  options,
  onChange,
  icon,
  renderOption,
  renderValue,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });
  const buttonRef = useRef(null);
  const listRef = useRef(null);

  const toggleOpen = () => {
    if (!isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setCoords({ top: rect.bottom + 4, left: rect.left, width: rect.width });
    }
    setIsOpen((prev) => !prev);
  };

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e) => {
      if (
        buttonRef.current &&
        !buttonRef.current.contains(e.target) &&
        listRef.current &&
        !listRef.current.contains(e.target)
      ) {
        setIsOpen(false);
      }
    };

    const handleScroll = (e) => {
      if (listRef.current && listRef.current.contains(e.target)) return;
      setIsOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("scroll", handleScroll, true);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, [isOpen]);

  const selected = options.find((o) => o.value === value);

  return (
    <div className="flex flex-col gap-1">
      <label className="text-[10px] font-bold text-primary uppercase tracking-wide">
        {label}
      </label>
      <button
        type="button"
        ref={buttonRef}
        onClick={toggleOpen}
        className="w-full flex items-center gap-1.5 justify-between px-3 py-2 rounded-xl border border-borderClinik text-sm bg-white focus:outline-none focus:border-secondary cursor-pointer"
      >
        <span className="flex items-center gap-1.5 min-w-0">
          {icon}
          {selected && renderValue ? (
            renderValue(selected)
          ) : (
            <span
              className={`truncate ${
                selected ? "text-primary font-semibold" : "text-gray-400"
              }`}
            >
              {selected ? selected.label : "--"}
            </span>
          )}
        </span>
        <LuChevronDown size={14} className="text-accent shrink-0" />
      </button>

      {isOpen && (
        <div
          ref={listRef}
          style={{
            position: "fixed",
            top: coords.top,
            left: coords.left,
            width: coords.width,
            zIndex: 9999,
          }}
          className="bg-white border border-borderClinik rounded-xl shadow-2xl max-h-52 overflow-y-auto py-1"
        >
          {options.map((opt) => (
            <button
              type="button"
              key={opt.value}
              onClick={() => {
                onChange(opt.value);
                setIsOpen(false);
              }}
              className={`w-full text-left px-3 py-1.5 text-sm cursor-pointer transition-colors flex items-center ${
                opt.value === value
                  ? "bg-secondary text-white font-bold"
                  : "text-primary hover:bg-gray-50"
              }`}
            >
              {renderOption
                ? renderOption(opt, opt.value === value)
                : opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// Genera horarios en intervalos de 15 min entre startHour24 y endHour24 (inclusive)
export const buildTimeOptions = (startHour24 = 6, endHour24 = 22) => {
  const options = [];
  for (let h = startHour24; h <= endHour24; h++) {
    for (let m = 0; m < 60; m += 15) {
      if (h === endHour24 && m > 0) break;
      const value = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
      const ampm = h >= 12 ? "PM" : "AM";
      let hour12 = h % 12;
      if (hour12 === 0) hour12 = 12;
      const label = `${String(hour12).padStart(2, "0")}:${String(m).padStart(2, "0")} ${ampm}`;
      options.push({ value, label });
    }
  }
  return options;
};

export const TIME_OPTIONS = buildTimeOptions();

export const TimeWheelDropdown = ({ label, value, onChange }) => (
  <div className="flex flex-col gap-1">
    <label className="text-[10px] font-bold text-primary uppercase tracking-wide">
      {label}
    </label>
    <div className="relative">
      <LuClock
        size={14}
        className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary shrink-0 pointer-events-none"
      />
      <input
        type="time"
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        className="w-full pl-9 pr-3 py-2 rounded-xl border border-borderClinik text-sm bg-white focus:outline-none focus:border-secondary cursor-text"
      />
    </div>
  </div>
);
