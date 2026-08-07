"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { Voucher, MyVoucher, mockVouchers, mockMyVouchers } from "@/data/mockData";

export interface CartItem {
  voucher: Voucher;
  quantity: number;
  selectedDate?: string;
}

interface AppContextType {
  vouchers: Voucher[];
  cart: CartItem[];
  myVouchers: MyVoucher[];
  addToCart: (voucher: Voucher, quantity?: number, selectedDate?: string) => void;
  updateCartQuantity: (voucherId: string, quantity: number) => void;
  removeFromCart: (voucherId: string) => void;
  checkout: (paymentMethod: string) => void;
  markAsUsed: (myVoucherId: string) => void;
  addReview: (voucherId: string, author: string, rating: number, content: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [vouchers, setVouchers] = useState<Voucher[]>(mockVouchers);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [myVouchers, setMyVouchers] = useState<MyVoucher[]>(mockMyVouchers);

  // Load cart and myVouchers from localStorage on client side
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

  // Save cart to localStorage
  const saveCart = (newCart: CartItem[]) => {
    setCart(newCart);
    localStorage.setItem("lumina_cart", JSON.stringify(newCart));
  };

  // Save myVouchers to localStorage
  const saveMyVouchers = (newMyVouchers: MyVoucher[]) => {
    setMyVouchers(newMyVouchers);
    localStorage.setItem("lumina_my_vouchers", JSON.stringify(newMyVouchers));
  };

  const addToCart = (voucher: Voucher, quantity = 1, selectedDate?: string) => {
    const existingIndex = cart.findIndex((item) => item.voucher.id === voucher.id);
    const newCart = [...cart];

    if (existingIndex > -1) {
      newCart[existingIndex].quantity += quantity;
    } else {
      newCart.push({ voucher, quantity, selectedDate });
    }

    saveCart(newCart);
  };

  const updateCartQuantity = (voucherId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(voucherId);
      return;
    }

    const newCart = cart.map((item) =>
      item.voucher.id === voucherId ? { ...item, quantity } : item
    );
    saveCart(newCart);
  };

  const removeFromCart = (voucherId: string) => {
    const newCart = cart.filter((item) => item.voucher.id !== voucherId);
    saveCart(newCart);
  };

  const checkout = (paymentMethod: string) => {
    if (cart.length === 0) return;

    const today = new Date();
    const formattedDate = `${today.getDate().toString().padStart(2, "0")}/${(today.getMonth() + 1)
      .toString()
      .padStart(2, "0")}/${today.getFullYear()}`;



    const orderNumber = `ORD-${today.getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const newPurchasedVouchers: MyVoucher[] = cart.map((item, index) => {
      // Generate a random voucher code like GOGI88X9
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

    const updatedMyVouchers = [...newPurchasedVouchers, ...myVouchers];
    saveMyVouchers(updatedMyVouchers);
    saveCart([]); // clear cart
  };

  const markAsUsed = (myVoucherId: string) => {
    const today = new Date();
    const formattedDate = `${today.getDate().toString().padStart(2, "0")}/${(today.getMonth() + 1)
      .toString()
      .padStart(2, "0")}/${today.getFullYear()}`;

    const updated = myVouchers.map((v) => {
      if (v.id === myVoucherId) {
        return {
          ...v,
          status: "used" as const,
          dateUsed: formattedDate
        };
      }
      return v;
    });

    saveMyVouchers(updated);
  };

  const addReview = (voucherId: string, author: string, rating: number, content: string) => {
    const updatedVouchers = vouchers.map((v) => {
      if (v.id === voucherId) {
        const newReview = {
          author,
          avatarLetter: author.charAt(0).toUpperCase(),
          avatarBg: "bg-primary-container text-on-primary-container",
          rating,
          timeAgo: "Vừa xong",
          content
        };

        const existingReviews = v.reviews || [];
        const updatedReviews = [newReview, ...existingReviews];
        const newRating = parseFloat(
          ((v.rating * v.reviewsCount + rating) / (v.reviewsCount + 1)).toFixed(1)
        );

        return {
          ...v,
          rating: newRating,
          reviewsCount: v.reviewsCount + 1,
          reviews: updatedReviews
        };
      }
      return v;
    });

    setVouchers(updatedVouchers);
  };

  return (
    <AppContext.Provider
      value={{
        vouchers,
        cart,
        myVouchers,
        addToCart,
        updateCartQuantity,
        removeFromCart,
        checkout,
        markAsUsed,
        addReview
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
}
