"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { customerPaymentApi } from "@/lib/customer-api";
import notify from "@/lib/notify";
import { CheckCircle2, XCircle, RefreshCw, Home, ShoppingBag } from "lucide-react";
import Link from "next/link";

function VNPayReturnContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("Đang xác thực giao dịch...");
  const [orderId, setOrderId] = useState<number | null>(null);

  useEffect(() => {
    const verifyPayment = async () => {
      // Reconstruct query string
      const params = new URLSearchParams();
      searchParams.forEach((value, key) => {
        params.append(key, value);
      });
      const queryString = params.toString() ? `?${params.toString()}` : "";

      if (!queryString) {
        setStatus("error");
        setMessage("Không tìm thấy thông tin giao dịch.");
        notify.error("Không tìm thấy thông tin giao dịch VNPay.");
        return;
      }

      try {
        const res = await customerPaymentApi.verifyVNPayPayment(queryString);
        if (res && res.success) {
          setStatus("success");
          setMessage(res.message || "Giao dịch thành công!");
          setOrderId(res.orderId);
          notify.success(res.message || "Thanh toán VNPay thành công! Voucher đã được cấp vào kho.");
        } else {
          setStatus("error");
          setMessage(res.message || "Giao dịch không thành công.");
          setOrderId(res.orderId);
          notify.error(res.message || "Giao dịch VNPay không thành công hoặc đã bị hủy.");
        }
      } catch (err: any) {
        setStatus("error");
        setMessage(err.message || "Lỗi kết nối khi xác thực giao dịch.");
        notify.error(err, "Lỗi kết nối khi xác thực giao dịch VNPay.");
      }
    };

    verifyPayment();
  }, [searchParams]);

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-surface rounded-2xl shadow-xl border border-outline-variant p-8 text-center space-y-6">
        {status === "loading" && (
          <div className="flex flex-col items-center space-y-4">
            <RefreshCw className="w-16 h-16 text-primary animate-spin" />
            <h2 className="text-xl font-bold text-on-surface">Đang xác thực...</h2>
            <p className="text-on-surface-variant text-sm">Vui lòng không đóng trình duyệt trong quá trình này.</p>
          </div>
        )}

        {status === "success" && (
          <div className="flex flex-col items-center space-y-4 animate-scaleUp">
            <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center shadow-lg">
              <CheckCircle2 className="w-12 h-12" />
            </div>
            <h2 className="text-2xl font-black text-on-surface">Thanh toán thành công!</h2>
            <p className="text-on-surface-variant text-sm">{message}</p>
            {orderId && (
              <p className="font-mono bg-surface-container px-3 py-1.5 rounded-lg text-primary text-sm font-bold border border-outline-variant">
                Mã đơn: #{orderId}
              </p>
            )}
            
            <div className="flex flex-col sm:flex-row gap-3 w-full pt-4">
              <Link href="/my-vouchers" className="flex-1 px-4 py-2.5 bg-primary text-on-primary rounded-xl font-bold flex items-center justify-center gap-2 hover:-translate-y-0.5 transition-transform shadow-md cursor-pointer">
                <ShoppingBag className="w-4 h-4" /> Kho Voucher
              </Link>
              <Link href="/" className="flex-1 px-4 py-2.5 bg-surface-container-high text-on-surface hover:bg-surface-container-highest rounded-xl font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer">
                <Home className="w-4 h-4" /> Trang chủ
              </Link>
            </div>
          </div>
        )}

        {status === "error" && (
          <div className="flex flex-col items-center space-y-4 animate-scaleUp">
            <div className="w-20 h-20 bg-error-container text-error rounded-full flex items-center justify-center shadow-lg">
              <XCircle className="w-12 h-12" />
            </div>
            <h2 className="text-2xl font-black text-on-surface">Thanh toán thất bại</h2>
            <p className="text-on-surface-variant text-sm">{message}</p>
            {orderId && (
              <p className="font-mono bg-surface-container px-3 py-1.5 rounded-lg text-error text-sm font-bold border border-error-container">
                Mã đơn: #{orderId}
              </p>
            )}

            <div className="flex flex-col sm:flex-row gap-3 w-full pt-4">
              <Link href="/orders" className="flex-1 px-4 py-2.5 bg-primary text-on-primary rounded-xl font-bold flex items-center justify-center gap-2 hover:-translate-y-0.5 transition-transform shadow-md cursor-pointer">
                <ShoppingBag className="w-4 h-4" /> Đơn hàng của tôi
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function VNPayReturnPage() {
  return (
    <Suspense fallback={<div className="min-h-[70vh] flex items-center justify-center"><RefreshCw className="w-10 h-10 animate-spin text-primary" /></div>}>
      <VNPayReturnContent />
    </Suspense>
  );
}
