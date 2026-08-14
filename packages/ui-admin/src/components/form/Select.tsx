"use client";

import React, { useState } from "react";
import { twMerge } from "tailwind-merge";
import { ChevronDown } from "../../icons";

interface Option {
  value: string;
  label: string;
}

interface SelectProps {
  options: Option[];
  id?: string;
  name?: string;
  placeholder?: string;
  showPlaceholderOption?: boolean;
  onChange: (value: string) => void;
  className?: string;
  defaultValue?: string;
  value?: string;
  disabled?: boolean;
}

export const Select: React.FC<SelectProps> = ({
  options,
  id,
  name,
  placeholder = "선택",
  showPlaceholderOption = true,
  onChange,
  className = "",
  defaultValue = "",
  value,
  disabled = false,
}) => {
  const [uncontrolledValue, setUncontrolledValue] = useState<string>(defaultValue);
  const selectedValue = value ?? uncontrolledValue;
  const hasSelectedOption = options.some((option) => option.value === selectedValue);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nextValue = e.target.value;

    if (value === undefined) {
      setUncontrolledValue(nextValue);
    }

    onChange(nextValue);
  };

  return (
    <div className="relative">
      <select
        id={id}
        name={name}
        className={twMerge(
          "w-full cursor-pointer appearance-none rounded-lg border border-gray-300 bg-white px-4 pr-10 text-sm shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 focus:outline-hidden",
          hasSelectedOption ? "text-gray-800" : "text-gray-400",
          disabled ? "cursor-not-allowed opacity-60" : undefined,
          className,
          "h-11",
        )}
        value={selectedValue}
        onChange={handleChange}
        disabled={disabled}
      >
        {showPlaceholderOption && (
          <option value="" disabled className="text-gray-700">
            {placeholder}
          </option>
        )}
        {options.map((option) => (
          <option key={option.value} value={option.value} className="text-gray-700">
            {option.label}
          </option>
        ))}
      </select>

      <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-gray-500">
        <ChevronDown className="size-4" />
      </span>
    </div>
  );
};

export default Select;
