"use client";

import * as React from "react";

import { cn } from "../../../lib/utils";

type CardProps = React.HTMLAttributes<HTMLElement> & {
  as?: React.ElementType;
};

function Card({ as: Component = "div", className, children, ...props }: CardProps) {
  return (
    <Component
      data-slot="card"
      className={cn("rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]", className)}
      {...props}
    >
      {children}
    </Component>
  );
}

function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div data-slot="card-header" className={cn("space-y-1", className)} {...props} />;
}

function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h3 data-slot="card-title" className={cn("text-base font-semibold text-gray-800 dark:text-white/90", className)} {...props} />;
}

function CardDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p data-slot="card-description" className={cn("text-sm text-gray-500 dark:text-gray-400", className)} {...props} />;
}

function CardContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div data-slot="card-content" className={cn(className)} {...props} />;
}

function CardFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div data-slot="card-footer" className={cn(className)} {...props} />;
}

export { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle };

export default Card;
