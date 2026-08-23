/**
 * =========================================================================================
 * FILE: [id]/page.tsx
 * VỊ TRÍ: frontend/src/app/admin/partners/manage/[id]/
 * VAI TRÒ TRONG HỆ THỐNG:
 *   - Màn hình Quản trị Chi tiết Doanh nghiệp Đối tác (UC-ADM-02: Quản lý đối tác).
 *   - Các tính năng chính:
 *       1. Xem toàn diện hồ sơ đối tác (Thông tin pháp lý, Người đại diện, Thống kê số lượng).
 *       2. Quản lý Khóa / Mở khóa tài khoản (LOCK / UNLOCK) kèm lưu lý do vào CSDL.
 *       3. Quản lý chi nhánh đối tác (Branch Management CRUD): Thêm mới, Sửa, Xóa chi nhánh.
 *       4. Xem danh sách các chương trình Voucher do đối tác này phát hành.
 * =========================================================================================
 */

"use client";

import Icon from "@/components/shared/ui/Icon";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/shared/ui/Button";
import { Input } from "@/components/shared/ui/Input";
import FormField from "@/components/shared/ui/FormField";
import { adminApi, AdminPartnerDetail, AdminBranchItem } from "@/lib/admin-api";

export default function ManagePartnerDetailPage() {
  // ─── 1. Lấy partnerId từ URL Route ─────────────────────────────────────────────────
  const params = useParams();
  const partnerIdStr = (params?.id as string) || "";

  // ─── 2. State dữ liệu đối tác & Chi nhánh ──────────────────────────────────────────
  const [partner, setPartner] = useState<AdminPartnerDetail | null>(null);
  const [branches, setBranches] = useState<AdminBranchItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ─── 3. State Modal Khóa / Mở khóa tài khoản ───────────────────────────────────────
  const [lockModalOpen, setLockModalOpen] = useState(false);
  const [lockReason, setLockReason] = useState("");

  // ─── 4. State Modal Quản lý Chi nhánh (Thêm / Sửa / Xóa) ───────────────────────────
  const [branchModalOpen, setBranchModalOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<AdminBranchItem | null>(null);
  const [branchForm, setBranchForm] = useState<{
    branch_name: string;
    address: string;
    region: string;
    phone: string;
    status: "ACTIVE" | "INACTIVE";
  }>({
    branch_name: "",
    address: "",
    region: "Hà Nội",
    phone: "",
    status: "ACTIVE",
  });
  const [deleteBranchId, setDeleteBranchId] = useState<number | null>(null);

  /**
   * ---------------------------------------------------------------------------------------
   * HÀM: fetchPartnerDetail
   * MỤC ĐÍCH: Gọi API `adminApi.getManagedPartner` lấy toàn bộ thông tin đối tác, chi nhánh, voucher.
   * ---------------------------------------------------------------------------------------
   */
  const fetchPartnerDetail = useCallback(async () => {
    if (!partnerIdStr) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await adminApi.getManagedPartner(partnerIdStr);
      setPartner(data);
      setBranches(data.branches ?? []);
    } catch (err: any) {
      console.error("Lỗi tải chi tiết đối tác:", err);
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
   * HÀM: handleConfirmLockToggle
   * MỤC ĐÍCH: Thực hiện Khóa (nếu đang ACTIVE) hoặc Mở khóa (nếu đang LOCKED) tài khoản đối tác.
   * ---------------------------------------------------------------------------------------
   */
  const handleConfirmLockToggle = async () => {
    if (!partner || !partnerIdStr) return;
    setActionLoading(true);
    try {
      if (partner.activity_status === "ACTIVE") {
        if (!lockReason.trim()) {
          toast.error("Vui lòng nhập lý do khóa.");
          setActionLoading(false);
          return;
        }
        const res = await adminApi.lockPartner(partnerIdStr, lockReason.trim());
        toast.success(res.message || `Đã khóa đối tác. Lý do: "${lockReason}"`);
      } else {
        const res = await adminApi.unlockPartner(partnerIdStr);
        toast.success(res.message || "Đã mở khóa tài khoản đối tác thành công.");
      }
      setLockModalOpen(false);
      setLockReason("");
      fetchPartnerDetail();
    } catch (err: any) {
      toast.error(`Lỗi thực hiện: ${err?.message || "Không thể xử lý."}`);
    } finally {
      setActionLoading(false);
    }
  };

  /**
   * Mở modal thêm chi nhánh mới
   */
  const handleOpenAddBranch = () => {
    setEditingBranch(null);
    setBranchForm({
      branch_name: "",
      address: "",
      region: "Hà Nội",
      phone: "",
      status: "ACTIVE",
    });
    setBranchModalOpen(true);
  };

  /**
   * Mở modal sửa thông tin chi nhánh
   */
  const handleOpenEditBranch = (branch: AdminBranchItem) => {
    setEditingBranch(branch);
    setBranchForm({
      branch_name: branch.branch_name,
      address: branch.address,
      region: branch.region || "Hà Nội",
      phone: branch.phone || "",
      status: branch.status,
    });
    setBranchModalOpen(true);
  };

  /**
   * Lưu thông tin chi nhánh (Tạo mới hoặc Cập nhật)
   */
  const handleSaveBranch = async () => {
    if (!branchForm.branch_name.trim() || !branchForm.address.trim()) return;

    if (branchForm.phone.trim()) {
      const cleanPhone = branchForm.phone.trim().replace(/[\s-]/g, "");
      if (!/^[0-9+]{8,15}$/.test(cleanPhone)) {
        toast.error("Số điện thoại chi nhánh không hợp lệ (phải từ 8 đến 15 ký tự số).");
        return;
      }
    }

    setActionLoading(true);
    try {
      if (editingBranch) {
        await adminApi.updatePartnerBranch(partnerIdStr, editingBranch.branch_id, branchForm);
        toast.success(`Đã cập nhật chi nhánh "${branchForm.branch_name}" thành công!`);
      } else {
        await adminApi.createPartnerBranch(partnerIdStr, branchForm);
        toast.success(`Đã thêm chi nhánh mới "${branchForm.branch_name}" thành công!`);
      }
      setBranchModalOpen(false);
      fetchPartnerDetail();
    } catch (err: any) {
      toast.error(`Lỗi lưu chi nhánh: ${err?.message || "Không thể thực hiện."}`);
    } finally {
      setActionLoading(false);
    }
  };

  /**
   * Xác nhận xóa chi nhánh
   */
  const handleConfirmDeleteBranch = async () => {
    if (!deleteBranchId) return;
    setActionLoading(true);
    try {
      await adminApi.deletePartnerBranch(partnerIdStr, deleteBranchId);
      toast.success("Đã xóa chi nhánh thành công!");
      setDeleteBranchId(null);
      fetchPartnerDetail();
    } catch (err: any) {
      toast.error(`Lỗi xóa chi nhánh: ${err?.message || "Không thể thực hiện."}`);
    } finally {
      setActionLoading(false);
    }
  };

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

  if (isLoading) {
    return (
      <div className="p-12 text-center">
        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs text-slate-500 font-medium">Đang tải thông tin chi tiết đối tác...</p>
      </div>
    );
  }

  if (error || !partner) {
    return (
      <div className="p-12 text-center max-w-lg mx-auto">
        <Icon name="error" className="text-4xl text-rose-500 mb-2 mx-auto" />
        <h3 className="text-base font-bold text-slate-800">Không tìm thấy đối tác</h3>
        <p className="text-xs text-slate-500 mt-1 mb-4">{error || "Thông tin đối tác không tồn tại hoặc đã bị xóa."}</p>
        <Link
          href="/admin/partners/manage"
          className="px-4 py-2 bg-blue-600 text-white font-semibold text-xs rounded-xl hover:bg-blue-700 transition"
        >
          Quay lại danh sách
        </Link>
      </div>
    );
  }

  const isLocked = partner.activity_status === "LOCKED";

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* ─── PHẦN 1: Header & Nút Khóa / Mở Khóa Tài Khoản ──────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Link href="/admin/partners/manage" className="hover:text-blue-600 transition">
              ĐỐI TÁC
            </Link>
            <span>&rsaquo;</span>
            <Link href="/admin/partners/manage" className="hover:text-blue-600 transition">
              QUẢN LÝ ĐỐI TÁC
            </Link>
            <span>&rsaquo;</span>
            <span className="text-slate-600">CHI TIẾT ĐỐI TÁC</span>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              {partner.business_name}
            </h1>
            <span
              className={`px-3 py-1 font-bold text-xs rounded-full inline-flex items-center gap-1.5 border ${
                !isLocked
                  ? "bg-emerald-50 text-emerald-600 border-emerald-200/70"
                  : "bg-rose-50 text-rose-600 border-rose-200/70"
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  !isLocked ? "bg-emerald-500" : "bg-rose-500"
                }`}
              />
              {!isLocked ? "Đang hoạt động" : "Tạm khóa"}
            </span>
          </div>
        </div>

        {/* Nút Khóa / Mở khóa */}
        <div className="flex items-center gap-2.5">
          <Link
            href="/admin/partners/manage"
            className="px-4 py-2 border border-slate-200 bg-white text-slate-700 font-semibold text-xs rounded-xl hover:bg-slate-50 transition shadow-2xs"
          >
            Quay lại
          </Link>
          <Button
            variant={!isLocked ? "destructive" : "default"}
            type="button"
            onClick={() => setLockModalOpen(true)}
            disabled={actionLoading}
            className="px-4 py-2 text-xs"
          >
            <Icon name={!isLocked ? "lock" : "lock_open"} className="text-base mr-1.5" />
            {actionLoading ? "Đang xử lý..." : !isLocked ? "Tạm khóa" : "Mở khóa"}
          </Button>
        </div>
      </div>

      {/* Banner cảnh báo khi tài khoản bị khóa */}
      {isLocked && partner.lock_reason && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 space-y-1">
          <div className="font-bold flex items-center gap-1.5 text-rose-700">
            <Icon name="warning" className="text-base" />
            <span>Tài khoản đối tác đang bị khóa</span>
          </div>
          <p className="text-slate-700">Lý do khóa: "{partner.lock_reason}"</p>
        </div>
      )}

      {/* ─── PHẦN 2: Nội dung chính ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* CỘT TRÁI (2/3): Thông tin doanh nghiệp, Quản lý Chi nhánh, Chương trình Voucher */}
        <div className="lg:col-span-2 space-y-6">
          {/* Card Thông tin chung doanh nghiệp */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <Icon name="domain" className="text-blue-600" />
              Thông tin chung doanh nghiệp
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <span className="block text-slate-400 font-bold uppercase tracking-wider mb-1">
                  Mã đối tác (ID)
                </span>
                <span className="font-bold text-slate-900 text-sm font-mono">MER-{partner.user_id}</span>
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
                <span className="font-semibold text-slate-700 font-mono">{formatDateDisplay(partner.registered_at)}</span>
              </div>
              <div>
                <span className="block text-slate-400 font-bold uppercase tracking-wider mb-1">
                  Tổng số chi nhánh
                </span>
                <span className="font-bold text-blue-600">{branches.length} chi nhánh</span>
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

          {/* Card Quản lý Chi nhánh (CRUD) */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Icon name="store" className="text-blue-600" />
                  Danh sách chi nhánh ({branches.length})
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Quản lý thông tin chi nhánh: Mã chi nhánh, Tên chi nhánh, Địa chỉ, Khu vực, Trạng thái.
                </p>
              </div>
              <Button
                type="button"
                onClick={handleOpenAddBranch}
                className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs shrink-0 flex items-center gap-1.5"
              >
                <Icon name="add" className="text-base" />
                Thêm chi nhánh
              </Button>
            </div>

            {/* Bảng Chi nhánh */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-200/70">
                    <th className="py-3 px-4">MÃ CHI NHÁNH</th>
                    <th className="py-3 px-4">TÊN CHI NHÁNH</th>
                    <th className="py-3 px-4">ĐỊA CHỈ</th>
                    <th className="py-3 px-4">KHU VỰC</th>
                    <th className="py-3 px-4 whitespace-nowrap">TRẠNG THÁI</th>
                    <th className="py-3 px-4 text-right whitespace-nowrap">THAO TÁC</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {branches.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">
                        Chưa có chi nhánh nào. Nhấp "+ Thêm chi nhánh" để tạo mới.
                      </td>
                    </tr>
                  ) : (
                    branches.map((b) => (
                      <tr key={b.branch_id} className="hover:bg-slate-50/60 transition">
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-800">CN-{b.branch_id}</td>
                        <td className="py-3.5 px-4 font-bold text-slate-900">{b.branch_name}</td>
                        <td className="py-3.5 px-4 text-slate-700 max-w-xs">{b.address}</td>
                        <td className="py-3.5 px-4 font-semibold text-slate-700 whitespace-nowrap">{b.region || "Hà Nội"}</td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span
                            className={`px-2.5 py-0.5 font-bold text-[11px] rounded-full inline-flex items-center gap-1 whitespace-nowrap shrink-0 ${
                              b.status === "ACTIVE"
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : "bg-rose-50 text-rose-700 border border-rose-200"
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                b.status === "ACTIVE" ? "bg-emerald-500" : "bg-rose-500"
                              }`}
                            />
                            {b.status === "ACTIVE" ? "Hoạt động" : "Tạm ngưng"}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              variant="outline"
                              type="button"
                              onClick={() => handleOpenEditBranch(b)}
                              className="px-2.5 py-1 text-slate-700 bg-slate-100 hover:bg-slate-200 border-slate-200 font-semibold h-auto text-xs"
                            >
                              Sửa
                            </Button>
                            <Button
                              variant="destructive"
                              type="button"
                              onClick={() => setDeleteBranchId(b.branch_id)}
                              className="px-2.5 py-1 text-xs h-auto bg-rose-50 hover:bg-rose-100 text-rose-600 hover:text-rose-700 border-rose-100"
                            >
                              Xóa
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Card Danh sách chương trình Voucher do đối tác phát hành */}
          {partner.voucher_programs && partner.voucher_programs.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Icon name="confirmation_number" className="text-blue-600" />
                  Chương trình Voucher ({partner.voucher_programs.length})
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-200/70">
                      <th className="py-3 px-4">MÃ VP</th>
                      <th className="py-3 px-4">TÊN CHƯƠNG TRÌNH</th>
                      <th className="py-3 px-4">GIÁ GỐC</th>
                      <th className="py-3 px-4">GIÁ BÁN</th>
                      <th className="py-3 px-4">SỐ LƯỢNG</th>
                      <th className="py-3 px-4">TRẠNG THÁI</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {partner.voucher_programs.map((vp) => (
                      <tr key={vp.program_id} className="hover:bg-slate-50/60 transition">
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-800">VP-{vp.program_id}</td>
                        <td className="py-3.5 px-4 font-bold text-slate-900">{vp.program_name}</td>
                        <td className="py-3.5 px-4 text-slate-600 font-mono">
                          {Number(vp.original_price).toLocaleString("vi-VN")} đ
                        </td>
                        <td className="py-3.5 px-4 font-bold text-blue-600 font-mono">
                          {Number(vp.sale_price).toLocaleString("vi-VN")} đ
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-slate-800">{vp.issue_quantity}</td>
                        <td className="py-3.5 px-4 font-bold text-[11px] text-slate-700">
                          {vp.display_status}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* CỘT PHẢI (1/3): Người đại diện quản lý */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <Icon name="badge" className="text-blue-600" />
              Người đại diện quản lý
            </h2>
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-full bg-blue-600 text-white font-bold text-lg flex items-center justify-center shrink-0">
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
                <span className="block text-slate-400 font-bold uppercase tracking-wider mb-0.5">
                  Họ và tên
                </span>
                <span className="font-semibold text-slate-800">
                  {partner.representative_name}
                </span>
              </div>
              <div>
                <span className="block text-slate-400 font-bold uppercase tracking-wider mb-0.5">
                  Email
                </span>
                <span className="font-semibold text-slate-800">
                  {partner.email}
                </span>
              </div>
              <div>
                <span className="block text-slate-400 font-bold uppercase tracking-wider mb-0.5">
                  Số điện thoại
                </span>
                <span className="font-semibold text-slate-800 font-mono">
                  {partner.phone || "Chưa cập nhật"}
                </span>
              </div>
              <div>
                <span className="block text-slate-400 font-bold uppercase tracking-wider mb-0.5">
                  Giới tính
                </span>
                <span className="font-semibold text-slate-800">
                  {partner.gender === "MALE" ? "Nam" : partner.gender === "FEMALE" ? "Nữ" : partner.gender || "Chưa cập nhật"}
                </span>
              </div>
              <div>
                <span className="block text-slate-400 font-bold uppercase tracking-wider mb-0.5">
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

      {/* ─── PHẦN 3: Modal Khóa / Mở khóa Đối tác ─────────────────────────────────── */}
      {lockModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
                <Icon name={!isLocked ? "lock" : "lock_open"} className={`${ !isLocked ? "text-rose-500" : "text-emerald-500" }`} />
                {!isLocked
                  ? "Xác nhận tạm khóa đối tác"
                  : "Xác nhận mở khóa đối tác"}
              </h3>
              <Button
                variant="ghost"
                onClick={() => setLockModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 h-auto"
              >
                <Icon name="close" />
              </Button>
            </div>
            <p className="text-xs text-slate-500">
              {!isLocked
                ? "Khi bị khóa, đối tác này và tất cả các chi nhánh sẽ tạm thời không thể phát sinh giao dịch mới trên hệ thống."
                : "Đối tác sẽ quay trở lại trạng thái Đang hoạt động và tiếp tục kinh doanh bình thường."}
            </p>
            {!isLocked && (
              <textarea
                rows={3}
                placeholder="Nhập lý do khóa tài khoản đối tác..."
                value={lockReason}
                onChange={(e) => setLockReason(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:border-rose-500 focus:ring-1 focus:ring-rose-500 outline-none transition"
              />
            )}
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <Button
                variant="outline"
                type="button"
                onClick={() => setLockModalOpen(false)}
              >
                Hủy bỏ
              </Button>
              <Button
                variant={!isLocked ? "destructive" : "default"}
                type="button"
                onClick={handleConfirmLockToggle}
                disabled={(!isLocked && !lockReason.trim()) || actionLoading}
              >
                {actionLoading ? "Đang xử lý..." : !isLocked ? "Khóa ngay" : "Mở khóa ngay"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ─── PHẦN 4: Modal Thêm / Sửa Chi nhánh ────────────────────────────────────── */}
      {branchModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Icon name="store" className="text-blue-600" />
                {editingBranch ? "Chỉnh sửa thông tin chi nhánh" : "Thêm chi nhánh mới"}
              </h3>
              <Button
                variant="ghost"
                onClick={() => setBranchModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 h-auto"
              >
                <Icon name="close" />
              </Button>
            </div>

            <div className="space-y-3.5 text-xs">
              <FormField label="Tên chi nhánh *">
                <Input
                  type="text"
                  placeholder="e.g. Golden Gate - Vincom Bà Triệu..."
                  value={branchForm.branch_name}
                  onChange={(e) => setBranchForm({ ...branchForm, branch_name: e.target.value })}
                />
              </FormField>

              <FormField label="Địa chỉ chi nhánh *">
                <Input
                  type="text"
                  placeholder="e.g. 191 Bà Triệu, Lê Đại Hành, Hai Bà Trưng, Hà Nội..."
                  value={branchForm.address}
                  onChange={(e) => setBranchForm({ ...branchForm, address: e.target.value })}
                />
              </FormField>

              <div className="grid grid-cols-2 gap-3">
                <FormField label="Khu vực *">
                  <select
                    value={branchForm.region}
                    onChange={(e) => setBranchForm({ ...branchForm, region: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium focus:bg-white focus:border-blue-500 outline-none transition"
                  >
                    <option value="Hà Nội">Hà Nội</option>
                    <option value="TP. Hồ Chí Minh">TP. Hồ Chí Minh</option>
                    <option value="Đà Nẵng">Đà Nẵng</option>
                    <option value="Hải Phòng">Hải Phòng</option>
                    <option value="Cần Thơ">Cần Thơ</option>
                    <option value="Miền Bắc">Miền Bắc</option>
                    <option value="Miền Trung">Miền Trung</option>
                    <option value="Miền Nam">Miền Nam</option>
                  </select>
                </FormField>

                <FormField label="Số điện thoại (8 - 15 chữ số)">
                  <Input
                    type="text"
                    placeholder="e.g. 02439349999..."
                    value={branchForm.phone}
                    onChange={(e) => setBranchForm({ ...branchForm, phone: e.target.value })}
                  />
                </FormField>
              </div>

              <FormField label="Trạng thái *">
                <select
                  value={branchForm.status}
                  onChange={(e) =>
                    setBranchForm({
                      ...branchForm,
                      status: e.target.value as "ACTIVE" | "INACTIVE",
                    })
                  }
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium focus:bg-white focus:border-blue-500 outline-none transition"
                >
                  <option value="ACTIVE">Hoạt động</option>
                  <option value="INACTIVE">Tạm ngưng</option>
                </select>
              </FormField>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <Button
                variant="outline"
                type="button"
                onClick={() => setBranchModalOpen(false)}
              >
                Hủy bỏ
              </Button>
              <Button
                type="button"
                onClick={handleSaveBranch}
                disabled={!branchForm.branch_name.trim() || !branchForm.address.trim() || actionLoading}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {actionLoading ? "Đang lưu..." : editingBranch ? "Lưu thay đổi" : "Thêm ngay"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ─── PHẦN 5: Modal Xóa Chi nhánh ─────────────────────────────────────────── */}
      {deleteBranchId && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-center gap-3">
              <Icon name="delete" className="text-rose-500 text-3xl shrink-0" />
              <div>
                <h3 className="font-bold text-slate-900 text-base">Xác nhận xóa chi nhánh</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Hành động này sẽ xóa chi nhánh khỏi hệ thống.
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <Button
                variant="outline"
                type="button"
                onClick={() => setDeleteBranchId(null)}
              >
                Hủy
              </Button>
              <Button
                variant="destructive"
                type="button"
                onClick={handleConfirmDeleteBranch}
                disabled={actionLoading}
                className="bg-rose-600 hover:bg-rose-700 text-white"
              >
                {actionLoading ? "Đang xóa..." : "Xóa chi nhánh"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
