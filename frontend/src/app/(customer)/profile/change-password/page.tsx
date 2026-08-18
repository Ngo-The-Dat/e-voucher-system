"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { customerAuthApi } from "@/lib/customer-api";
import { Eye, EyeOff, Check, CircleAlert, KeyRound } from "lucide-react";

export default function CustomerChangePasswordPage() {
  const router = useRouter();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    
    if (newPassword !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp.");
      return;
    }

    // Xoá check frontend để đẩy xuống backend xử lý theo đúng thứ tự (Check mật khẩu cũ đúng chưa -> rồi mới check trùng hay không)

    setIsSubmitting(true);

    try {
      const result = await customerAuthApi.changePassword({
        current_password: currentPassword,
        new_password: newPassword
      });
      
      setSuccess(result.message || "Đổi mật khẩu thành công.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      
      // Có thể chuyển hướng về trang chủ hoặc profile sau vài giây
      // setTimeout(() => router.push("/"), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Đã xảy ra lỗi khi đổi mật khẩu.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
        <div className="flex items-center gap-4 mb-8 pb-6 border-b border-gray-100">
          <div className="w-12 h-12 bg-[#0f2c59]/5 rounded-xl flex items-center justify-center text-[#0f2c59]">
            <KeyRound className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Đổi mật khẩu</h1>
            <p className="text-sm text-gray-500 mt-1">
              Bảo mật tài khoản của bạn bằng cách sử dụng mật khẩu mạnh.
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm font-medium flex items-start gap-3">
            <CircleAlert className="w-5 h-5 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 rounded-xl bg-green-50 border border-green-100 text-green-700 text-sm font-medium flex items-start gap-3">
            <Check className="w-5 h-5 shrink-0 mt-0.5" />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Mật khẩu hiện tại</label>
            <div className="relative">
              <input
                type={showCurrentPassword ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Nhập mật khẩu đang sử dụng"
                required
                className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3.5 px-4 focus:outline-none focus:bg-white focus:border-[#0f2c59] focus:ring-1 focus:ring-[#0f2c59] text-gray-900 transition-colors pr-12"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer p-1"
              >
                {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>
          
          <div className="pt-2">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Mật khẩu mới</label>
            <div className="relative">
              <input
                type={showNewPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Ít nhất 6 ký tự"
                required
                minLength={6}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3.5 px-4 focus:outline-none focus:bg-white focus:border-[#0f2c59] focus:ring-1 focus:ring-[#0f2c59] text-gray-900 transition-colors pr-12"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer p-1"
              >
                {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Xác nhận mật khẩu mới</label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Nhập lại mật khẩu mới"
                required
                minLength={6}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3.5 px-4 focus:outline-none focus:bg-white focus:border-[#0f2c59] focus:ring-1 focus:ring-[#0f2c59] text-gray-900 transition-colors pr-12"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer p-1"
              >
                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={isSubmitting || !currentPassword || !newPassword || !confirmPassword}
              className="w-full bg-[#0f2c59] text-white font-bold py-4 rounded-xl hover:bg-[#0f2c59]/90 transition-colors shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
            >
              {isSubmitting ? "Đang xử lý..." : "Cập nhật mật khẩu"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
