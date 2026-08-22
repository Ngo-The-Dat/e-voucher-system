"use client";

import { FormEvent, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { customerAuthApi, CustomerUser } from "@/lib/customer-api";
import { Check, CircleAlert, Mail, Phone, User as UserIcon, Save, ArrowLeft, ShieldCheck, Edit2, Lock, KeyRound, Eye, EyeOff, Globe, CreditCard, Clock, ChevronDown } from "lucide-react";
import Link from "next/link";
import { COUNTRIES } from "@/lib/countries";

export default function CustomerProfilePage() {
  const router = useRouter();

  // Personal Info States
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [gender, setGender] = useState("");
  const [identityNo, setIdentityNo] = useState("");
  const [nationality, setNationality] = useState("");
  const [status, setStatus] = useState("");
  const [createdAt, setCreatedAt] = useState("");

  const [originalData, setOriginalData] = useState({ 
    fullName: "", phone: "", gender: "", identityNo: "", nationality: "" 
  });

  const [isEditing, setIsEditing] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  
  // Password States
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");

  // Global UI States
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const showToast = (message: string, isError = false) => {
    if (isError) {
      setError(message);
      setSuccess("");
      setTimeout(() => setError(""), 4000);
    } else {
      setSuccess(message);
      setError("");
      setTimeout(() => setSuccess(""), 4000);
    }
  };

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userData = await customerAuthApi.getMe();
        setFullName(userData.full_name || "");
        setPhone(userData.phone || "");
        setEmail(userData.email || "");
        setGender(userData.gender || "");
        setIdentityNo(userData.identity_no || "");
        setNationality(userData.nationality || "Việt Nam");
        setStatus(userData.status || "");
        setCreatedAt(userData.created_at || "");

        setOriginalData({ 
          fullName: userData.full_name || "", 
          phone: userData.phone || "",
          gender: userData.gender || "",
          identityNo: userData.identity_no || "",
          nationality: userData.nationality || "Việt Nam"
        });
      } catch (err: any) {
        showToast("Không thể tải thông tin tài khoản. Lỗi: " + (err.message || String(err)), true);
      } finally {
        setIsLoading(false);
      }
    };
    fetchUser();
  }, []);

  const handleStartEdit = () => {
    setFullName(originalData.fullName);
    setPhone(originalData.phone);
    setGender(originalData.gender);
    setIdentityNo(originalData.identityNo);
    setNationality(originalData.nationality);
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setFullName(originalData.fullName);
    setPhone(originalData.phone);
    setGender(originalData.gender);
    setIdentityNo(originalData.identityNo);
    setNationality(originalData.nationality);
    setIsEditing(false);
  };

  const handleUpdateProfile = async (event: FormEvent) => {
    event.preventDefault();
    if (!fullName.trim()) {
      showToast("Họ và tên không được để trống.", true);
      return;
    }

    setIsSavingProfile(true);

    try {
      const updatedUser = await customerAuthApi.updateProfile({
        full_name: fullName,
        phone: phone || undefined,
        gender: gender || undefined,
        identity_no: identityNo || undefined,
        nationality: nationality || undefined,
      });
      
      showToast("Cập nhật thông tin thành công.");
      setOriginalData({ 
        fullName: updatedUser.full_name, 
        phone: updatedUser.phone || "",
        gender: updatedUser.gender || "",
        identityNo: updatedUser.identity_no || "",
        nationality: updatedUser.nationality || "Việt Nam"
      });
      setIsEditing(false);
      
      localStorage.setItem("customer_user", JSON.stringify(updatedUser));
      window.dispatchEvent(new Event("customer-auth-changed"));
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Đã xảy ra lỗi khi cập nhật thông tin.", true);
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleChangePassword = async (event: FormEvent) => {
    event.preventDefault();
    setPasswordError("");
    
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError("Vui lòng điền đầy đủ thông tin mật khẩu.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("Mật khẩu mới và xác nhận mật khẩu không khớp.");
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError("Mật khẩu mới phải có ít nhất 6 ký tự.");
      return;
    }

    setIsChangingPassword(true);

    try {
      await customerAuthApi.changePassword({
        current_password: currentPassword,
        new_password: newPassword
      });
      
      showToast("Đổi mật khẩu thành công. Bạn sẽ được chuyển hướng về trang Đăng nhập...");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      
      // Tự động đăng xuất sau khi đổi mật khẩu
      setTimeout(() => {
        customerAuthApi.logout();
        window.dispatchEvent(new Event("customer-auth-changed"));
        router.push("/login");
      }, 2000);
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : "Đã xảy ra lỗi khi đổi mật khẩu.");
    } finally {
      setIsChangingPassword(false);
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "Chưa ghi nhận";
    try {
      return new Date(dateStr).toLocaleString("vi-VN");
    } catch {
      return dateStr;
    }
  };

  const getGenderLabel = (g?: string) => {
    if (g === "MALE") return "Nam";
    if (g === "FEMALE") return "Nữ";
    if (g === "OTHER") return "Khác";
    return "Chưa thiết lập";
  };

  if (isLoading) {
    return (
      <div className="min-h-[80vh] flex justify-center items-center bg-gray-50/50">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full border-t-2 border-[#0f2c59] animate-spin"></div>
          <div className="absolute inset-2 rounded-full border-r-2 border-blue-400 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50">
      <main className="flex-grow w-full max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-8 md:py-12 space-y-6">
        
        {/* Global Toasts */}
        {error && (
          <div className="p-4 rounded-2xl bg-error/5 border border-error/20 text-error text-sm font-medium flex items-center gap-3 animate-fadeIn">
            <CircleAlert className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="p-4 rounded-2xl bg-green-50 border border-green-200 text-green-700 text-sm font-medium flex items-center gap-3 animate-fadeIn">
            <Check className="w-5 h-5 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-4">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="w-10 h-10 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 flex items-center justify-center text-gray-500 hover:text-[#0f2c59] transition-colors shrink-0"
              title="Quay lại trang chủ"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Hồ sơ tài khoản</h2>
              <p className="text-sm text-gray-500">
                Xem và quản lý thông tin cá nhân của bạn.
              </p>
            </div>
          </div>
        </div>

        {/* Card 1: Personal Info */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#0f2c59]/10 text-[#0f2c59] flex items-center justify-center font-bold">
                <UserIcon className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-lg text-gray-900">Thông tin cá nhân</h3>
            </div>

            {!isEditing ? (
              <button
                onClick={handleStartEdit}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-xs font-semibold text-gray-700 transition-colors"
              >
                <Edit2 className="w-4 h-4" />
                <span>Chỉnh sửa</span>
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCancelEdit}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-500 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                >
                  Hủy
                </button>
                <button
                  onClick={handleUpdateProfile}
                  disabled={isSavingProfile || !fullName.trim()}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#0f2c59] text-white text-xs font-bold hover:bg-[#0f2c59]/90 disabled:opacity-50 transition-all shadow-sm"
                >
                  {isSavingProfile ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  <span>Lưu thay đổi</span>
                </button>
              </div>
            )}
          </div>

          {!isEditing ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6 text-sm">
              <div>
                <span className="text-xs font-medium text-gray-500 block mb-1">Họ và tên</span>
                <span className="font-semibold text-gray-900 text-base">{originalData.fullName || "—"}</span>
              </div>
              <div>
                <span className="text-xs font-medium text-gray-500 block mb-1">Email đăng nhập</span>
                <span className="font-semibold text-gray-900 text-base">{email || "—"}</span>
              </div>
              <div>
                <span className="text-xs font-medium text-gray-500 block mb-1">Số điện thoại</span>
                <span className="font-semibold text-gray-900 text-base">{originalData.phone || "Chưa cập nhật"}</span>
              </div>
              <div>
                <span className="text-xs font-medium text-gray-500 block mb-1">Số CCCD / CMND</span>
                <span className="font-semibold text-gray-900 text-base">{originalData.identityNo || "Chưa cập nhật"}</span>
              </div>
              <div>
                <span className="text-xs font-medium text-gray-500 block mb-1">Giới tính</span>
                <span className="font-semibold text-gray-900 text-base">{getGenderLabel(originalData.gender)}</span>
              </div>
              <div>
                <span className="text-xs font-medium text-gray-500 block mb-1">Quốc tịch</span>
                <span className="font-semibold text-gray-900 text-base">{originalData.nationality || "Việt Nam"}</span>
              </div>
              <div>
                <span className="text-xs font-medium text-gray-500 block mb-1">Trạng thái tài khoản</span>
                <div className="mt-0.5">
                  {status === "ACTIVE" ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-green-50 text-green-700 text-xs font-bold border border-green-200">
                      <ShieldCheck className="w-3.5 h-3.5" /> Đang hoạt động
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-gray-50 text-gray-700 text-xs font-bold border border-gray-200">
                      {status || "Không rõ"}
                    </span>
                  )}
                </div>
              </div>
              <div>
                <span className="text-xs font-medium text-gray-500 block mb-1">Ngày tham gia</span>
                <span className="font-semibold text-gray-900 text-base">{formatDate(createdAt)}</span>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-2">Họ và tên <span className="text-error">*</span></label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                    <UserIcon className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    className="w-full bg-gray-50/50 border border-gray-200 rounded-xl py-3 pl-10 pr-4 text-gray-900 focus:outline-none focus:border-[#0f2c59] focus:ring-4 focus:ring-[#0f2c59]/10 transition-all font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-2">Số điện thoại</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                    <Phone className="w-4 h-4" />
                  </div>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="VD: 0901234567"
                    className="w-full bg-gray-50/50 border border-gray-200 rounded-xl py-3 pl-10 pr-4 text-gray-900 focus:outline-none focus:border-[#0f2c59] focus:ring-4 focus:ring-[#0f2c59]/10 transition-all font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-2">Số CCCD / CMND</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                    <CreditCard className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={identityNo}
                    onChange={(e) => setIdentityNo(e.target.value)}
                    placeholder="Nhập số CMND/CCCD"
                    className="w-full bg-gray-50/50 border border-gray-200 rounded-xl py-3 pl-10 pr-4 text-gray-900 focus:outline-none focus:border-[#0f2c59] focus:ring-4 focus:ring-[#0f2c59]/10 transition-all font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-2">Giới tính</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                    <UserIcon className="w-4 h-4" />
                  </div>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full bg-gray-50/50 border border-gray-200 rounded-xl py-3 pl-10 pr-4 text-gray-900 focus:outline-none focus:border-[#0f2c59] focus:ring-4 focus:ring-[#0f2c59]/10 transition-all font-medium appearance-none"
                  >
                    <option value="">-- Chọn giới tính --</option>
                    <option value="MALE">Nam</option>
                    <option value="FEMALE">Nữ</option>
                    <option value="OTHER">Khác</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray-400">
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-2">Quốc tịch</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                    <Globe className="w-4 h-4" />
                  </div>
                  <select
                    value={nationality}
                    onChange={(e) => setNationality(e.target.value)}
                    className="w-full bg-gray-50/50 border border-gray-200 rounded-xl py-3 pl-10 pr-4 text-gray-900 focus:outline-none focus:border-[#0f2c59] focus:ring-4 focus:ring-[#0f2c59]/10 transition-all font-medium appearance-none"
                  >
                    <option value="">-- Chọn quốc tịch --</option>
                    {COUNTRIES.map((country) => (
                      <option key={country} value={country}>
                        {country}
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray-400">
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-2 flex justify-between items-center">
                  Email
                  <span className="text-[10px] text-gray-500 font-medium px-1.5 py-0.5 bg-gray-100 rounded border border-gray-200">Không thể đổi</span>
                </label>
                <div className="relative opacity-70">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    disabled
                    className="w-full bg-gray-100 border border-gray-200 rounded-xl py-3 pl-10 pr-4 text-gray-600 cursor-not-allowed font-medium"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Card 2: Security & Change Password */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-2.5 border-b border-gray-100 pb-4 mb-5">
            <div className="w-8 h-8 rounded-lg bg-[#0f2c59]/10 text-[#0f2c59] flex items-center justify-center font-bold">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-gray-900">Đổi mật khẩu tài khoản</h3>
            </div>
          </div>

          <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-4 mb-6 flex gap-3 items-start">
            <div className="bg-blue-100 text-[#0f2c59] p-1.5 rounded-lg shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-gray-900 mb-0.5">Bảo vệ tài khoản của bạn</h4>
              <p className="text-xs text-gray-600 leading-relaxed">
                Sử dụng mật khẩu mạnh bao gồm ít nhất 6 ký tự. Chúng tôi khuyến nghị bạn không dùng lại mật khẩu đã sử dụng ở các ứng dụng khác.
              </p>
            </div>
          </div>

          {passwordError && (
            <div className="mb-6 p-3 rounded-xl bg-error/10 border border-error/20 text-error text-sm font-medium flex items-center gap-2">
              <CircleAlert className="w-4 h-4 shrink-0" />
              <span>{passwordError}</span>
            </div>
          )}

          <form onSubmit={handleChangePassword} className="space-y-5 max-w-md">
            <div className="group">
              <label className="text-xs font-semibold text-gray-900 block mb-2">Mật khẩu hiện tại *</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400 group-focus-within:text-[#0f2c59] transition-colors">
                  <KeyRound className="w-4 h-4" />
                </div>
                <input
                  type={showCurrentPassword ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full bg-gray-50/50 border border-gray-200 rounded-xl py-3 pl-10 pr-12 text-sm text-gray-900 focus:outline-none focus:border-[#0f2c59] focus:ring-4 focus:ring-[#0f2c59]/10 transition-all font-medium"
                />
                <button 
                  type="button" 
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                >
                  {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="group">
              <label className="text-xs font-semibold text-gray-900 block mb-2">Mật khẩu mới (ít nhất 6 ký tự) *</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400 group-focus-within:text-[#0f2c59] transition-colors">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  className="w-full bg-gray-50/50 border border-gray-200 rounded-xl py-3 pl-10 pr-12 text-sm text-gray-900 focus:outline-none focus:border-[#0f2c59] focus:ring-4 focus:ring-[#0f2c59]/10 transition-all font-medium"
                />
                <button 
                  type="button" 
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="group">
              <label className="text-xs font-semibold text-gray-900 block mb-2">Xác nhận mật khẩu mới *</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400 group-focus-within:text-[#0f2c59] transition-colors">
                  <Check className="w-4 h-4" />
                </div>
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  className="w-full bg-gray-50/50 border border-gray-200 rounded-xl py-3 pl-10 pr-12 text-sm text-gray-900 focus:outline-none focus:border-[#0f2c59] focus:ring-4 focus:ring-[#0f2c59]/10 transition-all font-medium"
                />
                <button 
                  type="button" 
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isChangingPassword || !currentPassword || !newPassword || !confirmPassword}
              className="flex items-center justify-center gap-2 px-6 py-2.5 mt-2 rounded-xl bg-[#0f2c59] text-white text-sm font-bold hover:bg-[#0f2c59]/90 disabled:opacity-50 transition-all shadow-sm cursor-pointer w-full sm:w-auto"
            >
              {isChangingPassword ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <Lock className="w-4 h-4" />
              )}
              <span>Cập nhật mật khẩu</span>
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
