import Icon from "@/components/ui/Icon";
import StatusBadge from "@/components/ui/StatusBadge";
import FormField, { getInputClass } from "@/components/ui/FormField";
import { PartnerProfile, ProfileFormErrors } from "@/lib/types/profile";

interface LegalInfoSectionProps {
  legalInfo: PartnerProfile["legalInfo"];
  errors: ProfileFormErrors;
  onChange: (field: keyof PartnerProfile["legalInfo"], value: string) => void;
}

export default function LegalInfoSection({
  legalInfo,
  errors,
  onChange,
}: LegalInfoSectionProps) {
  return (
    <div className="bg-surface-bright border border-outline-variant rounded-xl p-6 shadow-sm w-full space-y-6">
      <h3 className="text-lg font-bold text-on-surface pb-3 border-b border-outline-variant/40 flex items-center gap-2">
        <Icon name="gavel" className="text-primary" />
        1. Thông tin pháp lý &amp; Mã số thuế
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-base">
        <FormField label="Mã số thuế" required error={errors.taxId}>
          <input
            type="text"
            value={legalInfo.taxId}
            onChange={(e) => onChange("taxId", e.target.value)}
            className={getInputClass(!!errors.taxId)}
            placeholder="VD: 0312345678"
          />
        </FormField>

        <FormField
          label="Số ĐKKD / Giấy phép kinh doanh"
          required
          error={errors.businessLicenseNo}
        >
          <input
            type="text"
            value={legalInfo.businessLicenseNo}
            onChange={(e) => onChange("businessLicenseNo", e.target.value)}
            className={getInputClass(!!errors.businessLicenseNo)}
            placeholder="VD: 0312345678-001"
          />
        </FormField>

        <FormField label="Ngày cấp" required error={errors.issueDate}>
          <input
            type="date"
            value={legalInfo.issueDate}
            onChange={(e) => onChange("issueDate", e.target.value)}
            className={getInputClass(!!errors.issueDate)}
          />
        </FormField>

        <FormField label="Nơi cấp" required error={errors.issuePlace}>
          <input
            type="text"
            value={legalInfo.issuePlace}
            onChange={(e) => onChange("issuePlace", e.target.value)}
            className={getInputClass(!!errors.issuePlace)}
            placeholder="VD: Sở Kế hoạch và Đầu tư TP. Hồ Chí Minh"
          />
        </FormField>

        <div className="sm:col-span-2">
          <label className="block font-semibold text-on-surface mb-1.5">
            Trạng thái xác minh hồ sơ pháp lý
          </label>
          <div className="mt-1">
            <StatusBadge status="running" label="Đã xác minh đầy đủ" />
          </div>
        </div>
      </div>
    </div>
  );
}
