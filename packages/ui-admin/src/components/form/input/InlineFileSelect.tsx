"use client";

import React from "react";

import { Trash2 } from "../../../icons";
import { Button } from "../../ui/button/Button";

export type InlineFileSelectProps = {
  id?: string;
  name?: string;
  accept: string;
  fileName?: string | null;
  placeholder: string;
  helperText?: string;
  previewLabel?: string;
  previewFirst?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  error?: boolean;
  onChange: (file: File | null) => void | Promise<void>;
  onPreview?: () => void;
  onClear?: () => void;
};

export function InlineFileSelect({
  id,
  name,
  accept,
  fileName,
  placeholder,
  helperText,
  previewLabel = "원본보기",
  previewFirst = false,
  disabled = false,
  readOnly = false,
  error = false,
  onChange,
  onPreview,
  onClear,
}: InlineFileSelectProps) {
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const hasFile = Boolean(fileName);
  const selectButton = !readOnly ? (
    <Button
      type="button"
      variant="brand"
      size="sm"
      className="h-8 px-3 text-xs"
      disabled={disabled}
      onClick={() => inputRef.current?.click()}
    >
      파일선택
    </Button>
  ) : null;
  const previewButton =
    hasFile && onPreview ? (
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-8 px-3 text-xs"
        disabled={disabled}
        onClick={onPreview}
      >
        {previewLabel}
      </Button>
    ) : null;

  return (
    <div
      className={[
        "flex min-h-16 min-w-0 flex-wrap items-center gap-3 rounded-lg border px-3 py-2.5",
        error ? "border-error-500" : "border-gray-200",
        hasFile ? "bg-gray-50" : "bg-white",
      ].join(" ")}
    >
      <input
        ref={inputRef}
        id={id}
        name={name}
        type="file"
        accept={accept}
        className="hidden"
        disabled={disabled || readOnly}
        onChange={async (event) => {
          const selectedFile = event.target.files?.[0] ?? null;
          event.currentTarget.value = "";
          await onChange(selectedFile);
        }}
      />

      <div className="min-w-48 flex-1">
        <p
          className={[
            "min-w-0 text-xs leading-5 break-words",
            hasFile ? "font-medium break-all text-gray-700" : "text-gray-500",
          ].join(" ")}
          title={fileName || undefined}
        >
          {fileName || placeholder}
        </p>
        {helperText ? <p className="mt-0.5 text-[11px] leading-4 text-gray-400">{helperText}</p> : null}
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {previewFirst ? previewButton : selectButton}
        {previewFirst ? selectButton : previewButton}
        {hasFile && onClear && !readOnly ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="size-8 p-0 text-gray-500 hover:text-red-600"
            disabled={disabled}
            onClick={onClear}
            title="파일 삭제"
            aria-label="파일 삭제"
          >
            <Trash2 className="size-4" />
          </Button>
        ) : null}
      </div>
    </div>
  );
}

export default InlineFileSelect;
