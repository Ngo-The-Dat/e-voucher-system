/**
 * =========================================================================================
 * FILE: layout.tsx
 * VỊ TRÍ: frontend/src/app/admin/
 * VAI TRÒ TRONG HỆ THỐNG:
 *   - Layout khung vỏ (Shell Layout) bọc ngoài cho toàn bộ các trang thuộc phân hệ Quản trị (Admin Portal).
 *   - Định hình cấu trúc giao diện chuẩn gồm: Sidebar điều hướng bên trái + Header trên cùng + Vùng nội dung chính (main).
 * 
 * CÁC CHỨC NĂNG CỐT LÕI:
 *   1. Auth Guard (Bảo vệ tuyến đường): Kiểm tra JWT Token hợp lệ trong LocalStorage trước khi cho phép xem trang.
 *   2. Responsive Sidebar (Thích ứng đa thiết bị):
 *      - Trên Desktop (lg): Sidebar cố định, hỗ trợ tính năng Thu nhỏ (w-20) / Mở rộng (w-64).
 *      - Trên Mobile/Tablet: Sidebar dạng Drawer ẩn/hiện khi nhấn nút Menu trên Header.
 *   3. Trạng thái thu nhỏ bền bỉ (State Persistence): Tự động lưu trạng thái thu nhỏ vào LocalStorage để không bị reset khi F5.
 * =========================================================================================
 */

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/admin/Sidebar";
import Header from "@/components/admin/Header";

export default function AdminLayout({
  children,
}: {
  /** Các component/page con của phân hệ Admin (ví dụ: Dashboard, Quản lý Users, Vouchers, Orders,...) */
  children: React.ReactNode;
}) {
  const router = useRouter();

  /** State quản lý mở/đóng Sidebar trên màn hình Mobile (trượt từ cạnh trái ra) */
  const [sidebarOpen, setSidebarOpen] = useState(false);

  /** State quản lý thu nhỏ (w-20) hoặc mở rộng (w-64) của Sidebar trên màn hình Desktop */
  const [isCollapsed, setIsCollapsed] = useState(false);

  /** State xác nhận quyền truy cập: Chỉ chuyển thành true sau khi đã kiểm tra xong JWT token hợp lệ */
  const [isAuthed, setIsAuthed] = useState(false);

  // ─── 1. KIỂM TRA PHIÊN ĐĂNG NHẬP (AUTH GUARD) ───────────────────────────────
  useEffect(() => {
    // Đọc token từ LocalStorage của trình duyệt
    const token = localStorage.getItem("admin_access_token");

    // Kiểm tra định dạng chuẩn JWT (phải gồm đúng 3 phần: Header.Payload.Signature)
    const isJwt = token !== null && token.split('.').length === 3;

    // Nếu chưa đăng nhập hoặc token sai định dạng -> Xóa token và điều hướng về trang đăng nhập
    if (!isJwt) {
      localStorage.removeItem("admin_access_token");
      router.replace("/login");
      return;
    }

    // Đã có token hợp lệ -> Cho phép hiển thị giao diện Admin
    setIsAuthed(true);

    // Khôi phục trạng thái thu nhỏ Sidebar đã lưu trước đó từ LocalStorage (nếu có)
    const savedCollapsed = localStorage.getItem("admin_sidebar_collapsed");
    if (savedCollapsed !== null) {
      setIsCollapsed(savedCollapsed === "true");
    }
  }, [router]);

  // ─── 2. HÀM CHUYỂN ĐỔI THU NHỎ / MỞ RỘNG SIDEBAR ───────────────────────────
  /**
   * Đảo ngược trạng thái thu nhỏ của Sidebar và lưu lại vào LocalStorage để duy trì khi chuyển trang.
   */
  const handleToggleCollapse = () => {
    setIsCollapsed((prev) => {
      const nextState = !prev;
      localStorage.setItem("admin_sidebar_collapsed", String(nextState));
      return nextState;
    });
  };

  // ─── 3. MÀN HÌNH CHỜ XÁC THỰC (LOADING STATE) ───────────────────────────────
  // Ngăn chặn hiện tượng nhấp nháy giao diện (UI Flash) khi đang kiểm tra token
  if (!isAuthed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0f2c59]"></div>
      </div>
    );
  }

  // ─── 4. CẤU TRÚC GIAO DIỆN CHÍNH (MAIN SHELL) ───────────────────────────────
  return (
    <div className="bg-background text-text-main min-h-screen flex flex-col">
      {/* Sidebar điều hướng (Fixed bên trái màn hình) */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        isCollapsed={isCollapsed}
        onToggleCollapse={handleToggleCollapse}
      />

      {/* 
        Vùng nội dung bên phải Sidebar:
        - lg:pl-20: Đẩy lề trái 80px khi Sidebar thu nhỏ (w-20)
        - lg:pl-64: Đẩy lề trái 256px khi Sidebar mở rộng (w-64)
        - transition-all duration-300: Hiệu ứng co dãn mượt mà khi bấm nút thu nhỏ/mở rộng
      */}
      <div
        className={`${
          isCollapsed ? "lg:pl-20" : "lg:pl-64"
        } flex flex-col min-h-screen transition-all duration-300`}
      >
        {/* Header trên cùng (Chứa nút Menu mobile, Avatar admin, Thông báo) */}
        <Header onMenuToggle={() => setSidebarOpen(true)} />

        {/* Nội dung trang con (Dashboard, Users, Vouchers,...) */}
        <main className="flex-1 p-4 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
