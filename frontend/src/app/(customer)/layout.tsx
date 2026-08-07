import { Suspense } from "react";
import { Inter } from "next/font/google";
import { AppProvider } from "@/context/AppContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin", "vietnamese"],
});

export default function CustomerLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className={`${inter.variable} flex flex-col min-h-screen font-sans`}>
      <AppProvider>
        <Suspense fallback={<div className="h-24 bg-surface-container-lowest" />}>
          <Header />
        </Suspense>
        <div className="flex-grow">
          {children}
        </div>
        <Footer />
      </AppProvider>
    </div>
  );
}
