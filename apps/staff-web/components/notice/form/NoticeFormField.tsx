import type { ReactNode } from "react";
import { Label } from "@beaulab/ui-admin";
import type { NoticeFieldName } from "@/lib/notice/form";

type NoticeFormFieldProps = {
  label: string;
  htmlFor?: string;
  target?: NoticeFieldName;
  required?: boolean;
  error?: string;
  children: ReactNode;
};

export function NoticeFormField({ label, htmlFor, target, required = false, error, children }: NoticeFormFieldProps) {
  return (
    <div
      className="grid grid-cols-[6rem_minmax(0,1fr)] items-start gap-3"
      data-field-target={target}
      tabIndex={target ? -1 : undefined}
    >
      <Label htmlFor={htmlFor} className="mb-0 pt-2 text-xs font-semibold text-gray-500">
        {label}
        {required ? <span className="ml-0.5 text-brand-500">*</span> : null}
      </Label>
      <div className="min-w-0">
        {children}
        {error ? <p className="mt-1.5 text-xs text-error-500">{error}</p> : null}
      </div>
    </div>
  );
}
