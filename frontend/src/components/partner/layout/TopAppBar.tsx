"use client";

import Link from "next/link";
import Image from "next/image";
import Icon from "@/components/shared/ui/Icon";
import { usePartner } from "@/context/PartnerContext";

interface TopAppBarProps {
  title?: string;
  partnerName?: string;
}

export default function TopAppBar({
  title,
  partnerName,
}: TopAppBarProps) {
  const partner = usePartner();
  const displayName = partnerName ?? partner?.businessName ?? "Đối tác";
  const brandLogo = partner?.brandLogo;

  // Lấy 2 chữ cái đầu của tên làm avatar initials
  const initials = displayName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");

  return (
    <header className="h-16 border-b border-outline-variant/30 bg-surface-bright/80 backdrop-blur-md sticky top-0 z-20 px-6 flex items-center justify-between">
      <div className="flex items-center gap-4">
        {title && <h2 className="text-lg font-bold text-on-surface">{title}</h2>}
      </div>

      <div className="flex items-center gap-4">
        {/* Notification Icon */}
        <button
          aria-label="Thông báo"
          className="w-10 h-10 rounded-full hover:bg-surface-container-high flex items-center justify-center relative text-on-surface-variant transition-colors"
        >
          <Icon name="notifications" className="text-[22px]" />
          <span className="absolute top-2.5 right-2.5 w-2.5 h-2.5 rounded-full bg-error" />
        </button>

        {/* Profile Avatar & Link to /profile */}
        <Link
          href="/partner/profile"
          className="flex items-center gap-3 pl-3 border-l border-outline-variant/40 hover:opacity-80 transition-opacity"
        >
          <div className="w-9 h-9 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center font-bold text-sm shadow-sm overflow-hidden relative shrink-0 border border-outline-variant/30">
            {brandLogo ? (
              <Image
                src={brandLogo}
                alt={displayName}
                fill
                sizes="36px"
                className="object-cover"
                unoptimized
              />
            ) : (
              <span>{initials}</span>
            )}
          </div>
          <div className="hidden sm:flex flex-col text-left">
            <span className="text-base font-bold text-on-surface leading-tight">
              {displayName}
            </span>
            <span className="text-xs text-on-surface-variant">Hồ sơ đối tác</span>
          </div>
        </Link>
      </div>
    </header>
  );
}
