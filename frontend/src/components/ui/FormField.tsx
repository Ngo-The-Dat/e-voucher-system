import Icon from "@/components/ui/Icon";

interface FormFieldProps {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
  /** Chiếm full width trong grid (sm:col-span-2) */
  fullWidth?: boolean;
}

/**
 * Wrapper tái sử dụng cho một field trong form:
 *  - Label + dấu * bắt buộc
 *  - Input/Select/nội dung do children cung cấp
 *  - Hiển thị error message có icon
 */
export default function FormField({
  label,
  required,
  error,
  children,
  fullWidth,
}: FormFieldProps) {
  return (
    <div className={fullWidth ? "sm:col-span-2" : undefined}>
      <label className="block font-semibold text-on-surface mb-1.5">
        {label}
        {required && <span className="text-error ml-1">*</span>}
      </label>
      {children}
      {error && (
        <p className="text-sm text-error font-medium mt-1 flex items-center gap-1">
          <Icon name="error" className="text-sm" />
          {error}
        </p>
      )}
    </div>
  );
}

/** Helper: trả về className cho input/select tùy theo có lỗi hay không */
export function getInputClass(hasError: boolean): string {
  return `w-full border rounded-lg px-4 py-3 text-base text-on-surface outline-none transition-colors ${
    hasError
      ? "border-error focus:ring-2 focus:ring-error/30 bg-error-container/10"
      : "border-outline-variant focus:ring-2 focus:ring-primary bg-surface"
  }`;
}
