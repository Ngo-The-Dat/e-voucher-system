"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import Icon from "@/components/shared/ui/Icon";
import RegisterStep1Form from "@/components/partner/auth/RegisterStep1Form";
import RegisterStep2Otp from "@/components/partner/auth/RegisterStep2Otp";
import RegisterStep3Password from "@/components/partner/auth/RegisterStep3Password";
import { useOtpTimer } from "@/hooks/useOtpTimer";
import { partnerApi } from "@/lib/partner-api";

type FormData = {
  fullName: string;
  cccd: string;
  phone: string;
  email: string;
  businessName: string;
};

type FieldErrors = Partial<Record<keyof FormData | "global", string>>;

const STEPS = [
  { step: 1, label: "Thông tin" },
  { step: 2, label: "Xác thực" },
  { step: 3, label: "Mật khẩu" },
  { step: 4, label: "Hoàn tất" },
];

export default function RegisterPage() {
  const [currentStep, setCurrentStep] = useState(1);

  // Form State
  const [formData, setFormData] = useState<FormData>({
    fullName: "Nguyễn Văn A",
    cccd: "012345678901",
    phone: "0912345678",
    email: "doitac@lumina.vn",
    businessName: "Cửa hàng Lumina Store",
  });
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});



  // OTP State
  const [otpDeliveryMethod, setOtpDeliveryMethod] = useState<"email" | "phone" | null>(null);
  const [otpCode, setOtpCode] = useState(["", "", "", "", "", ""]);
  const [otpError, setOtpError] = useState("");
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const otpTimer = useOtpTimer(60);

  // Password State
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");

  // Auto focus new-password-input khi vào Step 3
  useEffect(() => {
    if (currentStep === 3) {
      const t = setTimeout(() => {
        document.getElementById("new-password-input")?.focus();
      }, 100);
      return () => clearTimeout(t);
    }
  }, [currentStep]);

  // --- Step 1 ---
  const handleStep1Submit = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: FieldErrors = {};
    if (!formData.fullName.trim()) errors.fullName = "Vui lòng nhập Họ và Tên";
    if (!formData.cccd.trim()) errors.cccd = "Vui lòng nhập số CCCD / CMND";
    if (!formData.phone.trim()) errors.phone = "Vui lòng nhập Số điện thoại";
    if (!formData.email.trim()) errors.email = "Vui lòng nhập Email liên hệ";
    if (!formData.businessName.trim()) errors.businessName = "Vui lòng nhập Tên thương hiệu / Cửa hàng";
    if (Object.keys(errors).length > 0) { setFieldErrors(errors); return; }

    const isCccdDuplicate = formData.cccd === "012345678901";
    if (isCccdDuplicate) {
      setFieldErrors({
        global: "Thông tin định danh đã tồn tại",
        cccd: "Số CCCD/CMND đã được đăng ký trên hệ thống",
      });
      return;
    }
    setFieldErrors({});
    setCurrentStep(2);
  };

  // --- Step 2: OTP ---
  const triggerAutoVerify = (codeArray: string[]) => {
    const fullCode = codeArray.join("");
    if (fullCode.length < 6) return;
    setIsVerifyingOtp(true);
    setOtpError("");
    setTimeout(() => {
      setIsVerifyingOtp(false);
      if (fullCode !== "123456") {
        setOtpError("Mã OTP không hợp lệ");
        setOtpCode(["", "", "", "", "", ""]);
        setTimeout(() => {
          const el = document.getElementById("otp-input-0") as HTMLInputElement | null;
          el?.focus(); el?.select();
        }, 50);
        return;
      }
      setOtpError("");
      setCurrentStep(3);
    }, 450);
  };

  const handleOtpChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    const newOtp = [...otpCode];
    newOtp[index] = digit;
    setOtpCode(newOtp);
    if (digit && index < 5) {
      (document.getElementById(`otp-input-${index + 1}`) as HTMLInputElement | null)?.focus();
    }
    if (newOtp.every((d) => d !== "")) triggerAutoVerify(newOtp);
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otpCode[index] && index > 0) {
      (document.getElementById(`otp-input-${index - 1}`) as HTMLInputElement | null)?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const digits = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6).split("");
    if (digits.length === 0) return;
    const newOtp = ["", "", "", "", "", ""];
    digits.forEach((d, i) => { newOtp[i] = d; });
    setOtpCode(newOtp);
    const focusIdx = Math.min(digits.length, 5);
    (document.getElementById(`otp-input-${focusIdx}`) as HTMLInputElement | null)?.focus();
    if (digits.length === 6) triggerAutoVerify(newOtp);
  };

  const handleSelectDeliveryMethod = (method: "email" | "phone") => {
    setOtpDeliveryMethod(method);
    setOtpError("");
    setOtpCode(["", "", "", "", "", ""]);
    otpTimer.start();
    setTimeout(() => {
      (document.getElementById("otp-input-0") as HTMLInputElement | null)?.focus();
    }, 50);
  };

  const handleResendOtp = () => {
    setOtpCode(["", "", "", "", "", ""]);
    setOtpError("");
    otpTimer.start();
    setTimeout(() => {
      (document.getElementById("otp-input-0") as HTMLInputElement | null)?.focus();
    }, 50);
  };

  // --- Step 3: Password ---
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || password.length < 6) {
      setPasswordError("Mật khẩu phải có ít nhất 6 ký tự");
      return;
    }
    if (password !== confirmPassword) {
      setPasswordError("Mật khẩu không khớp");
      return;
    }
    setPasswordError("");
    try {
      await partnerApi.register({
        full_name: formData.fullName, identity_no: formData.cccd,
        phone: formData.phone, email: formData.email,
        business_name: formData.businessName,
        tax_code: formData.cccd,
        password,
      });
      setCurrentStep(4);
    } catch (error) {
      setPasswordError(error instanceof Error ? error.message : "Đăng ký thất bại");
    }
  };

  const progressWidth = currentStep === 1 ? "0%" : currentStep === 2 ? "33%" : currentStep === 3 ? "66%" : "100%";

  return (
    <main className="w-full max-w-2xl bg-surface-bright rounded-2xl border border-outline-variant shadow-xl flex flex-col overflow-hidden my-auto">
      {/* Header */}
      <header className="p-6 border-b border-outline-variant/50 flex flex-col items-center justify-center bg-surface-container-low">
        <div className="flex items-center gap-2.5 mb-1">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-on-primary font-bold text-lg shadow">L</div>
          <h1 className="text-xl font-bold text-primary">Lumina Partner</h1>
        </div>
        <h2 className="text-base font-bold text-on-surface">Đăng ký tài khoản đối tác</h2>
      </header>

      {/* Stepper */}
      <div className="px-8 py-5 bg-surface border-b border-outline-variant/40">
        <div className="flex items-center justify-between relative">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-surface-variant z-0 rounded-full" />
          <div className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-primary z-0 rounded-full transition-all duration-300" style={{ width: progressWidth }} />
          {STEPS.map(({ step, label }) => {
            const isDone = step < currentStep;
            const isCurrent = step === currentStep;
            return (
              <div key={step} className="relative z-10 flex flex-col items-center bg-surface px-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all shadow-sm ${isDone ? "bg-secondary text-on-secondary" : isCurrent ? "bg-primary text-on-primary ring-2 ring-primary ring-offset-2" : "bg-surface-variant text-on-surface-variant"}`}>
                  {isDone ? <Icon name="check" className="text-sm" /> : step}
                </div>
                <span className={`mt-1.5 text-[11px] font-semibold ${isCurrent || isDone ? "text-primary" : "text-on-surface-variant"}`}>{label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Step Content */}
      <div className="p-8">
        {currentStep === 1 && (
          <RegisterStep1Form
            formData={formData}
            fieldErrors={fieldErrors}
            onChange={(field, value) => setFormData((p) => ({ ...p, [field]: value }))}
            onSubmit={handleStep1Submit}
          />
        )}

        {currentStep === 2 && (
          <RegisterStep2Otp
            email={formData.email}
            phone={formData.phone}
            otpDeliveryMethod={otpDeliveryMethod}
            otpCode={otpCode}
            otpError={otpError}
            isVerifyingOtp={isVerifyingOtp}
            resendSeconds={otpTimer.seconds}
            isResendExpired={otpTimer.isExpired}
            onSelectDeliveryMethod={handleSelectDeliveryMethod}
            onOtpChange={handleOtpChange}
            onOtpKeyDown={handleOtpKeyDown}
            onOtpPaste={handleOtpPaste}
            onChangeDeliveryMethod={() => setOtpDeliveryMethod(null)}
            onResend={handleResendOtp}
            onBack={() => setCurrentStep(1)}
          />
        )}

        {currentStep === 3 && (
          <RegisterStep3Password
            password={password}
            confirmPassword={confirmPassword}
            passwordError={passwordError}
            onPasswordChange={setPassword}
            onConfirmPasswordChange={setConfirmPassword}
            onSubmit={handlePasswordSubmit}
            onBack={() => setCurrentStep(2)}
          />
        )}

        {currentStep === 4 && (
          <div className="flex flex-col items-center justify-center text-center py-6">
            <div className="w-16 h-16 bg-secondary-container text-on-secondary-container rounded-full flex items-center justify-center mb-4 shadow-md">
              <Icon name="check_circle" className="text-4xl text-secondary" />
            </div>
            <h3 className="text-xl font-bold text-on-surface mb-2">Đăng ký tài khoản đối tác thành công!</h3>
            <p className="text-xs text-on-surface-variant mb-6 max-w-md leading-relaxed">
              Tài khoản đối tác cho <span className="font-bold text-on-surface">{formData.fullName}</span> ({formData.email}) đã được hệ thống lưu trữ thành công.
            </p>
            <div className="bg-surface-container-low p-4 rounded-xl border border-outline-variant/50 w-full max-w-xs space-y-2 text-left mb-6">
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-on-surface-variant">Mã đối tác:</span>
                <span className="font-bold text-primary tracking-wider">LUM-8A92K4</span>
              </div>
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-on-surface-variant">Số CCCD:</span>
                <span className="text-on-surface tracking-wide font-medium">{formData.cccd}</span>
              </div>
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-on-surface-variant">SĐT liên hệ:</span>
                <span className="text-on-surface tracking-wide font-medium">{formData.phone}</span>
              </div>
            </div>
            <Link href="/partner" className="px-8 py-2.5 rounded-lg text-xs font-bold bg-primary text-on-primary hover:bg-surface-tint shadow-md transition-all text-center">
              Về trang chủ Dashboard
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
