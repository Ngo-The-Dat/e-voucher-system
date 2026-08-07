import Icon from "@/components/ui/Icon";

interface ValidationErrorBannerProps {
  errorCount: number;
  /** Tên nút submit để hiển thị trong hướng dẫn */
  submitLabel?: string;
}

/**
 * Banner cảnh báo validation lỗi đặt trên đầu form.
 * Chỉ hiển thị khi errorCount > 0.
 */
export default function ValidationErrorBanner({
  errorCount,
  submitLabel = "Xác nhận",
}: ValidationErrorBannerProps) {
  if (errorCount === 0) return null;

  return (
    <div className="bg-error-container/20 border border-error text-error-container rounded-xl p-4 shadow-sm flex items-start gap-3 animate-fadeIn">
      <Icon name="warning" className="text-2xl text-error shrink-0 mt-0.5" />
      <div>
        <h4 className="font-bold text-lg text-error">
          Thông tin không hợp lệ ({errorCount} lỗi)
        </h4>
        <p className="text-base text-on-surface mt-0.5">
          Vui lòng kiểm tra và điền lại các thông tin bị cảnh báo đỏ bên dưới
          trước khi bấm <strong>{submitLabel}</strong>.
        </p>
      </div>
    </div>
  );
}
