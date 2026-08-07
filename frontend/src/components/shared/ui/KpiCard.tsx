import Icon from "@/components/shared/ui/Icon";

interface KpiCardProps {
  title: string;
  value: string;
  change?: string;
  isPositive?: boolean;
  comparisonText?: string;
  icon: string;
  iconBgClass: string;
  iconTextClass: string;
}

export default function KpiCard({
  title,
  value,
  change,
  isPositive = true,
  comparisonText,
  icon,
  iconBgClass,
  iconTextClass,
}: KpiCardProps) {
  return (
    <div className="bg-surface-bright rounded-xl border border-outline-variant p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
          {title}
        </span>
        <div className={`w-8 h-8 rounded-full ${iconBgClass} flex items-center justify-center ${iconTextClass}`}>
          <Icon name={icon} className="w-4 h-4 fill-current" />
        </div>
      </div>
      <div className="text-2xl font-bold text-on-background mb-1">{value}</div>
      {change && (
        <div className={`flex items-center gap-1 text-xs font-medium ${isPositive ? "text-secondary" : "text-error"}`}>
          <Icon name={isPositive ? "trending_up" : "trending_down"} className="w-3.5 h-3.5 fill-current" />
          <span>{change}</span>
          {comparisonText && (
            <span className="text-outline ml-1 font-normal">{comparisonText}</span>
          )}
        </div>
      )}
    </div>
  );
}
