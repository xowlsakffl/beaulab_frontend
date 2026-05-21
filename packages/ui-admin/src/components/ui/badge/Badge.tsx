import React from "react";

type BadgeVariant = "light" | "solid";
type BadgeSize = "sm" | "md";
type BadgeColor =
  | "primary"
  | "success"
  | "error"
  | "warning"
  | "pink"
  | "info"
  | "light";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
  color?: BadgeColor;
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
  children: React.ReactNode;
}

const sizeStyles: Record<BadgeSize, string> = {
  sm: "text-theme-xs",
  md: "text-sm",
};

const variantStyles: Record<BadgeVariant, Record<BadgeColor, string>> = {
  light: {
    primary: "bg-brand-50 text-brand-500  ",
    success: "bg-success-50 text-success-600  ",
    error: "bg-error-50 text-error-600  ",
    warning: "bg-warning-50 text-warning-600  ",
    pink: "bg-[#FA2875]/10 text-[#FA2875]  ",
    info: "bg-blue-light-50 text-blue-light-500  ",
    light: "bg-gray-100 text-gray-700  ",
  },
  solid: {
    primary: "bg-brand-500 text-white ",
    success: "bg-success-500 text-white ",
    error: "bg-error-500 text-white ",
    warning: "bg-warning-500 text-white ",
    pink: "bg-[#FA2875] text-white ",
    info: "bg-blue-light-500 text-white ",
    light: "bg-gray-400  text-white ",
  },
};

const Badge: React.FC<BadgeProps> = ({
  variant = "light",
  color = "primary",
  size = "md",
  startIcon,
  endIcon,
  children,
  className,
  ...props
}) => {
  const baseStyles = "inline-flex items-center justify-center gap-1 rounded-full px-2.5 py-0.5 font-medium";
  const composedClassName = [baseStyles, sizeStyles[size], variantStyles[variant][color], className]
    .filter(Boolean)
    .join(" ");

  return (
    <span className={composedClassName} {...props}>
      {startIcon ? <span className="mr-1">{startIcon}</span> : null}
      {children}
      {endIcon ? <span className="ml-1">{endIcon}</span> : null}
    </span>
  );
};

export { Badge };
export default Badge;
