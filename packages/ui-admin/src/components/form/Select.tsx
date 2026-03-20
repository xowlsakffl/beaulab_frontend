"use client";

import React, { useState } from "react";
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
}

export const Select: React.FC<SelectProps> = ({
  options,
  id,
  name,
  placeholder = "Select an option",
  showPlaceholderOption = true,
  onChange,
  className = "",
  defaultValue = "",
  value,
}) => {
  const [uncontrolledValue, setUncontrolledValue] = useState<string>(defaultValue);
  const selectedValue = value ?? uncontrolledValue;

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
        className={`h-9 w-full cursor-pointer appearance-none rounded-lg border border-gray-300 bg-white pr-10 text-sm shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800 ${
          selectedValue ? "text-gray-800 dark:text-white/90" : "text-gray-400 dark:text-gray-400"
        } ${className}`}
        value={selectedValue}
        onChange={handleChange}
      >
        {showPlaceholderOption && (
          <option value="" disabled className="text-gray-700 dark:bg-gray-900 dark:text-gray-400">
            {placeholder}
          </option>
        )}
        {options.map((option) => (
          <option
            key={option.value}
            value={option.value}
            className="text-gray-700 dark:bg-gray-900 dark:text-gray-400"
          >
            {option.label}
          </option>
        ))}
      </select>

      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400">
        <ChevronDown className="size-4" />
      </span>
    </div>
  );
};

export default Select;
