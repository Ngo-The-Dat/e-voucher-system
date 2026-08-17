"use client";

import Icon from "@/components/shared/ui/Icon";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/shared/ui/Button";
import { adminApi, AdminPendingEmployeeDetail } from "@/lib/admin-api";

export default function EmployeePendingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const employeeIdStr = (params?.id as string) || "";

  const [employee, setEmployee] = useState<AdminPendingEmployeeDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  const fetchEmployeeDetail = useCallback(async () => {
    if (!employeeIdStr) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await adminApi.getPendingEmployee(employeeIdStr);
      setEmployee(data);
    } catch (err: any) {
      console.error("Lỗi tải chi tiết nhân viên:", err);
      setError(err?.message || "Không thể kết nối máy chủ.");
    } finally {
      setIsLoading(false);
    }
  }, [employeeIdStr]);

  useEffect(() => {
    fetchEmployeeDetail();
  }, [fetchEmployeeDetail]);

  const handleApprove = async () => {
    if (!employeeIdStr) return;
    setActionLoading(true);
    try {
      await adminApi.approveEmployee(employeeIdStr);
      setEmployee((prev) =>
        prev
          ? {
              ...prev,
              approval_status: "APPROVED",
              account_status: "ACTIVE",
              reviewed_at: new Date().toISOString(),
            }
          : null
      );
      toast.success("Phê duyệt hồ sơ nhân viên thành công! Nhân viên đã có thể đăng nhập vào hệ thống.");
    } catch (err: any) {
      toast.error(`Lỗi phê duyệt: ${err?.message || "Không thể thực hiện."}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmReject = async () => {
    if (!employeeIdStr || !rejectionReason.trim()) return;
    setActionLoading(true);
    try {
      const res = await adminApi.rejectEmployee(employeeIdStr, rejectionReason.trim());
      setEmployee((prev) =>
        prev
          ? {
              ...prev,
              approval_status: "REJECTED",
              admin_feedback: rejectionReason.trim(),
              reviewed_at: new Date().toISOString(),
            }
          : null
      );
      setRejectModalOpen(false);
      toast.success(res.message || `Đã từ chối hồ sơ nhân viên với lý do: "${rejectionReason}"`);
    } catch (err: any) {
      toast.error(`Lỗi từ chối: ${err?.message || "Không thể thực hiện."}`);
    } finally {
      setActionLoading(false);
    }
  };

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

  const getStatusDisplay = (approvalStatus?: string) => {
    switch (approvalStatus) {
      case "PENDING":
        return { label: "Chờ duyệt", color: "bg-amber-50 text-amber-700 border-amber-200/70", dot: "bg-amber-500" };
      case "APPROVED":
        return { label: "Đã duyệt", color: "bg-emerald-50 text-emerald-700 border-emerald-200/70", dot: "bg-emerald-500" };
      case "REJECTED":
        return { label: "Từ chối", color: "bg-rose-50 text-rose-700 border-rose-200/70", dot: "bg-rose-500" };
      default:
        return { label: approvalStatus || "Chờ duyệt", color: "bg-amber-50 text-amber-700 border-amber-200/70", dot: "bg-amber-500" };
    }
  };

  const getGenderText = (gender?: string | null) => {
    if (gender === "MALE") return "Nam";
    if (gender === "FEMALE") return "Nữ";
    if (gender === "OTHER") return "Khác";
    return "Chưa cập nhật";
  };

  if (isLoading) {
    return (
      <div className="p-12 text-center max-w-5xl mx-auto">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-50 text-blue-600 mb-3 animate-spin">
          <Icon name="progress_activity" className="text-2xl" />
        </div>
        <p className="text-sm text-slate-500 font-medium">Đang tải chi tiết hồ sơ nhân viên...</p>
      </div>
    );
  }

  if (error || !employee) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="p-6 bg-rose-50 border border-rose-200 rounded-2xl text-center space-y-3">
          <Icon name="error" className="text-3xl text-rose-500 mx-auto" />
          <h2 className="text-lg font-bold text-rose-800">Không tìm thấy hồ sơ</h2>
          <p className="text-sm text-rose-600 max-w-md mx-auto">{error || "Hồ sơ nhân viên không tồn tại hoặc đã bị xóa."}</p>
          <div className="pt-2">
            <Link
              href="/admin/partners/employee-pending"
              className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-rose-200 rounded-xl text-rose-700 text-sm font-semibold hover:bg-rose-100/50 transition shadow-sm"
            >
              <Icon name="arrow_back" className="text-base" />
              <span>Quay lại danh sách duyệt</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const statusConfig = getStatusDisplay(employee.approval_status);

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      {/* Breadcrumb Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <Link href="/admin/partners/employee-pending" className="hover:text-blue-600 transition">
              ĐỐI TÁC
            </Link>
            <span>&rsaquo;</span>
            <Link href="/admin/partners/employee-pending" className="hover:text-blue-600 transition">
              Duyệt nhân viên đối tác
            </Link>
            <span>&rsaquo;</span>
            <span className="text-slate-600">Chi tiết hồ sơ #{employee.user_id}</span>
          </div>
          <div className="flex items-center gap-3 mt-1">
            <Link
              href="/admin/partners/employee-pending"
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
              title="Quay lại danh sách"
            >
              <Icon name="arrow_back" className="text-xl" />
            </Link>
            <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2.5">
              <span>{employee.full_name}</span>
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border ${statusConfig.color}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot}`}></span>
                {statusConfig.label}
              </span>
            </h1>
          </div>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-2.5">
          <Link
            href="/admin/partners/employee-pending"
            className="px-3.5 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition shadow-sm"
          >
            Quay lại
          </Link>
          {employee.approval_status === "PENDING" && (
            <>
              <Button
                variant="outline"
                onClick={() => {
                  setRejectionReason("");
                  setRejectModalOpen(true);
                }}
                disabled={actionLoading}
                className="px-4 py-2 text-xs font-semibold text-rose-600 border-rose-200 bg-white hover:bg-rose-50 hover:border-rose-300 transition rounded-xl"
              >
                <Icon name="close" className="text-base mr-1" />
                <span>Từ chối</span>
              </Button>
              <Button
                onClick={handleApprove}
                disabled={actionLoading}
                className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 transition rounded-xl shadow-sm shadow-blue-500/20"
              >
                {actionLoading ? (
                  <Icon name="progress_activity" className="text-base animate-spin mr-1" />
                ) : (
                  <Icon name="check" className="text-base mr-1" />
                )}
                <span>Phê duyệt hồ sơ</span>
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Main Content Cards */}
      <div className="space-y-6">
        {/* Card 1: Thông tin nhân viên */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
              <Icon name="person" className="text-blue-600 text-lg" />
              <span>Thông tin cá nhân nhân viên</span>
            </h2>
            <span className="px-2.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-100 text-xs font-semibold rounded-lg">
              Vai trò: Nhân viên đối tác
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div className="space-y-1">
              <span className="text-xs text-slate-400 block font-medium">Họ và tên</span>
              <span className="font-semibold text-slate-900 block">{employee.full_name}</span>
            </div>
            <div className="space-y-1">
              <span className="text-xs text-slate-400 block font-medium">Địa chỉ Email</span>
              <span className="font-medium text-slate-800 block">{employee.email}</span>
            </div>
            <div className="space-y-1">
              <span className="text-xs text-slate-400 block font-medium">Số điện thoại</span>
              <span className="font-medium text-slate-800 block">{employee.phone || "Chưa cập nhật"}</span>
            </div>
            <div className="space-y-1">
              <span className="text-xs text-slate-400 block font-medium">Số CCCD / CMND</span>
              <span className="font-mono font-medium text-slate-800 block">{employee.identity_no || "Chưa cập nhật"}</span>
            </div>
            <div className="space-y-1">
              <span className="text-xs text-slate-400 block font-medium">Giới tính</span>
              <span className="text-slate-800 block">{getGenderText(employee.gender)}</span>
            </div>
            <div className="space-y-1">
              <span className="text-xs text-slate-400 block font-medium">Quốc tịch</span>
              <span className="text-slate-800 block">{employee.nationality || "Việt Nam"}</span>
            </div>
            <div className="space-y-1">
              <span className="text-xs text-slate-400 block font-medium">Thời gian gửi duyệt</span>
              <span className="text-slate-600 block text-xs">{formatDateDisplay(employee.submitted_at || employee.created_at)}</span>
            </div>
            <div className="space-y-1">
              <span className="text-xs text-slate-400 block font-medium">Đăng nhập lần cuối</span>
              <span className="text-slate-600 block text-xs">{formatDateDisplay(employee.last_login_at)}</span>
            </div>
          </div>
        </div>

        {/* Card 2: Thông tin Đơn vị công tác & Chi nhánh */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
              <Icon name="storefront" className="text-blue-600 text-lg" />
              <span>Đơn vị công tác & Chi nhánh phân công</span>
            </h2>
          </div>

          <div className="space-y-4 text-sm">
            {/* Doanh nghiệp đối tác */}
            <div className="p-3.5 bg-slate-50/70 rounded-xl border border-slate-100 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Doanh nghiệp chủ quản</span>
                <Link
                  href={`/admin/partners/manage/${employee.partner_id}`}
                  className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1 hover:underline"
                >
                  <span>Xem đối tác</span>
                  <Icon name="open_in_new" className="text-xs" />
                </Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-slate-400 block">Tên doanh nghiệp:</span>
                  <span className="font-semibold text-slate-800 text-sm block">{employee.business_name}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Mã số thuế:</span>
                  <span className="font-mono font-medium text-slate-700 block">{employee.tax_code}</span>
                </div>
                {employee.business_license_no && (
                  <div>
                    <span className="text-slate-400 block">Số ĐKKD:</span>
                    <span className="text-slate-700 block">{employee.business_license_no}</span>
                  </div>
                )}
                {employee.partner_activity_status && (
                  <div>
                    <span className="text-slate-400 block">Trạng thái đối tác:</span>
                    <span className="font-semibold text-emerald-600 block">{employee.partner_activity_status}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Chi nhánh làm việc */}
            <div className="p-3.5 bg-blue-50/40 rounded-xl border border-blue-100/60 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-blue-800 uppercase tracking-wider">Chi nhánh làm việc</span>
                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200/60 text-[11px] font-bold rounded-md">
                  {employee.branch_status || "ACTIVE"}
                </span>
              </div>
              <div className="space-y-1.5 text-xs">
                <div>
                  <span className="text-slate-400 block">Tên chi nhánh:</span>
                  <span className="font-bold text-slate-900 text-sm block">{employee.branch_name}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Địa chỉ:</span>
                  <span className="text-slate-700 font-medium block">{employee.branch_address}</span>
                </div>
                {employee.branch_phone && (
                  <div>
                    <span className="text-slate-400 block">Hotline chi nhánh:</span>
                    <span className="text-slate-700 font-medium block">{employee.branch_phone}</span>
                  </div>
                )}
                {employee.branch_region && (
                  <div>
                    <span className="text-slate-400 block">Khu vực:</span>
                    <span className="text-slate-700 block">{employee.branch_region}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Reject Modal */}
      {rejectModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-rose-600 font-bold text-base">
                <Icon name="report" className="text-xl" />
                <span>Từ chối hồ sơ nhân viên</span>
              </div>
              <button
                type="button"
                onClick={() => setRejectModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg transition"
              >
                <Icon name="close" className="text-lg" />
              </button>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Vui lòng nhập lý do từ chối hồ sơ của nhân viên <strong className="text-slate-800">{employee.full_name}</strong> để thông báo cho đối tác:
            </p>

            <div>
              <textarea
                rows={4}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Nhập lý do chi tiết (ví dụ: CCCD không rõ ràng, thông tin chi nhánh chưa đúng...)"
                className="w-full p-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 text-slate-800"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              <Button
                variant="outline"
                type="button"
                onClick={() => setRejectModalOpen(false)}
                disabled={actionLoading}
                className="px-4 py-2 text-xs font-semibold text-slate-600 border-slate-200 bg-white hover:bg-slate-50 rounded-xl"
              >
                Hủy bỏ
              </Button>
              <Button
                type="button"
                onClick={handleConfirmReject}
                disabled={actionLoading || !rejectionReason.trim()}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50 transition rounded-xl shadow-sm"
              >
                {actionLoading ? "Đang xử lý..." : "Xác nhận từ chối"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
