import Icon from "@/components/shared/ui/Icon";
import { Input } from "@/components/shared/ui/Input";
import FormField, { getInputClass } from "@/components/shared/ui/FormField";
import { Branch } from "@/lib/types/partner-profile";
import { CategoryOption, VoucherFormErrors } from "@/lib/types/partner-voucher";

interface VoucherGeneralSectionProps {
  code: string;
  title: string;
  categoryId: string;
  categories: CategoryOption[];
  partnerBranches: Branch[];
  selectedBranchIds: string[];
  errors: VoucherFormErrors;
  onCodeChange: (v: string) => void;
  onTitleChange: (v: string) => void;
  onCategoryChange: (v: string) => void;
  onBranchToggle: (id: string) => void;
  /** Nếu truyền vào thì mã chương trình không chỉnh sửa được (chế độ edit) */
  codeReadOnly?: boolean;
}

export default function VoucherGeneralSection({
  code,
  title,
  categoryId,
  categories,
  partnerBranches,
  selectedBranchIds,
  errors,
  onCodeChange,
  onTitleChange,
  onCategoryChange,
  onBranchToggle,
  codeReadOnly = false,
}: VoucherGeneralSectionProps) {
  return (
    <div className="bg-surface-bright rounded-xl border border-outline-variant p-6 shadow-sm space-y-6">
      <h3 className="text-lg font-bold text-on-surface pb-3 border-b border-outline-variant/40 flex items-center gap-2">
        <Icon name="info" className="text-primary" />
        1. Thông tin chung chương trình
      </h3>

      <div className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <FormField label="Tên chương trình" required error={errors.title}>
            <Input
              type="text"
              value={title}
              onChange={(e) => onTitleChange(e.target.value)}
              placeholder="VD: Voucher Cà phê Phin giảm 20k"
              className={getInputClass(!!errors.title)}
            />
          </FormField>

          <FormField label="Mã chương trình" required error={errors.code}>
            <Input
              type="text"
              value={code}
              onChange={(e) => onCodeChange(e.target.value)}
              placeholder="VD: VC-HL-2023-001"
              disabled={codeReadOnly}
              className={
                codeReadOnly
                  ? "bg-surface-container text-on-surface-variant cursor-not-allowed"
                  : getInputClass(!!errors.code)
              }
            />
          </FormField>
        </div>

        {/* Danh mục */}
        <FormField label="Danh mục sản phẩm áp dụng" required error={errors.category}>
          <select
            value={categoryId}
            onChange={(e) => onCategoryChange(e.target.value)}
            className="w-full border border-outline-variant rounded-lg px-4 py-3 text-base text-on-surface focus:ring-2 focus:ring-primary outline-none bg-surface"
          >
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}{cat.description ? ` (${cat.description})` : ""}
              </option>
            ))}
          </select>
        </FormField>

        {/* Chi nhánh */}
        <FormField label="Chi nhánh áp dụng" required error={errors.branches}>
          {partnerBranches.length === 0 ? (
            <p className="text-sm text-on-surface-variant italic">
              Chưa có chi nhánh nào được khai báo.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 bg-surface-container-low rounded-xl border border-outline-variant/60">
              {partnerBranches.map((branch) => {
                const isChecked = selectedBranchIds.includes(branch.id);
                return (
                  <label
                    key={branch.id}
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      isChecked
                        ? "bg-primary-container/20 border-primary text-on-surface font-semibold"
                        : "bg-surface border-outline-variant text-on-surface-variant hover:bg-surface-container-high"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => onBranchToggle(branch.id)}
                      className="w-4 h-4 text-primary rounded focus:ring-primary"
                    />
                    <div>
                      <p className="text-base font-bold">{branch.name}</p>
                      <p className="text-xs text-on-surface-variant">
                        {branch.address} ({branch.region})
                      </p>
                    </div>
                  </label>
                );
              })}
            </div>
          )}
        </FormField>
      </div>
    </div>
  );
}
