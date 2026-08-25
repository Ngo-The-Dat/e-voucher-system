"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import Pagination from "@/components/shared/ui/Pagination";
import {
  BookOpen,
  Calendar,
  ArrowRight,
  Search,
  X,
  Building2,
  ExternalLink,
  ChevronRight
} from "lucide-react";
import { customerContentApi, CustomerContent } from "@/lib/customer-api";

const ITEMS_PER_PAGE = 6;

const TYPE_CONFIG: Record<
  string,
  { label: string; bg: string; border: string; text: string }
> = {
  ALL: {
    label: "Tất cả bài viết",
    bg: "bg-surface-container-high",
    border: "border-outline-variant",
    text: "text-on-surface"
  },
  ARTICLE: {
    label: "Bài viết trải nghiệm",
    bg: "bg-primary/10",
    border: "border-primary/20",
    text: "text-primary"
  },
  GUIDE: {
    label: "Hướng dẫn sử dụng",
    bg: "bg-secondary-container",
    border: "border-secondary-container",
    text: "text-on-secondary-container"
  },
  PROMOTION: {
    label: "Thông tin khuyến mãi",
    bg: "bg-tertiary-container",
    border: "border-tertiary-container",
    text: "text-on-tertiary-container"
  }
};

export default function CustomerArticlesPage() {
  const [contents, setContents] = useState<CustomerContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedArticle, setSelectedArticle] = useState<CustomerContent | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedType, searchQuery]);

  useEffect(() => {
    let isMounted = true;
    customerContentApi
      .getContents()
      .then((res) => {
        if (isMounted) {
          // Lọc bỏ loại POLICY khỏi danh sách bài viết
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

  const filteredContents = useMemo(() => {
    return contents.filter((item) => {
      const matchType =
        selectedType === "ALL" ? true : item.content_type === selectedType;
      const query = searchQuery.trim().toLowerCase();
      const matchSearch =
        !query ||
        item.title.toLowerCase().includes(query) ||
        item.body.toLowerCase().includes(query) ||
        (item.brand_name && item.brand_name.toLowerCase().includes(query));
      return matchType && matchSearch;
    });
  }, [contents, selectedType, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredContents.length / ITEMS_PER_PAGE));
  const paginatedContents = filteredContents.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Breadcrumb & Header Hero */}
      <div className="bg-gradient-to-b from-[#0f2c59]/10 via-[#0f2c59]/5 to-transparent pt-8 pb-12 px-margin-mobile md:px-margin-desktop">
        <div className="max-w-container-max mx-auto">
          <nav className="flex items-center gap-2 text-xs text-on-surface-variant mb-6">
            <Link href="/" className="hover:text-primary transition-colors">
              Trang chủ
            </Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-on-surface font-medium">Cẩm nang & Bài viết</span>
          </nav>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary mb-3">
                <BookOpen className="w-3.5 h-3.5" /> Tin tức & Kinh nghiệm săn deal
              </span>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-on-background tracking-tight">
                Cẩm nang & Bài viết ưu đãi
              </h1>
              <p className="mt-2 text-on-surface-variant text-base max-w-2xl">
                Khám phá những bí quyết săn deal, mẹo sử dụng voucher thông minh và các bài viết trải nghiệm dịch vụ độc quyền từ đối tác.
              </p>
            </div>

            {/* Search Bar */}
            <div className="relative w-full md:w-80 shrink-0">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm bài viết, đối tác..."
                className="w-full h-11 pl-10 pr-4 rounded-xl border border-outline-variant bg-surface text-on-surface text-sm focus:outline-none focus:border-primary shadow-sm"
              />
              <Search className="w-4 h-4 text-on-surface-variant absolute left-3.5 top-1/2 -translate-y-1/2" />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface p-1 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-2 mt-8 overflow-x-auto pb-2 scrollbar-none">
            {Object.keys(TYPE_CONFIG).map((typeKey) => {
              const cfg = TYPE_CONFIG[typeKey];
              const isSelected = selectedType === typeKey;
              const count =
                typeKey === "ALL"
                  ? contents.length
                  : contents.filter((c) => c.content_type === typeKey).length;

              return (
                <button
                  key={typeKey}
                  onClick={() => setSelectedType(typeKey)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                    isSelected
                      ? "bg-[#0f2c59] text-white shadow-sm font-semibold"
                      : "bg-surface text-on-surface-variant border border-outline-variant/60 hover:border-primary/50 hover:text-primary"
                  }`}
                >
                  <span>{cfg.label}</span>
                  <span
                    className={`text-xs px-1.5 py-0.5 rounded-full ${
                      isSelected
                        ? "bg-white/20 text-white"
                        : "bg-surface-container text-on-surface-variant"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop mt-8">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div
                key={n}
                className="h-72 rounded-2xl bg-surface-container animate-pulse p-6"
              />
            ))}
          </div>
        ) : filteredContents.length === 0 ? (
          <div className="text-center py-20 bg-surface-container-low rounded-3xl border border-outline-variant/30 max-w-lg mx-auto p-8">
            <BookOpen className="w-12 h-12 text-on-surface-variant/40 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-on-surface mb-1">
              Không tìm thấy bài viết nào
            </h3>
            <p className="text-sm text-on-surface-variant mb-6">
              Không có bài viết phù hợp với tiêu chí tìm kiếm hoặc bộ lọc hiện tại.
            </p>
            {(selectedType !== "ALL" || searchQuery) && (
              <button
                onClick={() => {
                  setSelectedType("ALL");
                  setSearchQuery("");
                }}
                className="px-4 py-2 bg-primary text-on-primary rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors cursor-pointer"
              >
                Đặt lại bộ lọc
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {paginatedContents.map((article) => {
                const typeCfg =
                  TYPE_CONFIG[article.content_type] || TYPE_CONFIG.ARTICLE;
                const formattedDate = new Date(
                  article.created_at
                ).toLocaleDateString("vi-VN");

                return (
                  <div
                    key={article.content_id}
                    className="bg-surface rounded-2xl border border-outline-variant/40 p-6 flex flex-col justify-between hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group cursor-pointer"
                    onClick={() => setSelectedArticle(article)}
                  >
                    <div>
                      {/* Badge & Date */}
                      <div className="flex items-center justify-between gap-2 mb-4">
                        <span
                          className={`text-xs font-semibold px-3 py-1 rounded-full ${typeCfg.bg} ${typeCfg.text}`}
                        >
                          {typeCfg.label}
                        </span>
                        <span className="text-xs text-on-surface-variant flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" /> {formattedDate}
                        </span>
                      </div>

                      {/* Brand Name */}
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

            {/* Pagination */}
            <div className="mt-8 rounded-2xl overflow-hidden shadow-sm border border-outline-variant/30">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={filteredContents.length}
                itemsPerPage={ITEMS_PER_PAGE}
                onPageChange={(page) => {
                  setCurrentPage(page);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                itemName="bài viết"
              />
            </div>
          </>
        )}
      </div>

      {/* Modal chi tiết bài viết */}
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
                {TYPE_CONFIG[selectedArticle.content_type]?.label || "Cẩm nang"}
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
              <span>
                Đăng ngày:{" "}
                {new Date(selectedArticle.created_at).toLocaleDateString("vi-VN")}
              </span>
            </div>

            <div className="prose prose-neutral max-w-none text-on-surface-variant text-sm sm:text-base leading-relaxed whitespace-pre-line mb-8">
              {selectedArticle.body}
            </div>

            {selectedArticle.program_id && (
              <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/40 flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-medium text-on-surface-variant">
                    Chương trình voucher liên kết
                  </p>
                  <p className="text-sm font-bold text-on-surface line-clamp-1">
                    {selectedArticle.program_name || "Xem ưu đãi của thương hiệu này"}
                  </p>
                </div>
                <Link
                  href={`/vouchers/${selectedArticle.program_id}`}
                  className="px-4 py-2 rounded-xl bg-primary text-on-primary text-xs font-semibold hover:bg-primary/90 transition-colors shrink-0 flex items-center gap-1.5"
                >
                  <span>Xem voucher</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
