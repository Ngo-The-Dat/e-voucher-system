"use client";

import Icon from "@/components/Icon";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ContentPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/admin/content/categories");
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center space-y-2">
        <Icon name="progress_activity" className="text-4xl text-blue-600 animate-spin" />
        <p className="text-sm font-semibold text-slate-600">Đang chuyển hướng đến trang Quản lý Nội dung...</p>
      </div>
    </div>
  );
}
