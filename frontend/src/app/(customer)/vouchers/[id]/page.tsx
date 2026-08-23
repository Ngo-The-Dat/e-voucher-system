"use client";

import { use, useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useApp } from "@/context/AppContext";
import {
  getStoredCustomerUser,
  CustomerUser,
  customerContentApi,
  CustomerContent,
  customerReviewApi,
  CheckReviewEligibilityResponse,
} from "@/lib/customer-api";
import Image from "next/image";
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
  MapPin,
  BookOpen,
  Lock,
  ShieldAlert,
  RefreshCw,
  MessageSquarePlus,
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
  const [currentUser, setCurrentUser] = useState<CustomerUser | null>(null);
  const [programContents, setProgramContents] = useState<CustomerContent[]>([]);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewContent, setReviewContent] = useState("");
  const [hasComplaint, setHasComplaint] = useState(false);
  const [complaintContent, setComplaintContent] = useState("");

  // Review eligibility states
  const [reviewEligibility, setReviewEligibility] = useState<CheckReviewEligibilityResponse | null>(null);
  const [isLoadingEligibility, setIsLoadingEligibility] = useState<boolean>(true);
  const [isSubmittingReview, setIsSubmittingReview] = useState<boolean>(false);
  const [reviewSubmitSuccess, setReviewSubmitSuccess] = useState<boolean>(false);

  // Reviews from database
  const [reviewsList, setReviewsList] = useState<any[]>([]);
  const [reviewsSummary, setReviewsSummary] = useState<{ total_reviews: number; average_rating: number } | null>(null);
  const [isLoadingReviews, setIsLoadingReviews] = useState<boolean>(true);

  const fetchReviews = useCallback(async () => {
    const programId = Number(id);
    if (!programId || isNaN(programId)) return;
    try {
      setIsLoadingReviews(true);
      const res = await customerReviewApi.getProgramReviews(programId);
      if (res && Array.isArray(res.reviews)) {
        const mapped = res.reviews.map((r: any) => ({
          review_id: r.review_id,
          author: r.customer_name || "Khách hàng",
          avatarLetter: (r.customer_name || "K").charAt(0).toUpperCase(),
          avatarBg: "bg-primary-container text-on-primary-container",
          rating: Number(r.rating) || 5,
          timeAgo: r.submitted_at ? new Date(r.submitted_at).toLocaleDateString("vi-VN") : "Gần đây",
          content: r.review_content || "Khách hàng không để lại nhận xét.",
          complaint: r.complaint_content || undefined,
        }));
        setReviewsList(mapped);
        if (res.summary) {
          setReviewsSummary({
            total_reviews: Number(res.summary.total_reviews) || mapped.length,
            average_rating: res.summary.average_rating ? parseFloat(Number(res.summary.average_rating).toFixed(1)) : 5.0,
          });
        }
      }
    } catch (err) {
      console.warn("Không tải được danh sách đánh giá từ API:", err);
    } finally {
      setIsLoadingReviews(false);
    }
  }, [id]);

  useEffect(() => {
    const user = getStoredCustomerUser();
    if (user) {
      setCurrentUser(user);
      customerReviewApi
        .checkEligibility(id)
        .then((res) => {
          setReviewEligibility(res);
        })
        .catch((err) => {
          console.warn("Could not check review eligibility:", err);
        })
        .finally(() => {
          setIsLoadingEligibility(false);
        });
    } else {
      setIsLoadingEligibility(false);
    }

    fetchReviews();

    // Fetch related policies and contents for this voucher
    const programId = Number(id);
    if (programId && !isNaN(programId)) {
      customerContentApi
        .getContents(undefined, programId)
        .then((res) => {
          if (res.contents) {
            setProgramContents(res.contents);
          }
        })
        .catch((err) => {
          console.error("Failed to load voucher contents:", err);
        });
    }
  }, [id, fetchReviews]);

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
    if (voucher.availableStock !== undefined && voucher.availableStock <= 0) {
      alert("Sản phẩm đã hết hàng.");
      return;
    }
    if (voucher.availableStock !== undefined && quantity > voucher.availableStock) {
      alert(`Số lượng chọn vượt quá số lượng tồn kho (chỉ còn ${voucher.availableStock} sản phẩm).`);
      setQuantity(voucher.availableStock);
      return;
    }
    addToCart(voucher, quantity);
  };

  const handleBuyNow = () => {
    if (voucher.availableStock !== undefined && voucher.availableStock <= 0) {
      alert("Sản phẩm đã hết hàng.");
      return;
    }
    if (voucher.availableStock !== undefined && quantity > voucher.availableStock) {
      alert(`Số lượng chọn vượt quá số lượng tồn kho (chỉ còn ${voucher.availableStock} sản phẩm).`);
      setQuantity(voucher.availableStock);
      return;
    }
    addToCart(voucher, quantity);
    router.push(`/cart?buyNowId=${voucher.id}`);
  };

  const handleAddReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentUser) {
      alert("Vui lòng đăng nhập để gửi đánh giá.");
      router.push(`/login?redirect=/vouchers/${id}`);
      return;
    }

    if (reviewEligibility && !reviewEligibility.hasPurchased) {
      alert("Bạn chưa mua sản phẩm này nên không thể gửi đánh giá.");
      return;
    }

    try {
      setIsSubmittingReview(true);
      await customerReviewApi.createReview({
        programId: Number(id),
        rating: reviewRating,
        reviewContent: reviewContent.trim(),
        complaintContent: hasComplaint ? complaintContent.trim() : undefined,
      });

      setReviewSubmitSuccess(true);
      const authorName = currentUser?.full_name || "Khách hàng";
      addReview(
        voucher.id,
        authorName,
        reviewRating,
        reviewContent.trim(),
        hasComplaint ? complaintContent.trim() : undefined
      );

      setReviewContent("");
      setReviewRating(5);
      setHasComplaint(false);
      setComplaintContent("");

      // Reload reviews and recheck eligibility
      await fetchReviews();
      const updated = await customerReviewApi.checkEligibility(id);
      setReviewEligibility(updated);
    } catch (err: any) {
      alert(err.message || "Lỗi khi gửi đánh giá. Vui lòng thử lại.");
    } finally {
      setIsSubmittingReview(false);
    }
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
            <Image
              width={960}
              height={720}
              priority
              src={voucher.images?.[selectedImageIndex] || voucher.thumbnail}
              alt={voucher.title}
              unoptimized
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
                <Image width={96} height={96} src={img} alt={`${voucher.title} ${index + 1}`} unoptimized className="w-full h-full object-cover" />
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
              {voucher.expiryDate ? `Đến hết ngày ${voucher.expiryDate}` : (voucher.conditions?.find((c: string) => c.toLowerCase().includes("hạn sử dụng")) || "Đến hết ngày 31/12/2026")}
            </div>
          </div>

          {/* Stock Display */}
          {voucher.availableStock !== undefined && (
            <div className="flex flex-col gap-2">
              <span className="font-label-md text-label-md text-on-surface font-semibold flex items-center gap-2">
                <CheckSquare className="w-5 h-5 text-emerald-500" />
                Tình trạng kho
              </span>
              <div className="font-body-md text-body-md bg-surface-container-low p-4 rounded-lg border border-outline-variant/50">
                {voucher.availableStock > 0 ? (
                  <span className="text-emerald-600 font-bold">Còn {voucher.availableStock} sản phẩm</span>
                ) : (
                  <span className="text-error font-bold">Đã hết hàng</span>
                )}
              </div>
            </div>
          )}

          {/* Quantity Selector */}
          <div className="flex items-center justify-between border-t border-b border-outline-variant py-6 mt-2">
            <label className="font-title-md text-title-md font-semibold text-on-surface">
              Số lượng
            </label>
            <div className="flex items-center border border-outline-variant rounded-lg overflow-hidden bg-surface-bright">
              <button
                onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                disabled={quantity <= 1 || (voucher.availableStock !== undefined && voucher.availableStock <= 0)}
                aria-label="Decrease quantity"
                className="w-10 h-10 flex items-center justify-center text-on-surface-variant hover:bg-surface-container transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
              >
                <Minus className="w-4 h-4" />
              </button>
              <input
                aria-label="Quantity"
                type="number"
                min="1"
                max={voucher.availableStock !== undefined ? voucher.availableStock : undefined}
                disabled={voucher.availableStock !== undefined && voucher.availableStock <= 0}
                value={voucher.availableStock !== undefined && voucher.availableStock <= 0 ? 0 : quantity}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  if (isNaN(val) || val < 1) {
                    setQuantity(1);
                  } else if (voucher.availableStock !== undefined && val > voucher.availableStock) {
                    setQuantity(voucher.availableStock);
                  } else {
                    setQuantity(val);
                  }
                }}
                className="w-12 h-10 text-center border-none focus:ring-0 font-label-md text-label-md text-on-surface bg-transparent no-spinner disabled:text-outline disabled:cursor-not-allowed"
              />
              <button
                onClick={() => {
                  const maxStock = voucher.availableStock !== undefined ? voucher.availableStock : 9999;
                  setQuantity((prev) => Math.min(maxStock, prev + 1));
                }}
                disabled={voucher.availableStock !== undefined && (voucher.availableStock <= 0 || quantity >= voucher.availableStock)}
                aria-label="Increase quantity"
                className="w-10 h-10 flex items-center justify-center text-on-surface-variant hover:bg-surface-container transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Checkout/Cart Action Buttons */}
          <div className="flex flex-col gap-3 mt-2">
            <button
              onClick={handleBuyNow}
              disabled={voucher.availableStock === 0}
              className="w-full bg-primary hover:opacity-95 text-on-primary font-title-md text-title-md py-4 rounded-xl shadow-sm transition-all hover:shadow-md hover:-translate-y-[1px] flex justify-center items-center gap-2 cursor-pointer font-bold disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none disabled:hover:translate-y-0 disabled:bg-gray-400"
            >
              <ShoppingBag className="w-5 h-5" />
              {voucher.availableStock === 0 ? "Hết hàng" : "Mua ngay"}
            </button>
            <button
              onClick={handleAddToCart}
              disabled={voucher.availableStock === 0}
              className="w-full border-2 border-primary text-primary hover:bg-primary-fixed font-title-md text-title-md py-4 rounded-xl transition-all flex justify-center items-center gap-2 cursor-pointer font-bold disabled:opacity-50 disabled:border-outline-variant disabled:text-outline-variant disabled:hover:bg-transparent disabled:cursor-not-allowed"
            >
              <ShoppingCart className="w-5 h-5" />
              {voucher.availableStock === 0 ? "Hết hàng" : "Thêm vào giỏ hàng"}
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
            <div className="bg-surface-container-lowest border border-outline-variant p-6 md:p-8 rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.02)] h-full hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1 transition-all duration-300">
              <h2 className="font-title-md text-title-md text-on-surface mb-4 flex items-center gap-2 font-bold border-b border-outline-variant/40 pb-2">
                <FileText className="w-5 h-5 text-primary" />
                Mô tả Voucher
              </h2>
              <div className="prose max-w-none text-on-surface-variant font-body-md text-body-md space-y-4">
                <p>{voucher.description}</p>
                {voucher.highlights && (
                  <ul className="list-disc pl-5 space-y-2">
                    {voucher.highlights.map((highlight: string, index: number) => (
                      <li key={index}>{highlight}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}

          {/* Conditions */}
          {voucher.conditions && (
            <div className="bg-surface-container-lowest border border-outline-variant p-6 md:p-8 rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.02)] h-full hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1 transition-all duration-300">
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
                      {voucher.expiryDate ? `Đến hết ngày ${voucher.expiryDate}` : (voucher.conditions?.find((c: string) => c.toLowerCase().includes("hạn sử dụng"))?.replace("Hạn sử dụng: ", "") || "Đến hết ngày 31/12/2026")}
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

          {/* Related Policy / Articles from Database contents */}
          {programContents.length > 0 && (
            <div className="flex flex-col gap-4">
              {programContents.map((content) => (
                <div
                  key={content.content_id}
                  className="bg-surface-container-lowest border border-outline-variant p-6 md:p-8 rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.02)] h-full hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1 transition-all duration-300"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-primary/10 text-primary uppercase tracking-wide">
                      {content.content_type === "POLICY"
                        ? "Chính sách & Quy định"
                        : content.content_type === "GUIDE"
                        ? "Hướng dẫn"
                        : "Thông tin thêm"}
                    </span>
                  </div>
                  <h3 className="font-title-md text-title-md text-on-surface font-bold mb-3">
                    {content.title}
                  </h3>
                  <div className="text-sm text-on-surface-variant leading-relaxed whitespace-pre-line">
                    {content.body}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Content (Narrower) */}
        <div className="flex flex-col gap-6">
          {/* Location / Branches */}
          {(voucher.locations && voucher.locations.length > 0) ? (
            <div className="bg-surface-container-lowest border border-outline-variant p-6 md:p-8 rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.02)] h-full hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1 transition-all duration-300">
              <h3 className="font-title-md text-title-md text-on-surface mb-4 flex items-center gap-2 font-bold border-b border-outline-variant/40 pb-2">
                <Store className="w-5 h-5 text-primary" />
                Chi nhánh áp dụng ({voucher.locations.length})
              </h3>
              <ul className="space-y-3 mb-4">
                {voucher.locations.map((loc, idx) => (
                  <li key={idx} className="flex gap-2 items-start text-label-md text-on-surface-variant">
                    <MapPin className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    <span>{loc}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : voucher.location ? (
            <div className="bg-surface-container-lowest border border-outline-variant p-6 md:p-8 rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.02)] h-full hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1 transition-all duration-300">
              <h3 className="font-title-md text-title-md text-on-surface mb-4 flex items-center gap-2 font-bold border-b border-outline-variant/40 pb-2">
                <Store className="w-5 h-5 text-primary" />
                Chi nhánh áp dụng
              </h3>
              <p className="font-label-md text-label-md text-on-surface-variant mb-4 flex gap-2 items-start">
                <MapPin className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <span>{voucher.location}</span>
              </p>
            </div>
          ) : null}

          {/* Cancellation Policy */}
          <div className="bg-surface-container-lowest border border-outline-variant p-6 md:p-8 rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.02)] h-full hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1 transition-all duration-300">
            <h3 className="font-title-md text-title-md text-on-surface mb-4 flex items-center gap-2 font-bold border-b border-outline-variant/40 pb-2">
              <ShieldAlert className="w-5 h-5 text-primary" />
              Chính sách hoàn hủy
            </h3>
            <p className="font-label-md text-label-md text-on-surface-variant">
              Không hỗ trợ hoàn/hủy đối với voucher giảm giá (Trừ trường hợp do lỗi hệ thống hoặc đối tác ngừng kinh doanh).
            </p>
          </div>

          {/* Guide Steps */}
          {voucher.guideSteps && (
            <div className="bg-surface-bright border border-outline-variant p-6 md:p-8 rounded-2xl relative overflow-hidden h-full">
              <div className="absolute top-0 right-0 w-24 h-24 bg-primary-fixed rounded-bl-full -z-10 opacity-50" />
              <h3 className="font-title-md text-title-md text-on-surface mb-4 flex items-center gap-2 font-bold border-b border-outline-variant/40 pb-2 relative z-10">
                <BookOpen className="w-5 h-5 text-primary" />
                Hướng dẫn sử dụng
              </h3>
              <ol className="space-y-4 relative before:absolute before:inset-y-0 before:left-[11px] before:w-px before:bg-outline-variant">
                {voucher.guideSteps.map((step: string, idx: number) => {
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
                  {reviewsSummary?.average_rating !== undefined ? reviewsSummary.average_rating : voucher.rating}
                </span>
              </div>
              <div className="w-px h-6 bg-outline-variant" />
              <span className="text-on-surface-variant font-label-md text-label-md">
                {reviewsSummary?.total_reviews !== undefined ? reviewsSummary.total_reviews : reviewsList.length} đánh giá
              </span>
            </div>
          </div>

          {/* Review Input Section - Checked by Purchase Eligibility */}
          {!currentUser ? (
            /* 1. Unauthenticated Case */
            <div className="bg-surface-container-lowest/70 p-6 rounded-2xl border border-outline-variant/60 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <Lock className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-title-md text-title-md font-bold text-on-surface">
                    Viết đánh giá của bạn
                  </h3>
                  <p className="text-xs text-on-surface-variant mt-0.5">
                    Vui lòng đăng nhập với tài khoản đã mua sản phẩm để viết đánh giá và phản hồi dịch vụ.
                  </p>
                </div>
              </div>
              <Link
                href={`/login?redirect=/vouchers/${id}`}
                className="px-5 py-2.5 bg-primary text-on-primary rounded-xl font-label-md text-label-md font-bold hover:opacity-90 transition-all shrink-0 flex items-center gap-2 shadow-sm"
              >
                <Lock className="w-4 h-4" />
                Đăng nhập để đánh giá
              </Link>
            </div>
          ) : !isLoadingEligibility && reviewEligibility && !reviewEligibility.hasPurchased ? (
            /* 2. Logged In but Not Purchased Case */
            <div className="bg-amber-500/10 border border-amber-500/25 p-6 rounded-2xl shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-title-md text-title-md font-bold text-on-surface flex items-center gap-2">
                    <span>Chỉ dành cho khách hàng đã mua sản phẩm</span>
                  </h3>
                  <p className="text-xs text-on-surface-variant mt-0.5 max-w-lg">
                    Bạn chưa mua hoặc chưa sở hữu voucher này. Để đảm bảo tính trung thực và khách quan, hệ thống chỉ cho phép khách hàng đã mua và thanh toán đơn hàng thành công viết đánh giá.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2.5 flex-wrap shrink-0">
                <button
                  type="button"
                  onClick={handleAddToCart}
                  className="px-4 py-2.5 bg-surface-container-high hover:bg-surface-container-highest text-on-surface rounded-xl font-label-md text-label-md font-semibold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  Thêm vào giỏ
                </button>
                <button
                  type="button"
                  onClick={handleBuyNow}
                  className="px-5 py-2.5 bg-primary text-on-primary rounded-xl font-label-md text-label-md font-bold hover:opacity-90 transition-all flex items-center gap-2 cursor-pointer shadow-md"
                >
                  <ShoppingCart className="w-4 h-4" />
                  Mua ngay để đánh giá
                </button>
              </div>
            </div>
          ) : reviewEligibility?.hasPurchased && reviewEligibility?.hasReviewed && !reviewEligibility?.canReview ? (
            /* 3. Logged In and Already Reviewed This Voucher Code */
            <div className="bg-emerald-500/10 border border-emerald-500/25 p-6 rounded-2xl shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-title-md text-title-md font-bold text-on-surface flex items-center gap-2">
                    <span>Bạn đã đánh giá voucher này rồi</span>
                    <span className="text-[11px] bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 px-2.5 py-0.5 rounded-full font-semibold">
                      1 lần / 1 mã voucher
                    </span>
                  </h3>
                  <p className="text-xs text-on-surface-variant mt-0.5 max-w-lg">
                    Mỗi mã voucher chỉ được gửi đánh giá 1 lần duy nhất. Bạn đã hoàn tất đánh giá cho mã <strong className="font-mono text-primary">{reviewEligibility.voucherCode}</strong>. Để tiếp tục gửi đánh giá mới, vui lòng mua thêm voucher.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2.5 flex-wrap shrink-0">
                <button
                  type="button"
                  onClick={handleAddToCart}
                  className="px-4 py-2.5 bg-surface-container-high hover:bg-surface-container-highest text-on-surface rounded-xl font-label-md text-label-md font-semibold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  Thêm vào giỏ
                </button>
                <button
                  type="button"
                  onClick={handleBuyNow}
                  className="px-5 py-2.5 bg-primary text-on-primary rounded-xl font-label-md text-label-md font-bold hover:opacity-90 transition-all flex items-center gap-2 cursor-pointer shadow-md"
                >
                  <ShoppingCart className="w-4 h-4" />
                  Mua để đánh giá
                </button>
              </div>
            </div>
          ) : (
            /* 4. Logged In and Eligible to Review (Has Unreviewed Voucher) */
            <div className="bg-surface-container-lowest/80 p-6 rounded-2xl border border-outline-variant/60 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-outline-variant/40 pb-4">
                <div>
                  <h3 className="font-title-md text-title-md font-bold text-on-surface flex items-center gap-2">
                    <MessageSquarePlus className="w-5 h-5 text-primary" />
                    Viết đánh giá của bạn
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Đã mua hàng (1 đánh giá / mã)
                    </span>
                    {reviewEligibility?.voucherCode && (
                      <span className="text-xs text-on-surface-variant font-mono">
                        Mã voucher: <strong>{reviewEligibility.voucherCode}</strong>
                      </span>
                    )}
                  </div>
                </div>

                {currentUser?.full_name && (
                  <span className="text-xs text-on-surface-variant bg-surface-container-high px-3 py-1.5 rounded-full font-medium self-start sm:self-auto">
                    Đánh giá với tên: <strong className="text-on-surface font-semibold">{currentUser.full_name}</strong>
                  </span>
                )}
              </div>

              {reviewSubmitSuccess && (
                <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2 animate-fadeIn">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>Cảm ơn bạn! Đánh giá và phản hồi của bạn đã được ghi nhận thành công trên hệ thống.</span>
                </div>
              )}

              <form onSubmit={handleAddReviewSubmit} className="flex flex-col gap-4 pt-1">
                <div className="max-w-xs">
                  <label className="block text-label-md text-on-surface font-semibold mb-1">
                    Đánh giá sao
                  </label>
                  <select
                    value={reviewRating}
                    onChange={(e) => setReviewRating(parseInt(e.target.value))}
                    className="w-full bg-surface-bright border border-outline-variant rounded-lg p-2.5 text-body-md focus:border-primary outline-none cursor-pointer"
                  >
                    <option value="5">⭐⭐⭐⭐⭐ 5 Sao (Rất tốt)</option>
                    <option value="4">⭐⭐⭐⭐ 4 Sao (Tốt)</option>
                    <option value="3">⭐⭐⭐ 3 Sao (Bình thường)</option>
                    <option value="2">⭐⭐ 2 Sao (Tệ)</option>
                    <option value="1">⭐ 1 Sao (Rất tệ)</option>
                  </select>
                </div>
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-label-md text-on-surface font-semibold">
                      Nội dung đánh giá
                    </label>
                    <span className="text-xs text-on-surface-variant font-medium">(Không bắt buộc)</span>
                  </div>
                  <textarea
                    rows={3}
                    value={reviewContent}
                    onChange={(e) => setReviewContent(e.target.value)}
                    className="w-full bg-surface-bright border border-outline-variant rounded-lg p-3 text-body-md focus:border-primary outline-none"
                    placeholder="Chia sẻ trải nghiệm sử dụng voucher của bạn..."
                  />
                </div>

                {/* Checkbox khiếu nại */}
                <div className="pt-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={hasComplaint}
                      onChange={(e) => setHasComplaint(e.target.checked)}
                      className="w-4 h-4 accent-error rounded cursor-pointer"
                    />
                    <span className="font-label-md text-label-md font-bold text-error">
                      Tôi có phản ánh / khiếu nại
                    </span>
                  </label>

                  {hasComplaint && (
                    <div className="mt-2 space-y-1">
                      <label className="block text-label-md text-on-surface font-semibold">
                        Nội dung khiếu nại
                      </label>
                      <textarea
                        rows={3}
                        required={hasComplaint}
                        value={complaintContent}
                        onChange={(e) => setComplaintContent(e.target.value)}
                        className="w-full bg-error-container/20 border border-error/40 rounded-lg p-3 text-body-md focus:border-error outline-none"
                        placeholder="Mô tả chi tiết sự cố hoặc phản ánh của bạn..."
                      />
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isSubmittingReview}
                  className="bg-primary text-on-primary font-label-md text-label-md px-6 py-2.5 rounded-lg hover:opacity-90 self-end transition-all shadow-sm cursor-pointer font-bold flex items-center gap-2"
                >
                  {isSubmittingReview ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" /> Đang gửi đánh giá...
                    </>
                  ) : (
                    <>Gửi phiếu đánh giá</>
                  )}
                </button>
              </form>
            </div>
          )}

          {/* Review List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {isLoadingReviews ? (
              <div className="col-span-2 text-center py-8 text-on-surface-variant flex items-center justify-center gap-2">
                <RefreshCw className="w-5 h-5 animate-spin text-primary" />
                <span>Đang tải danh sách đánh giá...</span>
              </div>
            ) : reviewsList && reviewsList.length > 0 ? (
              reviewsList.map((rev, index) => (
                <div
                  key={rev.review_id || index}
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
                  {rev.complaint && (
                    <div className="mt-2 p-3 bg-error-container/30 border border-error/20 rounded-lg text-sm">
                      <p className="font-bold text-error text-xs uppercase tracking-wider mb-1">
                        ⚠️ Phản ánh / Khiếu nại:
                      </p>
                      <p className="text-on-surface">{rev.complaint}</p>
                    </div>
                  )}
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
