"use client";

import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useState, useEffect, Suspense } from "react";
import { useApp } from "@/context/AppContext";
import VoucherCard from "@/components/customer/cards/VoucherCard";
import {
  ChevronRight,
  Search,
  Ticket,
  Monitor,
  Utensils,
  Plane,
  Sparkles,
  SearchX,
  Loader2
} from "lucide-react";

function VoucherCatalogContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { vouchers } = useApp();

  // Search parameters from URL
  const queryParam = searchParams.get("q") || "";
  const categoryParam = searchParams.get("category") || "";

  // Component local filter states
  const [searchInput, setSearchInput] = useState(queryParam);
  const [selectedCategory, setSelectedCategory] = useState(categoryParam || "Tất cả");
  const [sortBy, setSortBy] = useState("popular");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [filterFourStars, setFilterFourStars] = useState(false);
  const [filterFiveStars, setFilterFiveStars] = useState(false);

  // Apply filters on URL parameter changes
  useEffect(() => {
    setSearchInput(queryParam);
    setSelectedCategory(categoryParam || "Tất cả");
  }, [queryParam, categoryParam]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateUrlFilters(searchInput, selectedCategory);
  };

  const handleCategorySelect = (catName: string) => {
    setSelectedCategory(catName);
    updateUrlFilters(queryParam, catName);
  };

  const updateUrlFilters = (q: string, category: string) => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (category && category !== "Tất cả") params.set("category", category);
    router.push(`/vouchers?${params.toString()}`);
  };

  const clearAllFilters = () => {
    setSearchInput("");
    setSelectedCategory("Tất cả");
    setMinPrice("");
    setMaxPrice("");
    setFilterFourStars(false);
    setFilterFiveStars(false);
    setSortBy("popular");
    router.push("/vouchers");
  };

  // Filter logic on client-side mock data
  const filteredVouchers = vouchers.filter((v) => {
    // 1. Search Query Match (Title or Brand)
    if (queryParam) {
      const q = queryParam.toLowerCase();
      const matchTitle = v.title.toLowerCase().includes(q);
      const matchBrand = v.brand.toLowerCase().includes(q);
      const matchCat = v.category.toLowerCase().includes(q);
      if (!matchTitle && !matchBrand && !matchCat) return false;
    }

    // 2. Category Match
    if (selectedCategory && selectedCategory !== "Tất cả") {
      const sel = selectedCategory.toLowerCase().trim();
      const cat = (v.category || "").toLowerCase().trim();
      if (!cat.includes(sel) && !sel.includes(cat)) return false;
    }

    // 3. Price Filter Match
    if (minPrice) {
      const min = parseInt(minPrice);
      if (!isNaN(min) && v.price < min) return false;
    }
    if (maxPrice) {
      const max = parseInt(maxPrice);
      if (!isNaN(max) && v.price > max) return false;
    }

    // 4. Rating Filter Match
    if (filterFiveStars) {
      if (v.rating < 5.0) return false;
    } else if (filterFourStars) {
      if (v.rating < 4.0) return false;
    }

    return true;
  });

  // Sort logic on client-side mock data
  const sortedVouchers = [...filteredVouchers].sort((a, b) => {
    if (sortBy === "price-asc") {
      return a.price - b.price;
    }
    if (sortBy === "price-desc") {
      return b.price - a.price;
    }
    if (sortBy === "rating") {
      return b.rating - a.rating;
    }
    // Default or "popular": bestSeller first, then soldCount / rating
    if (sortBy === "popular") {
      const aVal = a.bestSeller ? 1 : 0;
      const bVal = b.bestSeller ? 1 : 0;
      if (aVal !== bVal) return bVal - aVal;

      const parseSold = (soldStr: string) => {
        if (soldStr.includes("k+")) return parseFloat(soldStr) * 1000;
        if (soldStr.includes("+")) return parseInt(soldStr);
        return parseInt(soldStr) || 0;
      };
      return parseSold(b.soldCount) - parseSold(a.soldCount);
    }
    return 0;
  });

  const sidebarCategories = [
    { name: "Tất cả", Icon: Ticket },
    { name: "Điện tử", Icon: Monitor },
    { name: "Ẩm thực", Icon: Utensils },
    { name: "Du lịch", Icon: Plane },
    { name: "Làm đẹp", Icon: Sparkles }
  ];

  return (
    <main className="flex-grow w-full max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-8">
      {/* Breadcrumbs */}
      <nav aria-label="Breadcrumb" className="flex items-center text-label-sm text-text-muted mb-6">
        <ol className="inline-flex items-center space-x-1 md:space-x-2">
          <li className="inline-flex items-center">
            <Link href="/" className="hover:text-primary transition-colors cursor-pointer">
              Trang chủ
            </Link>
          </li>
          <li>
            <div className="flex items-center">
              <ChevronRight className="w-4 h-4 mx-1" />
              <Link href="/vouchers" className="hover:text-primary transition-colors cursor-pointer">
                Voucher
              </Link>
            </div>
          </li>
          {selectedCategory !== "Tất cả" && (
            <li>
              <div className="flex items-center">
                <ChevronRight className="w-4 h-4 mx-1" />
                <span className="text-on-surface font-semibold">{selectedCategory}</span>
              </div>
            </li>
          )}
          {queryParam && (
            <li>
              <div className="flex items-center">
                <ChevronRight className="w-4 h-4 mx-1" />
                <span className="text-on-surface font-semibold font-mono">"{queryParam}"</span>
              </div>
            </li>
          )}
        </ol>
      </nav>

      {/* Search Input Box */}
      <section className="bg-surface-container-lowest p-6 rounded-xl shadow-sm border border-outline-variant mb-8 flex flex-col md:flex-row gap-4">
        <form onSubmit={handleSearchSubmit} className="relative flex-grow flex gap-4 w-full">
          <div className="relative flex-grow">
            <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-outline" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full bg-surface-bright border border-outline-variant rounded-lg py-3 pl-12 pr-4 text-body-md focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
              placeholder="Tìm theo tên voucher hoặc tên đối tác..."
            />
          </div>
          <button
            type="submit"
            className="bg-primary text-on-primary font-label-md text-label-md px-8 py-3 rounded-lg hover:shadow-md hover:opacity-90 transition-all whitespace-nowrap flex items-center justify-center gap-2 cursor-pointer"
          >
            Tìm kiếm
          </button>
        </form>
      </section>

      {/* Layout Grid */}
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar Filters */}
        <aside className="w-full lg:w-64 flex-shrink-0 bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant self-start lg:sticky lg:top-[112px] z-20 lg:max-h-[calc(100vh-136px)] lg:overflow-y-auto no-scrollbar">
          <div className="p-6 border-b border-outline-variant flex justify-between items-center">
            <div>
              <h2 className="font-title-md text-title-md font-bold text-on-surface">
                Bộ lọc tìm kiếm
              </h2>
              <p className="text-label-sm text-outline mt-1">Tối ưu lựa chọn của bạn</p>
            </div>
            {(minPrice || maxPrice || filterFourStars || filterFiveStars) && (
              <button
                onClick={clearAllFilters}
                className="text-error font-label-sm text-label-sm hover:underline cursor-pointer"
              >
                Xóa lọc
              </button>
            )}
          </div>
          <div className="p-6 flex flex-col gap-6">
            {/* Categories */}
            <div>
              <h3 className="font-label-md text-label-md font-bold text-on-surface mb-3">
                Danh mục
              </h3>
              <nav className="flex flex-col gap-2">
                {sidebarCategories.map((cat) => {
                  const isActive = selectedCategory === cat.name;
                  const Icon = cat.Icon;
                  return (
                    <button
                      key={cat.name}
                      onClick={() => handleCategorySelect(cat.name)}
                      className={`flex items-center gap-3 rounded-lg px-4 py-3 text-left w-full transition-all cursor-pointer ${
                        isActive
                          ? "bg-primary-container text-on-primary-container font-semibold"
                          : "text-on-surface-variant hover:bg-surface-container-high"
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-label-md text-label-md">
                        {cat.name === "Tất cả" ? "Tất cả Voucher" : cat.name}
                      </span>
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Price Filter */}
            <div className="flex flex-col gap-3 pt-4 border-t border-outline-variant">
              <h3 className="font-label-md text-label-md font-bold text-on-surface">Khoảng giá</h3>
              <div className="flex gap-2 items-center">
                <input
                  type="number"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  className="w-full px-3 py-2 bg-surface-bright border border-outline-variant rounded-md text-label-sm focus:border-primary outline-none"
                  placeholder="Từ (₫)"
                />
                <span className="text-on-surface-variant font-bold">-</span>
                <input
                  type="number"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  className="w-full px-3 py-2 bg-surface-bright border border-outline-variant rounded-md text-label-sm focus:border-primary outline-none"
                  placeholder="Đến (₫)"
                />
              </div>
            </div>

            {/* Rating Filter */}
            <div className="flex flex-col gap-3 pt-4 border-t border-outline-variant">
              <h3 className="font-label-md text-label-md font-bold text-on-surface">Đánh giá</h3>
              <div className="flex flex-col gap-2">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={filterFourStars}
                    onChange={(e) => {
                      setFilterFourStars(e.target.checked);
                      if (e.target.checked) setFilterFiveStars(false);
                    }}
                    className="form-checkbox text-primary rounded border-outline-variant focus:ring-primary h-4 w-4"
                  />
                  <span className="text-label-md text-on-surface-variant font-medium">
                    4 Sao trở lên
                  </span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={filterFiveStars}
                    onChange={(e) => {
                      setFilterFiveStars(e.target.checked);
                      if (e.target.checked) setFilterFourStars(false);
                    }}
                    className="form-checkbox text-primary rounded border-outline-variant focus:ring-primary h-4 w-4"
                  />
                  <span className="text-label-md text-on-surface-variant font-medium">5 Sao</span>
                </label>
              </div>
            </div>

            <div className="pt-4">
              <button
                onClick={clearAllFilters}
                className="w-full py-3 bg-surface-container-highest text-on-surface font-label-md text-label-md rounded-lg hover:bg-outline-variant transition-colors cursor-pointer font-bold"
              >
                Xóa tất cả bộ lọc
              </button>
            </div>
          </div>
        </aside>

        {/* Results Area */}
        <section className="flex-1 flex flex-col gap-6">
          {filteredVouchers.length > 0 && (
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-surface-container-low/40 p-4 rounded-xl border border-outline-variant/30 shadow-sm">
              <span className="font-label-md text-label-md text-on-surface-variant font-medium">
                Tìm thấy <strong className="text-primary">{filteredVouchers.length}</strong> voucher
              </span>
              <div className="flex items-center gap-2 w-full sm:w-auto self-end">
                <span className="font-label-md text-label-md text-on-surface-variant whitespace-nowrap font-bold">
                  Sắp xếp:
                </span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full sm:w-48 bg-surface-lowest border border-outline-variant rounded-md py-1.5 px-3 text-label-md text-on-surface focus:outline-none focus:border-primary shadow-sm cursor-pointer"
                >
                  <option value="popular">Bán chạy nhất</option>
                  <option value="price-asc">Giá: Thấp đến Cao</option>
                  <option value="price-desc">Giá: Cao đến Thấp</option>
                  <option value="rating">Đánh giá cao nhất</option>
                </select>
              </div>
            </div>
          )}

          {sortedVouchers.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {sortedVouchers.map((voucher) => (
                <VoucherCard key={voucher.id} voucher={voucher} variant="grid" />
              ))}
            </div>
          ) : (
            /* Empty State */
            <div className="flex-1 flex flex-col items-center justify-center bg-surface-container-low rounded-2xl border border-outline-variant p-8 md:p-16 min-h-[500px]">
              <div className="relative w-32 h-32 mb-8 flex items-center justify-center rounded-full bg-surface-container-high">
                <SearchX className="w-16 h-16 text-outline opacity-50" />
                <div className="absolute inset-0 rounded-full bg-primary/5 blur-xl" />
              </div>
              <h2 className="font-title-md text-title-md font-bold text-on-surface mb-2 text-center">
                Không tìm thấy voucher phù hợp
              </h2>
              <p className="font-body-md text-body-md text-on-surface-variant text-center max-w-md mb-8">
                Vui lòng thử từ khóa khác hoặc điều chỉnh bộ lọc tìm kiếm để xem thêm các ưu đãi.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={clearAllFilters}
                  className="px-6 py-3 border border-outline-variant text-on-surface font-label-md text-label-md rounded-lg hover:bg-surface-container-highest transition-colors cursor-pointer font-semibold"
                >
                  Xóa bộ lọc
                </button>
                <button
                  onClick={() => setSelectedCategory("Tất cả")}
                  className="px-6 py-3 bg-primary text-on-primary font-label-md text-label-md rounded-lg hover:opacity-90 transition-colors shadow-sm cursor-pointer font-semibold"
                >
                  Khám phá danh mục
                </button>
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

export default function VoucherCatalog() {
  return (
    <Suspense fallback={
      <main className="flex-grow w-full max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-8 text-center text-on-surface-variant font-body-md">
        <div className="py-20 flex flex-col items-center justify-center">
          <Loader2 className="w-10 h-10 animate-spin mb-4 text-primary" />
          <p>Đang tải danh mục voucher...</p>
        </div>
      </main>
    }>
      <VoucherCatalogContent />
    </Suspense>
  );
}
