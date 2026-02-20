"use client";

import * as React from "react";

import { cn } from "../../../lib/utils";

type ButtonVariant =
  | "default"
  | "destructive"
  | "outline"
  | "secondary"
  | "ghost"
  | "link"
  | "brand";
type ButtonSize = "default" | "sm" | "lg" | "icon" | "auth";

const baseClassName =
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-[color,box-shadow] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive";

const variantClassNames: Record<ButtonVariant, string> = {
  default: "bg-primary text-primary-foreground shadow-xs hover:bg-primary/90",
  destructive:
    "bg-destructive text-white shadow-xs hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40",
  outline: "border border-input bg-background shadow-xs hover:bg-accent hover:text-accent-foreground",
  secondary: "bg-secondary text-secondary-foreground shadow-xs hover:bg-secondary/80",
  ghost: "hover:bg-accent hover:text-accent-foreground",
  link: "text-primary underline-offset-4 hover:underline",
  brand: "bg-brand-500 text-white shadow-xs hover:bg-brand-600 focus-visible:ring-brand-500/20",
};

const sizeClassNames: Record<ButtonSize, string> = {
  default: "h-9 px-4 py-2 has-[>svg]:px-3",
  sm: "h-8 rounded-md px-3 has-[>svg]:px-2.5",
  lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
  icon: "size-9",
  auth: "h-11 rounded-lg px-5 py-3 has-[>svg]:px-4",
};

export interface ButtonProps extends React.ComponentProps<"button"> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  asChild?: boolean;
}

function Button({ className, variant = "default", size = "default", asChild = false, children, ...props }: ButtonProps) {
  const mergedClassName = cn(baseClassName, variantClassNames[variant], sizeClassNames[size], className);

  if (asChild && React.isValidElement(children)) {
    const child = React.Children.only(children) as React.ReactElement<{ className?: string }>;
    return React.cloneElement(child, {
      ...props,
      className: cn(mergedClassName, child.props.className),
    });
  }

  return (
    <button data-slot="button" className={mergedClassName} {...props}>
      {children}
    </button>
  );
}

const buttonVariants = ({ variant = "default", size = "default", className = "" }: Partial<ButtonProps>) =>
  cn(baseClassName, variantClassNames[variant], sizeClassNames[size], className);

export { Button, buttonVariants };

export default Button;
