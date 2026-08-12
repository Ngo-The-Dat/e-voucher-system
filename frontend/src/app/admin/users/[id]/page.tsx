"use client";

import Icon from "@/components/shared/ui/Icon";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/shared/ui/Button";
import { adminApi, AdminUserDetail } from "@/lib/admin-api";

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
  const params = useParams();
  const rawId = (params?.id as string) || "1";
  const userId = rawId.replace("USR-", "");

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

  type ActiveTab = "info" | "permissions";
  const [activeTab, setActiveTab] = useState<ActiveTab>("info");
  const [selectedRole, setSelectedRole] = useState<"CUSTOMER" | "PARTNER" | "PARTNER_EMPLOYEE">("CUSTOMER");
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const [lockModalOpen, setLockModalOpen] = useState(false);
  const [lockReasonInput, setLockReasonInput] = useState("");

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
        });
        setSelectedRole(
          res.role === "PARTNER"
            ? "PARTNER"
            : res.role === "PARTNER_EMPLOYEE"
            ? "PARTNER_EMPLOYEE"
            : "CUSTOMER"
        );
      }
    } catch {
      // Fallback display if mock ID or offline
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
  }, [fetchUserDetail]);

  const handleConfirmRoleChange = async () => {
    try {
      setActionLoading(true);
      await adminApi.changeUserRole(userId, selectedRole);
      const newRoleLabel = mapRole(selectedRole);
      toast.success(`Đã cập nhật vai trò người dùng thành "${newRoleLabel}".`);
      setShowConfirmModal(false);
      await fetchUserDetail();
    } catch (error: any) {
      toast.error(error.message || "Không thể thay đổi vai trò người dùng.");
    } finally {
      setActionLoading(false);
    }
  };

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

  return (
    <div className="space-y-6">
      {/* Top Breadcrumbs */}
      <div className="flex items-center gap-2 text-slate-500 text-sm font-medium">
        <Link href="/admin/users" className="hover:text-primary transition-colors">
          Quản lý người dùng
        </Link>
        <Icon name="chevron_right" className="text-sm" />
        <span className="text-slate-900 font-semibold">Chi tiết người dùng</span>
      </div>

      {/* User Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-r from-blue-100 via-indigo-50 to-blue-50" />
        <div className="relative z-10 flex flex-col md:flex-row gap-6 items-start md:items-end mt-8">
          {/* Avatar Initials */}
          <div
            className={`w-20 h-20 rounded-full border-4 border-white shadow-md flex items-center justify-center font-bold text-2xl shrink-0 ${userData.avatarBg}`}
          >
            {userData.avatarInitials}
          </div>

          {/* Name & Badges */}
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

          {/* Header Action Buttons */}
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

      {/* Tab Navigation Bar */}
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

      {/* Tab Content: Thông tin cá nhân */}
      {activeTab === "info" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Info Card */}
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
                    {userData.businessName} (MST: {userData.taxCode})
                  </p>
                </div>
              )}
            </div>

            {/* Lock Reason Banner */}
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

          {/* System Info Card */}
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

      {/* Tab Content: Phân quyền */}
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
            {/* Current Role Display */}
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Vai trò hiện tại
              </label>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-xl border border-blue-200">
                <Icon name="person" className="text-base" />
                <span className="font-bold text-sm">{userData.role}</span>
              </div>
            </div>

            {/* If user is an ADMIN, show protection info */}
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
              /* Select New Role Form */
              <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
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
                </div>

                {/* Warning Alert Box */}
                <div className="mt-4 flex items-start gap-3 p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-900">
                  <Icon name="warning" className="text-amber-600 text-lg shrink-0 mt-0.5" />
                  <div className="space-y-0.5 text-xs">
                    <p className="font-bold">Lưu ý quan trọng</p>
                    <p className="text-amber-800 leading-relaxed">
                      Hệ thống sẽ ghi nhật ký vào system_logs. Người dùng sẽ cần đăng nhập lại để nhận token chứa vai trò mới.
                    </p>
                  </div>
                </div>

                {/* Action Submit */}
                <div className="pt-4 border-t border-slate-100 mt-5 flex justify-end">
                  <Button
                    type="button"
                    onClick={() => setShowConfirmModal(true)}
                    disabled={actionLoading || selectedRole === userData.rawRole}
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

      {/* Role Update Confirmation Modal */}
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
            <p className="text-sm text-slate-600">
              Bạn có chắc chắn muốn thay đổi vai trò của người dùng{" "}
              <strong className="text-slate-900">{userData.name}</strong> từ{" "}
              <span className="font-semibold text-slate-700">"{userData.role}"</span> sang{" "}
              <span className="font-semibold text-primary">"{mapRole(selectedRole)}"</span> không?
            </p>
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

      {/* Modal Khóa / Mở khóa Tài khoản */}
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
