"use client";

import { useState, useEffect, useCallback } from "react";
import { Voucher, MyVoucher, mockMyVouchers } from "@/data/mockData";

export interface CartItem {
  voucher: Voucher;
  quantity: number;
  selectedDate?: string;
}

export function useCustomerCart() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [myVouchers, setMyVouchers] = useState<MyVoucher[]>(mockMyVouchers);

  // Load from localStorage on client side
  useEffect(() => {
    const savedCart = localStorage.getItem("lumina_cart");
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart));
      } catch (e) {
        console.error(e);
      }
    }

    const savedMyVouchers = localStorage.getItem("lumina_my_vouchers");
    if (savedMyVouchers) {
      try {
        setMyVouchers(JSON.parse(savedMyVouchers));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const saveCart = useCallback((newCart: CartItem[]) => {
    setCart(newCart);
    localStorage.setItem("lumina_cart", JSON.stringify(newCart));
  }, []);

  const saveMyVouchers = useCallback((newMyVouchers: MyVoucher[]) => {
    setMyVouchers(newMyVouchers);
    localStorage.setItem("lumina_my_vouchers", JSON.stringify(newMyVouchers));
  }, []);

  const addToCart = useCallback((voucher: Voucher, quantity = 1, selectedDate?: string) => {
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
  }, []);

  const removeFromCart = useCallback((voucherId: string) => {
    setCart((prevCart) => {
      const newCart = prevCart.filter((item) => item.voucher.id !== voucherId);
      localStorage.setItem("lumina_cart", JSON.stringify(newCart));
      return newCart;
    });
  }, []);

  const updateCartQuantity = useCallback((voucherId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(voucherId);
      return;
    }

    setCart((prevCart) => {
      const newCart = prevCart.map((item) =>
        item.voucher.id === voucherId ? { ...item, quantity } : item
      );
      localStorage.setItem("lumina_cart", JSON.stringify(newCart));
      return newCart;
    });
  }, [removeFromCart]);

  const checkout = useCallback((paymentMethod: string) => {
    if (cart.length === 0) return;

    const today = new Date();
    const formattedDate = `${today.getDate().toString().padStart(2, "0")}/${(today.getMonth() + 1)
      .toString()
      .padStart(2, "0")}/${today.getFullYear()}`;

    const orderNumber = `ORD-${today.getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const newPurchasedVouchers: MyVoucher[] = cart.map((item, index) => {
      const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
      let code = "";
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
  }, [cart]);

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
    addToCart,
    updateCartQuantity,
    removeFromCart,
    checkout,
    markAsUsed
  };
}
