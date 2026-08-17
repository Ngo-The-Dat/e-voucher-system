"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BookOpen, Calendar, ArrowRight, X, Sparkles, Building2 } from "lucide-react";
import { customerContentApi, CustomerContent } from "@/lib/customer-api";

export default function FeaturedArticles() {
  const [contents, setContents] = useState<CustomerContent[]>([]);
  const [selectedArticle, setSelectedArticle] = useState<CustomerContent | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    customerContentApi
      .getContents()
      .then((res) => {
        if (isMounted) {
          // Lấy các bài viết dạng ARTICLE, GUIDE, PROMOTION
          const articles = (res.contents || []).filter(
            (c) => c.content_type !== "POLICY"
          );
          setContents(articles);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error("Failed to load contents:", err);
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  if (!loading && contents.length === 0) return null;

  const typeLabelMap: Record<string, { label: string; bg: string }> = {
    ARTICLE: { label: "Bài viết trải nghiệm", bg: "bg-primary/10 text-primary" },
    GUIDE: { label: "Hướng dẫn sử dụng", bg: "bg-secondary-container text-on-secondary-container" },
    PROMOTION: { label: "Thông tin khuyến mãi", bg: "bg-tertiary-container text-on-tertiary-container" },
    POLICY: { label: "Chính sách", bg: "bg-surface-container-high text-on-surface" }
  };

  return (
    <section className="py-20 bg-surface-container-lowest px-margin-mobile md:px-margin-desktop relative">
      <div className="max-w-container-max mx-auto">
        <div className="flex items-end justify-between mb-10">
          <div>
            <h2 className="font-headline-lg text-headline-lg font-bold text-on-background mb-2 flex items-center gap-2">
              Cẩm nang & Kinh nghiệm săn deal <BookOpen className="w-6 h-6 text-primary" />
            </h2>
            <p className="font-body-md text-body-md text-on-surface-variant">
              Khám phá bí quyết tận hưởng dịch vụ và ưu đãi độc quyền
            </p>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="h-64 rounded-2xl bg-surface-container animate-pulse"
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-gutter">
            {contents.map((article) => {
              const typeMeta = typeLabelMap[article.content_type] || typeLabelMap.ARTICLE;
              const formattedDate = new Date(article.created_at).toLocaleDateString("vi-VN");

              return (
                <div
                  key={article.content_id}
                  className="bg-surface rounded-2xl border border-outline-variant/30 p-6 flex flex-col justify-between hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group cursor-pointer"
                  onClick={() => setSelectedArticle(article)}
                >
                  <div>
                    {/* Badge & Date */}
                    <div className="flex items-center justify-between gap-2 mb-4">
                      <span className={`text-xs font-semibold px-3 py-1 rounded-full ${typeMeta.bg}`}>
                        {typeMeta.label}
                      </span>
                      <span className="text-xs text-on-surface-variant flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" /> {formattedDate}
                      </span>
                    </div>

                    {/* Brand name */}
                    {article.brand_name && (
                      <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-1.5 flex items-center gap-1">
                        <Building2 className="w-3.5 h-3.5" /> {article.brand_name}
                      </p>
                    )}

                    {/* Title */}
                    <h3 className="text-lg font-bold text-on-surface group-hover:text-primary transition-colors mb-3 line-clamp-2 leading-snug">
                      {article.title}
                    </h3>

                    {/* Excerpt */}
                    <p className="text-sm text-on-surface-variant line-clamp-3 mb-6 leading-relaxed">
                      {article.body}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-outline-variant/20 flex items-center justify-between text-primary font-semibold text-sm">
                    <span>Đọc chi tiết</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal xem chi tiết bài viết */}
      {selectedArticle && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
          onClick={() => setSelectedArticle(null)}
        >
          <div
            className="relative w-full max-w-2xl bg-surface rounded-3xl shadow-2xl border border-outline-variant/30 p-6 sm:p-8 max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedArticle(null)}
              className="absolute top-5 right-5 p-2 rounded-full bg-surface-container hover:bg-surface-container-high text-on-surface transition-colors cursor-pointer"
              aria-label="Đóng"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-4">
              <span className="inline-block text-xs font-semibold px-3 py-1 rounded-full bg-primary/10 text-primary mb-2">
                {typeLabelMap[selectedArticle.content_type]?.label || "Cẩm nang"}
              </span>
              {selectedArticle.brand_name && (
                <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                  {selectedArticle.brand_name}
                </p>
              )}
            </div>

            <h2 className="text-2xl font-bold text-on-surface mb-4 leading-snug">
              {selectedArticle.title}
            </h2>

            <div className="text-xs text-on-surface-variant mb-6 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>Đăng ngày: {new Date(selectedArticle.created_at).toLocaleDateString("vi-VN")}</span>
            </div>

            <div className="prose prose-neutral max-w-none text-on-surface-variant text-sm sm:text-base leading-relaxed whitespace-pre-line mb-8">
              {selectedArticle.body}
            </div>

            {/* Voucher liên kết nếu có */}
            {selectedArticle.program_id && (
              <div className="p-4 rounded-2xl bg-surface-container flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <p className="text-xs text-on-surface-variant font-medium">Voucher liên kết:</p>
                  <p className="text-sm font-bold text-on-surface">
                    {selectedArticle.program_name || "Xem ưu đãi cho bài viết này"}
                  </p>
                </div>
                <Link
                  href={`/vouchers/${selectedArticle.program_id}`}
                  onClick={() => setSelectedArticle(null)}
                  className="px-5 py-2.5 bg-primary text-on-primary rounded-xl font-semibold text-sm hover:shadow-md transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                >
                  <Sparkles className="w-4 h-4" /> Xem voucher ngay
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
