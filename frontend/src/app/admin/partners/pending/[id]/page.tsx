/**
 * =========================================================================================
 * FILE: [id]/page.tsx
 * VỊ TRÍ: frontend/src/app/admin/partners/pending/[id]/
 * VAI TRÒ TRONG HỆ THỐNG:
 *   - Màn hình Chi tiết Hồ sơ Đăng ký Đối tác chờ duyệt (UC-ADM-01).
 *   - Chức năng:
 *       1. Hiển thị thông tin pháp lý doanh nghiệp (Tên DN, MST, Số ĐKKD, Ngày/Nơi cấp).
 *       2. Hiển thị danh sách các chi nhánh đăng ký nộp kèm.
 *       3. Hiển thị thông tin người đại diện pháp luật (Họ tên, Email, SĐT, CCCD).
 *       4. Thao tác Phê duyệt đối tác (Chuyển trạng thái sang ACTIVE, đồng bộ dữ liệu).
 *       5. Thao tác Từ chối hồ sơ kèm Modal nhập lý do.
 * =========================================================================================
 */

"use client";

import Icon from "@/components/shared/ui/Icon";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/shared/ui/Button";
import { adminApi, AdminPartnerDetail } from "@/lib/admin-api";

export default function PendingPartnerDetailPage() {
  // ─── 1. Lấy partnerId từ URL Route Params ──────────────────────────────────────────
  const params = useParams();
  const partnerIdStr = (params?.id as string) || "";

  // ─── 2. State dữ liệu hồ sơ & Trạng thái thao tác ─────────────────────────────────
  const [partner, setPartner] = useState<AdminPartnerDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // State Modal Từ chối & Lý do
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  /**
   * ---------------------------------------------------------------------------------------
   * HÀM: fetchPartnerDetail
   * MỤC ĐÍCH: Gọi API `adminApi.getPendingPartner` để lấy toàn bộ thông tin chi tiết của đối tác.
   * ---------------------------------------------------------------------------------------
   */
  const fetchPartnerDetail = useCallback(async () => {
    if (!partnerIdStr) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await adminApi.getPendingPartner(partnerIdStr);
      setPartner(data);
    } catch (err: any) {
      console.error("Lỗi tải chi tiết đối tác pending:", err);
      setError(err?.message || "Không thể kết nối máy chủ.");
    } finally {
      setIsLoading(false);
    }
  }, [partnerIdStr]);

  useEffect(() => {
    fetchPartnerDetail();
  }, [fetchPartnerDetail]);

  /**
   * ---------------------------------------------------------------------------------------
   * HÀM: handleApprove
   * MỤC ĐÍCH: Phê duyệt hồ sơ đối tác, kích hoạt tài khoản đối tác hoạt động trên sàn.
   * ---------------------------------------------------------------------------------------
   */
  const handleApprove = async () => {
    if (!partnerIdStr) return;
    setActionLoading(true);
    try {
      await adminApi.approvePartner(partnerIdStr);
      setPartner((prev) => (prev ? { ...prev, approval_status: "APPROVED", activity_status: "ACTIVE" } : null));
      toast.success("Phê duyệt hồ sơ thành công! Hồ sơ đối tác đã được duyệt và chuyển sang danh sách Quản lý đối tác.");
    } catch (err: any) {
      toast.error(`Lỗi phê duyệt: ${err?.message || "Không thể thực hiện."}`);
    } finally {
      setActionLoading(false);
    }
  };

  /**
   * ---------------------------------------------------------------------------------------
   * HÀM: handleConfirmReject
   * MỤC ĐÍCH: Xác nhận từ chối hồ sơ đối tác trong Modal kèm lý do.
   * ---------------------------------------------------------------------------------------
   */
  const handleConfirmReject = async () => {
    if (!partnerIdStr || !rejectionReason.trim()) return;
    setActionLoading(true);
    try {
      const res = await adminApi.rejectPartner(partnerIdStr, rejectionReason.trim());
      setPartner((prev) => (prev ? { ...prev, approval_status: "REJECTED" } : null));
      setRejectModalOpen(false);
      toast.success(res.message || `Đã từ chối hồ sơ đối tác với lý do: "${rejectionReason}"`);
    } catch (err: any) {
      toast.error(`Lỗi từ chối: ${err?.message || "Không thể thực hiện."}`);
    } finally {
      setActionLoading(false);
    }
  };

  /**
   * Định dạng ngày tháng
   */
  const formatDateDisplay = (dateStr?: string | null) => {
    if (!dateStr) return "N/A";
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
    } catch {
      return dateStr;
    }
  };

  /**
   * Cấu hình nhãn và màu sắc trạng thái duyệt
   */
  const getStatusDisplay = (approvalStatus?: string) => {
    switch (approvalStatus) {
      case "PENDING":
        return { label: "Chờ duyệt", color: "bg-amber-50 text-amber-600 border-amber-200/70", dot: "bg-amber-500" };
      case "APPROVED":
        return { label: "Đã duyệt", color: "bg-emerald-50 text-emerald-600 border-emerald-200/70", dot: "bg-emerald-500" };
      case "REJECTED":
        return { label: "Từ chối", color: "bg-rose-50 text-rose-600 border-rose-200/70", dot: "bg-rose-500" };
      default:
        return { label: approvalStatus || "Chờ duyệt", color: "bg-amber-50 text-amber-600 border-amber-200/70", dot: "bg-amber-500" };
    }
  };

  // Loading Skeleton State
  if (isLoading) {
    return (
      <div className="p-12 text-center">
        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs text-slate-500 font-medium">Đang tải thông tin hồ sơ đối tác...</p>
      </div>
    );
  }

  // Error State
  if (error || !partner) {
    return (
      <div className="p-12 text-center max-w-lg mx-auto">
        <Icon name="error" className="text-4xl text-rose-500 mb-2 mx-auto" />
        <h3 className="text-base font-bold text-slate-800">Không tìm thấy đối tác</h3>
        <p className="text-xs text-slate-500 mt-1 mb-4">{error || "Hồ sơ đối tác không tồn tại hoặc đã bị xóa."}</p>
        <Link
          href="/admin/partners/pending"
          className="px-4 py-2 bg-blue-600 text-white font-semibold text-xs rounded-xl hover:bg-blue-700 transition"
        >
          Quay lại danh sách
        </Link>
      </div>
    );
  }

  const statusInfo = getStatusDisplay(partner.approval_status);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* ─── PHẦN 1: Header & Breadcrumb Navigation ──────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Link href="/admin/partners/pending" className="hover:text-blue-600 transition">
              ĐỐI TÁC
            </Link>
            <span>&rsaquo;</span>
            <Link href="/admin/partners/pending" className="hover:text-blue-600 transition">
              DUYỆT HỒ SƠ ĐỐI TÁC
            </Link>
            <span>&rsaquo;</span>
            <span className="text-slate-600">CHI TIẾT HỒ SƠ</span>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              {partner.business_name}
            </h1>
            <span
              className={`px-3 py-1 font-bold text-xs rounded-full inline-flex items-center gap-1.5 border ${statusInfo.color}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${statusInfo.dot}`} />
              {statusInfo.label}
            </span>
          </div>
        </div>

        {/* Các nút bấm thao tác (Phê duyệt / Từ chối) */}
        <div className="flex items-center gap-2.5">
          <Link
            href="/admin/partners/pending"
            className="px-4 py-2 border border-slate-200 bg-white text-slate-700 font-semibold text-xs rounded-xl hover:bg-slate-50 transition shadow-2xs"
          >
            Quay lại
          </Link>
          {partner.approval_status === "PENDING" && (
            <>
              {/* Nút Mở Modal Từ chối */}
              <Button
                variant="outline"
                type="button"
                onClick={() => setRejectModalOpen(true)}
                disabled={actionLoading}
                className="bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100"
              >
                Từ chối hồ sơ
              </Button>

              {/* Nút Phê duyệt hồ sơ */}
              <Button
                type="button"
                onClick={handleApprove}
                disabled={actionLoading}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Icon name="check" className="text-base mr-1.5" />
                {actionLoading ? "Đang xử lý..." : "Phê duyệt hồ sơ"}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* ─── PHẦN 2: Nội dung chính dạng 2 Cột (2/3 & 1/3) ─────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* CỘT TRÁI (2/3): Thông tin doanh nghiệp & Danh sách chi nhánh */}
        <div className="lg:col-span-2 space-y-6">
          {/* Card Thông tin doanh nghiệp */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <Icon name="storefront" className="text-blue-600" />
              Thông tin đăng ký doanh nghiệp
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <span className="block text-slate-400 font-bold uppercase tracking-wider mb-1">
                  Tên doanh nghiệp
                </span>
                <span className="font-bold text-slate-900 text-sm">{partner.business_name}</span>
              </div>
              <div>
                <span className="block text-slate-400 font-bold uppercase tracking-wider mb-1">
                  Mã số thuế
                </span>
                <span className="font-bold text-slate-900 text-sm font-mono">{partner.tax_code}</span>
              </div>
              <div>
                <span className="block text-slate-400 font-bold uppercase tracking-wider mb-1">
                  Ngày đăng ký
                </span>
                <span className="font-semibold text-slate-800 text-sm font-mono">
                  {formatDateDisplay(partner.registered_at)}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs pt-3 border-t border-slate-100">
              <div>
                <span className="block text-slate-400 font-bold uppercase tracking-wider mb-1">
                  Số ĐKKD
                </span>
                <span className="font-semibold text-slate-800 font-mono">
                  {partner.business_license_no || "Chưa cập nhật"}
                </span>
              </div>
              <div>
                <span className="block text-slate-400 font-bold uppercase tracking-wider mb-1">
                  Ngày cấp ĐKKD
                </span>
                <span className="font-semibold text-slate-800 font-mono">
                  {formatDateDisplay(partner.license_issue_date)}
                </span>
              </div>
              <div>
                <span className="block text-slate-400 font-bold uppercase tracking-wider mb-1">
                  Nơi cấp ĐKKD
                </span>
                <span className="font-semibold text-slate-800">
                  {partner.license_issue_place || "Chưa cập nhật"}
                </span>
              </div>
            </div>
          </div>

          {/* Card Danh sách chi nhánh nộp duyệt */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Icon name="location_on" className="text-blue-600" />
                Danh sách chi nhánh nộp duyệt ({partner.branches?.length ?? partner.branches_count ?? 0})
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-200/70">
                    <th className="py-3 px-4">MÃ CHI NHÁNH</th>
                    <th className="py-3 px-4">TÊN CHI NHÁNH</th>
                    <th className="py-3 px-4">ĐỊA CHỈ</th>
                    <th className="py-3 px-4">KHU VỰC</th>
                    <th className="py-3 px-4 whitespace-nowrap">TRẠNG THÁI</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {!partner.branches || partner.branches.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400 font-medium">
                        Chưa có chi nhánh nào nộp duyệt.
                      </td>
                    </tr>
                  ) : (
                    partner.branches.map((b, index) => {
                      const branchCode = `CN-SV-0${index + 1}`;
                      return (
                        <tr key={b.branch_id} className="hover:bg-slate-50/60 transition">
                          <td className="py-3.5 px-4 font-mono font-bold text-slate-800">{branchCode}</td>
                          <td className="py-3.5 px-4 font-bold text-slate-900">{b.branch_name}</td>
                          <td className="py-3.5 px-4 text-slate-700 max-w-xs">{b.address}</td>
                          <td className="py-3.5 px-4 font-semibold text-slate-700">{b.region || "Hà Nội"}</td>
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <span className="px-3 py-1 font-bold text-xs rounded-full inline-flex items-center gap-1.5 border bg-amber-50 text-amber-600 border-amber-200/70 whitespace-nowrap shrink-0">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                              Chờ duyệt
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* CỘT PHẢI (1/3): Thông tin người đại diện pháp luật */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <Icon name="person" className="text-blue-600" />
              Người đại diện pháp luật
            </h2>
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-700 font-bold text-lg flex items-center justify-center shrink-0">
                {partner.representative_name ? partner.representative_name.slice(0, 2).toUpperCase() : "ND"}
              </div>
              <div>
                <div className="font-bold text-slate-900 text-sm">
                  {partner.representative_name}
                </div>
                <div className="text-xs text-slate-400 font-medium">
                  {partner.email}
                </div>
              </div>
            </div>
            <div className="space-y-2.5 pt-2 border-t border-slate-100 text-xs">
              <div>
                <span className="block text-slate-400 font-bold uppercase tracking-wider">
                  Họ và tên
                </span>
                <span className="font-semibold text-slate-800">
                  {partner.representative_name}
                </span>
              </div>
              <div>
                <span className="block text-slate-400 font-bold uppercase tracking-wider">
                  Email
                </span>
                <span className="font-semibold text-slate-800">
                  {partner.email}
                </span>
              </div>
              <div>
                <span className="block text-slate-400 font-bold uppercase tracking-wider">
                  Số điện thoại
                </span>
                <span className="font-semibold text-slate-800 font-mono">
                  {partner.phone || "Chưa cập nhật"}
                </span>
              </div>
              <div>
                <span className="block text-slate-400 font-bold uppercase tracking-wider">
                  Số CCCD / CMND
                </span>
                <span className="font-semibold text-slate-800 font-mono">
                  {partner.identity_no || "Chưa cập nhật"}
                </span>
              </div>
              <div>
                <span className="block text-slate-400 font-bold uppercase tracking-wider">
                  Giới tính
                </span>
                <span className="font-semibold text-slate-800">
                  {partner.gender === "MALE" ? "Nam" : partner.gender === "FEMALE" ? "Nữ" : partner.gender || "Chưa cập nhật"}
                </span>
              </div>
              <div>
                <span className="block text-slate-400 font-bold uppercase tracking-wider">
                  Quốc tịch
                </span>
                <span className="font-semibold text-slate-800">
                  {partner.nationality || "Việt Nam"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── PHẦN 3: Modal Nhập Lý Do Từ Chối ────────────────────────────────────── */}
      {rejectModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
                <Icon name="warning" className="text-rose-500" />
                Từ chối hồ sơ đối tác
              </h3>
              <Button
                variant="ghost"
                onClick={() => setRejectModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 h-auto"
              >
                <Icon name="close" />
              </Button>
            </div>
            <p className="text-xs text-slate-500">
              Vui lòng nhập lý do từ chối để hệ thống phản hồi chính xác tới người đại diện doanh nghiệp.
            </p>
            <textarea
              rows={3}
              placeholder="Nhập lý do từ chối..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:border-rose-500 focus:ring-1 focus:ring-rose-500 outline-none transition"
            />
            <div className="flex justify-end gap-3 mt-2">
              <Button
                variant="outline"
                type="button"
                onClick={() => setRejectModalOpen(false)}
              >
                Hủy bỏ
              </Button>
              <Button
                type="button"
                onClick={handleConfirmReject}
                disabled={!rejectionReason.trim() || actionLoading}
                className="bg-rose-600 hover:bg-rose-700 text-white disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-rose-600 transition-all"
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
