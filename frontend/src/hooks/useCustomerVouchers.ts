"use client";

import { useState, useEffect, useCallback } from "react";
import { Voucher, mockVouchers } from "@/data/mockData";
import { customerCatalogApi, BackendCatalogVoucher } from "@/lib/customer-api";

export function useCustomerVouchers() {
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchCatalogVouchers = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await customerCatalogApi.getVouchers({ limit: 50 });
      if (res.vouchers && res.vouchers.length > 0) {
        const mappedVouchers: Voucher[] = res.vouchers.map((item: BackendCatalogVoucher) => ({
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
          rating: item.avg_rating || 4.8,
          reviewsCount: item.reviews_count || 0,
          soldCount: String(item.sold_count || 0),
          image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&auto=format&fit=crop&q=80",
          expiryDate: item.use_end_at ? new Date(item.use_end_at).toLocaleDateString("vi-VN") : "31/12/2026",
          description: item.description || item.program_name,
          conditions: item.terms_conditions ? [item.terms_conditions] : ["Áp dụng theo quy định của đối tác."],
        }));
        setVouchers(mappedVouchers);
      }
    } catch (e) {
      console.warn("Chưa kết nối được danh mục voucher từ backend, sử dụng dữ liệu cục bộ:", e);
      setVouchers(mockVouchers);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCatalogVouchers();
  }, [fetchCatalogVouchers]);

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
    isLoading,
    addReview,
    refreshVouchers: fetchCatalogVouchers,
  };
}
