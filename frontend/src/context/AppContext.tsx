"use client";

import React, { createContext, useContext } from "react";
import { Voucher, MyVoucher } from "@/data/mockData";
import { useCustomerVouchers } from "@/hooks/useCustomerVouchers";
import { useCustomerCart, CartItem } from "@/hooks/useCustomerCart";

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
  const { vouchers, addReview } = useCustomerVouchers();
  const { cart, myVouchers, addToCart, updateCartQuantity, removeFromCart, checkout, markAsUsed } = useCustomerCart();

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
