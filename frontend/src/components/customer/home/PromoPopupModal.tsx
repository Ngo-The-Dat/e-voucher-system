"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { X, Sparkles, ArrowRight, Tag, ChevronLeft, ChevronRight } from "lucide-react";
import { customerContentApi, CustomerPopup } from "@/lib/customer-api";

export default function PromoPopupModal() {
  const [popups, setPopups] = useState<CustomerPopup[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    let isMounted = true;
    customerContentApi
      .getActivePopups()
      .then((res) => {
        if (!isMounted || !res.popups || res.popups.length === 0) return;
        setPopups(res.popups.slice(0, 5));
        setTimeout(() => {
          if (isMounted) setIsOpen(true);
        }, 400);
      })
      .catch((err) => {
        console.error("Failed to load active popups:", err);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleNext = useCallback(() => {
    setPopups((currentPopups) => {
      if (currentPopups.length > 0) {
        setCurrentIndex((prev) => (prev + 1) % currentPopups.length);
      }
      return currentPopups;
    });
  }, []);

  const handlePrev = useCallback(() => {
    setPopups((currentPopups) => {
      if (currentPopups.length > 0) {
        setCurrentIndex((prev) => (prev - 1 + currentPopups.length) % currentPopups.length);
      }
      return currentPopups;
    });
  }, []);

  // Chuyển popup tự động mỗi 5 giây
  useEffect(() => {
    if (!isOpen || popups.length <= 1) return;

    timerRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % popups.length);
    }, 5000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isOpen, popups.length]);

  const handleClose = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setIsOpen(false);
  };

  if (!isOpen || popups.length === 0) return null;

  const currentPopup = popups[currentIndex] || popups[0];
  const targetLink =
    currentPopup.target_url ||
    (currentPopup.program_id ? `/vouchers/${currentPopup.program_id}` : "/vouchers");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div
        className="relative w-full max-w-lg overflow-hidden bg-surface rounded-2xl shadow-2xl border border-outline-variant/30 transform transition-all group"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Thanh tiến trình thời gian 5s tự chuyển */}
        {popups.length > 1 && (
          <div className="absolute top-0 left-0 right-0 h-1 bg-surface-container-high z-30 overflow-hidden">
            <div
              key={currentIndex}
              className="h-full bg-primary transition-all ease-linear"
              style={{
                width: "100%",
                animation: "timerBar 5s linear infinite"
              }}
            />
          </div>
        )}

        {/* Nút đóng */}
        <button
          onClick={handleClose}
          className="absolute top-3 right-3 z-30 p-2 rounded-full bg-surface/80 hover:bg-surface text-on-surface hover:text-primary transition-colors shadow-md backdrop-blur-sm cursor-pointer"
          aria-label="Đóng popup"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Nút điều hướng trước / sau khi có nhiều popup */}
        {popups.length > 1 && (
          <>
            <button
              onClick={handlePrev}
              className="absolute left-3 top-1/3 -translate-y-1/2 z-30 p-2 rounded-full bg-black/50 hover:bg-black/80 text-white backdrop-blur-md transition-all opacity-70 group-hover:opacity-100 cursor-pointer shadow-md"
              aria-label="Popup trước"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={handleNext}
              className="absolute right-3 top-1/3 -translate-y-1/2 z-30 p-2 rounded-full bg-black/50 hover:bg-black/80 text-white backdrop-blur-md transition-all opacity-70 group-hover:opacity-100 cursor-pointer shadow-md"
              aria-label="Popup tiếp theo"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}

        {/* Ảnh banner popup */}
        {currentPopup.image_url ? (
          <div className="relative w-full h-48 sm:h-56 bg-surface-container-high overflow-hidden">
            <img
              key={currentPopup.popup_id}
              src={currentPopup.image_url}
              alt={currentPopup.title}
              className="w-full h-full object-cover transition-opacity duration-500"
              onError={(e) => {
                (e.target as HTMLImageElement).src =
                  "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&auto=format&fit=crop&q=80";
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/20 to-transparent" />
            <div className="absolute top-4 left-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary text-on-primary text-xs font-bold tracking-wide uppercase shadow-sm z-20">
              <Sparkles className="w-3.5 h-3.5" /> Ưu Đãi Độc Quyền ({currentIndex + 1}/{popups.length})
            </div>
          </div>
        ) : (
          <div className="h-4 bg-gradient-to-r from-primary via-secondary to-primary" />
        )}

        {/* Nội dung popup */}
        <div className="p-6 sm:p-7 text-center">
          {currentPopup.brand_name && (
            <span className="inline-block text-xs font-semibold text-primary uppercase tracking-wider mb-1">
              {currentPopup.brand_name}
            </span>
          )}
          <h3 className="text-xl sm:text-2xl font-bold text-on-surface mb-2 leading-tight">
            {currentPopup.title}
          </h3>
          <p className="text-sm text-on-surface-variant mb-5 line-clamp-3 leading-relaxed">
            {currentPopup.content}
          </p>

          {/* Nếu có giá ưu đãi */}
          {currentPopup.sale_price && (
            <div className="inline-flex items-center gap-2 px-4 py-2 mb-5 rounded-xl bg-surface-container-low border border-outline-variant/40">
              <Tag className="w-4 h-4 text-primary" />
              <span className="text-xs text-on-surface-variant">Chỉ từ:</span>
              <span className="text-lg font-bold text-primary">
                {Number(currentPopup.sale_price).toLocaleString("vi-VN")} đ
              </span>
              {currentPopup.original_price && currentPopup.original_price > currentPopup.sale_price && (
                <span className="text-xs text-on-surface-variant/60 line-through">
                  {Number(currentPopup.original_price).toLocaleString("vi-VN")} đ
                </span>
              )}
            </div>
          )}

          {/* Dot Indicators */}
          {popups.length > 1 && (
            <div className="flex items-center justify-center gap-1.5 mb-5">
              {popups.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentIndex(idx)}
                  className={`h-2 rounded-full transition-all cursor-pointer ${
                    currentIndex === idx ? "w-6 bg-primary" : "w-2 bg-outline-variant hover:bg-outline"
                  }`}
                  aria-label={`Popup ${idx + 1}`}
                />
              ))}
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
