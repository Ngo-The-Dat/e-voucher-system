"use client";

import TopAppBar from "@/components/layout/TopAppBar";
import Pagination from "@/components/ui/Pagination";
import VoucherStatusBadge from "@/components/ui/VoucherStatusBadge";
import Icon from "@/components/ui/Icon";
import Link from "next/link";
import { useState } from "react";
import { useVouchers } from "@/hooks/useVouchers";
import { VoucherApprovalStatus } from "@/lib/types/voucher";

const ITEMS_PER_PAGE = 10;

const TABS: { id: string; label: string }[] = [
  { id: "all", label: "Tất cả" },
  { id: "draft", label: "Chưa gửi duyệt" },
  { id: "pending", label: "Đang chờ duyệt" },
  { id: "approved", label: "Đã duyệt" },
  { id: "rejected", label: "Từ chối" },
];

export default function VouchersPage() {
  const { vouchers, isLoading } = useVouchers();
  const [activeTab, setActiveTab] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // Filter vouchers by status tab & search query
  const filteredVouchers = vouchers.filter((v) => {
    if (activeTab !== "all" && v.status !== activeTab) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      return (
        v.title.toLowerCase().includes(q) ||
        v.code.toLowerCase().includes(q) ||
        v.categoryName.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredVouchers.length / ITEMS_PER_PAGE));
  const paginatedVouchers = filteredVouchers.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Khi đổi tab hoặc search → về trang 1
  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    setCurrentPage(1);
  };
  const handleSearch = (q: string) => {
    setSearchQuery(q);
    setCurrentPage(1);
  };

  // Tab counts
  const countByStatus = (status: VoucherApprovalStatus) =>
    vouchers.filter((v) => v.status === status).length;

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-background min-h-screen w-full">
      <TopAppBar title="Quản lý voucher" />

      <main className="p-6 md:p-8 flex-1 overflow-y-auto w-full max-w-none space-y-6">
        {/* Header Tabs & Actions */}
        <div className="bg-surface-bright rounded-xl border border-outline-variant p-4 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center shadow-sm">
          {/* Status Tabs */}
          <div className="flex flex-wrap gap-2.5">
            {TABS.map((tab) => {
              const count =
                tab.id === "all"
                  ? vouchers.length
                  : countByStatus(tab.id as VoucherApprovalStatus);
              const isSelected = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`px-4 py-2.5 rounded-full text-base font-semibold transition-colors border flex items-center gap-2 ${
                    isSelected
                      ? "bg-primary text-on-primary border-primary shadow-sm"
                      : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high border-outline-variant"
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                      isSelected
                        ? "bg-on-primary text-primary"
                        : "bg-surface-container-highest text-on-surface-variant"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Create Button */}
          <Link
            href="/partner/vouchers/create"
            className="bg-primary hover:bg-surface-tint text-on-primary font-bold text-base px-5 py-2.5 rounded-lg flex items-center gap-2 transition-colors whitespace-nowrap shadow-sm"
          >
            <Icon name="add" className="text-[20px]" />
            Tạo voucher mới
          </Link>
        </div>

        {/* Search Bar */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Icon name="search" className="absolute left-3.5 top-1/2 -translate-y-1/2 text-outline text-lg" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Tìm kiếm theo Tên chương trình, Mã chương trình, Danh mục..."
              className="w-full pl-11 pr-4 py-2.5 rounded-lg border border-outline-variant bg-surface-bright text-base text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary transition-all"
            />
          </div>
        </div>

        {/* Table */}
        <div className="bg-surface-bright rounded-xl border border-outline-variant overflow-hidden shadow-sm w-full">
          {isLoading ? (
            <table className="w-full">
              <tbody>
                {Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-outline-variant animate-pulse">
                    {Array.from({ length: 5 }).map((__, j) => (
                      <td key={j} className="py-4 px-4">
                        <div className="h-4 bg-surface-container-high rounded w-4/5" />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          ) : filteredVouchers.length === 0 ? (
            <div className="p-12 text-center text-on-surface-variant">
              <Icon name="confirmation_number" className="text-5xl text-outline mb-2" />
              <p className="font-semibold text-lg">
                Không tìm thấy chương trình voucher nào phù hợp.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-container-low border-b border-outline-variant">
                    <th className="py-4 px-4 text-base font-semibold text-on-surface-variant whitespace-nowrap">
                      Tên chương trình
                    </th>
                    <th className="py-4 px-4 text-base font-semibold text-on-surface-variant whitespace-nowrap">
                      Mã chương trình
                    </th>
                    <th className="py-4 px-4 text-base font-semibold text-on-surface-variant whitespace-nowrap">
                      Danh mục
                    </th>
                    <th className="py-4 px-4 text-base font-semibold text-on-surface-variant whitespace-nowrap">
                      Trạng thái
                    </th>
                    <th className="py-4 px-4 text-base font-semibold text-on-surface-variant text-center whitespace-nowrap">
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <tbody className="text-base text-on-surface divide-y divide-outline-variant">
                  {paginatedVouchers.map((item) => (
                    <tr key={item.id} className="hover:bg-surface-container-low/40 transition-colors">
                      <td className="py-4 px-4 font-bold text-on-surface">
                        <Link
                          href={`/vouchers/${item.id}`}
                          className="hover:text-primary transition-colors text-base"
                        >
                          {item.title}
                        </Link>
                      </td>

                      <td className="py-4 px-4 text-on-surface-variant font-semibold whitespace-nowrap">
                        {item.code}
                      </td>

                      <td className="py-4 px-4 whitespace-nowrap">
                        <span className="px-3 py-1 bg-surface-container-high rounded-full text-xs font-semibold border border-outline-variant inline-block whitespace-nowrap">
                          {item.categoryName || "Khác"}
                        </span>
                      </td>

                      <td className="py-4 px-4 whitespace-nowrap">
                        <VoucherStatusBadge status={item.status} />
                      </td>

                      <td className="py-4 px-4 text-center whitespace-nowrap">
                        <Link
                          href={`/vouchers/${item.id}`}
                          className="px-4 py-2 rounded-lg text-sm font-bold inline-flex items-center gap-1.5 bg-surface-container-high text-on-surface hover:bg-primary hover:text-on-primary border border-outline-variant transition-colors shadow-sm"
                        >
                          <Icon name="visibility" className="text-base" />
                          <span>Xem chi tiết</span>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredVouchers.length}
            itemsPerPage={ITEMS_PER_PAGE}
            onPageChange={(page) => setCurrentPage(page)}
          />
        </div>
      </main>
    </div>
  );
}
