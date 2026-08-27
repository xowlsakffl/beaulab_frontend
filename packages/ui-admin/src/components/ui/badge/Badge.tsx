import React from "react";

export type BadgeVariant = "light" | "solid";
export type BadgeSize = "sm" | "md";
export type BadgeColor =
  | "primary"
  | "success"
  | "error"
  | "warning"
  | "pink"
  | "info"
  | "light"
  | "red"
  | "orange"
  | "yellow"
  | "green"
  | "blue"
  | "purple"
  | "gray";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
  color?: BadgeColor;
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
  children: React.ReactNode;
}

export interface StatusValueBadgeProps extends Omit<BadgeProps, "children"> {
  label?: React.ReactNode;
  empty?: React.ReactNode;
}

const sizeStyles: Record<BadgeSize, string> = {
  sm: "text-theme-xs",
  md: "text-sm",
};

const variantStyles: Record<BadgeVariant, Record<BadgeColor, string>> = {
  light: {
    primary: "bg-brand-50 text-brand-500",
    success: "bg-success-50 text-success-600",
    error: "bg-error-50 text-error-600",
    warning: "bg-warning-50 text-warning-600",
    pink: "bg-[#FA2875]/10 text-[#FA2875]",
    info: "bg-blue-light-50 text-blue-light-500",
    light: "bg-gray-100 text-gray-700",
    red: "bg-red-100 text-red-700",
    orange: "bg-[#FFF1E8] text-[#D65600]",
    yellow: "bg-yellow-100 text-yellow-800",
    green: "bg-green-100 text-green-700",
    blue: "bg-blue-100 text-blue-700",
    purple: "bg-purple-100 text-purple-700",
    gray: "bg-gray-100 text-gray-700",
  },
  solid: {
    primary: "bg-brand-500 text-white",
    success: "bg-success-500 text-white",
    error: "bg-error-500 text-white",
    warning: "bg-warning-500 text-white",
    pink: "bg-[#FA2875] text-white",
    info: "bg-blue-light-500 text-white",
    light: "bg-gray-400 text-white",
    red: "bg-red-500 text-white",
    orange: "bg-[#D65600] text-white",
    yellow: "bg-yellow-200 text-yellow-900",
    green: "bg-green-500 text-white",
    blue: "bg-blue-500 text-white",
    purple: "bg-purple-500 text-white",
    gray: "bg-gray-500 text-white",
  },
};

export function getBadgeColorClassName(color: BadgeColor, variant: BadgeVariant = "light") {
  return variantStyles[variant][color];
}

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
  const baseStyles =
    "inline-flex items-center justify-center gap-1 whitespace-nowrap rounded-full px-2.5 py-0.5 font-medium";
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

const StatusValueBadge: React.FC<StatusValueBadgeProps> = ({
  label,
  color = "light",
  size = "sm",
  variant = "light",
  empty = <span className="text-sm text-gray-400">-</span>,
  ...props
}) => {
  if (label == null || (typeof label === "string" && (!label.trim() || label.trim() === "-"))) {
    return <>{empty}</>;
  }

  return (
    <Badge size={size} color={color} variant={variant} {...props}>
      {label}
    </Badge>
  );
};

export { Badge, StatusValueBadge };
export default Badge;
