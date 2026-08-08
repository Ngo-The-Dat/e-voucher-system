"use client";

import Icon from "@/components/shared/ui/Icon";

import { useState } from "react";
import Link from "next/link";
import ContentSubNavbar from "../SubNavbar";
import { Input } from "@/components/shared/ui/Input";
import { Button } from "@/components/shared/ui/Button";
import FormField from "@/components/shared/ui/FormField";
import { INITIAL_BANNERS, BannerData } from "./data";

export default function BannersPage() {
  const [banners, setBanners] = useState<BannerData[]>(INITIAL_BANNERS);
  const [searchQuery, setSearchQuery] = useState("");

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newProgramId, setNewProgramId] = useState("PRG-HG-50K");
  const [newImageUrl, setNewImageUrl] = useState("https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=600&auto=format&fit=crop&q=80");
  const [newTargetUrl, setNewTargetUrl] = useState("");
  const [newDisplayPosition, setNewDisplayPosition] = useState("Trượt trang chủ đầu trang");
  const [newDisplayFrom, setNewDisplayFrom] = useState("01/08/2026");
  const [newDisplayTo, setNewDisplayTo] = useState("31/08/2026");
  type BannerStatus = "ACTIVE" | "INACTIVE";
  const [newStatus, setNewStatus] = useState<BannerStatus>("ACTIVE");

  // Confirm Delete Dialog
  const [confirmDeleteBanner, setConfirmDeleteBanner] = useState<BannerData | null>(null);

  const filteredBanners = banners.filter(
    (b) =>
      b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.programTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.bannerId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateBanner = () => {
    if (!newTitle.trim()) {
      alert("Vui lòng nhập tiêu đề banner!");
      return;
    }

    const progTitle =
      newProgramId === "PRG-HG-50K"
        ? "Voucher Highlands Coffee 50.000đ"
        : newProgramId === "PRG-CGV-2D"
          ? "Vé xem phim CGV 2D Cuối Tuần"
          : "Buffet Lẩu Kichi Kichi Giảm 20%";

    const newId = `BNR-10${banners.length + 1}`;
    const newBanner: BannerData = {
      bannerId: newId,
      programId: newProgramId,
      programTitle: progTitle,
      title: newTitle,
      imageUrl: newImageUrl,
      targetUrl: newTargetUrl,
      displayPosition: newDisplayPosition,
      displayFrom: newDisplayFrom,
      displayTo: newDisplayTo,
      status: newStatus,
    };

    setBanners((prev) => [...prev, newBanner]);
    setIsAddModalOpen(false);
    setNewTitle("");
  };

  const handleConfirmDelete = () => {
    if (!confirmDeleteBanner) return;
    setBanners((prev) => prev.filter((b) => b.bannerId !== confirmDeleteBanner.bannerId));
    setConfirmDeleteBanner(null);
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
          onClick={() => setIsAddModalOpen(true)}
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
        <div className="text-xs text-slate-500 font-semibold">
          Tổng số: <strong className="text-slate-800">{banners.length}</strong> banner
        </div>
      </div>

      {/* Banner Card Rows List (Đồng bộ thiết kế Card Rows) */}
      <div className="space-y-3">
        {filteredBanners.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400 font-medium">
            <Icon name="search_off" className="text-4xl block mb-2 text-slate-300" />
            Không tìm thấy banner nào phù hợp với từ khóa.
          </div>
        ) : (
          filteredBanners.map((banner) => (
            <div
              key={banner.bannerId}
              className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-2xs hover:border-blue-300 transition flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              {/* Hình ảnh preview & Thông tin Banner */}
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <div className="w-28 h-16 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden shrink-0">
                  <img src={banner.imageUrl} alt={banner.title} className="w-full h-full object-cover" />
                </div>

                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-900 text-sm truncate">{banner.title}</h3>
                    <span
                      className={`px-2.5 py-0.5 text-[11px] font-semibold rounded-full border shrink-0 ${banner.status === "ACTIVE"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-slate-100 text-slate-500 border-slate-200"
                        }`}
                    >
                      {banner.status === "ACTIVE" ? "Đang chạy" : "Tạm ẩn"}
                    </span>
                  </div>

                  <div className="text-xs text-blue-600 font-medium flex items-center gap-1">
                    <Icon name="link" className="text-sm" />
                    <span className="truncate">{banner.programTitle}</span>
                  </div>

                  <div className="text-[11px] text-slate-400 font-medium flex items-center gap-3">
                    <span>Vị trí: <strong className="text-slate-700">{banner.displayPosition}</strong></span>
                    <span>Thời gian: <strong className="text-slate-700">{banner.displayFrom} - {banner.displayTo}</strong></span>
                  </div>
                </div>
              </div>

              {/* Nút Thao Tác */}
              <div className="flex items-center gap-2 shrink-0 border-t md:border-t-0 pt-3 md:pt-0 border-slate-100 justify-end">
                {/* Nút Chỉnh sửa -> Dẫn sang trang riêng /content/banners/[id] */}
                <Link
                  href={`/admin/content/banners/${banner.bannerId}`}
                  className="px-3.5 py-1.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 font-semibold text-xs rounded-xl transition shadow-2xs inline-flex items-center gap-1.5"
                >
                  <Icon name="edit" className="text-base text-slate-500" />
                  Chỉnh sửa
                </Link>

                {/* Nút Xóa -> Mở Dialog */}
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
                  onChange={(e) => setNewProgramId(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500"
                >
                  <option value="PRG-HG-50K">PRG-HG-50K - Voucher Highlands Coffee 50.000đ</option>
                  <option value="PRG-CGV-2D">PRG-CGV-2D - Vé xem phim CGV 2D Cuối Tuần</option>
                  <option value="PRG-KC-200K">PRG-KC-200K - Buffet Lẩu Kichi Kichi Giảm 20%</option>
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
                <FormField label="Đường dẫn liên kết">
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
                  <option value="Trượt trang chủ đầu trang">Trượt trang chủ đầu trang</option>
                  <option value="Banner thanh bên trái">Banner thanh bên trái</option>
                  <option value="Banner Khuyến Mãi Giữa Trang">Banner Khuyến Mãi Giữa Trang</option>
                </select>
              </FormField>

              <div className="grid grid-cols-2 gap-3">
                <FormField label="Bắt đầu">
                  <Input
                    type="text"
                    value={newDisplayFrom}
                    onChange={(e) => setNewDisplayFrom(e.target.value)}
                  />
                </FormField>
                <FormField label="Kết thúc">
                  <Input
                    type="text"
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
              <Button
                variant="ghost"
                onClick={() => setIsAddModalOpen(false)}
              >
                Hủy
              </Button>
              <Button
                onClick={handleCreateBanner}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Thêm Banner
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
              <Button
                variant="ghost"
                onClick={() => setConfirmDeleteBanner(null)}
              >
                Hủy thao tác
              </Button>
              <Button
                variant="destructive"
                onClick={handleConfirmDelete}
              >
                Xác nhận xóa
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
