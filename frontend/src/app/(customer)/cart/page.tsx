"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useApp } from "@/context/AppContext";
import { ChevronRight } from "lucide-react";
import { customerOrderApi, CreateOrderItemInput, getStoredCustomerToken } from "@/lib/customer-api";

import CartItemList from "@/components/customer/cart/CartItemList";
import CartSummary, { RecipientState } from "@/components/customer/cart/CartSummary";
import EmptyCart from "@/components/customer/cart/EmptyCart";

export default function CartPage() {
  const router = useRouter();
  const { cart, updateCartQuantity, removeFromCart, checkout, refreshCart, refreshMyVouchers } = useApp();

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

  const [isGift, setIsGift] = useState(false);
  const [recipientInfo, setRecipientInfo] = useState<RecipientState>({
    full_name: "",
    email: "",
    phone: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const handleCheckout = async () => {
    const itemsToCheckout = cart.filter((item) => selectedItems[item.voucher.id]);
    if (itemsToCheckout.length === 0) {
      alert("Vui lòng chọn ít nhất một sản phẩm để thanh toán.");
      return;
    }

    if (isGift) {
      if (!recipientInfo.full_name.trim()) {
        alert("Vui lòng nhập tên người nhận khi mua làm quà tặng.");
        return;
      }
      if (!recipientInfo.email.trim() && !recipientInfo.phone.trim()) {
        alert("Vui lòng nhập Email hoặc Số điện thoại người nhận.");
        return;
      }
    }

    const token = getStoredCustomerToken();
    if (!token) {
      alert("Vui lòng đăng nhập để thực hiện thanh toán đơn hàng.");
      router.push("/login");
      return;
    }

    const apiItems: CreateOrderItemInput[] = itemsToCheckout
      .map((item) => ({
        cart_item_id: item.cartItemId,
        program_id: Number(item.voucher.id),
        quantity: item.quantity,
      }))
      .filter((item) => !isNaN(item.program_id) && item.program_id > 0);

    if (apiItems.length > 0) {
      try {
        setIsSubmitting(true);
        const response = await customerOrderApi.createOrder({
          items: apiItems,
          is_gift: isGift,
          recipient_info: isGift ? recipientInfo : undefined,
          payment_method: paymentMethod,
        });

        alert(response.message || "Tạo đơn hàng và phát hành voucher thành công!");
        if (refreshCart) await refreshCart();
        if (refreshMyVouchers) await refreshMyVouchers();
        router.push("/my-vouchers");
        return;
      } catch (err: any) {
        if (err.message) {
          alert(err.message);
        } else {
          alert("Lỗi hệ thống khi tạo đơn hàng. Vui lòng thử lại.");
        }
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  // Calculations
  const activeCartItems = cart.filter((item) => selectedItems[item.voucher.id]);
  const subtotal = activeCartItems.reduce((sum, item) => sum + item.voucher.price * item.quantity, 0);
  const discountAmount = (subtotal * discountPercent) / 100;
  const total = subtotal - discountAmount;

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
          <CartItemList 
            cart={cart}
            selectedItems={selectedItems}
            toggleItem={toggleItem}
            toggleSelectAll={toggleSelectAll}
            deleteSelected={deleteSelected}
            removeFromCart={removeFromCart}
            updateCartQuantity={updateCartQuantity}
          />
          <CartSummary 
            activeCartItemsLength={activeCartItems.length}
            subtotal={subtotal}
            discountAmount={discountAmount}
            total={total}
            promoCode={promoCode}
            setPromoCode={setPromoCode}
            promoApplied={promoApplied}
            applyPromo={applyPromo}
            paymentMethod={paymentMethod}
            setPaymentMethod={setPaymentMethod}
            isGift={isGift}
            setIsGift={setIsGift}
            recipientInfo={recipientInfo}
            setRecipientInfo={setRecipientInfo}
            handleCheckout={handleCheckout}
            isSubmitting={isSubmitting}
          />
        </div>
      ) : (
        <EmptyCart />
      )}
    </main>
  );
}
