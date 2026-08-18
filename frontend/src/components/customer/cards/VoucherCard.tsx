import Link from "next/link";
import { Voucher } from "@/data/mockData";
import { Star } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import Image from "next/image";

interface VoucherCardProps {
  voucher: Voucher;
  variant?: "standard" | "grid";
}

export default function VoucherCard({ voucher, variant = "standard" }: VoucherCardProps) {
  const formattedPrice = formatCurrency(voucher.price);

  const formattedOriginalPrice = voucher.originalPrice
    ? formatCurrency(voucher.originalPrice)
    : null;

  if (variant === "grid") {
    return (
      <Link
        href={`/vouchers/${voucher.id}`}
        className="group bg-surface-container-lowest rounded-xl overflow-hidden border border-outline-variant hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex flex-col"
      >
        <div className="relative w-full aspect-video overflow-hidden">
          <Image
            width={640}
            height={360}
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
            src={voucher.thumbnail}
            alt={voucher.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          {voucher.discountBadge && (
            <div className="absolute top-2 right-2 bg-surface-container-lowest/90 backdrop-blur-sm px-2 py-1 rounded text-error font-label-sm text-label-sm font-bold border border-outline-variant/30">
              {voucher.discountBadge}
            </div>
          )}
          {voucher.bestSeller && (
            <div className="absolute top-2 left-2 bg-error text-on-error px-2 py-0.5 rounded font-label-sm text-label-sm font-bold shadow-sm">
              Bán chạy
            </div>
          )}
        </div>
        <div className="p-4 flex flex-col flex-grow gap-2">
          <h3 className="font-title-md text-title-md text-on-surface line-clamp-2 min-h-[48px] leading-tight">
            {voucher.title}
          </h3>
          <div className="flex items-center gap-1 text-tertiary text-sm mt-auto">
            <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
            <span className="font-label-sm text-label-sm text-on-surface">{voucher.rating}</span>
            <span className="text-on-surface-variant font-label-sm text-label-sm ml-1">
              ({voucher.reviewsCount})
            </span>
          </div>
          <div className="flex items-end gap-2 mt-1">
            <span className="font-title-md text-title-md font-bold text-primary">
              {formattedPrice}
            </span>
            {formattedOriginalPrice && (
              <span className="font-label-sm text-label-sm text-on-surface-variant line-through pb-[2px]">
                {formattedOriginalPrice}
              </span>
            )}
          </div>
        </div>
      </Link>
    );
  }

  // Standard/Home Featured styling
  return (
    <div className="group bg-surface border border-outline-variant rounded-xl overflow-hidden shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex flex-col">
      <div className="relative h-40">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url('${voucher.thumbnail}')` }}
        />
        {voucher.bestSeller && (
          <div className="absolute top-3 left-3 bg-error text-on-error px-2 py-1 rounded font-label-sm text-label-sm font-bold shadow-sm">
            Bán chạy
          </div>
        )}
        {/* Merchant Logo */}
        <div className="absolute -bottom-6 right-4 w-12 h-12 bg-surface-container-lowest rounded-full border border-outline-variant shadow-sm flex items-center justify-center p-1 z-10 overflow-hidden">
          {voucher.brandLogo ? (
            <img
              width={48}
              height={48}
              className="w-full h-full object-cover rounded-full"
              src={voucher.brandLogo}
              alt={voucher.brand || "Brand logo"}
              onError={(e) => {
                (e.target as HTMLElement).style.display = "none";
              }}
            />
          ) : (
            <span className="text-xs font-bold text-primary">
              {(voucher.brand || "V").charAt(0).toUpperCase()}
            </span>
          )}
        </div>
      </div>
      <div className="p-5 flex-grow flex flex-col">
        <Link href={`/vouchers/${voucher.id}`}>
          <h3 className="font-title-md text-title-md text-on-surface mb-1 line-clamp-2 min-h-[48px] leading-tight hover:text-primary transition-colors">
            {voucher.title}
          </h3>
        </Link>
        <p className="font-label-sm text-label-sm text-on-surface-variant mb-4">{voucher.brand}</p>
        <div className="mt-auto">
          <div className="flex items-center gap-2 mb-3">
            <span className="font-title-md text-title-md text-primary font-bold">
              {formattedPrice}
            </span>
            {formattedOriginalPrice && (
              <span className="font-label-sm text-label-sm text-text-muted line-through">
                {formattedOriginalPrice}
              </span>
            )}
          </div>
          <Link
            href={`/vouchers/${voucher.id}`}
            className="w-full py-2 bg-primary-container/10 text-primary border border-primary/20 rounded-lg font-label-md text-label-md font-semibold hover:bg-primary hover:text-on-primary transition-colors inline-block text-center cursor-pointer"
          >
            Mua ngay
          </Link>
        </div>
      </div>
    </div>
  );
}
