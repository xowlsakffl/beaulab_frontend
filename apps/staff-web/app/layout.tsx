import "./globals.css";
import "flatpickr/dist/flatpickr.css";
import { Outfit } from "next/font/google";

import type { ReactNode } from "react";

const outfit = Outfit({ subsets: ["latin"] });

export default function RootLayout({
   children,
}: Readonly<{ children: ReactNode }>) {
    return (
        <html lang="en">
        <body className={`${outfit.className} dark:bg-gray-900`}>{children}</body>
        </html>
    );
}
