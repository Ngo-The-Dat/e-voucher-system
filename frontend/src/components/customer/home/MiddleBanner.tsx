"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Sparkles, Tag } from "lucide-react";
import { customerContentApi, CustomerBanner } from "@/lib/customer-api";
import { resolveTargetLink } from "@/lib/utils";

export default function MiddleBanner() {
  const [banner, setBanner] = useState<CustomerBanner | null>(null);

  useEffect(() => {
    let isMounted = true;
    customerContentApi
      .getBanners("HOME_MIDDLE")
      .then((res) => {
        if (isMounted && res.banners && res.banners.length > 0) {
          setBanner(res.banners[0]);
        }
      })
      .catch((err) => {
        console.error("Failed to load middle banner:", err);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  if (!banner) return null;

  const targetLink = resolveTargetLink(banner);

  return (
    <section className="py-12 px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto">
      <div className="relative rounded-3xl overflow-hidden shadow-xl border border-outline-variant/30 min-h-[300px] flex items-center">
        {/* Background Image & Gradient */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url('${banner.image_url}')` }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/70 to-transparent" />

        {/* Content */}
        <div className="relative z-10 p-8 sm:p-12 md:p-16 max-w-2xl text-white">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-primary text-on-primary text-xs font-bold uppercase tracking-wider mb-4 shadow-sm">
            <Sparkles className="w-3.5 h-3.5" /> Khuyến mãi tâm điểm
          </div>

          {banner.brand_name && (
            <p className="text-sm font-semibold text-white/80 uppercase tracking-wide mb-2">
              {banner.brand_name}
            </p>
          )}

          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white mb-4 leading-tight">
            {banner.title}
          </h2>

          {banner.program_name && (
            <p className="text-sm sm:text-base text-white/80 mb-6 line-clamp-2">
              {banner.program_name}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-4">
            {banner.sale_price && (
              <div className="flex items-center gap-2 bg-white/15 px-4 py-2 rounded-xl backdrop-blur-md border border-white/20">
                <Tag className="w-4 h-4 text-primary-container" />
                <span className="text-lg font-bold text-white">
                  {Number(banner.sale_price).toLocaleString("vi-VN")} đ
                </span>
                {banner.original_price && banner.original_price > banner.sale_price && (
                  <span className="text-xs text-white/60 line-through">
                    {Number(banner.original_price).toLocaleString("vi-VN")} đ
                  </span>
                )}
              </div>
            )}

            <Link
              href={targetLink}
              className="px-6 py-3 bg-primary text-on-primary font-semibold rounded-xl hover:shadow-lg hover:-translate-y-0.5 transition-all flex items-center gap-2 text-sm cursor-pointer"
            >
              Xem ngay <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
