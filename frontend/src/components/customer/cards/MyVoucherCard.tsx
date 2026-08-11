import Link from "next/link";
import { MyVoucher, Voucher } from "@/data/mockData";
import { Ticket, CheckCircle2, Clock, XCircle } from "lucide-react";
import Image from "next/image";

interface MyVoucherCardProps {
  myVoucher: MyVoucher;
  voucher: Voucher;
}

export default function MyVoucherCard({ myVoucher, voucher }: MyVoucherCardProps) {
  const getStatusBadge = () => {
    switch (myVoucher.status) {
      case "unused":
        return (
          <div className="bg-secondary-container text-on-secondary-container px-2.5 py-1 rounded flex items-center gap-1 font-label-md text-label-md font-medium">
            <Ticket className="w-3.5 h-3.5" />
            Chưa sử dụng
          </div>
        );
      case "used":
        return (
          <div className="bg-surface-variant text-on-surface-variant px-2.5 py-1 rounded flex items-center gap-1 font-label-md text-label-md font-medium">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Đã sử dụng
          </div>
        );
      case "expiring":
        return (
          <div className="bg-error-container text-on-error-container px-2.5 py-1 rounded flex items-center gap-1 font-label-md text-label-md font-medium">
            <Clock className="w-3.5 h-3.5" />
            Sắp hết hạn
          </div>
        );
      case "expired":
        return (
          <div className="bg-surface-dim text-on-surface-variant px-2.5 py-1 rounded flex items-center gap-1 font-label-md text-label-md font-medium">
            <XCircle className="w-3.5 h-3.5" />
            Đã hết hạn
          </div>
        );
    }
  };

  return (
    <div className="bg-surface-container-lowest rounded-xl border border-outline-variant overflow-hidden flex flex-col shadow-sm group">
      {/* Top Section */}
      <div className="flex gap-4 p-5 items-center bg-surface-container-low/50">
        <div className="w-16 h-16 rounded-lg overflow-hidden shrink-0 border border-outline-variant/30">
          <Image
            width={64}
            height={64}
            src={voucher.thumbnail}
            alt={voucher.title}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="flex-grow">
          <h3 className="font-label-md text-label-md text-on-surface font-semibold line-clamp-2 leading-tight group-hover:text-primary transition-colors">
            {voucher.title}
          </h3>
          <p className="font-label-sm text-label-sm text-text-muted mt-1">{voucher.brand}</p>
        </div>
      </div>

      {/* Ticket Tear Effect */}
      <div className="w-full h-4 bg-transparent relative flex items-center justify-center z-10 -my-2 overflow-hidden">
        <div className="absolute left-[-8px] w-4 h-4 bg-background rounded-full border-r border-outline-variant"></div>
        <div className="w-full voucher-divider h-full"></div>
        <div className="absolute right-[-8px] w-4 h-4 bg-background rounded-full border-l border-outline-variant"></div>
      </div>

      {/* Bottom Section */}
      <div className="p-5 flex flex-col gap-4 bg-surface-container-lowest flex-grow">
        <div className="flex justify-between items-center flex-wrap gap-2">
          {getStatusBadge()}
          {myVoucher.status === "used" && myVoucher.dateUsed && (
            <span className="font-label-sm text-label-sm text-text-muted">
              Dùng lúc: {myVoucher.dateUsed}
            </span>
          )}
          {myVoucher.status === "unused" && (
            <span className="font-label-sm text-label-sm text-text-muted">
              Hạn dùng: {myVoucher.expiryDate}
            </span>
          )}
        </div>

        {/* Voucher Code Box */}
        <div className="bg-surface-container-low border border-outline-variant border-dashed rounded-md p-3 flex justify-between items-center">
          <div className="flex flex-col font-label-md text-label-md font-medium">
            <span className="font-label-sm text-label-sm text-text-muted">Mã Voucher</span>
            <span
              className={`font-title-md text-title-md font-black tracking-widest font-mono ${
                myVoucher.status === "used" || myVoucher.status === "expired"
                  ? "text-text-muted/60 line-through"
                  : "text-primary"
              }`}
            >
              {myVoucher.status === "used" || myVoucher.status === "expired"
                ? `${myVoucher.code.substring(0, 4)}XXXX`
                : myVoucher.code}
            </span>
          </div>
        </div>

        <Link
          href={`/my-vouchers/${myVoucher.id}`}
          className="w-full mt-auto bg-surface-container-high hover:bg-surface-variant text-on-surface py-2.5 rounded-lg font-label-md text-label-md font-semibold text-center transition-all duration-200 cursor-pointer block"
        >
          Xem chi tiết
        </Link>
      </div>
    </div>
  );
}
