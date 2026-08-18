"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { customerAuthApi } from "@/lib/customer-api";
import { Eye, EyeOff, Check, CircleAlert } from "lucide-react";

export default function CustomerLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const result = await customerAuthApi.login({ email, password });
      
      // Check role and handle logic accordingly
      if (result.user.role === 'ADMIN') {
        localStorage.setItem("admin_access_token", result.token);
        localStorage.setItem("admin_user", JSON.stringify(result.user));
        window.location.href = "/admin";
      } else if (result.user.role === 'PARTNER') {
        localStorage.setItem("partner_access_token", result.token);
        localStorage.setItem("partner_user", JSON.stringify(result.user));
        window.location.href = "/partner";
      } else if (result.user.role === 'PARTNER_EMPLOYEE') {
        localStorage.setItem("partner_access_token", result.token);
        localStorage.setItem("partner_user", JSON.stringify(result.user));
        window.location.href = "/partner/employee";
      } else {
        // Customer or default
        localStorage.setItem("customer_access_token", result.token);
        localStorage.setItem("customer_user", JSON.stringify(result.user));
        
        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event("customer-auth-changed"));
        }
        
        router.push("/");
        router.refresh();
      }
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : "Đăng nhập thất bại.");
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
              Khám phá hàng ngàn ưu đãi mỗi ngày.
            </h2>
            <p className="text-lg text-blue-100/80 mb-10">
              Đăng nhập ngay để không bỏ lỡ các voucher giới hạn từ những thương hiệu hàng đầu.
            </p>
            
            <div className="space-y-5">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                  <Check className="w-5 h-5 text-white" />
                </div>
                <span className="text-blue-50 text-lg">Mua sắm tiết kiệm hơn mỗi ngày</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                  <Check className="w-5 h-5 text-white" />
                </div>
                <span className="text-blue-50 text-lg">Thanh toán an toàn, tiện lợi</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                  <Check className="w-5 h-5 text-white" />
                </div>
                <span className="text-blue-50 text-lg">Tích điểm đổi quà cực dễ dàng</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="relative z-10 text-blue-200/60 text-sm">
          &copy; {new Date().getFullYear()} Lumina Marketplace. All rights reserved.
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md animate-fadeIn">
          {/* Mobile Brand (visible only on mobile) */}
          <div className="lg:hidden text-center mb-10">
            <Link href="/" className="text-3xl font-bold text-[#0f2c59] tracking-tight inline-block">
              Lumina
            </Link>
          </div>

          <div className="mb-10">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Đăng nhập</h1>
            <p className="text-gray-500">Chào mừng bạn quay trở lại với hệ thống.</p>
          </div>

          {error && (
            <div className="mb-8 p-4 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm font-medium flex items-start gap-3">
              <CircleAlert className="w-5 h-5 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Nhập email của bạn"
                  required
                  autoFocus
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3.5 px-4 focus:outline-none focus:bg-white focus:border-[#0f2c59] focus:ring-1 focus:ring-[#0f2c59] text-gray-900 transition-colors"
                />
              </div>
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-semibold text-gray-700">Mật khẩu</label>
                <Link href="/forgot-password" className="text-sm font-medium text-[#0f2c59] hover:underline">
                  Quên mật khẩu?
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
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

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-[#0f2c59] text-white font-bold py-4 rounded-xl hover:bg-[#0f2c59]/90 transition-colors shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 mt-2"
            >
              {isSubmitting ? "Đang xử lý..." : "Đăng nhập ngay"}
            </button>
          </form>

          <div className="mt-10 pt-8 text-center border-t border-gray-100">
            <p className="text-gray-600">
              Bạn chưa có tài khoản?{" "}
              <Link href="/register" className="font-semibold text-[#0f2c59] hover:underline ml-1">
                Đăng ký ngay
              </Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
