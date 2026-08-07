"use client";

import Icon from "@/components/admin/Icon";

import { useState } from "react";
import Link from "next/link";
import ContentSubNavbar from "../SubNavbar";
import { INITIAL_POPUPS, PopupData } from "./data";

export default function PopupsPage() {
  const [popups, setPopups] = useState<PopupData[]>(INITIAL_POPUPS);
  const [searchQuery, setSearchQuery] = useState("");

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [previewPopup, setPreviewPopup] = useState<PopupData | null>(null);
  const [confirmDeletePopup, setConfirmDeletePopup] = useState<PopupData | null>(null);

  // Form states
  const [newTitle, setNewTitle] = useState("");
  const [newProgramId, setNewProgramId] = useState("PRG-HG-50K");
  const [newContent, setNewContent] = useState("");
  const [newTargetUrl, setNewTargetUrl] = useState("");
  const [newImageUrl, setNewImageUrl] = useState("https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=500&auto=format&fit=crop&q=80");
  const [newStartAt, setNewStartAt] = useState("01/08/2026 00:00");
  const [newEndAt, setNewEndAt] = useState("31/08/2026 23:59");
  const [newStatus, setNewStatus] = useState<"ACTIVE" | "INACTIVE">("ACTIVE");

  const filteredPopups = popups.filter(
    (p) =>
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.programTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.popupId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreatePopup = () => {
    if (!newTitle.trim()) {
      alert("Vui lòng nhập tiêu đề popup!");
      return;
    }

    const progTitle = newProgramId === "PRG-HG-50K" ? "Voucher Highlands Coffee 50.000đ" : "Vé xem phim CGV 2D Cuối Tuần";

    const newId = `POP-50${popups.length + 1}`;
    const newPopup: PopupData = {
      popupId: newId,
      programId: newProgramId,
      programTitle: progTitle,
      title: newTitle,
      content: newContent,
      targetUrl: newTargetUrl,
      imageUrl: newImageUrl,
      startAt: newStartAt,
      endAt: newEndAt,
      status: newStatus,
    };

    setPopups((prev) => [...prev, newPopup]);
    setIsAddModalOpen(false);
    setNewTitle("");
    setNewContent("");
  };

  const handleConfirmDelete = () => {
    if (!confirmDeletePopup) return;
    setPopups((prev) => prev.filter((p) => p.popupId !== confirmDeletePopup.popupId));
    setConfirmDeletePopup(null);
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
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition shadow-xs flex items-center gap-2"
        >
          <Icon name="add" className="text-base" />
          Thêm Popup mới
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative flex-1">
          <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo tiêu đề popup, chương trình voucher..."
            className="w-full h-[38px] pl-9 pr-4 text-xs sm:text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500"
          />
        </div>
        <div className="text-xs text-slate-500 font-semibold">
          Tổng số: <strong className="text-slate-800">{popups.length}</strong> popup
        </div>
      </div>

      {/* Popups Card Rows List */}
      <div className="space-y-3">
        {filteredPopups.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400 font-medium">
            <Icon name="search_off" className="text-4xl block mb-2 text-slate-300" />
            Không tìm thấy popup nào phù hợp với từ khóa.
          </div>
        ) : (
          filteredPopups.map((popup) => (
            <div
              key={popup.popupId}
              className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-2xs hover:border-blue-300 transition flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              {/* Hình ảnh preview & Nội dung Popup */}
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <div className="w-16 h-16 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden shrink-0">
                  <img src={popup.imageUrl} alt={popup.title} className="w-full h-full object-cover" />
                </div>

                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-900 text-sm truncate">{popup.title}</h3>
                    <span
                      className={`px-2.5 py-0.5 text-[11px] font-semibold rounded-full border shrink-0 ${popup.status === "ACTIVE"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-slate-100 text-slate-500 border-slate-200"
                        }`}
                    >
                      {popup.status === "ACTIVE" ? "Đang bật" : "Tạm ẩn"}
                    </span>
                  </div>

                  <p className="text-xs text-slate-500 line-clamp-1">{popup.content}</p>

                  <div className="text-[11px] text-slate-400 font-medium flex items-center gap-3">
                    <span>Voucher: <strong className="text-blue-600">{popup.programTitle}</strong></span>
                    <span>Hiệu lực: <strong className="text-slate-700">{popup.startAt} - {popup.endAt}</strong></span>
                  </div>
                </div>
              </div>

              {/* Nút Thao Tác */}
              <div className="flex items-center gap-2 shrink-0 border-t md:border-t-0 pt-3 md:pt-0 border-slate-100 justify-end">
                <button
                  onClick={() => setPreviewPopup(popup)}
                  className="px-3 py-1.5 bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-600 hover:text-white font-semibold text-xs rounded-xl transition shadow-2xs"
                >
                  Xem trước
                </button>

                {/* Nút Chỉnh sửa -> Dẫn sang trang riêng /content/popups/[id] */}
                <Link
                  href={`/admin/content/popups/${popup.popupId}`}
                  className="px-3.5 py-1.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 font-semibold text-xs rounded-xl transition shadow-2xs inline-flex items-center gap-1.5"
                >
                  <Icon name="edit" className="text-base text-slate-500" />
                  Chỉnh sửa
                </Link>

                {/* Nút Xóa -> Mở Dialog */}
                <button
                  onClick={() => setConfirmDeletePopup(popup)}
                  className="p-1.5 bg-rose-50 border border-rose-200 text-rose-600 hover:bg-rose-600 hover:text-white rounded-xl transition shadow-2xs"
                  title="Xóa popup"
                >
                  <Icon name="delete" className="text-base block" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

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
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Tiêu đề Popup <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Nhập tiêu đề popup thông báo..."
                  className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Nội dung chi tiết</label>
                <textarea
                  rows={3}
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder="Nội dung mô tả ngắn..."
                  className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Chương trình Voucher liên kết <span className="text-rose-500">*</span>
                </label>
                <select
                  value={newProgramId}
                  onChange={(e) => setNewProgramId(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500"
                >
                  <option value="PRG-HG-50K">PRG-HG-50K - Voucher Highlands Coffee 50.000đ</option>
                  <option value="PRG-CGV-2D">PRG-CGV-2D - Vé xem phim CGV 2D Cuối Tuần</option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Đường dẫn hình ảnh</label>
                  <input
                    type="text"
                    value={newImageUrl}
                    onChange={(e) => setNewImageUrl(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Liên kết đính kèm</label>
                  <input
                    type="text"
                    value={newTargetUrl}
                    onChange={(e) => setNewTargetUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full p-2.5 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Bắt đầu</label>
                  <input
                    type="text"
                    value={newStartAt}
                    onChange={(e) => setNewStartAt(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Kết thúc</label>
                  <input
                    type="text"
                    value={newEndAt}
                    onChange={(e) => setNewEndAt(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Trạng thái</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as "ACTIVE" | "INACTIVE")}
                  className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500"
                >
                  <option value="ACTIVE">Đang bật</option>
                  <option value="INACTIVE">Tạm ẩn</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="px-4 py-2 bg-white border border-slate-200 text-slate-600 font-semibold text-xs rounded-xl hover:bg-slate-50 transition"
              >
                Hủy
              </button>
              <button
                onClick={handleCreatePopup}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition shadow-xs"
              >
                Thêm Popup
              </button>
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
              <img src={previewPopup.imageUrl} alt={previewPopup.title} className="w-full h-full object-cover" />
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
              <button
                onClick={() => setConfirmDeletePopup(null)}
                className="px-4 py-2 bg-white border border-slate-200 text-slate-600 font-semibold text-xs rounded-xl hover:bg-slate-50 transition"
              >
                Hủy thao tác
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl transition shadow-xs"
              >
                Xác nhận xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
