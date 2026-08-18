"use client";

import { useState } from "react";
import Link from "next/link";
import Icon from "@/components/shared/ui/Icon";
import Toast from "@/components/shared/ui/Toast";
import StatusBadge from "@/components/shared/ui/StatusBadge";
import { useEmployee } from "@/context/EmployeeContext";
import { partnerApi, ApiError } from "@/lib/partner-api";

export default function EmployeeProfilePage() {
  const { profile, reloadProfile } = useEmployee();

  // Change password state
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");

  // Edit personal info state
  const [isEditing, setIsEditing] = useState(false);
  const [fullName, setFullName] = useState(profile?.full_name ?? "");
  const [phone, setPhone] = useState(profile?.phone ?? "");
  const [gender, setGender] = useState(profile?.gender ?? "");
  const [nationality, setNationality] = useState(profile?.nationality ?? "Việt Nam");
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Toast state
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<"success" | "error">("success");

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToastMessage(message);
    setToastType(type);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleStartEdit = () => {
    setFullName(profile?.full_name ?? "");
    setPhone(profile?.phone ?? "");
    setGender(profile?.gender ?? "");
    setNationality(profile?.nationality ?? "Việt Nam");
    setIsEditing(true);
  };

  const handleSaveProfile = async () => {
    setIsSavingProfile(true);
    try {
      await partnerApi.updateEmployeeProfile({
        full_name: fullName,
        phone,
        gender,
        nationality,
      });
      await reloadProfile();
      setIsEditing(false);
      showToast("Cập nhật thông tin cá nhân thành công!");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Không thể cập nhật thông tin.", "error");
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError("");

    if (!oldPassword || !newPassword || !confirmPassword) {
      setPasswordError("Vui lòng điền đầy đủ các trường mật khẩu.");
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError("Mật khẩu mới phải có ít nhất 8 ký tự.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("Xác nhận mật khẩu mới không khớp.");
      return;
    }

    setIsChangingPassword(true);
    try {
      await partnerApi.changeEmployeePassword({
        old_password: oldPassword,
        new_password: newPassword,
      });
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
      showToast("Đổi mật khẩu thành công!");
    } catch (err) {
      setPasswordError(
        err instanceof ApiError ? err.message : "Không thể đổi mật khẩu. Vui lòng kiểm tra lại."
      );
    } finally {
      setIsChangingPassword(false);
    }
  };

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return "Chưa ghi nhận";
    try {
      return new Date(dateStr).toLocaleString("vi-VN");
    } catch {
      return dateStr;
    }
  };

  const genderLabel = (g?: string | null) => {
    if (g === "MALE") return "Nam";
    if (g === "FEMALE") return "Nữ";
    if (g === "OTHER") return "Khác";
    return g ?? "Chưa thiết lập";
  };

  return (
    <main className="p-4 sm:p-6 md:p-8 flex-1 overflow-y-auto max-w-4xl w-full mx-auto space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <Toast
          type={toastType}
          message={toastMessage}
        />
      )}

      {/* Top Header with Back Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-outline-variant/40 pb-4">
        <div className="flex items-center gap-3">
          <Link
            href="/partner/employee"
            className="w-10 h-10 rounded-xl bg-surface-container-high hover:bg-surface-container-highest flex items-center justify-center text-on-surface-variant transition-colors shrink-0"
            title="Quay lại kiểm tra voucher"
          >
            <Icon name="arrow_back" className="text-xl" />
          </Link>
          <div>
            <h2 className="text-2xl font-bold text-on-surface">Thông tin tài khoản</h2>
            <p className="text-sm text-on-surface-variant">
              Xem và quản lý thông tin cá nhân của nhân viên đối tác.
            </p>
          </div>
        </div>

        <Link
          href="/partner/employee"
          className="self-start sm:self-auto flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-on-primary font-semibold text-sm hover:opacity-95 shadow-sm transition-all"
        >
          <Icon name="qr_code_scanner" className="text-lg" />
          <span>Kiểm tra Voucher</span>
        </Link>
      </div>

      {/* Card 1: Thông tin cá nhân */}
      <div className="bg-surface-bright border border-outline-variant rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between border-b border-outline-variant/30 pb-4 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold">
              <Icon name="person" className="text-lg" />
            </div>
            <h3 className="font-bold text-lg text-on-surface">Thông tin cá nhân</h3>
          </div>

          {!isEditing ? (
            <button
              onClick={handleStartEdit}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-outline-variant hover:bg-surface-container-high text-xs font-semibold text-on-surface transition-colors"
            >
              <Icon name="edit" className="text-sm" />
              <span>Chỉnh sửa</span>
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsEditing(false)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-on-surface-variant hover:bg-surface-container-high transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={handleSaveProfile}
                disabled={isSavingProfile}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary text-on-primary text-xs font-bold hover:opacity-90 disabled:opacity-50 transition-opacity"
              >
                {isSavingProfile && <Icon name="progress_activity" className="animate-spin text-sm" />}
                <span>Lưu thay đổi</span>
              </button>
            </div>
          )}
        </div>

        {!isEditing ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6 text-sm">
            <div>
              <span className="text-xs font-medium text-on-surface-variant block mb-1">Họ và tên</span>
              <span className="font-semibold text-on-surface text-base">{profile?.full_name || "—"}</span>
            </div>

            <div>
              <span className="text-xs font-medium text-on-surface-variant block mb-1">Email đăng nhập</span>
              <span className="font-semibold text-on-surface">{profile?.email || "—"}</span>
            </div>

            <div>
              <span className="text-xs font-medium text-on-surface-variant block mb-1">Số điện thoại</span>
              <span className="font-semibold text-on-surface">{profile?.phone || "Chưa cập nhật"}</span>
            </div>

            <div>
              <span className="text-xs font-medium text-on-surface-variant block mb-1">Số CCCD / CMND</span>
              <span className="font-semibold text-on-surface">{profile?.identity_no || "Chưa cập nhật"}</span>
            </div>

            <div>
              <span className="text-xs font-medium text-on-surface-variant block mb-1">Giới tính</span>
              <span className="font-semibold text-on-surface">{genderLabel(profile?.gender)}</span>
            </div>

            <div>
              <span className="text-xs font-medium text-on-surface-variant block mb-1">Quốc tịch</span>
              <span className="font-semibold text-on-surface">{profile?.nationality || "Việt Nam"}</span>
            </div>

            <div>
              <span className="text-xs font-medium text-on-surface-variant block mb-1">Trạng thái tài khoản</span>
              <div className="mt-0.5">
                <StatusBadge
                  status={profile?.status === "ACTIVE" ? "active" : "pending"}
                  label={profile?.status === "ACTIVE" ? "Đang hoạt động" : "Chưa duyệt"}
                />
              </div>
            </div>

            <div>
              <span className="text-xs font-medium text-on-surface-variant block mb-1">Lần đăng nhập cuối</span>
              <span className="font-semibold text-on-surface">{formatDate(profile?.last_login_at)}</span>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <label className="text-xs font-medium text-on-surface-variant block mb-1">Họ và tên *</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl px-3.5 py-2.5 text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-on-surface-variant block mb-1">Số điện thoại</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="VD: 0901234567"
                className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl px-3.5 py-2.5 text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-on-surface-variant block mb-1">Giới tính</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl px-3.5 py-2.5 text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              >
                <option value="">-- Chọn giới tính --</option>
                <option value="MALE">Nam</option>
                <option value="FEMALE">Nữ</option>
                <option value="OTHER">Khác</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-on-surface-variant block mb-1">Quốc tịch</label>
              <input
                type="text"
                value={nationality}
                onChange={(e) => setNationality(e.target.value)}
                className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl px-3.5 py-2.5 text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>
        )}
      </div>

      {/* Card 2: Thông tin Đơn vị công tác */}
      <div className="bg-surface-bright border border-outline-variant rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-2.5 border-b border-outline-variant/30 pb-4 mb-5">
          <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold">
            <Icon name="store" className="text-lg" />
          </div>
          <h3 className="font-bold text-lg text-on-surface">Đơn vị công tác</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6 text-sm">
          <div>
            <span className="text-xs font-medium text-on-surface-variant block mb-1">Doanh nghiệp đối tác</span>
            <span className="font-bold text-on-surface text-base">{profile?.partner?.business_name || "—"}</span>
          </div>

          <div>
            <span className="text-xs font-medium text-on-surface-variant block mb-1">Chi nhánh phân công</span>
            <span className="font-bold text-primary text-base">{profile?.branch?.name || "—"}</span>
          </div>

          <div className="sm:col-span-2">
            <span className="text-xs font-medium text-on-surface-variant block mb-1">Địa chỉ chi nhánh</span>
            <span className="font-medium text-on-surface">{profile?.branch?.address || "—"}</span>
          </div>

          {profile?.branch?.phone && (
            <div>
              <span className="text-xs font-medium text-on-surface-variant block mb-1">Hotline chi nhánh</span>
              <span className="font-medium text-on-surface">{profile.branch.phone}</span>
            </div>
          )}
        </div>
      </div>

      {/* Card 3: Đổi mật khẩu */}
      <div className="bg-surface-bright border border-outline-variant rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-2.5 border-b border-outline-variant/30 pb-4 mb-5">
          <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold">
            <Icon name="lock" className="text-lg" />
          </div>
          <h3 className="font-bold text-lg text-on-surface">Đổi mật khẩu tài khoản</h3>
        </div>

        {passwordError && (
          <div className="mb-4 p-3 rounded-xl bg-error/10 border border-error/20 text-error text-xs font-medium flex items-center gap-2">
            <Icon name="error" className="text-base shrink-0" />
            <span>{passwordError}</span>
          </div>
        )}

        <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
          <div>
            <label className="text-xs font-semibold text-on-surface block mb-1">Mật khẩu hiện tại *</label>
            <input
              type="password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl px-3.5 py-2.5 text-sm text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-on-surface block mb-1">Mật khẩu mới (tối thiểu 8 ký tự) *</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={8}
              className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl px-3.5 py-2.5 text-sm text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-on-surface block mb-1">Xác nhận mật khẩu mới *</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={8}
              className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl px-3.5 py-2.5 text-sm text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>

          <button
            type="submit"
            disabled={isChangingPassword}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-on-primary text-sm font-bold hover:opacity-95 disabled:opacity-50 transition-opacity shadow-sm cursor-pointer"
          >
            {isChangingPassword && <Icon name="progress_activity" className="animate-spin text-base" />}
            <span>Đổi mật khẩu</span>
          </button>
        </form>
      </div>
    </main>
  );
}
