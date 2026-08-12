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
  AdminPopupListItem,
  VoucherProgramOption,
  AdminApiError,
} from "@/lib/admin-api";

export default function PopupsPage() {
  const [popups, setPopups] = useState<AdminPopupListItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
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

  const [previewPopup, setPreviewPopup] = useState<AdminPopupListItem | null>(null);
  const [confirmDeletePopup, setConfirmDeletePopup] = useState<AdminPopupListItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form states
  const [newTitle, setNewTitle] = useState("");
  const [newProgramId, setNewProgramId] = useState<number | "">("");
  const [newContent, setNewContent] = useState("");
  const [newTargetUrl, setNewTargetUrl] = useState("");
  const [newImageUrl, setNewImageUrl] = useState("https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=500&auto=format&fit=crop&q=80");
  const [newStartAt, setNewStartAt] = useState("");
  const [newEndAt, setNewEndAt] = useState("");
  const [newStatus, setNewStatus] = useState<"ACTIVE" | "INACTIVE">("ACTIVE");

  // Search debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Load popups from API
  const loadPopups = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await adminApi.getPopups({
        search: debouncedSearch.trim() || undefined,
        status: statusFilter !== "ALL" ? statusFilter : undefined,
        page: currentPage,
        limit: 10,
      });
      setPopups(res.popups);
      setTotalPages(res.pagination.totalPages);
      setTotalItems(res.pagination.total);
    } catch (err: any) {
      if (err instanceof AdminApiError) {
        setError(err.message);
      } else {
        setError("Không thể tải danh sách popup truyền thông.");
      }
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearch, statusFilter, currentPage]);

  useEffect(() => {
    loadPopups();
  }, [loadPopups]);

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

  const handleCreatePopup = async () => {
    if (!newTitle.trim()) {
      toast.error("Vui lòng nhập tiêu đề popup!");
      return;
    }
    if (!newProgramId) {
      toast.error("Vui lòng chọn chương trình voucher liên kết!");
      return;
    }

    try {
      setIsSubmitting(true);
      await adminApi.createPopup({
        program_id: Number(newProgramId),
        title: newTitle.trim(),
        content: newContent.trim(),
        target_url: newTargetUrl.trim(),
        image_url: newImageUrl.trim(),
        start_at: newStartAt || undefined,
        end_at: newEndAt || undefined,
        status: newStatus,
      });

      setIsAddModalOpen(false);
      setNewTitle("");
      setNewContent("");
      setNewTargetUrl("");
      toast.success("Đã thêm popup truyền thông mới thành công!");
      loadPopups();
    } catch (err: any) {
      toast.error(err.message || "Không thể tạo popup mới.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!confirmDeletePopup) return;
    try {
      setIsDeleting(true);
      await adminApi.deletePopup(confirmDeletePopup.popup_id);
      toast.success(`Đã xóa popup "${confirmDeletePopup.title}" thành công!`);
      setConfirmDeletePopup(null);
      loadPopups();
    } catch (err: any) {
      toast.error(err.message || "Không thể xóa popup.");
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

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Sub-Navbar 4 trang đích */}
      <ContentSubNavbar />

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Quản lý Popup Truyền thông</h1>
          <p className="text-sm text-slate-500 mt-1">
            Quản lý popup thông báo khuyến mãi khi người dùng mở ứng dụng/website
          </p>
        </div>
        <Button
          onClick={handleOpenAddModal}
          className="bg-blue-600 hover:bg-blue-700 text-white text-xs"
        >
          <Icon name="add" className="text-base mr-2" />
          Thêm Popup mới
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
            placeholder="Tìm theo tiêu đề popup, chương trình voucher..."
            className="w-full h-[38px] pl-9 pr-4 text-xs sm:text-sm border-slate-200 rounded-xl"
          />
        </div>

        <div className="flex items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="h-[38px] px-3 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="ACTIVE">Đang bật</option>
            <option value="INACTIVE">Tạm ẩn</option>
          </select>

          <div className="text-xs text-slate-500 font-semibold whitespace-nowrap">
            Tổng số: <strong className="text-slate-800">{totalItems}</strong> popup
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
          <Button variant="ghost" onClick={loadPopups} className="text-xs text-rose-700 hover:bg-rose-100">
            Thử lại
          </Button>
        </div>
      )}

      {/* Popups Card Rows List */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-white rounded-2xl border border-slate-200 p-5 animate-pulse flex items-center gap-4"
              >
                <div className="w-16 h-16 bg-slate-200 rounded-xl" />
                <div className="space-y-2 flex-1">
                  <div className="h-5 bg-slate-200 rounded w-1/4" />
                  <div className="h-3 bg-slate-100 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : popups.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400 font-medium">
            <Icon name="search_off" className="text-4xl block mb-2 text-slate-300" />
            Không tìm thấy popup nào phù hợp với từ khóa.
          </div>
        ) : (
          popups.map((popup) => (
            <div
              key={popup.popup_id}
              className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-2xs hover:border-blue-300 transition flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              {/* Hình ảnh preview & Nội dung Popup */}
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <div className="w-16 h-16 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden shrink-0">
                  <img
                    src={popup.image_url}
                    alt={popup.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = "none";
                    }}
                  />
                </div>

                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-slate-400">#{popup.popup_id}</span>
                    <h3 className="font-bold text-slate-900 text-sm truncate">{popup.title}</h3>
                    <span
                      className={`px-2.5 py-0.5 text-[11px] font-semibold rounded-full border shrink-0 ${
                        popup.status === "ACTIVE"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-slate-100 text-slate-500 border-slate-200"
                      }`}
                    >
                      {popup.status === "ACTIVE" ? "Đang bật" : "Tạm ẩn"}
                    </span>
                  </div>

                  <p className="text-xs text-slate-500 line-clamp-1">{popup.content || "Không có nội dung mô tả"}</p>

                  <div className="text-[11px] text-slate-400 font-medium flex items-center gap-3">
                    <span>Voucher: <strong className="text-blue-600">#{popup.program_id} - {popup.program_name}</strong></span>
                    <span>Hiệu lực: <strong className="text-slate-700">{formatDateDisplay(popup.start_at)} - {formatDateDisplay(popup.end_at)}</strong></span>
                  </div>
                </div>
              </div>

              {/* Nút Thao Tác */}
              <div className="flex items-center gap-2 shrink-0 border-t md:border-t-0 pt-3 md:pt-0 border-slate-100 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setPreviewPopup(popup)}
                  className="px-3 py-1.5 text-blue-600 border-blue-200 hover:bg-blue-600 hover:text-white"
                >
                  Xem trước
                </Button>

                <Link
                  href={`/admin/content/popups/${popup.popup_id}`}
                  className="px-3.5 py-1.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 font-semibold text-xs rounded-xl transition shadow-2xs inline-flex items-center gap-1.5"
                >
                  <Icon name="edit" className="text-base text-slate-500" />
                  Chỉnh sửa
                </Link>

                <button
                  onClick={() => setConfirmDeletePopup(popup)}
                  className="p-1.5 bg-rose-50 border border-rose-200 text-rose-600 hover:bg-rose-600 hover:text-white rounded-xl transition shadow-2xs flex items-center justify-center"
                  title="Xóa popup"
                >
                  <Icon name="delete" className="text-base block" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {!isLoading && popups.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          itemsPerPage={10}
          onPageChange={setCurrentPage}
          itemName="popup"
        />
      )}

      {/* Modal Thêm Popup Mới */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-lg">Thêm Popup Mới</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <Icon name="close" />
              </button>
            </div>

            <div className="space-y-4 text-xs sm:text-sm">
              <FormField label="Tiêu đề Popup" required>
                <Input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Nhập tiêu đề popup thông báo..."
                />
              </FormField>

              <FormField label="Nội dung chi tiết">
                <textarea
                  rows={3}
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder="Nội dung mô tả ngắn..."
                  className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500"
                />
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <FormField label="Đường dẫn hình ảnh">
                  <Input
                    type="text"
                    value={newImageUrl}
                    onChange={(e) => setNewImageUrl(e.target.value)}
                  />
                </FormField>
                <FormField label="Liên kết đính kèm (Target URL)">
                  <Input
                    type="text"
                    value={newTargetUrl}
                    onChange={(e) => setNewTargetUrl(e.target.value)}
                    placeholder="https://..."
                  />
                </FormField>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <FormField label="Bắt đầu">
                  <Input
                    type="date"
                    value={newStartAt}
                    onChange={(e) => setNewStartAt(e.target.value)}
                  />
                </FormField>
                <FormField label="Kết thúc">
                  <Input
                    type="date"
                    value={newEndAt}
                    onChange={(e) => setNewEndAt(e.target.value)}
                  />
                </FormField>
              </div>

              <FormField label="Trạng thái">
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as "ACTIVE" | "INACTIVE")}
                  className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500"
                >
                  <option value="ACTIVE">Đang bật</option>
                  <option value="INACTIVE">Tạm ẩn</option>
                </select>
              </FormField>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <Button variant="ghost" onClick={() => setIsAddModalOpen(false)}>
                Hủy
              </Button>
              <Button
                onClick={handleCreatePopup}
                disabled={isSubmitting}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isSubmitting ? "Đang thêm..." : "Thêm Popup"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Live Preview Popup */}
      {previewPopup && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-sm overflow-hidden relative">
            <button
              onClick={() => setPreviewPopup(null)}
              className="absolute right-3 top-3 w-8 h-8 bg-slate-900/60 text-white rounded-full flex items-center justify-center z-10 hover:bg-slate-900 transition"
            >
              <Icon name="close" className="text-base" />
            </button>
            <div className="h-44 bg-slate-100 overflow-hidden relative">
              <img
                src={previewPopup.image_url}
                alt={previewPopup.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = "none";
                }}
              />
            </div>
            <div className="p-5 text-center space-y-3">
              <h4 className="font-bold text-slate-900 text-base leading-snug">{previewPopup.title}</h4>
              <p className="text-xs text-slate-600 leading-relaxed">{previewPopup.content}</p>
              <div className="pt-2">
                <button
                  onClick={() => setPreviewPopup(null)}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition shadow-xs"
                >
                  Khám phá ngay
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Dialog Xác nhận xóa Popup */}
      {confirmDeletePopup && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md p-6 space-y-4 text-center">
            <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto">
              <Icon name="delete" className="text-2xl" />
            </div>
            <h4 className="font-bold text-slate-900 text-base">Xác nhận Xóa Popup Truyền thông</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Bạn có chắc chắn muốn xóa popup <span className="font-bold text-slate-800">"{confirmDeletePopup.title}"</span> khỏi hệ thống không?
            </p>
            <div className="flex items-center justify-center gap-3 pt-2">
              <Button variant="ghost" onClick={() => setConfirmDeletePopup(null)}>
                Hủy thao tác
              </Button>
              <Button variant="destructive" onClick={handleConfirmDelete} disabled={isDeleting}>
                {isDeleting ? "Đang xóa..." : "Xác nhận xóa"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
