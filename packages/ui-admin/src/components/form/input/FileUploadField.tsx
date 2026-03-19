"use client";

import React from "react";
import Label from "../Label";
import FileInput from "./FileInput";

type FileUploadFieldProps = {
  id: string;
  name: string;
  label: string;
  accept: string;
  multiple?: boolean;
  error?: string;
  description: string;
  onChange: (files: FileList | null) => void;
};

export function FileUploadField({
  id,
  name,
  label,
  accept,
  multiple = false,
  error,
  description,
  onChange,
}: FileUploadFieldProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <FileInput
        id={id}
        name={name}
        accept={accept}
        multiple={multiple}
        onChange={(event) => onChange(event.target.files)}
      />
      <p className={`text-xs ${error ? "text-error-500" : "text-gray-500"}`}>{error || description}</p>
    </div>
  );
}

export default FileUploadField;
