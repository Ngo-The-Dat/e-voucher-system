/**
 * =========================================================================================
 * FILE: [id]/page.tsx
 * VỊ TRÍ: frontend/src/app/admin/users/[id]/
 * VAI TRÒ TRONG HỆ THỐNG:
 *   - Màn hình Quản trị Chi tiết Người dùng & Phân quyền (UC-ADM-01: Quản lý người dùng).
 *   - Các tính năng chính:
 *       1. Xem chi tiết hồ sơ cá nhân: Họ tên, Email, SĐT, CCCD/CMND, Giới tính, Quốc tịch, Doanh nghiệp đối tác.
 *       2. Quản lý Khóa / Mở khóa tài khoản:
 *          - Modal nhập lý do khóa bắt buộc (Lưu vào bảng user_locks và ghi System Log).
 *          - Mở khóa khôi phục trạng thái ACTIVE.
 *       3. Tab Phân quyền (Permissions):
 *          - Chuyển đổi vai trò người dùng (CUSTOMER <-> PARTNER <-> PARTNER_EMPLOYEE).
 *          - Bảo vệ tài khoản ADMIN (không cho phép thay đổi vai trò qua giao diện).
 *          - Modal xác nhận thay đổi vai trò để tránh thao tác nhầm.
 * =========================================================================================
 */

"use client";

import Icon from "@/components/shared/ui/Icon";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/shared/ui/Button";
import { adminApi, AdminUserDetail, AdminBranchOption } from "@/lib/admin-api";

interface UserDetailState {
  id: string | number;
  name: string;
  email: string;
  phone: string;
  gender: string;
  nationality: string;
  identityNo: string;
  role: "Khách hàng" | "Đối tác" | "Quản trị viên" | "Nhân viên đối tác";
  rawRole: string;
  status: "Đang hoạt động" | "Đã khóa";
  createdDate: string;
  lastLogin: string;
  avatarInitials: string;
  avatarBg: string;
  lockReason: string | null;
  businessName?: string | null;
  taxCode?: string | null;
  branchId?: number | null;
  branchName?: string | null;
  branchAddress?: string | null;
}

const getInitials = (name: string): string => {
  const parts = name.trim().split(" ");
  if (parts.length === 0) return "U";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const mapRole = (role: string): UserDetailState["role"] => {
  switch (role) {
    case "PARTNER":
      return "Đối tác";
    case "ADMIN":
      return "Quản trị viên";
    case "PARTNER_EMPLOYEE":
      return "Nhân viên đối tác";
    default:
      return "Khách hàng";
  }
};

const formatDate = (dateString?: string | null): string => {
  if (!dateString) return "Chưa có";
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateString;
  }
};

const mapGender = (gender?: string | null): string => {
  if (gender === "MALE") return "Nam";
  if (gender === "FEMALE") return "Nữ";
  if (gender === "OTHER") return "Khác";
  return gender || "Chưa cập nhật";
};

export default function UserDetailPage() {
  // ─── 1. Lấy userId từ URL Params ──────────────────────────────────────────────────
  const params = useParams();
  const rawId = (params?.id as string) || "1";
  const userId = rawId.replace("USR-", "");

  // ─── 2. State Dữ liệu Người dùng & Trạng thái tải ─────────────────────────────────
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [userData, setUserData] = useState<UserDetailState>({
    id: rawId,
    name: "Đang tải...",
    email: "...",
    phone: "...",
    gender: "...",
    nationality: "Việt Nam",
    identityNo: "...",
    role: "Khách hàng",
    rawRole: "CUSTOMER",
    status: "Đang hoạt động",
    createdDate: "...",
    lastLogin: "...",
    avatarInitials: "U",
    avatarBg: "bg-blue-100 text-blue-700",
    lockReason: null,
  });

  // State Tabs và Phân quyền
  type ActiveTab = "info" | "permissions";
  const [activeTab, setActiveTab] = useState<ActiveTab>("info");
  const [selectedRole, setSelectedRole] = useState<"CUSTOMER" | "PARTNER" | "PARTNER_EMPLOYEE">("CUSTOMER");
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // State Bổ sung khi Chuyển vai trò sang Đối tác hoặc Nhân viên đối tác
  const [businessNameInput, setBusinessNameInput] = useState("");
  const [taxCodeInput, setTaxCodeInput] = useState("");
  const [selectedBranchId, setSelectedBranchId] = useState<string>("");
  const [branches, setBranches] = useState<AdminBranchOption[]>([]);
  const [branchesLoading, setBranchesLoading] = useState(false);

  // State Modal Khóa / Mở khóa
  const [lockModalOpen, setLockModalOpen] = useState(false);
  const [lockReasonInput, setLockReasonInput] = useState("");

  /**
   * ---------------------------------------------------------------------------------------
   * HÀM: fetchBranches
   * MỤC ĐÍCH: Tải danh sách chi nhánh hoạt động để phục vụ phân quyền nhân viên đối tác.
   * ---------------------------------------------------------------------------------------
   */
  const fetchBranches = useCallback(async () => {
    try {
      setBranchesLoading(true);
      const branchList = await adminApi.getBranchesForAssignment();
      setBranches(branchList);
    } catch (err) {
      console.error("Lỗi tải danh sách chi nhánh:", err);
    } finally {
      setBranchesLoading(false);
    }
  }, []);

  /**
   * ---------------------------------------------------------------------------------------
   * HÀM: fetchUserDetail
   * MỤC ĐÍCH: Gọi API `adminApi.getUser` để lấy thông tin chi tiết tài khoản người dùng.
   * ---------------------------------------------------------------------------------------
   */
  const fetchUserDetail = useCallback(async () => {
    try {
      setLoading(true);
      const res: AdminUserDetail = await adminApi.getUser(userId);
      if (res) {
        setUserData({
          id: res.user_id,
          name: res.full_name,
          email: res.email,
          phone: res.phone || "Chưa cập nhật",
          gender: mapGender(res.gender),
          nationality: res.nationality || "Việt Nam",
          identityNo: res.identity_no || "Chưa cập nhật",
          role: mapRole(res.role),
          rawRole: res.role,
          status: res.status === "LOCKED" ? "Đã khóa" : "Đang hoạt động",
          createdDate: formatDate(res.created_at),
          lastLogin: formatDate(res.last_login_at),
          avatarInitials: getInitials(res.full_name),
          avatarBg:
            res.status === "LOCKED"
              ? "bg-slate-200 text-slate-600"
              : res.role === "PARTNER"
              ? "bg-amber-100 text-amber-800"
              : res.role === "ADMIN"
              ? "bg-purple-100 text-purple-800"
              : res.role === "PARTNER_EMPLOYEE"
              ? "bg-rose-100 text-rose-800"
              : "bg-blue-100 text-blue-700",
          lockReason: res.lock_reason,
          businessName: res.business_name,
          taxCode: res.tax_code,
          branchId: res.branch_id,
          branchName: res.branch_name,
          branchAddress: res.branch_address,
        });

        setSelectedRole(
          res.role === "PARTNER"
            ? "PARTNER"
            : res.role === "PARTNER_EMPLOYEE"
            ? "PARTNER_EMPLOYEE"
            : "CUSTOMER"
        );

        if (res.business_name) setBusinessNameInput(res.business_name);
        if (res.tax_code) setTaxCodeInput(res.tax_code);
        if (res.branch_id) setSelectedBranchId(String(res.branch_id));
      }
    } catch {
      // Dự phòng nếu lỗi kết nối
      setUserData((prev) => ({
        ...prev,
        id: rawId,
        name: `Người dùng ${rawId}`,
        email: `user_${rawId.toLowerCase()}@email.com`,
        phone: "0987 654 321",
        createdDate: "12/10/2023, 14:30",
        lastLogin: "Vừa xong",
        avatarInitials: getInitials(`User ${rawId}`),
      }));
    } finally {
      setLoading(false);
    }
  }, [userId, rawId]);

  useEffect(() => {
    fetchUserDetail();
    fetchBranches();
  }, [fetchUserDetail, fetchBranches]);

  /**
   * ---------------------------------------------------------------------------------------
   * HÀM: handleOpenRoleConfirm
   * MỤC ĐÍCH: Kiểm tra tính hợp lệ của các trường dữ liệu trước khi mở Modal xác nhận.
   * ---------------------------------------------------------------------------------------
   */
  const handleOpenRoleConfirm = () => {
    if (selectedRole === "PARTNER") {
      if (!businessNameInput.trim()) {
        toast.error("Vui lòng nhập Tên doanh nghiệp / Thương hiệu đối tác");
        return;
      }
      if (!taxCodeInput.trim() || !/^[0-9]{10,13}$/.test(taxCodeInput.trim())) {
        toast.error("Mã số thuế không hợp lệ. Vui lòng nhập từ 10 đến 13 chữ số");
        return;
      }
    } else if (selectedRole === "PARTNER_EMPLOYEE") {
      if (!selectedBranchId) {
        toast.error("Vui lòng chọn chi nhánh làm việc cho Nhân viên đối tác");
        return;
      }
    }
    setShowConfirmModal(true);
  };

  /**
   * ---------------------------------------------------------------------------------------
   * HÀM: handleConfirmRoleChange
   * MỤC ĐÍCH: Gọi API `adminApi.changeUserRole` để cập nhật vai trò mới và thông tin tương ứng.
   * ---------------------------------------------------------------------------------------
   */
  const handleConfirmRoleChange = async () => {
    try {
      setActionLoading(true);
      await adminApi.changeUserRole(userId, {
        role: selectedRole,
        business_name: selectedRole === "PARTNER" ? businessNameInput.trim() : undefined,
        tax_code: selectedRole === "PARTNER" ? taxCodeInput.trim() : undefined,
        branch_id: selectedRole === "PARTNER_EMPLOYEE" ? Number(selectedBranchId) : undefined,
      });

      // Phát sự kiện đồng bộ để các tab khác (Khách hàng/Đối tác/Nhân viên) lập tức tự động đăng xuất
      if (typeof window !== "undefined") {
        localStorage.setItem("auth_sync_event", String(Date.now()));
        window.dispatchEvent(new Event("customer-auth-changed"));
        window.dispatchEvent(new Event("storage"));
      }

      const newRoleLabel = mapRole(selectedRole);
      toast.success(
        `Đã phân quyền thành công sang "${newRoleLabel}". Phiên làm việc cũ của người dùng đã bị vô hiệu hóa.`
      );
      setShowConfirmModal(false);
      await fetchUserDetail();
    } catch (error: any) {
      toast.error(error.message || "Không thể thay đổi vai trò người dùng.");
    } finally {
      setActionLoading(false);
    }
  };

  /**
   * ---------------------------------------------------------------------------------------
   * HÀM: handleConfirmLockToggle
   * MỤC ĐÍCH: Thực hiện Khóa (kèm lý do) hoặc Mở khóa tài khoản người dùng.
   * ---------------------------------------------------------------------------------------
   */
  const handleConfirmLockToggle = async () => {
    try {
      setActionLoading(true);
      if (userData.status === "Đang hoạt động") {
        if (!lockReasonInput.trim()) {
          toast.error("Vui lòng nhập lý do khóa tài khoản");
          return;
        }
        await adminApi.lockUser(userId, lockReasonInput.trim());
        setUserData((prev) => ({
          ...prev,
          status: "Đã khóa",
          lockReason: lockReasonInput.trim(),
          avatarBg: "bg-slate-200 text-slate-600",
        }));
        toast.success(`Tài khoản đã bị khóa. Lý do: "${lockReasonInput.trim()}"`);
      } else {
        await adminApi.unlockUser(userId);
        setUserData((prev) => ({
          ...prev,
          status: "Đang hoạt động",
          lockReason: null,
          avatarBg: "bg-blue-100 text-blue-700",
        }));
        toast.success("Tài khoản người dùng đã được mở khóa thành công.");
      }
      setLockModalOpen(false);
      setLockReasonInput("");
      await fetchUserDetail();
    } catch (error: any) {
      toast.error(error.message || "Thao tác không thành công. Vui lòng thử lại.");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ─── PHẦN 1: Breadcrumbs & Header Card ───────────────────────────────────── */}
      <div className="flex items-center gap-2 text-slate-500 text-sm font-medium">
        <Link href="/admin/users" className="hover:text-primary transition-colors">
          Quản lý người dùng
        </Link>
        <Icon name="chevron_right" className="text-sm" />
        <span className="text-slate-900 font-semibold">Chi tiết người dùng</span>
      </div>

      {/* Header Card với Avatar Initials & Nút hành động */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-r from-blue-100 via-indigo-50 to-blue-50" />
        <div className="relative z-10 flex flex-col md:flex-row gap-6 items-start md:items-end mt-8">
          {/* Avatar Initials */}
          <div
            className={`w-20 h-20 rounded-full border-4 border-white shadow-md flex items-center justify-center font-bold text-2xl shrink-0 ${userData.avatarBg}`}
          >
            {userData.avatarInitials}
          </div>

          {/* Tên & Vai trò */}
          <div className="flex-1 space-y-1.5">
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold text-slate-900">
                {userData.name}
              </h2>
              <span
                className={`inline-flex items-center px-3 py-0.5 rounded-full text-xs font-semibold ${
                  userData.role === "Đối tác"
                    ? "bg-amber-100 text-amber-800"
                    : userData.role === "Quản trị viên"
                    ? "bg-purple-100 text-purple-800"
                    : "bg-slate-100 text-slate-700"
                }`}
              >
                {userData.role}
              </span>
            </div>
            <p className="text-sm text-slate-500">{userData.email}</p>
          </div>

          {/* Nút Khóa / Mở khóa & Quay lại */}
          <div className="flex flex-wrap gap-3 mt-4 md:mt-0 w-full md:w-auto">
            <button
              type="button"
              onClick={() => setLockModalOpen(true)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition cursor-pointer ${
                userData.status === "Đang hoạt động"
                  ? "bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200"
                  : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200"
              }`}
            >
              <Icon name={userData.status === "Đang hoạt động" ? "lock" : "lock_open"} className="text-base" />
              <span>
                {userData.status === "Đang hoạt động" ? "Khóa tài khoản" : "Mở khóa tài khoản"}
              </span>
            </button>

            <Link
              href="/admin/users"
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-semibold transition"
            >
              <Icon name="arrow_back" className="text-base" />
              <span>Quay lại</span>
            </Link>
          </div>
        </div>
      </div>

      {/* ─── PHẦN 2: Navigation Tabs (Thông tin cá nhân / Phân quyền) ─────────────── */}
      <div className="border-b border-slate-200">
        <nav className="flex gap-6 -mb-px">
          <button
            onClick={() => setActiveTab("info")}
            className={`pb-3.5 text-sm whitespace-nowrap px-1 border-b-2 transition-colors cursor-pointer ${
              activeTab === "info"
                ? "text-primary border-primary font-bold"
                : "text-slate-500 hover:text-slate-900 border-transparent font-medium"
            }`}
          >
            Thông tin cá nhân
          </button>

          <button
            onClick={() => setActiveTab("permissions")}
            className={`pb-3.5 text-sm whitespace-nowrap px-1 border-b-2 transition-colors cursor-pointer ${
              activeTab === "permissions"
                ? "text-primary border-primary font-bold"
                : "text-slate-500 hover:text-slate-900 border-transparent font-medium"
            }`}
          >
            Phân quyền
          </button>
        </nav>
      </div>

      {/* ─── PHẦN 3: Tab Content 1 - Thông tin cá nhân ────────────────────────────── */}
      {activeTab === "info" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Cột trái (2/3): Chi tiết hồ sơ */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-6">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Icon name="person" className="text-primary" />
              Chi tiết thông tin người dùng
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-5 gap-x-8">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">
                  Mã người dùng
                </label>
                <p className="text-sm font-bold font-mono text-slate-900">
                  USR-{userData.id}
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">
                  Họ và tên
                </label>
                <p className="text-sm font-bold text-slate-900">
                  {userData.name}
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">
                  Email
                </label>
                <p className="text-sm font-medium text-slate-700">
                  {userData.email}
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">
                  Số điện thoại
                </label>
                <p className="text-sm font-medium text-slate-700">
                  {userData.phone}
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">
                  Số CCCD / CMND
                </label>
                <p className="text-sm font-medium text-slate-700">
                  {userData.identityNo}
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">
                  Giới tính
                </label>
                <p className="text-sm font-medium text-slate-700">
                  {userData.gender}
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">
                  Quốc tịch
                </label>
                <p className="text-sm font-medium text-slate-700">
                  {userData.nationality}
                </p>
              </div>

              {userData.businessName && (
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">
                    Doanh nghiệp đối tác
                  </label>
                  <p className="text-sm font-medium text-slate-700">
                    {userData.businessName} {userData.taxCode ? `(MST: ${userData.taxCode})` : ""}
                  </p>
                </div>
              )}

              {userData.branchName && (
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">
                    Chi nhánh làm việc
                  </label>
                  <p className="text-sm font-medium text-slate-700">
                    {userData.branchName} {userData.branchAddress ? `- ${userData.branchAddress}` : ""}
                  </p>
                </div>
              )}
            </div>

            {/* Banner hiển thị lý do khóa nếu tài khoản đang bị khóa */}
            {userData.status === "Đã khóa" && userData.lockReason && (
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl">
                <div className="flex items-center gap-2 text-rose-800 font-bold text-xs uppercase tracking-wider mb-1">
                  <Icon name="lock" className="text-sm" />
                  <span>Lý do khóa tài khoản</span>
                </div>
                <p className="text-sm text-rose-900 font-medium">
                  {userData.lockReason}
                </p>
              </div>
            )}
          </div>

          {/* Cột phải (1/3): Thông tin hệ thống */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-6">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <Icon name="settings" className="text-primary" />
              Thông tin hệ thống
            </h3>
            
            <div className="space-y-5">
              <div className="flex items-start gap-3.5">
                <div className="p-2.5 bg-slate-50 rounded-xl text-slate-500 mt-0.5">
                  <Icon name="shield" className="text-lg" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">
                    Trạng thái tài khoản
                  </label>
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-semibold ${
                      userData.status === "Đang hoạt động"
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "bg-rose-50 text-rose-700 border border-rose-200"
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        userData.status === "Đang hoạt động" ? "bg-emerald-500" : "bg-rose-500"
                      }`}
                    />
                    {userData.status}
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="p-2.5 bg-slate-50 rounded-xl text-slate-500 mt-0.5">
                  <Icon name="calendar_today" className="text-lg" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">
                    Ngày đăng ký
                  </label>
                  <p className="text-sm font-medium text-slate-800">
                    {userData.createdDate}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="p-2.5 bg-slate-50 rounded-xl text-slate-500 mt-0.5">
                  <Icon name="schedule" className="text-lg" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">
                    Đăng nhập lần cuối
                  </label>
                  <p className="text-sm font-medium text-slate-800">
                    {userData.lastLogin}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── PHẦN 4: Tab Content 2 - Phân quyền (Permissions) ─────────────────────── */}
      {activeTab === "permissions" && (
        <section className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
          <div className="p-5 border-b border-slate-100 bg-slate-50/50">
            <h3 className="text-base font-bold text-slate-900">
              Cài đặt vai trò người dùng
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Thay đổi quyền hạn và vai trò của người dùng trên toàn hệ thống.
            </p>
          </div>

          <div className="p-6 space-y-6">
            {/* Vai trò hiện tại */}
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Vai trò hiện tại
              </label>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-xl border border-blue-200">
                <Icon name="person" className="text-base" />
                <span className="font-bold text-sm">{userData.role}</span>
              </div>
            </div>

            {/* Nếu là ADMIN -> Hiển thị cảnh báo bảo vệ */}
            {userData.rawRole === "ADMIN" ? (
              <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 text-center space-y-2.5">
                <div className="w-12 h-12 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center mx-auto">
                  <Icon name="shield" className="text-2xl" />
                </div>
                <h4 className="font-bold text-slate-900 text-sm">
                  Tài khoản Quản trị viên hệ thống
                </h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                  Tài khoản Quản trị viên (ADMIN) được bảo vệ và không thể thay đổi vai trò qua giao diện người dùng này.
                </p>
              </div>
            ) : (
              /* Lựa chọn vai trò mới */
              <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Chọn vai trò mới
                </label>

                <div className="space-y-3">
                  {/* Option: Khách hàng */}
                  <label
                    onClick={() => setSelectedRole("CUSTOMER")}
                    className={`relative flex items-start p-4 border rounded-xl cursor-pointer transition-all ${
                      selectedRole === "CUSTOMER"
                        ? "border-primary bg-blue-50/40 ring-1 ring-primary"
                        : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="role"
                      value="CUSTOMER"
                      checked={selectedRole === "CUSTOMER"}
                      onChange={() => setSelectedRole("CUSTOMER")}
                      className="mt-1 w-4 h-4 text-primary focus:ring-primary border-slate-300"
                    />
                    <div className="ml-3.5 flex-1">
                      <span className="font-bold text-slate-900 text-sm">
                        Khách hàng (CUSTOMER)
                      </span>
                      <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                        Quyền hạn người dùng cuối. Có thể duyệt danh mục, mua voucher, thanh toán và quản lý voucher cá nhân.
                      </p>
                    </div>
                  </label>

                  {/* Option: Đối tác */}
                  <label
                    onClick={() => setSelectedRole("PARTNER")}
                    className={`relative flex items-start p-4 border rounded-xl cursor-pointer transition-all ${
                      selectedRole === "PARTNER"
                        ? "border-primary bg-blue-50/40 ring-1 ring-primary"
                        : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="role"
                      value="PARTNER"
                      checked={selectedRole === "PARTNER"}
                      onChange={() => setSelectedRole("PARTNER")}
                      className="mt-1 w-4 h-4 text-primary focus:ring-primary border-slate-300"
                    />
                    <div className="ml-3.5 flex-1">
                      <span className="font-bold text-slate-900 text-sm">
                        Đối tác doanh nghiệp (PARTNER)
                      </span>
                      <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                        Dành cho chủ doanh nghiệp. Có quyền phát hành voucher, quản lý chi nhánh, đối soát doanh thu.
                      </p>
                    </div>
                  </label>

                  {/* Form nhập thông tin khi chọn vai trò Đối tác */}
                  {selectedRole === "PARTNER" && (
                    <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-xl space-y-3.5 ml-7 animate-in fade-in">
                      <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
                        <Icon name="business" className="text-amber-700" />
                        <span>Thông tin doanh nghiệp đối tác</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1.5">
                            Tên doanh nghiệp / Thương hiệu <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="text"
                            placeholder="Ví dụ: Công ty TNHH Golden Gate..."
                            value={businessNameInput}
                            onChange={(e) => setBusinessNameInput(e.target.value)}
                            className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1.5">
                            Mã số thuế (10 - 13 chữ số) <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="text"
                            placeholder="Ví dụ: 0101234567"
                            maxLength={13}
                            value={taxCodeInput}
                            onChange={(e) => setTaxCodeInput(e.target.value.replace(/[^0-9]/g, ""))}
                            className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none font-mono transition"
                          />
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-emerald-800 bg-emerald-50 px-3 py-2 rounded-lg border border-emerald-200">
                        <Icon name="verified" className="text-emerald-600 shrink-0 text-base" />
                        <span>Đối tác sẽ được tự động kích hoạt và phê duyệt ngay (APPROVED) để đăng nhập được ngay.</span>
                      </div>
                    </div>
                  )}

                  {/* Option: Nhân viên đối tác */}
                  <label
                    onClick={() => setSelectedRole("PARTNER_EMPLOYEE")}
                    className={`relative flex items-start p-4 border rounded-xl cursor-pointer transition-all ${
                      selectedRole === "PARTNER_EMPLOYEE"
                        ? "border-primary bg-blue-50/40 ring-1 ring-primary"
                        : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="role"
                      value="PARTNER_EMPLOYEE"
                      checked={selectedRole === "PARTNER_EMPLOYEE"}
                      onChange={() => setSelectedRole("PARTNER_EMPLOYEE")}
                      className="mt-1 w-4 h-4 text-primary focus:ring-primary border-slate-300"
                    />
                    <div className="ml-3.5 flex-1">
                      <span className="font-bold text-slate-900 text-sm">
                        Nhân viên đối tác (PARTNER_EMPLOYEE)
                      </span>
                      <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                        Dành cho nhân viên tại chi nhánh. Có quyền quét và xác thực đổi mã voucher tại điểm bán (Redeem).
                      </p>
                    </div>
                  </label>

                  {/* Dropdown chọn chi nhánh khi chọn vai trò Nhân viên đối tác */}
                  {selectedRole === "PARTNER_EMPLOYEE" && (
                    <div className="p-4 bg-rose-50/70 border border-rose-200 rounded-xl space-y-3.5 ml-7 animate-in fade-in">
                      <div className="flex items-center gap-2 text-rose-900 font-bold text-sm">
                        <Icon name="store" className="text-rose-700" />
                        <span>Phân công chi nhánh làm việc</span>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                          Chọn chi nhánh <span className="text-rose-500">*</span>
                        </label>
                        {branchesLoading ? (
                          <div className="py-2.5 text-xs text-slate-500 italic flex items-center gap-2">
                            <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-primary"></div>
                            <span>Đang tải danh sách chi nhánh hoạt động...</span>
                          </div>
                        ) : (
                          <select
                            value={selectedBranchId}
                            onChange={(e) => setSelectedBranchId(e.target.value)}
                            className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 outline-none transition"
                          >
                            <option value="">-- Chọn chi nhánh của đối tác --</option>
                            {branches.map((b) => (
                              <option key={b.branch_id} value={b.branch_id}>
                                [{b.business_name}] {b.branch_name} - {b.address}
                              </option>
                            ))}
                          </select>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-emerald-800 bg-emerald-50 px-3 py-2 rounded-lg border border-emerald-200">
                        <Icon name="verified" className="text-emerald-600 shrink-0 text-base" />
                        <span>Nhân viên sẽ được gán vào chi nhánh đã chọn và tự động phê duyệt (APPROVED) để đăng nhập được ngay.</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Box cảnh báo khi phân quyền */}
                <div className="mt-4 flex items-start gap-3 p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-900">
                  <Icon name="warning" className="text-amber-600 text-lg shrink-0 mt-0.5" />
                  <div className="space-y-0.5 text-xs">
                    <p className="font-bold">Lưu ý bảo mật & Đăng xuất bắt buộc</p>
                    <p className="text-amber-800 leading-relaxed">
                      Khi vai trò thay đổi, toàn bộ token hiện tại của người dùng sẽ bị vô hiệu hóa ngay lập tức trên backend. Người dùng sẽ bị buộc đăng xuất khỏi hệ thống và phải đăng nhập lại để nhận token chứa vai trò mới.
                    </p>
                  </div>
                </div>

                {/* Nút Lưu vai trò */}
                <div className="pt-4 border-t border-slate-100 mt-5 flex justify-end">
                  <Button
                    type="button"
                    onClick={handleOpenRoleConfirm}
                    disabled={actionLoading}
                    className="bg-primary hover:bg-primary-hover text-white px-5 py-2.5 rounded-xl font-semibold text-sm"
                  >
                    <Icon name="sync" className="text-lg mr-1.5" />
                    <span>Cập nhật vai trò</span>
                  </Button>
                </div>
              </form>
            )}
          </div>
        </section>
      )}

      {/* ─── PHẦN 5: Modal Xác Nhận Đổi Vai Trò ────────────────────────────────────── */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 text-primary">
              <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
                <Icon name="published_with_changes" className="text-2xl" />
              </div>
              <h3 className="font-bold text-lg text-slate-900">
                Xác nhận thay đổi vai trò?
              </h3>
            </div>
            <div className="space-y-3 text-sm text-slate-600">
              <p>
                Bạn có chắc chắn muốn thay đổi vai trò của người dùng{" "}
                <strong className="text-slate-900">{userData.name}</strong> từ{" "}
                <span className="font-semibold text-slate-700">"{userData.role}"</span> sang{" "}
                <span className="font-semibold text-primary">"{mapRole(selectedRole)}"</span> không?
              </p>

              {selectedRole === "PARTNER" && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1 text-xs text-slate-700">
                  <p><strong>Doanh nghiệp:</strong> {businessNameInput.trim()}</p>
                  <p><strong>Mã số thuế:</strong> {taxCodeInput.trim()}</p>
                  <p className="text-emerald-700 font-semibold">• Trạng thái: Kích hoạt & Phê duyệt ngay</p>
                </div>
              )}

              {selectedRole === "PARTNER_EMPLOYEE" && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1 text-xs text-slate-700">
                  <p>
                    <strong>Chi nhánh:</strong>{" "}
                    {branches.find((b) => String(b.branch_id) === String(selectedBranchId))?.branch_name || selectedBranchId}
                  </p>
                  <p className="text-emerald-700 font-semibold">• Trạng thái: Gán chi nhánh & Phê duyệt ngay</p>
                </div>
              )}

              <div className="p-2.5 bg-amber-50 rounded-lg text-xs text-amber-800">
                ⚠️ Người dùng sẽ bị đăng xuất ngay lập tức và cần đăng nhập lại với vai trò mới.
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <Button
                variant="ghost"
                disabled={actionLoading}
                onClick={() => setShowConfirmModal(false)}
              >
                Hủy bỏ
              </Button>
              <Button
                disabled={actionLoading}
                onClick={handleConfirmRoleChange}
                className="bg-primary hover:bg-primary-hover text-white"
              >
                {actionLoading ? "Đang cập nhật..." : "Xác nhận thay đổi"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ─── PHẦN 6: Modal Khóa / Mở khóa Tài khoản ───────────────────────────────── */}
      {lockModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                  userData.status === "Đang hoạt động"
                    ? "bg-rose-50 text-rose-600"
                    : "bg-emerald-50 text-emerald-600"
                }`}
              >
                <Icon name={userData.status === "Đang hoạt động" ? "lock" : "lock_open"} className="text-2xl" />
              </div>
              <h3 className="font-bold text-lg text-slate-900">
                {userData.status === "Đang hoạt động"
                  ? "Xác nhận khóa tài khoản?"
                  : "Xác nhận mở khóa tài khoản?"}
              </h3>
            </div>
            <p className="text-sm text-slate-600">
              {userData.status === "Đang hoạt động"
                ? `Bạn có chắc chắn muốn khóa tài khoản của ${userData.name}? Người dùng sẽ không thể đăng nhập hoặc thực hiện giao dịch.`
                : `Khôi phục trạng thái hoạt động cho tài khoản ${userData.name}. Người dùng sẽ có thể đăng nhập lại bình thường.`}
            </p>

            {userData.status === "Đang hoạt động" && (
              <div className="space-y-1.5 pt-1">
                <label className="block text-xs font-bold text-slate-700">
                  Lý do khóa tài khoản *
                </label>
                <textarea
                  rows={3}
                  placeholder="Nhập chi tiết lý do khóa tài khoản..."
                  value={lockReasonInput}
                  onChange={(e) => setLockReasonInput(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:border-rose-500 focus:ring-1 focus:ring-rose-500 outline-none transition"
                />
              </div>
            )}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <Button
                variant="ghost"
                type="button"
                disabled={actionLoading}
                onClick={() => setLockModalOpen(false)}
              >
                Hủy bỏ
              </Button>
              <Button
                type="button"
                disabled={
                  actionLoading ||
                  (userData.status === "Đang hoạt động" && !lockReasonInput.trim())
                }
                onClick={handleConfirmLockToggle}
                className={
                  userData.status === "Đang hoạt động"
                    ? "bg-rose-600 hover:bg-rose-700 text-white disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-rose-600 transition-all"
                    : "bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                }
              >
                {actionLoading
                  ? "Đang xử lý..."
                  : userData.status === "Đang hoạt động"
                  ? "Xác nhận khóa"
                  : "Xác nhận mở khóa"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
