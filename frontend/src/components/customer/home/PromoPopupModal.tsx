"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { X, Sparkles, ArrowRight, Tag } from "lucide-react";
import { customerContentApi, CustomerPopup } from "@/lib/customer-api";

export default function PromoPopupModal() {
  const [popup, setPopup] = useState<CustomerPopup | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;
    customerContentApi
      .getActivePopups()
      .then((res) => {
        if (!isMounted || !res.popups || res.popups.length === 0) return;
        const firstPopup = res.popups[0];
        setPopup(firstPopup);
        setTimeout(() => {
          if (isMounted) setIsOpen(true);
        }, 400);
      })
      .catch((err) => {
        console.error("Failed to load active popup:", err);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleClose = () => {
    setIsOpen(false);
  };

  if (!isOpen || !popup) return null;

  const targetLink = popup.target_url || (popup.program_id ? `/vouchers/${popup.program_id}` : "/vouchers");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div 
        className="relative w-full max-w-lg overflow-hidden bg-surface rounded-2xl shadow-2xl border border-outline-variant/30 transform transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Nút đóng */}
        <button
          onClick={handleClose}
          className="absolute top-3 right-3 z-20 p-2 rounded-full bg-surface/80 hover:bg-surface text-on-surface hover:text-primary transition-colors shadow-md backdrop-blur-sm cursor-pointer"
          aria-label="Đóng popup"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Ảnh banner popup */}
        {popup.image_url ? (
          <div className="relative w-full h-48 sm:h-56 bg-surface-container-high overflow-hidden">
            <img
              src={popup.image_url}
              alt={popup.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src =
                  "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&auto=format&fit=crop&q=80";
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/20 to-transparent" />
            <div className="absolute top-4 left-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary text-on-primary text-xs font-bold tracking-wide uppercase shadow-sm">
              <Sparkles className="w-3.5 h-3.5" /> Ưu Đãi Độc Quyền
            </div>
          </div>
        ) : (
          <div className="h-4 bg-gradient-to-r from-primary via-secondary to-primary" />
        )}

        {/* Nội dung popup */}
        <div className="p-6 sm:p-7 text-center">
          {popup.brand_name && (
            <span className="inline-block text-xs font-semibold text-primary uppercase tracking-wider mb-1">
              {popup.brand_name}
            </span>
          )}
          <h3 className="text-xl sm:text-2xl font-bold text-on-surface mb-2 leading-tight">
            {popup.title}
          </h3>
          <p className="text-sm text-on-surface-variant mb-5 line-clamp-3 leading-relaxed">
            {popup.content}
          </p>

          {/* Nếu có giá ưu đãi */}
          {popup.sale_price && (
            <div className="inline-flex items-center gap-2 px-4 py-2 mb-6 rounded-xl bg-surface-container-low border border-outline-variant/40">
              <Tag className="w-4 h-4 text-primary" />
              <span className="text-xs text-on-surface-variant">Chỉ từ:</span>
              <span className="text-lg font-bold text-primary">
                {Number(popup.sale_price).toLocaleString("vi-VN")} đ
              </span>
              {popup.original_price && popup.original_price > popup.sale_price && (
                <span className="text-xs text-on-surface-variant/60 line-through">
                  {Number(popup.original_price).toLocaleString("vi-VN")} đ
                </span>
              )}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
            <Link
              href={targetLink}
              onClick={handleClose}
              className="w-full sm:w-auto px-6 py-3 bg-primary text-on-primary font-semibold rounded-xl hover:shadow-lg hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 cursor-pointer text-sm"
            >
              Khám phá ngay <ArrowRight className="w-4 h-4" />
            </Link>
            <button
              onClick={handleClose}
              className="w-full sm:w-auto px-5 py-3 text-sm font-medium text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer"
            >
              Bỏ qua
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
