"use client";

import TopAppBar from "@/components/partner/layout/TopAppBar";
import VoucherStatusBadge from "@/components/shared/ui/VoucherStatusBadge";
import Toast from "@/components/shared/ui/Toast";
import Icon from "@/components/shared/ui/Icon";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { partnerApi } from "@/lib/partner-api";
import { CategoryOption, VoucherItem, VoucherFormErrors } from "@/lib/types/voucher";
import { Branch } from "@/lib/types/profile";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function VoucherDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [voucher, setVoucher] = useState<VoucherItem | null>(null);
  const [partnerBranches, setPartnerBranches] = useState<Branch[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([]);

  // Edit Mode state for UC 'Chỉnh sửa voucher' (UC Gửi duyệt Flow A1)
  const [isEditing, setIsEditing] = useState(false);

  // Editable Form fields (ERD Schema)
  const [editTitle, setEditTitle] = useState("");
  const [editCategoryId, setEditCategoryId] = useState("");
  const [editSelectedBranchIds, setEditSelectedBranchIds] = useState<string[]>([]);
  const [editOriginalPriceStr, setEditOriginalPriceStr] = useState("");
  const [editSellingPriceStr, setEditSellingPriceStr] = useState("");
  const [editIssuedQuantityStr, setEditIssuedQuantityStr] = useState("");
  const [editSellStartDate, setEditSellStartDate] = useState("");
  const [editSellEndDate, setEditSellEndDate] = useState("");
  const [editUseStartDate, setEditUseStartDate] = useState("");
  const [editUseEndDate, setEditUseEndDate] = useState("");
  const [editDisplayStatus, setEditDisplayStatus] = useState<"active" | "hidden">("active");

  const [errors, setErrors] = useState<VoucherFormErrors>({});
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([partnerApi.getBranches(), partnerApi.getCategories(), partnerApi.getVoucher(params.id)])
      .then(([branches, rows, loaded]) => {
      setPartnerBranches(branches); setCategories(rows);
      setVoucher(loaded);
      setEditTitle(loaded.title);
      setEditCategoryId(loaded.categoryId);
      setEditSelectedBranchIds(loaded.branchIds || []);
      setEditOriginalPriceStr(loaded.originalPrice.toString());
      setEditSellingPriceStr(loaded.sellingPrice.toString());
      setEditIssuedQuantityStr(loaded.issuedQuantity.toString());
      setEditSellStartDate(loaded.sellStartDate);
      setEditSellEndDate(loaded.sellEndDate);
      setEditUseStartDate(loaded.useStartDate);
      setEditUseEndDate(loaded.useEndDate);
      setEditDisplayStatus(loaded.displayStatus || "active");
    }).catch((error) => console.error("Failed to load voucher detail", error));
  }, [params.id]);

  if (!voucher) {
    return (
      <div className="flex-1 flex flex-col min-w-0 bg-background min-h-screen">
        <TopAppBar title={`Chi tiết Voucher ${params.id}`} />
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center space-y-3">
            <Icon name="error" className="text-4xl text-error mx-auto" />
            <p className="font-bold text-lg text-on-surface">Không tìm thấy thông tin chương trình voucher.</p>
            <Link href="/partner/vouchers" className="text-primary font-bold hover:underline inline-block">
              Trở về danh sách voucher
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Calculated derived attribute for edit mode
  const editOriginalPrice = parseFloat(editOriginalPriceStr) || 0;
  const editSellingPrice = parseFloat(editSellingPriceStr) || 0;
  const editDiscountAmount = editOriginalPrice > editSellingPrice ? editOriginalPrice - editSellingPrice : 0;

  // UC Gửi duyệt voucher - Step 3: Gửi yêu cầu xét duyệt đến quản trị viên
  const handleSendForApproval = async () => {
    try {
      await partnerApi.submitVoucher(voucher.id);
      setVoucher((prev) => (prev ? { ...prev, status: "pending", submittedAt: new Date().toLocaleString("vi-VN") } : prev));
      setToastMessage("Đã gửi yêu cầu xét duyệt voucher đến Quản trị viên!");
      setTimeout(() => router.push("/partner/vouchers"), 2000);
    } catch (error) { console.error("Failed to submit voucher", error); }
  };

  // UC Chỉnh sửa voucher (UC Gửi duyệt Flow A1 Step 2 - Save Edit)
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: VoucherFormErrors = {};

    if (!editTitle.trim()) newErrors.title = "Vui lòng nhập tên chương trình.";
    if (editSelectedBranchIds.length === 0) newErrors.branches = "Vui lòng chọn ít nhất 1 chi nhánh.";
    if (!editOriginalPriceStr.trim() || editOriginalPrice <= 0) newErrors.originalPrice = "Giá gốc phải lớn hơn 0.";
    if (!editSellingPriceStr.trim() || editSellingPrice < 0) newErrors.sellingPrice = "Giá bán không hợp lệ.";
    else if (editSellingPrice > editOriginalPrice) newErrors.sellingPrice = "Giá bán không thể lớn hơn Giá gốc.";

    if (!editSellStartDate.trim()) newErrors.sellStartDate = "Chọn thời gian bắt đầu bán.";
    if (!editSellEndDate.trim()) newErrors.sellEndDate = "Chọn thời gian kết thúc bán.";
    if (!editUseStartDate.trim()) newErrors.useStartDate = "Chọn thời gian bắt đầu sử dụng.";
    if (!editUseEndDate.trim()) newErrors.useEndDate = "Chọn thời gian kết thúc sử dụng.";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const selectedCategory = categories.find((c) => c.id === editCategoryId);
    const selectedBranches = partnerBranches.filter((b) => editSelectedBranchIds.includes(b.id));

    const updatedItem: VoucherItem = {
      ...voucher,
      title: editTitle.trim(),
      categoryId: editCategoryId,
      categoryName: selectedCategory ? selectedCategory.name : voucher.categoryName,
      branchIds: editSelectedBranchIds,
      branchNames: selectedBranches.map((b) => b.name),
      originalPrice: editOriginalPrice,
      sellingPrice: editSellingPrice,
      discountAmount: editDiscountAmount,
      issuedQuantity: parseInt(editIssuedQuantityStr) || voucher.issuedQuantity,
      sellStartDate: editSellStartDate,
      sellEndDate: editSellEndDate,
      useStartDate: editUseStartDate,
      useEndDate: editUseEndDate,
      displayStatus: editDisplayStatus,
    };

    try {
      await partnerApi.updateVoucher(updatedItem);
      setVoucher(updatedItem); setIsEditing(false); setErrors({});
      setToastMessage("Cập nhật thông tin chương trình voucher thành công!");
      setTimeout(() => setToastMessage(null), 3000);
    } catch (error) { console.error("Failed to update voucher", error); }
  };

  // Sử dụng VoucherStatusBadge component thay vì inline function

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-background min-h-screen relative pb-20 w-full">
      <TopAppBar title={`Chi tiết Chương trình Voucher ${voucher.code}`} />

      <Toast message={toastMessage} />

      <main className="p-6 md:p-8 flex-1 overflow-y-auto max-w-6xl w-full mx-auto space-y-6">
        {/* Header Bar */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-outline-variant/40 pb-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold text-on-surface">{voucher.title}</h1>
              <VoucherStatusBadge status={voucher.status} />
            </div>
            <p className="text-sm text-on-surface-variant">
              Mã chương trình: <strong>{voucher.code}</strong>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/partner/vouchers"
              className="bg-surface-container text-on-surface px-4 py-2.5 rounded-lg text-base font-semibold hover:bg-surface-container-highest transition-colors border border-outline-variant flex items-center gap-1.5"
            >
              <Icon name="arrow_back" /> Danh sách
            </Link>

            {/* UC Gửi duyệt voucher: Nút mặc định là 'Gửi duyệt' trừ khi bấm 'Chỉnh sửa' */}
            {voucher.status === "draft" && !isEditing && (
              <>
                <button
                  onClick={() => setIsEditing(true)}
                  className="bg-surface-bright border border-outline-variant text-on-surface px-4 py-2.5 rounded-lg text-base font-semibold hover:bg-surface-container-high transition-colors flex items-center gap-1.5"
                >
                  <Icon name="edit" className="text-primary" /> Chỉnh sửa
                </button>
                <button
                  onClick={handleSendForApproval}
                  className="bg-primary text-on-primary px-6 py-2.5 rounded-lg text-base font-bold hover:bg-surface-tint transition-colors flex items-center gap-2 shadow-md"
                >
                  <Icon name="send" /> Gửi duyệt
                </button>
              </>
            )}
          </div>
        </div>

        {/* Audit / Approval Status Notice */}
        {voucher.status === "pending" && (
          <div className="bg-tertiary-fixed-dim/20 border border-tertiary-amber text-on-surface rounded-xl p-4 shadow-sm flex items-start gap-3">
            <Icon name="hourglass_top" className="text-2xl text-tertiary-amber shrink-0 mt-0.5 animate-spin" />
            <div>
              <h4 className="font-bold text-base text-tertiary-amber">Đang chờ xét duyệt từ Quản trị viên</h4>
              <p className="text-sm text-on-surface-variant mt-0.5">
                Thời gian gửi duyệt: <strong>{voucher.submittedAt || "Mới gửi"}</strong>. Thông tin chương trình đang được khóa để duyệt.
              </p>
            </div>
          </div>
        )}

        {voucher.status === "rejected" && (
          <div className="bg-error-container/20 border border-error text-error rounded-xl p-4 shadow-sm flex items-start gap-3">
            <Icon name="error" className="text-2xl text-error shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-base text-error">Chương trình voucher bị từ chối xét duyệt</h4>
              <p className="text-sm text-on-surface mt-0.5 font-medium">
                Phản hồi của Admin: <em>"{voucher.adminFeedback || "Hình ảnh hoặc thời gian áp dụng chưa hợp lệ."}"</em>
              </p>
            </div>
          </div>
        )}

        {/* MODE A: Read-Only Detail View (UC Quản lý voucher) */}
        {!isEditing ? (
          <div className="space-y-6">
            {/* Thống tin Thực thể Chương trình Voucher */}
            <div className="bg-surface-bright rounded-xl border border-outline-variant p-6 shadow-sm space-y-6">
              <h2 className="text-lg font-bold text-on-surface border-b border-outline-variant/40 pb-3 flex items-center gap-2">
                <Icon name="info" className="text-primary" /> Thông tin Chương trình Voucher
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-base">
                <div>
                  <span className="block text-sm text-on-surface-variant font-medium">Mã chương trình:</span>
                  <span className="font-bold text-on-surface text-lg">{voucher.code}</span>
                </div>

                <div>
                  <span className="block text-sm text-on-surface-variant font-medium">Tên chương trình:</span>
                  <span className="font-bold text-on-surface text-lg">{voucher.title}</span>
                </div>

                <div>
                  <span className="block text-sm text-on-surface-variant font-medium">Danh mục:</span>
                  <span className="font-semibold text-on-surface">{voucher.categoryName}</span>
                </div>

                <div>
                  <span className="block text-sm text-on-surface-variant font-medium">Giá gốc:</span>
                  <span className="font-bold text-on-surface">{formatCurrency(voucher.originalPrice)}</span>
                </div>

                <div>
                  <span className="block text-sm text-on-surface-variant font-medium">Giá bán:</span>
                  <span className="font-bold text-primary text-xl">{formatCurrency(voucher.sellingPrice)}</span>
                </div>

                <div>
                  <span className="block text-sm text-on-surface-variant font-medium">Mức giảm:</span>
                  <span className="font-bold text-secondary text-lg">
                    {formatCurrency(voucher.discountAmount)}
                  </span>
                </div>

                <div>
                  <span className="block text-sm text-on-surface-variant font-medium">Số lượng phát hành:</span>
                  <span className="font-bold text-on-surface text-lg">
                    {voucher.issuedQuantity.toLocaleString()} voucher
                  </span>
                </div>

                <div className="md:col-span-2 pt-2 border-t border-outline-variant/30">
                  <span className="block text-sm text-on-surface-variant font-medium mb-1">Chi nhánh áp dụng:</span>
                  <div className="flex flex-wrap gap-2">
                    {voucher.branchNames && voucher.branchNames.length > 0 ? (
                      voucher.branchNames.map((name, i) => (
                        <span key={i} className="px-3 py-1 bg-surface-container-high text-on-surface font-semibold text-sm rounded-full border border-outline-variant">
                          📍 {name}
                        </span>
                      ))
                    ) : (
                      <span className="text-on-surface-variant">Áp dụng toàn bộ hệ thống</span>
                    )}
                  </div>
                </div>

                {/* Khung thời gian */}
                <div className="p-4 bg-surface-container-low rounded-xl border border-outline-variant/60">
                  <span className="block text-sm text-primary font-bold mb-1">Thời gian bán:</span>
                  <p className="text-on-surface font-semibold">Bắt đầu: {formatDate(voucher.sellStartDate)}</p>
                  <p className="text-on-surface font-semibold">Kết thúc: {formatDate(voucher.sellEndDate)}</p>
                </div>

                <div className="p-4 bg-surface-container-low rounded-xl border border-outline-variant/60">
                  <span className="block text-sm text-secondary font-bold mb-1">Thời gian sử dụng:</span>
                  <p className="text-on-surface font-semibold">Bắt đầu: {formatDate(voucher.useStartDate)}</p>
                  <p className="text-on-surface font-semibold">Kết thúc: {formatDate(voucher.useEndDate)}</p>
                </div>
              </div>
            </div>

            {/* UC Quản lý voucher - Flow A3: Nếu voucher ĐÃ DUYỆT -> Hiển thị thêm chi tiết hiệu quả */}
            {voucher.status === "approved" && (
              <div className="bg-surface-bright rounded-xl border border-outline-variant p-6 shadow-sm space-y-4">
                <h2 className="text-lg font-bold text-on-surface border-b border-outline-variant/40 pb-3 flex items-center gap-2">
                  <Icon name="analytics" className="text-primary" /> Thống kê chi tiết phát hành & sử dụng
                </h2>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant text-center">
                    <span className="block text-sm text-on-surface-variant font-medium">Số lượng phát hành</span>
                    <span className="text-2xl font-bold text-on-surface">{voucher.issuedQuantity.toLocaleString()}</span>
                  </div>

                  <div className="p-4 rounded-xl bg-primary-container/20 border border-primary/30 text-center">
                    <span className="block text-sm text-primary font-medium">Số lượng đã bán</span>
                    <span className="text-2xl font-bold text-primary">{(voucher.soldCount || 0).toLocaleString()}</span>
                  </div>

                  <div className="p-4 rounded-xl bg-secondary-container/20 border border-secondary/30 text-center">
                    <span className="block text-sm text-secondary font-medium">Số lượng đã sử dụng</span>
                    <span className="text-2xl font-bold text-secondary">{(voucher.usedCount || 0).toLocaleString()}</span>
                  </div>

                  <div className="p-4 rounded-xl bg-error-container/20 border border-error/30 text-center">
                    <span className="block text-sm text-error font-medium">Số lượng hết hạn</span>
                    <span className="text-2xl font-bold text-error">{(voucher.expiredCount || 0).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* MODE B: Inline Edit Form (UC Chỉnh sửa voucher) */
          <form onSubmit={handleSaveEdit} className="bg-surface-bright rounded-xl border border-outline-variant p-6 shadow-sm space-y-6">
            <h2 className="text-lg font-bold text-on-surface border-b border-outline-variant/40 pb-3 flex items-center gap-2">
              <Icon name="edit" className="text-primary" /> Chỉnh sửa Chương trình Voucher
            </h2>

            <div className="space-y-5 text-base">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block font-semibold text-on-surface mb-1">Mã chương trình (Không đổi)</label>
                  <input
                    type="text"
                    disabled
                    value={voucher.code}
                    className="w-full border border-outline-variant rounded-lg px-4 py-3 bg-surface-container text-on-surface-variant cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-on-surface mb-1">Tên chương trình *</label>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full border border-outline-variant rounded-lg px-4 py-3 text-on-surface outline-none focus:ring-2 focus:ring-primary"
                  />
                  {errors.title && <p className="text-sm text-error mt-1">{errors.title}</p>}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-on-surface mb-1">Danh mục sản phẩm</label>
                <select
                  value={editCategoryId}
                  onChange={(e) => setEditCategoryId(e.target.value)}
                  className="w-full border border-outline-variant rounded-lg px-4 py-3 text-on-surface outline-none"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Giá gốc, Giá bán, Mức giảm */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <div>
                  <label className="block font-semibold text-on-surface mb-1">Giá gốc (VNĐ) *</label>
                  <input
                    type="number"
                    value={editOriginalPriceStr}
                    onChange={(e) => setEditOriginalPriceStr(e.target.value)}
                    className="w-full border border-outline-variant rounded-lg px-4 py-3 text-on-surface outline-none"
                  />
                  {errors.originalPrice && <p className="text-sm text-error mt-1">{errors.originalPrice}</p>}
                </div>

                <div>
                  <label className="block font-semibold text-on-surface mb-1">Giá bán (VNĐ) *</label>
                  <input
                    type="number"
                    value={editSellingPriceStr}
                    onChange={(e) => setEditSellingPriceStr(e.target.value)}
                    className="w-full border border-outline-variant rounded-lg px-4 py-3 text-on-surface outline-none"
                  />
                  {errors.sellingPrice && <p className="text-sm text-error mt-1">{errors.sellingPrice}</p>}
                </div>

                <div>
                  <label className="block font-semibold text-on-surface mb-1 text-primary">[Mức giảm tính toán]</label>
                  <div className="w-full border border-primary/40 bg-primary-container/20 rounded-lg px-4 py-3 text-lg font-bold text-primary">
                    {editDiscountAmount > 0 ? `${editDiscountAmount.toLocaleString()} VNĐ` : "0 VNĐ"}
                  </div>
                </div>
              </div>

              {/* Số lượng phát hành */}
              <div>
                <label className="block font-semibold text-on-surface mb-1">Số lượng phát hành *</label>
                <input
                  type="number"
                  value={editIssuedQuantityStr}
                  onChange={(e) => setEditIssuedQuantityStr(e.target.value)}
                  className="w-full border border-outline-variant rounded-lg px-4 py-3 text-on-surface outline-none"
                />
              </div>

              {/* Thời gian bán & Thời gian sử dụng */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block font-semibold text-on-surface mb-1">Thời gian bắt đầu bán *</label>
                  <input
                    type="date"
                    value={editSellStartDate}
                    onChange={(e) => setEditSellStartDate(e.target.value)}
                    className="w-full border border-outline-variant rounded-lg px-4 py-3 text-on-surface outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-on-surface mb-1">Thời gian kết thúc bán *</label>
                  <input
                    type="date"
                    value={editSellEndDate}
                    onChange={(e) => setEditSellEndDate(e.target.value)}
                    className="w-full border border-outline-variant rounded-lg px-4 py-3 text-on-surface outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block font-semibold text-on-surface mb-1">Thời gian bắt đầu sử dụng *</label>
                  <input
                    type="date"
                    value={editUseStartDate}
                    onChange={(e) => setEditUseStartDate(e.target.value)}
                    className="w-full border border-outline-variant rounded-lg px-4 py-3 text-on-surface outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-on-surface mb-1">Thời gian kết thúc sử dụng *</label>
                  <input
                    type="date"
                    value={editUseEndDate}
                    onChange={(e) => setEditUseEndDate(e.target.value)}
                    className="w-full border border-outline-variant rounded-lg px-4 py-3 text-on-surface outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-outline-variant/40">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-5 py-2.5 text-on-surface-variant hover:bg-surface-container-high rounded-lg font-semibold"
                >
                  Hủy chỉnh sửa
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-primary text-on-primary font-bold rounded-lg hover:bg-surface-tint shadow-sm"
                >
                  Lưu thay đổi
                </button>
              </div>
            </div>
          </form>
        )}
      </main>
    </div>
  );
}
