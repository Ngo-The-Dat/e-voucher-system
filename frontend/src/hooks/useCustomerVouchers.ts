"use client";

import { useState, useCallback, useEffect } from "react";
import { Voucher } from "@/lib/types/customer";
import { customerCatalogApi } from "@/lib/customer-api";

export function useCustomerVouchers() {
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchVouchers = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await customerCatalogApi.getVouchers({ limit: 100 });
      if (res && Array.isArray(res.vouchers)) {
        setVouchers(res.vouchers as Voucher[]);
      }
    } catch (e) {
      console.warn("Không kết nối được catalog API:", e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVouchers();
  }, [fetchVouchers]);

  const addReview = useCallback((voucherId: string, author: string, rating: number, content: string, complaint?: string) => {
    setVouchers((prevVouchers) => {
      return prevVouchers.map((v) => {
        if (v.id === voucherId) {
          const newReview = {
            author,
            avatarLetter: author.charAt(0).toUpperCase(),
            avatarBg: "bg-primary-container text-on-primary-container",
            rating,
            timeAgo: "Vừa xong",
            content: content || "Khách hàng không để lại lời nhắn.",
            complaint: complaint && complaint.trim() ? complaint.trim() : undefined
          };

          const existingReviews = v.reviews || [];
          const updatedReviews = [newReview, ...existingReviews];
          const newRating = parseFloat(
            ((v.rating * (v.reviewsCount || 0) + rating) / ((v.reviewsCount || 0) + 1)).toFixed(1)
          );

          return {
            ...v,
            rating: newRating,
            reviewsCount: (v.reviewsCount || 0) + 1,
            reviews: updatedReviews
          };
        }
        return v;
      });
    });
  }, []);

  return {
    vouchers,
    setVouchers,
    isLoading,
    addReview,
    refreshVouchers: fetchVouchers,
  };
}
