"use client";

import Icon from "@/components/shared/ui/Icon";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

interface UserRecord {
  id: string;
  name: string;
  email: string;
  phone: string;
  gender: string;
  nationality: string;
  role: "Khách hàng" | "Đối tác" | "Quản trị viên";
  status: "Đang hoạt động" | "Đã khóa";
  createdDate: string;
  lastLogin: string;
  avatar: string;
}

const usersDataMap: Record<string, UserRecord> = {
  "USR-001": {
    id: "USR-001",
    name: "Nguyễn Văn A",
    email: "nva@email.com",
    phone: "0987 654 321",
    gender: "Nam",
    nationality: "Việt Nam",
    role: "Khách hàng",
    status: "Đang hoạt động",
    createdDate: "12/10/2023, 14:30",
    lastLogin: "Hôm nay, 08:15",
    avatar:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDmcbUWDcymSWYEPhjxPbI6X5kLhVpLKDyPwWrTfNRNDfC-YBoPu32VIdySLDh52f2Emia0F44iXsD5KS8AdOmEhwMUoUmNQrt6BL29mzpNGJ-lEzYSf1geyHFBH2o0OVaN7viR5muTlOEdocrMmzU_c6E9WtssQjyzZTvpR3oOsNJq-e2jOiHtrfwIuFme8pUBKGChm9yZaA14ZzqbuVv3M0L02lujPzZBxcV9th2OXR1_EhUJwyR0Mw",
  },
  "USR-002": {
    id: "USR-002",
    name: "Trần Thị B",
    email: "bpartner@email.com",
    phone: "0912 345 678",
    gender: "Nữ",
    nationality: "Việt Nam",
    role: "Đối tác",
    status: "Đang hoạt động",
    createdDate: "05/11/2023, 09:15",
    lastLogin: "Hôm qua, 16:45",
    avatar:
      "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
  },
  "USR-003": {
    id: "USR-003",
    name: "Lê Văn C",
    email: "lvc_lock@email.com",
    phone: "0903 888 999",
    gender: "Nam",
    nationality: "Việt Nam",
    role: "Khách hàng",
    status: "Đã khóa",
    createdDate: "20/01/2024, 11:20",
    lastLogin: "3 ngày trước",
    avatar:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
  },
  "USR-004": {
    id: "USR-004",
    name: "Phạm Minh D",
    email: "d.admin@lumina.vn",
    phone: "0977 111 222",
    gender: "Nam",
    nationality: "Việt Nam",
    role: "Quản trị viên",
    status: "Đang hoạt động",
    createdDate: "01/01/2023, 08:00",
    lastLogin: "Hôm nay, 10:00",
    avatar:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
  },
};

export default function UserDetailPage() {
  const params = useParams();
  const userId = (params?.id as string) || "USR-001";
  
  const userData = usersDataMap[userId] || {
    id: userId,
    name: "Người dùng " + userId,
    email: `${userId.toLowerCase()}@email.com`,
    phone: "0987 654 321",
    gender: "Nam",
    nationality: "Việt Nam",
    role: "Khách hàng" as const,
    status: "Đang hoạt động" as const,
    createdDate: "12/10/2023, 14:30",
    lastLogin: "Vừa xong",
    avatar:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDmcbUWDcymSWYEPhjxPbI6X5kLhVpLKDyPwWrTfNRNDfC-YBoPu32VIdySLDh52f2Emia0F44iXsD5KS8AdOmEhwMUoUmNQrt6BL29mzpNGJ-lEzYSf1geyHFBH2o0OVaN7viR5muTlOEdocrMmzU_c6E9WtssQjyzZTvpR3oOsNJq-e2jOiHtrfwIuFme8pUBKGChm9yZaA14ZzqbuVv3M0L02lujPzZBxcV9th2OXR1_EhUJwyR0Mw",
  };

  const [activeTab, setActiveTab] = useState<"info" | "permissions">("info");
  const [selectedRole, setSelectedRole] = useState<"customer" | "partner">("customer");
  const [currentRole, setCurrentRole] = useState(userData.role);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [savedNotification, setSavedNotification] = useState<string | null>(null);

  const [accountStatus, setAccountStatus] = useState<"Đang hoạt động" | "Đã khóa">(userData.status);
  const [lockModalOpen, setLockModalOpen] = useState(false);
  const [lockReason, setLockReason] = useState("");

  const userDetail = {
    id: userData.id,
    name: userData.name,
    email: userData.email,
    phone: userData.phone,
    gender: userData.gender,
    nationality: userData.nationality,
    role: currentRole,
    status: accountStatus,
    createdDate: userData.createdDate,
    lastLogin: userData.lastLogin,
    avatar: userData.avatar,
  };

  const handleConfirmRoleChange = () => {
    const newRoleName = selectedRole === "customer" ? "Khách hàng" : "Đối tác";
    setCurrentRole(newRoleName);
    setShowConfirmModal(false);
    setSavedNotification(`Đã cập nhật vai trò người dùng thành "${newRoleName}". Người dùng sẽ cần đăng nhập lại.`);
    setTimeout(() => setSavedNotification(null), 5000);
  };

  const handleConfirmLockToggle = () => {
    if (accountStatus === "Đang hoạt động") {
      setAccountStatus("Đã khóa");
      setSavedNotification(
        `Tài khoản người dùng đã bị khóa. Lý do: "${lockReason || "Vi phạm điều khoản dịch vụ"}"`
      );
    } else {
      setAccountStatus("Đang hoạt động");
      setSavedNotification("Tài khoản người dùng đã được mở khóa thành công.");
    }
    setLockModalOpen(false);
    setLockReason("");
    setTimeout(() => setSavedNotification(null), 5000);
  };

  return (
    <div className="space-y-6">
      {/* Top Breadcrumbs */}
      <div className="flex items-center gap-2 text-text-muted text-sm font-medium">
        <Link href="/admin/users" className="hover:text-primary transition-colors">
          Quản lý người dùng
        </Link>
        <Icon name="chevron_right" className="text-sm" />
        <span className="text-text-main font-medium">Chi tiết người dùng</span>
      </div>

      {savedNotification && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <Icon name="check_circle" />
            <span>{savedNotification}</span>
          </div>
          <button onClick={() => setSavedNotification(null)} className="font-bold">✕</button>
        </div>
      )}

      {/* User Header Card (Stitch Exact Styling) */}
      <div className="bg-surface rounded-xl border border-border shadow-sm p-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-r from-blue-200 to-blue-500/20" />
        <div className="relative z-10 flex flex-col md:flex-row gap-6 items-start md:items-end mt-12">
          {/* Avatar */}
          <div className="w-24 h-24 rounded-full border-4 border-surface shadow-md overflow-hidden bg-white shrink-0">
            <img
              className="w-full h-full object-cover"
              src={userDetail.avatar}
              alt={userDetail.name}
            />
          </div>

          {/* Name & Badges */}
          <div className="flex-1 space-y-2">
            <h2 className="text-2xl font-bold text-text-main">
              {userDetail.name}
            </h2>
            <div className="flex flex-wrap gap-2">
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                  userDetail.role === "Đối tác"
                    ? "bg-amber-100 text-amber-900 border-amber-200"
                    : userDetail.role === "Quản trị viên"
                    ? "bg-purple-100 text-purple-900 border-purple-200"
                    : "bg-emerald-100 text-emerald-800 border-emerald-200"
                }`}
              >
                {userDetail.role}
              </span>
            </div>
          </div>

          {/* Header Action Buttons */}
          <div className="flex flex-wrap gap-3 mt-4 md:mt-0 w-full md:w-auto">
            <button
              type="button"
              onClick={() => setLockModalOpen(true)}
              className={`flex items-center gap-2 px-4 py-2 text-white rounded-lg text-sm font-semibold transition-colors shadow-sm ${
                accountStatus === "Đang hoạt động"
                  ? "bg-rose-600 hover:bg-rose-700"
                  : "bg-emerald-600 hover:bg-emerald-700"
              }`}
            >
              <Icon name={accountStatus === "Đang hoạt động" ? "lock" : "lock_open"} className="text-[18px]" />
              <span>
                {accountStatus === "Đang hoạt động" ? "Khóa tài khoản" : "Mở khóa tài khoản"}
              </span>
            </button>

            <Link
              href="/admin/users"
              className="flex items-center gap-2 px-4 py-2 bg-surface border border-border rounded-lg text-text-main text-sm font-medium hover:bg-slate-50 transition-colors shadow-sm"
            >
              <Icon name="arrow_back" className="text-[18px]" />
              <span>Quay lại</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Tab Navigation Bar */}
      <div className="border-b border-border">
        <nav className="flex gap-6 -mb-px">
          <button
            onClick={() => setActiveTab("info")}
            className={`pb-4 text-sm font-medium whitespace-nowrap px-1 border-b-2 transition-colors ${
              activeTab === "info"
                ? "text-primary border-primary font-bold"
                : "text-text-muted hover:text-text-main border-transparent"
            }`}
          >
            Thông tin cá nhân
          </button>

          <button
            onClick={() => setActiveTab("permissions")}
            className={`pb-4 text-sm font-medium whitespace-nowrap px-1 border-b-2 transition-colors ${
              activeTab === "permissions"
                ? "text-primary border-primary font-bold"
                : "text-text-muted hover:text-text-main border-transparent"
            }`}
          >
            Phân quyền
          </button>
        </nav>
      </div>

      {/* Tab Content: Thông tin cá nhân theo ERD */}
      {activeTab === "info" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Info Card */}
          <div className="lg:col-span-2 bg-surface rounded-xl border border-border shadow-sm p-6">
            <h3 className="text-lg font-bold text-text-main mb-6 flex items-center gap-2">
              <Icon name="person" className="text-primary" />
              Chi tiết thông tin người dùng
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-5 gap-x-8">
              <div>
                <label className="block text-xs font-bold text-text-muted uppercase mb-1">
                  Mã người dùng
                </label>
                <p className="text-sm font-bold font-mono text-text-main">
                  {userDetail.id}
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-text-muted uppercase mb-1">
                  Họ tên
                </label>
                <p className="text-sm font-bold text-text-main">
                  {userDetail.name}
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-text-muted uppercase mb-1">
                  Email
                </label>
                <p className="text-sm font-medium text-text-main">
                  {userDetail.email}
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-text-muted uppercase mb-1">
                  Số điện thoại (SĐT)
                </label>
                <p className="text-sm font-medium text-text-main">
                  {userDetail.phone}
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-text-muted uppercase mb-1">
                  Giới tính
                </label>
                <p className="text-sm font-medium text-text-main">
                  {userDetail.gender}
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-text-muted uppercase mb-1">
                  Quốc tịch
                </label>
                <p className="text-sm font-medium text-text-main">
                  {userDetail.nationality}
                </p>
              </div>
            </div>
          </div>

          {/* System Info Card */}
          <div className="bg-surface rounded-xl border border-border shadow-sm p-6 space-y-6">
            <h3 className="text-lg font-bold text-text-main flex items-center gap-2 border-b border-border pb-3">
              <Icon name="settings_suggest" className="text-primary" />
              Thông tin hệ thống
            </h3>
            
            <div className="space-y-5">
              <div className="flex items-start gap-4">
                <div className="p-2 bg-slate-100 rounded-lg text-text-muted mt-1">
                  <Icon name="shield" className="text-[20px]" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-text-muted uppercase mb-1">
                    Trạng thái (Mở / Khóa)
                  </label>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                      accountStatus === "Đang hoạt động"
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "bg-rose-50 text-rose-700 border border-rose-200"
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                        accountStatus === "Đang hoạt động" ? "bg-emerald-500" : "bg-rose-500"
                      }`}
                    />
                    {accountStatus}
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="p-2 bg-slate-100 rounded-lg text-text-muted mt-1">
                  <Icon name="calendar_today" className="text-[20px]" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-text-muted uppercase mb-1">
                    Ngày tạo
                  </label>
                  <p className="text-sm font-medium text-text-main">
                    {userDetail.createdDate}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="p-2 bg-slate-100 rounded-lg text-text-muted mt-1">
                  <Icon name="login" className="text-[20px]" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-text-muted uppercase mb-1">
                    Lần đăng nhập gần nhất
                  </label>
                  <p className="text-sm font-medium text-text-main">
                    {userDetail.lastLogin}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab Content: Phân quyền (Stitch Exact Form & Design) */}
      {activeTab === "permissions" && (
        <section className="bg-white rounded-lg shadow-sm border border-border overflow-hidden">
          <div className="p-4 border-b border-border bg-slate-50">
            <h3 className="text-[18px] font-bold text-text-main">
              Cài đặt vai trò người dùng
            </h3>
            <p className="text-sm text-text-muted mt-0.5">
              Thay đổi quyền hạn và vai trò của người dùng trên hệ thống Lumina.
            </p>
          </div>

          <div className="p-5 space-y-6">
            {/* Current Role Display */}
            <div>
              <label className="block text-[10px] font-bold text-text-main uppercase tracking-wider mb-2 opacity-70">
                Vai trò hiện tại
              </label>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-100 text-primary rounded-lg border border-primary/20">
                <Icon name="person" className="text-[18px]" />
                <span className="font-bold text-sm">{currentRole}</span>
              </div>
            </div>

            {/* Select New Role Form */}
            <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
              <label className="block text-[10px] font-bold text-text-main uppercase tracking-wider mb-2 opacity-70">
                Chọn vai trò mới
              </label>

              <div className="space-y-3">
                {/* Option: Khách hàng */}
                <label
                  onClick={() => setSelectedRole("customer")}
                  className={`relative flex items-start p-3.5 border rounded-lg cursor-pointer transition-all ${
                    selectedRole === "customer"
                      ? "border-primary bg-blue-50/50 ring-1 ring-primary"
                      : "border-border bg-white hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  <input
                    type="radio"
                    name="role"
                    value="customer"
                    checked={selectedRole === "customer"}
                    onChange={() => setSelectedRole("customer")}
                    className="mt-0.5 w-4 h-4 text-primary focus:ring-primary border-border"
                  />
                  <div className="ml-3 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-text-main text-[15px]">
                        Khách hàng
                      </span>
                    </div>
                    <p className="text-[13px] text-text-muted mt-0.5 leading-relaxed">
                      Quyền hạn cơ bản cho người dùng cuối. Có thể duyệt danh mục, mua voucher, quản lý ví điểm thưởng và đánh giá dịch vụ.
                    </p>
                  </div>
                </label>

                {/* Option: Đối tác */}
                <label
                  onClick={() => setSelectedRole("partner")}
                  className={`relative flex items-start p-3.5 border rounded-lg cursor-pointer transition-all ${
                    selectedRole === "partner"
                      ? "border-primary bg-blue-50/50 ring-1 ring-primary"
                      : "border-border bg-white hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  <input
                    type="radio"
                    name="role"
                    value="partner"
                    checked={selectedRole === "partner"}
                    onChange={() => setSelectedRole("partner")}
                    className="mt-0.5 w-4 h-4 text-primary focus:ring-primary border-border"
                  />
                  <div className="ml-3 flex-1">
                    <span className="font-bold text-text-main text-[15px]">
                      Đối tác
                    </span>
                    <p className="text-[13px] text-text-muted mt-0.5 leading-relaxed">
                      Dành cho chủ doanh nghiệp. Quyền tạo niêm yết voucher, quản lý chi nhánh, xem báo cáo doanh thu và đối soát giao dịch.
                    </p>
                  </div>
                </label>
              </div>

              {/* Warning Alert Box */}
              <div className="mt-4 flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-900">
                <Icon name="warning" className="text-amber-600 text-[20px]" />
                <div className="space-y-0.5">
                  <p className="font-bold text-[13px]">Lưu ý quan trọng</p>
                  <p className="text-[12px] leading-relaxed opacity-90">
                    Người dùng sẽ bị đăng xuất để áp dụng quyền mới. Quá trình này không thể hoàn tác ngay lập tức.
                  </p>
                </div>
              </div>

              {/* Action Submit */}
              <div className="pt-4 border-t border-border mt-5 flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowConfirmModal(true)}
                  className="px-6 py-2.5 bg-primary-container text-white font-bold text-[14px] rounded-lg hover:bg-blue-700 transition-all shadow-sm active:scale-95 flex items-center gap-1.5"
                >
                  <Icon name="sync" className="text-[20px]" />
                  <span>Cập nhật quyền hạn</span>
                </button>
              </div>
            </form>
          </div>
        </section>
      )}

      {/* Role Update Confirmation Modal (Stitch Screen b8bed576) */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-border max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 text-primary">
              <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
                <Icon name="published_with_changes" className="text-2xl" />
              </div>
              <h3 className="font-bold text-lg text-slate-900">
                Xác nhận thay đổi vai trò người dùng?
              </h3>
            </div>
            <p className="text-sm text-slate-600">
              Bạn có chắc chắn muốn thay đổi vai trò của người dùng{" "}
              <strong className="text-slate-900">{userDetail.name}</strong> từ{" "}
              <span className="font-semibold text-slate-700">"{currentRole}"</span> sang{" "}
              <span className="font-semibold text-primary">"{selectedRole === "customer" ? "Khách hàng" : "Đối tác"}"</span> không?
            </p>
            <p className="text-xs text-amber-800 bg-amber-50 p-2.5 rounded-lg border border-amber-200">
              ⚠️ Tài khoản sẽ bị buộc đăng xuất ngay sau khi cập nhật để áp dụng cấu hình phân quyền mới.
            </p>
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleConfirmRoleChange}
                className="px-4 py-2 text-xs font-semibold text-white bg-primary-container hover:bg-blue-700 rounded-lg transition shadow-sm"
              >
                Xác nhận thay đổi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Khóa / Mở khóa Tài khoản */}
      {lockModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-border max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                  accountStatus === "Đang hoạt động"
                    ? "bg-rose-50 text-rose-600"
                    : "bg-emerald-50 text-emerald-600"
                }`}
              >
                <Icon name={accountStatus === "Đang hoạt động" ? "lock" : "lock_open"} className="text-2xl" />
              </div>
              <h3 className="font-bold text-lg text-slate-900">
                {accountStatus === "Đang hoạt động"
                  ? "Xác nhận khóa tài khoản?"
                  : "Xác nhận mở khóa tài khoản?"}
              </h3>
            </div>
            <p className="text-sm text-slate-600">
              {accountStatus === "Đang hoạt động"
                ? `Bạn có chắc chắn muốn khóa tài khoản của ${userDetail.name}? Người dùng sẽ không thể truy cập hệ thống.`
                : `Khôi phục trạng thái hoạt động cho tài khoản ${userDetail.name}. Người dùng sẽ có thể đăng nhập lại bình thường.`}
            </p>

            {accountStatus === "Đang hoạt động" && (
              <div className="space-y-1.5 pt-1">
                <label className="block text-xs font-bold text-slate-700">
                  Lý do khóa tài khoản *
                </label>
                <textarea
                  rows={3}
                  placeholder="Nhập chi tiết lý do khóa tài khoản..."
                  value={lockReason}
                  onChange={(e) => setLockReason(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:border-rose-500 focus:ring-1 focus:ring-rose-500 outline-none transition"
                />
              </div>
            )}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setLockModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmLockToggle}
                className={`px-4 py-2 text-xs font-semibold text-white rounded-lg transition shadow-sm ${
                  accountStatus === "Đang hoạt động"
                    ? "bg-rose-600 hover:bg-rose-700"
                    : "bg-emerald-600 hover:bg-emerald-700"
                }`}
              >
                {accountStatus === "Đang hoạt động" ? "Xác nhận khóa" : "Xác nhận mở khóa"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
