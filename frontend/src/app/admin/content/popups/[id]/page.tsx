"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import Icon from "@/components/shared/ui/Icon";
import { toast } from "sonner";
import {
  adminApi,
  AdminPopupDetail,
  VoucherProgramOption,
  AdminApiError,
} from "@/lib/admin-api";

export default function EditPopupPage() {
  const params = useParams();
  const router = useRouter();
  const popupId = params?.id ? Number(params.id) : null;

  const [popup, setPopup] = useState<AdminPopupDetail | null>(null);
  const [voucherOptions, setVoucherOptions] = useState<VoucherProgramOption[]>([]);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [programId, setProgramId] = useState<number | "">("");
  const [imageUrl, setImageUrl] = useState("");
  const [targetUrl, setTargetUrl] = useState("");
  const [startAt, setStartAt] = useState("");
  const [endAt, setEndAt] = useState("");
  const [status, setStatus] = useState<"ACTIVE" | "INACTIVE">("ACTIVE");

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    if (!popupId) return;
    try {
      setIsLoading(true);
      setError(null);

      const [popupData, optionsRes] = await Promise.all([
        adminApi.getPopup(popupId),
        adminApi.getVoucherOptions(),
      ]);

      setPopup(popupData);
      setVoucherOptions(optionsRes.options);

      setTitle(popupData.title);
      setContent(popupData.content || "");
      setProgramId(popupData.program_id);
      setImageUrl(popupData.image_url || "");
      setTargetUrl(popupData.target_url || "");
      setStartAt(toDateInputValue(popupData.start_at));
      setEndAt(toDateInputValue(popupData.end_at));
      setStatus(popupData.status);
    } catch (err: any) {
      if (err instanceof AdminApiError) {
        setError(err.message);
      } else {
        setError("Không thể tải thông tin popup truyền thông.");
      }
    } finally {
      setIsLoading(false);
    }
  }, [popupId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSavePopupChanges = async () => {
    if (!title.trim()) {
      toast.error("Vui lòng nhập tiêu đề popup!");
      return;
    }
    if (!programId) {
      toast.error("Vui lòng chọn chương trình voucher liên kết!");
      return;
    }
    if (!popupId) return;

    try {
      setIsSaving(true);
      await adminApi.updatePopup(popupId, {
        program_id: Number(programId),
        title: title.trim(),
        content: content.trim(),
        target_url: targetUrl.trim(),
        image_url: imageUrl.trim(),
        start_at: startAt || undefined,
        end_at: endAt || undefined,
        status,
      });

      toast.success(`Đã lưu thay đổi cho Popup "${title}" thành công!`);
      setTimeout(() => {
        router.push("/admin/content/popups");
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

  if (error || !popup) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto pb-16 text-center">
        <div className="p-8 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700">
          <Icon name="error" className="text-3xl mb-2" />
          <p className="font-bold">{error || "Không tìm thấy popup yêu cầu."}</p>
          <div className="mt-4">
            <Link
              href="/admin/content/popups"
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
            href="/admin/content/popups"
            className="w-9 h-9 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-600 hover:bg-slate-50 transition shadow-2xs shrink-0"
            title="Quay lại danh sách popup"
          >
            <Icon name="chevron_left" className="text-lg" />
          </Link>
          <div>
            <div className="text-xs text-slate-400 font-mono font-bold">Mã: #{popupId}</div>
            <h1 className="text-xl font-bold text-slate-900 truncate">{title || "Chỉnh sửa popup"}</h1>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Link
            href="/admin/content/popups"
            className="px-4 py-2 bg-white border border-slate-200 text-slate-600 font-semibold text-xs rounded-xl hover:bg-slate-50 transition"
          >
            Hủy
          </Link>
          <button
            onClick={handleSavePopupChanges}
            disabled={isSaving}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition shadow-xs"
          >
            {isSaving ? "Đang lưu..." : "Lưu thay đổi"}
          </button>
        </div>
      </div>

      {/* KHUNG CARD: Thông tin Chỉnh sửa Popup */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-5">
        <h3 className="font-bold text-slate-900 text-base border-b border-slate-100 pb-3">
          Thông tin chi tiết Popup Truyền thông
        </h3>

        {/* Tiêu đề Popup */}
        <div>
          <label className="block text-xs font-bold text-slate-800 mb-1.5">
            Tiêu đề Popup <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full h-11 px-4 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Nội dung tóm tắt */}
        <div>
          <label className="block text-xs font-bold text-slate-800 mb-1.5">Nội dung chi tiết</label>
          <textarea
            rows={3}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-blue-500"
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

        {/* Hình ảnh URL & Live Mobile Preview */}
        <div className="space-y-3">
          <label className="block text-xs font-bold text-slate-800">
            Đường dẫn hình ảnh & Xem trước giao diện Mobile Popup
          </label>
          <input
            type="text"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            className="w-full h-10 px-3 bg-white border border-slate-200 rounded-xl text-xs font-mono text-slate-700 focus:outline-none focus:border-blue-500"
          />

          {/* Live Mobile Preview Card */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col items-center">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-3">
              MÔ PHỎNG HIỂN THỊ TRÊN MÀN HÌNH (LIVE MOBILE PREVIEW)
            </span>

            <div className="bg-white rounded-3xl border border-slate-200 shadow-xl w-full max-w-xs overflow-hidden relative">
              <div className="h-40 bg-slate-100 overflow-hidden relative flex items-center justify-center">
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
              <div className="p-4 text-center space-y-2">
                <h4 className="font-bold text-slate-900 text-sm leading-snug">{title || "Tiêu đề Popup"}</h4>
                <p className="text-[11px] text-slate-600 leading-relaxed">{content || "Nội dung mô tả ngắn popup..."}</p>
                <div className="pt-2">
                  <button type="button" className="w-full py-2 bg-blue-600 text-white font-bold text-xs rounded-xl">
                    Khám phá ngay
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Liên kết URL */}
        <div>
          <label className="block text-xs font-bold text-slate-800 mb-1.5">Liên kết đính kèm (Target URL)</label>
          <input
            type="text"
            value={targetUrl}
            onChange={(e) => setTargetUrl(e.target.value)}
            placeholder="https://..."
            className="w-full h-10 px-3 bg-white border border-slate-200 rounded-xl text-xs font-mono text-slate-700 focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Thời gian hiệu lực & Trạng thái */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-slate-100 pt-4">
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1.5">Thời gian bắt đầu</label>
            <input
              type="date"
              value={startAt}
              onChange={(e) => setStartAt(e.target.value)}
              className="w-full h-10 px-3 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1.5">Thời gian kết thúc</label>
            <input
              type="date"
              value={endAt}
              onChange={(e) => setEndAt(e.target.value)}
              className="w-full h-10 px-3 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1.5">Trạng thái</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as "ACTIVE" | "INACTIVE")}
              className="w-full h-10 px-3 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 font-semibold focus:outline-none focus:border-blue-500"
            >
              <option value="ACTIVE">Đang bật</option>
              <option value="INACTIVE">Tạm ẩn</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
