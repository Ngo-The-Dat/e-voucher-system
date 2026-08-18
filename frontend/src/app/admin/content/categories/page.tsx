"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Icon from "@/components/shared/ui/Icon";
import { toast } from "sonner";
import ContentSubNavbar from "../SubNavbar";
import { Input } from "@/components/shared/ui/Input";
import { Button } from "@/components/shared/ui/Button";
import FormField from "@/components/shared/ui/FormField";
import Pagination from "@/components/shared/ui/Pagination";
import {
  adminApi,
  AdminCategoryListItem,
  AdminApiError,
} from "@/lib/admin-api";

export default function CategoriesPage() {
  const [categories, setCategories] = useState<AdminCategoryListItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal States - Tạo Danh Mục
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [newCatDesc, setNewCatDesc] = useState("");
  const [newCatStatus, setNewCatStatus] = useState<"ACTIVE" | "INACTIVE">("ACTIVE");

  // Rule A1 Warning Modal
  const [warningCat, setWarningCat] = useState<AdminCategoryListItem | null>(null);
  // Confirm Delete Modal
  const [confirmDeleteCat, setConfirmDeleteCat] = useState<AdminCategoryListItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Search debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Load categories from API
  const loadCategories = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await adminApi.getCategories({
        search: debouncedSearch.trim() || undefined,
        status: statusFilter !== "ALL" ? statusFilter : undefined,
        page: currentPage,
        limit: 10,
      });
      setCategories(res.categories);
      setTotalPages(res.pagination.totalPages);
      setTotalItems(res.pagination.total);
    } catch (err: any) {
      if (err instanceof AdminApiError) {
        setError(err.message);
      } else {
        setError("Không thể tải danh sách danh mục.");
      }
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearch, statusFilter, currentPage]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const handleCreateCategory = async () => {
    if (!newCatName.trim()) {
      toast.error("Vui lòng nhập tên danh mục!");
      return;
    }

    try {
      setIsSubmitting(true);
      await adminApi.createCategory({
        category_name: newCatName.trim(),
        description: newCatDesc.trim(),
        status: newCatStatus,
      });

      setIsAddModalOpen(false);
      setNewCatName("");
      setNewCatDesc("");
      setNewCatStatus("ACTIVE");
      toast.success("Đã tạo danh mục mới thành công!");
      loadCategories();
    } catch (err: any) {
      toast.error(err.message || "Không thể tạo danh mục mới.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAttemptDelete = (cat: AdminCategoryListItem) => {
    if (cat.program_count > 0) {
      // Dính quy tắc A1: Từ chối xóa vì có voucher gắn vào
      setWarningCat(cat);
    } else {
      // Cho phép mở dialog xác nhận xóa
      setConfirmDeleteCat(cat);
    }
  };

  const handleConfirmDelete = async () => {
    if (!confirmDeleteCat) return;
    try {
      setIsDeleting(true);
      await adminApi.deleteCategory(confirmDeleteCat.category_id);
      toast.success(`Đã xóa danh mục "${confirmDeleteCat.category_name}" thành công!`);
      setConfirmDeleteCat(null);
      loadCategories();
    } catch (err: any) {
      toast.error(err.message || "Không thể xóa danh mục.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Sub-Navbar 4 trang đích */}
      <ContentSubNavbar />

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Quản lý Danh mục Voucher</h1>
          <p className="text-sm text-slate-500 mt-1">
            Phân loại danh mục hiển thị các chương trình voucher trên ứng dụng và website
          </p>
        </div>
        <Button
          onClick={() => setIsAddModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white text-xs"
        >
          <Icon name="add" className="text-base mr-2" />
          Thêm Danh mục mới
        </Button>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4 sm:p-5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div className="md:col-span-2">
            <FormField label="Tìm kiếm danh mục">
              <div className="relative">
                <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg z-10" />
                <Input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm theo tên danh mục hoặc mã danh mục..."
                  className="w-full h-[38px] pl-9 pr-4 text-xs sm:text-sm border-slate-200 rounded-xl"
                />
              </div>
            </FormField>
          </div>

          <div>
            <FormField label="Trạng thái">
              <div className="relative">
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full h-[38px] pl-3 pr-8 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-500 appearance-none cursor-pointer"
                >
                  <option value="ALL">Tất cả</option>
                  <option value="ACTIVE">Đang hoạt động</option>
                  <option value="INACTIVE">Tạm ẩn</option>
                </select>
                <Icon name="expand_more" className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg pointer-events-none" />
              </div>
            </FormField>
          </div>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon name="error" className="text-base" />
            <span>{error}</span>
          </div>
          <Button variant="ghost" onClick={loadCategories} className="text-xs text-rose-700 hover:bg-rose-100">
            Thử lại
          </Button>
        </div>
      )}

      {/* Categories Card Rows List */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="bg-white rounded-2xl border border-slate-200 p-5 animate-pulse flex items-center justify-between"
              >
                <div className="space-y-2 flex-1">
                  <div className="h-5 bg-slate-200 rounded w-1/4" />
                  <div className="h-3 bg-slate-100 rounded w-1/2" />
                </div>
                <div className="w-24 h-8 bg-slate-100 rounded-xl" />
              </div>
            ))}
          </div>
        ) : categories.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400 font-medium">
            <Icon name="search_off" className="text-4xl block mb-2 text-slate-300" />
            Không tìm thấy danh mục nào phù hợp với từ khóa.
          </div>
        ) : (
          categories.map((cat) => (
            <div
              key={cat.category_id}
              className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-2xs hover:border-blue-300 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              {/* Thông tin Danh mục */}
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono font-bold text-slate-400">#{cat.category_id}</span>
                  <h3 className="font-bold text-slate-900 text-base">{cat.category_name}</h3>
                  <span
                    className={`px-2.5 py-0.5 text-xs font-semibold rounded-full border ${
                      cat.status === "ACTIVE"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-slate-100 text-slate-500 border-slate-200"
                    }`}
                  >
                    {cat.status === "ACTIVE" ? "Đang hoạt động" : "Tạm ẩn"}
                  </span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed max-w-2xl">
                  {cat.description || "Chưa có mô tả danh mục"}
                </p>
              </div>

              {/* Số lượng voucher & Nút Thao Tác */}
              <div className="flex items-center justify-between sm:justify-end gap-5 shrink-0 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100">
                <div className="text-xs font-bold text-slate-700 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200/80">
                  {cat.program_count} Voucher
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    href={`/admin/content/categories/${cat.category_id}`}
                    className="px-3.5 py-1.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 font-semibold text-xs rounded-xl transition shadow-2xs inline-flex items-center gap-1.5"
                  >
                    <Icon name="edit" className="text-base text-slate-500" />
                    Sửa Đổi
                  </Link>

                  <button
                    onClick={() => handleAttemptDelete(cat)}
                    className="p-1.5 bg-rose-50 border border-rose-200 text-rose-600 hover:bg-rose-600 hover:text-white rounded-xl transition shadow-2xs flex items-center justify-center"
                    title="Gỡ bỏ danh mục"
                  >
                    <Icon name="delete" className="text-base block" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {!isLoading && categories.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          itemsPerPage={10}
          onPageChange={setCurrentPage}
          itemName="danh mục"
        />
      )}

      {/* Modal Thêm Danh Mục Mới */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-lg">Thêm Danh mục mới</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <Icon name="close" />
              </button>
            </div>

            <div className="space-y-4">
              <FormField label="Tên danh mục" required>
                <Input
                  type="text"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  placeholder="Ví dụ: Ẩm thực & Trà sữa"
                  className="w-full text-xs sm:text-sm"
                />
              </FormField>

              <FormField label="Mô tả danh mục">
                <textarea
                  rows={3}
                  value={newCatDesc}
                  onChange={(e) => setNewCatDesc(e.target.value)}
                  placeholder="Mô tả tóm tắt phân loại danh mục..."
                  className="w-full p-2.5 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-blue-500"
                />
              </FormField>

              <FormField label="Trạng thái">
                <select
                  value={newCatStatus}
                  onChange={(e) => setNewCatStatus(e.target.value as "ACTIVE" | "INACTIVE")}
                  className="w-full p-2.5 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-blue-500"
                >
                  <option value="ACTIVE">Đang hoạt động</option>
                  <option value="INACTIVE">Tạm ẩn</option>
                </select>
              </FormField>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <Button variant="ghost" onClick={() => setIsAddModalOpen(false)}>
                Hủy
              </Button>
              <Button
                onClick={handleCreateCategory}
                disabled={isSubmitting}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isSubmitting ? "Đang thêm..." : "Thêm danh mục"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Dialog Cảnh báo Từ chối xóa (Luồng A1: Có voucher gắn vào) */}
      {warningCat && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-rose-200 shadow-2xl w-full max-w-md p-6 space-y-4 text-center">
            <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto">
              <Icon name="warning" className="text-2xl" />
            </div>
            <h4 className="font-bold text-slate-900 text-base">Từ Chối Thao Tác Gỡ Bỏ</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Danh mục <span className="font-bold text-slate-800">"{warningCat.category_name}"</span> hiện đang có{" "}
              <span className="font-bold text-rose-600">{warningCat.program_count}</span> voucher liên kết. Hệ thống từ chối xóa để đảm bảo toàn vẹn dữ liệu!
            </p>
            <div className="pt-2">
              <Button
                onClick={() => setWarningCat(null)}
                className="w-full bg-rose-600 hover:bg-rose-700 text-white text-xs"
              >
                Đã hiểu & Đóng thông báo
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Dialog Xác nhận xóa (Khi số lượng voucher === 0) */}
      {confirmDeleteCat && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md p-6 space-y-4 text-center">
            <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto">
              <Icon name="help_outline" className="text-2xl" />
            </div>
            <h4 className="font-bold text-slate-900 text-base">Xác nhận Gỡ bỏ Danh mục</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Bạn có chắc chắn muốn gỡ bỏ danh mục <span className="font-bold text-slate-800">"{confirmDeleteCat.category_name}"</span> khỏi hệ thống không?
            </p>
            <div className="flex items-center justify-center gap-3 pt-2">
              <Button variant="ghost" onClick={() => setConfirmDeleteCat(null)}>
                Hủy thao tác
              </Button>
              <Button
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="bg-rose-600 hover:bg-rose-700 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                {isDeleting ? "Đang gỡ bỏ..." : "Xác nhận gỡ bỏ"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
