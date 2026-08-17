import Icon from "@/components/shared/ui/Icon";
import StatusBadge from "@/components/shared/ui/StatusBadge";
import { Branch } from "@/lib/types/profile";

interface BranchesSectionProps {
  branches: Branch[];
  onAdd: () => void;
  onEdit: (branch: Branch) => void;
  onDelete: (id: string) => void;
  onToggleStatus: (id: string) => void;
}

export default function BranchesSection({
  branches,
  onAdd,
  onEdit,
  onDelete,
  onToggleStatus,
}: BranchesSectionProps) {
  return (
    <div className="bg-surface-bright border border-outline-variant rounded-xl p-6 shadow-sm w-full space-y-6">
      <div className="flex justify-between items-center pb-3 border-b border-outline-variant/40">
        <h3 className="text-lg font-bold text-on-surface flex items-center gap-2">
          <Icon name="location_city" className="text-primary" />
          3. Danh sách chi nhánh ({branches.length})
        </h3>
        <button
          type="button"
          onClick={onAdd}
          className="bg-primary text-on-primary text-base font-bold px-4 py-2.5 rounded-lg flex items-center gap-1.5 shadow-sm hover:bg-surface-tint transition-colors"
        >
          <Icon name="add" className="text-[20px]" />
          Thêm chi nhánh
        </button>
      </div>

      {branches.length === 0 ? (
        <div className="p-8 text-center bg-surface-container-low rounded-xl border border-dashed border-outline-variant">
          <Icon name="storefront" className="text-4xl text-outline mb-2" />
          <p className="text-on-surface-variant font-medium">
            Chưa có chi nhánh nào được ghi nhận.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto w-full border border-outline-variant/60 rounded-xl">
          <table className="w-full text-left border-collapse text-base">
            <thead>
              <tr className="bg-surface-container-low border-b border-outline-variant">
                <th className="p-4 font-semibold text-on-surface-variant">Tên chi nhánh</th>
                <th className="p-4 font-semibold text-on-surface-variant">Khu vực</th>
                <th className="p-4 font-semibold text-on-surface-variant">Địa chỉ</th>
                <th className="p-4 font-semibold text-on-surface-variant">Số điện thoại</th>
                <th className="p-4 font-semibold text-on-surface-variant">Trạng thái</th>
                <th className="p-4 font-semibold text-on-surface-variant text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {branches.map((b) => (
                <tr key={b.id} className="hover:bg-surface-container-low/40 transition-colors">
                  <td className="p-4 font-bold text-on-surface">{b.name}</td>
                  <td className="p-4">
                    <span className="px-3 py-1 bg-surface-container-high text-on-surface font-semibold text-sm rounded-full border border-outline-variant">
                      {b.region || "Chưa cập nhật"}
                    </span>
                  </td>
                  <td className="p-4 text-on-surface">{b.address}</td>
                  <td className="p-4 font-mono text-on-surface">{b.phone}</td>
                  <td className="p-4">
                    <StatusBadge
                      status={b.status === "active" ? "running" : "stopped"}
                      label={b.status === "active" ? "Hoạt động" : "Tạm dừng"}
                    />
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => onToggleStatus(b.id)}
                        title={b.status === "active" ? "Tạm dừng" : "Kích hoạt"}
                        className="p-2 rounded-lg text-on-surface-variant hover:bg-surface-container-high transition-colors"
                      >
                        <Icon name={b.status === "active" ? "pause_circle" : "play_circle"} />
                      </button>
                      <button
                        type="button"
                        onClick={() => onEdit(b)}
                        title="Chỉnh sửa chi nhánh"
                        className="p-2 rounded-lg text-primary hover:bg-primary-container/30 transition-colors"
                      >
                        <Icon name="edit" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(b.id)}
                        title="Xóa chi nhánh"
                        className="p-2 rounded-lg text-error hover:bg-error-container/30 transition-colors"
                      >
                        <Icon name="delete" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
