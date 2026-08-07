import Link from "next/link";
import { ShoppingCart } from "lucide-react";

export default function EmptyCart() {
  return (
    <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-12 flex flex-col items-center justify-center text-center shadow-sm max-w-2xl mx-auto my-12">
      <div className="w-24 h-24 bg-surface-container rounded-full flex items-center justify-center mb-6">
        <ShoppingCart className="w-12 h-12 text-outline opacity-60" />
      </div>
      <h3 className="font-title-md text-title-md text-on-surface font-bold mb-2">
        Giỏ hàng của bạn đang trống
      </h3>
      <p className="font-body-md text-body-md text-on-surface-variant mb-8 max-w-sm">
        Có vẻ như bạn chưa chọn voucher nào. Hãy khám phá những ưu đãi hấp dẫn ngay!
      </p>
      <Link
        href="/vouchers"
        className="bg-primary hover:opacity-95 text-on-primary font-semibold py-3 px-8 rounded-lg transition-all shadow-sm"
      >
        Quay lại mua sắm
      </Link>
    </div>
  );
}
