"use client";

import { FormEvent, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { customerAuthApi } from "@/lib/customer-api";
import { Eye, EyeOff, Check, CircleAlert, ArrowLeft, ShieldCheck } from "lucide-react";

export default function CustomerForgotPasswordPage() {
  const router = useRouter();
  
  // Steps: 1 (Request Email), 2 (Verify OTP), 3 (Reset Password)
  const [step, setStep] = useState<1 | 2 | 3>(1);
  
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [challengeId, setChallengeId] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Resend OTP countdown
  const [resendCountdown, setResendCountdown] = useState(0);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (resendCountdown > 0) {
      timer = setTimeout(() => setResendCountdown((prev) => prev - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [resendCountdown]);

  const handleRequestOtp = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    setIsSubmitting(true);

    try {
      const result = await customerAuthApi.requestPasswordReset(email);
      setChallengeId(result.challenge_id);
      setResendCountdown(result.resend_after);
      setStep(2);
      setSuccess("Mã OTP đã được gửi đến email của bạn.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Đã xảy ra lỗi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyOtp = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    setIsSubmitting(true);

    try {
      const result = await customerAuthApi.verifyPasswordResetOtp({
        email,
        challenge_id: challengeId,
        code: otp
      });
      if (result.verified) {
        setStep(3);
        setSuccess("Xác thực thành công. Vui lòng nhập mật khẩu mới.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Mã OTP không hợp lệ.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    
    if (newPassword !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp.");
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await customerAuthApi.resetPassword({
        email,
        challenge_id: challengeId,
        new_password: newPassword
      });
      
      setSuccess(result.message);
      // Wait a bit, then redirect to login
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Đã xảy ra lỗi.");
      setIsSubmitting(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCountdown > 0 || isSubmitting) return;
    setError("");
    setSuccess("");
    setIsSubmitting(true);
    
    try {
      const result = await customerAuthApi.requestPasswordReset(email);
      setChallengeId(result.challenge_id);
      setResendCountdown(result.resend_after);
      setSuccess("Đã gửi lại mã OTP.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Đã xảy ra lỗi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-[calc(100vh-80px)] flex bg-white">
      {/* Left Panel - Branding/Marketing (Hidden on mobile) */}
      <div className="hidden lg:flex w-1/2 bg-[#0f2c59] p-12 flex-col justify-between relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-blue-500/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-96 h-96 bg-blue-400/20 rounded-full blur-3xl"></div>
        
        <div className="relative z-10">
          <Link href="/" className="text-3xl font-bold text-white tracking-tight flex items-center gap-2">
            Lumina Marketplace
          </Link>
          <div className="mt-20 text-white max-w-lg">
            <h2 className="text-4xl font-bold leading-tight mb-6">
              Lấy lại quyền truy cập an toàn.
            </h2>
            <p className="text-lg text-blue-100/80 mb-10">
              Chỉ với vài bước đơn giản, bạn sẽ lấy lại được mật khẩu và tiếp tục săn sale không giới hạn.
            </p>
            
            <div className="space-y-5">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5 text-white" />
                </div>
                <span className="text-blue-50 text-lg">Xác thực qua OTP bảo mật cao</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                  <Check className="w-5 h-5 text-white" />
                </div>
                <span className="text-blue-50 text-lg">Nhanh chóng và hoàn toàn miễn phí</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="relative z-10 text-blue-200/60 text-sm">
          &copy; {new Date().getFullYear()} Lumina Marketplace. All rights reserved.
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative">
        <div className="absolute top-8 left-8">
          <Link href="/login" className="flex items-center text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">
            <ArrowLeft className="w-4 h-4 mr-2" /> Quay lại
          </Link>
        </div>

        <div className="w-full max-w-md animate-fadeIn mt-10 lg:mt-0">
          <div className="mb-10">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Quên mật khẩu</h1>
            <p className="text-gray-500">
              {step === 1 && "Nhập email của bạn để nhận mã khôi phục."}
              {step === 2 && "Nhập mã OTP gồm 6 chữ số đã được gửi đến email."}
              {step === 3 && "Thiết lập mật khẩu mới cho tài khoản của bạn."}
            </p>
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

          {step === 1 && (
            <form onSubmit={handleRequestOtp} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Nhập email tài khoản"
                  required
                  autoFocus
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3.5 px-4 focus:outline-none focus:bg-white focus:border-[#0f2c59] focus:ring-1 focus:ring-[#0f2c59] text-gray-900 transition-colors"
                />
              </div>
              <button
                type="submit"
                disabled={isSubmitting || !email}
                className="w-full bg-[#0f2c59] text-white font-bold py-4 rounded-xl hover:bg-[#0f2c59]/90 transition-colors shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 mt-2"
              >
                {isSubmitting ? "Đang xử lý..." : "Gửi mã OTP"}
              </button>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleVerifyOtp} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Mã OTP (6 số)</label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="••••••"
                  required
                  autoFocus
                  maxLength={6}
                  className="w-full text-center text-2xl tracking-widest bg-gray-50 border border-gray-200 rounded-xl py-3.5 px-4 focus:outline-none focus:bg-white focus:border-[#0f2c59] focus:ring-1 focus:ring-[#0f2c59] text-gray-900 transition-colors"
                />
              </div>
              <button
                type="submit"
                disabled={isSubmitting || otp.length < 6}
                className="w-full bg-[#0f2c59] text-white font-bold py-4 rounded-xl hover:bg-[#0f2c59]/90 transition-colors shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 mt-2"
              >
                {isSubmitting ? "Đang xác minh..." : "Xác nhận OTP"}
              </button>

              <div className="text-center mt-4 text-sm text-gray-600">
                Chưa nhận được mã?{" "}
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={resendCountdown > 0 || isSubmitting}
                  className="font-medium text-[#0f2c59] hover:underline disabled:text-gray-400 disabled:no-underline disabled:cursor-not-allowed"
                >
                  Gửi lại mã {resendCountdown > 0 && `(${resendCountdown}s)`}
                </button>
              </div>
            </form>
          )}

          {step === 3 && (
            <form onSubmit={handleResetPassword} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Mật khẩu mới</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Ít nhất 6 ký tự"
                    required
                    minLength={6}
                    autoFocus
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3.5 px-4 focus:outline-none focus:bg-white focus:border-[#0f2c59] focus:ring-1 focus:ring-[#0f2c59] text-gray-900 transition-colors pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer p-1"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Xác nhận mật khẩu</label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
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

              <button
                type="submit"
                disabled={isSubmitting || !newPassword || !confirmPassword}
                className="w-full bg-[#0f2c59] text-white font-bold py-4 rounded-xl hover:bg-[#0f2c59]/90 transition-colors shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 mt-2"
              >
                {isSubmitting ? "Đang cập nhật..." : "Đổi mật khẩu"}
              </button>
            </form>
          )}

        </div>
      </div>
    </main>
  );
}
