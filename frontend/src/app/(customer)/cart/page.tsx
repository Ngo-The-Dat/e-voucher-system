"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useApp } from "@/context/AppContext";
import {
  ChevronRight,
  Trash2,
  Ticket,
  X,
  Minus,
  Plus,
  ArrowRight,
  ShieldCheck,
  ShoppingCart
} from "lucide-react";

export default function CartPage() {
  const router = useRouter();
  const { cart, updateCartQuantity, removeFromCart, checkout } = useApp();

  // Local page state
  const [selectedItems, setSelectedItems] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    cart.forEach((item) => {
      initial[item.voucher.id] = true;
    });
    return initial;
  });

  const [promoCode, setPromoCode] = useState("");
  const [discountPercent, setDiscountPercent] = useState(0);
  const [promoApplied, setPromoApplied] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("Ví VNPay");

  const toggleItem = (id: string) => {
    setSelectedItems((prev) => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const toggleSelectAll = () => {
    const allSelected = cart.every((item) => selectedItems[item.voucher.id]);
    const nextState: Record<string, boolean> = {};
    cart.forEach((item) => {
      nextState[item.voucher.id] = !allSelected;
    });
    setSelectedItems(nextState);
  };

  const deleteSelected = () => {
    cart.forEach((item) => {
      if (selectedItems[item.voucher.id]) {
        removeFromCart(item.voucher.id);
      }
    });
  };

  const applyPromo = () => {
    if (promoCode.trim().toUpperCase() === "LUMINA10") {
      setDiscountPercent(10);
      setPromoApplied(true);
    } else {
      alert("Mã ưu đãi không hợp lệ. Hãy thử: LUMINA10");
    }
  };

  const handleCheckout = () => {
    const itemsToCheckout = cart.filter((item) => selectedItems[item.voucher.id]);
    if (itemsToCheckout.length === 0) {
      alert("Vui lòng chọn ít nhất một sản phẩm để thanh toán.");
      return;
    }

    // Run checkout for the selected items in state
    checkout(paymentMethod);
    router.push("/my-vouchers");
  };

  // Calculations
  const activeCartItems = cart.filter((item) => selectedItems[item.voucher.id]);
  const subtotal = activeCartItems.reduce((sum, item) => sum + item.voucher.price * item.quantity, 0);
  const discountAmount = (subtotal * discountPercent) / 100;
  const total = subtotal - discountAmount;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND"
    }).format(amount);
  };

  const selectAllChecked = cart.length > 0 && cart.every((item) => selectedItems[item.voucher.id]);

  return (
    <main className="flex-grow pt-8 pb-16 px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto w-full">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 font-label-md text-label-md text-on-surface-variant mb-6">
        <Link href="/" className="hover:text-primary transition-colors">
          Trang chủ
        </Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-primary font-medium">Giỏ hàng</span>
      </nav>

      {/* Page Header */}
      <div className="mb-8">
        <h1 className="font-headline-lg text-headline-lg font-bold text-on-surface">
          Giỏ hàng của bạn
        </h1>
        <p className="font-body-md text-body-md text-on-surface-variant mt-2">
          Xem lại các voucher đã chọn trước khi thanh toán.
        </p>
      </div>

      {cart.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 relative items-start">
          {/* Cart Items (Left Side) */}
          <div className="lg:col-span-8 flex flex-col gap-4">
            {/* Header Control */}
            <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-4 flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="selectAll"
                  checked={selectAllChecked}
                  onChange={toggleSelectAll}
                  className="w-5 h-5 rounded border-outline-variant text-primary focus:ring-primary focus:ring-offset-0 cursor-pointer h-5 w-5"
                />
                <label
                  htmlFor="selectAll"
                  className="font-label-md text-label-md text-on-surface cursor-pointer select-none font-semibold"
                >
                  Chọn tất cả ({cart.length} sản phẩm)
                </label>
              </div>
              <button
                onClick={deleteSelected}
                className="font-label-md text-label-md text-error hover:text-on-error-container transition-colors flex items-center gap-1 cursor-pointer font-bold"
              >
                <Trash2 className="w-4 h-4" />
                Xóa đã chọn
              </button>
            </div>

            {/* Items List */}
            <div className="flex flex-col gap-4">
              {cart.map((item) => {
                const voucher = item.voucher;
                const isChecked = !!selectedItems[voucher.id];
                return (
                  <div
                    key={voucher.id}
                    className="bg-surface-container-lowest border border-outline-variant rounded-lg p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.05)] hover:shadow-[0_10px_15px_-3px_rgba(0,0,0,0.05)] transition-shadow duration-300 relative group"
                  >
                    {/* Checkbox */}
                    <div className="pt-2 sm:pt-0 pl-1">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleItem(voucher.id)}
                        className="w-5 h-5 rounded border-outline-variant text-primary focus:ring-primary focus:ring-offset-0 cursor-pointer h-5 w-5"
                      />
                    </div>
                    {/* Image */}
                    <div className="w-full sm:w-32 h-24 rounded-md overflow-hidden shrink-0 border border-outline-variant/50">
                      <img
                        src={voucher.thumbnail}
                        alt={voucher.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    {/* Content details */}
                    <div className="flex-grow flex flex-col justify-between h-full w-full">
                      <div className="flex justify-between items-start gap-4">
                        <div>
                          <h3 className="font-title-md text-title-md text-on-surface line-clamp-2 leading-tight">
                            {voucher.title}
                          </h3>
                          <p className="font-label-sm text-label-sm text-on-surface-variant mt-1 flex items-center gap-1">
                            <Ticket className="w-3.5 h-3.5" />
                            {voucher.category}
                          </p>
                          {item.selectedDate && (
                            <p className="text-xs text-text-muted mt-1">
                              Ngày sử dụng: {item.selectedDate}
                            </p>
                          )}
                        </div>
                        {/* Delete single button */}
                        <button
                          onClick={() => removeFromCart(voucher.id)}
                          className="text-outline hover:text-error transition-colors p-1 rounded-full hover:bg-error-container/20 cursor-pointer flex items-center justify-center"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                      <div className="flex items-end justify-between mt-4">
                        {/* Pricing */}
                        <div>
                          {voucher.originalPrice && (
                            <div className="font-label-sm text-label-sm text-on-surface-variant line-through">
                              {formatCurrency(voucher.originalPrice)}
                            </div>
                          )}
                          <div className="font-title-md text-title-md font-bold text-primary">
                            {formatCurrency(voucher.price)}
                          </div>
                        </div>
                        {/* Quantity controls */}
                        <div className="flex items-center bg-surface-container rounded-md border border-outline-variant h-9">
                          <button
                            onClick={() => updateCartQuantity(voucher.id, item.quantity - 1)}
                            className="w-9 h-full flex items-center justify-center text-on-surface-variant hover:text-primary hover:bg-surface-container-high transition-colors rounded-l-md cursor-pointer"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <input
                            type="text"
                            readOnly
                            value={item.quantity}
                            className="w-10 h-full text-center border-none bg-transparent font-label-md text-label-md text-on-surface p-0 focus:ring-0"
                          />
                          <button
                            onClick={() => updateCartQuantity(voucher.id, item.quantity + 1)}
                            className="w-9 h-full flex items-center justify-center text-on-surface-variant hover:text-primary hover:bg-surface-container-high transition-colors rounded-r-md cursor-pointer"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Sticky Summary (Right Side) */}
          <div className="lg:col-span-4 lg:sticky lg:top-[128px] h-fit">
            <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 shadow-[0_4px_12px_-2px_rgba(0,0,0,0.05)] flex flex-col gap-4">
              <h2 className="font-title-md text-title-md font-bold text-on-surface border-b border-outline-variant pb-4">
                Tóm tắt đơn hàng
              </h2>
              <div className="flex flex-col gap-3">
                <div className="flex justify-between items-center">
                  <span className="font-label-md text-label-md text-on-surface-variant">
                    Tạm tính ({activeCartItems.length} sản phẩm)
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

                {/* Payment Method Option */}
                <div className="flex flex-col gap-2 mt-4 pt-4 border-t border-outline-variant/30">
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
                className="w-full bg-primary hover:opacity-95 text-on-primary font-title-md text-title-md py-4 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 font-bold flex justify-center items-center gap-2 cursor-pointer"
              >
                Tiến hành đặt hàng
                <ArrowRight className="w-5 h-5" />
              </button>
              <div className="flex items-center justify-center gap-2 text-on-surface-variant font-label-sm text-label-sm">
                <ShieldCheck className="w-4 h-4 text-secondary" />
                Thanh toán an toàn &amp; bảo mật
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Empty Cart State */
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
      )}
    </main>
  );
}
