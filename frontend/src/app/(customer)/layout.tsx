import { Suspense } from "react";
import { AppProvider } from "@/context/AppContext";
import Header from "@/components/customer/layout/Header";
import Footer from "@/components/customer/layout/Footer";

export default function CustomerLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex flex-col min-h-screen font-sans">
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
