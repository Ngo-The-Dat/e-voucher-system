"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Sparkles, ArrowRight, Tag } from "lucide-react";
import { customerContentApi, CustomerBanner } from "@/lib/customer-api";

export default function HeroBanner() {
  const [banners, setBanners] = useState<CustomerBanner[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    let isMounted = true;
    customerContentApi
      .getBanners("HOME_TOP")
      .then((res) => {
        if (isMounted && res.banners && res.banners.length > 0) {
          setBanners(res.banners);
        }
      })
      .catch((err) => {
        console.error("Failed to load banners:", err);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleNext = useCallback(() => {
    if (banners.length === 0) return;
    setCurrentIndex((prev) => (prev + 1) % banners.length);
  }, [banners.length]);

  const handlePrev = useCallback(() => {
    if (banners.length === 0) return;
    setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length);
  }, [banners.length]);

  // Auto-play interval
  useEffect(() => {
    if (banners.length <= 1 || isPaused) return;
    const timer = setInterval(() => {
      handleNext();
    }, 5000);
    return () => clearInterval(timer);
  }, [banners.length, isPaused, handleNext]);

  // Fallback layout nếu chưa có banners từ DB
  if (banners.length === 0) {
    return (
      <section className="relative bg-surface-container-low pt-24 pb-32 px-margin-mobile md:px-margin-desktop overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div
            className="w-full h-full bg-cover bg-center opacity-30 mix-blend-multiply"
            style={{
              backgroundImage:
                "url('https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1600&auto=format&fit=crop&q=80')"
            }}
          />
        </div>
        <div className="relative z-10 max-w-container-max mx-auto flex flex-col items-center text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-6 border border-primary/20 backdrop-blur-sm">
            <Sparkles className="w-4 h-4" /> Hệ Thống Săn E-Voucher Toàn Diện
          </div>
          <h1 className="font-headline-xl text-headline-xl text-on-background mb-6 max-w-3xl leading-tight font-extrabold">
            Voucher tốt hơn cho mọi trải nghiệm
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant mb-10 max-w-2xl">
            Khám phá hàng ngàn ưu đãi độc quyền từ các thương hiệu hàng đầu. Mua sắm thông minh,
            tiết kiệm tối đa cùng Voucher Marketplace.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/vouchers"
              className="px-8 py-4 bg-primary text-on-primary rounded-xl font-label-md text-label-md font-semibold hover:-translate-y-1 hover:shadow-lg transition-all cursor-pointer flex items-center gap-2"
            >
              Khám phá voucher <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    );
  }

  const currentBanner = banners[currentIndex];
  const targetLink =
    currentBanner.target_url ||
    (currentBanner.program_id ? `/vouchers/${currentBanner.program_id}` : "/vouchers");

  return (
    <section
      className="relative bg-surface-container-low min-h-[460px] md:min-h-[520px] flex items-center px-margin-mobile md:px-margin-desktop overflow-hidden group"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Background Image với gradient overlay */}
      <div className="absolute inset-0 z-0">
        <div
          key={currentBanner.banner_id}
          className="w-full h-full bg-cover bg-center transition-all duration-700 ease-in-out scale-105"
          style={{
            backgroundImage: `url('${currentBanner.image_url}')`
          }}
        />
        {/* Dark & Gradient Overlay for readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/60 to-black/40" />
      </div>

      {/* Nội dung Slide */}
      <div className="relative z-10 max-w-container-max mx-auto w-full py-20 text-white">
        <div className="max-w-2xl">
          {/* Badge thương hiệu & Vị trí */}
          <div className="flex items-center gap-3 mb-4">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-primary text-on-primary text-xs font-bold uppercase tracking-wider shadow-sm">
              <Sparkles className="w-3.5 h-3.5" /> Nổi bật
            </span>
            {currentBanner.brand_name && (
              <span className="text-sm font-semibold text-white/90 bg-white/15 px-3 py-0.5 rounded-full backdrop-blur-sm">
                {currentBanner.brand_name}
              </span>
            )}
          </div>

          {/* Tiêu đề banner */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white mb-4 leading-tight">
            {currentBanner.title}
          </h1>

          {/* Tên chương trình & giá ưu đãi */}
          {currentBanner.program_name && (
            <p className="text-base sm:text-lg text-white/80 mb-6 line-clamp-2">
              {currentBanner.program_name}
            </p>
          )}

          {currentBanner.sale_price && (
            <div className="inline-flex items-center gap-3 px-4 py-2 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 mb-8">
              <Tag className="w-5 h-5 text-primary-container" />
              <span className="text-sm text-white/80">Chỉ với:</span>
              <span className="text-2xl font-bold text-white">
                {Number(currentBanner.sale_price).toLocaleString("vi-VN")} đ
              </span>
              {currentBanner.original_price && currentBanner.original_price > currentBanner.sale_price && (
                <span className="text-sm text-white/60 line-through">
                  {Number(currentBanner.original_price).toLocaleString("vi-VN")} đ
                </span>
              )}
            </div>
          )}

          {/* CTAs */}
          <div className="flex flex-wrap items-center gap-4">
            <Link
              href={targetLink}
              className="px-8 py-3.5 bg-primary text-on-primary rounded-xl font-semibold hover:-translate-y-0.5 hover:shadow-xl hover:bg-primary/90 transition-all cursor-pointer flex items-center gap-2 text-sm md:text-base"
            >
              Săn voucher ngay <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/vouchers"
              className="px-6 py-3.5 bg-white/15 text-white hover:bg-white/25 rounded-xl font-semibold backdrop-blur-sm transition-all cursor-pointer text-sm md:text-base"
            >
              Xem tất cả ưu đãi
            </Link>
          </div>
        </div>
      </div>

      {/* Điều hướng Trái / Phải (nếu có > 1 banner) */}
      {banners.length > 1 && (
        <>
          <button
            onClick={handlePrev}
            className="absolute left-4 z-20 p-2.5 rounded-full bg-black/40 hover:bg-black/70 text-white backdrop-blur-md transition-all opacity-0 group-hover:opacity-100 cursor-pointer"
            aria-label="Slide trước"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            onClick={handleNext}
            className="absolute right-4 z-20 p-2.5 rounded-full bg-black/40 hover:bg-black/70 text-white backdrop-blur-md transition-all opacity-0 group-hover:opacity-100 cursor-pointer"
            aria-label="Slide tiếp theo"
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          {/* Indicator Dots */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
            {banners.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`h-2.5 rounded-full transition-all cursor-pointer ${
                  currentIndex === idx ? "w-8 bg-primary" : "w-2.5 bg-white/50 hover:bg-white/80"
                }`}
                aria-label={`Đi tới banner ${idx + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
