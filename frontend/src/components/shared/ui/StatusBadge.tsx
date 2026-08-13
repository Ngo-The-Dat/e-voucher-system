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
    badgeStyles = "bg-amber-50 text-amber-600 border border-amber-200/70 font-semibold";
    defaultLabel = label || "Chờ duyệt";
  } else if (status === "revision_requested" || status === "Yêu cầu bổ sung" || status === "REVISION_REQUESTED") {
    badgeStyles = "bg-blue-50 text-blue-600 border border-blue-200/70 font-semibold";
    defaultLabel = label || "Yêu cầu bổ sung";
  } else if (status === "rejected" || status === "Từ chối" || status === "REJECTED") {
    badgeStyles = "bg-rose-50 text-rose-600 border border-rose-200/70 font-semibold";
    defaultLabel = label || "Từ chối";
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap shrink-0 ${badgeStyles}`}>
      {defaultLabel}
    </span>
  );
}
