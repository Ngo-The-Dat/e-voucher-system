"use client";

import Icon from "@/components/shared/ui/Icon";
import { useState, useEffect, useCallback } from "react";
import { Input } from "@/components/shared/ui/Input";
import { Button } from "@/components/shared/ui/Button";
import Pagination from "@/components/shared/ui/Pagination";
import { adminApi, SystemLogItem } from "@/lib/admin-api";

export default function SystemLogsPage() {
  // Search & Filters State (UC-ADM-13)
  const [searchTerm, setSearchTerm] = useState("");
  const [objectTypeFilter, setObjectTypeFilter] = useState("ALL");
  const [resultFilter, setResultFilter] = useState("ALL");
  const [startDateFilter, setStartDateFilter] = useState("");
  const [endDateFilter, setEndDateFilter] = useState("");

  // Data & Loading State
  const [logs, setLogs] = useState<SystemLogItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 10;

  // Selected Log for Detail Modal
  const [selectedLog, setSelectedLog] = useState<SystemLogItem | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  // Fetch logs from API
  const fetchLogs = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await adminApi.getLogs({
        search: searchTerm,
        objectType: objectTypeFilter,
        result: resultFilter,
        startDate: startDateFilter,
        endDate: endDateFilter,
        page: currentPage,
        limit: itemsPerPage,
      });

      setLogs(response.logs ?? []);
      setTotalItems(response.pagination?.total ?? 0);
      setTotalPages(response.pagination?.totalPages ?? 1);
    } catch (err: any) {
      console.error("Lỗi khi tải nhật ký hệ thống:", err);
      setError(err?.message || "Không thể kết nối đến máy chủ.");
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm, objectTypeFilter, resultFilter, startDateFilter, endDateFilter, currentPage]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // Open Log Detail Modal
  const handleOpenDetail = async (logId: string) => {
    setIsLoadingDetail(true);
    try {
      const detail = await adminApi.getLog(logId);
      setSelectedLog(detail);
    } catch (err: any) {
      console.error("Lỗi khi tải chi tiết nhật ký:", err);
      // Fallback to local item if API detail fetch fails
      const fallback = logs.find((l) => String(l.log_id) === String(logId));
      if (fallback) setSelectedLog(fallback);
    } finally {
      setIsLoadingDetail(false);
    }
  };

  // Helper to format Date string
  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return "N/A";
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  // Helper to stringify JSON nicely
  const formatJson = (val: any): string | null => {
    if (val === null || val === undefined) return null;
    if (typeof val === "string") {
      try {
        const parsed = JSON.parse(val);
        return JSON.stringify(parsed, null, 2);
      } catch {
        return val;
      }
    }
    return JSON.stringify(val, null, 2);
  };

  const handleResetFilters = () => {
    setSearchTerm("");
    setObjectTypeFilter("ALL");
    setResultFilter("ALL");
    setStartDateFilter("");
    setEndDateFilter("");
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-border">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900">
              Nhật ký hệ thống
            </h1>
          </div>
          <p className="text-sm text-text-muted mt-1">
            Tra cứu thao tác quản trị & truy vết sự kiện biến động dữ liệu thực tế
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleResetFilters}
            className="text-xs text-slate-600 bg-white"
          >
            <Icon name="refresh" className="text-sm mr-1.5" />
            <span>Đặt lại bộ lọc</span>
          </Button>
        </div>
      </div>

      {/* Multi-filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-border shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
          {/* Keyword Search */}
          <div className="relative">
            <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg z-10" />
            <Input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Tìm hành động, người dùng, mã ID..."
              className="w-full pl-9 pr-3 py-2 text-xs border-slate-200 rounded-xl"
            />
          </div>

          {/* Object Type Filter */}
          <div>
            <select
              value={objectTypeFilter}
              onChange={(e) => {
                setObjectTypeFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 bg-white font-medium focus:outline-none focus:border-primary"
            >
              <option value="ALL">Tất cả loại đối tượng</option>
              <option value="USER">Người dùng (USER)</option>
              <option value="PARTNER">Đối tác (PARTNER)</option>
              <option value="BRANCH">Chi nhánh (BRANCH)</option>
              <option value="CATEGORY">Danh mục (CATEGORY)</option>
              <option value="VOUCHER_PROGRAM">Chương trình Voucher (VOUCHER_PROGRAM)</option>
              <option value="APPROVAL_REQUEST">Yêu cầu duyệt (APPROVAL_REQUEST)</option>
              <option value="ORDER">Đơn hàng (ORDER)</option>
              <option value="ORDER_CANCELLATION">Hủy đơn hàng (ORDER_CANCELLATION)</option>
              <option value="BANNER">Banner & Quảng cáo (BANNER)</option>
              <option value="POPUP">Popup truyền thông (POPUP)</option>
              <option value="CONTENT">Nội dung (CONTENT)</option>
            </select>
          </div>

          {/* Result Filter */}
          <div>
            <select
              value={resultFilter}
              onChange={(e) => {
                setResultFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 bg-white font-medium focus:outline-none focus:border-primary"
            >
              <option value="ALL">Tất cả kết quả</option>
              <option value="SUCCESS">Thành công (SUCCESS)</option>
              <option value="FAILED">Thất bại / Lỗi (FAILED)</option>
            </select>
          </div>

          {/* Date Picker Filter */}
          <div className="flex items-center gap-1 text-xs bg-slate-50 p-1 border border-slate-200 rounded-xl">
            <Input
              type="date"
              value={startDateFilter}
              onChange={(e) => {
                setStartDateFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full h-8 px-2 py-1 bg-white border-slate-200 rounded-lg text-slate-700 text-[11px]"
            />
            <span className="text-slate-400">&rarr;</span>
            <Input
              type="date"
              value={endDateFilter}
              onChange={(e) => {
                setEndDateFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full h-8 px-2 py-1 bg-white border-slate-200 rounded-lg text-slate-700 text-[11px]"
            />
          </div>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 text-xs text-rose-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon name="error" className="text-lg text-rose-500" />
            <span>{error}</span>
          </div>
          <Button variant="outline" onClick={fetchLogs} className="text-xs text-rose-700 border-rose-200 bg-white">
            Thử lại
          </Button>
        </div>
      )}

      {/* Logs Table Area */}
      <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs text-slate-500 font-medium">Đang tải dữ liệu nhật ký hệ thống...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto mb-3">
              <Icon name="find_in_page" className="text-2xl" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">
              Không tìm thấy kết quả phù hợp
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
              Không có bản ghi nhật ký nào thỏa mãn điều kiện bộ lọc của bạn.
            </p>
            <Button
              variant="outline"
              onClick={handleResetFilters}
              className="mt-4 text-primary bg-blue-50 hover:bg-blue-100"
            >
              Xóa điều kiện lọc
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 text-slate-500 text-xs font-bold uppercase tracking-wider border-b border-slate-200/80">
                  <th className="py-4 px-5">Mã Log</th>
                  <th className="py-4 px-5">Thời gian</th>
                  <th className="py-4 px-5">Người thực hiện</th>
                  <th className="py-4 px-5">Hành động</th>
                  <th className="py-4 px-5">Loại đối tượng</th>
                  <th className="py-4 px-5">Kết quả</th>
                  <th className="py-4 px-5 text-right">Chi tiết</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {logs.map((log) => (
                  <tr
                    key={log.log_id}
                    className="hover:bg-slate-50/60 transition cursor-pointer"
                    onClick={() => handleOpenDetail(String(log.log_id))}
                  >
                    <td className="py-4 px-5 font-mono font-bold text-slate-900">
                      LOG-{log.log_id}
                    </td>
                    <td className="py-4 px-5 text-slate-500 text-[11px] font-mono">
                      {formatDate(log.performed_at)}
                    </td>
                    <td className="py-4 px-5">
                      <p className="font-semibold text-slate-900 text-xs">
                        {log.user_name || `User #${log.user_id}`}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        ID: {log.user_id} {log.user_role ? `(${log.user_role})` : ""}
                      </p>
                    </td>
                    <td className="py-4 px-5 font-medium text-slate-800 text-xs">
                      {log.action}
                    </td>
                    <td className="py-4 px-5">
                      {log.object_type ? (
                        <span className="px-2.5 py-1 text-[11px] font-bold rounded-md bg-slate-100 text-slate-700 whitespace-nowrap font-mono">
                          {log.object_type} {log.object_id ? `: #${log.object_id}` : ""}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic text-[11px]">-</span>
                      )}
                    </td>
                    <td className="py-4 px-5">
                      <span
                        className={`px-2.5 py-0.5 text-[11px] font-bold rounded-md whitespace-nowrap ${
                          log.result === "SUCCESS"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-rose-100 text-rose-800"
                        }`}
                      >
                        {log.result === "SUCCESS" ? "Thành công" : "Thất bại"}
                      </span>
                    </td>
                    <td className="py-4 px-5 text-right">
                      <Button
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenDetail(String(log.log_id));
                        }}
                        className="px-2.5 py-1 text-xs text-primary bg-blue-50 hover:bg-blue-100 h-auto"
                      >
                        <span className="mr-1">Xem</span>
                        <Icon name="visibility" className="text-sm" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {!isLoading && logs.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
            itemName="bản ghi"
          />
        )}
      </div>

      {/* Log Detail Modal */}
      {selectedLog && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedLog(null)}
        >
          <div
            className="bg-white w-full max-w-2xl rounded-2xl shadow-xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-primary text-base">
                    LOG-{selectedLog.log_id}
                  </span>
                  <span
                    className={`px-2 py-0.5 text-[10px] font-bold rounded-md ${
                      selectedLog.result === "SUCCESS"
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-rose-100 text-rose-800"
                    }`}
                  >
                    {selectedLog.result}
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-900 mt-1">
                  Chi tiết bản ghi Nhật ký hệ thống
                </h3>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
              >
                <Icon name="close" className="text-xl" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto text-xs">
              {isLoadingDetail ? (
                <div className="p-8 text-center">
                  <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  <p className="text-slate-500 text-xs">Đang tải thông tin chi tiết...</p>
                </div>
              ) : (
                <>
                  {/* Metadata Grid */}
                  <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <div>
                      <span className="text-slate-400 font-medium">Người thực hiện:</span>
                      <p className="font-bold text-slate-800 text-sm mt-0.5">
                        {selectedLog.user_name || `User #${selectedLog.user_id}`}
                      </p>
                      <p className="text-slate-500 font-mono text-[11px]">
                        ID: {selectedLog.user_id} {selectedLog.user_role ? `(${selectedLog.user_role})` : ""}
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-400 font-medium">Thời gian thực hiện:</span>
                      <p className="font-bold text-slate-800 text-sm mt-0.5 font-mono">
                        {formatDate(selectedLog.performed_at)}
                      </p>
                    </div>
                    <div className="col-span-2 pt-2 border-t border-slate-200">
                      <span className="text-slate-400 font-medium">Hành động thực hiện:</span>
                      <p className="font-bold text-slate-900 text-sm mt-0.5">
                        {selectedLog.action}
                      </p>
                    </div>
                    <div className="col-span-2 pt-2 border-t border-slate-200">
                      <span className="text-slate-400 font-medium">
                        Đối tượng bị tác động (object_type / object_id):
                      </span>
                      <p className="font-mono font-bold text-primary mt-0.5">
                        {selectedLog.object_type || "N/A"} {selectedLog.object_id ? `\u2192 #${selectedLog.object_id}` : ""}
                      </p>
                    </div>
                  </div>

                  {/* Data Change Diff: old_value vs new_value */}
                  <div className="space-y-3">
                    <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">
                      Biến động dữ liệu (old_value vs new_value)
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Old Value */}
                      <div className="p-3 bg-rose-50/50 border border-rose-200/70 rounded-xl">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-bold text-rose-700 text-[11px]">
                            Giá trị trước thay đổi (old_value)
                          </span>
                        </div>
                        {formatJson(selectedLog.old_value) ? (
                          <pre className="font-mono text-[11px] text-slate-800 bg-white p-2.5 rounded-lg border border-rose-100 overflow-x-auto whitespace-pre-wrap">
                            {formatJson(selectedLog.old_value)}
                          </pre>
                        ) : (
                          <p className="text-slate-400 italic text-center py-4">
                            (Không có dữ liệu cũ / Thao tác tạo mới)
                          </p>
                        )}
                      </div>

                      {/* New Value */}
                      <div className="p-3 bg-emerald-50/50 border border-emerald-200/70 rounded-xl">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-bold text-emerald-700 text-[11px]">
                            Giá trị sau thay đổi (new_value)
                          </span>
                        </div>
                        {formatJson(selectedLog.new_value) ? (
                          <pre className="font-mono text-[11px] text-slate-800 bg-white p-2.5 rounded-lg border border-emerald-100 overflow-x-auto whitespace-pre-wrap">
                            {formatJson(selectedLog.new_value)}
                          </pre>
                        ) : (
                          <p className="text-slate-400 italic text-center py-4">
                            (Không có dữ liệu mới / Thao tác xóa)
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 flex justify-end bg-slate-50">
              <Button
                variant="outline"
                onClick={() => setSelectedLog(null)}
              >
                Đóng
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
