import React, { FC, InputHTMLAttributes } from "react";
import { twMerge } from "tailwind-merge";

interface FileInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  className?: string;
}

const FileInput: FC<FileInputProps> = ({ className = "", ...props }) => {
  return (
    <input
      type="file"
      className={twMerge(
        "focus:border-ring-brand-300 w-full overflow-hidden rounded-lg border border-gray-300 bg-transparent text-sm text-gray-500 shadow-theme-xs transition-colors file:mr-3 file:h-full file:cursor-pointer file:rounded-l-lg file:border-0 file:border-r file:border-solid file:border-gray-200 file:bg-gray-50 file:px-4 file:text-xs file:text-gray-700 placeholder:text-gray-400 hover:file:bg-gray-100 focus:outline-hidden focus:file:ring-brand-300",
        className,
        "h-11",
      )}
      {...props}
    />
  );
};

export default FileInput;
