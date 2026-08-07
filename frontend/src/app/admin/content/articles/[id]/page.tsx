"use client";

import Icon from "@/components/shared/ui/Icon";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { INITIAL_ARTICLES, ContentArticleData } from "../data";

export default function EditArticlePage() {
  const params = useParams();
  const router = useRouter();
  const contentId = (params?.id as string) || "CNT-901";

  const initialArticle = INITIAL_ARTICLES.find((a) => a.contentId === contentId) || INITIAL_ARTICLES[0];

  const [title, setTitle] = useState(initialArticle.title);
  type ContentType = "POLICY" | "ARTICLE";
  const [contentType, setContentType] = useState<ContentType>(initialArticle.contentType);
  const [programId, setProgramId] = useState(initialArticle.programId);
  const [body, setBody] = useState(initialArticle.body);
  type ArticleStatus = "ACTIVE" | "INACTIVE";
  const [status, setStatus] = useState<ArticleStatus>(initialArticle.status);

  const handleSaveArticleChanges = () => {
    if (!title.trim() || !body.trim()) {
      alert("Vui lòng nhập đầy đủ tiêu đề và nội dung!");
      return;
    }

    alert(`Đã lưu thay đổi cho nội dung "${title}" thành công!`);
    router.push("/admin/content/articles");
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-16">
      {/* Top Header Navigation (Breadcrumb ‹ Tên Nội dung) */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href="/admin/content/articles"
            className="w-9 h-9 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-600 hover:bg-slate-50 transition shadow-2xs shrink-0"
            title="Quay lại danh sách bài viết & chính sách"
          >
            <Icon name="chevron_left" className="text-lg" />
          </Link>
          <h1 className="text-xl font-bold text-slate-900 truncate">{title}</h1>
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
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition shadow-xs"
          >
            Lưu thay đổi
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
              onChange={(e) => setProgramId(e.target.value)}
              className="w-full h-11 px-3 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:border-blue-500"
            >
              <option value="PRG-HG-50K">PRG-HG-50K - Voucher Highlands Coffee 50.000đ</option>
              <option value="PRG-CGV-2D">PRG-CGV-2D - Vé xem phim CGV 2D Cuối Tuần</option>
              <option value="PRG-KC-200K">PRG-KC-200K - Buffet Lẩu Kichi Kichi Giảm 20%</option>
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

        {/* Trình soạn thảo Nội dung chi tiết (Kèm thanh công cụ Rich Text Formatting) */}
        <div>
          <label className="block text-xs font-bold text-slate-800 mb-1.5">Nội dung chi tiết</label>
          <div className="border border-slate-200 rounded-xl overflow-hidden focus-within:border-blue-500 transition">
            {/* Rich Text Toolbar */}
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

      {/* Action Footer */}
      <div className="flex items-center justify-end gap-2 pt-2">
        <Link
          href="/admin/content/articles"
          className="px-5 py-2.5 bg-white border border-slate-200 text-slate-600 font-semibold text-xs rounded-xl hover:bg-slate-50 transition"
        >
          Hủy / Quay lại
        </Link>
        <button
          onClick={handleSaveArticleChanges}
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition shadow-xs"
        >
          Lưu thay đổi Bài viết / Chính sách
        </button>
      </div>
    </div>
  );
}
