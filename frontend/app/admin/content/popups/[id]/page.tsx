"use client";

import Icon from "@/components/Icon";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { INITIAL_POPUPS, PopupData } from "../data";

export default function EditPopupPage() {
  const params = useParams();
  const router = useRouter();
  const popupId = (params?.id as string) || "POP-501";

  const initialPopup = INITIAL_POPUPS.find((p) => p.popupId === popupId) || INITIAL_POPUPS[0];

  const [title, setTitle] = useState(initialPopup.title);
  const [content, setContent] = useState(initialPopup.content);
  const [programId, setProgramId] = useState(initialPopup.programId);
  const [imageUrl, setImageUrl] = useState(initialPopup.imageUrl);
  const [targetUrl, setTargetUrl] = useState(initialPopup.targetUrl);
  const [startAt, setStartAt] = useState(initialPopup.startAt);
  const [endAt, setEndAt] = useState(initialPopup.endAt);
  const [status, setStatus] = useState<"ACTIVE" | "INACTIVE">(initialPopup.status);

  const handleSavePopupChanges = () => {
    if (!title.trim()) {
      alert("Vui lòng nhập tiêu đề popup!");
      return;
    }

    alert(`Đã lưu thay đổi cho Popup "${title}" thành công!`);
    router.push("/admin/content/popups");
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-16">
      {/* Top Header Navigation (Breadcrumb ‹ Tên Popup) */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href="/admin/content/popups"
            className="w-9 h-9 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-600 hover:bg-slate-50 transition shadow-2xs shrink-0"
            title="Quay lại danh sách popup"
          >
            <Icon name="chevron_left" className="text-lg" />
          </Link>
          <h1 className="text-xl font-bold text-slate-900 truncate">{title}</h1>
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
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition shadow-xs"
          >
            Lưu thay đổi
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
            onChange={(e) => setProgramId(e.target.value)}
            className="w-full h-11 px-3 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:border-blue-500"
          >
            <option value="PRG-HG-50K">PRG-HG-50K - Voucher Highlands Coffee 50.000đ</option>
            <option value="PRG-CGV-2D">PRG-CGV-2D - Vé xem phim CGV 2D Cuối Tuần</option>
          </select>
        </div>

        {/* Hình ảnh URL & Live Preview Modal xem trước */}
        <div className="space-y-3">
          <label className="block text-xs font-bold text-slate-800">Đường dẫn hình ảnh & Xem trước giao diện Mobile Popup</label>
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
              <div className="h-40 bg-slate-100 overflow-hidden relative">
                <img src={imageUrl} alt={title} className="w-full h-full object-cover" />
              </div>
              <div className="p-4 text-center space-y-2">
                <h4 className="font-bold text-slate-900 text-sm leading-snug">{title}</h4>
                <p className="text-[11px] text-slate-600 leading-relaxed">{content}</p>
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
            className="w-full h-10 px-3 bg-white border border-slate-200 rounded-xl text-xs font-mono text-slate-700 focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Thời gian hiệu lực & Trạng thái */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-slate-100 pt-4">
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1.5">Thời gian bắt đầu</label>
            <input
              type="text"
              value={startAt}
              onChange={(e) => setStartAt(e.target.value)}
              className="w-full h-10 px-3 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1.5">Thời gian kết thúc</label>
            <input
              type="text"
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

      {/* Action Footer */}
      <div className="flex items-center justify-end gap-2 pt-2">
        <Link
          href="/admin/content/popups"
          className="px-5 py-2.5 bg-white border border-slate-200 text-slate-600 font-semibold text-xs rounded-xl hover:bg-slate-50 transition"
        >
          Hủy / Quay lại
        </Link>
        <button
          onClick={handleSavePopupChanges}
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition shadow-xs"
        >
          Lưu thay đổi Popup
        </button>
      </div>
    </div>
  );
}
