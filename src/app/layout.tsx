import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "لوحة حدود المحافظ اليومية والشهرية",
  description: "تطبيق بسيط لإدارة حدود المحافظ وإدخال التحويلات والإيداعات.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <body className="bg-slate-100 text-slate-900 antialiased">{children}</body>
    </html>
  );
}
