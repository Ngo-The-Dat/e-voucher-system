"use client";

import { useEffect, useState } from "react";
import TopAppBar from "@/components/partner/layout/TopAppBar";
import Icon from "@/components/shared/ui/Icon";
import StatusBadge from "@/components/shared/ui/StatusBadge";
import Toast from "@/components/shared/ui/Toast";
import CreateEmployeeModal from "@/components/partner/employee/CreateEmployeeModal";
import { Branch } from "@/lib/types/profile";
import { partnerApi } from "@/lib/partner-api";
import { useEmployees } from "@/hooks/useEmployees";

export default function PartnerEmployeesPage() {
  const { employees, isLoading, reload } = useEmployees();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBranchFilter, setSelectedBranchFilter] = useState<string>("ALL");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<"success" | "error">("success");

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToastMessage(message);
    setToastType(type);
    setTimeout(() => setToastMessage(null), 4000);
  };

  useEffect(() => {
    partnerApi.getBranches().then(setBranches).catch((err) => {
      console.error("Failed to load branches", err);
    });
  }, []);

  // Filter employees
  const filteredEmployees = employees.filter((emp) => {
    const matchesSearch =
      emp.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (emp.phone && emp.phone.includes(searchQuery));
    const matchesBranch =
      selectedBranchFilter === "ALL" || String(emp.branch?.id) === selectedBranchFilter;
    return matchesSearch && matchesBranch;
  });

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return "—";
    try {
      return new Date(dateStr).toLocaleDateString("vi-VN");
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-background min-h-screen pb-16 w-full">
      <TopAppBar title="Quản lý nhân viên chi nhánh" />

      {toastMessage && (
        <Toast
          type={toastType}
          message={toastMessage}
        />
      )}

      <main className="p-4 sm:p-6 md:p-8 flex-1 overflow-y-auto max-w-6xl w-full mx-auto space-y-6">
        {/* Header & Action Button */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-on-surface">Danh sách Nhân viên</h2>
            <p className="text-sm text-on-surface-variant mt-0.5">
              Quản lý tài khoản nhân viên phụ trách kiểm tra và đổi voucher tại các chi nhánh.
            </p>
          </div>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="self-start sm:self-auto flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-on-primary font-bold text-sm hover:opacity-95 shadow-sm transition-all cursor-pointer"
          >
            <Icon name="add" className="text-xl font-bold" />
            <span>Thêm nhân viên mới</span>
          </button>
        </div>

        {/* Filters Bar */}
        <div className="bg-surface-bright border border-outline-variant rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row items-center gap-4">
          <div className="relative flex-1 w-full">
            <Icon
              name="search"
              className="text-on-surface-variant absolute left-3.5 top-1/2 -translate-y-1/2 text-xl"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm theo họ tên, email, số điện thoại..."
              className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl pl-10 pr-4 py-2.5 text-sm text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="w-full sm:w-64 shrink-0">
            <select
              value={selectedBranchFilter}
              onChange={(e) => setSelectedBranchFilter(e.target.value)}
              className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl px-3.5 py-2.5 text-sm text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary font-medium"
            >
              <option value="ALL">Tất cả chi nhánh ({branches.length})</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Employee List Table */}
        <div className="bg-surface-bright border border-outline-variant rounded-2xl shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="p-12 text-center text-on-surface-variant flex items-center justify-center gap-3">
              <Icon name="progress_activity" className="animate-spin text-primary text-xl" />
              <span>Đang tải danh sách nhân viên...</span>
            </div>
          ) : filteredEmployees.length === 0 ? (
            <div className="p-12 text-center text-on-surface-variant space-y-3">
              <div className="w-12 h-12 rounded-full bg-surface-container-high flex items-center justify-center mx-auto text-outline">
                <Icon name="group_off" className="text-2xl" />
              </div>
              <p className="font-semibold text-base text-on-surface">Không tìm thấy nhân viên nào</p>
              <p className="text-xs text-on-surface-variant max-w-sm mx-auto">
                {searchQuery || selectedBranchFilter !== "ALL"
                  ? "Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc chi nhánh."
                  : "Chưa có nhân viên nào được tạo. Hãy nhấn 'Thêm nhân viên mới' để tạo tài khoản đầu tiên."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-outline-variant/50 bg-surface-container-low text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                    <th className="py-3.5 px-6">Nhân viên</th>
                    <th className="py-3.5 px-4">Số điện thoại / CCCD</th>
                    <th className="py-3.5 px-4">Chi nhánh phân công</th>
                    <th className="py-3.5 px-4">Trạng thái</th>
                    <th className="py-3.5 px-6 text-right">Ngày tạo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/30">
                  {filteredEmployees.map((emp) => {
                    const initials = emp.full_name
                      .split(" ")
                      .filter(Boolean)
                      .slice(0, 2)
                      .map((w) => w[0].toUpperCase())
                      .join("");

                    return (
                      <tr key={emp.id} className="hover:bg-surface-container-high/40 transition-colors">
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center shrink-0">
                              {initials}
                            </div>
                            <div>
                              <p className="font-bold text-on-surface text-sm leading-tight">
                                {emp.full_name}
                              </p>
                              <p className="text-xs text-on-surface-variant mt-0.5">{emp.email}</p>
                            </div>
                          </div>
                        </td>

                        <td className="py-4 px-4">
                          <p className="font-medium text-on-surface">{emp.phone || "—"}</p>
                          {emp.identity_no && (
                            <p className="text-xs text-on-surface-variant mt-0.5 font-mono">
                              CCCD: {emp.identity_no}
                            </p>
                          )}
                        </td>

                        <td className="py-4 px-4">
                          <span className="inline-flex items-center gap-1.5 font-semibold text-on-surface text-xs bg-surface-container-high px-2.5 py-1 rounded-lg">
                            <Icon name="store" className="text-primary text-sm" />
                            <span>{emp.branch?.name || "Chưa phân công"}</span>
                          </span>
                        </td>

                        <td className="py-4 px-4">
                          <StatusBadge
                            status={emp.approval_status === "APPROVED" ? "active" : "pending"}
                            label={emp.approval_status === "APPROVED" ? "Đang hoạt động" : "Chưa duyệt"}
                          />
                        </td>

                        <td className="py-4 px-6 text-right text-xs text-on-surface-variant font-medium">
                          {formatDate(emp.created_at)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Create Modal */}
      <CreateEmployeeModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => {
          showToast("Tạo tài khoản nhân viên thành công!");
          reload();
        }}
        branches={branches}
      />
    </div>
  );
}
