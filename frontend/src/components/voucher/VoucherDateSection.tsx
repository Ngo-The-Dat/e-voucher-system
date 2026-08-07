import Icon from "@/components/ui/Icon";
import FormField, { getInputClass } from "@/components/ui/FormField";
import { VoucherFormErrors } from "@/lib/types/voucher";

interface VoucherDateSectionProps {
  sellStartDate: string;
  sellEndDate: string;
  useStartDate: string;
  useEndDate: string;
  errors: VoucherFormErrors;
  onSellStartChange: (v: string) => void;
  onSellEndChange: (v: string) => void;
  onUseStartChange: (v: string) => void;
  onUseEndChange: (v: string) => void;
}

export default function VoucherDateSection({
  sellStartDate,
  sellEndDate,
  useStartDate,
  useEndDate,
  errors,
  onSellStartChange,
  onSellEndChange,
  onUseStartChange,
  onUseEndChange,
}: VoucherDateSectionProps) {
  return (
    <div className="bg-surface-bright rounded-xl border border-outline-variant p-6 shadow-sm space-y-6">
      <h3 className="text-lg font-bold text-on-surface pb-3 border-b border-outline-variant/40 flex items-center gap-2">
        <Icon name="date_range" className="text-primary" />
        3. Thời gian bán &amp; Thời gian sử dụng
      </h3>

      {/* Thời gian bán */}
      <div className="space-y-3">
        <h4 className="font-bold text-base text-on-surface">Khung thời gian Bán Voucher:</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <FormField label="Bắt đầu bán" required error={errors.sellStartDate}>
            <input
              type="date"
              value={sellStartDate}
              onChange={(e) => onSellStartChange(e.target.value)}
              className={getInputClass(!!errors.sellStartDate)}
            />
          </FormField>

          <FormField label="Kết thúc bán" required error={errors.sellEndDate}>
            <input
              type="date"
              value={sellEndDate}
              onChange={(e) => onSellEndChange(e.target.value)}
              className={getInputClass(!!errors.sellEndDate)}
            />
          </FormField>
        </div>
      </div>

      {/* Thời gian sử dụng */}
      <div className="space-y-3 pt-4 border-t border-outline-variant/40">
        <h4 className="font-bold text-base text-on-surface">Khung thời gian Sử dụng Voucher:</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <FormField label="Bắt đầu sử dụng" required error={errors.useStartDate}>
            <input
              type="date"
              value={useStartDate}
              onChange={(e) => onUseStartChange(e.target.value)}
              className={getInputClass(!!errors.useStartDate)}
            />
          </FormField>

          <FormField label="Kết thúc sử dụng" required error={errors.useEndDate}>
            <input
              type="date"
              value={useEndDate}
              onChange={(e) => onUseEndChange(e.target.value)}
              className={getInputClass(!!errors.useEndDate)}
            />
          </FormField>
        </div>
      </div>
    </div>
  );
}
