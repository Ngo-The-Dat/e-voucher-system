"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import { ChevronRight } from "lucide-react";
import { customerOrderApi, customerPaymentApi, CreateOrderItemInput, PaymentMethodItem, getStoredCustomerToken } from "@/lib/customer-api";
import notify from "@/lib/notify";

import CartItemList from "@/components/customer/cart/CartItemList";
import CartSummary, { RecipientState, RecipientErrors } from "@/components/customer/cart/CartSummary";
import EmptyCart from "@/components/customer/cart/EmptyCart";
import PaymentSimulatorModal, { PaymentSimulatorOrder } from "@/components/customer/checkout/PaymentSimulatorModal";

export default function CartPage() {
  const router = useRouter();
  const { cart, updateCartQuantity, removeFromCart, refreshCart, refreshMyVouchers } = useApp();

  // Local page state
  const [selectedItems, setSelectedItems] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (typeof window !== "undefined") {
      const searchParams = new URLSearchParams(window.location.search);
      const buyNowId = searchParams.get("buyNowId");

      setSelectedItems((prev) => {
        const nextState = { ...prev };
        let changed = false;
        cart.forEach((item) => {
          if (nextState[item.voucher.id] === undefined) {
            nextState[item.voucher.id] = buyNowId ? item.voucher.id === buyNowId : false;
            changed = true;
          }
        });
        return changed ? nextState : prev;
      });
    }
  }, [cart]);

  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState("PAYPAL");

  useEffect(() => {
    let isMounted = true;
    customerPaymentApi
      .getPaymentMethods()
      .then((res) => {
        if (isMounted && res.payment_methods && res.payment_methods.length > 0) {
          setPaymentMethods(res.payment_methods);
          setPaymentMethod(res.payment_methods[0].code);
        }
      })
      .catch((err) => {
        console.warn("Could not fetch payment methods:", err);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const [isGift, setIsGift] = useState(false);
  const [recipientInfo, setRecipientInfo] = useState<RecipientState>({
    full_name: "",
    email: "",
    phone: "",
  });
  const [recipientErrors, setRecipientErrors] = useState<RecipientErrors>({});

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdPaymentOrder, setCreatedPaymentOrder] = useState<PaymentSimulatorOrder | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

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

  const validateGiftRecipient = (): boolean => {
    const errors: RecipientErrors = {};
    const name = recipientInfo.full_name.trim();
    const email = recipientInfo.email.trim();
    const phone = recipientInfo.phone.trim();

    if (!name) {
      errors.full_name = "Vui lòng nhập họ và tên người nhận.";
    } else if (name.length < 2) {
      errors.full_name = "Họ và tên người nhận phải có ít nhất 2 ký tự.";
    }

    if (!email && !phone) {
      errors.contact = "Vui lòng nhập ít nhất Email hoặc Số điện thoại để gửi quà tặng.";
    }

    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        errors.email = "Địa chỉ email không hợp lệ (ví dụ: nguyenvana@example.com).";
      }
    }

    if (phone) {
      const cleanPhone = phone.replace(/\s+/g, "");
      const phoneRegex = /^(0|\+84)[0-9]{9,10}$/;
      if (!phoneRegex.test(cleanPhone)) {
        errors.phone = "Số điện thoại không hợp lệ (gồm 10 chữ số, ví dụ: 0912345678).";
      }
    }

    setRecipientErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCheckout = async () => {
    const itemsToCheckout = cart.filter((item) => selectedItems[item.voucher.id]);
    if (itemsToCheckout.length === 0) {
      notify.warning("Vui lòng chọn ít nhất một sản phẩm để thanh toán.");
      return;
    }

    const outOfStockItem = itemsToCheckout.find((item) => {
      const stock = item.availableStock ?? item.voucher.availableStock;
      return stock !== undefined && stock <= 0;
    });
    if (outOfStockItem) {
      notify.error(`Sản phẩm "${outOfStockItem.voucher.title}" đã hết hàng. Vui lòng bỏ chọn hoặc xóa khỏi giỏ hàng.`);
      return;
    }

    const overStockItem = itemsToCheckout.find((item) => {
      const stock = item.availableStock ?? item.voucher.availableStock;
      return stock !== undefined && item.quantity > stock;
    });
    if (overStockItem) {
      const stock = overStockItem.availableStock ?? overStockItem.voucher.availableStock;
      notify.warning(`Sản phẩm "${overStockItem.voucher.title}" vượt quá số lượng tồn kho (chỉ còn ${stock} sản phẩm). Vui lòng điều chỉnh lại số lượng.`);
      return;
    }

    if (isGift) {
      const isValid = validateGiftRecipient();
      if (!isValid) {
        return;
      }
    }

    const token = getStoredCustomerToken();
    if (!token) {
      notify.warning("Vui lòng đăng nhập để thực hiện thanh toán đơn hàng.");
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

    if (apiItems.length === 0) {
      notify.error("Không tìm thấy thông tin sản phẩm hợp lệ để đặt hàng. Vui lòng thử tải lại trang.");
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await customerOrderApi.createOrder({
        items: apiItems,
        is_gift: isGift,
        recipient_info: isGift ? recipientInfo : undefined,
        payment_method: paymentMethod,
        auto_pay: false,
      });

      if (refreshCart) await refreshCart();

      setCreatedPaymentOrder({
        orderId: response.order.order_id,
        totalAmount: response.order.total_amount,
        paymentMethod: response.order.payment_method,
        createdAt: response.order.created_at,
        elapsedSeconds: response.order.elapsed_seconds ?? 0,
        items: itemsToCheckout.map((item) => ({
          program_name: item.voucher.title,
          quantity: item.quantity,
          unit_price: item.voucher.price,
        })),
      });
      setIsPaymentModalOpen(true);
    } catch (err: any) {
      notify.error(err, "Lỗi hệ thống khi tạo đơn hàng. Vui lòng thử lại sau.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculations
  const activeCartItems = cart.filter((item) => selectedItems[item.voucher.id]);
  const total = activeCartItems.reduce((sum, item) => sum + item.voucher.price * item.quantity, 0);

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
            subtotal={total}
            total={total}
            paymentMethod={paymentMethod}
            setPaymentMethod={setPaymentMethod}
            isGift={isGift}
            setIsGift={setIsGift}
            recipientInfo={recipientInfo}
            setRecipientInfo={setRecipientInfo}
            recipientErrors={recipientErrors}
            setRecipientErrors={setRecipientErrors}
            handleCheckout={handleCheckout}
            isSubmitting={isSubmitting}
            paymentMethods={paymentMethods}
          />
        </div>
      ) : (
        <EmptyCart />
      )}

      {/* Payment Simulator Modal */}
      <PaymentSimulatorModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        order={createdPaymentOrder}
        onPaymentSuccess={() => {
          if (refreshMyVouchers) refreshMyVouchers();
        }}
      />
    </main>
  );
}
