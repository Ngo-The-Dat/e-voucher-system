"use client";

import Icon from "@/components/shared/ui/Icon";

import { useState } from "react";
import Link from "next/link";
import { Input } from "@/components/shared/ui/Input";
import { Button } from "@/components/shared/ui/Button";
import StatusBadge from "@/components/shared/ui/StatusBadge";
import Pagination from "@/components/shared/ui/Pagination";

interface ManagedVoucherItem {
  programCode: string;
  programName: string;
  partnerName: string;
  branchName: string;
  originalPrice: number;
  salePrice: number;
  stock: number;
  startDateSell: string;
  endDateSell: string;
  displayStatus: "PUBLISHED" | "HIDDEN" | "ENDED";
}

export default function ManageVouchersPage() {
  const [searchQuery, setSearchQuery] = useState("");
  type StatusTab = "ALL" | "PUBLISHED" | "HIDDEN" | "ENDED";
  const [statusTab, setStatusTab] = useState<StatusTab>("ALL");
  const [currentPage, setCurrentPage] = useState(1);

  const [vouchers, setVouchers] = useState<ManagedVoucherItem[]>([
    {
      programCode: "VCH-HG-050",
      programName: "Voucher 50.000đ áp dụng toàn hệ thống Highlands Coffee",
      partnerName: "Công ty Cổ phần DV Cà Phê Cao Nguyên (Highlands)",
      branchName: "Highlands Coffee - Chi nhánh Quận 1",
      originalPrice: 50000,
      salePrice: 35000,
      stock: 4500,
      startDateSell: "2026-08-01",
      endDateSell: "2026-09-05",
      displayStatus: "PUBLISHED",
    },
    {
      programCode: "VCH-KC-200",
      programName: "Buffet Lẩu Băng Chuyền Kichi Kichi Ưu Đãi 20%",
      partnerName: "Công ty Cổ phần Thương mại Dịch vụ Cổng Vàng (Golden Gate)",
      branchName: "Kichi Kichi - Vincom Đồng Khởi",
      originalPrice: 350000,
      salePrice: 280000,
      stock: 800,
      startDateSell: "2026-08-01",
      endDateSell: "2026-08-30",
      displayStatus: "PUBLISHED",
    },
    {
      programCode: "VCH-CGV-100",
      programName: "Vé Xem Phim 2D Cuối Tuần CGV Cinemas Tặng Popcorn",
      partnerName: "Công ty TNHH CJ CGV Việt Nam",
      branchName: "CGV Sư Vạn Hạnh Mall",
      originalPrice: 120000,
      salePrice: 79000,
      stock: 0,
      startDateSell: "2026-07-01",
      endDateSell: "2026-08-15",
      displayStatus: "HIDDEN",
    },
    {
      programCode: "VCH-PAUSE-02",
      programName: "Voucher Ưu Đãi Trà Sữa Tocotoco Mua 1 Tặng 1",
      partnerName: "Công ty TNHH Tocotoco Việt Nam",
      branchName: "Tocotoco - Chi nhánh Nguyễn Trãi",
      originalPrice: 60000,
      salePrice: 42000,
      stock: 1500,
      startDateSell: "2026-07-15",
      endDateSell: "2026-08-31",
      displayStatus: "HIDDEN",
    },
    {
      programCode: "VCH-EXPIRED-99",
      programName: "Chiến dịch Mùa Hè Rực Rỡ - Giảm 50% Vé Công Viên Nước",
      partnerName: "Công ty Du Lịch Đầm Sen",
      branchName: "Công viên Nước Đầm Sen",
      originalPrice: 200000,
      salePrice: 100000,
      stock: 0,
      startDateSell: "2026-06-01",
      endDateSell: "2026-07-31",
      displayStatus: "ENDED",
    },
  ]);

  const todayStr = "2026-08-04";

  const filteredVouchers = vouchers.filter((item) => {
    if (
      searchQuery &&
      !item.programName.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !item.programCode.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !item.partnerName.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }
    if (statusTab !== "ALL" && item.displayStatus !== statusTab) {
      return false;
    }
    return true;
  });

  const formatCurrency = (val: number) => {
    return val.toLocaleString("vi-VN") + " ₫";
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    const parts = dateStr.split("-");
    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
    return dateStr;
  };

  const handleUpdateStatus = (programCode: string, newStatus: "PUBLISHED" | "HIDDEN" | "ENDED") => {
    setVouchers((prev) =>
      prev.map((item) =>
        item.programCode === programCode
          ? {
              ...item,
              displayStatus: newStatus,
            }
          : item
      )
    );

    const statusTextMap = {
      PUBLISHED: "Đang bán",
      HIDDEN: "Tạm ngưng",
      ENDED: "Ngừng bán",
    };

    alert(`Bản xem trước: trạng thái voucher [${programCode}] đã được cập nhật cục bộ thành ${statusTextMap[newStatus]}.`);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Navigation Bar */}
      <div className="border-b border-slate-200 pb-1">
        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <span>VOUCHER</span>
          <span>&rsaquo;</span>
          <span className="text-slate-600">Quản lý voucher</span>
        </div>
        <div className="flex items-center gap-8">
          <Link
            href="/admin/vouchers/pending"
            className="pb-3 text-lg font-bold transition-all relative flex items-center gap-2.5 text-slate-400 hover:text-slate-700"
          >
            <span>Duyệt voucher</span>
            <span className="px-2.5 py-0.5 bg-blue-100 text-blue-700 text-xs font-bold rounded-full">
              3 chờ duyệt
            </span>
          </Link>
          <Link
            href="/admin/vouchers/manage"
            className="pb-3 text-lg font-bold transition-all relative flex items-center gap-2.5 text-slate-900 border-b-2 border-blue-600"
          >
            <span>Quản lý voucher</span>
          </Link>
        </div>
      </div>

      {/* Filter Header & Status Tabs */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4 sm:p-5 space-y-4">
        {/* Search Input & Quick Controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg z-10" />
            <Input
              type="text"
              placeholder="Nhập tên chương trình, mã voucher hoặc đối tác..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full h-[38px] pl-9 pr-3 border-slate-200 rounded-xl"
            />
          </div>

          {/* Quick Count Stats */}
          <div className="flex items-center gap-3 text-xs font-semibold text-slate-600">
            <span className="px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl">
              Đang bán: {vouchers.filter((v) => v.displayStatus === "PUBLISHED").length}
            </span>
            <span className="px-3 py-1.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-xl">
              Tạm ngưng: {vouchers.filter((v) => v.displayStatus === "HIDDEN").length}
            </span>
            <span className="px-3 py-1.5 bg-slate-100 text-slate-700 border border-slate-200 rounded-xl">
              Ngừng bán: {vouchers.filter((v) => v.displayStatus === "ENDED").length}
            </span>
          </div>
        </div>

        {/* Filter Tabs by Display Status (Bỏ chữ tiếng Anh) */}
        <div className="flex items-center gap-2 border-t border-slate-100 pt-3 overflow-x-auto">
          {[
            { key: "ALL", label: "Tất cả voucher", count: vouchers.length },
            {
              key: "PUBLISHED",
              label: "Đang bán",
              count: vouchers.filter((v) => v.displayStatus === "PUBLISHED").length,
            },
            {
              key: "HIDDEN",
              label: "Tạm ngưng",
              count: vouchers.filter((v) => v.displayStatus === "HIDDEN").length,
            },
            {
              key: "ENDED",
              label: "Ngừng bán",
              count: vouchers.filter((v) => v.displayStatus === "ENDED").length,
            },
          ].map((tab) => (
            <Button
              key={tab.key}
              variant={statusTab === tab.key ? "default" : "outline"}
              onClick={() => {
                setStatusTab(tab.key as any);
                setCurrentPage(1);
              }}
              className={`text-xs h-auto py-1.5 px-3.5 ${statusTab === tab.key ? "bg-blue-600 hover:bg-blue-700 text-white" : ""}`}
            >
              <span>{tab.label}</span>
              <span
                className={`px-2 py-0.5 text-[10px] rounded-full ml-2 ${
                  statusTab === tab.key ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700"
                }`}
              >
                {tab.count}
              </span>
            </Button>
          ))}
        </div>
      </div>

      {/* Bảng Danh Sách Quản Lý Voucher */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 text-slate-500 text-xs font-bold uppercase tracking-wider border-b border-slate-200/80">
                <th className="py-4 px-5">MÃ CHƯƠNG TRÌNH</th>
                <th className="py-4 px-5">TÊN CHƯƠNG TRÌNH VOUCHER</th>
                <th className="py-4 px-5">ĐỐI TÁC</th>
                <th className="py-4 px-5">GIÁ BÁN</th>
                <th className="py-4 px-5">SỐ LƯỢNG CÒN</th>
                <th className="py-4 px-5">HẠN BÁN</th>
                <th className="py-4 px-5">TRẠNG THÁI HIỂN THỊ</th>
                <th className="py-4 px-5 text-right">THAO TÁC</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-base">
              {filteredVouchers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 font-medium">
                    <Icon name="inventory_2" className="text-4xl block mb-2 text-slate-300" />
                    Không có voucher nào phù hợp với bộ lọc.
                  </td>
                </tr>
              ) : (
                filteredVouchers.map((item) => {
                  const isStockOut = item.stock <= 0;
                  const isExpired = item.endDateSell < todayStr;
                  const isRuleTriggered = isStockOut || isExpired;

                  return (
                    <tr key={item.programCode} className="hover:bg-slate-50/60 transition">
                      <td className="py-4 px-5 font-mono font-bold text-slate-800 text-xs">
                        {item.programCode}
                      </td>
                      <td className="py-4 px-5 max-w-xs">
                        <div className="font-bold text-slate-900 leading-snug line-clamp-2">
                          {item.programName}
                        </div>
                        {isRuleTriggered && (
                          <div className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 bg-amber-50 border border-amber-200 text-amber-800 text-[10px] font-bold rounded-md">
                            ⚠️ {isStockOut ? "Hết số lượng" : "Hết hạn bán"} (Đề xuất Ngừng bán)
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-5">
                        <div className="font-bold text-slate-800 text-xs">{item.partnerName}</div>
                        <div className="text-xs text-slate-500 mt-0.5">{item.branchName}</div>
                      </td>
                      <td className="py-4 px-5">
                        <div className="font-bold text-emerald-700">{formatCurrency(item.salePrice)}</div>
                        <div className="text-xs text-slate-400 line-through">
                          {formatCurrency(item.originalPrice)}
                        </div>
                      </td>
                      <td className="py-4 px-5">
                        <span
                          className={`font-bold text-xs ${
                            isStockOut ? "text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200" : "text-slate-800"
                          }`}
                        >
                          {item.stock.toLocaleString("vi-VN")} lượt
                        </span>
                      </td>
                      <td className="py-4 px-5 text-xs text-slate-700">
                        <div className="font-semibold">{formatDate(item.endDateSell)}</div>
                        <div className="text-[11px] text-slate-400">Từ {formatDate(item.startDateSell)}</div>
                      </td>
                      <td className="py-4 px-5">
                        <StatusBadge
                          status={item.displayStatus === "PUBLISHED" ? "active" : item.displayStatus === "HIDDEN" ? "pending" : "ended"}
                          label={item.displayStatus === "PUBLISHED" ? "Đang bán" : item.displayStatus === "HIDDEN" ? "Tạm ngưng" : "Ngừng bán"}
                        />
                      </td>
                      <td className="py-4 px-5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Nút Tạm ngưng */}
                          {item.displayStatus === "PUBLISHED" && (
                            <Button
                              variant="outline"
                              onClick={() => handleUpdateStatus(item.programCode, "HIDDEN")}
                              className="px-3 py-1.5 bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100 text-xs h-auto"
                              title="Tạm ngưng hiển thị bán trên sàn"
                            >
                              Tạm ngưng
                            </Button>
                          )}

                          {/* Nút Khôi phục về Đang bán */}
                          {item.displayStatus !== "PUBLISHED" && (
                            <Button
                              disabled={isRuleTriggered}
                              onClick={() => handleUpdateStatus(item.programCode, "PUBLISHED")}
                              className={`px-3 py-1.5 text-xs h-auto ${
                                isRuleTriggered
                                  ? "bg-slate-100 border border-slate-200 text-slate-400 cursor-not-allowed"
                                  : "bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-600 hover:text-white"
                              }`}
                              title={
                                isRuleTriggered
                                  ? "Đã hết số lượng phát hành hoặc quá hạn bán, không thể khôi phục!"
                                  : "Khôi phục trạng thái Đang bán"
                              }
                            >
                              Khôi phục
                            </Button>
                          )}

                          {/* Nút Ngừng bán */}
                          {item.displayStatus !== "ENDED" && (
                            <Button
                              variant="outline"
                              onClick={() => handleUpdateStatus(item.programCode, "ENDED")}
                              className="px-3 py-1.5 bg-slate-100 border-slate-200 text-slate-600 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 text-xs h-auto"
                              title="Ngừng bán chương trình voucher này"
                            >
                              Ngừng bán
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer & Phân trang */}
        <Pagination
          currentPage={currentPage}
          totalPages={Math.ceil(filteredVouchers.length / 10) || 1}
          totalItems={filteredVouchers.length}
          itemsPerPage={10}
          onPageChange={setCurrentPage}
          itemName="chương trình voucher"
        />
      </div>
    </div>
  );
}
