"use client";

import Icon from "@/components/admin/Icon";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

interface PendingPartner {
  id: string;
  companyName: string;
  representative: string;
  branchesCount: number;
  registrationDate: string;
  registrationTime: string;
  status: "Chờ duyệt" | "Đã duyệt" | "Từ chối";
}

export default function PendingPartnersPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);

  const partners: PendingPartner[] = [
    {
      id: "MER-901",
      companyName: "Spa Sen Vàng",
      representative: "Nguyễn Thị Sen",
      branchesCount: 2,
      registrationDate: "01/08/2026",
      registrationTime: "14:30",
      status: "Chờ duyệt",
    },
    {
      id: "MER-904",
      companyName: "Highlands Coffee (Nhượng quyền)",
      representative: "Nguyễn Thị Hương",
      branchesCount: 45,
      registrationDate: "28/07/2026",
      registrationTime: "10:20",
      status: "Chờ duyệt",
    },
    {
      id: "MER-911",
      companyName: "Trà sữa Tocotoco",
      representative: "Hoàng Văn Tuấn",
      branchesCount: 10,
      registrationDate: "02/08/2026",
      registrationTime: "16:15",
      status: "Chờ duyệt",
    },
    {
      id: "MER-902",
      companyName: "Nhà hàng Hải Sản X",
      representative: "Trần Văn Hải",
      branchesCount: 5,
      registrationDate: "31/07/2026",
      registrationTime: "09:15",
      status: "Từ chối",
    },
    {
      id: "MER-905",
      companyName: "CGV Cinemas Việt Nam",
      representative: "Lê Quốc Trung",
      branchesCount: 20,
      registrationDate: "25/07/2026",
      registrationTime: "11:00",
      status: "Từ chối",
    },
  ];

  const filteredPartners = partners.filter((partner) => {
    if (
      searchQuery &&
      !partner.companyName.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !partner.representative.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }
    if (statusFilter !== "ALL" && partner.status !== statusFilter) {
      return false;
    }
    const [day, month, year] = partner.registrationDate.split("/");
    const registrationDate = `${year}-${month}-${day}`;
    if (startDate && registrationDate < startDate) return false;
    if (endDate && registrationDate > endDate) return false;
    return true;
  });

  const pendingCount = partners.filter((p) => p.status === "Chờ duyệt").length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Navigation Bar */}
      <div className="border-b border-slate-200 pb-1">
        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <span>ĐỐI TÁC</span>
          <span>&rsaquo;</span>
          <span className="text-slate-600">Duyệt hồ sơ đối tác</span>
        </div>
        <div className="flex items-center gap-8">
          <Link
            href="/admin/partners/pending"
            className="pb-3 text-lg font-bold transition-all relative flex items-center gap-2.5 text-slate-900 border-b-2 border-blue-600"
          >
            <span>Duyệt hồ sơ đối tác</span>
            <span className="px-2.5 py-0.5 bg-blue-100 text-blue-700 text-xs font-bold rounded-full">
              {pendingCount} hồ sơ
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

      {/* Filter Card Section */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4 sm:p-5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Tên doanh nghiệp Search */}
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5">
              Tên doanh nghiệp
            </label>
            <div className="relative">
              <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg" />
              <input
                type="text"
                placeholder="Nhập tên doanh nghiệp..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full h-[38px] pl-9 pr-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
              />
            </div>
          </div>

          {/* Ngày đăng ký Filter */}
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

          {/* Tình trạng Filter */}
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5">
              Tình trạng
            </label>
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
                <option value="Chờ duyệt">Chờ duyệt</option>
                <option value="Từ chối">Từ chối</option>
              </select>
              <Icon name="expand_more" className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      {/* Partners Queue Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 text-slate-500 text-xs font-bold uppercase tracking-wider border-b border-slate-200/80">
                <th className="py-4 px-6">TÊN DOANH NGHIỆP</th>
                <th className="py-4 px-6">ĐẠI DIỆN</th>
                <th className="py-4 px-6">CHI NHÁNH</th>
                <th className="py-4 px-6">NGÀY ĐĂNG KÝ</th>
                <th className="py-4 px-6">TÌNH TRẠNG</th>
                <th className="py-4 px-6 text-right">THAO TÁC</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredPartners.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="py-12 text-center text-slate-400 font-medium"
                  >
                    <Icon name="search_off" className="text-4xl block mb-2 text-slate-300" />
                    Không tìm thấy hồ sơ phù hợp với bộ lọc.
                  </td>
                </tr>
              ) : (
                filteredPartners.map((partner) => (
                  <tr
                    key={partner.id}
                    className="hover:bg-slate-50/60 transition"
                  >
                    <td className="py-4 px-6 font-bold text-slate-900">
                      {partner.companyName}
                    </td>
                    <td className="py-4 px-6 text-slate-800 font-medium">
                      {partner.representative}
                    </td>
                    <td className="py-4 px-6">
                      <span className="px-2.5 py-1 bg-slate-100 text-slate-700 font-bold rounded-lg text-xs inline-block min-w-[28px] text-center">
                        {partner.branchesCount}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="font-bold text-slate-900 text-xs sm:text-sm">
                        {partner.registrationDate}
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        {partner.registrationTime}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span
                        className={`px-3 py-1 font-semibold text-xs rounded-full inline-flex items-center gap-1.5 ${partner.status === "Chờ duyệt"
                          ? "bg-amber-50 text-amber-600 border border-amber-200/70"
                          : partner.status === "Đã duyệt"
                            ? "bg-emerald-50 text-emerald-600 border border-emerald-200/70"
                            : "bg-rose-50 text-rose-600 border border-rose-200/70"
                          }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${partner.status === "Chờ duyệt"
                            ? "bg-amber-500"
                            : partner.status === "Đã duyệt"
                              ? "bg-emerald-500"
                              : "bg-rose-500"
                            }`}
                        />
                        {partner.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <Link
                        href={`/admin/partners/pending/${partner.id}`}
                        className="px-4 py-1.5 bg-blue-50 border border-blue-200 text-blue-600 hover:bg-blue-600 hover:text-white font-semibold text-xs rounded-xl transition shadow-2xs inline-block"
                      >
                        Xem chi tiết
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer & Pagination */}
        <div className="px-6 py-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div>
            Hiển thị <span className="font-bold text-slate-900">1</span> đến{" "}
            <span className="font-bold text-slate-900">
              {filteredPartners.length}
            </span>{" "}
            trong{" "}
            <span className="font-bold text-slate-900">{partners.length}</span>{" "}
            hồ sơ
          </div>
          <div className="flex items-center gap-1.5">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:border-slate-300 disabled:opacity-40 transition"
            >
              &lt;
            </button>
            <button
              onClick={() => setCurrentPage(1)}
              className={`w-8 h-8 rounded-lg font-bold flex items-center justify-center transition ${currentPage === 1
                ? "border border-blue-500 bg-blue-50/50 text-blue-600"
                : "border border-slate-200 text-slate-700 hover:bg-slate-50"
                }`}
            >
              1
            </button>
            <button
              onClick={() => setCurrentPage((p) => p + 1)}
              className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:border-slate-300 transition"
            >
              &gt;
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

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
    <div className="relative" ref={containerRef}>
      <div className="flex items-center justify-between mb-1.5">
        <label className="block text-xs font-bold text-slate-500">
          Ngày đăng ký
        </label>
        {hasFilter && (
          <button
            type="button"
            onClick={() => {
              onReset();
              setIsOpen(false);
            }}
            className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-rose-500 hover:text-rose-600 transition"
          >
            <Icon name="close" className="text-[13px]" />
            Xóa
          </button>
        )}
      </div>

      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full h-[38px] px-3 bg-white border rounded-xl text-xs sm:text-sm font-medium flex items-center justify-between transition-all gap-2 shadow-2xs ${hasFilter
          ? "border-blue-500 bg-blue-50/40 text-blue-900 ring-2 ring-blue-500/10"
          : "border-slate-200 text-slate-700 hover:border-slate-300"
          }`}
      >
        <div className="flex items-center gap-2 truncate">
          <Icon name="calendar_today" className={`text-lg ${hasFilter ? "text-blue-600" : "text-slate-400" }`} />
          <span
            className={`truncate ${hasFilter ? "font-semibold text-slate-900" : "text-slate-400"
              }`}
          >
            {hasFilter ? labelText : "Tất cả thời gian"}
          </span>
        </div>
        <Icon name={isOpen ? "expand_less" : "expand_more"} className="text-lg text-slate-400 shrink-0" />
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
                <button
                  key={item.key}
                  type="button"
                  onClick={() => handleApplyPreset(item.key)}
                  className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-slate-200 bg-slate-50 text-slate-600 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition"
                >
                  {item.label}
                </button>
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
                <input
                  type="date"
                  value={startDate}
                  max={endDate || undefined}
                  onChange={(e) => onStartDateChange(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-500 mb-1">
                  Đến ngày
                </label>
                <input
                  type="date"
                  value={endDate}
                  min={startDate || undefined}
                  onChange={(e) => onEndDateChange(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition"
                />
              </div>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-3 flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                onReset();
              }}
              className="text-xs font-semibold text-slate-400 hover:text-rose-500 transition"
            >
              Xóa chọn
            </button>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition shadow-xs"
            >
              Áp dụng
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
