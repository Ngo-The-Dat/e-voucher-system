"use client";

import { useState, useCallback } from "react";
import { Voucher, mockVouchers } from "@/data/mockData";

export function useCustomerVouchers() {
  const [vouchers, setVouchers] = useState<Voucher[]>(mockVouchers);
  // Khi có API thực tế, bạn sẽ thêm isLoading, useEffect để fetch data ở đây

  const addReview = useCallback((voucherId: string, author: string, rating: number, content: string) => {
    setVouchers((prevVouchers) => {
      return prevVouchers.map((v) => {
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
    });
  }, []);

  return {
    vouchers,
    setVouchers,
    addReview
  };
}
