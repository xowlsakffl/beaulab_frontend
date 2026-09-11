import type { ReactNode } from "react";
import { Label } from "@beaulab/ui-admin";

export function PromotionFormField({
  label,
  htmlFor,
  required = false,
  error,
  children,
}: {
  label: string;
  htmlFor?: string;
  required?: boolean;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="grid min-w-0 grid-cols-[6rem_minmax(0,1fr)] items-start gap-3">
      <Label htmlFor={htmlFor} className="mb-0 pt-2 text-xs font-semibold text-gray-500">
        {label}
        {required ? <span className="ml-0.5 text-brand-500">*</span> : null}
      </Label>
      <div className="min-w-0">
        {children}
        {error ? (
          <p role="alert" className="mt-1.5 text-xs text-error-500">
            {error}
          </p>
        ) : null}
      </div>
    </div>
  );
}
