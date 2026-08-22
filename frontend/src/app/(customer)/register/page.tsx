"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { customerAuthApi } from "@/lib/customer-api";
import { Eye, EyeOff, CircleAlert, Gift, Shield } from "lucide-react";

export default function CustomerRegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [gender, setGender] = useState<'MALE' | 'FEMALE' | 'OTHER' | undefined>(undefined);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Trạng thái đã chạm vào field (để hiển thị lỗi onBlur)
  const [touched, setTouched] = useState({
    fullName: false,
    emailOrPhone: false,
    password: false,
    confirmPassword: false,
  });

  // Các hàm kiểm tra hợp lệ
  const isValidFullName = fullName.trim().length > 0;
  const isValidEmailOrPhone = () => {
    const val = emailOrPhone.trim();
    if (!val) return false;
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
    const isPhone = /^(0|\+84)[3|5|7|8|9][0-9]{8}$/.test(val.replace(/\s/g, ""));
    return isEmail || isPhone;
  };
  const isValidPassword = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(password);
  const isValidConfirm = confirmPassword === password && password.length > 0;

  const handleBlur = (field: keyof typeof touched) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (!isValidFullName || !isValidEmailOrPhone() || !isValidPassword || !isValidConfirm) {
      setTouched({
        fullName: true,
        emailOrPhone: true,
        password: true,
        confirmPassword: true,
      });
      setError("Vui lòng kiểm tra lại các trường báo đỏ bên dưới.");
      return;
    }

    setIsSubmitting(true);

    const val = emailOrPhone.trim();
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
    const finalEmail = isEmail ? val : undefined;
    const finalPhone = !isEmail ? val : undefined;

    try {
      const result = await customerAuthApi.register({
        full_name: fullName,
        email: finalEmail as string,
        phone: finalPhone,
        password,
        gender,
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
              <label htmlFor="register-fullname" className="block text-sm font-semibold text-gray-700 mb-2">Họ tên</label>
              <input
                id="register-fullname"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                onBlur={() => handleBlur("fullName")}
                placeholder="Nhập họ tên của bạn"
                autoFocus
                autoComplete="name"
                className={`w-full bg-gray-50 border rounded-xl py-3 px-4 focus:outline-none focus:bg-white transition-colors ${
                  touched.fullName && !isValidFullName
                    ? "border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500"
                    : "border-gray-200 focus:border-[#0f2c59] focus:ring-1 focus:ring-[#0f2c59] text-gray-900"
                }`}
              />
              {touched.fullName && !isValidFullName && (
                <p className="text-red-500 text-xs mt-1.5 ml-1">Vui lòng nhập họ tên của bạn.</p>
              )}
            </div>

            <div>
              <label htmlFor="register-email-phone" className="block text-sm font-semibold text-gray-700 mb-2">Email hoặc Số điện thoại</label>
              <input
                id="register-email-phone"
                type="text"
                value={emailOrPhone}
                onChange={(e) => setEmailOrPhone(e.target.value)}
                onBlur={() => handleBlur("emailOrPhone")}
                placeholder="Nhập số điện thoại hoặc email"
                autoComplete="username"
                className={`w-full bg-gray-50 border rounded-xl py-3 px-4 focus:outline-none focus:bg-white transition-colors ${
                  touched.emailOrPhone && !isValidEmailOrPhone()
                    ? "border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500"
                    : "border-gray-200 focus:border-[#0f2c59] focus:ring-1 focus:ring-[#0f2c59] text-gray-900"
                }`}
              />
              {touched.emailOrPhone && !isValidEmailOrPhone() && (
                <p className="text-red-500 text-xs mt-1.5 ml-1">Vui lòng nhập định dạng Email hoặc Số điện thoại hợp lệ.</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label htmlFor="register-password" className="block text-sm font-semibold text-gray-700 mb-2">Mật khẩu mới</label>
                <div className="relative">
                  <input
                    id="register-password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onBlur={() => handleBlur("password")}
                    placeholder="Nhập mật khẩu"
                    autoComplete="new-password"
                    className={`w-full bg-gray-50 border rounded-xl py-3 px-4 pr-10 focus:outline-none focus:bg-white transition-colors ${
                      touched.password && !isValidPassword
                        ? "border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500"
                        : "border-gray-200 focus:border-[#0f2c59] focus:ring-1 focus:ring-[#0f2c59] text-gray-900"
                    }`}
                  />
                  <button
                    type="button"
                    aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                    title={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer p-1"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {touched.password && !isValidPassword && (
                  <p className="text-red-500 text-xs mt-1.5 ml-1">Mật khẩu phải dài tối thiểu 8 ký tự, bao gồm chữ hoa, thường, số và ký tự đặc biệt.</p>
                )}
              </div>

              <div>
                <label htmlFor="register-confirm-password" className="block text-sm font-semibold text-gray-700 mb-2">Xác nhận mật khẩu</label>
                <input
                  id="register-confirm-password"
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  onBlur={() => handleBlur("confirmPassword")}
                  placeholder="Nhập lại mật khẩu"
                  autoComplete="new-password"
                  className={`w-full bg-gray-50 border rounded-xl py-3 px-4 focus:outline-none focus:bg-white transition-colors ${
                    touched.confirmPassword && !isValidConfirm
                      ? "border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500"
                      : "border-gray-200 focus:border-[#0f2c59] focus:ring-1 focus:ring-[#0f2c59] text-gray-900"
                  }`}
                />
                {touched.confirmPassword && !isValidConfirm && (
                  <p className="text-red-500 text-xs mt-1.5 ml-1">Mật khẩu xác nhận không khớp.</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">Giới tính (Không bắt buộc)</label>
              <div className="flex items-center gap-8">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="radio"
                    name="gender"
                    value="MALE"
                    checked={gender === 'MALE'}
                    onChange={() => setGender('MALE')}
                    className="w-4 h-4 text-[#0f2c59] bg-gray-50 border-gray-300 focus:ring-[#0f2c59] cursor-pointer"
                  />
                  <span className="text-sm text-gray-700 group-hover:text-gray-900 transition-colors">Nam</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="radio"
                    name="gender"
                    value="FEMALE"
                    checked={gender === 'FEMALE'}
                    onChange={() => setGender('FEMALE')}
                    className="w-4 h-4 text-[#0f2c59] bg-gray-50 border-gray-300 focus:ring-[#0f2c59] cursor-pointer"
                  />
                  <span className="text-sm text-gray-700 group-hover:text-gray-900 transition-colors">Nữ</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="radio"
                    name="gender"
                    value="OTHER"
                    checked={gender === 'OTHER'}
                    onChange={() => setGender('OTHER')}
                    className="w-4 h-4 text-[#0f2c59] bg-gray-50 border-gray-300 focus:ring-[#0f2c59] cursor-pointer"
                  />
                  <span className="text-sm text-gray-700 group-hover:text-gray-900 transition-colors">Khác</span>
                </label>
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
