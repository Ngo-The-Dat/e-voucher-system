/**
 * =========================================================================================
 * FILE: page.tsx (Admin Profile)
 * VỊ TRÍ: frontend/src/app/admin/profile/
 * VAI TRÒ TRONG HỆ THỐNG:
 *   - Màn hình Quản lý Hồ sơ Cá nhân & Bảo mật của Quản trị viên (Admin Profile & Security).
 *   - Các tính năng nghiệp vụ chính:
 *       1. Xem chi tiết thông tin tài khoản: Email, Vai trò (ADMIN), Trạng thái hoạt động, Lần đăng nhập cuối, Ngày tạo tài khoản.
 *       2. Chỉnh sửa thông tin cá nhân: Họ tên, Số điện thoại (Regex kiểm tra đầu số VN), Giới tính, Quốc tịch, Số CMND/CCCD.
 *       3. Đổi mật khẩu đăng nhập: Kiểm tra độ dài tối thiểu 8 ký tự, khớp xác nhận mật khẩu, kiểm tra mật khẩu cũ qua Backend (bcrypt.compare).
 * =========================================================================================
 */

"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import Icon from "@/components/shared/ui/Icon";
import StatusBadge from "@/components/shared/ui/StatusBadge";
import { useAdminProfile } from "@/hooks/useAdminProfile";

export default function AdminProfilePage() {
  // Hook lấy dữ liệu hồ sơ và các hàm thao tác API (updateProfile, changePassword)
  const { profile, isLoading, updateProfile, changePassword } = useAdminProfile();

  // ─── State Chỉnh sửa Thông tin Cá nhân ──────────────────────────────────────────
  const [isEditing, setIsEditing] = useState(false);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [gender, setGender] = useState("MALE");
  const [nationality, setNationality] = useState("Việt Nam");
  const [identityNo, setIdentityNo] = useState("");
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // ─── State Đổi Mật khẩu Đăng nhập ──────────────────────────────────────────────
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");


  const handleStartEdit = () => {
    if (!profile) return;
    setFullName(profile.full_name);
    setPhone(profile.phone || "");
    setGender(profile.gender || "MALE");
    setNationality(profile.nationality || "Việt Nam");
    setIdentityNo(profile.identity_no || "");
    setIsEditing(true);
  };

  const handleSaveProfile = async () => {
    if (!fullName.trim()) {
      toast.error("Họ và tên không được để trống.");
      return;
    }

    if (phone.trim()) {
      const cleanPhone = phone.trim().replace(/\s/g, "");
      const isPhoneValid = /^(0|\+84)[3|5|7|8|9][0-9]{8}$/.test(cleanPhone);
      if (!isPhoneValid) {
        toast.error("Số điện thoại không hợp lệ (yêu cầu 10 chữ số, bắt đầu bằng 03, 05, 07, 08, 09 hoặc +84).");
        return;
      }
    }

    if (identityNo.trim()) {
      const cleanIdentity = identityNo.trim();
      const isIdentityValid = /^([0-9]{9}|[0-9]{12})$/.test(cleanIdentity);
      if (!isIdentityValid) {
        toast.error("Số CCCD / CMND không hợp lệ (yêu cầu 9 chữ số CMND hoặc 12 chữ số CCCD).");
        return;
      }
    }

    setIsSavingProfile(true);
    try {
      await updateProfile({
        full_name: fullName.trim(),
        phone: phone.trim() || null,
        gender,
        nationality: nationality.trim() || "Việt Nam",
        identity_no: identityNo.trim() || null,
      });
      setIsEditing(false);
      toast.success("Cập nhật thông tin cá nhân thành công!");
    } catch (err: any) {
      toast.error(err?.message || "Không thể cập nhật thông tin.");
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
      await changePassword(oldPassword, newPassword);
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast.success("Đổi mật khẩu thành công!");
    } catch (err: any) {
      const msg = err?.message || "Không thể đổi mật khẩu. Vui lòng kiểm tra lại.";
      setPasswordError(msg);
      toast.error(msg);
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
    return g || "Chưa thiết lập";
  };

  if (isLoading || !profile) {
    return (
      <div className="flex-1 flex items-center justify-center p-12 min-h-[400px]">
        <div className="flex items-center gap-3 text-slate-500 font-medium text-base">
          <Icon name="progress_activity" className="animate-spin text-primary-container text-xl" />
          <span>Đang tải thông tin hồ sơ tài khoản...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl w-full mx-auto space-y-6 pb-12">
      {/* Header với Nút Quay lại đặt bên phải tiêu đề */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-blue-50 text-primary-container flex items-center justify-center font-bold text-xl shadow-2xs shrink-0">
            <Icon name="person" className="text-2xl" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 leading-tight">
              Thông tin tài khoản
            </h1>
            <p className="text-sm text-slate-500">
              Xem và quản lý thông tin cá nhân của Quản trị viên hệ thống.
            </p>
          </div>
        </div>

        {/* Nút Quay lại đặt bên phải tiêu đề */}
        <Link
          href="/admin"
          className="self-start sm:self-auto inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold transition-colors shadow-2xs group"
        >
          <Icon name="arrow_back" className="text-lg transition-transform group-hover:-translate-x-0.5" />
          <span>Quay lại Dashboard</span>
        </Link>
      </div>

      {/* THẺ 1: THÔNG TIN CÁ NHÂN */}
      <div className="bg-white border border-border rounded-2xl p-6 shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-primary-container flex items-center justify-center font-bold">
              <Icon name="badge" className="text-lg" />
            </div>
            <h2 className="font-bold text-lg text-slate-900">Thông tin cá nhân</h2>
          </div>

          {!isEditing ? (
            <button
              type="button"
              onClick={handleStartEdit}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors shadow-2xs"
            >
              <Icon name="edit" className="text-sm" />
              <span>Chỉnh sửa</span>
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleSaveProfile}
                disabled={isSavingProfile}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-primary-container text-white text-xs font-bold hover:opacity-90 disabled:opacity-50 transition-opacity shadow-xs"
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
              <span className="text-xs font-medium text-slate-500 block mb-1">Họ và tên</span>
              <span className="font-semibold text-slate-900 text-base">{profile.full_name || "—"}</span>
            </div>

            <div>
              <span className="text-xs font-medium text-slate-500 block mb-1">Email đăng nhập</span>
              <span className="font-semibold text-slate-900">{profile.email || "—"}</span>
            </div>

            <div>
              <span className="text-xs font-medium text-slate-500 block mb-1">Số điện thoại</span>
              <span className="font-semibold text-slate-900">{profile.phone || "Chưa cập nhật"}</span>
            </div>

            <div>
              <span className="text-xs font-medium text-slate-500 block mb-1">Số CCCD / CMND</span>
              <span className="font-semibold text-slate-900">{profile.identity_no || "Chưa cập nhật"}</span>
            </div>

            <div>
              <span className="text-xs font-medium text-slate-500 block mb-1">Giới tính</span>
              <span className="font-semibold text-slate-900">{genderLabel(profile.gender)}</span>
            </div>

            <div>
              <span className="text-xs font-medium text-slate-500 block mb-1">Quốc tịch</span>
              <span className="font-semibold text-slate-900">{profile.nationality || "Việt Nam"}</span>
            </div>

            <div>
              <span className="text-xs font-medium text-slate-500 block mb-1">Trạng thái tài khoản</span>
              <div className="mt-0.5">
                <StatusBadge
                  status={profile.status === "ACTIVE" ? "ACTIVE" : "LOCKED"}
                  label={profile.status === "ACTIVE" ? "Đang hoạt động" : "Đã khóa"}
                />
              </div>
            </div>

            <div>
              <span className="text-xs font-medium text-slate-500 block mb-1">Lần đăng nhập cuối</span>
              <span className="font-semibold text-slate-900">{formatDate(profile.last_login_at)}</span>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <label className="text-xs font-medium text-slate-600 block mb-1">Họ và tên *</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                placeholder="Nhập họ và tên"
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-container/20 text-slate-900 text-sm font-medium"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-slate-600 block mb-1">Email đăng nhập</label>
              <input
                type="email"
                value={profile.email || ""}
                disabled
                className="w-full px-3.5 py-2 rounded-xl bg-slate-100 border border-slate-200 text-slate-500 text-sm cursor-not-allowed"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-slate-600 block mb-1">
                Số điện thoại <span className="text-slate-400 font-normal">(10 chữ số)</span>
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0901..."
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-container/20 text-slate-900 text-sm"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-slate-600 block mb-1">
                Số CCCD / CMND <span className="text-slate-400 font-normal">(9 hoặc 12 chữ số)</span>
              </label>
              <input
                type="text"
                value={identityNo}
                onChange={(e) => setIdentityNo(e.target.value)}
                placeholder="0010..."
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-container/20 text-slate-900 text-sm"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-slate-600 block mb-1">Giới tính</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-container/20 text-slate-900 text-sm"
              >
                <option value="MALE">Nam</option>
                <option value="FEMALE">Nữ</option>
                <option value="OTHER">Khác</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-600 block mb-1">Quốc tịch</label>
              <input
                type="text"
                value={nationality}
                onChange={(e) => setNationality(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-container/20 text-slate-900 text-sm"
              />
            </div>
          </div>
        )}
      </div>

      {/* THẺ 2: ĐỔI MẬT KHẨU */}
      <div className="bg-white border border-border rounded-2xl p-6 shadow-xs">
        <div className="flex items-center gap-2.5 border-b border-slate-100 pb-4 mb-5">
          <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
            <Icon name="lock" className="text-lg" />
          </div>
          <div>
            <h2 className="font-bold text-lg text-slate-900">Đổi mật khẩu</h2>
            <p className="text-xs text-slate-500">Cập nhật mật khẩu mới để bảo vệ an toàn cho tài khoản Quản trị.</p>
          </div>
        </div>

        {passwordError && (
          <div className="p-3 mb-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
            <Icon name="error" className="text-base shrink-0" />
            <span>{passwordError}</span>
          </div>
        )}

        <form onSubmit={handleChangePassword} className="space-y-4 max-w-lg">
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Mật khẩu hiện tại *
            </label>
            <input
              type="password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              required
              placeholder="••••••••"
              className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-container/20 text-slate-900 text-sm"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Mật khẩu mới * (Tối thiểu 8 ký tự)
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              placeholder="••••••••"
              className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-container/20 text-slate-900 text-sm"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Xác nhận mật khẩu mới *
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              placeholder="••••••••"
              className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-container/20 text-slate-900 text-sm"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isChangingPassword}
              className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-primary-container text-white text-sm font-bold hover:opacity-90 disabled:opacity-60 transition-opacity shadow-xs"
            >
              {isChangingPassword && <Icon name="progress_activity" className="animate-spin text-base" />}
              <span>Đổi mật khẩu</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
