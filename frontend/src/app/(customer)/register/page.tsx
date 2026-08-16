"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { customerAuthApi } from "@/lib/customer-api";
import { User, Mail, Phone, Lock, Eye, EyeOff, ArrowRight, UserPlus } from "lucide-react";

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
    <main className="min-h-[80vh] flex items-center justify-center py-12 px-margin-mobile md:px-margin-desktop bg-surface-container-lowest">
      <div className="w-full max-w-md animate-fadeIn">
        {/* Card Container */}
        <div className="bg-surface border border-outline-variant rounded-2xl p-6 sm:p-8 shadow-sm">
          <div className="text-center mb-8">
            <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center mx-auto mb-4">
              <UserPlus className="w-7 h-7" />
            </div>
            <h1 className="font-headline-md text-headline-md font-bold text-text-main">
              Tạo tài khoản mới
            </h1>
            <p className="font-body-md text-body-md text-text-muted mt-2">
              Đăng ký để khám phá và săn hàng ngàn voucher hấp dẫn
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-error/10 border border-error/20 text-error text-body-sm font-medium flex items-center gap-2">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block font-label-md text-label-md font-semibold text-on-surface mb-1.5">
                Họ và tên
              </label>
              <div className="relative">
                <User className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant" />
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Nguyễn Văn A"
                  required
                  autoFocus
                  className="w-full bg-surface-lowest border border-outline-variant rounded-xl py-2.5 pl-11 pr-4 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary font-body-md text-body-md text-on-surface"
                />
              </div>
            </div>

            <div>
              <label className="block font-label-md text-label-md font-semibold text-on-surface mb-1.5">
                Địa chỉ Email
              </label>
              <div className="relative">
                <Mail className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nhapemail@example.com"
                  required
                  className="w-full bg-surface-lowest border border-outline-variant rounded-xl py-2.5 pl-11 pr-4 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary font-body-md text-body-md text-on-surface"
                />
              </div>
            </div>

            <div>
              <label className="block font-label-md text-label-md font-semibold text-on-surface mb-1.5">
                Số điện thoại (tùy chọn)
              </label>
              <div className="relative">
                <Phone className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0912345678"
                  className="w-full bg-surface-lowest border border-outline-variant rounded-xl py-2.5 pl-11 pr-4 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary font-body-md text-body-md text-on-surface"
                />
              </div>
            </div>

            <div>
              <label className="block font-label-md text-label-md font-semibold text-on-surface mb-1.5">
                Mật khẩu
              </label>
              <div className="relative">
                <Lock className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Ít nhất 6 ký tự"
                  required
                  minLength={6}
                  className="w-full bg-surface-lowest border border-outline-variant rounded-xl py-2.5 pl-11 pr-11 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary font-body-md text-body-md text-on-surface"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block font-label-md text-label-md font-semibold text-on-surface mb-1.5">
                Xác nhận mật khẩu
              </label>
              <div className="relative">
                <Lock className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Nhập lại mật khẩu"
                  required
                  className="w-full bg-surface-lowest border border-outline-variant rounded-xl py-2.5 pl-11 pr-4 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary font-body-md text-body-md text-on-surface"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-primary text-on-primary font-label-lg text-label-lg font-bold py-3.5 rounded-xl hover:opacity-95 transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 mt-4"
            >
              {isSubmitting ? (
                "Đang đăng ký..."
              ) : (
                <>
                  <span>Đăng ký ngay</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-outline-variant text-center">
            <p className="font-body-md text-body-md text-text-muted">
              Đã có tài khoản?{" "}
              <Link
                href="/login"
                className="font-semibold text-primary hover:underline transition-colors ml-1"
              >
                Đăng nhập
              </Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
