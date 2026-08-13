"use client";

import Icon from "@/components/shared/ui/Icon";

interface HeaderProps {
  onMenuToggle?: () => void;
}

export default function Header({ onMenuToggle }: HeaderProps) {
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
        {/* Admin Quick Action */}
        <div className="flex items-center gap-2">
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

