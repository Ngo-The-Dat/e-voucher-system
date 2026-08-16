"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import Icon from "@/components/shared/ui/Icon";
import { partnerApi } from "@/lib/partner-api";

interface BrandLogoSectionProps {
  brandLogo?: string | null;
  businessName: string;
  onChange: (value: string) => void;
  onUploadSuccess?: (url: string) => void;
}

export default function BrandLogoSection({
  brandLogo,
  businessName,
  onChange,
  onUploadSuccess,
}: BrandLogoSectionProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setUploadError("Chỉ chấp nhận định dạng ảnh JPG, PNG hoặc WebP.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setUploadError("Kích thước file không được vượt quá 5MB.");
      return;
    }

    setUploadError(null);
    setIsUploading(true);

    try {
      const res = await partnerApi.uploadBrandLogo(file);
      onChange(res.logo_url);
      if (onUploadSuccess) {
        onUploadSuccess(res.logo_url);
      }
    } catch (err: any) {
      setUploadError(err.message || "Tải ảnh logo thất bại.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <div className="bg-surface-bright border border-outline-variant rounded-xl p-6 shadow-sm w-full space-y-6">
      <h3 className="text-lg font-bold text-on-surface pb-3 border-b border-outline-variant/40 flex items-center gap-2">
        <Icon name="image" className="text-primary" />
        Logo thương hiệu (Brand Logo)
      </h3>

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
        {/* Logo Preview */}
        <div className="w-28 h-28 rounded-2xl border-2 border-dashed border-outline-variant bg-surface flex items-center justify-center overflow-hidden flex-shrink-0 relative group shadow-inner">
          {brandLogo ? (
            <Image
              src={brandLogo}
              alt={businessName || "Brand logo"}
              fill
              sizes="112px"
              className="object-contain p-2"
              unoptimized
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-on-surface-variant/60 p-2 text-center">
              <Icon name="image" className="text-3xl mb-1" />
              <span className="text-xs">Chưa có logo</span>
            </div>
          )}
        </div>

        {/* Logo Controls */}
        <div className="flex-1 space-y-3 w-full">
          <p className="text-sm font-semibold text-on-surface">
            Ảnh đại diện thương hiệu
          </p>
          <p className="text-xs text-on-surface-variant leading-relaxed">
            Hỗ trợ định dạng JPG, PNG, WebP (dung lượng tối đa 5MB). Logo sẽ được hiển thị cho khách hàng trên các trang voucher và thông tin đối tác.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
            />

            <button
              type="button"
              disabled={isUploading}
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-on-primary hover:bg-primary-hover font-semibold text-sm rounded-lg transition-colors shadow-sm disabled:opacity-50"
            >
              {isUploading ? (
                <>
                  <Icon name="progress_activity" className="animate-spin text-on-primary" />
                  <span>Đang tải lên...</span>
                </>
              ) : (
                <>
                  <Icon name="upload" className="text-[18px]" />
                  <span>Tải ảnh logo lên</span>
                </>
              )}
            </button>

            {brandLogo && (
              <button
                type="button"
                disabled={isUploading}
                onClick={() => {
                  onChange("");
                  setUploadError(null);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2.5 text-sm font-medium text-error bg-error/10 hover:bg-error/20 rounded-lg transition-colors disabled:opacity-50"
              >
                <Icon name="delete" className="text-base" />
                <span>Gỡ logo hiện tại</span>
              </button>
            )}
          </div>

          {uploadError && (
            <p className="text-sm text-error font-medium flex items-center gap-1.5 pt-1">
              <Icon name="error" className="text-base" />
              <span>{uploadError}</span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
