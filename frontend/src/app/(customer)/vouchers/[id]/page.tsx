"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useApp } from "@/context/AppContext";
import VoucherCard from "@/components/customer/cards/VoucherCard";
import {
  AlertTriangle,
  ChevronRight,
  Flame,
  Store,
  Star,
  Calendar,
  Minus,
  Plus,
  ShoppingBag,
  ShoppingCart,
  ShieldCheck,
  Zap,
  FileText,
  CheckSquare,
  CheckCircle2,
  Clock,
  Info,
  MapPin
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export default function VoucherDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const router = useRouter();
  const { vouchers, addToCart, addReview } = useApp();

  // Find the current voucher
  const voucher = vouchers.find((v) => v.id === id);

  // States
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [reviewName, setReviewName] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewContent, setReviewContent] = useState("");

  if (!voucher) {
    return (
      <main className="max-w-container-max mx-auto px-margin-mobile py-20 flex flex-col items-center justify-center text-center">
        <AlertTriangle className="w-16 h-16 text-outline mb-4" />
        <h1 className="font-headline-lg text-headline-lg font-bold text-on-surface mb-2">
          Không tìm thấy voucher
        </h1>
        <p className="font-body-md text-body-md text-on-surface-variant mb-8">
          Voucher này không tồn tại hoặc đã bị gỡ bỏ khỏi hệ thống.
        </p>
        <Link
          href="/vouchers"
          className="px-6 py-3 bg-primary text-on-primary rounded-lg font-semibold"
        >
          Quay lại danh mục
        </Link>
      </main>
    );
  }

  // Get similar vouchers in the same category (excluding current)
  const similarVouchers = vouchers
    .filter((v) => v.category === voucher.category && v.id !== voucher.id)
    .slice(0, 4);

  const formattedPrice = formatCurrency(voucher.price);

  const formattedOriginalPrice = voucher.originalPrice
    ? formatCurrency(voucher.originalPrice)
    : null;

  const savings = voucher.originalPrice ? voucher.originalPrice - voucher.price : 0;
  const formattedSavings = savings
    ? formatCurrency(savings)
    : null;

  const handleAddToCart = () => {
    addToCart(voucher, quantity);
  };

  const handleBuyNow = () => {
    addToCart(voucher, quantity);
    router.push("/cart");
  };

  const handleAddReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewName.trim() || !reviewContent.trim()) return;
    addReview(voucher.id, reviewName.trim(), reviewRating, reviewContent.trim());
    setReviewName("");
    setReviewContent("");
    setReviewRating(5);
  };

  return (
    <main className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-8 flex flex-col gap-12">
      {/* Breadcrumbs */}
      <nav aria-label="Breadcrumb" className="flex text-on-surface-variant font-label-sm text-label-sm">
        <ol className="inline-flex items-center space-x-1 md:space-x-2">
          <li className="inline-flex items-center">
            <Link href="/" className="hover:text-primary transition-colors">Trang chủ</Link>
          </li>
          <li>
            <div className="flex items-center">
              <ChevronRight className="w-4 h-4 mx-1" />
              <Link href="/vouchers" className="hover:text-primary transition-colors">Voucher</Link>
            </div>
          </li>
          <li>
            <div className="flex items-center">
              <ChevronRight className="w-4 h-4 mx-1" />
              <button
                onClick={() => router.push(`/vouchers?category=${encodeURIComponent(voucher.category)}`)}
                className="hover:text-primary transition-colors cursor-pointer"
              >
                {voucher.category}
              </button>
            </div>
          </li>
          <li>
            <div className="flex items-center">
              <ChevronRight className="w-4 h-4 mx-1" />
              <span className="text-on-surface font-semibold line-clamp-1">{voucher.title}</span>
            </div>
          </li>
        </ol>
      </nav>

      {/* Hero Product Info Section */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-gutter">
        {/* Gallery Column */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden bg-surface-container-low border border-outline-variant">
            <img
              src={voucher.images?.[selectedImageIndex] || voucher.thumbnail}
              alt={voucher.title}
              className="w-full h-full object-cover transition-all duration-300"
            />
            {voucher.bestSeller && (
              <div className="absolute top-4 left-4 bg-error text-on-error px-3 py-1 rounded-full font-label-sm text-label-sm flex items-center gap-1 shadow-sm">
                <Flame className="w-4 h-4" />
                Bán chạy
              </div>
            )}
          </div>
          {/* Thumbnails strip */}
          <div className="flex gap-4 overflow-x-auto pb-2 snap-x no-scrollbar">
            {voucher.images?.map((img, index) => (
              <button
                key={index}
                onClick={() => setSelectedImageIndex(index)}
                className={`w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden border-2 snap-start relative cursor-pointer ${
                  selectedImageIndex === index ? "border-primary" : "border-outline-variant opacity-70 hover:opacity-100"
                }`}
              >
                <img src={img} alt={`${voucher.title} ${index + 1}`} className="w-full h-full object-cover" />
                {selectedImageIndex === index && <div className="absolute inset-0 bg-primary/10" />}
              </button>
            ))}
          </div>
        </div>

        {/* Info Column */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <div className="flex flex-col gap-2 border-b border-outline-variant pb-6">
            <div className="flex items-center gap-2 text-on-surface-variant font-label-md text-label-md">
              <Store className="w-4 h-4" />
              Thương hiệu:{" "}
              <Link href="/vouchers" className="text-primary hover:underline font-semibold">
                {voucher.brand}
              </Link>
            </div>
            <h1 className="font-headline-lg text-headline-lg text-on-surface leading-tight font-semibold">
              {voucher.title}
            </h1>
            <div className="flex items-center gap-4 mt-2">
              <div className="flex items-center gap-1 text-tertiary">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 ${
                      i < Math.floor(voucher.rating)
                        ? "text-amber-400 fill-amber-400"
                        : "text-gray-300"
                    }`}
                  />
                ))}
                <span className="text-on-surface-variant font-label-md text-label-md ml-1 text-on-surface">
                  {voucher.rating} ({voucher.reviewsCount} đánh giá)
                </span>
              </div>
              <div className="w-1 h-1 bg-outline-variant rounded-full" />
              <span className="text-on-surface-variant font-label-md text-label-md">
                Đã bán {voucher.soldCount}
              </span>
            </div>
          </div>

          {/* Pricing */}
          <div className="bg-surface-container p-6 rounded-xl flex flex-col gap-3">
            <div className="flex items-end gap-3">
              <span className="font-headline-xl text-headline-xl font-bold text-primary">
                {formattedPrice}
              </span>
              {formattedOriginalPrice && (
                <span className="font-title-md text-title-md text-on-surface-variant line-through mb-1">
                  {formattedOriginalPrice}
                </span>
              )}
            </div>
            {formattedSavings && (
              <div className="flex items-center gap-2">
                <span className="bg-error-container text-on-error-container px-2 py-1 rounded font-label-sm text-label-sm font-bold">
                  {voucher.discountBadge || "Tiết kiệm"}
                </span>
                <span className="text-on-surface-variant font-label-md text-label-md">
                  Bạn tiết kiệm được {formattedSavings}
                </span>
              </div>
            )}
          </div>

          {/* Expiry / Validity Section */}
          <div className="flex flex-col gap-2">
            <span className="font-label-md text-label-md text-on-surface font-semibold flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              Hạn sử dụng
            </span>
            <div className="font-body-md text-body-md text-on-surface-variant bg-surface-container-low p-4 rounded-lg border border-outline-variant/50">
              {voucher.expiryDate ? `Đến hết ngày ${voucher.expiryDate}` : (voucher.conditions?.find(c => c.toLowerCase().includes("hạn sử dụng")) || "Đến hết ngày 31/12/2026")}
            </div>
          </div>

          {/* Quantity Selector */}
          <div className="flex items-center justify-between border-t border-b border-outline-variant py-6 mt-2">
            <label className="font-title-md text-title-md font-semibold text-on-surface">
              Số lượng
            </label>
            <div className="flex items-center border border-outline-variant rounded-lg overflow-hidden bg-surface-bright">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                aria-label="Decrease quantity"
                className="w-10 h-10 flex items-center justify-center text-on-surface-variant hover:bg-surface-container transition-colors cursor-pointer"
              >
                <Minus className="w-4 h-4" />
              </button>
              <input
                aria-label="Quantity"
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-12 h-10 text-center border-none focus:ring-0 font-label-md text-label-md text-on-surface bg-transparent"
              />
              <button
                onClick={() => setQuantity(quantity + 1)}
                aria-label="Increase quantity"
                className="w-10 h-10 flex items-center justify-center text-on-surface-variant hover:bg-surface-container transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Checkout/Cart Action Buttons */}
          <div className="flex flex-col gap-3 mt-2">
            <button
              onClick={handleBuyNow}
              className="w-full bg-primary hover:opacity-95 text-on-primary font-title-md text-title-md py-4 rounded-xl shadow-sm transition-all hover:shadow-md hover:-translate-y-[1px] flex justify-center items-center gap-2 cursor-pointer font-bold"
            >
              <ShoppingBag className="w-5 h-5" />
              Mua ngay
            </button>
            <button
              onClick={handleAddToCart}
              className="w-full border-2 border-primary text-primary hover:bg-primary-fixed font-title-md text-title-md py-4 rounded-xl transition-all flex justify-center items-center gap-2 cursor-pointer font-bold"
            >
              <ShoppingCart className="w-5 h-5" />
              Thêm vào giỏ hàng
            </button>
          </div>

          {/* Trust Badges */}
          <div className="grid grid-cols-2 gap-4 mt-4 p-4 bg-surface-container-low rounded-lg border border-outline-variant/50">
            <div className="flex items-start gap-2">
              <ShieldCheck className="w-5 h-5 text-secondary shrink-0" />
              <span className="font-label-sm text-label-sm text-on-surface-variant">
                Hoàn tiền 100% nếu không thể sử dụng
              </span>
            </div>
            <div className="flex items-start gap-2">
              <Zap className="w-5 h-5 text-secondary shrink-0" />
              <span className="font-label-sm text-label-sm text-on-surface-variant">
                Xác nhận tức thì qua Email/SMS
              </span>
            </div>
          </div>
        </div>
      </section>

      <hr className="border-outline-variant my-4" />

      {/* Bento Grid Details Section */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Content (Wider) */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Description */}
          {voucher.description && (
            <div className="bg-surface-container-lowest border border-outline-variant p-6 md:p-8 rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.02)]">
              <h2 className="font-title-md text-title-md text-on-surface mb-4 flex items-center gap-2 font-bold border-b border-outline-variant/40 pb-2">
                <FileText className="w-5 h-5 text-primary" />
                Mô tả Voucher
              </h2>
              <div className="prose max-w-none text-on-surface-variant font-body-md text-body-md space-y-4">
                <p>{voucher.description}</p>
                {voucher.highlights && (
                  <ul className="list-disc pl-5 space-y-2">
                    {voucher.highlights.map((highlight, index) => (
                      <li key={index}>{highlight}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}

          {/* Conditions */}
          {voucher.conditions && (
            <div className="bg-surface-container-lowest border border-outline-variant p-6 md:p-8 rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.02)]">
              <h2 className="font-title-md text-title-md text-on-surface mb-4 flex items-center gap-2 font-bold border-b border-outline-variant/40 pb-2">
                <CheckSquare className="w-5 h-5 text-primary" />
                Điều kiện sử dụng
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex gap-3">
                  <CheckCircle2 className="w-5 h-5 text-on-surface-variant shrink-0" />
                  <div>
                    <p className="font-label-md text-label-md font-bold text-on-surface">
                      Hạn sử dụng
                    </p>
                    <p className="font-label-sm text-label-sm text-on-surface-variant">
                      {voucher.expiryDate ? `Đến hết ngày ${voucher.expiryDate}` : (voucher.conditions?.find(c => c.toLowerCase().includes("hạn sử dụng"))?.replace("Hạn sử dụng: ", "") || "Đến hết ngày 31/12/2026")}
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Clock className="w-5 h-5 text-on-surface-variant shrink-0" />
                  <div>
                    <p className="font-label-md text-label-md font-bold text-on-surface">
                      Giờ áp dụng
                    </p>
                    <p className="font-label-sm text-label-sm text-on-surface-variant">
                      11:00 - 14:00 & 18:00 - 22:00 (T2-CN)
                    </p>
                  </div>
                </div>
                <div className="flex gap-3 md:col-span-2">
                  <Info className="w-5 h-5 text-error shrink-0" />
                  <div>
                    <p className="font-label-md text-label-md font-bold text-on-surface">
                      Lưu ý quan trọng
                    </p>
                    <p className="font-label-sm text-label-sm text-on-surface-variant mt-1">
                      {voucher.conditions[voucher.conditions.length - 1] ||
                        "Không áp dụng đồng thời với các chương trình khuyến mãi khác."}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Content (Narrower) */}
        <div className="flex flex-col gap-6">
          {/* Location */}
          {voucher.location && (
            <div className="bg-surface-container-lowest border border-outline-variant p-6 rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.02)]">
              <h3 className="font-title-md text-title-md text-on-surface mb-4 font-bold border-b border-outline-variant/40 pb-2">
                Địa điểm áp dụng
              </h3>
              <p className="font-label-md text-label-md text-on-surface-variant mb-4">
                {voucher.location}
              </p>
              <div className="w-full h-40 bg-surface-container-low rounded-lg overflow-hidden border border-outline-variant relative">
                <div className="absolute inset-0 flex items-center justify-center text-on-surface-variant flex-col bg-surface-container-high/40">
                  <MapPin className="w-10 h-10 mb-2" />
                  <span className="font-label-sm text-label-sm">Bản đồ chi nhánh</span>
                </div>
              </div>
            </div>
          )}

          {/* Guide Steps */}
          {voucher.guideSteps && (
            <div className="bg-surface-bright border border-outline-variant p-6 rounded-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-primary-fixed rounded-bl-full -z-10 opacity-50" />
              <h3 className="font-title-md text-title-md text-on-surface mb-4 font-bold">
                Hướng dẫn sử dụng
              </h3>
              <ol className="space-y-4 relative before:absolute before:inset-y-0 before:left-[11px] before:w-px before:bg-outline-variant">
                {voucher.guideSteps.map((step, idx) => {
                  const parts = step.split(":");
                  const title = parts[0];
                  const desc = parts.slice(1).join(":");

                  return (
                    <li key={idx} className="relative pl-8">
                      <div className="absolute left-0 top-1 w-6 h-6 rounded-full bg-primary text-on-primary flex items-center justify-center font-label-sm text-label-sm z-10 shadow-sm border-2 border-surface-bright font-bold">
                        {idx + 1}
                      </div>
                      <p className="font-label-md text-label-md text-on-surface font-semibold">
                        {title}
                      </p>
                      {desc && (
                        <p className="font-label-sm text-label-sm text-on-surface-variant mt-1">
                          {desc.trim()}
                        </p>
                      )}
                    </li>
                  );
                })}
              </ol>
            </div>
          )}
        </div>
      </section>

      {/* Customer Reviews Section */}
      <section className="relative p-8 md:p-12 rounded-3xl overflow-hidden border border-outline-variant/30 bg-surface/80 backdrop-blur-md shadow-sm">
        <div className="absolute -top-24 -left-24 w-64 h-64 bg-primary-fixed/40 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-tertiary-fixed/30 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col gap-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-outline-variant/40 pb-6">
            <h2 className="font-headline-lg text-headline-lg text-on-surface font-bold">
              Đánh giá khách hàng
            </h2>
            <div className="flex items-center gap-4 bg-surface-container-lowest px-4 py-2 rounded-full border border-outline-variant/50 shadow-sm self-start">
              <div className="flex items-center text-tertiary">
                <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
                <span className="font-title-md text-title-md font-bold text-on-surface ml-1">
                  {voucher.rating}
                </span>
              </div>
              <div className="w-px h-6 bg-outline-variant" />
              <span className="text-on-surface-variant font-label-md text-label-md">
                {voucher.reviewsCount} đánh giá
              </span>
            </div>
          </div>

          {/* Add Review Form */}
          <div className="bg-surface-container-lowest/50 p-6 rounded-xl border border-outline-variant/50 shadow-sm">
            <h3 className="font-title-md text-title-md font-bold text-on-surface mb-4">
              Viết đánh giá của bạn
            </h3>
            <form onSubmit={handleAddReviewSubmit} className="flex flex-col gap-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-label-md text-on-surface font-semibold mb-1">
                    Tên của bạn
                  </label>
                  <input
                    type="text"
                    required
                    value={reviewName}
                    onChange={(e) => setReviewName(e.target.value)}
                    className="w-full bg-surface-bright border border-outline-variant rounded-lg p-2 text-body-md focus:border-primary outline-none"
                    placeholder="Nhập tên..."
                  />
                </div>
                <div>
                  <label className="block text-label-md text-on-surface font-semibold mb-1">
                    Đánh giá sao
                  </label>
                  <select
                    value={reviewRating}
                    onChange={(e) => setReviewRating(parseInt(e.target.value))}
                    className="w-full bg-surface-bright border border-outline-variant rounded-lg p-2 text-body-md focus:border-primary outline-none cursor-pointer"
                  >
                    <option value="5">5 Sao (Rất tốt)</option>
                    <option value="4">4 Sao (Tốt)</option>
                    <option value="3">3 Sao (Bình thường)</option>
                    <option value="2">2 Sao (Tệ)</option>
                    <option value="1">1 Sao (Rất tệ)</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-label-md text-on-surface font-semibold mb-1">
                  Nội dung đánh giá
                </label>
                <textarea
                  rows={3}
                  required
                  value={reviewContent}
                  onChange={(e) => setReviewContent(e.target.value)}
                  className="w-full bg-surface-bright border border-outline-variant rounded-lg p-3 text-body-md focus:border-primary outline-none"
                  placeholder="Chia sẻ trải nghiệm của bạn về voucher..."
                />
              </div>
              <button
                type="submit"
                className="bg-primary text-on-primary font-label-md text-label-md px-6 py-2.5 rounded-lg hover:opacity-90 self-end transition-all shadow-sm cursor-pointer font-bold"
              >
                Gửi đánh giá
              </button>
            </form>
          </div>

          {/* Review List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {voucher.reviews && voucher.reviews.length > 0 ? (
              voucher.reviews.map((rev, index) => (
                <div
                  key={index}
                  className="bg-surface-container-lowest p-5 rounded-xl border border-outline-variant/50 shadow-sm flex flex-col gap-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                          rev.avatarBg || "bg-primary-container text-on-primary-container"
                        }`}
                      >
                        {rev.avatarLetter}
                      </div>
                      <div>
                        <p className="font-label-md text-label-md font-bold text-on-surface">
                          {rev.author}
                        </p>
                        <p className="font-label-sm text-label-sm text-on-surface-variant">
                          {rev.timeAgo}
                        </p>
                      </div>
                    </div>
                    <div className="flex text-tertiary text-sm gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${
                            i < rev.rating
                              ? "text-amber-400 fill-amber-400"
                              : "text-gray-300"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  <p className="font-body-md text-body-md text-on-surface-variant">{rev.content}</p>
                </div>
              ))
            ) : (
              <p className="col-span-2 text-center text-text-muted py-8 font-body-md">
                Chưa có đánh giá nào cho voucher này. Hãy là người đầu tiên đánh giá!
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Similar Vouchers */}
      {similarVouchers.length > 0 && (
        <section className="mt-8">
          <h2 className="font-headline-lg text-headline-lg text-on-surface mb-6 font-bold">
            Voucher tương tự
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {similarVouchers.map((simVoucher) => (
              <VoucherCard key={simVoucher.id} voucher={simVoucher} variant="grid" />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
