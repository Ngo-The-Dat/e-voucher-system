import Icon from "@/components/shared/ui/Icon";
import FormField, { getInputClass } from "@/components/shared/ui/FormField";
import { PartnerProfile, ProfileFormErrors } from "@/lib/types/profile";

interface RepresentativeSectionProps {
  repInfo: PartnerProfile["representativeInfo"];
  errors: ProfileFormErrors;
  onChange: (
    field: keyof PartnerProfile["representativeInfo"],
    value: string
  ) => void;
}

export default function RepresentativeSection({
  repInfo,
  errors,
  onChange,
}: RepresentativeSectionProps) {
  return (
    <div className="bg-surface-bright border border-outline-variant rounded-xl p-6 shadow-sm w-full space-y-6">
      <h3 className="text-lg font-bold text-on-surface pb-3 border-b border-outline-variant/40 flex items-center gap-2">
        <Icon name="badge" className="text-primary" />
        2. Thông tin người đại diện
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-base">
        <FormField
          label="Họ và tên người đại diện"
          required
          error={errors.fullName}
        >
          <input
            type="text"
            value={repInfo.fullName}
            onChange={(e) => onChange("fullName", e.target.value)}
            className={getInputClass(!!errors.fullName)}
            placeholder="VD: Nguyễn Văn An"
          />
        </FormField>

        <FormField label="Chức danh" required error={errors.title}>
          <input
            type="text"
            value={repInfo.title}
            onChange={(e) => onChange("title", e.target.value)}
            className={getInputClass(!!errors.title)}
            placeholder="VD: Tổng Giám Đốc"
          />
        </FormField>

        <FormField label="Số CCCD / CMND" required error={errors.identityNo}>
          <input
            type="text"
            value={repInfo.identityNo}
            onChange={(e) => onChange("identityNo", e.target.value)}
            className={getInputClass(!!errors.identityNo)}
            placeholder="VD: 079199012345"
          />
        </FormField>

        <FormField
          label="Số điện thoại liên hệ"
          required
          error={errors.phone}
        >
          <input
            type="tel"
            value={repInfo.phone}
            onChange={(e) => onChange("phone", e.target.value)}
            className={getInputClass(!!errors.phone)}
            placeholder="VD: 0901234567"
          />
        </FormField>

        <FormField
          label="Email đăng nhập"
          fullWidth
        >
          <input
            type="email"
            value={repInfo.email}
            readOnly
            aria-readonly="true"
            className={`${getInputClass(false)} cursor-not-allowed bg-surface-container-low text-on-surface-variant`}
          />
          <p className="text-sm text-on-surface-variant mt-1.5">
            Email này dùng để đăng nhập và không thể thay đổi tại hồ sơ.
          </p>
        </FormField>
      </div>
    </div>
  );
}
