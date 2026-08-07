"use client";

import Icon from "@/components/Icon";

import { useState } from "react";

interface RolePermission {
  module: string;
  read: boolean;
  create: boolean;
  approve: boolean;
  delete: boolean;
}

export default function PermissionsPage() {
  const [selectedRole, setSelectedRole] = useState("Quản trị viên nội dung");
  const [showSaveModal, setShowSaveModal] = useState(false);

  const [matrix, setMatrix] = useState<RolePermission[]>([
    { module: "Quản lý Người dùng & Tài khoản", read: true, create: true, approve: false, delete: false },
    { module: "Xác minh Hồ sơ Đối tác Merchant", read: true, create: false, approve: true, delete: false },
    { module: "Duyệt Chiến dịch & Khuyến mãi Voucher", read: true, create: true, approve: true, delete: true },
    { module: "Quản lý Đơn hàng & Hoàn tiền", read: true, create: false, approve: false, delete: false },
    { module: "Cấu hình Banner & Trang chủ", read: true, create: true, approve: true, delete: true },
    { module: "Truy xuất Nhật ký Audit Logs", read: true, create: false, approve: false, delete: false },
  ]);

  const togglePermission = (index: number, key: keyof Omit<RolePermission, "module">) => {
    setMatrix((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, [key]: !item[key] } : item
      )
    );
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-border">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Phân quyền hệ thống (Role & Permissions)
          </h1>
          <p className="text-sm text-text-muted mt-1">
            Quản lý ma trận quyền truy cập của các nhóm tài khoản quản trị
          </p>
        </div>
        <button
          onClick={() => setShowSaveModal(true)}
          className="px-4 py-2 text-sm font-semibold text-white bg-primary-container rounded-lg shadow-sm hover:bg-blue-700 transition flex items-center gap-2"
        >
          <Icon name="save" className="text-lg" />
          <span>Lưu thay đổi quyền</span>
        </button>
      </div>

      {/* Role Selection Tabs */}
      <div className="flex items-center gap-2 border-b border-border overflow-x-auto pb-2">
        {[
          "Super Admin",
          "Quản trị viên nội dung",
          "Kế toán & Đối soát",
          "Kiểm duyệt viên Merchant",
        ].map((role) => (
          <button
            key={role}
            onClick={() => setSelectedRole(role)}
            className={`px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
              selectedRole === role
                ? "bg-primary-container text-white shadow-sm"
                : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            {role}
          </button>
        ))}
      </div>

      {/* Permissions Matrix Table */}
      <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-border flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">
              Ma trận quyền truy cập: <span className="text-primary">{selectedRole}</span>
            </h3>
            <p className="text-xs text-text-muted">
              Đánh dấu tích để cấp quyền tương ứng cho nhóm vai trò này
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100/70 text-slate-700 font-bold uppercase tracking-wider border-b border-border">
                <th className="py-3 px-4">Phân hệ chức năng</th>
                <th className="py-3 px-4 text-center">Xem (Read)</th>
                <th className="py-3 px-4 text-center">Tạo/Sửa (Create)</th>
                <th className="py-3 px-4 text-center">Phê duyệt (Approve)</th>
                <th className="py-3 px-4 text-center">Xóa/Khóa (Delete)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {matrix.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-50 transition">
                  <td className="py-3.5 px-4 font-semibold text-slate-800">
                    {row.module}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <input
                      type="checkbox"
                      checked={row.read}
                      onChange={() => togglePermission(idx, "read")}
                      className="w-4 h-4 rounded text-primary border-slate-300 focus:ring-primary"
                    />
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <input
                      type="checkbox"
                      checked={row.create}
                      onChange={() => togglePermission(idx, "create")}
                      className="w-4 h-4 rounded text-primary border-slate-300 focus:ring-primary"
                    />
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <input
                      type="checkbox"
                      checked={row.approve}
                      onChange={() => togglePermission(idx, "approve")}
                      className="w-4 h-4 rounded text-primary border-slate-300 focus:ring-primary"
                    />
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <input
                      type="checkbox"
                      checked={row.delete}
                      onChange={() => togglePermission(idx, "delete")}
                      className="w-4 h-4 rounded text-primary border-slate-300 focus:ring-primary"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Save Modal (Screen b8bed576) */}
      {showSaveModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-border max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 text-primary">
              <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
                <Icon name="verified_user" className="text-2xl" />
              </div>
              <h3 className="font-bold text-lg text-slate-900">
                Xác nhận cập nhật phân quyền?
              </h3>
            </div>
            <p className="text-sm text-slate-600">
              Bạn sắp áp dụng bảng phân quyền mới cho vai trò{" "}
              <strong className="text-slate-900">{selectedRole}</strong>. Tất cả tài khoản thuộc nhóm này sẽ có hiệu lực ngay lập tức.
            </p>
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                onClick={() => setShowSaveModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Hủy bỏ
              </button>
              <button
                onClick={() => {
                  setShowSaveModal(false);
                  alert("Cập nhật phân quyền thành công!");
                }}
                className="px-4 py-2 text-xs font-semibold text-white bg-primary-container hover:bg-blue-700 rounded-lg transition"
              >
                Xác nhận lưu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
