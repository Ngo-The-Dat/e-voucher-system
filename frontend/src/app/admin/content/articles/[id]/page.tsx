"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import Icon from "@/components/shared/ui/Icon";
import { toast } from "sonner";
import {
  adminApi,
  AdminContentDetail,
  VoucherProgramOption,
  AdminApiError,
} from "@/lib/admin-api";

export default function EditArticlePage() {
  const params = useParams();
  const router = useRouter();
  const contentId = params?.id ? Number(params.id) : null;

  const [article, setArticle] = useState<AdminContentDetail | null>(null);
  const [voucherOptions, setVoucherOptions] = useState<VoucherProgramOption[]>([]);

  const [title, setTitle] = useState("");
  const [contentType, setContentType] = useState<"POLICY" | "ARTICLE">("ARTICLE");
  const [programId, setProgramId] = useState<number | "">("");
  const [body, setBody] = useState("");
  const [status, setStatus] = useState<"ACTIVE" | "INACTIVE">("ACTIVE");

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!contentId) return;
    try {
      setIsLoading(true);
      setError(null);

      const [articleData, optionsRes] = await Promise.all([
        adminApi.getContent(contentId),
        adminApi.getVoucherOptions(),
      ]);

      setArticle(articleData);
      setVoucherOptions(optionsRes.options);

      setTitle(articleData.title);
      setContentType(articleData.content_type);
      setProgramId(articleData.program_id);
      setBody(articleData.body);
      setStatus(articleData.status);
    } catch (err: any) {
      if (err instanceof AdminApiError) {
        setError(err.message);
      } else {
        setError("Không thể tải thông tin bài viết & chính sách.");
      }
    } finally {
      setIsLoading(false);
    }
  }, [contentId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSaveArticleChanges = async () => {
    if (!title.trim() || !body.trim()) {
      toast.error("Vui lòng nhập đầy đủ tiêu đề và nội dung!");
      return;
    }
    if (!programId) {
      toast.error("Vui lòng chọn chương trình voucher liên kết!");
      return;
    }
    if (!contentId) return;

    try {
      setIsSaving(true);
      await adminApi.updateContent(contentId, {
        program_id: Number(programId),
        title: title.trim(),
        body: body.trim(),
        content_type: contentType,
        status,
      });

      toast.success(`Đã lưu thay đổi cho nội dung "${title}" thành công!`);
      setTimeout(() => {
        router.push("/admin/content/articles");
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

  if (error || !article) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto pb-16 text-center">
        <div className="p-8 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700">
          <Icon name="error" className="text-3xl mb-2" />
          <p className="font-bold">{error || "Không tìm thấy nội dung yêu cầu."}</p>
          <div className="mt-4">
            <Link
              href="/admin/content/articles"
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
            href="/admin/content/articles"
            className="w-9 h-9 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-600 hover:bg-slate-50 transition shadow-2xs shrink-0"
            title="Quay lại danh sách bài viết & chính sách"
          >
            <Icon name="chevron_left" className="text-lg" />
          </Link>
          <div>
            <div className="text-xs text-slate-400 font-mono font-bold">Mã: #{contentId}</div>
            <h1 className="text-xl font-bold text-slate-900 truncate">{title || "Chỉnh sửa bài viết"}</h1>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Link
            href="/admin/content/articles"
            className="px-4 py-2 bg-white border border-slate-200 text-slate-600 font-semibold text-xs rounded-xl hover:bg-slate-50 transition"
          >
            Hủy
          </Link>
          <button
            onClick={handleSaveArticleChanges}
            disabled={isSaving}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition shadow-xs"
          >
            {isSaving ? "Đang lưu..." : "Lưu thay đổi"}
          </button>
        </div>
      </div>

      {/* KHUNG CARD: Thông tin Chỉnh sửa Bài viết & Chính sách */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-5">
        <h3 className="font-bold text-slate-900 text-base border-b border-slate-100 pb-3">
          Thông tin chi tiết Bài viết / Điều khoản chính sách
        </h3>

        {/* Loại nội dung & Voucher liên kết */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1.5">Loại nội dung</label>
            <select
              value={contentType}
              onChange={(e) => setContentType(e.target.value as "POLICY" | "ARTICLE")}
              className="w-full h-11 px-3 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:border-blue-500"
            >
              <option value="ARTICLE">Bài viết tin tức</option>
              <option value="POLICY">Điều khoản chính sách</option>
            </select>
          </div>

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
        </div>

        {/* Tiêu đề */}
        <div>
          <label className="block text-xs font-bold text-slate-800 mb-1.5">
            Tiêu đề bài viết / chính sách <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full h-11 px-4 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Trình soạn thảo Nội dung chi tiết (Kèm Rich Text Toolbar) */}
        <div>
          <label className="block text-xs font-bold text-slate-800 mb-1.5">Nội dung chi tiết</label>
          <div className="border border-slate-200 rounded-xl overflow-hidden focus-within:border-blue-500 transition">
            <div className="bg-slate-50/80 px-3 py-2 border-b border-slate-200 flex items-center justify-between gap-2 overflow-x-auto text-slate-600">
              <div className="flex items-center gap-1">
                <button type="button" className="p-1 hover:bg-slate-200/60 rounded font-bold text-xs w-7 h-7">B</button>
                <button type="button" className="p-1 hover:bg-slate-200/60 rounded italic text-xs w-7 h-7">I</button>
                <button type="button" className="p-1 hover:bg-slate-200/60 rounded line-through text-xs w-7 h-7">S</button>
                <span className="w-px h-4 bg-slate-300 mx-1" />
                <button type="button" className="p-1 hover:bg-slate-200/60 rounded text-xs">
                  <Icon name="link" className="text-base" />
                </button>
                <button type="button" className="p-1 hover:bg-slate-200/60 rounded text-xs font-serif">TT</button>
                <button type="button" className="p-1 hover:bg-slate-200/60 rounded text-xs">
                  <Icon name="format_list_bulleted" className="text-base" />
                </button>
                <button type="button" className="p-1 hover:bg-slate-200/60 rounded text-xs">
                  <Icon name="format_list_numbered" className="text-base" />
                </button>
              </div>
              <div className="flex items-center gap-1">
                <button type="button" className="p-1 hover:bg-slate-200/60 rounded text-xs">
                  <Icon name="undo" className="text-base" />
                </button>
                <button type="button" className="p-1 hover:bg-slate-200/60 rounded text-xs">
                  <Icon name="redo" className="text-base" />
                </button>
              </div>
            </div>

            <textarea
              rows={10}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Nhập nội dung chi tiết bài viết hoặc quy định chính sách..."
              className="w-full p-4 text-sm text-slate-800 focus:outline-none leading-relaxed resize-y"
            />
          </div>
        </div>

        {/* Trạng thái hiển thị */}
        <div>
          <label className="block text-xs font-bold text-slate-800 mb-1.5">Trạng thái hiển thị</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as "ACTIVE" | "INACTIVE")}
            className="w-full sm:w-64 h-10 px-3 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 font-semibold focus:outline-none focus:border-blue-500"
          >
            <option value="ACTIVE">Hiển thị</option>
            <option value="INACTIVE">Tạm ẩn</option>
          </select>
        </div>
      </div>
    </div>
  );
}
