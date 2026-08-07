"use client";

import { useState } from "react";
import Icon from "@/components/admin/Icon";

interface HeaderProps {
  onMenuToggle?: () => void;
}

export default function Header({ onMenuToggle }: HeaderProps) {
  const [showNotifications, setShowNotifications] = useState(false);

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/95 backdrop-blur-md border-b border-border px-4 lg:px-8 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuToggle}
          className="lg:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
          aria-label="Open Navigation Menu"
        >
          <Icon name="menu" className="text-xl" />
        </button>
      </div>

      <div className="flex items-center gap-3 sm:gap-4">
        {/* Notifications Button & Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            aria-label="Notifications"
          >
            <Icon name="notifications" className="text-xl" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-amber-500 rounded-full" />
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white border border-border rounded-xl shadow-lg p-3 z-50 animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-2">
                <h3 className="font-semibold text-sm text-slate-900">Thông báo mới</h3>
                <span className="text-xs text-primary font-medium cursor-pointer hover:underline">
                  Đánh dấu đã đọc
                </span>
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto text-xs">
                <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
                  <p className="font-medium text-slate-800">Hồ sơ đối tác mới chờ duyệt</p>
                  <p className="text-text-muted mt-0.5">Công ty TNHH Vui Chơi Giải Trí Sun</p>
                  <span className="text-[10px] text-slate-400 mt-1 block">5 phút trước</span>
                </div>
                <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
                  <p className="font-medium text-slate-800">12 Voucher mới gửi yêu cầu duyệt</p>
                  <p className="text-text-muted mt-0.5">Chiến dịch Ưu đãi Mùa Hè 2026</p>
                  <span className="text-[10px] text-slate-400 mt-1 block">30 phút trước</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Admin Quick Action */}
        <div className="pl-2 border-l border-slate-200 flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary-container text-white flex items-center justify-center font-bold text-xs">
            A
          </div>
          <span className="hidden md:inline-block text-xs font-semibold text-slate-700">
            Admin
          </span>
        </div>
      </div>
    </header>
  );
}
