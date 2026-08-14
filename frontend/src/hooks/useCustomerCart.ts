"use client";

import { useState, useEffect, useCallback } from "react";
import { Voucher, MyVoucher, mockMyVouchers } from "@/data/mockData";
import { customerCartApi, customerOrderApi, BackendCartItem, CustomerVoucherItem } from "@/lib/customer-api";

export interface CartItem {
  cartItemId?: number;
  voucher: Voucher;
  quantity: number;
  selectedDate?: string;
  availableStock?: number;
}

export function useCustomerCart() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [myVouchers, setMyVouchers] = useState<MyVoucher[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const fetchBackendCart = useCallback(async () => {
    const token = typeof window !== "undefined" ? (localStorage.getItem("customer_access_token") || localStorage.getItem("token")) : null;
    if (!token) return false;

    try {
      setIsLoading(true);
      const res = await customerCartApi.getCart();
      const mappedCart: CartItem[] = res.items.map((item: BackendCartItem) => ({
        cartItemId: item.cart_item_id,
        quantity: item.quantity,
        availableStock: item.available_stock,
        voucher: {
          id: String(item.program_id),
          title: item.program_name,
          brand: item.business_name || "Lumina Partner",
          brandLogo: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80",
          category: item.category_name || "Khác",
          merchant: item.business_name || "Lumina Partner",
          thumbnail: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&auto=format&fit=crop&q=80",
          images: ["https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&auto=format&fit=crop&q=80"],
          price: item.sale_price,
          originalPrice: item.original_price,
          discount: item.discount_amount ? `${Math.round((item.discount_amount / item.original_price) * 100)}%` : "0%",
          discountBadge: item.discount_amount ? `Giảm ${Math.round((item.discount_amount / item.original_price) * 100)}%` : undefined,
          rating: 4.8,
          reviewsCount: 0,
          soldCount: "0",
          image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&auto=format&fit=crop&q=80",
          expiryDate: item.use_end_at ? new Date(item.use_end_at).toLocaleDateString("vi-VN") : "31/12/2026",
          description: item.program_name
        }
      }));
      setCart(mappedCart);
      return true;
    } catch (e) {
      console.warn("Chưa lấy được giỏ hàng từ backend API, sử dụng giỏ hàng cục bộ:", e);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchBackendMyVouchers = useCallback(async () => {
    const token = typeof window !== "undefined" ? (localStorage.getItem("customer_access_token") || localStorage.getItem("token")) : null;
    if (!token) return false;

    try {
      const res = await customerOrderApi.getMyVouchers();
      if (res.vouchers && res.vouchers.length > 0) {
        const mappedMyVouchers: MyVoucher[] = res.vouchers.map((item: CustomerVoucherItem) => {
          let status: "unused" | "used" | "expiring" | "expired" = "unused";
          if (item.usage_status === "USED") status = "used";
          else if (item.usage_status === "EXPIRED" || item.usage_status === "CANCELLED") status = "expired";
          else if (item.expires_at && new Date(item.expires_at).getTime() - Date.now() < 7 * 24 * 60 * 60 * 1000) {
            status = "expiring";
          }

          return {
            id: String(item.issued_voucher_id),
            voucherId: String(item.program_id),
            code: item.voucher_code,
            datePurchased: item.purchase_date ? new Date(item.purchase_date).toLocaleDateString("vi-VN") : "Hôm nay",
            expiryDate: item.expires_at ? new Date(item.expires_at).toLocaleDateString("vi-VN") : "31/12/2026",
            status,
            orderNumber: item.order_id ? `ORD-${item.order_id}` : "ORD-ONLINE",
            paymentMethod: item.payment_method || "Ví VNPay",
            dateUsed: item.used_at ? new Date(item.used_at).toLocaleDateString("vi-VN") : undefined,
          };
        });
        setMyVouchers(mappedMyVouchers);
        return true;
      }
      return false;
    } catch (e) {
      console.warn("Chưa lấy được kho voucher từ backend, sử dụng mockData:", e);
      return false;
    }
  }, []);

  // Load cart & my vouchers on init
  useEffect(() => {
    fetchBackendCart().then((success) => {
      if (!success) {
        const savedCart = localStorage.getItem("lumina_cart");
        if (savedCart) {
          try {
            setCart(JSON.parse(savedCart));
          } catch (e) {
            console.error(e);
          }
        }
      }
    });

    fetchBackendMyVouchers().then((success) => {
      if (!success) {
        const savedMyVouchers = localStorage.getItem("lumina_my_vouchers");
        if (savedMyVouchers) {
          try {
            setMyVouchers(JSON.parse(savedMyVouchers));
          } catch (e) {
            console.error(e);
          }
        }
      }
    });
  }, [fetchBackendCart, fetchBackendMyVouchers]);

  const addToCart = useCallback(async (voucher: Voucher, quantity = 1, selectedDate?: string) => {
    const token = typeof window !== "undefined" ? (localStorage.getItem("customer_access_token") || localStorage.getItem("token")) : null;
    const programId = Number(voucher.id);

    if (token && !isNaN(programId)) {
      try {
        const res = await customerCartApi.addToCart(programId, quantity);
        if (res.adjusted && res.message) {
          alert(res.message);
        }
        await fetchBackendCart();
        return;
      } catch (err: unknown) {
        if (err instanceof Error) {
          alert(err.message);
        }
      }
    }

    // Fallback to local state if offline or guest
    setCart((prevCart) => {
      const existingIndex = prevCart.findIndex((item) => item.voucher.id === voucher.id);
      const newCart = [...prevCart];

      if (existingIndex > -1) {
        newCart[existingIndex].quantity += quantity;
      } else {
        newCart.push({ voucher, quantity, selectedDate });
      }

      localStorage.setItem("lumina_cart", JSON.stringify(newCart));
      return newCart;
    });
  }, [fetchBackendCart]);

  const removeFromCart = useCallback(async (voucherId: string) => {
    const token = typeof window !== "undefined" ? (localStorage.getItem("customer_access_token") || localStorage.getItem("token")) : null;
    const itemToRemove = cart.find((item) => item.voucher.id === voucherId);

    if (token && itemToRemove?.cartItemId) {
      try {
        await customerCartApi.removeFromCart(itemToRemove.cartItemId);
        await fetchBackendCart();
        return;
      } catch (err: unknown) {
        console.error("Lỗi khi xóa sản phẩm từ API giỏ hàng:", err);
      }
    }

    setCart((prevCart) => {
      const newCart = prevCart.filter((item) => item.voucher.id !== voucherId);
      localStorage.setItem("lumina_cart", JSON.stringify(newCart));
      return newCart;
    });
  }, [cart, fetchBackendCart]);

  const updateCartQuantity = useCallback(async (voucherId: string, quantity: number) => {
    if (quantity <= 0) {
      await removeFromCart(voucherId);
      return;
    }

    const token = typeof window !== "undefined" ? (localStorage.getItem("customer_access_token") || localStorage.getItem("token")) : null;
    const itemToUpdate = cart.find((item) => item.voucher.id === voucherId);

    if (token && itemToUpdate?.cartItemId) {
      try {
        const res = await customerCartApi.updateCartItem(itemToUpdate.cartItemId, quantity);
        if (res.adjusted && res.message) {
          alert(res.message);
        }
        await fetchBackendCart();
        return;
      } catch (err: unknown) {
        if (err instanceof Error) {
          alert(err.message);
        }
      }
    }

    setCart((prevCart) => {
      const newCart = prevCart.map((item) =>
        item.voucher.id === voucherId ? { ...item, quantity } : item
      );
      localStorage.setItem("lumina_cart", JSON.stringify(newCart));
      return newCart;
    });
  }, [cart, fetchBackendCart, removeFromCart]);

  const checkout = useCallback(async (paymentMethod: string) => {
    if (cart.length === 0) return;

    const token = typeof window !== "undefined" ? (localStorage.getItem("customer_access_token") || localStorage.getItem("token")) : null;
    if (token) {
      try {
        await customerCartApi.clearCart();
        await fetchBackendMyVouchers();
      } catch (e) {
        console.error("Lỗi khi dọn dẹp giỏ hàng backend:", e);
      }
    }

    const today = new Date();
    const formattedDate = `${today.getDate().toString().padStart(2, "0")}/${(today.getMonth() + 1)
      .toString()
      .padStart(2, "0")}/${today.getFullYear()}`;

    const orderNumber = `ORD-${today.getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const newPurchasedVouchers: MyVoucher[] = cart.map((item, index) => {
      const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
      let code = "EV-";
      for (let i = 0; i < 8; i++) {
        code += characters.charAt(Math.floor(Math.random() * characters.length));
      }

      return {
        id: `my-${item.voucher.id}-${Date.now()}-${index}`,
        voucherId: item.voucher.id,
        code,
        datePurchased: formattedDate,
        expiryDate: item.voucher.expiryDate || "31/12/2026",
        status: "unused",
        orderNumber,
        paymentMethod
      };
    });

    setMyVouchers((prev) => {
      const updated = [...newPurchasedVouchers, ...prev];
      localStorage.setItem("lumina_my_vouchers", JSON.stringify(updated));
      return updated;
    });

    setCart([]);
    localStorage.setItem("lumina_cart", JSON.stringify([]));
  }, [cart, fetchBackendMyVouchers]);

  const markAsUsed = useCallback((myVoucherId: string) => {
    const today = new Date();
    const formattedDate = `${today.getDate().toString().padStart(2, "0")}/${(today.getMonth() + 1)
      .toString()
      .padStart(2, "0")}/${today.getFullYear()}`;

    setMyVouchers((prev) => {
      const updated = prev.map((v) => {
        if (v.id === myVoucherId) {
          return {
            ...v,
            status: "used" as const,
            dateUsed: formattedDate
          };
        }
        return v;
      });
      localStorage.setItem("lumina_my_vouchers", JSON.stringify(updated));
      return updated;
    });
  }, []);

  return {
    cart,
    myVouchers,
    isLoading,
    addToCart,
    updateCartQuantity,
    removeFromCart,
    checkout,
    markAsUsed,
    refreshCart: fetchBackendCart,
    refreshMyVouchers: fetchBackendMyVouchers
  };
}
