import type React from "react";

interface CheckboxProps {
  label?: string;
  ariaLabel?: string;
  checked: boolean;
  className?: string;
  labelClassName?: string;
  id?: string;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

const Checkbox: React.FC<CheckboxProps> = ({
  label,
  ariaLabel,
  checked,
  id,
  onChange,
  className = "",
  labelClassName = "text-sm font-medium text-gray-800",
  disabled = false,
}) => {
  return (
    <label
      className={`group inline-flex items-center space-x-3 ${
        disabled ? "cursor-default opacity-70" : "cursor-pointer"
      }`}
    >
      <div className="relative h-5 w-5">
        <input
          id={id}
          type="checkbox"
          aria-label={ariaLabel}
          className={`h-5 w-5 cursor-pointer appearance-none rounded-md border border-gray-300 checked:border-transparent checked:bg-brand-500 disabled:cursor-default disabled:border-gray-300 disabled:bg-gray-200 disabled:checked:bg-gray-300 ${className}`}
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          disabled={disabled}
        />
        {checked && (
          <svg
            className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 transform"
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 14 14"
            fill="none"
          >
            <path
              d="M11.6666 3.5L5.24992 9.91667L2.33325 7"
              stroke={disabled ? "#E4E7EC" : "white"}
              strokeWidth="1.94437"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </div>
      {label && <span className={labelClassName}>{label}</span>}
    </label>
  );
};

export default Checkbox;
