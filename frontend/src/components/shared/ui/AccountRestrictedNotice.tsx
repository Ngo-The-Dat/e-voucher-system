"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Icon from "@/components/shared/ui/Icon";
import { Button } from "@/components/shared/ui/Button";

export interface AccountRestrictedNoticeProps {
  type?: "pending" | "rejected" | "locked" | "forbidden" | "error";
  title?: string;
  message?: string;
  feedback?: string | null;
  roleName?: string;
  onRetry?: () => void;
}

export default function AccountRestrictedNotice({
  type = "pending",
  title,
  message,
  feedback,
  roleName = "tài khoản",
  onRetry,
}: AccountRestrictedNoticeProps) {
  const router = useRouter();

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("partner_access_token");
      localStorage.removeItem("partner_user");
      localStorage.removeItem("admin_access_token");
      localStorage.removeItem("admin_user");
    }
    router.replace("/login");
  };

  const getVisualConfig = () => {
    switch (type) {
      case "pending":
        return {
          icon: "hourglass_top",
          iconBg: "bg-amber-100 text-amber-600 border-amber-200",
          defaultTitle: `Tài khoản ${roleName} đang chờ phê duyệt`,
          defaultMessage:
            "Hồ sơ của bạn đã được gửi lên hệ thống và đang trong quá trình xét duyệt bởi Quản trị viên (Admin). Vui lòng quay lại sau.",
          badgeText: "Đang chờ xét duyệt",
          badgeColor: "bg-amber-50 text-amber-700 border-amber-200",
        };
      case "rejected":
        return {
          icon: "cancel",
          iconBg: "bg-rose-100 text-rose-600 border-rose-200",
          defaultTitle: `Hồ sơ ${roleName} đã bị từ chối`,
          defaultMessage:
            "Rất tiếc, hồ sơ đăng ký của bạn không được phê duyệt bởi Quản trị viên. Vui lòng kiểm tra lại thông tin hoặc liên hệ hỗ trợ.",
          badgeText: "Bị từ chối phê duyệt",
          badgeColor: "bg-rose-50 text-rose-700 border-rose-200",
        };
      case "locked":
        return {
          icon: "lock",
          iconBg: "bg-slate-100 text-slate-700 border-slate-200",
          defaultTitle: `Tài khoản ${roleName} đã bị khóa`,
          defaultMessage:
            "Tài khoản hoặc chi nhánh trực thuộc của bạn hiện đang bị vô hiệu hóa / tạm ngưng hoạt động trên hệ thống.",
          badgeText: "Tạm ngưng hoạt động",
          badgeColor: "bg-slate-50 text-slate-700 border-slate-200",
        };
      default:
        return {
          icon: "block",
          iconBg: "bg-red-100 text-red-600 border-red-200",
          defaultTitle: "Quyền truy cập bị từ chối",
          defaultMessage: "Bạn không có quyền truy cập vào khu vực này.",
          badgeText: "Không có quyền",
          badgeColor: "bg-red-50 text-red-700 border-red-200",
        };
    }
  };

  const config = getVisualConfig();

  return (
    <div className="min-h-screen w-full bg-background flex flex-col items-center justify-center p-4 sm:p-6">
      <div className="max-w-lg w-full bg-surface-bright rounded-2xl border border-outline-variant p-6 sm:p-8 shadow-sm text-center space-y-6 animate-fadeIn">
        {/* Icon & Badge */}
        <div className="flex flex-col items-center gap-3">
          <div
            className={`w-16 h-16 rounded-2xl flex items-center justify-center border text-3xl shadow-sm ${config.iconBg}`}
          >
            <Icon name={config.icon} className={type === "pending" ? "animate-pulse" : ""} />
          </div>
          <span
            className={`px-3 py-1 rounded-full text-xs font-bold border tracking-wide uppercase ${config.badgeColor}`}
          >
            {config.badgeText}
          </span>
        </div>

        {/* Heading & Details */}
        <div className="space-y-2">
          <h2 className="text-xl sm:text-2xl font-bold text-on-surface">
            {title || config.defaultTitle}
          </h2>
          <p className="text-sm sm:text-base text-on-surface-variant leading-relaxed">
            {message || config.defaultMessage}
          </p>
        </div>

        {/* Admin Feedback Callout (if rejected) */}
        {feedback && (
          <div className="text-left bg-rose-50/70 border-l-4 border-rose-500 p-4 rounded-r-xl space-y-1">
            <span className="text-xs font-bold text-rose-700 uppercase tracking-wide flex items-center gap-1">
              <Icon name="info" className="text-sm" /> Lý do từ chối từ Admin:
            </span>
            <p className="text-sm text-rose-900 font-medium italic">"{feedback}"</p>
          </div>
        )}

        {/* Helpful instructions */}
        <div className="bg-surface-container-low rounded-xl p-4 text-xs text-on-surface-variant text-left space-y-1.5 border border-outline-variant/60">
          <p className="font-semibold text-on-surface flex items-center gap-1.5">
            <Icon name="help_outline" className="text-sm text-primary" /> Bạn cần hỗ trợ?
          </p>
          <p>
            Vui lòng liên hệ với bộ phận hỗ trợ kỹ thuật hoặc quản trị viên doanh nghiệp để kiểm tra lại trạng thái hồ sơ của bạn.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          {onRetry && (
            <Button
              type="button"
              variant="outline"
              onClick={onRetry}
              className="w-full sm:w-auto gap-2"
            >
              <Icon name="refresh" />
              <span>Tải lại trang</span>
            </Button>
          )}

          <Button
            type="button"
            variant="destructive"
            onClick={handleLogout}
            className="w-full sm:w-auto gap-2"
          >
            <Icon name="logout" />
            <span>Đăng xuất</span>
          </Button>

          <Button
            type="button"
            variant="ghost"
            asChild
            className="w-full sm:w-auto text-on-surface-variant"
          >
            <Link href="/">Trang chủ</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
