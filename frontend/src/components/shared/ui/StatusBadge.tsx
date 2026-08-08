interface StatusBadgeProps {
  status: "running" | "ended" | "pending" | "draft" | string;
  label?: string;
}

export default function StatusBadge({ status, label }: StatusBadgeProps) {
  let badgeStyles = "bg-surface-variant text-on-surface-variant";
  let defaultLabel = label || status;

  if (status === "running" || status === "Đang chạy" || status === "active") {
    badgeStyles = "bg-secondary-container text-on-secondary-container font-semibold";
    defaultLabel = label || "Đang chạy";
  } else if (status === "ended" || status === "Đã kết thúc") {
    badgeStyles = "bg-surface-variant text-on-surface-variant";
    defaultLabel = label || "Đã kết thúc";
  } else if (status === "pending" || status === "Chờ duyệt") {
    badgeStyles = "bg-tertiary-fixed text-on-tertiary-fixed-variant";
    defaultLabel = label || "Chờ duyệt";
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badgeStyles}`}>
      {defaultLabel}
    </span>
  );
}
