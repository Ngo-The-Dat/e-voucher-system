"use client";

import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useState, useEffect, Suspense } from "react";
import { useApp } from "@/context/AppContext";
import VoucherCard from "@/components/customer/cards/VoucherCard";
import Pagination from "@/components/shared/ui/Pagination";
import {
  ChevronRight,
  Search,
  Ticket,
  Monitor,
  SearchX,
  Loader2,
  Utensils,
  Plane,
  Sparkles,
  Dumbbell,
  GraduationCap
} from "lucide-react";
import { customerCatalogApi, CustomerCategory } from "@/lib/customer-api";

const ITEMS_PER_PAGE = 9;

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
  
  const [region, setRegion] = useState("");
  const [minDiscount, setMinDiscount] = useState("");
  const [partner, setPartner] = useState("");
  const [isValidOnly, setIsValidOnly] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);

  // Apply filters on URL parameter changes & reset page
  useEffect(() => {
    setSearchInput(queryParam);
    setSelectedCategory(categoryParam || "Tất cả");
    setCurrentPage(1);
  }, [queryParam, categoryParam]);

  // Reset page when local filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [minPrice, maxPrice, filterFourStars, filterFiveStars, region, minDiscount, partner, isValidOnly, sortBy]);

  const [dbCategories, setDbCategories] = useState<CustomerCategory[]>([]);
  useEffect(() => {
    let isMounted = true;
    customerCatalogApi.getCategories().then((res) => {
      if (isMounted) {
        setDbCategories(res.categories || []);
      }
    }).catch(console.error);
    return () => { isMounted = false; };
  }, []);

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
    setRegion("");
    setMinDiscount("");
    setPartner("");
    setIsValidOnly(false);
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

    // 5. Region Match
    if (region) {
      const voucherLocs = [v.location, ...(v.locations || [])].filter(Boolean).map(l => l?.toLowerCase() || "");
      if (voucherLocs.length > 0 && !voucherLocs.some(l => l.includes(region.toLowerCase()))) {
        return false;
      }
    }

    // 6. Discount Match
    if (minDiscount) {
      let pct = 0;
      if (v.originalPrice && v.originalPrice > v.price) {
        pct = ((v.originalPrice - v.price) / v.originalPrice) * 100;
      } else if (v.discount && v.discount.includes("%")) {
        pct = parseInt(v.discount);
      }
      if (pct < parseInt(minDiscount)) return false;
    }

    // 7. Partner Match
    if (partner) {
      const p = partner.toLowerCase().trim();
      const vBrand = v.brand.toLowerCase();
      const vMerchant = (v.merchant || "").toLowerCase();
      if (!vBrand.includes(p) && !vMerchant.includes(p)) return false;
    }

    // 8. Validity Match
    if (isValidOnly) {
      if (v.expiryDate) {
        const parts = v.expiryDate.split('/');
        if (parts.length === 3) {
          const expDate = new Date(`${parts[2]}-${parts[1]}-${parts[0]}T23:59:59`);
          if (expDate < new Date()) return false;
        }
      }
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

      const parseSold = (soldStr?: string) => {
        if (!soldStr) return 0;
        if (soldStr.includes("k+")) return parseFloat(soldStr) * 1000;
        if (soldStr.includes("+")) return parseInt(soldStr);
        return parseInt(soldStr) || 0;
      };
      return parseSold(b.soldCount) - parseSold(a.soldCount);
    }
    return 0;
  });

  const totalPages = Math.max(1, Math.ceil(sortedVouchers.length / ITEMS_PER_PAGE));
  const paginatedVouchers = sortedVouchers.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const getCategoryIcon = (name: string) => {
    if (name.includes("Ẩm thực") || name.includes("Buffet")) return Utensils;
    if (name.includes("Spa") || name.includes("Làm đẹp") || name.includes("Massage") || name.includes("Nail") || name.includes("Nha khoa")) return Sparkles;
    if (name.includes("Khách sạn") || name.includes("Tour")) return Plane;
    if (name.includes("Thể thao") || name.includes("Gym")) return Dumbbell;
    if (name.includes("Khóa học")) return GraduationCap;
    return Ticket;
  };

  const sidebarCategories = [
    { name: "Tất cả", Icon: Ticket },
    ...dbCategories.map(c => ({
      name: c.category_name,
      Icon: getCategoryIcon(c.category_name)
    }))
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
              placeholder="Tìm kiếm theo tên voucher, món ăn, dịch vụ hoặc thương hiệu..."
              className="w-full pl-12 pr-4 py-3 bg-surface-bright border border-outline-variant rounded-lg font-body-md text-body-md text-on-surface focus:border-primary outline-none"
            />
          </div>
          <button
            type="submit"
            className="px-6 py-3 bg-primary text-on-primary font-label-md text-label-md font-bold rounded-lg hover:opacity-90 transition-opacity whitespace-nowrap cursor-pointer shadow-sm"
          >
            Tìm kiếm
          </button>
        </form>
      </section>

      {/* Main Two-Column Layout */}
      <div className="flex flex-col md:flex-row gap-8 items-start">
        {/* Sidebar Filters */}
        <aside className="w-full md:w-64 flex-shrink-0 bg-surface-container-lowest p-6 rounded-xl border border-outline-variant shadow-sm flex flex-col gap-6">
          <div className="flex items-center justify-between pb-4 border-b border-outline-variant">
            <h2 className="font-title-md text-title-md font-bold text-on-surface">Bộ lọc tìm kiếm</h2>
          </div>

          {/* Categories Filter */}
          <div className="flex flex-col gap-3">
            <h3 className="font-label-md text-label-md font-bold text-on-surface">Danh mục</h3>
            <div className="flex flex-col gap-1">
              {sidebarCategories.map((cat) => {
                const isSelected = selectedCategory === cat.name;
                const IconComponent = cat.Icon;
                return (
                  <button
                    key={cat.name}
                    onClick={() => handleCategorySelect(cat.name)}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg font-label-md text-label-md transition-colors text-left cursor-pointer ${
                      isSelected
                        ? "bg-[#0f2c59]/10 text-[#0f2c59] font-bold"
                        : "text-on-surface-variant hover:bg-surface-container-high"
                    }`}
                  >
                    <IconComponent className="w-4 h-4" />
                    <span>{cat.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col gap-4">
            {/* Price Range Filter */}
            <div className="flex flex-col gap-3 pt-4 border-t border-outline-variant">
              <h3 className="font-label-md text-label-md font-bold text-on-surface">Khoảng giá</h3>
              <div className="flex items-center gap-2">
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

            {/* Region Filter */}
            <div className="flex flex-col gap-3 pt-4 border-t border-outline-variant">
              <h3 className="font-label-md text-label-md font-bold text-on-surface">Khu vực</h3>
              <select
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className="w-full px-3 py-2 bg-surface-bright border border-outline-variant rounded-md text-label-sm focus:border-primary outline-none"
              >
                <option value="">Toàn quốc</option>
                <option value="Hồ Chí Minh">TP. Hồ Chí Minh</option>
                <option value="Hà Nội">Hà Nội</option>
                <option value="Đà Nẵng">Đà Nẵng</option>
              </select>
            </div>

            {/* Discount Filter */}
            <div className="flex flex-col gap-3 pt-4 border-t border-outline-variant">
              <h3 className="font-label-md text-label-md font-bold text-on-surface">Mức giảm</h3>
              <select
                value={minDiscount}
                onChange={(e) => setMinDiscount(e.target.value)}
                className="w-full px-3 py-2 bg-surface-bright border border-outline-variant rounded-md text-label-sm focus:border-primary outline-none"
              >
                <option value="">Tất cả mức giảm</option>
                <option value="10">Giảm từ 10%</option>
                <option value="30">Giảm từ 30%</option>
                <option value="50">Giảm từ 50%</option>
              </select>
            </div>

            {/* Partner Filter */}
            <div className="flex flex-col gap-3 pt-4 border-t border-outline-variant">
              <h3 className="font-label-md text-label-md font-bold text-on-surface">Đối tác</h3>
              <input
                type="text"
                value={partner}
                onChange={(e) => setPartner(e.target.value)}
                className="w-full px-3 py-2 bg-surface-bright border border-outline-variant rounded-md text-label-sm focus:border-primary outline-none"
                placeholder="Nhập tên đối tác..."
              />
            </div>

            {/* Validity Filter */}
            <div className="flex flex-col gap-3 pt-4 border-t border-outline-variant">
              <h3 className="font-label-md text-label-md font-bold text-on-surface">Trạng thái</h3>
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isValidOnly}
                  onChange={(e) => setIsValidOnly(e.target.checked)}
                  className="form-checkbox text-primary rounded border-outline-variant focus:ring-primary h-4 w-4"
                />
                <span className="text-label-md text-on-surface-variant font-medium">Còn hiệu lực</span>
              </label>
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
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {paginatedVouchers.map((voucher) => (
                  <VoucherCard key={voucher.id} voucher={voucher} variant="grid" />
                ))}
              </div>

              {/* Pagination */}
              <div className="rounded-xl overflow-hidden shadow-sm border border-outline-variant/30">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalItems={sortedVouchers.length}
                  itemsPerPage={ITEMS_PER_PAGE}
                  onPageChange={(page) => {
                    setCurrentPage(page);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  itemName="voucher"
                />
              </div>
            </>
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
