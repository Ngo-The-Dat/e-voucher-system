"use client";

import Icon from "@/components/shared/ui/Icon";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { INITIAL_CATEGORIES, CategoryData, CategoryVoucher, AVAILABLE_VOUCHERS_POOL } from "../data";

export default function EditCategoryPage() {
  const params = useParams();
  const router = useRouter();
  const catId = (params?.id as string) || "CAT-01";

  // Tìm danh mục theo ID
  const initialCat = INITIAL_CATEGORIES.find((c) => c.categoryId === catId) || INITIAL_CATEGORIES[0];

  const [categoryName, setCategoryName] = useState(initialCat.categoryName);
  const [description, setDescription] = useState(initialCat.description);
  type CatStatus = "ACTIVE" | "INACTIVE";
  const [status, setStatus] = useState<CatStatus>(initialCat.status);
  const [vouchers, setVouchers] = useState<CategoryVoucher[]>(initialCat.vouchers);

  // States cho Khung Card 2 (Tìm kiếm voucher & Modal thêm voucher)
  const [voucherSearch, setVoucherSearch] = useState("");
  const [isAddVoucherModalOpen, setIsAddVoucherModalOpen] = useState(false);
  const [selectedPoolVoucherIds, setSelectedPoolVoucherIds] = useState<string[]>([]);

  // Lọc danh sách voucher trong danh mục theo ô tìm kiếm
  const filteredVouchers = vouchers.filter(
    (v) =>
      v.voucherTitle.toLowerCase().includes(voucherSearch.toLowerCase()) ||
      v.merchantName.toLowerCase().includes(voucherSearch.toLowerCase())
  );

  // Gỡ voucher khỏi danh mục
  const handleRemoveVoucher = (voucherId: string) => {
    setVouchers((prev) => prev.filter((v) => v.voucherId !== voucherId));
  };

  // Chọn thêm voucher từ Pool vào danh mục
  const handleConfirmAddPoolVouchers = () => {
    const newlyAdded = AVAILABLE_VOUCHERS_POOL.filter((pv) =>
      selectedPoolVoucherIds.includes(pv.voucherId)
    );

    setVouchers((prev) => [...prev, ...newlyAdded]);
    setIsAddVoucherModalOpen(false);
    setSelectedPoolVoucherIds([]);
  };

  const handleSaveAllChanges = () => {
    if (!categoryName.trim()) {
      alert("Vui lòng nhập tên danh mục!");
      return;
    }

    alert(`Đã lưu thay đổi cho danh mục "${categoryName}" thành công!`);
    router.push("/admin/content/categories");
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      {/* Top Navigation Header (Thiết kế Breadcrumb dạng ‹ Tên danh mục bám sát hình ảnh 2) */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/content/categories"
            className="w-9 h-9 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-600 hover:bg-slate-50 transition shadow-2xs"
            title="Quay lại danh sách danh mục"
          >
            <Icon name="chevron_left" className="text-lg" />
          </Link>
          <h1 className="text-2xl font-bold text-slate-900">{categoryName}</h1>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/admin/content/categories"
            className="px-4 py-2 bg-white border border-slate-200 text-slate-600 font-semibold text-xs rounded-xl hover:bg-slate-50 transition"
          >
            Hủy
          </Link>
          <button
            onClick={handleSaveAllChanges}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition shadow-xs"
          >
            Lưu thay đổi
          </button>
        </div>
      </div>

      {/* KHUNG CARD 1: Thông tin cơ bản Danh mục (Bám sát giao diện ảnh 2) */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-5">
        {/* Tên danh mục */}
        <div>
          <label className="block text-sm font-bold text-slate-800 mb-1.5">
            Tên <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            value={categoryName}
            onChange={(e) => setCategoryName(e.target.value)}
            className="w-full h-11 px-4 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* Miêu tả (Kèm thanh công cụ Rich Text Editor Toolbar giống ảnh 2) */}
        <div>
          <label className="block text-sm font-bold text-slate-800 mb-1.5">Miêu Tả</label>
          <div className="border border-slate-200 rounded-xl overflow-hidden focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition">
            {/* Thanh Công Cụ Soạn Thảo (Rich Text Formatting Tools) */}
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
                <button type="button" className="p-1 hover:bg-slate-200/60 rounded text-xs font-mono">""</button>
                <button type="button" className="p-1 hover:bg-slate-200/60 rounded text-xs font-mono">&lt;&gt;</button>
                <span className="w-px h-4 bg-slate-300 mx-1" />
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

            {/* Ô nhập nội dung miêu tả */}
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Nhập nội dung miêu tả chi tiết cho danh mục..."
              className="w-full p-4 text-sm text-slate-800 focus:outline-none leading-relaxed resize-y"
            />
          </div>
        </div>

        {/* Trạng thái danh mục */}
        <div>
          <label className="block text-sm font-bold text-slate-800 mb-1.5">Trạng thái hiển thị</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as "ACTIVE" | "INACTIVE")}
            className="w-full sm:w-64 h-10 px-3 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 font-semibold focus:outline-none focus:border-blue-500"
          >
            <option value="ACTIVE">Đang hoạt động</option>
            <option value="INACTIVE">Tạm ẩn</option>
          </select>
        </div>
      </div>

      {/* KHUNG CARD 2: Danh sách Voucher thuộc danh mục (Tinh chỉnh theo yêu cầu) */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-5">
        {/* Header Card 2: Tiêu đề + Badge + Nút Thêm Voucher */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <h3 className="font-bold text-slate-900 text-base">Voucher thuộc danh mục</h3>
            <span className="px-2.5 py-0.5 bg-blue-50 text-blue-700 font-bold text-xs rounded-full border border-blue-200">
              {vouchers.length}
            </span>
          </div>

          <button
            onClick={() => setIsAddVoucherModalOpen(true)}
            className="px-4 py-2 bg-blue-50 border border-blue-200 text-blue-600 hover:bg-blue-600 hover:text-white font-bold text-xs rounded-xl transition shadow-2xs inline-flex items-center gap-1.5"
          >
            <Icon name="add" className="text-base" />
            Thêm Voucher vào Danh mục
          </button>
        </div>

        {/* Ô Tìm kiếm tên Voucher trong danh mục */}
        <div className="relative">
          <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg" />
          <input
            type="text"
            value={voucherSearch}
            onChange={(e) => setVoucherSearch(e.target.value)}
            placeholder="Tìm theo tên voucher trong danh mục..."
            className="w-full h-[38px] pl-9 pr-4 text-xs sm:text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Danh sách Voucher gắn vào (Tối giản: Không icon drag ::, không thumbnail) */}
        <div className="divide-y divide-slate-100 border border-slate-200/80 rounded-xl overflow-hidden">
          {filteredVouchers.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs font-medium">
              Chưa có voucher nào thuộc danh mục này hoặc không khớp với từ khóa tìm kiếm.
            </div>
          ) : (
            filteredVouchers.map((v) => (
              <div
                key={v.voucherId}
                className="p-4 bg-white hover:bg-slate-50/60 transition flex items-center justify-between gap-4"
              >
                {/* Thông tin tên voucher (Không thumbnail, không drag icon) */}
                <div className="space-y-0.5 flex-1 min-w-0">
                  <h4 className="font-bold text-slate-900 text-sm truncate">{v.voucherTitle}</h4>
                  <p className="text-xs text-slate-400 font-medium">{v.merchantName}</p>
                </div>

                {/* Badge trạng thái & Nút xóa đỏ */}
                <div className="flex items-center gap-3 shrink-0">
                  <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 font-bold text-xs rounded-md border border-emerald-200">
                    Đang hoạt động
                  </span>
                  <span className="px-2.5 py-0.5 bg-blue-50 text-blue-700 font-bold text-xs rounded-md border border-blue-200">
                    Còn hiệu lực
                  </span>

                  {/* Nút xóa đỏ gỡ voucher khỏi danh mục */}
                  <button
                    onClick={() => handleRemoveVoucher(v.voucherId)}
                    className="w-8 h-8 rounded-lg bg-rose-50 border border-rose-200 text-rose-600 hover:bg-rose-600 hover:text-white flex items-center justify-center transition"
                    title="Gỡ voucher khỏi danh mục"
                  >
                    <Icon name="delete" className="text-base" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modal Chọn Thêm Voucher vào Danh Mục */}
      {isAddVoucherModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg p-6 space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h4 className="font-bold text-slate-900 text-base">Thêm Voucher vào Danh mục</h4>
              <button
                onClick={() => setIsAddVoucherModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <Icon name="close" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Chọn các chương trình voucher khả dụng bên dưới để thêm vào danh mục{" "}
              <strong className="text-slate-800">{categoryName}</strong>:
            </p>

            <div className="flex-1 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-xl p-2 space-y-1">
              {AVAILABLE_VOUCHERS_POOL.map((poolItem) => {
                const isSelected = selectedPoolVoucherIds.includes(poolItem.voucherId);
                const isAlreadyInCat = vouchers.some((v) => v.voucherId === poolItem.voucherId);

                return (
                  <label
                    key={poolItem.voucherId}
                    className={`p-3 rounded-lg flex items-center justify-between cursor-pointer transition ${
                      isAlreadyInCat
                        ? "opacity-50 pointer-events-none bg-slate-50"
                        : isSelected
                        ? "bg-blue-50/60 border border-blue-200"
                        : "hover:bg-slate-50"
                    }`}
                  >
                    <div className="space-y-0.5">
                      <div className="font-bold text-slate-900 text-xs">{poolItem.voucherTitle}</div>
                      <div className="text-[11px] text-slate-400">{poolItem.merchantName}</div>
                    </div>
                    {isAlreadyInCat ? (
                      <span className="text-[11px] font-semibold text-slate-400">Đã gán</span>
                    ) : (
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedPoolVoucherIds((prev) => [...prev, poolItem.voucherId]);
                          } else {
                            setSelectedPoolVoucherIds((prev) =>
                              prev.filter((id) => id !== poolItem.voucherId)
                            );
                          }
                        }}
                        className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                      />
                    )}
                  </label>
                );
              })}
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setIsAddVoucherModalOpen(false)}
                className="px-4 py-2 bg-white border border-slate-200 text-slate-600 font-semibold text-xs rounded-xl hover:bg-slate-50 transition"
              >
                Hủy
              </button>
              <button
                disabled={selectedPoolVoucherIds.length === 0}
                onClick={handleConfirmAddPoolVouchers}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition shadow-xs"
              >
                Xác nhận thêm ({selectedPoolVoucherIds.length})
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
