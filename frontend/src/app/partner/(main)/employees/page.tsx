"use client";

import { useEffect, useState } from "react";
import TopAppBar from "@/components/partner/layout/TopAppBar";
import Icon from "@/components/shared/ui/Icon";
import StatusBadge from "@/components/shared/ui/StatusBadge";
import Pagination from "@/components/shared/ui/Pagination";
import Toast from "@/components/shared/ui/Toast";
import CreateEmployeeModal from "@/components/partner/employee/CreateEmployeeModal";
import { Branch } from "@/lib/types/profile";
import { partnerApi } from "@/lib/partner-api";
import { useEmployees } from "@/hooks/useEmployees";

const ITEMS_PER_PAGE = 5;

export default function PartnerEmployeesPage() {
  const { employees, isLoading, reload } = useEmployees();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBranchFilter, setSelectedBranchFilter] = useState<string>("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<"success" | "error">("success");

  /** Hiển thị thông báo Toast tự động ẩn sau 4 giây */
  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToastMessage(message);
    setToastType(type);
    setTimeout(() => setToastMessage(null), 4000);
  };

  /** Tải danh sách chi nhánh để hiển thị trong dropdown bộ lọc */
  useEffect(() => {
    partnerApi.getBranches().then(setBranches).catch((err) => {
      console.error("Failed to load branches", err);
    });
  }, []);

  /** Lọc danh sách nhân viên theo từ khóa tìm kiếm và chi nhánh đã chọn */
  const filteredEmployees = employees.filter((emp) => {
    const matchesSearch =
      emp.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (emp.phone && emp.phone.includes(searchQuery));
    const matchesBranch =
      selectedBranchFilter === "ALL" || String(emp.branch?.id) === selectedBranchFilter;
    return matchesSearch && matchesBranch;
  });

  // Phân trang
  const totalPages = Math.max(1, Math.ceil(filteredEmployees.length / ITEMS_PER_PAGE));
  const paginatedEmployees = filteredEmployees.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleSearch = (q: string) => {
    setSearchQuery(q);
    setCurrentPage(1);
  };

  const handleBranchFilter = (branchId: string) => {
    setSelectedBranchFilter(branchId);
    setCurrentPage(1);
  };

  /** Định dạng ngày tháng hiển thị theo chuẩn Việt Nam */
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

      <main className="p-6 md:p-8 flex-1 overflow-y-auto w-full max-w-none space-y-6">
        {/* Header tiêu đề và nút Thêm mới */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-on-surface">Danh sách Nhân viên</h2>
            <p className="text-base text-on-surface-variant mt-0.5">
              Quản lý tài khoản nhân viên phụ trách kiểm tra và đổi voucher tại các chi nhánh.
            </p>
          </div>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="self-start sm:self-auto flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-on-primary font-bold text-base hover:opacity-95 shadow-sm transition-all cursor-pointer"
          >
            <Icon name="add" className="text-xl font-bold" />
            <span>Thêm nhân viên mới</span>
          </button>
        </div>

        {/* Thanh công cụ tìm kiếm và lọc chi nhánh */}
        <div className="bg-surface-bright border border-outline-variant rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row items-center gap-4">
          <div className="relative flex-1 w-full">
            <Icon
              name="search"
              className="text-on-surface-variant absolute left-3.5 top-1/2 -translate-y-1/2 text-xl"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Tìm kiếm theo họ tên, email, số điện thoại..."
              className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl pl-10 pr-4 py-2.5 text-base text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="w-full sm:w-64 shrink-0">
            <select
              value={selectedBranchFilter}
              onChange={(e) => handleBranchFilter(e.target.value)}
              className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl px-3.5 py-2.5 text-base text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary font-medium"
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

        {/* Bảng danh sách nhân viên */}
        <div className="bg-surface-bright border border-outline-variant rounded-xl shadow-sm overflow-hidden w-full">
          {isLoading ? (
            <table className="w-full">
              <tbody>
                {Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-outline-variant animate-pulse">
                    {Array.from({ length: 5 }).map((__, j) => (
                      <td key={j} className="py-4 px-6">
                        <div className="h-4 bg-surface-container-high rounded w-3/4" />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          ) : filteredEmployees.length === 0 ? (
            <div className="p-12 text-center text-on-surface-variant space-y-3">
              <div className="w-12 h-12 rounded-full bg-surface-container-high flex items-center justify-center mx-auto text-outline">
                <Icon name="group_off" className="text-2xl" />
              </div>
              <p className="font-semibold text-lg text-on-surface">Không tìm thấy nhân viên nào</p>
              <p className="text-sm text-on-surface-variant max-w-md mx-auto">
                {searchQuery || selectedBranchFilter !== "ALL"
                  ? "Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc chi nhánh."
                  : "Chưa có nhân viên nào được tạo. Hãy nhấn 'Thêm nhân viên mới' để tạo tài khoản đầu tiên."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left border-collapse text-base">
                <thead>
                  <tr className="bg-surface-container-low border-b border-outline-variant">
                    <th className="py-4 px-6 font-semibold text-on-surface-variant whitespace-nowrap">Nhân viên</th>
                    <th className="py-4 px-6 font-semibold text-on-surface-variant whitespace-nowrap">Số điện thoại / CCCD</th>
                    <th className="py-4 px-6 font-semibold text-on-surface-variant whitespace-nowrap">Chi nhánh phân công</th>
                    <th className="py-4 px-6 font-semibold text-on-surface-variant whitespace-nowrap">Trạng thái</th>
                    <th className="py-4 px-6 font-semibold text-on-surface-variant text-right whitespace-nowrap">Ngày tạo</th>
                  </tr>
                </thead>
                <tbody className="text-base text-on-surface divide-y divide-outline-variant">
                  {paginatedEmployees.map((emp) => {
                    const initials = emp.full_name
                      .split(" ")
                      .filter(Boolean)
                      .slice(0, 2)
                      .map((w) => w[0].toUpperCase())
                      .join("");

                    return (
                      <tr key={emp.id} className="hover:bg-surface-container-low/40 transition-colors">
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary/10 text-primary font-bold text-sm flex items-center justify-center shrink-0">
                              {initials}
                            </div>
                            <div>
                              <p className="font-bold text-on-surface text-base leading-tight">
                                {emp.full_name}
                              </p>
                              <p className="text-sm text-on-surface-variant mt-0.5">{emp.email}</p>
                            </div>
                          </div>
                        </td>

                        <td className="py-4 px-6 whitespace-nowrap">
                          <p className="font-medium text-on-surface text-base">{emp.phone || "—"}</p>
                          {emp.identity_no && (
                            <p className="text-xs text-on-surface-variant mt-0.5 font-mono">
                              CCCD: {emp.identity_no}
                            </p>
                          )}
                        </td>

                        <td className="py-4 px-6 whitespace-nowrap">
                          <span className="inline-flex items-center gap-1.5 font-semibold text-on-surface text-sm bg-surface-container-high px-3 py-1 rounded-lg border border-outline-variant">
                            <Icon name="store" className="text-primary text-base" />
                            <span>{emp.branch?.name || "Chưa phân công"}</span>
                          </span>
                        </td>

                        <td className="py-4 px-6 whitespace-nowrap">
                          <StatusBadge
                            status={emp.approval_status === "APPROVED" ? "active" : "pending"}
                            label={emp.approval_status === "APPROVED" ? "Đang hoạt động" : "Chưa duyệt"}
                          />
                        </td>

                        <td className="py-4 px-6 text-right text-sm text-on-surface-variant font-medium whitespace-nowrap">
                          {formatDate(emp.created_at)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {!isLoading && filteredEmployees.length > 0 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredEmployees.length}
              itemsPerPage={ITEMS_PER_PAGE}
              onPageChange={(page) => setCurrentPage(page)}
              itemName="nhân viên"
            />
          )}
        </div>
      </main>

      {/* Modal thêm mới nhân viên */}
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
