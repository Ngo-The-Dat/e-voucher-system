import Icon from "@/components/shared/ui/Icon";
import FormField, { getInputClass } from "@/components/shared/ui/FormField";
import { VoucherFormErrors } from "@/lib/types/voucher";
import { formatCurrency } from "@/lib/utils";

interface VoucherPricingSectionProps {
  originalPriceStr: string;
  sellingPriceStr: string;
  issuedQuantityStr: string;
  discountAmount: number;
  errors: VoucherFormErrors;
  onOriginalPriceChange: (v: string) => void;
  onSellingPriceChange: (v: string) => void;
  onIssuedQuantityChange: (v: string) => void;
}

export default function VoucherPricingSection({
  originalPriceStr,
  sellingPriceStr,
  issuedQuantityStr,
  discountAmount,
  errors,
  onOriginalPriceChange,
  onSellingPriceChange,
  onIssuedQuantityChange,
}: VoucherPricingSectionProps) {
  return (
    <div className="bg-surface-bright rounded-xl border border-outline-variant p-6 shadow-sm space-y-6">
      <h3 className="text-lg font-bold text-on-surface pb-3 border-b border-outline-variant/40 flex items-center gap-2">
        <Icon name="payments" className="text-primary" />
        2. Giá bán, Mức giảm &amp; Số lượng phát hành
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <FormField label="Giá gốc (₫)" required error={errors.originalPrice}>
          <input
            type="number"
            min="0"
            step="1000"
            value={originalPriceStr}
            onChange={(e) => onOriginalPriceChange(e.target.value)}
            placeholder="VD: 100000"
            className={getInputClass(!!errors.originalPrice)}
          />
        </FormField>

        <FormField label="Giá bán (₫)" required error={errors.sellingPrice}>
          <input
            type="number"
            min="0"
            step="1000"
            value={sellingPriceStr}
            onChange={(e) => onSellingPriceChange(e.target.value)}
            placeholder="VD: 80000"
            className={getInputClass(!!errors.sellingPrice)}
          />
        </FormField>

        {/* Mức giảm tự động tính */}
        <div>
          <label className="block font-semibold text-on-surface mb-1.5 text-primary">
            Mức giảm (tự động)
          </label>
          <div className="w-full border border-primary/40 bg-primary-container/20 rounded-lg px-4 py-3 text-lg font-bold text-primary flex items-center justify-between">
            <span>{discountAmount > 0 ? formatCurrency(discountAmount) : "0 ₫"}</span>
            <span className="text-xs text-on-surface-variant font-normal">(Giá gốc − Giá bán)</span>
          </div>
        </div>
      </div>

      <FormField label="Số lượng phát hành" required error={errors.issuedQuantity}>
        <input
          type="number"
          min="1"
          value={issuedQuantityStr}
          onChange={(e) => onIssuedQuantityChange(e.target.value)}
          placeholder="VD: 1000"
          className={getInputClass(!!errors.issuedQuantity)}
        />
      </FormField>
    </div>
  );
}
