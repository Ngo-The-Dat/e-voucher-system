import Icon from "@/components/shared/ui/Icon";

interface RegisterStep2OtpProps {
  email: string;
  phone: string;
  otpDeliveryMethod: "email" | "phone" | null;
  otpCode: string[];
  otpError: string;
  isVerifyingOtp: boolean;
  isSendingOtp: boolean;
  resendSeconds: number;
  isResendExpired: boolean;
  onSelectDeliveryMethod: (method: "email" | "phone") => void;
  onOtpChange: (index: number, value: string) => void;
  onOtpKeyDown: (index: number, e: React.KeyboardEvent<HTMLInputElement>) => void;
  onOtpPaste: (e: React.ClipboardEvent<HTMLInputElement>) => void;
  onChangeDeliveryMethod: () => void;
  onResend: () => void;
  onBack: () => void;
}

export default function RegisterStep2Otp({
  email,
  phone,
  otpDeliveryMethod,
  otpCode,
  otpError,
  isVerifyingOtp,
  isSendingOtp,
  resendSeconds,
  isResendExpired,
  onSelectDeliveryMethod,
  onOtpChange,
  onOtpKeyDown,
  onOtpPaste,
  onChangeDeliveryMethod,
  onResend,
  onBack,
}: RegisterStep2OtpProps) {
  return (
    <div className="space-y-6 text-xs">
      <div>
        <h3 className="text-base font-bold text-on-surface">Xác thực tài khoản</h3>
        <p className="text-on-surface-variant mt-0.5">
          Vui lòng chọn phương thức nhận mã xác thực (OTP) để tiếp tục quá trình đăng ký.
        </p>
      </div>

      {/* Chọn phương thức */}
      {!otpDeliveryMethod ? (
        <div className="space-y-3">
          <p className="font-semibold text-on-surface">Chọn phương thức nhận mã OTP:</p>

          {[
            { method: "email" as const, icon: "mail", label: "Nhận mã qua Email", value: email, iconBg: "bg-primary-fixed text-primary" },
            { method: "phone" as const, icon: "sms", label: "Nhận mã qua Số điện thoại (SMS)", value: phone, iconBg: "bg-secondary-fixed text-secondary" },
          ].map(({ method, icon, label, value, iconBg }) => (
            <button
              key={method}
              type="button"
              onClick={() => onSelectDeliveryMethod(method)}
              disabled={isSendingOtp}
              className="w-full p-4 rounded-xl border border-outline-variant hover:border-primary hover:bg-surface-container-low transition-all text-left flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${iconBg}`}>
                  <Icon name={icon} className="text-xl" />
                </div>
                <div>
                  <p className="font-bold text-sm text-on-surface group-hover:text-primary">
                    {method === "email" && isSendingOtp ? "Đang gửi mã qua Email..." : label}
                  </p>
                  <p className="text-on-surface-variant text-[11px] tracking-wide font-medium">{value}</p>
                </div>
              </div>
              <Icon name="chevron_right" className="text-xl text-outline group-hover:text-primary" />
            </button>
          ))}

          <div className="pt-4 border-t border-outline-variant/30 flex justify-start">
            <button
              type="button"
              onClick={onBack}
              className="px-4 py-2 rounded-lg text-xs font-semibold text-on-surface-variant hover:bg-surface-container-high transition-colors"
            >
              Quay lại Bước 1
            </button>
          </div>
        </div>
      ) : (
        /* Nhập OTP */
        <div className="space-y-6 text-center">
          <div className="bg-surface-container-low p-3 rounded-lg border border-outline-variant/40 text-left w-full">
            <p className="text-on-surface-variant text-xs">
              Mã xác thực đã được gửi tới{" "}
              <span className="font-bold text-primary tracking-wide">
                {otpDeliveryMethod === "email" ? email : phone}
              </span>.
            </p>
            <button
              type="button"
              onClick={onChangeDeliveryMethod}
              className="text-primary text-[11px] font-semibold underline mt-1"
            >
              Đổi phương thức nhận mã
            </button>
          </div>

          <div className="space-y-3">
            <label className="block text-xs font-bold text-on-surface">
              Nhập 6 chữ số mã OTP:
            </label>

            <div className="flex justify-center gap-2">
              {otpCode.map((digit, i) => (
                <input
                  key={i}
                  id={`otp-input-${i}`}
                  type="text"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => onOtpChange(i, e.target.value)}
                  onKeyDown={(e) => onOtpKeyDown(i, e)}
                  onPaste={onOtpPaste}
                  inputMode="numeric"
                  autoComplete={i === 0 ? "one-time-code" : "off"}
                  disabled={isVerifyingOtp || isSendingOtp}
                  className={`w-11 h-13 text-center text-xl font-bold bg-surface border ${
                    otpError
                      ? "border-error ring-1 ring-error bg-error-container/10"
                      : "border-outline-variant"
                  } rounded-xl focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all disabled:opacity-50`}
                />
              ))}
            </div>

            {otpError && (
              <div className="p-3 rounded-lg bg-error-container/30 border border-error/40 text-error flex items-center justify-center gap-2">
                <Icon name="error" className="text-base" />
                <span className="font-bold text-xs">{otpError}</span>
              </div>
            )}

            <p className="text-on-surface-variant text-[11px]">
              Không nhận được mã?{" "}
              {isResendExpired ? (
                <button
                  type="button"
                  onClick={onResend}
                  disabled={isSendingOtp}
                  className="text-primary font-bold hover:underline disabled:opacity-50"
                >
                  {isSendingOtp ? "Đang gửi..." : "Gửi lại mã"}
                </button>
              ) : (
                <span className="text-outline">Gửi lại mã ({resendSeconds}s)</span>
              )}
            </p>
          </div>

          <div className="pt-4 border-t border-outline-variant/30 flex justify-between items-center">
            <button
              type="button"
              onClick={onChangeDeliveryMethod}
              className="px-4 py-2 rounded-lg text-xs font-semibold text-on-surface-variant hover:bg-surface-container-high transition-colors"
            >
              Quay lại
            </button>

            {isVerifyingOtp && (
              <span className="text-xs font-bold text-primary flex items-center gap-2 animate-pulse">
                <span className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                Đang kiểm tra mã xác thực...
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
