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
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
      <div>
        <div className="flex items-start justify-between gap-2 mb-3">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            {title}
          </span>
          <div className={`w-9 h-9 rounded-xl ${iconBgClass} flex items-center justify-center ${iconTextClass} shrink-0`}>
            <Icon name={icon} className="text-lg" />
          </div>
        </div>
        <div className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">{value}</div>
        {comparisonText && (
          <p className="text-xs text-slate-400 mt-1">{comparisonText}</p>
        )}
      </div>
      {change && (
        <div className="mt-3">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
            isPositive
              ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
              : "bg-rose-50 text-rose-700 border border-rose-100"
          }`}>
            {change}
          </span>
        </div>
      )}
    </div>
  );
}
