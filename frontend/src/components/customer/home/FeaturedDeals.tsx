"use client";

import Link from "next/link";
import { Flame, ArrowRight } from "lucide-react";
import VoucherCard from "@/components/customer/cards/VoucherCard";
import { useApp } from "@/context/AppContext";

export default function FeaturedDeals() {
  const { vouchers } = useApp();
  const featuredVouchers = vouchers.filter((v) => v.featured || v.bestSeller).slice(0, 4);
  const displayVouchers = featuredVouchers.length > 0 ? featuredVouchers : vouchers.slice(0, 4);

  return (
    <section className="py-20 bg-surface-container-lowest px-margin-mobile md:px-margin-desktop relative overflow-hidden">
      {/* Decorative blur blobs */}
      <div className="absolute -top-24 -left-24 w-64 h-64 bg-primary-fixed/30 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-tertiary-fixed/20 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-container-max mx-auto relative z-10">
        <div className="flex items-end justify-between mb-10">
          <div>
            <h2 className="font-headline-lg text-headline-lg font-bold text-on-background mb-2 flex items-center gap-2">
              Ưu đãi nổi bật{" "}
              <Flame className="w-6 h-6 text-error fill-error" />
            </h2>
            <p className="font-body-md text-body-md text-on-surface-variant">
              Săn deal hot nhất ngày hôm nay
            </p>
          </div>
          <Link
            href="/vouchers"
            className="font-label-md text-label-md text-primary font-semibold hover:underline flex items-center gap-1"
          >
            Xem tất cả <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-gutter">
          {displayVouchers.map((voucher) => (
            <VoucherCard key={voucher.id} voucher={voucher} />
          ))}
        </div>
      </div>
    </section>
  );
}
