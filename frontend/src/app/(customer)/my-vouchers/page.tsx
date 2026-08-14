"use client";

import Link from "next/link";
import { useState } from "react";
import { useApp } from "@/context/AppContext";
import MyVoucherCard from "@/components/customer/cards/MyVoucherCard";
import ReviewModal from "@/components/customer/ReviewModal";
import { MyVoucher, Voucher } from "@/data/mockData";
import { ChevronRight, Search, Ticket } from "lucide-react";

export default function MyVouchersPage() {
  const { myVouchers, vouchers, addReview } = useApp();

  // Local Page Filters
  const [activeTab, setActiveTab] = useState<"all" | "unused" | "used" | "expiring" | "expired">("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBrand, setSelectedBrand] = useState("");
  const [selectedReviewItem, setSelectedReviewItem] = useState<{ myVoucher: MyVoucher; voucher: Voucher } | null>(null);

  const handleTabClick = (tab: "all" | "unused" | "used" | "expiring" | "expired") => {
    setActiveTab(tab);
  };

  // Filter logic
  const filteredMyVouchers = myVouchers.filter((item) => {
    // Lookup associated base voucher details
    const baseVoucher = vouchers.find((v) => v.id === item.voucherId) || {
      id: item.voucherId,
      title: `Voucher #${item.voucherId}`,
      brand: "Thương hiệu đối tác",
      brandLogo: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80",
      category: "Ưu đãi",
      thumbnail: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&auto=format&fit=crop&q=80",
      images: ["https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&auto=format&fit=crop&q=80"],
      price: 0,
      rating: 5,
      reviewsCount: 0,
      soldCount: "0",
    };

    // 1. Filter by Tab Status
    if (activeTab !== "all" && item.status !== activeTab) {
      return false;
    }

    // 2. Filter by Search Query (title, brand, code)
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim();
      const matchTitle = baseVoucher.title.toLowerCase().includes(q);
      const matchBrand = baseVoucher.brand.toLowerCase().includes(q);
      const matchCode = item.code.toLowerCase().includes(q);
      if (!matchTitle && !matchBrand && !matchCode) return false;
    }

    // 3. Filter by Brand selector
    if (selectedBrand) {
      if (baseVoucher.brand !== selectedBrand) return false;
    }

    return true;
  });

  // Extract unique brands present in my vouchers for filter dropdown
  const uniqueBrands: string[] = [];
  myVouchers.forEach((item) => {
    const baseVoucher = vouchers.find((v) => v.id === item.voucherId);
    if (baseVoucher && !uniqueBrands.includes(baseVoucher.brand)) {
      uniqueBrands.push(baseVoucher.brand);
    }
  });

  const getUnusedCount = () => {
    return myVouchers.filter((item) => item.status === "unused" || item.status === "expiring").length;
  };

  return (
    <main className="flex-grow w-full max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-8">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 mb-6">
        <Link href="/" className="font-label-md text-label-md text-text-muted hover:text-primary transition-colors">
          Trang chủ
        </Link>
        <ChevronRight className="w-4 h-4 text-text-muted" />
        <span className="font-label-md text-label-md font-semibold text-on-surface">Voucher của tôi</span>
      </nav>

      {/* Page Header */}
      <div className="mb-8">
        <h1 className="font-headline-lg text-headline-lg font-bold text-text-main">Voucher của tôi</h1>
      </div>

      {/* Main Area */}
      <div className="flex flex-col gap-6">
          {/* Status Tabs */}
          <div className="flex overflow-x-auto border-b border-outline-variant no-scrollbar">
            {[
              { id: "all", label: "Tất cả" },
              { id: "unused", label: "Chưa sử dụng", count: getUnusedCount() },
              { id: "used", label: "Đã sử dụng" },
              { id: "expiring", label: "Sắp hết hạn" },
              { id: "expired", label: "Đã hết hạn" }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab.id as any)}
                className={`px-6 py-3 font-label-md text-label-md whitespace-nowrap transition-colors border-b-2 cursor-pointer font-bold ${
                  activeTab === tab.id
                    ? "text-primary border-primary"
                    : "text-on-surface-variant border-transparent hover:text-primary"
                }`}
              >
                {tab.label}
                {tab.count !== undefined && tab.count > 0 && (
                  <span className="ml-1 bg-surface-container-high text-on-surface-variant px-2 py-0.5 rounded-full text-xs">
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Search & Brand Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-surface-container-low p-4 rounded-lg border border-outline-variant">
            <div className="relative w-full sm:w-96">
              <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm kiếm theo tên hoặc mã voucher..."
                className="w-full bg-surface-lowest border border-outline-variant rounded-md py-2 pl-10 pr-4 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary font-body-md text-body-md text-on-surface shadow-sm"
              />
            </div>
            <div className="w-full sm:w-auto flex items-center gap-2">
              <span className="font-label-md text-label-md text-on-surface-variant whitespace-nowrap font-bold">
                Lọc theo:
              </span>
              <select
                value={selectedBrand}
                onChange={(e) => setSelectedBrand(e.target.value)}
                className="w-full sm:w-48 bg-surface-lowest border border-outline-variant rounded-md py-2 px-3 focus:outline-none focus:border-primary font-body-md text-body-md text-on-surface shadow-sm cursor-pointer"
              >
                <option value="">Tất cả thương hiệu</option>
                {uniqueBrands.map((brand) => (
                  <option key={brand} value={brand}>
                    {brand}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Vouchers Grid */}
          {filteredMyVouchers.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-fadeIn">
              {filteredMyVouchers.map((item) => {
                const baseVoucher = vouchers.find((v) => v.id === item.voucherId) || {
                  id: item.voucherId,
                  title: `Voucher #${item.voucherId}`,
                  brand: "Thương hiệu đối tác",
                  brandLogo: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80",
                  category: "Ưu đãi",
                  thumbnail: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&auto=format&fit=crop&q=80",
                  images: ["https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&auto=format&fit=crop&q=80"],
                  price: 0,
                  rating: 5,
                  reviewsCount: 0,
                  soldCount: "0",
                };
                return (
                  <MyVoucherCard
                    key={item.id}
                    myVoucher={item}
                    voucher={baseVoucher}
                    onOpenReview={(mv, v) => setSelectedReviewItem({ myVoucher: mv, voucher: v })}
                  />
                );
              })}
            </div>
          ) : (
            /* Empty State */
            <div className="flex flex-col items-center justify-center py-20 bg-surface rounded-xl border border-outline-variant border-dashed">
              <Ticket className="w-16 h-16 text-surface-variant mb-4" />
              <h3 className="font-title-md text-title-md font-bold text-on-surface mb-2">
                Chưa có voucher nào
              </h3>
              <p className="font-body-md text-body-md text-text-muted text-center max-w-md mb-6 px-4">
                Bạn chưa sở hữu voucher nào trong mục này hoặc không tìm thấy voucher khớp với bộ lọc.
              </p>
              <Link
                href="/vouchers"
                className="bg-primary text-on-primary px-6 py-2.5 rounded-lg font-label-md text-label-md font-semibold hover:opacity-95 transition-all shadow-sm"
              >
                Khám phá ngay
              </Link>
            </div>
          )}
      </div>

      {/* Review Modal */}
      {selectedReviewItem && (
        <ReviewModal
          isOpen={!!selectedReviewItem}
          onClose={() => setSelectedReviewItem(null)}
          voucherTitle={selectedReviewItem.voucher.title}
          voucherCode={selectedReviewItem.myVoucher.code}
          onSubmit={(rating, reviewContent, complaintContent) => {
            addReview(
              selectedReviewItem.voucher.id,
              "Khách hàng",
              rating,
              reviewContent,
              complaintContent
            );
          }}
        />
      )}
    </main>
  );
}
