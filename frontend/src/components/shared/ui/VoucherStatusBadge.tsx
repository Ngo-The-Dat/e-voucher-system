import { VoucherApprovalStatus } from "@/lib/types/voucher";

interface StatusConfig {
  label: string;
  className: string;
  dotColor: string;
  pulse?: boolean;
}

const STATUS_CONFIG: Record<VoucherApprovalStatus, StatusConfig> = {
  draft: {
    label: "Chưa gửi duyệt",
    className:
      "bg-surface-variant text-on-surface-variant border-outline-variant",
    dotColor: "bg-outline",
  },
  pending: {
    label: "Chờ duyệt",
    className:
      "bg-tertiary-fixed-dim/30 text-tertiary-amber border-tertiary-amber/30",
    dotColor: "bg-tertiary-amber",
    pulse: true,
  },
  approved: {
    label: "Đã duyệt",
    className:
      "bg-secondary-container/30 text-secondary border-secondary/30",
    dotColor: "bg-secondary",
  },
  rejected: {
    label: "Từ chối",
    className: "bg-error-container/30 text-error border-error/30",
    dotColor: "bg-error",
  },
};

interface VoucherStatusBadgeProps {
  status: VoucherApprovalStatus;
  /** Hiển thị chấm tròn bên trái text. Mặc định: true */
  withDot?: boolean;
  /** Label tùy chỉnh, nếu không truyền sẽ dùng label mặc định của status */
  label?: string;
  className?: string;
}

export default function VoucherStatusBadge({
  status,
  withDot = true,
  label,
  className = "",
}: VoucherStatusBadgeProps) {
  const cfg = STATUS_CONFIG[status];
  if (!cfg) return null;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border whitespace-nowrap ${cfg.className} ${className}`}
    >
      {withDot && (
        <span
          className={`w-2 h-2 rounded-full shrink-0 ${cfg.dotColor} ${cfg.pulse ? "animate-pulse" : ""}`}
        />
      )}
      {label ?? cfg.label}
    </span>
  );
}
