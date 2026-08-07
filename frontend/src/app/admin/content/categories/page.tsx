"use client";

import Icon from "@/components/shared/ui/Icon";

import { useState } from "react";
import Link from "next/link";
import ContentSubNavbar from "../SubNavbar";
import { INITIAL_CATEGORIES, CategoryData } from "./data";

export default function CategoriesPage() {
  const [categories, setCategories] = useState<CategoryData[]>(INITIAL_CATEGORIES);
  const [searchQuery, setSearchQuery] = useState("");

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [newCatDesc, setNewCatDesc] = useState("");
  const [newCatStatus, setNewCatStatus] = useState<"ACTIVE" | "INACTIVE">("ACTIVE");

  // Rule A1 Warning Modal
  const [warningCat, setWarningCat] = useState<CategoryData | null>(null);
  // Confirm Delete Modal
  const [confirmDeleteCat, setConfirmDeleteCat] = useState<CategoryData | null>(null);

  const filteredCategories = categories.filter(
    (c) =>
      c.categoryName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.categoryId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateCategory = () => {
    if (!newCatName.trim()) {
      alert("Vui lòng nhập tên danh mục!");
      return;
    }

    const newId = `CAT-0${categories.length + 1}`;
    const newCategory: CategoryData = {
      categoryId: newId,
      categoryName: newCatName,
      description: newCatDesc,
      status: newCatStatus,
      vouchers: [],
    };

    setCategories((prev) => [...prev, newCategory]);
    setIsAddModalOpen(false);
    setNewCatName("");
    setNewCatDesc("");
    setNewCatStatus("ACTIVE");
  };

  const handleAttemptDelete = (cat: CategoryData) => {
    if (cat.vouchers.length > 0) {
      // Dính quy tắc A1: Từ chối xóa vì có voucher gắn vào
      setWarningCat(cat);
    } else {
      // Cho phép mở dialog xác nhận xóa
      setConfirmDeleteCat(cat);
    }
  };

  const handleConfirmDelete = () => {
    if (!confirmDeleteCat) return;
    setCategories((prev) => prev.filter((c) => c.categoryId !== confirmDeleteCat.categoryId));
    setConfirmDeleteCat(null);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Sub-Navbar 4 trang đích */}
      <ContentSubNavbar />

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Quản lý Danh mục Voucher</h1>
          <p className="text-sm text-slate-500 mt-1">
            Phân loại danh mục hiển thị các chương trình voucher trên ứng dụng và website
          </p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition shadow-xs flex items-center gap-2"
        >
          <Icon name="add" className="text-base" />
          Thêm Danh mục mới
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
            placeholder="Tìm theo tên danh mục hoặc mã danh mục..."
            className="w-full h-[38px] pl-9 pr-4 text-xs sm:text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <div className="text-xs text-slate-500 font-semibold">
          Tổng số: <strong className="text-slate-800">{categories.length}</strong> danh mục
        </div>
      </div>

      {/* Categories Card Rows List (Thiết kế Card Rows không có icon kéo thứ tự ::) */}
      <div className="space-y-3">
        {filteredCategories.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400 font-medium">
            <Icon name="search_off" className="text-4xl block mb-2 text-slate-300" />
            Không tìm thấy danh mục nào phù hợp với từ khóa.
          </div>
        ) : (
          filteredCategories.map((cat) => (
            <div
              key={cat.categoryId}
              className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-2xs hover:border-blue-300 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              {/* Thông tin Danh mục */}
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <h3 className="font-bold text-slate-900 text-base">{cat.categoryName}</h3>
                  <span
                    className={`px-2.5 py-0.5 text-xs font-semibold rounded-full border ${cat.status === "ACTIVE"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-slate-100 text-slate-500 border-slate-200"
                      }`}
                  >
                    {cat.status === "ACTIVE" ? "Đang hoạt động" : "Tạm ẩn"}
                  </span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed max-w-2xl">
                  {cat.description || "Chưa có mô tả danh mục"}
                </p>
              </div>

              {/* Số lượng voucher & Nút Thao Tác */}
              <div className="flex items-center justify-between sm:justify-end gap-5 shrink-0 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100">
                <div className="text-xs font-bold text-slate-700 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200/80">
                  {cat.vouchers.length} Voucher
                </div>

                <div className="flex items-center gap-2">
                  {/* Nút Chỉnh sửa -> Chuyển sang trang riêng /content/categories/[id] */}
                  <Link
                    href={`/admin/content/categories/${cat.categoryId}`}
                    className="px-3.5 py-1.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 font-semibold text-xs rounded-xl transition shadow-2xs inline-flex items-center gap-1.5"
                  >
                    <Icon name="edit" className="text-base text-slate-500" />
                    Sửa Đổi
                  </Link>

                  {/* Nút Xóa -> Mở Dialog */}
                  <button
                    onClick={() => handleAttemptDelete(cat)}
                    className="p-1.5 bg-rose-50 border border-rose-200 text-rose-600 hover:bg-rose-600 hover:text-white rounded-xl transition shadow-2xs"
                    title="Gỡ bỏ danh mục"
                  >
                    <Icon name="delete" className="text-base block" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal Thêm Danh Mục Mới */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-lg">Thêm Danh mục mới</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <Icon name="close" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tên danh mục <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  placeholder="Ví dụ: Ẩm thực & Trà sữa"
                  className="w-full p-2.5 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Mô tả danh mục</label>
                <textarea
                  rows={3}
                  value={newCatDesc}
                  onChange={(e) => setNewCatDesc(e.target.value)}
                  placeholder="Mô tả tóm tắt phân loại danh mục..."
                  className="w-full p-2.5 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Trạng thái</label>
                <select
                  value={newCatStatus}
                  onChange={(e) => setNewCatStatus(e.target.value as "ACTIVE" | "INACTIVE")}
                  className="w-full p-2.5 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-blue-500"
                >
                  <option value="ACTIVE">Đang hoạt động</option>
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
                onClick={handleCreateCategory}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition shadow-xs"
              >
                Thêm danh mục
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dialog Cảnh báo Từ chối xóa (Luồng A1: Có voucher gắn vào) */}
      {warningCat && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-rose-200 shadow-2xl w-full max-w-md p-6 space-y-4 text-center">
            <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto">
              <Icon name="warning" className="text-2xl" />
            </div>
            <h4 className="font-bold text-slate-900 text-base">Từ Chối Thao Tác Gỡ Bỏ</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Danh mục <span className="font-bold text-slate-800">"{warningCat.categoryName}"</span> hiện đang có{" "}
              <span className="font-bold text-rose-600">{warningCat.vouchers.length}</span> voucher liên kết. Hệ thống từ chối xóa để đảm bảo toàn vẹn dữ liệu!
            </p>
            <div className="pt-2">
              <button
                onClick={() => setWarningCat(null)}
                className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl transition shadow-xs"
              >
                Đã hiểu & Đóng thông báo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dialog Xác nhận xóa (Khi số lượng voucher === 0) */}
      {confirmDeleteCat && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md p-6 space-y-4 text-center">
            <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto">
              <Icon name="help_outline" className="text-2xl" />
            </div>
            <h4 className="font-bold text-slate-900 text-base">Xác nhận Gỡ bỏ Danh mục</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Bạn có chắc chắn muốn gỡ bỏ danh mục <span className="font-bold text-slate-800">"{confirmDeleteCat.categoryName}"</span> khỏi hệ thống không?
            </p>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setConfirmDeleteCat(null)}
                className="px-4 py-2 bg-white border border-slate-200 text-slate-600 font-semibold text-xs rounded-xl hover:bg-slate-50 transition"
              >
                Hủy thao tác
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl transition shadow-xs"
              >
                Xác nhận gỡ bỏ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
