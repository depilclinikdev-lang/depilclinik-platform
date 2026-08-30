import React from "react";

export const TextField = ({
  label,
  value,
  onChange,
  type = "text",
  ...rest
}) => (
  <div className="flex flex-col gap-1">
    <label className="text-xs font-bold text-primary">{label}</label>
    <input
      type={type}
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value)}
      className="w-full p-2.5 rounded-lg border border-borderClinik text-sm focus:outline-none focus:border-secondary"
      {...rest}
    />
  </div>
);

export const TextAreaField = ({ label, value, onChange, rows = 3 }) => (
  <div className="flex flex-col gap-1">
    <label className="text-xs font-bold text-primary">{label}</label>
    <textarea
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value)}
      rows={rows}
      className="w-full p-2.5 rounded-lg border border-borderClinik text-sm focus:outline-none focus:border-secondary resize-none"
    />
  </div>
);

export const SelectField = ({ label, value, onChange, options }) => (
  <div className="flex flex-col gap-1">
    <label className="text-xs font-bold text-primary">{label}</label>
    <select
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value)}
      className="w-full p-2.5 rounded-lg border border-borderClinik text-sm bg-white focus:outline-none focus:border-secondary"
    >
      <option value="">Selecciona...</option>
      {options.map((opt) => (
        <option key={opt} value={opt}>
          {opt}
        </option>
      ))}
    </select>
  </div>
);

const COLUMN_CLASSES = {
  1: "grid-cols-1",
  2: "grid-cols-1 sm:grid-cols-2",
  3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
  4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
};

export const CheckboxGrid = ({ items, values, onToggle, columns = 3 }) => (
  <div
    className={`grid gap-x-4 gap-y-2 ${COLUMN_CLASSES[columns] || COLUMN_CLASSES[3]}`}
  >
    {items.map(({ key, label }) => (
      <label
        key={key}
        className="flex items-center gap-2 text-sm text-primary cursor-pointer select-none"
      >
        <input
          type="checkbox"
          checked={Boolean(values[key])}
          onChange={() => onToggle(key)}
          className="accent-secondary h-4 w-4 rounded border-borderClinik shrink-0"
        />
        <span className="min-w-0">{label}</span>
      </label>
    ))}
  </div>
);

export const RatingSlider = ({ label, value, onChange }) => (
  <div className="flex items-center justify-between gap-4">
    <span className="text-sm text-primary">{label}</span>
    <div className="flex items-center gap-2">
      <input
        type="range"
        min="0"
        max="10"
        value={value ?? 5}
        onChange={(e) => onChange(Number(e.target.value))}
        className="accent-secondary w-32"
      />
      <span className="text-xs font-bold text-secondary w-5 text-center">
        {value ?? 5}
      </span>
    </div>
  </div>
);
