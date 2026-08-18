/**
 * =========================================================================================
 * FILE: page.tsx
 * VỊ TRÍ: frontend/src/app/admin/partners/manage/
 * VAI TRÒ TRONG HỆ THỐNG:
 *   - Màn hình Quản trị Danh sách Doanh nghiệp Đối tác đang hoạt động (UC-ADM-02).
 *   - Các tính năng:
 *       1. Hiển thị danh sách các đối tác đã được duyệt (Approved Partners).
 *       2. Tìm kiếm đa trường (Tên công ty, MST, Người đại diện, Email, SĐT).
 *       3. Lọc theo trạng thái hoạt động (ACTIVE: Đang hoạt động, LOCKED: Tạm khóa, INACTIVE: Ngưng hoạt động).
 *       4. Lọc theo khoảng ngày đăng ký.
 *       5. Xem số chi nhánh trực thuộc của từng đối tác.
 *       6. Điều hướng đến màn hình chi tiết quản trị đối tác `manage/[id]/page.tsx`.
 * =========================================================================================
 */

"use client";

import Icon from "@/components/shared/ui/Icon";
import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import { Input } from "@/components/shared/ui/Input";
import { Button } from "@/components/shared/ui/Button";
import FormField from "@/components/shared/ui/FormField";
import StatusBadge from "@/components/shared/ui/StatusBadge";
import Pagination from "@/components/shared/ui/Pagination";
import { adminApi, AdminPartnerListItem } from "@/lib/admin-api";

export default function ManagePartnersPage() {
  // ─── 1. State quản lý Bộ lọc & Phân trang ─────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);

  // ─── 2. State dữ liệu danh sách đối tác ───────────────────────────────────────────
  const [partners, setPartners] = useState<AdminPartnerListItem[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const itemsPerPage = 10;

  /**
   * ---------------------------------------------------------------------------------------
   * HÀM: fetchManagedPartners
   * MỤC ĐÍCH: Gọi API `adminApi.getManagedPartners` để lấy danh sách đối tác theo bộ lọc.
   * ---------------------------------------------------------------------------------------
   */
  const fetchManagedPartners = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await adminApi.getManagedPartners({
        search: searchQuery,
        status: statusFilter,
        startDate,
        endDate,
        page: currentPage,
        limit: itemsPerPage,
      });

      setPartners(res.partners ?? []);
      setTotalItems(res.pagination?.total ?? 0);
      setTotalPages(res.pagination?.totalPages ?? 1);
    } catch (err: any) {
      console.error("Lỗi tải danh sách đối tác quản lý:", err);
      setError(err?.message || "Không thể kết nối máy chủ.");
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, statusFilter, startDate, endDate, currentPage]);

  useEffect(() => {
    fetchManagedPartners();
  }, [fetchManagedPartners]);

  const formatDateDisplay = (dateStr?: string) => {
    if (!dateStr) return { date: "N/A", time: "" };
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return { date: dateStr, time: "" };
      const date = d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
      const time = d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
      return { date, time };
    } catch {
      return { date: dateStr, time: "" };
    }
  };

  const mapStatusLabel = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "Đang hoạt động";
      case "LOCKED":
        return "Tạm khóa";
      case "INACTIVE":
        return "Ngưng hoạt động";
      default:
        return status;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* ─── PHẦN 1: Top Navigation Bar ───────────────────────────────────────────── */}
      <div className="border-b border-slate-200 pb-1">
        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <span>ĐỐI TÁC</span>
          <span>&rsaquo;</span>
          <span className="text-slate-600">Quản lý đối tác</span>
        </div>
        <div className="flex items-center gap-8">
          <Link
            href="/admin/partners/pending"
            className="pb-3 text-lg font-bold transition-all relative flex items-center gap-2.5 text-slate-400 hover:text-slate-700"
          >
            <span>Duyệt hồ sơ đối tác</span>
          </Link>
          <Link
            href="/admin/partners/employee-pending"
            className="pb-3 text-lg font-bold transition-all relative flex items-center gap-2.5 text-slate-400 hover:text-slate-700"
          >
            <span>Duyệt nhân viên đối tác</span>
          </Link>
          <Link
            href="/admin/partners/manage"
            className="pb-3 text-lg font-bold transition-all relative flex items-center gap-2.5 text-slate-900 border-b-2 border-blue-600"
          >
            <span>Quản lý đối tác</span>
            <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full">
              {totalItems} đối tác
            </span>
          </Link>
        </div>
      </div>

      {/* ─── PHẦN 2: Card Bộ Lọc (3 cột) ──────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4 sm:p-5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Ô Tìm kiếm đối tác */}
          <div>
            <FormField label="Tên doanh nghiệp / ĐT / Email">
              <div className="relative">
                <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg z-10" />
                <Input
                  type="text"
                  placeholder="Nhập tên doanh nghiệp, MST, đại diện..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full h-[38px] pl-9 pr-3 border-slate-200 rounded-xl"
                />
              </div>
            </FormField>
          </div>

          {/* Bộ lọc ngày đăng ký */}
          <div>
            <DateRangePicker
              startDate={startDate}
              endDate={endDate}
              onStartDateChange={(val) => {
                setStartDate(val);
                setCurrentPage(1);
              }}
              onEndDateChange={(val) => {
                setEndDate(val);
                setCurrentPage(1);
              }}
              onReset={() => {
                setStartDate("");
                setEndDate("");
                setCurrentPage(1);
              }}
            />
          </div>

          {/* Dropdown lọc trạng thái hoạt động */}
          <div>
            <FormField label="Trạng thái hoạt động">
              <div className="relative">
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full h-[38px] pl-3 pr-8 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 appearance-none focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                >
                  <option value="ALL">Tất cả</option>
                  <option value="ACTIVE">Đang hoạt động</option>
                  <option value="LOCKED">Tạm khóa</option>
                  <option value="INACTIVE">Ngưng hoạt động</option>
                </select>
                <Icon name="expand_more" className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg pointer-events-none" />
              </div>
            </FormField>
          </div>
        </div>
      </div>

      {/* ─── PHẦN 3: Báo lỗi nếu có ────────────────────────────────────────────────── */}
      {error && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 text-xs text-rose-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon name="error" className="text-lg text-rose-500" />
            <span>{error}</span>
          </div>
          <Button variant="outline" onClick={fetchManagedPartners} className="text-xs text-rose-700 border-rose-200 bg-white">
            Thử lại
          </Button>
        </div>
      )}

      {/* ─── PHẦN 4: Bảng Đối Tác Đang Quản Lý (6 Cột) ────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs text-slate-500 font-medium">Đang tải danh sách đối tác...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 text-slate-500 text-xs font-bold uppercase tracking-wider border-b border-slate-200/80">
                  <th className="py-4 px-5">TÊN DOANH NGHIỆP</th>
                  <th className="py-4 px-5">ĐẠI DIỆN</th>
                  <th className="py-4 px-5">CHI NHÁNH</th>
                  <th className="py-4 px-5">NGÀY ĐĂNG KÝ</th>
                  <th className="py-4 px-5 whitespace-nowrap">TRẠNG THÁI</th>
                  <th className="py-4 px-5 text-right whitespace-nowrap">THAO TÁC</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-base">
                {partners.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="py-12 text-center text-slate-400 font-medium"
                    >
                      <Icon name="search_off" className="text-4xl block mb-2 text-slate-300 mx-auto" />
                      Không tìm thấy đối tác phù hợp với bộ lọc.
                    </td>
                  </tr>
                ) : (
                  partners.map((partner) => {
                    const { date, time } = formatDateDisplay(partner.registered_at);
                    return (
                      <tr
                        key={partner.user_id}
                        className="hover:bg-slate-50/60 transition"
                      >
                        {/* Tên Doanh Nghiệp & MST */}
                        <td className="py-4 px-5">
                          <p className="font-bold text-slate-900">{partner.business_name}</p>
                          <p className="text-xs text-slate-400 font-mono">MST: {partner.tax_code}</p>
                        </td>

                        {/* Người Đại Diện & Email */}
                        <td className="py-4 px-5 text-slate-800 font-medium">
                          <p className="font-semibold">{partner.representative_name}</p>
                          <p className="text-xs text-slate-400">{partner.email}</p>
                        </td>

                        {/* Số chi nhánh */}
                        <td className="py-4 px-5 whitespace-nowrap">
                          <span className="px-2.5 py-1 bg-slate-100 text-slate-700 font-bold rounded-lg text-xs inline-block min-w-[28px] text-center">
                            {partner.branches_count ?? 0} chi nhánh
                          </span>
                        </td>

                        {/* Ngày đăng ký */}
                        <td className="py-4 px-5 whitespace-nowrap">
                          <div className="font-bold text-slate-900 text-xs sm:text-sm">
                            {date}
                          </div>
                          <div className="text-xs text-slate-400 mt-0.5 font-mono">
                            {time}
                          </div>
                        </td>

                        {/* Badge Trạng thái hoạt động */}
                        <td className="py-4 px-5 whitespace-nowrap">
                          <StatusBadge status={mapStatusLabel(partner.activity_status)} />
                        </td>

                        {/* Nút Quản lý chi tiết */}
                        <td className="py-4 px-5 text-right whitespace-nowrap">
                          <Link
                            href={`/admin/partners/manage/${partner.user_id}`}
                            className="px-3.5 py-1.5 bg-blue-50 border border-blue-200 text-blue-600 hover:bg-blue-600 hover:text-white font-semibold text-xs rounded-xl transition shadow-2xs inline-block whitespace-nowrap"
                          >
                            Xem chi tiết
                          </Link>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* ─── PHẦN 5: Phân trang (Pagination) ────────────────────────────────────── */}
        {!isLoading && partners.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
            itemName="đối tác"
          />
        )}
      </div>
    </div>
  );
}

/**
 * -----------------------------------------------------------------------------------------
 * HELPER & COMPONENT PHỤ: DateRangePicker
 * -----------------------------------------------------------------------------------------
 */
const getPresetDates = (preset: string) => {
  const today = new Date();
  const formatDate = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  if (preset === "TODAY") {
    const dateStr = formatDate(today);
    return { start: dateStr, end: dateStr };
  }
  if (preset === "7_DAYS") {
    const start = new Date(today);
    start.setDate(today.getDate() - 6);
    return { start: formatDate(start), end: formatDate(today) };
  }
  if (preset === "30_DAYS") {
    const start = new Date(today);
    start.setDate(today.getDate() - 29);
    return { start: formatDate(start), end: formatDate(today) };
  }
  if (preset === "THIS_MONTH") {
    const start = new Date(today.getFullYear(), today.getMonth(), 1);
    const end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    return { start: formatDate(start), end: formatDate(end) };
  }
  if (preset === "LAST_MONTH") {
    const start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const end = new Date(today.getFullYear(), today.getMonth(), 0);
    return { start: formatDate(start), end: formatDate(end) };
  }
  return { start: "", end: "" };
};

const formatDisplayDate = (dateStr: string) => {
  if (!dateStr) return "";
  const parts = dateStr.split("-");
  if (parts.length !== 3) return dateStr;
  const [year, month, day] = parts;
  return `${day}/${month}/${year}`;
};

const getDateRangeLabel = (start: string, end: string) => {
  if (!start && !end) return "Tất cả thời gian";
  if (start && end) {
    if (start === end) return formatDisplayDate(start);
    return `${formatDisplayDate(start)} - ${formatDisplayDate(end)}`;
  }
  if (start) return `Từ ${formatDisplayDate(start)}`;
  if (end) return `Đến ${formatDisplayDate(end)}`;
  return "Tất cả thời gian";
};

function DateRangePicker({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  onReset,
}: {
  startDate: string;
  endDate: string;
  onStartDateChange: (val: string) => void;
  onEndDateChange: (val: string) => void;
  onReset: () => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleApplyPreset = (presetKey: string) => {
    if (presetKey === "ALL") {
      onReset();
    } else {
      const { start, end } = getPresetDates(presetKey);
      onStartDateChange(start);
      onEndDateChange(end);
    }
    setIsOpen(false);
  };

  const hasFilter = Boolean(startDate || endDate);
  const labelText = getDateRangeLabel(startDate, endDate);

  return (
    <FormField label="Ngày đăng ký">
      <div className="relative" ref={containerRef}>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`w-full h-[38px] px-3 bg-white border rounded-xl text-xs sm:text-sm font-medium flex items-center justify-between transition-all gap-2 shadow-2xs ${hasFilter
              ? "border-blue-500 bg-blue-50/40 text-blue-900 ring-2 ring-blue-500/10"
              : "border-slate-200 text-slate-700 hover:border-slate-300"
            }`}
        >
          <div className="flex items-center gap-2 truncate">
            <Icon name="calendar_today" className={`text-lg ${hasFilter ? "text-blue-600" : "text-slate-400"}`} />
            <span
              className={`truncate ${hasFilter ? "font-semibold text-slate-900" : "text-slate-400"
                }`}
            >
              {hasFilter ? labelText : "Tất cả thời gian"}
            </span>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {hasFilter && (
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  onReset();
                  setIsOpen(false);
                }}
                className="p-0.5 hover:bg-slate-200 rounded-full text-slate-400 hover:text-rose-500 transition cursor-pointer"
                title="Xóa bộ lọc ngày"
              >
                <Icon name="close" className="text-base" />
              </span>
            )}
            <Icon name={isOpen ? "expand_less" : "expand_more"} className="text-lg text-slate-400" />
          </div>
        </button>

        {isOpen && (
          <div className="absolute left-0 sm:left-auto sm:right-0 lg:left-0 top-full mt-2 z-50 w-72 sm:w-80 bg-white rounded-2xl border border-slate-200 shadow-xl p-4 space-y-3.5 animate-in fade-in duration-150">
            <div>
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                Lọc nhanh
              </div>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { label: "Tất cả", key: "ALL" },
                  { label: "Hôm nay", key: "TODAY" },
                  { label: "7 ngày qua", key: "7_DAYS" },
                  { label: "30 ngày qua", key: "30_DAYS" },
                  { label: "Tháng này", key: "THIS_MONTH" },
                  { label: "Tháng trước", key: "LAST_MONTH" },
                ].map((item) => (
                  <Button
                    key={item.key}
                    variant="outline"
                    type="button"
                    onClick={() => handleApplyPreset(item.key)}
                    className="px-2.5 py-1 text-xs text-slate-600 bg-slate-50 border-slate-200 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 h-auto"
                  >
                    {item.label}
                  </Button>
                ))}
              </div>
            </div>

            <div className="border-t border-slate-100 pt-3">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                Tùy chỉnh ngày
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-medium text-slate-500 mb-1">
                    Từ ngày
                  </label>
                  <Input
                    type="date"
                    value={startDate}
                    max={endDate || undefined}
                    onChange={(e) => onStartDateChange(e.target.value)}
                    className="w-full h-[32px] px-2.5 py-1.5 bg-slate-50 border-slate-200 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-500 mb-1">
                    Đến ngày
                  </label>
                  <Input
                    type="date"
                    value={endDate}
                    min={startDate || undefined}
                    onChange={(e) => onEndDateChange(e.target.value)}
                    className="w-full h-[32px] px-2.5 py-1.5 bg-slate-50 border-slate-200 rounded-lg text-xs"
                  />
                </div>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-3 flex items-center justify-between">
              <Button
                variant="ghost"
                type="button"
                onClick={() => {
                  onReset();
                }}
                className="text-xs text-slate-400 hover:text-rose-500 p-0 h-auto"
              >
                Xóa chọn
              </Button>
              <Button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs h-auto"
              >
                Áp dụng
              </Button>
            </div>
          </div>
        )}
      </div>
    </FormField>
  );
}
