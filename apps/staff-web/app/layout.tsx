import "./globals.css";
import type { ReactNode } from "react";
import { GlobalAlertProvider } from "@beaulab/ui-admin";

export default function RootLayout({
   children,
}: Readonly<{ children: ReactNode }>) {
    return (
        <html lang="ko">
        <body className="dark:bg-gray-900">
          <GlobalAlertProvider>{children}</GlobalAlertProvider>
        </body>
        </html>
    );
}
