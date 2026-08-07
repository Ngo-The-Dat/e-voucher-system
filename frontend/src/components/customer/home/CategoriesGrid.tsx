"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Utensils,
  ShoppingBag,
  Sparkles,
  Plane,
  Ticket,
  ArrowRight
} from "lucide-react";

export default function CategoriesGrid() {
  const router = useRouter();

  // In the future, this data should be fetched from the backend API
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
  );
}
