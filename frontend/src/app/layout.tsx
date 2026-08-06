import { Suspense } from "react";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AppProvider } from "@/context/AppContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin", "vietnamese"],
});

export const metadata: Metadata = {
  title: "Lumina Marketplace - Nền tảng voucher hàng đầu Việt Nam",
  description: "Trải nghiệm mua sắm voucher thông minh, tiết kiệm tối đa tại Lumina Marketplace.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-background text-on-background">
        <AppProvider>
          <Suspense fallback={<div className="h-24 bg-surface-container-lowest" />}>
            <Header />
          </Suspense>
          <div className="flex-grow">
            {children}
          </div>
          <Footer />
        </AppProvider>
      </body>
    </html>
  );
}
