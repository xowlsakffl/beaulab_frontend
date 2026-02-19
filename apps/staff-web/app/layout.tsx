import "./globals.css";
import "flatpickr/dist/flatpickr.css";
import { Outfit } from "next/font/google";

import type { ReactNode } from "react";
export default function RootLayout({
   children,
}: Readonly<{ children: ReactNode }>) {
    return (
        <html lang="ko">
        <body className={`dark:bg-gray-900`}>{children}</body>
        </html>
    );
}
