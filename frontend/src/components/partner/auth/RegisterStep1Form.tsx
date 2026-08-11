import Icon from "@/components/shared/ui/Icon";
import { Input } from "@/components/shared/ui/Input";
import { Button } from "@/components/shared/ui/Button";

type FormData = {
  fullName: string;
  cccd: string;
  phone: string;
  email: string;
  businessName: string;
  taxCode: string;
};

type FieldErrors = Partial<Record<keyof FormData | "global", string>>;

interface RegisterStep1FormProps {
  formData: FormData;
  fieldErrors: FieldErrors;
  onChange: (field: keyof FormData, value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export default function RegisterStep1Form({
  formData,
  fieldErrors,
  onChange,
  onSubmit,
}: RegisterStep1FormProps) {
  const inputClass = (field: keyof FormData) =>
    fieldErrors[field]
      ? "border-error ring-1 ring-error bg-error-container/10"
      : "";

  return (
    <form onSubmit={onSubmit} className="space-y-4 text-xs">
      <div>
        <h3 className="text-base font-bold text-on-surface">Thông tin đối tác</h3>
        <p className="text-on-surface-variant mt-0.5">
          Vui lòng cung cấp các thông tin định danh chính xác để tiến hành tạo tài khoản.
        </p>
      </div>

      {fieldErrors.global && (
        <div className="p-4 rounded-xl bg-error-container/40 border border-error/50 text-error flex items-start gap-3">
          <Icon name="error" className="text-xl shrink-0" />
          <div>
            <h4 className="font-bold text-sm">{fieldErrors.global}</h4>
            <p className="mt-0.5 text-xs text-on-surface">
              Vui lòng kiểm tra lại thông tin bị trùng màu đỏ bên dưới và chỉnh sửa để tiếp tục.
            </p>
          </div>
        </div>
      )}

      {(
        [
          { key: "fullName", label: "Họ và Tên đối tác", type: "text", placeholder: "Nhập họ và tên đầy đủ", required: true },
          { key: "cccd", label: "Số CCCD / CMND", type: "text", placeholder: "Nhập 12 số CCCD", required: true },
          { key: "phone", label: "Số điện thoại", type: "tel", placeholder: "09xx xxx xxx", required: true },
          { key: "email", label: "Email liên hệ", type: "email", placeholder: "doitac@domain.com", required: true },
          { key: "businessName", label: "Tên thương hiệu / Cửa hàng", type: "text", placeholder: "Nhập tên doanh nghiệp hoặc cửa hàng", required: false },
          { key: "taxCode", label: "Mã số thuế", type: "text", placeholder: "Nhập mã số thuế doanh nghiệp", required: true },
        ] as const
      ).map(({ key, label, type, placeholder, required }) => (
        <div key={key}>
          <label className="block font-semibold text-on-surface-variant mb-1">
            {label} {required && <span className="text-error">*</span>}
          </label>
          <Input
            type={type}
            value={formData[key]}
            onChange={(e) => onChange(key, e.target.value)}
            placeholder={placeholder}
            className={inputClass(key)}
          />
          {fieldErrors[key] && (
            <p className="mt-1 text-[11px] text-error font-bold flex items-center gap-1">
              <Icon name="error" className="text-sm" />
              {fieldErrors[key]}
            </p>
          )}
        </div>
      ))}

      <div className="pt-4 flex justify-end">
        <Button type="submit" className="gap-2 !text-white">
          <span>Xác nhận đăng ký</span>
          <Icon name="arrow_forward" className="text-base" />
        </Button>
      </div>
    </form>
  );
}
