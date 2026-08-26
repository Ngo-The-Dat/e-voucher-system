"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { customerCatalogApi, CustomerCategory } from "@/lib/customer-api";

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
          // Lấy top 8 danh mục bán chạy nhất
          const rawCategories = res.categories || [];
          setCategories(rawCategories.slice(0, 8));
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
            Khám phá ưu đãi theo từng lĩnh vực bán chạy nhất được yêu thích
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
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
            <div
              key={n}
              className="h-24 rounded-2xl bg-surface-container animate-pulse p-5"
            />
          ))}
        </div>
      ) : categories.length === 0 ? (
        <div className="text-center py-12 bg-surface-container-low rounded-2xl">
          <p className="text-on-surface-variant">Chưa có danh mục nào sẵn sàng.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {categories.map((cat, index) => {
            const countText =
              cat.total_sold && cat.total_sold > 0
                ? `Đã bán ${cat.total_sold} voucher`
                : cat.voucher_count && cat.voucher_count > 0
                ? `${cat.voucher_count} voucher mở bán`
                : "Nhiều ưu đãi hấp dẫn";

            return (
              <button
                key={cat.category_id || index}
                onClick={() => handleCategorySearch(cat.category_name)}
                className="group relative rounded-2xl overflow-hidden shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 cursor-pointer text-left w-full h-auto p-4 sm:p-5 border border-outline-variant hover:border-primary bg-surface flex flex-col justify-center"
              >
                <div className="relative z-10 flex flex-col justify-center min-w-0">
                  <h3 className="font-title-sm sm:font-title-md text-sm sm:text-base text-on-surface font-bold mb-1 group-hover:text-primary transition-colors line-clamp-1">
                    {cat.category_name}
                  </h3>
                  <p className="text-xs text-on-surface-variant line-clamp-1">
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
