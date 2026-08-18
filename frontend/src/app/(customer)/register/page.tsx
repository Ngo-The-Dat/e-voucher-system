"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { customerAuthApi } from "@/lib/customer-api";
import { Eye, EyeOff, CircleAlert, Gift, Shield } from "lucide-react";

export default function CustomerRegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp.");
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await customerAuthApi.register({
        full_name: fullName,
        email,
        phone,
        password,
      });

      localStorage.setItem("customer_access_token", result.token);
      localStorage.setItem("customer_user", JSON.stringify(result.user));

      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("customer-auth-changed"));
      }

      router.push("/");
      router.refresh();
    } catch (regError) {
      setError(regError instanceof Error ? regError.message : "Đăng ký thất bại.");
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
              Bắt đầu hành trình mua sắm thông minh.
            </h2>
            <p className="text-lg text-blue-100/80 mb-10">
              Gia nhập cộng đồng hơn 1 triệu người dùng và nhận ngay vô vàn voucher chào mừng thành viên mới.
            </p>
            
            <div className="space-y-5">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                  <Gift className="w-5 h-5 text-white" />
                </div>
                <span className="text-blue-50 text-lg">Voucher 50% cho đơn hàng đầu tiên</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <span className="text-blue-50 text-lg">Bảo mật thông tin tuyệt đối</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="relative z-10 text-blue-200/60 text-sm">
          &copy; {new Date().getFullYear()} Lumina Marketplace. All rights reserved.
        </div>
      </div>

      {/* Right Panel - Register Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md animate-fadeIn">
          {/* Mobile Brand (visible only on mobile) */}
          <div className="lg:hidden text-center mb-8">
            <Link href="/" className="text-3xl font-bold text-[#0f2c59] tracking-tight inline-block">
              Lumina
            </Link>
          </div>

          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Tạo tài khoản</h1>
            <p className="text-gray-500">Điền thông tin của bạn để bắt đầu.</p>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm font-medium flex items-start gap-3">
              <CircleAlert className="w-5 h-5 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Họ và tên</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Nguyễn Văn A"
                required
                autoFocus
                className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 focus:outline-none focus:bg-white focus:border-[#0f2c59] focus:ring-1 focus:ring-[#0f2c59] text-gray-900 transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nhapemail@example.com"
                required
                className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 focus:outline-none focus:bg-white focus:border-[#0f2c59] focus:ring-1 focus:ring-[#0f2c59] text-gray-900 transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Số điện thoại (tùy chọn)</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0912345678"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 focus:outline-none focus:bg-white focus:border-[#0f2c59] focus:ring-1 focus:ring-[#0f2c59] text-gray-900 transition-colors"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Mật khẩu</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Ít nhất 6 ký tự"
                    required
                    minLength={6}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 focus:outline-none focus:bg-white focus:border-[#0f2c59] focus:ring-1 focus:ring-[#0f2c59] text-gray-900 transition-colors pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer p-1"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Xác nhận MK</label>
                <input
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Nhập lại"
                  required
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 focus:outline-none focus:bg-white focus:border-[#0f2c59] focus:ring-1 focus:ring-[#0f2c59] text-gray-900 transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-[#0f2c59] text-white font-bold py-4 rounded-xl hover:bg-[#0f2c59]/90 transition-colors shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 mt-6"
            >
              {isSubmitting ? "Đang xử lý..." : "Đăng ký tài khoản"}
            </button>
          </form>

          <div className="mt-8 pt-6 text-center border-t border-gray-100 space-y-2">
            <p className="text-gray-600 text-sm">
              Đã có tài khoản?{" "}
              <Link href="/login" className="font-semibold text-[#0f2c59] hover:underline ml-1">
                Đăng nhập ngay
              </Link>
            </p>
            <p className="text-gray-500 text-xs">
              Bạn là chủ doanh nghiệp / thương hiệu?{" "}
              <Link href="/partner/register" className="font-semibold text-[#0f2c59] hover:underline ml-1">
                Đăng ký đối tác
              </Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
