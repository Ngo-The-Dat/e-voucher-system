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
  AdminBannerListItem,
  VoucherProgramOption,
  AdminApiError,
} from "@/lib/admin-api";

export default function BannersPage() {
  const [banners, setBanners] = useState<AdminBannerListItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [positionFilter, setPositionFilter] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal States - Tạo Banner
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [voucherOptions, setVoucherOptions] = useState<VoucherProgramOption[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [newTitle, setNewTitle] = useState("");
  const [newProgramId, setNewProgramId] = useState<number | "">("");
  const [newImageUrl, setNewImageUrl] = useState("https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=600&auto=format&fit=crop&q=80");
  const [newTargetUrl, setNewTargetUrl] = useState("");
  const [newDisplayPosition, setNewDisplayPosition] = useState("Trượt trang chủ đầu trang");
  const [newDisplayFrom, setNewDisplayFrom] = useState("");
  const [newDisplayTo, setNewDisplayTo] = useState("");
  const [newStatus, setNewStatus] = useState<"ACTIVE" | "INACTIVE">("ACTIVE");

  // Confirm Delete Dialog
  const [confirmDeleteBanner, setConfirmDeleteBanner] = useState<AdminBannerListItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Search debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Load banners from API
  const loadBanners = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await adminApi.getBanners({
        search: debouncedSearch.trim() || undefined,
        status: statusFilter !== "ALL" ? statusFilter : undefined,
        displayPosition: positionFilter !== "ALL" ? positionFilter : undefined,
        page: currentPage,
        limit: 10,
      });
      setBanners(res.banners);
      setTotalPages(res.pagination.totalPages);
      setTotalItems(res.pagination.total);
    } catch (err: any) {
      if (err instanceof AdminApiError) {
        setError(err.message);
      } else {
        setError("Không thể tải danh sách banner quảng cáo.");
      }
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearch, statusFilter, positionFilter, currentPage]);

  useEffect(() => {
    loadBanners();
  }, [loadBanners]);

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

  const handleCreateBanner = async () => {
    if (!newTitle.trim()) {
      toast.error("Vui lòng nhập tiêu đề banner!");
      return;
    }
    if (!newProgramId) {
      toast.error("Vui lòng chọn chương trình voucher liên kết!");
      return;
    }
    if (!newImageUrl.trim()) {
      toast.error("Vui lòng nhập đường dẫn hình ảnh banner!");
      return;
    }

    try {
      setIsSubmitting(true);
      await adminApi.createBanner({
        program_id: Number(newProgramId),
        title: newTitle.trim(),
        image_url: newImageUrl.trim(),
        target_url: newTargetUrl.trim(),
        display_position: newDisplayPosition,
        display_from: newDisplayFrom || undefined,
        display_to: newDisplayTo || undefined,
        status: newStatus,
      });

      setIsAddModalOpen(false);
      setNewTitle("");
      setNewTargetUrl("");
      toast.success("Đã thêm banner quảng cáo mới thành công!");
      loadBanners();
    } catch (err: any) {
      toast.error(err.message || "Không thể tạo banner mới.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!confirmDeleteBanner) return;
    try {
      setIsDeleting(true);
      await adminApi.deleteBanner(confirmDeleteBanner.banner_id);
      toast.success(`Đã xóa banner "${confirmDeleteBanner.title}" thành công!`);
      setConfirmDeleteBanner(null);
      loadBanners();
    } catch (err: any) {
      toast.error(err.message || "Không thể xóa banner.");
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
          <h1 className="text-2xl font-bold text-slate-900">Quản lý Banner Quảng cáo</h1>
          <p className="text-sm text-slate-500 mt-1">
            Quản lý vị trí hiển thị, thời gian chạy và chương trình voucher liên kết
          </p>
        </div>
        <Button
          onClick={handleOpenAddModal}
          className="bg-blue-600 hover:bg-blue-700 text-white text-xs"
        >
          <Icon name="add_photo_alternate" className="text-base mr-2" />
          Thêm Banner mới
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
            placeholder="Tìm banner theo tiêu đề, chương trình liên kết..."
            className="w-full h-[38px] pl-9 pr-4 text-xs sm:text-sm border-slate-200 rounded-xl"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={positionFilter}
            onChange={(e) => {
              setPositionFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="h-[38px] px-3 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">Tất cả vị trí</option>
            <option value="HOME_TOP">HOME_TOP</option>
            <option value="HOME_MIDDLE">HOME_MIDDLE</option>
            <option value="CATEGORY_HEADER">CATEGORY_HEADER</option>
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
            <option value="ACTIVE">Đang chạy</option>
            <option value="INACTIVE">Tạm ẩn</option>
          </select>

          <div className="text-xs text-slate-500 font-semibold whitespace-nowrap">
            Tổng số: <strong className="text-slate-800">{totalItems}</strong> banner
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
          <Button variant="ghost" onClick={loadBanners} className="text-xs text-rose-700 hover:bg-rose-100">
            Thử lại
          </Button>
        </div>
      )}

      {/* Banner Card Rows List */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-white rounded-2xl border border-slate-200 p-5 animate-pulse flex items-center gap-4"
              >
                <div className="w-28 h-16 bg-slate-200 rounded-xl" />
                <div className="space-y-2 flex-1">
                  <div className="h-5 bg-slate-200 rounded w-1/3" />
                  <div className="h-3 bg-slate-100 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : banners.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400 font-medium">
            <Icon name="search_off" className="text-4xl block mb-2 text-slate-300" />
            Không tìm thấy banner nào phù hợp với từ khóa.
          </div>
        ) : (
          banners.map((banner) => (
            <div
              key={banner.banner_id}
              className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-2xs hover:border-blue-300 transition flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              {/* Hình ảnh preview & Thông tin Banner */}
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <div className="w-28 h-16 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden shrink-0">
                  <img
                    src={banner.image_url}
                    alt={banner.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = "none";
                    }}
                  />
                </div>

                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-slate-400">#{banner.banner_id}</span>
                    <h3 className="font-bold text-slate-900 text-sm truncate">{banner.title}</h3>
                    <span
                      className={`px-2.5 py-0.5 text-[11px] font-semibold rounded-full border shrink-0 ${
                        banner.status === "ACTIVE"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-slate-100 text-slate-500 border-slate-200"
                      }`}
                    >
                      {banner.status === "ACTIVE" ? "Đang chạy" : "Tạm ẩn"}
                    </span>
                  </div>

                  <div className="text-xs text-blue-600 font-medium flex items-center gap-1">
                    <Icon name="link" className="text-sm" />
                    <span className="truncate">Chương trình: #{banner.program_id} - {banner.program_name}</span>
                  </div>

                  <div className="text-[11px] text-slate-400 font-medium flex items-center gap-3">
                    <span>Vị trí: <strong className="text-slate-700">{banner.display_position}</strong></span>
                    <span>Thời gian: <strong className="text-slate-700">{formatDateDisplay(banner.display_from)} - {formatDateDisplay(banner.display_to)}</strong></span>
                  </div>
                </div>
              </div>

              {/* Nút Thao Tác */}
              <div className="flex items-center gap-2 shrink-0 border-t md:border-t-0 pt-3 md:pt-0 border-slate-100 justify-end">
                <Link
                  href={`/admin/content/banners/${banner.banner_id}`}
                  className="px-3.5 py-1.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 font-semibold text-xs rounded-xl transition shadow-2xs inline-flex items-center gap-1.5"
                >
                  <Icon name="edit" className="text-base text-slate-500" />
                  Chỉnh sửa
                </Link>

                <button
                  onClick={() => setConfirmDeleteBanner(banner)}
                  className="p-1.5 bg-rose-50 border border-rose-200 text-rose-600 hover:bg-rose-600 hover:text-white rounded-xl transition shadow-2xs"
                  title="Xóa banner"
                >
                  <Icon name="delete" className="text-base block" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {!isLoading && banners.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          itemsPerPage={10}
          onPageChange={setCurrentPage}
          itemName="banner"
        />
      )}

      {/* Modal Thêm Banner Mới */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-lg">Thêm Banner Quảng Cáo Mới</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <Icon name="close" />
              </button>
            </div>

            <div className="space-y-4 text-xs sm:text-sm">
              <FormField label="Tiêu đề Banner" required>
                <Input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Nhập tiêu đề banner..."
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
                <FormField label="Đường dẫn hình ảnh" required>
                  <Input
                    type="text"
                    value={newImageUrl}
                    onChange={(e) => setNewImageUrl(e.target.value)}
                  />
                </FormField>
                <FormField label="Đường dẫn liên kết (Target URL)">
                  <Input
                    type="text"
                    value={newTargetUrl}
                    onChange={(e) => setNewTargetUrl(e.target.value)}
                    placeholder="https://..."
                  />
                </FormField>
              </div>

              <FormField label="Vị trí hiển thị">
                <select
                  value={newDisplayPosition}
                  onChange={(e) => setNewDisplayPosition(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500"
                >
                  <option value="HOME_TOP">HOME_TOP (Trượt trang chủ đầu trang)</option>
                  <option value="HOME_MIDDLE">HOME_MIDDLE (Banner Khuyến Mãi Giữa Trang)</option>
                  <option value="CATEGORY_HEADER">CATEGORY_HEADER (Banner đầu danh mục)</option>
                  <option value="SIDEBAR">SIDEBAR (Banner thanh bên)</option>
                </select>
              </FormField>

              <div className="grid grid-cols-2 gap-3">
                <FormField label="Bắt đầu">
                  <Input
                    type="date"
                    value={newDisplayFrom}
                    onChange={(e) => setNewDisplayFrom(e.target.value)}
                  />
                </FormField>
                <FormField label="Kết thúc">
                  <Input
                    type="date"
                    value={newDisplayTo}
                    onChange={(e) => setNewDisplayTo(e.target.value)}
                  />
                </FormField>
              </div>

              <FormField label="Trạng thái">
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as "ACTIVE" | "INACTIVE")}
                  className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500"
                >
                  <option value="ACTIVE">Đang chạy</option>
                  <option value="INACTIVE">Tạm ẩn</option>
                </select>
              </FormField>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <Button variant="ghost" onClick={() => setIsAddModalOpen(false)}>
                Hủy
              </Button>
              <Button
                onClick={handleCreateBanner}
                disabled={isSubmitting}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isSubmitting ? "Đang thêm..." : "Thêm Banner"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Dialog Xác nhận xóa Banner */}
      {confirmDeleteBanner && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md p-6 space-y-4 text-center">
            <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto">
              <Icon name="delete" className="text-2xl" />
            </div>
            <h4 className="font-bold text-slate-900 text-base">Xác nhận Xóa Banner Quảng cáo</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Bạn có chắc chắn muốn xóa banner <span className="font-bold text-slate-800">"{confirmDeleteBanner.title}"</span> khỏi hệ thống không? Thao tác này không thể hoàn tác.
            </p>
            <div className="flex items-center justify-center gap-3 pt-2">
              <Button variant="ghost" onClick={() => setConfirmDeleteBanner(null)}>
                Hủy thao tác
              </Button>
              <Button
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="bg-rose-600 hover:bg-rose-700 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                {isDeleting ? "Đang xóa..." : "Xác nhận xóa"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
