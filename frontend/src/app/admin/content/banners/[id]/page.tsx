/**
 * =========================================================================================
 * FILE: [id]/page.tsx (Admin Edit Banner)
 * VỊ TRÍ: frontend/src/app/admin/content/banners/[id]/
 * VAI TRÒ TRONG HỆ THỐNG:
 *   - Màn hình Chỉnh sửa Chi tiết Banner Quảng cáo (UC-ADM-05).
 *   - Các tính năng chính:
 *       1. Tải song song thông tin Banner và danh sách voucher tùy chọn (`Promise.all([getBanner, getVoucherOptions])`).
 *       2. Cho phép cập nhật Tiêu đề, Vị trí hiển thị (HOME_TOP / HOME_MIDDLE / CATEGORY_TOP), Hình ảnh, Liên kết đích, Khoảng ngày hiển thị.
 *       3. Preview trực quan hình ảnh Banner trước khi lưu thay đổi.
 * =========================================================================================
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import Icon from "@/components/shared/ui/Icon";
import { toast } from "sonner";
import {
  adminApi,
  AdminBannerDetail,
  VoucherProgramOption,
  AdminApiError,
} from "@/lib/admin-api";

export default function EditBannerPage() {
  const params = useParams();
  const router = useRouter();
  const bannerId = params?.id ? Number(params.id) : null;

  // ─── 1. State Dữ liệu Banner & Danh sách Voucher liên kết ───────────────────────────
  const [banner, setBanner] = useState<AdminBannerDetail | null>(null);
  const [voucherOptions, setVoucherOptions] = useState<VoucherProgramOption[]>([]);


  const [title, setTitle] = useState("");
  const [programId, setProgramId] = useState<number | "">("");
  const [imageUrl, setImageUrl] = useState("");
  const [targetUrl, setTargetUrl] = useState("");
  const [displayPosition, setDisplayPosition] = useState("HOME_TOP");
  const [displayFrom, setDisplayFrom] = useState("");
  const [displayTo, setDisplayTo] = useState("");
  const [status, setStatus] = useState<"ACTIVE" | "INACTIVE">("ACTIVE");

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Helper convert ISO timestamp to date input value YYYY-MM-DD
  const toDateInputValue = (dateStr: string | null) => {
    if (!dateStr) return "";
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return "";
      return d.toISOString().split("T")[0];
    } catch {
      return "";
    }
  };

  const loadData = useCallback(async () => {
    if (!bannerId) return;
    try {
      setIsLoading(true);
      setError(null);

      const [bannerData, optionsRes] = await Promise.all([
        adminApi.getBanner(bannerId),
        adminApi.getVoucherOptions(),
      ]);

      setBanner(bannerData);
      setVoucherOptions(optionsRes.options);

      setTitle(bannerData.title);
      setProgramId(bannerData.program_id);
      setImageUrl(bannerData.image_url);
      setTargetUrl(bannerData.target_url || "");
      setDisplayPosition(bannerData.display_position || "HOME_TOP");
      setDisplayFrom(toDateInputValue(bannerData.display_from));
      setDisplayTo(toDateInputValue(bannerData.display_to));
      setStatus(bannerData.status);
    } catch (err: any) {
      if (err instanceof AdminApiError) {
        setError(err.message);
      } else {
        setError("Không thể tải thông tin banner quảng cáo.");
      }
    } finally {
      setIsLoading(false);
    }
  }, [bannerId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSaveBannerChanges = async () => {
    if (!title.trim()) {
      toast.error("Vui lòng nhập tiêu đề banner!");
      return;
    }
    if (!programId) {
      toast.error("Vui lòng chọn chương trình voucher liên kết!");
      return;
    }
    if (!imageUrl.trim()) {
      toast.error("Vui lòng nhập đường dẫn hình ảnh banner!");
      return;
    }
    if (!bannerId) return;

    try {
      setIsSaving(true);
      await adminApi.updateBanner(bannerId, {
        program_id: Number(programId),
        title: title.trim(),
        image_url: imageUrl.trim(),
        target_url: targetUrl.trim(),
        display_position: displayPosition,
        display_from: displayFrom || undefined,
        display_to: displayTo || undefined,
        status,
      });

      toast.success(`Đã lưu thay đổi cho Banner "${title}" thành công!`);
      setTimeout(() => {
        router.push("/admin/content/banners");
      }, 1000);
    } catch (err: any) {
      toast.error(err.message || "Không thể lưu thay đổi.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto pb-16">
        <div className="h-10 bg-slate-200 rounded-xl animate-pulse w-1/3" />
        <div className="h-96 bg-white border border-slate-200 rounded-2xl p-6 animate-pulse" />
      </div>
    );
  }

  if (error || !banner) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto pb-16 text-center">
        <div className="p-8 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700">
          <Icon name="error" className="text-3xl mb-2" />
          <p className="font-bold">{error || "Không tìm thấy banner yêu cầu."}</p>
          <div className="mt-4">
            <Link
              href="/admin/content/banners"
              className="px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-bold"
            >
              Quay lại danh sách
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-16">
      {/* Top Header Navigation */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href="/admin/content/banners"
            className="w-9 h-9 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-600 hover:bg-slate-50 transition shadow-2xs shrink-0"
            title="Quay lại danh sách banner"
          >
            <Icon name="chevron_left" className="text-lg" />
          </Link>
          <div>
            <div className="text-xs text-slate-400 font-mono font-bold">Mã: #{bannerId}</div>
            <h1 className="text-xl font-bold text-slate-900 truncate">{title || "Chỉnh sửa banner"}</h1>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Link
            href="/admin/content/banners"
            className="px-4 py-2 bg-white border border-slate-200 text-slate-600 font-semibold text-xs rounded-xl hover:bg-slate-50 transition"
          >
            Hủy
          </Link>
          <button
            onClick={handleSaveBannerChanges}
            disabled={isSaving}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition shadow-xs"
          >
            {isSaving ? "Đang lưu..." : "Lưu thay đổi"}
          </button>
        </div>
      </div>

      {/* KHUNG CARD: Thông tin Chỉnh sửa Banner */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-5">
        <h3 className="font-bold text-slate-900 text-base border-b border-slate-100 pb-3">
          Thông tin chi tiết Banner Quảng cáo
        </h3>

        {/* Tiêu đề Banner */}
        <div>
          <label className="block text-xs font-bold text-slate-800 mb-1.5">
            Tiêu đề Banner <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full h-11 px-4 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Chương trình Voucher liên kết (FK) */}
        <div>
          <label className="block text-xs font-bold text-slate-800 mb-1.5">
            Chương trình Voucher liên kết <span className="text-rose-500">*</span>
          </label>
          <select
            value={programId}
            onChange={(e) => setProgramId(Number(e.target.value))}
            className="w-full h-11 px-3 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:border-blue-500"
          >
            {voucherOptions.map((opt) => (
              <option key={opt.program_id} value={opt.program_id}>
                #{opt.program_id} - {opt.program_name} ({opt.partner_name})
              </option>
            ))}
          </select>
        </div>

        {/* Đường dẫn hình ảnh & Xem trước */}
        <div className="space-y-3">
          <label className="block text-xs font-bold text-slate-800">
            Đường dẫn hình ảnh & Xem trước Banner <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            className="w-full h-10 px-3 bg-white border border-slate-200 rounded-xl text-xs font-mono text-slate-700 focus:outline-none focus:border-blue-500"
          />

          {/* Khung Xem trước hình ảnh thực tế */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              XEM TRƯỚC HÌNH ẢNH BANNER (LIVE PREVIEW)
            </span>
            <div className="w-full h-48 bg-slate-200 rounded-lg overflow-hidden relative border border-slate-300 flex items-center justify-center">
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt={title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = "none";
                  }}
                />
              ) : (
                <span className="text-xs text-slate-400">Chưa có ảnh preview</span>
              )}
            </div>
          </div>
        </div>

        {/* Đường dẫn liên kết URL */}
        <div>
          <label className="block text-xs font-bold text-slate-800 mb-1.5">Đường dẫn liên kết (Target URL)</label>
          <input
            type="text"
            value={targetUrl}
            onChange={(e) => setTargetUrl(e.target.value)}
            placeholder="https://..."
            className="w-full h-10 px-3 bg-white border border-slate-200 rounded-xl text-xs font-mono text-slate-700 focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Vị trí hiển thị & Trạng thái */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1.5">Vị trí hiển thị</label>
            <select
              value={displayPosition}
              onChange={(e) => setDisplayPosition(e.target.value)}
              className="w-full h-10 px-3 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 font-semibold focus:outline-none focus:border-blue-500"
            >
              <option value="HOME_TOP">HOME_TOP (Trượt trang chủ đầu trang)</option>
              <option value="HOME_MIDDLE">HOME_MIDDLE (Banner Khuyến Mãi Giữa Trang)</option>
              <option value="CATEGORY_HEADER">CATEGORY_HEADER (Banner đầu danh mục)</option>
              <option value="SIDEBAR">SIDEBAR (Banner thanh bên)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1.5">Trạng thái hiển thị</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as "ACTIVE" | "INACTIVE")}
              className="w-full h-10 px-3 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 font-semibold focus:outline-none focus:border-blue-500"
            >
              <option value="ACTIVE">Đang chạy</option>
              <option value="INACTIVE">Tạm ẩn</option>
            </select>
          </div>
        </div>

        {/* Khoảng thời gian chạy banner */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-slate-100 pt-4">
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1.5">Thời gian bắt đầu</label>
            <input
              type="date"
              value={displayFrom}
              onChange={(e) => setDisplayFrom(e.target.value)}
              className="w-full h-10 px-3 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1.5">Thời gian kết thúc</label>
            <input
              type="date"
              value={displayTo}
              onChange={(e) => setDisplayTo(e.target.value)}
              className="w-full h-10 px-3 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
