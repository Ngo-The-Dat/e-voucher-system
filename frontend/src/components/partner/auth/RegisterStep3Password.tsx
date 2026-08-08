import { useRef } from "react";
import Icon from "@/components/shared/ui/Icon";
import { Input } from "@/components/shared/ui/Input";
import { Button } from "@/components/shared/ui/Button";

interface RegisterStep3PasswordProps {
  password: string;
  confirmPassword: string;
  passwordError: string;
  onPasswordChange: (v: string) => void;
  onConfirmPasswordChange: (v: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onBack: () => void;
}

export default function RegisterStep3Password({
  password,
  confirmPassword,
  passwordError,
  onPasswordChange,
  onConfirmPasswordChange,
  onSubmit,
  onBack,
}: RegisterStep3PasswordProps) {
  const passwordRef = useRef<HTMLInputElement>(null);
  const confirmRef = useRef<HTMLInputElement>(null);

  return (
    <form onSubmit={onSubmit} className="space-y-4 text-xs">
      <div>
        <h3 className="text-base font-bold text-on-surface">Tạo mật khẩu tài khoản</h3>
        <p className="text-on-surface-variant mt-0.5">
          Mật khẩu sẽ được sử dụng để đăng nhập vào Hệ thống Quản lý Đối tác Lumina.
        </p>
      </div>

      {passwordError && (
        <div className="p-3 rounded-lg bg-error-container/40 border border-error/50 text-error flex items-center gap-2">
          <Icon name="error" className="text-base" />
          <span className="font-bold text-xs">{passwordError}</span>
        </div>
      )}

      <div>
        <label className="block font-semibold text-on-surface-variant mb-1">
          Mật khẩu mới <span className="text-error">*</span>
        </label>
        <Input
          ref={passwordRef}
          id="new-password-input"
          type="password"
          value={password}
          onChange={(e) => onPasswordChange(e.target.value)}
          placeholder="Nhập ít nhất 6 ký tự"
          className={
            passwordError && (password.length < 6 || !password)
              ? "border-error ring-1 ring-error bg-error-container/10"
              : ""
          }
        />
      </div>

      <div>
        <label className="block font-semibold text-on-surface-variant mb-1">
          Xác nhận lại mật khẩu <span className="text-error">*</span>
        </label>
        <Input
          ref={confirmRef}
          id="confirm-password-input"
          type="password"
          value={confirmPassword}
          onChange={(e) => onConfirmPasswordChange(e.target.value)}
          placeholder="Nhập lại mật khẩu"
          className={
            passwordError === "Mật khẩu không khớp"
              ? "border-error ring-1 ring-error bg-error-container/10"
              : ""
          }
        />
      </div>

      <div className="pt-4 border-t border-outline-variant/30 flex justify-between items-center">
        <Button variant="ghost" type="button" onClick={onBack}>
          Quay lại
        </Button>
        <Button type="submit">
          Xác nhận
        </Button>
      </div>
    </form>
  );
}
