"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Utensils,
  Sparkles,
  Plane,
  Ticket,
  ShoppingBag,
  ArrowRight
} from "lucide-react";
import { customerCatalogApi, CustomerCategory } from "@/lib/customer-api";

interface CategoryMeta {
  icon: React.ComponentType<{ className?: string }>;
  bgClass: string;
  iconClass: string;
  image?: string;
}

const CATEGORY_META_MAP: Record<string, CategoryMeta> = {
  "Ẩm thực & Nhà hàng": {
    icon: Utensils,
    bgClass: "bg-primary/90",
    iconClass: "text-on-primary",
    image:
      "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&auto=format&fit=crop&q=80"
  },
  "Làm đẹp & Spa": {
    icon: Sparkles,
    bgClass: "bg-tertiary-container",
    iconClass: "text-on-tertiary-container",
    image:
      "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800&auto=format&fit=crop&q=80"
  },
  "Du lịch & Khách sạn": {
    icon: Plane,
    bgClass: "bg-secondary-container",
    iconClass: "text-on-secondary-container",
    image:
      "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&auto=format&fit=crop&q=80"
  },
  "Giải trí & Sự kiện": {
    icon: Ticket,
    bgClass: "bg-primary-container",
    iconClass: "text-on-primary-container",
    image:
      "https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=800&auto=format&fit=crop&q=80"
  }
};

const DEFAULT_META: CategoryMeta = {
  icon: ShoppingBag,
  bgClass: "bg-surface-container-high",
  iconClass: "text-primary"
};

export default function CategoriesGrid() {
  const router = useRouter();
  const [categories, setCategories] = useState<CustomerCategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    customerCatalogApi
      .getCategories()
      .then((res) => {
        if (isMounted) {
          setCategories(res.categories || []);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error("Failed to load categories:", err);
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleCategorySearch = (catName: string) => {
    router.push(`/vouchers?category=${encodeURIComponent(catName)}`);
  };

  return (
    <section className="py-20 px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto">
      <div className="flex items-end justify-between mb-10">
        <div>
          <h2 className="font-headline-lg text-headline-lg font-bold text-on-background mb-2">
            Danh mục nổi bật
          </h2>
          <p className="font-body-md text-body-md text-on-surface-variant">
            Khám phá ưu đãi theo từng lĩnh vực bạn yêu thích
          </p>
        </div>
        <Link
          href="/vouchers"
          className="font-label-md text-label-md text-primary font-semibold hover:underline flex items-center gap-1 cursor-pointer"
        >
          Xem tất cả <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-gutter">
          {[1, 2, 3, 4].map((n) => (
            <div
              key={n}
              className="h-44 rounded-2xl bg-surface-container animate-pulse flex flex-col items-center justify-center p-6"
            />
          ))}
        </div>
      ) : categories.length === 0 ? (
        <div className="text-center py-12 bg-surface-container-low rounded-2xl">
          <p className="text-on-surface-variant">Chưa có danh mục nào sẵn sàng.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-gutter">
          {categories.map((cat, index) => {
            const meta = CATEGORY_META_MAP[cat.category_name] || DEFAULT_META;
            const Icon = meta.icon;
            const countText = cat.voucher_count
              ? `${cat.voucher_count} voucher đang mở bán`
              : "Nhiều ưu đãi hấp dẫn";

            return (
              <button
                key={cat.category_id || index}
                onClick={() => handleCategorySearch(cat.category_name)}
                className="group relative rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer text-left w-full h-56 flex flex-col justify-end p-6 border border-outline-variant/30 hover:-translate-y-1 bg-surface-container"
              >
                {/* Background image & gradient overlay */}
                {meta.image && (
                  <>
                    <div
                      className="absolute inset-0 bg-cover bg-center group-hover:scale-110 transition-transform duration-700"
                      style={{ backgroundImage: `url('${meta.image}')` }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                  </>
                )}

                {/* Content */}
                <div className="relative z-10">
                  <div
                    className={`${meta.bgClass} ${meta.iconClass} p-3 rounded-xl inline-flex mb-3 backdrop-blur-md shadow-sm group-hover:scale-110 transition-transform`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-title-md text-title-md text-white font-bold mb-1 line-clamp-1">
                    {cat.category_name}
                  </h3>
                  <p className="font-label-sm text-xs text-white/70 line-clamp-1">
                    {countText}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}
