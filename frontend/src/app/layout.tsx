import type { Metadata } from "next";
import { Toaster } from "sonner";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "vietnamese"],
});

export const metadata: Metadata = {
  title: "Vouchify - Hệ thống E-Voucher & Partner Portal",
  description: "Hệ thống quản lý đối tác & e-voucher Vouchify",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <head>
        {/* Material Symbols is an icon glyph set, not an application text font. */}
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
        />
      </head>
      <body className={`${inter.variable} antialiased min-h-screen bg-background text-on-background`}>
        {children}
        <Toaster position="bottom-right" richColors />
      </body>
    </html>
  );
}
