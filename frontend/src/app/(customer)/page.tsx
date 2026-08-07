"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useApp } from "@/context/AppContext";
import VoucherCard from "@/components/customer/cards/VoucherCard";
import {
  Utensils,
  ShoppingBag,
  Sparkles,
  Plane,
  Ticket,
  ArrowRight,
  Flame,
  BadgeCheck,
  ShieldCheck,
  Zap
} from "lucide-react";

export default function Home() {
  const router = useRouter();
  const { vouchers } = useApp();

  // Get best selling and featured vouchers
  const featuredVouchers = vouchers.filter((v) => v.featured || v.bestSeller).slice(0, 4);

  const categories = [
    {
      name: "Ăn uống",
      count: "1,200+ Voucher",
      IconComponent: Utensils,
      bgClass: "bg-primary/90",
      textClass: "text-on-primary",
      image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDPI0Zud12UE6MSw7OXu6g2KMXdb5RIsWfb-1LCu10zoGY5dzmpyN6zgeCv1pKbl1faVWCZ2ldZOXQ3139MoJAdj15lyLWil9tx14XE_oNZ7mEDuUCsvrWKB6HFigD2GazgooKGnE1TdawkD65MGBIvmjc8dbrc1iLJw1D7IN7ri8zXO-gK4D4A06bvHQoeiOi29quFcDJ0-LKbNTOXimMSJDGi-DY_nk1vh3QW0MSSe1NflXKpvRPQ",
      span: "col-span-2 row-span-2 h-96 md:h-auto"
    },
    {
      name: "Mua sắm",
      IconComponent: ShoppingBag,
      bgClass: "bg-secondary-container",
      iconClass: "text-on-secondary-container",
      span: "col-span-1 h-48"
    },
    {
      name: "Làm đẹp",
      IconComponent: Sparkles,
      bgClass: "bg-tertiary-container",
      iconClass: "text-on-tertiary-container",
      span: "col-span-1 h-48"
    },
    {
      name: "Du lịch",
      IconComponent: Plane,
      bgClass: "bg-error-container",
      iconClass: "text-on-error-container",
      span: "col-span-1 h-48"
    },
    {
      name: "Giải trí",
      IconComponent: Ticket,
      bgClass: "bg-primary-container",
      iconClass: "text-on-primary-container",
      span: "col-span-1 h-48"
    }
  ];

  const handleCategorySearch = (catName: string) => {
    router.push(`/vouchers?category=${encodeURIComponent(catName)}`);
  };

  return (
    <main className="flex-grow">
      {/* Hero Section */}
      <section className="relative bg-surface-container-low pt-24 pb-32 px-margin-mobile md:px-margin-desktop overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div
            className="w-full h-full bg-cover bg-center opacity-30 mix-blend-multiply"
            style={{
              backgroundImage:
                "url('https://lh3.googleusercontent.com/aida-public/AB6AXuAEyX6QrXDI3jCpu330ltSLLYmJci5pYryyT9RyP0VW2sYFFbBpZ46v2L84u2VDCfwb1PmHuxQ-L9ufzDVSRgQiIR6UcxeD3bi45lt3iOozvrENQVJVG1YbezmCPv5dt9WjTv9Q5MkH2JNc5hxXymdVT4FR8pPsgTZXSiFxAN84BWxCAWVqC0JIkacFvn1FnnKS21o-zKvSV8gkMttQBATioXZphOqzXO9uheiZMxTvHyF08h88-eae')"
            }}
          />
        </div>
        <div className="relative z-10 max-w-container-max mx-auto flex flex-col items-center text-center">
          <h1 className="font-headline-xl text-headline-xl text-on-background mb-6 max-w-3xl leading-tight">
            Voucher tốt hơn cho mọi trải nghiệm
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant mb-10 max-w-2xl">
            Khám phá hàng ngàn ưu đãi độc quyền từ các thương hiệu hàng đầu. Mua sắm thông minh,
            tiết kiệm tối đa cùng Lumina Marketplace.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/vouchers"
              className="px-8 py-4 bg-primary text-on-primary rounded-lg font-label-md text-label-md font-semibold hover:-translate-y-1 hover:shadow-md transition-all cursor-pointer"
            >
              Khám phá voucher
            </Link>
          </div>
        </div>
      </section>

      {/* Popular Categories (Bento Grid) */}
      <section className="py-20 px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto">
        <div className="flex items-end justify-between mb-10">
          <div>
            <h2 className="font-headline-lg text-headline-lg font-bold text-on-background mb-2">
              Danh mục phổ biến
            </h2>
            <p className="font-body-md text-body-md text-on-surface-variant">
              Lựa chọn hàng đầu từ cộng đồng
            </p>
          </div>
          <Link
            href="/vouchers"
            className="font-label-md text-label-md text-primary font-semibold hover:underline flex items-center gap-1"
          >
            Xem tất cả <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-gutter auto-rows-min">
          {categories.map((cat, index) => {
            const Icon = cat.IconComponent;

            if (cat.image) {
              return (
                <button
                  key={index}
                  onClick={() => handleCategorySearch(cat.name)}
                  className={`${cat.span} group relative rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer text-left w-full`}
                >
                  <div
                    className="absolute inset-0 bg-cover bg-center group-hover:scale-105 transition-transform duration-500"
                    style={{ backgroundImage: `url('${cat.image}')` }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-on-background/80 to-transparent" />
                  <div className="absolute bottom-0 left-0 p-6">
                    <div
                      className={`${cat.bgClass} ${cat.textClass} p-2 rounded-lg inline-flex mb-3 backdrop-blur-sm`}
                    >
                      <Icon className="w-6 h-6" />
                    </div>
                    <h3 className="font-title-md text-title-md text-white font-bold">{cat.name}</h3>
                    <p className="font-label-sm text-label-sm text-surface-bright/80">{cat.count}</p>
                  </div>
                </button>
              );
            }

            return (
              <button
                key={index}
                onClick={() => handleCategorySearch(cat.name)}
                className={`${cat.span} group relative rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 bg-surface-container hover:bg-surface-container-high cursor-pointer flex flex-col items-center justify-center p-4 text-center w-full`}
              >
                <div
                  className={`${cat.bgClass} ${cat.iconClass} p-4 rounded-full mb-3 group-hover:scale-110 transition-transform flex items-center justify-center`}
                >
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="font-title-md text-title-md text-on-surface font-bold">{cat.name}</h3>
              </button>
            );
          })}
        </div>
      </section>

      {/* Featured Deals */}
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
            {featuredVouchers.map((voucher) => (
              <VoucherCard key={voucher.id} voucher={voucher} />
            ))}
          </div>
        </div>
      </section>

      {/* Trust Badges */}
      <section className="py-16 bg-surface border-y border-outline-variant/30 px-margin-mobile md:px-margin-desktop">
        <div className="max-w-container-max mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 text-center divide-y md:divide-y-0 md:divide-x divide-outline-variant/30">
          <div className="flex flex-col items-center py-4 md:py-0 px-4">
            <div className="w-16 h-16 bg-primary-container/20 rounded-full flex items-center justify-center mb-4 text-primary">
              <BadgeCheck className="w-8 h-8" />
            </div>
            <h3 className="font-title-md text-title-md font-bold text-on-surface mb-2">
              Voucher chính hãng
            </h3>
            <p className="font-body-md text-body-md text-on-surface-variant">
              100% voucher được phát hành trực tiếp từ các đối tác thương hiệu uy tín.
            </p>
          </div>
          <div className="flex flex-col items-center py-4 md:py-0 px-4">
            <div className="w-16 h-16 bg-secondary-container/20 rounded-full flex items-center justify-center mb-4 text-secondary">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <h3 className="font-title-md text-title-md font-bold text-on-surface mb-2">
              Thanh toán an toàn
            </h3>
            <p className="font-body-md text-body-md text-on-surface-variant">
              Hệ thống thanh toán bảo mật đa lớp, hỗ trợ nhiều phương thức linh hoạt.
            </p>
          </div>
          <div className="flex flex-col items-center py-4 md:py-0 px-4">
            <div className="w-16 h-16 bg-tertiary-container/20 rounded-full flex items-center justify-center mb-4 text-tertiary">
              <Zap className="w-8 h-8" />
            </div>
            <h3 className="font-title-md text-title-md font-bold text-on-surface mb-2">
              Nhận voucher tức thì
            </h3>
            <p className="font-body-md text-body-md text-on-surface-variant">
              Mã e-voucher được gửi ngay lập tức qua ứng dụng và email sau khi thanh toán.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
