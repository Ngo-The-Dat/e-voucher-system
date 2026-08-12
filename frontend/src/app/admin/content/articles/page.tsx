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
  AdminContentListItem,
  VoucherProgramOption,
  AdminApiError,
} from "@/lib/admin-api";

export default function ArticlesPage() {
  const [articles, setArticles] = useState<AdminContentListItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [voucherOptions, setVoucherOptions] = useState<VoucherProgramOption[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [confirmDeleteArticle, setConfirmDeleteArticle] = useState<AdminContentListItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form states
  const [newTitle, setNewTitle] = useState("");
  const [newProgramId, setNewProgramId] = useState<number | "">("");
  const [newContentType, setNewContentType] = useState<"ARTICLE" | "POLICY">("ARTICLE");
  const [newBody, setNewBody] = useState("");
  const [newStatus, setNewStatus] = useState<"ACTIVE" | "INACTIVE">("ACTIVE");

  // Search debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Load articles from API
  const loadArticles = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await adminApi.getContents({
        search: debouncedSearch.trim() || undefined,
        status: statusFilter !== "ALL" ? statusFilter : undefined,
        contentType: typeFilter !== "ALL" ? typeFilter : undefined,
        page: currentPage,
        limit: 10,
      });
      setArticles(res.contents);
      setTotalPages(res.pagination.totalPages);
      setTotalItems(res.pagination.total);
    } catch (err: any) {
      if (err instanceof AdminApiError) {
        setError(err.message);
      } else {
        setError("Không thể tải danh sách bài viết & chính sách.");
      }
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearch, statusFilter, typeFilter, currentPage]);

  useEffect(() => {
    loadArticles();
  }, [loadArticles]);

  // Open add modal & load voucher options
  const handleOpenAddModal = async () => {
    try {
      const res = await adminApi.getVoucherOptions();
      setVoucherOptions(res.options);
      if (res.options.length > 0) {
        setNewProgramId(res.options[0].program_id);
      }
      setIsAddModalOpen(true);
    } catch {
      toast.error("Không thể tải danh sách chương trình voucher.");
    }
  };

  const handleCreateArticle = async () => {
    if (!newTitle.trim() || !newBody.trim()) {
      toast.error("Vui lòng nhập đầy đủ tiêu đề và nội dung bài viết!");
      return;
    }
    if (!newProgramId) {
      toast.error("Vui lòng chọn chương trình voucher liên kết!");
      return;
    }

    try {
      setIsSubmitting(true);
      await adminApi.createContent({
        program_id: Number(newProgramId),
        title: newTitle.trim(),
        body: newBody.trim(),
        content_type: newContentType,
        status: newStatus,
      });

      setIsAddModalOpen(false);
      setNewTitle("");
      setNewBody("");
      toast.success("Đã thêm bài viết / chính sách mới thành công!");
      loadArticles();
    } catch (err: any) {
      toast.error(err.message || "Không thể lưu bài viết mới.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!confirmDeleteArticle) return;
    try {
      setIsDeleting(true);
      await adminApi.deleteContent(confirmDeleteArticle.content_id);
      toast.success(`Đã gỡ bài viết "${confirmDeleteArticle.title}" thành công!`);
      setConfirmDeleteArticle(null);
      loadArticles();
    } catch (err: any) {
      toast.error(err.message || "Không thể xóa bài viết.");
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDateDisplay = (dateStr: string | null) => {
    if (!dateStr) return "—";
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString("vi-VN");
    } catch {
      return dateStr;
    }
  };

  const getContentTypeLabel = (type: string) => {
    switch (type) {
      case "POLICY":
        return { label: "Điều khoản chính sách", bg: "bg-purple-50 text-purple-700 border-purple-200" };
      case "ARTICLE":
      default:
        return { label: "Bài viết tin tức", bg: "bg-blue-50 text-blue-700 border-blue-200" };
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Sub-Navbar 4 trang đích */}
      <ContentSubNavbar />

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Quản lý Bài viết & Chính sách</h1>
          <p className="text-sm text-slate-500 mt-1">
            Soạn thảo và đăng tải các bài viết tin tức và điều khoản quy định chính sách
          </p>
        </div>
        <Button
          onClick={handleOpenAddModal}
          className="bg-blue-600 hover:bg-blue-700 text-white text-xs"
        >
          <Icon name="post_add" className="text-base mr-2" />
          Soạn Bài viết / Chính sách mới
        </Button>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative flex-1">
          <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg z-10" />
          <Input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo tiêu đề bài viết, chương trình liên kết..."
            className="w-full h-[38px] pl-9 pr-4 text-xs sm:text-sm border-slate-200 rounded-xl"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="h-[38px] px-3 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">Tất cả loại nội dung</option>
            <option value="ARTICLE">Bài viết tin tức</option>
            <option value="POLICY">Điều khoản chính sách</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="h-[38px] px-3 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="ACTIVE">Hiển thị</option>
            <option value="INACTIVE">Tạm ẩn</option>
          </select>

          <div className="text-xs text-slate-500 font-semibold whitespace-nowrap">
            Tổng số: <strong className="text-slate-800">{totalItems}</strong> bài viết
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
          <Button variant="ghost" onClick={loadArticles} className="text-xs text-rose-700 hover:bg-rose-100">
            Thử lại
          </Button>
        </div>
      )}

      {/* Articles Card Rows List */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-white rounded-2xl border border-slate-200 p-5 animate-pulse flex items-center justify-between"
              >
                <div className="space-y-2 flex-1">
                  <div className="h-5 bg-slate-200 rounded w-1/3" />
                  <div className="h-3 bg-slate-100 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : articles.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400 font-medium">
            <Icon name="search_off" className="text-4xl block mb-2 text-slate-300" />
            Không tìm thấy bài viết hoặc chính sách nào phù hợp.
          </div>
        ) : (
          articles.map((article) => {
            const typeInfo = getContentTypeLabel(article.content_type);

            return (
              <div
                key={article.content_id}
                className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-2xs hover:border-blue-300 transition flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                {/* Nội dung bài viết */}
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className={`px-2.5 py-0.5 font-bold text-xs rounded-md border shrink-0 ${typeInfo.bg}`}>
                      {typeInfo.label}
                    </span>

                    <span className="text-xs font-mono font-bold text-slate-400">#{article.content_id}</span>
                    <h3 className="font-bold text-slate-900 text-sm truncate">{article.title}</h3>

                    <span
                      className={`px-2.5 py-0.5 text-[11px] font-semibold rounded-full border shrink-0 ${
                        article.status === "ACTIVE"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-slate-100 text-slate-500 border-slate-200"
                      }`}
                    >
                      {article.status === "ACTIVE" ? "Hiển thị" : "Tạm ẩn"}
                    </span>
                  </div>

                  <p className="text-xs text-slate-500 line-clamp-1 leading-relaxed">{article.body}</p>

                  <div className="text-[11px] text-slate-400 font-medium flex items-center gap-4">
                    <span>Voucher liên kết: <strong className="text-slate-700">#{article.program_id} - {article.program_name}</strong></span>
                    <span>Ngày tạo: <strong className="text-slate-700">{formatDateDisplay(article.created_at)}</strong></span>
                  </div>
                </div>

                {/* Nút Thao Tác */}
                <div className="flex items-center gap-2 shrink-0 border-t md:border-t-0 pt-3 md:pt-0 border-slate-100 justify-end">
                  <Link
                    href={`/admin/content/articles/${article.content_id}`}
                    className="px-3.5 py-1.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 font-semibold text-xs rounded-xl transition shadow-2xs inline-flex items-center gap-1.5"
                  >
                    <Icon name="edit" className="text-base text-slate-500" />
                    Chỉnh sửa
                  </Link>

                  <button
                    onClick={() => setConfirmDeleteArticle(article)}
                    className="p-1.5 bg-rose-50 border border-rose-200 text-rose-600 hover:bg-rose-600 hover:text-white rounded-xl transition shadow-2xs flex items-center justify-center"
                    title="Xóa bài viết"
                  >
                    <Icon name="delete" className="text-base block" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Pagination */}
      {!isLoading && articles.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          itemsPerPage={10}
          onPageChange={setCurrentPage}
          itemName="bài viết"
        />
      )}

      {/* Modal Thêm Bài Viết Mới */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-lg">Soạn thảo Bài viết / Chính sách Mới</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <Icon name="close" />
              </button>
            </div>

            <div className="space-y-4 text-xs sm:text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <FormField label="Loại nội dung">
                  <select
                    value={newContentType}
                    onChange={(e) => setNewContentType(e.target.value as "ARTICLE" | "POLICY")}
                    className="w-full p-2.5 border border-slate-200 rounded-xl font-semibold focus:outline-none focus:border-blue-500"
                  >
                    <option value="ARTICLE">Bài viết tin tức</option>
                    <option value="POLICY">Điều khoản chính sách</option>
                  </select>
                </FormField>

                <FormField label="Chương trình Voucher liên kết" required>
                  <select
                    value={newProgramId}
                    onChange={(e) => setNewProgramId(Number(e.target.value))}
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500"
                  >
                    {voucherOptions.map((opt) => (
                      <option key={opt.program_id} value={opt.program_id}>
                        #{opt.program_id} - {opt.program_name} ({opt.partner_name})
                      </option>
                    ))}
                  </select>
                </FormField>
              </div>

              <FormField label="Tiêu đề" required>
                <Input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Ví dụ: Quy định sử dụng và hoàn tiền voucher..."
                />
              </FormField>

              <FormField label="Nội dung chi tiết" required>
                <textarea
                  rows={6}
                  value={newBody}
                  onChange={(e) => setNewBody(e.target.value)}
                  placeholder="Nhập nội dung chi tiết bài viết hoặc quy định chính sách..."
                  className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 text-xs sm:text-sm"
                />
              </FormField>

              <FormField label="Trạng thái">
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as "ACTIVE" | "INACTIVE")}
                  className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500"
                >
                  <option value="ACTIVE">Hiển thị</option>
                  <option value="INACTIVE">Tạm ẩn</option>
                </select>
              </FormField>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <Button variant="ghost" onClick={() => setIsAddModalOpen(false)}>
                Hủy
              </Button>
              <Button
                onClick={handleCreateArticle}
                disabled={isSubmitting}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isSubmitting ? "Đang lưu..." : "Lưu Bài Viết / Chính Sách"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Dialog Xác nhận xóa Bài viết */}
      {confirmDeleteArticle && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md p-6 space-y-4 text-center">
            <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto">
              <Icon name="delete" className="text-2xl" />
            </div>
            <h4 className="font-bold text-slate-900 text-base">Xác nhận Gỡ bỏ Bài viết / Chính sách</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Bạn có chắc chắn muốn gỡ bỏ bài viết <span className="font-bold text-slate-800">"{confirmDeleteArticle.title}"</span> khỏi hệ thống không?
            </p>
            <div className="flex items-center justify-center gap-3 pt-2">
              <Button variant="ghost" onClick={() => setConfirmDeleteArticle(null)}>
                Hủy thao tác
              </Button>
              <Button variant="destructive" onClick={handleConfirmDelete} disabled={isDeleting}>
                {isDeleting ? "Đang gỡ bỏ..." : "Xác nhận gỡ bỏ"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
