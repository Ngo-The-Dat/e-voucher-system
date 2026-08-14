"use client";

import { useState, useEffect, useRef } from "react";
import TopAppBar from "@/components/partner/layout/TopAppBar";
import Icon from "@/components/shared/ui/Icon";
import Toast from "@/components/shared/ui/Toast";
import ValidationErrorBanner from "@/components/shared/ui/ValidationErrorBanner";
import { Button } from "@/components/shared/ui/Button";
import Link from "next/link";
import { useRouter } from "next/navigation";
import VoucherGeneralSection from "@/components/partner/voucher/VoucherGeneralSection";
import VoucherPricingSection from "@/components/partner/voucher/VoucherPricingSection";
import VoucherDateSection from "@/components/partner/voucher/VoucherDateSection";
import { partnerApi } from "@/lib/partner-api";
import { CategoryOption, CreateVoucherInput, VoucherFormErrors } from "@/lib/types/voucher";
import { Branch } from "@/lib/types/profile";
import VoucherImageGallery, { GalleryImageItem } from "@/components/partner/voucher/VoucherImageGallery";

export default function CreateVoucherPage() {
  const router = useRouter();

  // Form state
  const [partnerBranches, setPartnerBranches] = useState<Branch[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [code, setCode] = useState(`VC-HL-${Math.floor(1000 + Math.random() * 9000)}`);
  const [title, setTitle] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [selectedBranchIds, setSelectedBranchIds] = useState<string[]>([]);
  const [originalPriceStr, setOriginalPriceStr] = useState("");
  const [sellingPriceStr, setSellingPriceStr] = useState("");
  const [issuedQuantityStr, setIssuedQuantityStr] = useState("1000");
  const [sellStartDate, setSellStartDate] = useState("");
  const [sellEndDate, setSellEndDate] = useState("");
  const [useStartDate, setUseStartDate] = useState("");
  const [useEndDate, setUseEndDate] = useState("");
  const [errors, setErrors] = useState<VoucherFormErrors>({});
  const [isSuccessToast, setIsSuccessToast] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [galleryImages, setGalleryImages] = useState<GalleryImageItem[]>([]);
  const [createdProgramId, setCreatedProgramId] = useState<string | null>(null);
  const submitLockRef = useRef(false);
  const previewUrlsRef = useRef(new Set<string>());

  useEffect(() => {
    Promise.all([partnerApi.getBranches(), partnerApi.getCategories()])
      .then(([branches, rows]) => {
        setPartnerBranches(branches);
        setSelectedBranchIds(branches.filter((b) => b.status === "active").map((b) => b.id));
        setCategories(rows); setCategoryId(rows[0]?.id ?? "");
      })
      .catch((error) => console.error("Failed to load voucher form data", error));
  }, []);

  useEffect(() => () => {
    previewUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    previewUrlsRef.current.clear();
  }, []);

  const handleFilesAdded = (files: File[]) => {
    const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
    const accepted: GalleryImageItem[] = [];
    const rejected: string[] = [];

    for (const file of files) {
      if (!allowedTypes.has(file.type)) {
        rejected.push(`${file.name}: sai định dạng`);
        continue;
      }
      if (file.size > 5 * 1024 * 1024) {
        rejected.push(`${file.name}: vượt quá 5 MB`);
        continue;
      }
      const url = URL.createObjectURL(file);
      previewUrlsRef.current.add(url);
      accepted.push({
        id: globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`,
        url,
        name: file.name,
        size: file.size,
        file,
        isPrimary: false,
        sortOrder: 0,
        status: "pending",
      });
    }

    setGalleryImages((current) => {
      const hasPrimary = current.some((item) => item.isPrimary);
      return [...current, ...accepted].map((item, index) => ({
        ...item,
        isPrimary: item.isPrimary || (!hasPrimary && index === current.length),
        sortOrder: index,
      }));
    });
    setSubmitError(rejected.length > 0 ? rejected.join("; ") : null);
  };

  const handleRemoveImage = (id: string) => {
    setGalleryImages((current) => {
      const removed = current.find((item) => item.id === id);
      if (removed?.status === "uploaded") {
        setSubmitError("Ảnh đã upload chỉ có thể xóa tại trang chỉnh sửa voucher.");
        return current;
      }
      if (removed?.url.startsWith("blob:")) {
        URL.revokeObjectURL(removed.url);
        previewUrlsRef.current.delete(removed.url);
      }
      const remaining = current.filter((item) => item.id !== id);
      const needsPrimary = removed?.isPrimary && remaining.length > 0;
      return remaining.map((item, index) => ({
        ...item,
        isPrimary: needsPrimary ? index === 0 : item.isPrimary,
        sortOrder: index,
      }));
    });
  };

  const handleSetPrimaryImage = (id: string) => {
    const target = galleryImages.find((item) => item.id === id);
    if (target?.status === "uploaded") {
      setSubmitError("Ảnh đã upload chỉ có thể đổi ảnh chính tại trang chỉnh sửa voucher.");
      return;
    }
    setGalleryImages((current) => current.map((item) => ({
      ...item,
      isPrimary: item.id === id,
    })));
  };

  const originalPrice = parseFloat(originalPriceStr) || 0;
  const sellingPrice = parseFloat(sellingPriceStr) || 0;
  const issuedQuantity = Number(issuedQuantityStr);
  const discountAmount = originalPrice > sellingPrice ? originalPrice - sellingPrice : 0;

  const handleBranchToggle = (branchId: string) => {
    setSelectedBranchIds((prev) =>
      prev.includes(branchId) ? prev.filter((id) => id !== branchId) : [...prev, branchId]
    );
    if (errors.branches) setErrors((prev) => ({ ...prev, branches: "" }));
  };

  const validateForm = (): boolean => {
    const newErrors: VoucherFormErrors = {};
    if (!code.trim()) newErrors.code = "Vui lòng nhập Mã chương trình.";
    if (!title.trim()) newErrors.title = "Vui lòng nhập Tên chương trình.";
    if (!categoryId) newErrors.category = "Vui lòng chọn Danh mục sản phẩm.";
    if (selectedBranchIds.length === 0) newErrors.branches = "Vui lòng chọn ít nhất 1 chi nhánh áp dụng.";
    if (!originalPriceStr.trim() || originalPrice <= 0) newErrors.originalPrice = "Vui lòng nhập Giá gốc hợp lệ (lớn hơn 0).";
    if (!sellingPriceStr.trim() || sellingPrice < 0) {
      newErrors.sellingPrice = "Vui lòng nhập Giá bán hợp lệ.";
    } else if (sellingPrice > originalPrice) {
      newErrors.sellingPrice = "Giá bán không thể lớn hơn Giá gốc.";
    }
    if (!Number.isSafeInteger(issuedQuantity) || issuedQuantity <= 0) newErrors.issuedQuantity = "Số lượng phát hành phải là số nguyên dương.";
    if (!sellStartDate.trim()) newErrors.sellStartDate = "Vui lòng chọn Thời gian bắt đầu bán.";
    if (!sellEndDate.trim()) {
      newErrors.sellEndDate = "Vui lòng chọn Thời gian kết thúc bán.";
    } else if (sellStartDate && new Date(sellEndDate) <= new Date(sellStartDate)) {
      newErrors.sellEndDate = "Thời gian kết thúc bán phải sau Thời gian bắt đầu bán.";
    }
    if (!useStartDate.trim()) newErrors.useStartDate = "Vui lòng chọn Thời gian bắt đầu sử dụng.";
    if (!useEndDate.trim()) {
      newErrors.useEndDate = "Vui lòng chọn Thời gian kết thúc sử dụng.";
    } else if (useStartDate && new Date(useEndDate) <= new Date(useStartDate)) {
      newErrors.useEndDate = "Thời gian kết thúc sử dụng phải sau Thời gian bắt đầu sử dụng.";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitLockRef.current) return;

    if (!validateForm()) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    submitLockRef.current = true;
    setIsSubmitting(true);
    setSubmitError(null);

    const selectedCategory = categories.find((c) => c.id === categoryId);
    const selectedBranches = partnerBranches.filter((b) => selectedBranchIds.includes(b.id));

    const voucher: CreateVoucherInput = {
      id: code.trim(),
      code: code.trim(),
      title: title.trim(),
      categoryId,
      categoryName: selectedCategory?.name ?? "Khác",
      branchIds: selectedBranchIds,
      branchNames: selectedBranches.map((b) => b.name),
      originalPrice,
      sellingPrice,
      discountAmount,
      issuedQuantity,
      sellStartDate,
      sellEndDate,
      useStartDate,
      useEndDate,
      status: "draft",
      soldCount: 0,
      usedCount: 0,
      expiredCount: 0,
    };
    try {
      let programId = createdProgramId;
      if (!programId) {
        const created = await partnerApi.createVoucher(voucher);
        programId = String(created.program.program_id);
        setCreatedProgramId(programId);
      }

      let failedUploads = 0;
      const uploadedIds = new Map<string, string>();
      for (const item of galleryImages.filter((image) => image.file && image.status !== "uploaded")) {
        setGalleryImages((current) => current.map((image) =>
          image.id === item.id ? { ...image, status: "uploading", error: undefined } : image
        ));
        try {
          const uploaded = await partnerApi.uploadVoucherImage(
            programId,
            item.file!,
            item.isPrimary,
            item.sortOrder,
          );
          uploadedIds.set(item.id, uploaded.id);
          setGalleryImages((current) => current.map((image) =>
            image.id === item.id
              ? { ...image, id: uploaded.id, url: uploaded.url, status: "uploaded", error: undefined }
              : image
          ));
          if (item.url.startsWith("blob:")) {
            URL.revokeObjectURL(item.url);
            previewUrlsRef.current.delete(item.url);
          }
        } catch (error) {
          failedUploads += 1;
          const message = error instanceof Error ? error.message : "Upload thất bại";
          setGalleryImages((current) => current.map((image) =>
            image.id === item.id ? { ...image, status: "error", error: message } : image
          ));
        }
      }

      if (failedUploads > 0) {
        submitLockRef.current = false;
        setIsSubmitting(false);
        setSubmitError(
          `Voucher Draft #${programId} đã được tạo, nhưng ${failedUploads} ảnh upload thất bại. Hãy thử lại các ảnh lỗi.`
        );
        return;
      }
      const finalImageIds = galleryImages.map((item) => uploadedIds.get(item.id) ?? item.id);
      if (finalImageIds.length > 0 && finalImageIds.every((id) => /^\d+$/.test(id))) {
        await partnerApi.reorderVoucherImages(programId, finalImageIds);
      }
      setIsSuccessToast(true);
      setTimeout(() => router.push("/partner/vouchers"), 1500);
    } catch (error) {
      submitLockRef.current = false;
      setIsSubmitting(false);
      setSubmitError(error instanceof Error ? error.message : "Không thể tạo voucher. Vui lòng thử lại.");
    }
  };

  const errorCount = Object.keys(errors).length;

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-background min-h-screen relative pb-28 w-full">
      <TopAppBar title="Tạo voucher mới" />

      <Toast message={isSuccessToast ? "Tạo mới chương trình voucher thành công! Đang chuyển về danh sách..." : null} />
      <Toast message={submitError} type="error" />

      <main className="p-6 md:p-8 flex-1 overflow-y-auto max-w-5xl w-full mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center pb-2 border-b border-outline-variant/40">
          <div>
            <h2 className="text-2xl font-bold text-on-surface">Tạo chương trình voucher mới</h2>
            <p className="text-base text-on-surface-variant">
              Điền đầy đủ các thông tin dưới đây để khởi tạo chương trình voucher mới.
            </p>
          </div>
          <Button variant="outline" className="gap-1.5" asChild>
            <Link href="/partner/vouchers">
              <Icon name="arrow_back" /> Trở về danh sách
            </Link>
          </Button>
        </div>

        <ValidationErrorBanner errorCount={errorCount} submitLabel="Tạo voucher" />

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <fieldset disabled={createdProgramId !== null} className="space-y-6 disabled:opacity-70">
            <VoucherGeneralSection
              code={code}
              title={title}
              categoryId={categoryId}
              categories={categories}
              partnerBranches={partnerBranches}
              selectedBranchIds={selectedBranchIds}
              errors={errors}
              onCodeChange={(v) => { setCode(v); if (errors.code) setErrors((p) => ({ ...p, code: "" })); }}
              onTitleChange={(v) => { setTitle(v); if (errors.title) setErrors((p) => ({ ...p, title: "" })); }}
              onCategoryChange={setCategoryId}
              onBranchToggle={handleBranchToggle}
            />

            <VoucherPricingSection
              originalPriceStr={originalPriceStr}
              sellingPriceStr={sellingPriceStr}
              issuedQuantityStr={issuedQuantityStr}
              discountAmount={discountAmount}
              errors={errors}
              onOriginalPriceChange={(v) => { setOriginalPriceStr(v); if (errors.originalPrice) setErrors((p) => ({ ...p, originalPrice: "" })); }}
              onSellingPriceChange={(v) => { setSellingPriceStr(v); if (errors.sellingPrice) setErrors((p) => ({ ...p, sellingPrice: "" })); }}
              onIssuedQuantityChange={(v) => { setIssuedQuantityStr(v); if (errors.issuedQuantity) setErrors((p) => ({ ...p, issuedQuantity: "" })); }}
            />

            <VoucherDateSection
              sellStartDate={sellStartDate}
              sellEndDate={sellEndDate}
              useStartDate={useStartDate}
              useEndDate={useEndDate}
              errors={errors}
              onSellStartChange={(v) => { setSellStartDate(v); if (errors.sellStartDate) setErrors((p) => ({ ...p, sellStartDate: "" })); }}
              onSellEndChange={(v) => { setSellEndDate(v); if (errors.sellEndDate) setErrors((p) => ({ ...p, sellEndDate: "" })); }}
              onUseStartChange={(v) => { setUseStartDate(v); if (errors.useStartDate) setErrors((p) => ({ ...p, useStartDate: "" })); }}
              onUseEndChange={(v) => { setUseEndDate(v); if (errors.useEndDate) setErrors((p) => ({ ...p, useEndDate: "" })); }}
            />
          </fieldset>

          <VoucherImageGallery
            items={galleryImages}
            editable
            busy={isSubmitting}
            onFilesAdded={handleFilesAdded}
            onRemove={handleRemoveImage}
            onSetPrimary={handleSetPrimaryImage}
            onReorder={setGalleryImages}
          />

          {/* Actions */}
          <div className="flex justify-end items-center gap-4 pt-2">
            <Button variant="ghost" size="lg" asChild>
              <Link href="/partner/vouchers">
                Hủy bỏ
              </Link>
            </Button>
            <Button type="submit" size="lg" className="shadow-md gap-2" isLoading={isSubmitting}>
              <Icon name="add" className="text-xl" />
              <span>{isSubmitting ? "Đang lưu..." : createdProgramId ? "Thử lại upload ảnh" : "Tạo voucher"}</span>
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}
