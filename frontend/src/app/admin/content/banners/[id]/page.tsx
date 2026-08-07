"use client";

import Icon from "@/components/shared/ui/Icon";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { INITIAL_BANNERS, BannerData } from "../data";

export default function EditBannerPage() {
  const params = useParams();
  const router = useRouter();
  const bannerId = (params?.id as string) || "BNR-101";

  // Tìm dữ liệu banner theo ID
  const initialBanner = INITIAL_BANNERS.find((b) => b.bannerId === bannerId) || INITIAL_BANNERS[0];

  const [title, setTitle] = useState(initialBanner.title);
  const [programId, setProgramId] = useState(initialBanner.programId);
  const [imageUrl, setImageUrl] = useState(initialBanner.imageUrl);
  const [targetUrl, setTargetUrl] = useState(initialBanner.targetUrl);
  const [displayPosition, setDisplayPosition] = useState(initialBanner.displayPosition);
  const [displayFrom, setDisplayFrom] = useState(initialBanner.displayFrom);
  const [displayTo, setDisplayTo] = useState(initialBanner.displayTo);
  const [status, setStatus] = useState<"ACTIVE" | "INACTIVE">(initialBanner.status);

  const handleSaveBannerChanges = () => {
    if (!title.trim()) {
      alert("Vui lòng nhập tiêu đề banner!");
      return;
    }

    alert(`Đã lưu thay đổi cho Banner "${title}" thành công!`);
    router.push("/admin/content/banners");
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-16">
      {/* Top Header Navigation (Breadcrumb dạng ‹ Tên Banner) */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href="/admin/content/banners"
            className="w-9 h-9 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-600 hover:bg-slate-50 transition shadow-2xs shrink-0"
            title="Quay lại danh sách banner"
          >
            <Icon name="chevron_left" className="text-lg" />
          </Link>
          <h1 className="text-xl font-bold text-slate-900 truncate">{title}</h1>
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
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition shadow-xs"
          >
            Lưu thay đổi
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
            onChange={(e) => setProgramId(e.target.value)}
            className="w-full h-11 px-3 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:border-blue-500"
          >
            <option value="PRG-HG-50K">PRG-HG-50K - Voucher Highlands Coffee 50.000đ</option>
            <option value="PRG-CGV-2D">PRG-CGV-2D - Vé xem phim CGV 2D Cuối Tuần</option>
            <option value="PRG-KC-200K">PRG-KC-200K - Buffet Lẩu Kichi Kichi Giảm 20%</option>
          </select>
        </div>

        {/* Đường dẫn hình ảnh & Xem trước (Preview Box) */}
        <div className="space-y-3">
          <label className="block text-xs font-bold text-slate-800">Đường dẫn hình ảnh & Xem trước Banner</label>
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
            <div className="w-full h-48 bg-slate-200 rounded-lg overflow-hidden relative border border-slate-300">
              <img src={imageUrl} alt={title} className="w-full h-full object-cover" />
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
              <option value="Trượt trang chủ đầu trang">Trượt trang chủ đầu trang</option>
              <option value="Banner thanh bên trái">Banner thanh bên trái</option>
              <option value="Banner Khuyến Mãi Giữa Trang">Banner Khuyến Mãi Giữa Trang</option>
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
              type="text"
              value={displayFrom}
              onChange={(e) => setDisplayFrom(e.target.value)}
              className="w-full h-10 px-3 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1.5">Thời gian kết thúc</label>
            <input
              type="text"
              value={displayTo}
              onChange={(e) => setDisplayTo(e.target.value)}
              className="w-full h-10 px-3 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="flex items-center justify-end gap-2 pt-2">
        <Link
          href="/admin/content/banners"
          className="px-5 py-2.5 bg-white border border-slate-200 text-slate-600 font-semibold text-xs rounded-xl hover:bg-slate-50 transition"
        >
          Hủy / Quay lại
        </Link>
        <button
          onClick={handleSaveBannerChanges}
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition shadow-xs"
        >
          Lưu thay đổi Banner
        </button>
      </div>
    </div>
  );
}
