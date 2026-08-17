import Icon from "@/components/shared/ui/Icon";
import { Input } from "@/components/shared/ui/Input";
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
  const originalPrice = parseFloat(originalPriceStr) || 0;
  const discountPercent =
    originalPrice > 0 && discountAmount > 0
      ? Math.round((discountAmount / originalPrice) * 100)
      : 0;

  return (
    <div className="bg-surface-bright rounded-xl border border-outline-variant p-6 shadow-sm space-y-6">
      <h3 className="text-lg font-bold text-on-surface pb-3 border-b border-outline-variant/40 flex items-center gap-2">
        <Icon name="payments" className="text-primary" />
        2. Giá bán, Mức giảm &amp; Số lượng phát hành
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <FormField label="Giá gốc (₫)" required error={errors.originalPrice}>
          <Input
            type="number"
            min="0"
            step="1"
            value={originalPriceStr}
            onChange={(e) => onOriginalPriceChange(e.target.value)}
            placeholder="VD: 100000"
            className={getInputClass(!!errors.originalPrice)}
          />
        </FormField>

        <FormField label="Giá bán (₫)" required error={errors.sellingPrice}>
          <Input
            type="number"
            min="0"
            step="1"
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
            <div className="flex items-center gap-2 flex-wrap">
              <span>{discountAmount > 0 ? formatCurrency(discountAmount) : "0 ₫"}</span>
              {discountPercent > 0 && (
                <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-200">
                  -{discountPercent}%
                </span>
              )}
            </div>
            <span className="text-xs text-on-surface-variant font-normal">(Giá gốc − Giá bán)</span>
          </div>
        </div>
      </div>

      <FormField label="Số lượng phát hành" required error={errors.issuedQuantity}>
        <Input
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
