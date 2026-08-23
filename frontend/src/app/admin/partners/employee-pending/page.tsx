/**
 * =========================================================================================
 * FILE: page.tsx
 * VỊ TRÍ: frontend/src/app/admin/partners/employee-pending/
 * VAI TRÒ TRONG HỆ THỐNG:
 *   - Trang Giao diện Hàng đợi Xét duyệt Nhân viên Đối tác (Admin Queue).
 *   - Thực hiện chức năng (UC-ADM-04):
 *       1. Hiển thị danh sách nhân viên do các doanh nghiệp đối tác đăng ký đang chờ Admin phê duyệt.
 *       2. Tìm kiếm theo từ khóa (tên nhân viên, email, SĐT, CCCD, tên công ty, tên chi nhánh).
 *       3. Lọc theo khoảng ngày nộp hồ sơ (Presets hoặc DatePicker).
 *       4. Phân trang dữ liệu và chuyển hướng đến trang chi tiết hồ sơ `[id]/page.tsx`.
 * =========================================================================================
 */

"use client";

import Icon from "@/components/shared/ui/Icon";
import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/shared/ui/Button";
import { Input } from "@/components/shared/ui/Input";
import FormField from "@/components/shared/ui/FormField";
import Pagination from "@/components/shared/ui/Pagination";
import { adminApi, AdminPendingEmployeeListItem } from "@/lib/admin-api";

export default function EmployeePendingApprovalsPage() {
  // ─── 1. State quản lý Bộ lọc & Phân trang ─────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // ─── 2. State quản lý Dữ liệu & Trạng thái tải ─────────────────────────────────────
  const [employees, setEmployees] = useState<AdminPendingEmployeeListItem[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const itemsPerPage = 10;

  /**
   * ---------------------------------------------------------------------------------------
   * HÀM: fetchPendingEmployees
   * MỤC ĐÍCH: Gọi API lấy danh sách hồ sơ nhân viên đang chờ duyệt (status = 'PENDING').
   * 
   * TẠI SAO DÙNG useCallback?
   *   - Giúp ghi nhớ (memoize) định nghĩa hàm giữa các lần render của component.
   *   - Hàm chỉ được tạo lại khi một trong các dependencies (searchQuery, startDate, endDate, currentPage) thay đổi.
   *   - Tránh việc hàm bị tạo mới liên tục làm trigger re-render không cần thiết trong useEffect.
   * ---------------------------------------------------------------------------------------
   */
  const fetchPendingEmployees = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await adminApi.getPendingEmployees({
        search: searchQuery,
        status: "PENDING", // Luôn cố định trạng thái chờ duyệt tại trang này
        startDate,
        endDate,
        page: currentPage,
        limit: itemsPerPage,
      });

      setEmployees(res.employees ?? []);
      setTotalItems(res.pagination?.total ?? 0);
      setTotalPages(res.pagination?.totalPages ?? 1);
    } catch (err: any) {
      console.error("Lỗi tải danh sách duyệt nhân viên:", err);
      setError(err?.message || "Không thể kết nối máy chủ.");
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, startDate, endDate, currentPage]);

  /**
   * Tự động gọi API tải dữ liệu khi component được mount hoặc khi bộ lọc/trang thay đổi
   */
  useEffect(() => {
    fetchPendingEmployees();
  }, [fetchPendingEmployees]);

  /**
   * Định dạng ngày giờ hiển thị theo chuẩn Việt Nam (DD/MM/YYYY HH:mm)
   */
  const formatDateDisplay = (dateStr?: string | null) => {
    if (!dateStr) return "N/A";
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* ─── PHẦN 1: Top Navigation Tabs (Chuyển đổi phân hệ Đối tác) ─────────────── */}
      <div className="border-b border-slate-200 pb-1">
        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <span>ĐỐI TÁC</span>
          <span>&rsaquo;</span>
          <span className="text-slate-600">Duyệt nhân viên đối tác</span>
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
            className="pb-3 text-lg font-bold transition-all relative flex items-center gap-2.5 text-slate-900 border-b-2 border-blue-600"
          >
            <span>Duyệt nhân viên đối tác</span>
            <span className="px-2.5 py-0.5 bg-blue-100 text-blue-700 text-xs font-bold rounded-full">
              {totalItems} hồ sơ
            </span>
          </Link>
          <Link
            href="/admin/partners/manage"
            className="pb-3 text-lg font-bold transition-all relative flex items-center gap-2.5 text-slate-400 hover:text-slate-700"
          >
            <span>Quản lý đối tác</span>
          </Link>
        </div>
      </div>

      {/* ─── PHẦN 2: Card Bộ Lọc Tìm Kiếm & Thời Gian ─────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4 sm:p-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Ô Tìm kiếm với nhãn FormField */}
          <div>
            <FormField label="Tìm kiếm nhân viên đối tác">
              <div className="relative">
                <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg z-10" />
                <Input
                  type="text"
                  placeholder="Nhập tên nhân viên hoặc tên doanh nghiệp..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1); // Reset về trang 1 khi đổi từ khóa tìm kiếm
                  }}
                  className="w-full h-[38px] pl-9 pr-3 border-slate-200 rounded-xl"
                />
              </div>
            </FormField>
          </div>

          {/* Bộ chọn khoảng thời gian */}
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
        </div>
      </div>

      {/* ─── PHẦN 3: Báo lỗi nếu có ────────────────────────────────────────────────── */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon name="error" className="text-lg text-rose-500" />
            <span>{error}</span>
          </div>
          <Button variant="outline" onClick={fetchPendingEmployees} className="text-xs text-rose-700 border-rose-200 bg-white">
            Thử lại
          </Button>
        </div>
      )}

      {/* ─── PHẦN 4: Bảng Danh Sách Hàng Đợi Duyệt (5 cột trực quan) ─────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="border-b border-slate-200/80 bg-slate-50/50 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                <th className="py-4 px-5">Nhân viên</th>
                <th className="py-4 px-5">Doanh nghiệp đối tác</th>
                <th className="py-4 px-5">Chi nhánh làm việc</th>
                <th className="py-4 px-5">Ngày gửi duyệt</th>
                <th className="py-4 px-5 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {/* Skeleton loading khi đang fetch API */}
              {isLoading ? (
                Array.from({ length: 5 }).map((_, idx) => (
                  <tr key={idx} className="animate-pulse">
                    <td className="py-4 px-5"><div className="h-4 bg-slate-200 rounded w-32"></div></td>
                    <td className="py-4 px-5"><div className="h-4 bg-slate-200 rounded w-36"></div></td>
                    <td className="py-4 px-5"><div className="h-4 bg-slate-200 rounded w-36"></div></td>
                    <td className="py-4 px-5"><div className="h-4 bg-slate-200 rounded w-28"></div></td>
                    <td className="py-4 px-5 text-right"><div className="h-8 bg-slate-200 rounded-xl w-24 ml-auto"></div></td>
                  </tr>
                ))
              ) : employees.length === 0 ? (
                /* Empty state khi không có hồ sơ nào */
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                        <Icon name="badge" className="text-2xl" />
                      </div>
                      <span className="font-semibold text-slate-700">Không có hồ sơ chờ duyệt</span>
                      <span className="text-xs text-slate-400 max-w-xs">
                        Hiện tại không có nhân viên đối tác nào đang chờ phê duyệt.
                      </span>
                    </div>
                  </td>
                </tr>
              ) : (
                /* Render các dòng dữ liệu nhân viên */
                employees.map((emp) => {
                  return (
                    <tr key={emp.user_id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Tên Nhân viên */}
                      <td className="py-4 px-5">
                        <span className="font-semibold text-slate-900 block">
                          {emp.full_name}
                        </span>
                      </td>

                      {/* Doanh nghiệp đối tác */}
                      <td className="py-4 px-5">
                        <span className="font-medium text-slate-800 block">
                          {emp.business_name}
                        </span>
                      </td>

                      {/* Chi nhánh làm việc */}
                      <td className="py-4 px-5">
                        <span className="text-slate-800 block">
                          {emp.branch_name}
                        </span>
                      </td>

                      {/* Ngày gửi duyệt */}
                      <td className="py-4 px-5 text-slate-600 text-xs">
                        {formatDateDisplay(emp.submitted_at || emp.created_at)}
                      </td>

                      {/* Nút Xem chi tiết hồ sơ */}
                      <td className="py-4 px-5 text-right">
                        <Link
                          href={`/admin/partners/employee-pending/${emp.user_id}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50/80 hover:bg-blue-100 hover:text-blue-700 rounded-xl border border-blue-100 transition shadow-sm"
                        >
                          <span>Xem chi tiết</span>
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ─── PHẦN 5: Phân trang (Pagination) ────────────────────────────────────── */}
        {!isLoading && employees.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
            itemName="hồ sơ"
          />
        )}
      </div>
    </div>
  );
}

/**
 * -----------------------------------------------------------------------------------------
 * COMPONENT PHỤ: DateRangePicker
 * MỤC ĐÍCH: Hộp thoại popover cho phép chọn nhanh các mốc thời gian (Hôm nay, 7 ngày qua,
 *          tháng này...) hoặc nhập ngày bắt đầu & ngày kết thúc tùy biến.
 * -----------------------------------------------------------------------------------------
 */
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

  // Xử lý đóng popover khi người dùng click ra ngoài (Click Outside)
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
    }
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [isOpen]);

  // Áp dụng các preset thời gian định sẵn
  const handleApplyPreset = (preset: string) => {
    const now = new Date();
    const formatDate = (d: Date) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    };

    if (preset === "ALL") {
      onReset();
      setIsOpen(false);
      return;
    }

    if (preset === "TODAY") {
      const todayStr = formatDate(now);
      onStartDateChange(todayStr);
      onEndDateChange(todayStr);
    } else if (preset === "7_DAYS") {
      const start = new Date(now);
      start.setDate(start.getDate() - 6);
      onStartDateChange(formatDate(start));
      onEndDateChange(formatDate(now));
    } else if (preset === "30_DAYS") {
      const start = new Date(now);
      start.setDate(start.getDate() - 29);
      onStartDateChange(formatDate(start));
      onEndDateChange(formatDate(now));
    } else if (preset === "THIS_MONTH") {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      onStartDateChange(formatDate(start));
      onEndDateChange(formatDate(end));
    } else if (preset === "LAST_MONTH") {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const end = new Date(now.getFullYear(), now.getMonth(), 0);
      onStartDateChange(formatDate(start));
      onEndDateChange(formatDate(end));
    }
    setIsOpen(false);
  };

  const hasFilter = Boolean(startDate || endDate);

  const formatShortDisplay = (dateStr: string) => {
    if (!dateStr) return "";
    const [y, m, d] = dateStr.split("-");
    if (!d || !m) return dateStr;
    return `${d}/${m}/${y}`;
  };

  let labelText = "Tất cả thời gian";
  if (startDate && endDate) {
    labelText = `${formatShortDisplay(startDate)} - ${formatShortDisplay(endDate)}`;
  } else if (startDate) {
    labelText = `Từ ${formatShortDisplay(startDate)}`;
  } else if (endDate) {
    labelText = `Đến ${formatShortDisplay(endDate)}`;
  }

  return (
    <FormField label="Thời gian gửi">
      <div className="relative" ref={containerRef}>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`w-full h-[38px] px-3 bg-slate-50 border rounded-xl text-left flex items-center justify-between text-sm transition-all ${isOpen
              ? "border-blue-500 ring-2 ring-blue-500/20 bg-white"
              : hasFilter
                ? "border-blue-300 bg-blue-50/30 text-blue-900 font-medium"
                : "border-slate-200 text-slate-700 hover:bg-slate-100/70"
            }`}
        >
          <div className="flex items-center gap-2 truncate pr-1">
            <Icon
              name="calendar_today"
              className={`text-lg shrink-0 ${hasFilter ? "text-blue-600" : "text-slate-400"}`}
            />
            <span className={`truncate ${hasFilter ? "text-slate-900 font-semibold" : "text-slate-500"}`}>
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
