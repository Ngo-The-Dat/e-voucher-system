"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import Icon from "@/components/shared/ui/Icon";
import { toast } from "sonner";
import {
  adminApi,
  AdminCategoryDetail,
  AdminCategoryVoucherItem,
  VoucherProgramOption,
  AdminApiError,
} from "@/lib/admin-api";

export default function EditCategoryPage() {
  const params = useParams();
  const router = useRouter();
  const catId = params?.id ? Number(params.id) : null;

  const [category, setCategory] = useState<AdminCategoryDetail | null>(null);
  const [categoryName, setCategoryName] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<"ACTIVE" | "INACTIVE">("ACTIVE");
  const [vouchers, setVouchers] = useState<AdminCategoryVoucherItem[]>([]);

  // Available vouchers pool for modal
  const [voucherOptions, setVoucherOptions] = useState<VoucherProgramOption[]>([]);
  const [selectedPoolVoucherIds, setSelectedPoolVoucherIds] = useState<number[]>([]);
  const [voucherSearch, setVoucherSearch] = useState("");
  const [isAddVoucherModalOpen, setIsAddVoucherModalOpen] = useState(false);

  // Confirm remove voucher state
  const [confirmRemoveVoucher, setConfirmRemoveVoucher] = useState<AdminCategoryVoucherItem | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load category details
  const loadCategory = useCallback(async () => {
    if (!catId) return;
    try {
      setIsLoading(true);
      setError(null);
      const data = await adminApi.getCategory(catId);
      setCategory(data);
      setCategoryName(data.category_name);
      setDescription(data.description || "");
      setStatus(data.status);
      setVouchers(data.vouchers || []);
    } catch (err: any) {
      if (err instanceof AdminApiError) {
        setError(err.message);
      } else {
        setError("Không thể tải thông tin danh mục.");
      }
    } finally {
      setIsLoading(false);
    }
  }, [catId]);

  useEffect(() => {
    loadCategory();
  }, [loadCategory]);

  // Load available voucher options when opening modal
  const handleOpenAddVoucherModal = async () => {
    try {
      const res = await adminApi.getVoucherOptions();
      setVoucherOptions(res.options);
      setSelectedPoolVoucherIds([]);
      setIsAddVoucherModalOpen(true);
    } catch {
      toast.error("Không thể tải danh sách chương trình voucher khả dụng.");
    }
  };

  // Filter assigned vouchers by search
  const filteredVouchers = vouchers.filter(
    (v) =>
      v.program_name.toLowerCase().includes(voucherSearch.toLowerCase()) ||
      v.partner_name.toLowerCase().includes(voucherSearch.toLowerCase())
  );

  // Confirm add vouchers to category
  const handleConfirmAddPoolVouchers = async () => {
    if (!catId || selectedPoolVoucherIds.length === 0) return;
    try {
      setIsAssigning(true);
      const updated = await adminApi.assignVouchersToCategory(catId, selectedPoolVoucherIds);
      setCategory(updated);
      setVouchers(updated.vouchers || []);
      setIsAddVoucherModalOpen(false);
      setSelectedPoolVoucherIds([]);
      toast.success("Đã gán các voucher vào danh mục thành công!");
    } catch (err: any) {
      toast.error(err.message || "Không thể gán voucher vào danh mục.");
    } finally {
      setIsAssigning(false);
    }
  };

  // Confirm remove voucher from category
  const handleConfirmRemoveVoucher = async () => {
    if (!catId || !confirmRemoveVoucher) return;
    try {
      setIsRemoving(true);
      const updated = await adminApi.removeVoucherFromCategory(catId, confirmRemoveVoucher.program_id);
      setCategory(updated);
      setVouchers(updated.vouchers || []);
      setConfirmRemoveVoucher(null);
      toast.success("Đã gỡ voucher ra khỏi danh mục thành công!");
    } catch (err: any) {
      toast.error(err.message || "Không thể gỡ voucher ra khỏi danh mục.");
    } finally {
      setIsRemoving(false);
    }
  };

  const handleSaveAllChanges = async () => {
    if (!categoryName.trim()) {
      toast.error("Vui lòng nhập tên danh mục!");
      return;
    }
    if (!catId) return;

    try {
      setIsSaving(true);
      await adminApi.updateCategory(catId, {
        category_name: categoryName.trim(),
        description: description.trim(),
        status,
      });

      toast.success(`Đã lưu thay đổi cho danh mục "${categoryName}" thành công!`);
      setTimeout(() => {
        router.push("/admin/content/categories");
      }, 1000);
    } catch (err: any) {
      toast.error(err.message || "Không thể lưu thay đổi.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto pb-16">
        <div className="h-10 bg-slate-200 rounded-xl animate-pulse w-1/3" />
        <div className="h-64 bg-white border border-slate-200 rounded-2xl p-6 animate-pulse" />
      </div>
    );
  }

  if (error || !category) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto pb-16 text-center">
        <div className="p-8 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700">
          <Icon name="error" className="text-3xl mb-2" />
          <p className="font-bold">{error || "Không tìm thấy danh mục yêu cầu."}</p>
          <div className="mt-4">
            <Link
              href="/admin/content/categories"
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
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      {/* Top Navigation Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/content/categories"
            className="w-9 h-9 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-600 hover:bg-slate-50 transition shadow-2xs"
            title="Quay lại danh sách danh mục"
          >
            <Icon name="chevron_left" className="text-lg" />
          </Link>
          <div>
            <div className="text-xs text-slate-400 font-mono font-bold">Mã: #{catId}</div>
            <h1 className="text-2xl font-bold text-slate-900">{categoryName || "Chỉnh sửa danh mục"}</h1>
          </div>
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
            disabled={isSaving}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition shadow-xs"
          >
            {isSaving ? "Đang lưu..." : "Lưu thay đổi"}
          </button>
        </div>
      </div>

      {/* KHUNG CARD 1: Thông tin cơ bản Danh mục */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-5">
        {/* Tên danh mục */}
        <div>
          <label className="block text-sm font-bold text-slate-800 mb-1.5">
            Tên danh mục <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            value={categoryName}
            onChange={(e) => setCategoryName(e.target.value)}
            className="w-full h-11 px-4 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* Miêu tả (Kèm Rich Text Editor Toolbar) */}
        <div>
          <label className="block text-sm font-bold text-slate-800 mb-1.5">Miêu Tả</label>
          <div className="border border-slate-200 rounded-xl overflow-hidden focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition">
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

      {/* KHUNG CARD 2: Danh sách Voucher thuộc danh mục */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <h3 className="font-bold text-slate-900 text-base">Voucher thuộc danh mục</h3>
            <span className="px-2.5 py-0.5 bg-blue-50 text-blue-700 font-bold text-xs rounded-full border border-blue-200">
              {vouchers.length}
            </span>
          </div>

          <button
            onClick={handleOpenAddVoucherModal}
            className="px-4 py-2 bg-blue-50 border border-blue-200 text-blue-600 hover:bg-blue-600 hover:text-white font-bold text-xs rounded-xl transition shadow-2xs inline-flex items-center gap-1.5"
          >
            <Icon name="add" className="text-base" />
            Thêm Voucher vào Danh mục
          </button>
        </div>

        {/* Ô Tìm kiếm voucher */}
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

        {/* Danh sách Voucher gắn vào */}
        <div className="divide-y divide-slate-100 border border-slate-200/80 rounded-xl overflow-hidden">
          {filteredVouchers.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs font-medium">
              Chưa có voucher nào thuộc danh mục này hoặc không khớp với từ khóa tìm kiếm.
            </div>
          ) : (
            filteredVouchers.map((v) => (
              <div
                key={v.program_id}
                className="p-4 bg-white hover:bg-slate-50/60 transition flex items-center justify-between gap-4"
              >
                <div className="space-y-0.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-slate-400">#{v.program_id}</span>
                    <h4 className="font-bold text-slate-900 text-sm truncate">{v.program_name}</h4>
                  </div>
                  <p className="text-xs text-slate-400 font-medium">{v.partner_name}</p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right text-xs">
                    <div className="font-bold text-slate-800">{v.sale_price.toLocaleString("vi-VN")} ₫</div>
                    <div className="text-slate-400 line-through text-[11px]">{v.original_price.toLocaleString("vi-VN")} ₫</div>
                  </div>

                  <span
                    className={`px-2.5 py-0.5 font-bold text-xs rounded-md border ${
                      v.display_status === "PUBLISHED"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-slate-100 text-slate-600 border-slate-200"
                    }`}
                  >
                    {v.display_status === "PUBLISHED" ? "Đang xuất bản" : v.display_status}
                  </span>

                  <button
                    type="button"
                    onClick={() => setConfirmRemoveVoucher(v)}
                    className="p-1.5 bg-rose-50 border border-rose-200 text-rose-600 hover:bg-rose-600 hover:text-white rounded-xl transition shadow-2xs flex items-center justify-center"
                    title="Gỡ voucher khỏi danh mục"
                  >
                    <Icon name="delete" className="text-base block" />
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
              Chọn các chương trình voucher khả dụng từ cơ sở dữ liệu để gán vào danh mục{" "}
              <strong className="text-slate-800">{categoryName}</strong>:
            </p>

            <div className="flex-1 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-xl p-2 space-y-1">
              {voucherOptions.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400">
                  Không tìm thấy chương trình voucher nào trên hệ thống.
                </div>
              ) : (
                voucherOptions.map((poolItem) => {
                  const isAlreadyInCat = poolItem.category_id === catId;
                  const isSelected = selectedPoolVoucherIds.includes(poolItem.program_id);

                  return (
                    <label
                      key={poolItem.program_id}
                      className={`p-3 rounded-lg flex items-center justify-between cursor-pointer transition ${
                        isAlreadyInCat
                          ? "opacity-50 pointer-events-none bg-slate-50"
                          : isSelected
                          ? "bg-blue-50/60 border border-blue-200"
                          : "hover:bg-slate-50"
                      }`}
                    >
                      <div className="space-y-0.5">
                        <div className="font-bold text-slate-900 text-xs">
                          #{poolItem.program_id} - {poolItem.program_name}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {poolItem.partner_name} {poolItem.category_name ? `(${poolItem.category_name})` : ""}
                        </div>
                      </div>
                      {isAlreadyInCat ? (
                        <span className="text-[11px] font-semibold text-slate-400">Đã gán</span>
                      ) : (
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedPoolVoucherIds((prev) => [...prev, poolItem.program_id]);
                            } else {
                              setSelectedPoolVoucherIds((prev) =>
                                prev.filter((id) => id !== poolItem.program_id)
                              );
                            }
                          }}
                          className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                        />
                      )}
                    </label>
                  );
                })
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setIsAddVoucherModalOpen(false)}
                className="px-4 py-2 bg-white border border-slate-200 text-slate-600 font-semibold text-xs rounded-xl hover:bg-slate-50 transition"
              >
                Hủy
              </button>
              <button
                disabled={selectedPoolVoucherIds.length === 0 || isAssigning}
                onClick={handleConfirmAddPoolVouchers}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition shadow-xs"
              >
                {isAssigning ? "Đang gán..." : `Xác nhận thêm (${selectedPoolVoucherIds.length})`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dialog Xác nhận gỡ voucher khỏi danh mục */}
      {confirmRemoveVoucher && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md p-6 space-y-4 text-center">
            <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto">
              <Icon name="delete" className="text-2xl" />
            </div>
            <h4 className="font-bold text-slate-900 text-base">Xác nhận Gỡ Voucher khỏi Danh mục</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Bạn có chắc chắn muốn gỡ voucher <span className="font-bold text-slate-800">"{confirmRemoveVoucher.program_name}"</span> ra khỏi danh mục <span className="font-bold text-slate-800">"{categoryName}"</span> không?
            </p>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmRemoveVoucher(null)}
                className="px-4 py-2 bg-white border border-slate-200 text-slate-600 font-semibold text-xs rounded-xl hover:bg-slate-50 transition"
              >
                Hủy thao tác
              </button>
              <button
                type="button"
                onClick={handleConfirmRemoveVoucher}
                disabled={isRemoving}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-rose-600 text-white font-bold text-xs rounded-xl transition-all shadow-xs"
              >
                {isRemoving ? "Đang gỡ..." : "Xác nhận gỡ"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
