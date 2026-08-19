"use client";

import React, { createContext, useContext } from "react";
import { Voucher, MyVoucher } from "@/lib/types/customer";
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
  clearCart: () => void;
  clearMyVouchers: () => void;
  addReview: (voucherId: string, author: string, rating: number, content: string, complaint?: string) => void;
  refreshCart: () => Promise<boolean>;
  refreshMyVouchers: () => Promise<boolean>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const { vouchers, addReview } = useCustomerVouchers();
  const { cart, myVouchers, addToCart, updateCartQuantity, removeFromCart, checkout, markAsUsed, clearCart, clearMyVouchers, refreshCart, refreshMyVouchers } = useCustomerCart();

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
        clearCart,
        clearMyVouchers,
        addReview,
        refreshCart,
        refreshMyVouchers
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
