"use client";

import Icon from "@/components/shared/ui/Icon";

import { useState } from "react";
import { Input } from "@/components/shared/ui/Input";
import { Button } from "@/components/shared/ui/Button";
import Pagination from "@/components/shared/ui/Pagination";
import AccessibleDialog from "@/components/shared/ui/AccessibleDialog";

// Data Model matching system_logs table in ERD & UC-ADM-13
export interface SystemLog {
  log_id: string;
  user_id: string;
  user_name: string;
  user_role?: string;
  action: string;
  object_id: string;
  object_type:
  | "USER"
  | "PARTNER"
  | "BRANCH"
  | "CATEGORY"
  | "VOUCHER_PROGRAM"
  | "APPROVAL_REQUEST"
  | "ORDER"
  | "ORDER_CANCELLATION"
  | "REVIEW_FEEDBACK"
  | "BANNER"
  | "POPUP"
  | "CONTENT";
  old_value: string | null;
  new_value: string | null;
  performed_at: string;
  result: "SUCCESS" | "FAILED";
}

export default function SystemLogsPage() {
  // Search & Filters State (UC-ADM-13)
  const [searchTerm, setSearchTerm] = useState("");
  const [objectTypeFilter, setObjectTypeFilter] = useState("ALL");
  const [resultFilter, setResultFilter] = useState("ALL");
  const [startDateFilter, setStartDateFilter] = useState("");
  const [endDateFilter, setEndDateFilter] = useState("");

  // Selected Log for Detail Modal (Step 5 - UC-ADM-13)
  const [selectedLog, setSelectedLog] = useState<SystemLog | null>(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Mock Logs Data adhering strictly to system_logs schema & admin actions
  const [logs] = useState<SystemLog[]>([
    {
      log_id: "LOG-10098",
      user_id: "USR-001",
      user_name: "Hoàng Nam",
      user_role: "Quản trị viên",
      action: "Phê duyệt đối tác doanh nghiệp",
      object_id: "PARTNER-892",
      object_type: "PARTNER",
      old_value: JSON.stringify(
        { approval_status: "PENDING", is_active: false },
        null,
        2
      ),
      new_value: JSON.stringify(
        { approval_status: "APPROVED", is_active: true, approved_by: "USR-001" },
        null,
        2
      ),
      performed_at: "05/08/2026 09:15:20",
      result: "SUCCESS",
    },
    {
      log_id: "LOG-10097",
      user_id: "USR-003",
      user_name: "Thu Trang",
      user_role: "Quản trị viên",
      action: "Tự động khóa tài khoản nghi vấn gian lận",
      object_id: "USER-9982",
      object_type: "USER",
      old_value: JSON.stringify(
        { account_status: "ACTIVE", failed_login_attempts: 4 },
        null,
        2
      ),
      new_value: JSON.stringify(
        { account_status: "LOCKED", lock_reason: "Cảnh báo truy cập bất thường" },
        null,
        2
      ),
      performed_at: "05/08/2026 08:45:10",
      result: "SUCCESS",
    },
    {
      log_id: "LOG-10096",
      user_id: "USR-003",
      user_name: "Thu Trang",
      user_role: "Quản trị viên",
      action: "Phê duyệt chiến dịch Voucher",
      object_id: "VCH-1024",
      object_type: "VOUCHER_PROGRAM",
      old_value: JSON.stringify(
        { status: "PENDING_REVIEW", issue_quantity: 1000 },
        null,
        2
      ),
      new_value: JSON.stringify(
        { status: "PUBLISHED", issue_quantity: 1000, reviewer: "USR-003" },
        null,
        2
      ),
      performed_at: "05/08/2026 08:10:05",
      result: "SUCCESS",
    },
    {
      log_id: "LOG-10095",
      user_id: "USR-005",
      user_name: "Thành Trung",
      user_role: "Quản trị viên",
      action: "Xác nhận hủy đơn hàng theo yêu cầu khách",
      object_id: "ORD-88412",
      object_type: "ORDER_CANCELLATION",
      old_value: JSON.stringify(
        { order_status: "PROCESSING", refund_status: "NONE" },
        null,
        2
      ),
      new_value: JSON.stringify(
        { order_status: "CANCELLED", refund_status: "REFUNDED", amount: 450000 },
        null,
        2
      ),
      performed_at: "04/08/2026 17:30:00",
      result: "SUCCESS",
    },
    {
      log_id: "LOG-10094",
      user_id: "USR-001",
      user_name: "Hoàng Nam",
      user_role: "Quản trị viên",
      action: "Cập nhật cấu hình Banner trang chủ",
      object_id: "BNR-04",
      object_type: "BANNER",
      old_value: JSON.stringify(
        { title: "Khuyến mãi mùa hè", display_order: 2 },
        null,
        2
      ),
      new_value: JSON.stringify(
        { title: "Mega Sale Tháng 8", display_order: 1 },
        null,
        2
      ),
      performed_at: "04/08/2026 15:20:44",
      result: "SUCCESS",
    },
    {
      log_id: "LOG-10093",
      user_id: "USR-999",
      user_name: "Hệ thống (Cron Job)",
      user_role: "Hệ thống",
      action: "Đồng bộ trạng thái voucher hết hạn",
      object_id: "VCH-SYSTEM",
      object_type: "VOUCHER_PROGRAM",
      old_value: null,
      new_value: JSON.stringify(
        { expired_count: 142, updated_at: "2026-08-04T00:00:00Z" },
        null,
        2
      ),
      performed_at: "04/08/2026 00:05:00",
      result: "SUCCESS",
    },
    {
      log_id: "LOG-10092",
      user_id: "USR-004",
      user_name: "Minh Nhật",
      user_role: "Quản trị viên",
      action: "Thử nghiệm thay đổi phân quyền vai trò",
      object_id: "ROLE-ACCOUNTANT",
      object_type: "USER",
      old_value: JSON.stringify({ permission_level: "READ_ONLY" }, null, 2),
      new_value: null,
      performed_at: "03/08/2026 16:40:12",
      result: "FAILED",
    },
  ]);

  // Filtering Logic (UC-ADM-13)
  const filteredLogs = logs.filter((log) => {
    // Search filter (Action, User, Object ID)
    const matchesSearch =
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.object_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.log_id.toLowerCase().includes(searchTerm.toLowerCase());

    // Object type filter
    const matchesObjType =
      objectTypeFilter === "ALL" || log.object_type === objectTypeFilter;

    // Result filter
    const matchesResult =
      resultFilter === "ALL" || log.result === resultFilter;

    return matchesSearch && matchesObjType && matchesResult;
  });

  // Pagination calculation
  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage) || 1;
  const paginatedLogs = filteredLogs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

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
            Tra cứu thao tác quản trị & truy vết sự kiện biến động dữ liệu
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => {
              setSearchTerm("");
              setObjectTypeFilter("ALL");
              setResultFilter("ALL");
              setStartDateFilter("");
              setEndDateFilter("");
              setCurrentPage(1);
            }}
            className="text-xs text-slate-600 bg-white"
          >
            <Icon name="refresh" className="text-sm mr-1.5" />
            <span>Đặt lại bộ lọc</span>
          </Button>
        </div>
      </div>

      {/* Multi-filter Bar (UC-ADM-13 Step 3: Bộ lọc loại thao tác, người thực hiện, khoảng thời gian) */}
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
              <option value="USER">Người dùng</option>
              <option value="PARTNER">Đối tác</option>
              <option value="VOUCHER_PROGRAM">Chương trình Voucher</option>
              <option value="ORDER_CANCELLATION">Hủy đơn hàng</option>
              <option value="BANNER">Banner & Quảng cáo</option>
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
              <option value="SUCCESS">Thành công</option>
              <option value="FAILED">Thất bại / Lỗi</option>
            </select>
          </div>

          {/* Date Picker Filter */}
          <div className="flex items-center gap-1 text-xs bg-slate-50 p-1 border border-slate-200 rounded-xl">
            <Input
              type="date"
              value={startDateFilter}
              onChange={(e) => setStartDateFilter(e.target.value)}
              className="w-full h-8 px-2 py-1 bg-white border-slate-200 rounded-lg text-slate-700 text-[11px]"
            />
            <span className="text-slate-400">&rarr;</span>
            <Input
              type="date"
              value={endDateFilter}
              onChange={(e) => setEndDateFilter(e.target.value)}
              className="w-full h-8 px-2 py-1 bg-white border-slate-200 rounded-lg text-slate-700 text-[11px]"
            />
          </div>
        </div>
      </div>

      {/* Logs Table Area */}
      <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
        {paginatedLogs.length === 0 ? (
          /* Alternate Flow A1: Empty State handling */
          <div className="p-12 text-center">
            <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto mb-3">
              <Icon name="find_in_page" className="text-2xl" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">
              Không tìm thấy kết quả phù hợp
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
              Không có bản ghi nhật ký nào thỏa mãn điều kiện bộ lọc của bạn (Đáp ứng Luồng A1 - UC-ADM-13).
            </p>
            <Button
              variant="outline"
              onClick={() => {
                setSearchTerm("");
                setObjectTypeFilter("ALL");
                setResultFilter("ALL");
                setStartDateFilter("");
                setEndDateFilter("");
              }}
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
              <tbody className="divide-y divide-slate-100 text-base">
                {paginatedLogs.map((log) => (
                  <tr
                    key={log.log_id}
                    className="hover:bg-slate-50/60 transition cursor-pointer"
                    onClick={() => setSelectedLog(log)}
                  >
                    <td className="py-4 px-5 font-bold text-slate-900">
                      {log.log_id}
                    </td>
                    <td className="py-4 px-5 text-slate-500 text-xs">
                      {log.performed_at}
                    </td>
                    <td className="py-4 px-5">
                      <p className="font-semibold text-slate-900">
                        {log.user_name}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        ID: {log.user_id} {log.user_role ? `(${log.user_role})` : ""}
                      </p>
                    </td>
                    <td className="py-4 px-5 font-medium text-slate-800">
                      {log.action}
                    </td>
                    <td className="py-4 px-5">
                      <span className="px-2.5 py-1 text-[11px] font-bold rounded-md bg-slate-100 text-slate-700 whitespace-nowrap">
                        {log.object_type}: {log.object_id}
                      </span>
                    </td>
                    <td className="py-4 px-5">
                      <span
                        className={`px-2.5 py-0.5 text-[11px] font-bold rounded-md whitespace-nowrap ${log.result === "SUCCESS"
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
                          setSelectedLog(log);
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

        {/* Pagination Bar (UC-ADM-13 Step 2) */}
        {filteredLogs.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredLogs.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
            itemName="bản ghi"
          />
        )}
      </div>

      {/* Log Detail Modal (UC-ADM-13 Step 5: Xem chi tiết người thực hiện, thời gian, loại thao tác, đối tượng, old_value vs new_value) */}
      {selectedLog && (
        <AccessibleDialog onClose={() => setSelectedLog(null)} ariaLabel="Chi tiết nhật ký hệ thống">
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
                    {selectedLog.log_id}
                  </span>
                  <span
                    className={`px-2 py-0.5 text-[10px] font-bold rounded-md ${selectedLog.result === "SUCCESS"
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
              {/* Metadata Grid */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-400 font-medium">Người thực hiện:</span>
                  <p className="font-bold text-slate-800 text-sm mt-0.5">
                    {selectedLog.user_name}
                  </p>
                  <p className="text-slate-500 font-mono text-[11px]">
                    ID: {selectedLog.user_id} {selectedLog.user_role ? `(${selectedLog.user_role})` : ""}
                  </p>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">Thời gian thực hiện:</span>
                  <p className="font-bold text-slate-800 text-sm mt-0.5 font-mono">
                    {selectedLog.performed_at}
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
                    {selectedLog.object_type} &rarr; {selectedLog.object_id}
                  </p>
                </div>
              </div>

              {/* Data Change Diff: old_value vs new_value (UC-ADM-13) */}
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
                    {selectedLog.old_value ? (
                      <pre className="font-mono text-[11px] text-slate-800 bg-white p-2.5 rounded-lg border border-rose-100 overflow-x-auto whitespace-pre-wrap">
                        {selectedLog.old_value}
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
                    {selectedLog.new_value ? (
                      <pre className="font-mono text-[11px] text-slate-800 bg-white p-2.5 rounded-lg border border-emerald-100 overflow-x-auto whitespace-pre-wrap">
                        {selectedLog.new_value}
                      </pre>
                    ) : (
                      <p className="text-slate-400 italic text-center py-4">
                        (Không có dữ liệu mới / Thao tác xóa)
                      </p>
                    )}
                  </div>
                </div>
              </div>
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
        </AccessibleDialog>
      )}
    </div>
  );
}
