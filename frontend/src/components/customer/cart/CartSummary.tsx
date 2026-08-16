"use client";

import { ArrowRight, Gift, ShieldCheck } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export interface RecipientState {
  full_name: string;
  email: string;
  phone: string;
}

interface CartSummaryProps {
  activeCartItemsLength: number;
  subtotal: number;
  discountAmount: number;
  total: number;
  promoCode: string;
  setPromoCode: (code: string) => void;
  promoApplied: boolean;
  applyPromo: () => void;
  paymentMethod: string;
  setPaymentMethod: (method: string) => void;
  isGift: boolean;
  setIsGift: (isGift: boolean) => void;
  recipientInfo: RecipientState;
  setRecipientInfo: React.Dispatch<React.SetStateAction<RecipientState>>;
  handleCheckout: () => void;
  isSubmitting?: boolean;
}

export default function CartSummary({
  activeCartItemsLength,
  subtotal,
  discountAmount,
  total,
  promoCode,
  setPromoCode,
  promoApplied,
  applyPromo,
  paymentMethod,
  setPaymentMethod,
  isGift,
  setIsGift,
  recipientInfo,
  setRecipientInfo,
  handleCheckout,
  isSubmitting = false,
}: CartSummaryProps) {
  return (
    <div className="lg:col-span-4 lg:sticky lg:top-[128px] h-fit">
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 shadow-[0_4px_12px_-2px_rgba(0,0,0,0.05)] flex flex-col gap-4">
        <h2 className="font-title-md text-title-md font-bold text-on-surface border-b border-outline-variant pb-4">
          Tóm tắt đơn hàng
        </h2>

        <div className="flex flex-col gap-3">
          <div className="flex justify-between items-center">
            <span className="font-label-md text-label-md text-on-surface-variant">
              Tạm tính ({activeCartItemsLength} sản phẩm)
            </span>
            <span className="font-body-md text-body-md text-on-surface font-semibold">
              {formatCurrency(subtotal)}
            </span>
          </div>

          <div className="flex justify-between items-center text-secondary">
            <span className="font-label-md text-label-md">Giảm giá voucher</span>
            <span className="font-body-md text-body-md font-semibold">
              -{formatCurrency(discountAmount)}
            </span>
          </div>

          {/* Promo Code Box */}
          <div className="flex gap-2 mt-2 pt-2 border-t border-outline-variant/30">
            <input
              type="text"
              value={promoCode}
              onChange={(e) => setPromoCode(e.target.value)}
              placeholder="Nhập mã ưu đãi..."
              disabled={promoApplied}
              className="flex-grow bg-surface-bright border border-outline-variant rounded-lg px-3 py-2 text-body-md font-body-md focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-shadow disabled:opacity-50"
            />
            <button
              onClick={applyPromo}
              disabled={promoApplied}
              className="bg-surface-container-high text-on-surface font-label-md text-label-md px-4 py-2 rounded-lg hover:bg-surface-variant transition-colors border border-outline-variant cursor-pointer disabled:opacity-50"
            >
              {promoApplied ? "Đã áp dụng" : "Áp dụng"}
            </button>
          </div>
          {promoApplied && (
            <p className="text-xs text-secondary px-1">
              Đã áp dụng mã giảm giá 10% (LUMINA10) thành công!
            </p>
          )}

          {/* Gift Option (BR-CUS-06) */}
          <div className="mt-4 pt-4 border-t border-outline-variant/30 flex flex-col gap-3">
            <label className="flex items-center gap-2 font-label-md text-label-md text-on-surface font-bold cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isGift}
                onChange={(e) => setIsGift(e.target.checked)}
                className="w-4 h-4 rounded border-outline-variant text-primary focus:ring-primary cursor-pointer"
              />
              <Gift className="w-4 h-4 text-primary" />
              <span>Mua làm quà tặng người khác</span>
            </label>

            {isGift && (
              <div className="bg-surface-container-low p-4 rounded-lg border border-primary/20 space-y-3 mt-1">
                <p className="text-xs text-on-surface-variant font-medium">
                  Voucher phát hành sẽ được gán quyền sở hữu trực tiếp cho người nhận.
                </p>
                <div>
                  <label className="block text-xs font-semibold text-on-surface mb-1">
                    Họ và tên người nhận <span className="text-error">*</span>
                  </label>
                  <input
                    type="text"
                    value={recipientInfo.full_name}
                    onChange={(e) =>
                      setRecipientInfo((prev) => ({ ...prev, full_name: e.target.value }))
                    }
                    placeholder="Nguyễn Văn A"
                    className="w-full bg-surface-bright border border-outline-variant rounded-md px-3 py-1.5 text-sm outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-on-surface mb-1">
                    Email người nhận
                  </label>
                  <input
                    type="email"
                    value={recipientInfo.email}
                    onChange={(e) =>
                      setRecipientInfo((prev) => ({ ...prev, email: e.target.value }))
                    }
                    placeholder="nguyenvana@example.com"
                    className="w-full bg-surface-bright border border-outline-variant rounded-md px-3 py-1.5 text-sm outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-on-surface mb-1">
                    Số điện thoại người nhận
                  </label>
                  <input
                    type="tel"
                    value={recipientInfo.phone}
                    onChange={(e) =>
                      setRecipientInfo((prev) => ({ ...prev, phone: e.target.value }))
                    }
                    placeholder="0912345678"
                    className="w-full bg-surface-bright border border-outline-variant rounded-md px-3 py-1.5 text-sm outline-none focus:border-primary"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Payment Method Option */}
          <div className="flex flex-col gap-2 mt-2 pt-2 border-t border-outline-variant/30">
            <label className="font-label-md text-label-md text-on-surface font-bold">
              Phương thức thanh toán
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full bg-surface-bright border border-outline-variant rounded-lg py-2 px-3 text-body-md focus:border-primary cursor-pointer outline-none shadow-sm"
            >
              <option value="Ví VNPay">Ví VNPay</option>
              <option value="Thẻ Visa/Mastercard">Thẻ Visa/Mastercard</option>
              <option value="Ví MoMo">Ví MoMo</option>
            </select>
          </div>
        </div>

        <div className="border-t border-outline-variant pt-4 mb-2">
          <div className="flex justify-between gap-4 items-center">
            <span className="font-title-md text-title-md text-on-surface font-bold">
              Tổng thanh toán
            </span>
            <div className="text-right">
              <span className="font-headline-lg font-bold text-primary block leading-none">
                {formatCurrency(total)}
              </span>
              <span className="font-label-sm text-label-sm text-on-surface-variant mt-1.5 block">
                Đã bao gồm VAT (nếu có)
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={handleCheckout}
          disabled={isSubmitting}
          className="w-full bg-primary hover:opacity-95 text-on-primary font-title-md text-title-md py-4 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 font-bold flex justify-center items-center gap-2 cursor-pointer disabled:opacity-50"
        >
          {isSubmitting ? "Đang xử lý đơn hàng..." : "Tiến hành đặt hàng"}
          <ArrowRight className="w-5 h-5" />
        </button>

        <div className="flex items-center justify-center gap-2 text-on-surface-variant font-label-sm text-label-sm">
          <ShieldCheck className="w-4 h-4 text-secondary" />
          Thanh toán an toàn &amp; bảo mật
        </div>
      </div>
    </div>
  );
}
