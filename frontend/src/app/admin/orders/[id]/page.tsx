"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import Icon from "@/components/shared/ui/Icon";
import { Button } from "@/components/shared/ui/Button";
import StatusBadge from "@/components/shared/ui/StatusBadge";
import { adminApi, AdminOrderDetail, AdminApiError } from "@/lib/admin-api";

export default function OrderDetailPage() {
  const params = useParams();
  const rawId = params?.id as string;
  const orderId = Number(rawId);

  const [order, setOrder] = useState<AdminOrderDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Dialog State
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [isCancelling, setIsCancelling] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const loadOrderDetail = useCallback(async () => {
    if (!orderId || isNaN(orderId)) {
      setError("Mã đơn hàng không hợp lệ.");
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const res = await adminApi.getOrder(orderId);
      setOrder(res);
    } catch (err: any) {
      if (err instanceof AdminApiError) {
        setError(err.message);
      } else {
        setError("Không thể tải thông tin chi tiết đơn hàng.");
      }
    } finally {
      setIsLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    loadOrderDetail();
  }, [loadOrderDetail]);

  const formatCurrency = (val: number | string) => {
    const num = Number(val) || 0;
    return num.toLocaleString("vi-VN") + " ₫";
  };

  const formatDateDisplay = (dateStr: string) => {
    if (!dateStr) return "—";
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return (
        d.toLocaleDateString("vi-VN", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        }) +
        " " +
        d.toLocaleTimeString("vi-VN", {
          hour: "2-digit",
          minute: "2-digit",
        })
      );
    } catch {
      return dateStr;
    }
  };

  const getOrderStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return { label: "Chờ xử lý", status: "pending" };
      case "CONFIRMED":
        return { label: "Đã xác nhận", status: "confirmed" };
      case "COMPLETED":
        return { label: "Hoàn thành", status: "published" };
      case "CANCELLED":
        return { label: "Đã hủy", status: "rejected" };
      default:
        return { label: status, status: "draft" };
    }
  };

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case "UNPAID":
        return { label: "Chưa thanh toán", status: "pending" };
      case "PAID":
        return { label: "Đã thanh toán", status: "published" };
      case "FAILED":
        return { label: "Thanh toán thất bại", status: "rejected" };
      case "REFUNDED":
        return { label: "Đã hoàn tiền", status: "hidden" };
      default:
        return { label: status, status: "draft" };
    }
  };

  // Thu thập tất cả issued_vouchers của các items trong đơn
  const allVouchers = (order?.items || []).flatMap((item) =>
    (item.vouchers || []).map((v) => ({
      ...v,
      program_name: item.program_name,
      partner_name: item.partner_name,
      unit_price: item.unit_price,
    }))
  );

  // Kiểm tra chính sách hủy đơn hàng (RB-14 / UC-ADM-10)
  const isEligibleForCancellation = () => {
    if (!order || order.order_status === "CANCELLED") return false;
    // Nếu có voucher nào trong đơn đã sử dụng (USED) -> Không đủ điều kiện hủy
    const hasUsedVoucher = allVouchers.some((v) => v.usage_status === "USED");
    return !hasUsedVoucher;
  };

  // Thực hiện Hủy đơn hàng và hoàn tiền (UC-ADM-10)
  const handleConfirmCancelOrder = async () => {
    if (!cancelReason.trim()) {
      setModalError("Vui lòng nhập lý do hủy đơn hàng!");
      toast.error("Vui lòng nhập lý do hủy đơn hàng!");
      return;
    }

    try {
      setIsCancelling(true);
      setModalError(null);
      await adminApi.cancelOrder(orderId, cancelReason.trim());
      toast.success(`Đã hủy đơn hàng [ORD-${orderId}] thành công và hoàn tiền.`);
      setIsCancelModalOpen(false);
      setCancelReason("");
      await loadOrderDetail();
    } catch (err: any) {
      setModalError(err.message || "Lỗi khi hủy đơn hàng.");
      toast.error(err.message || "Lỗi khi hủy đơn hàng.");
    } finally {
      setIsCancelling(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto py-8">
        <div className="flex items-center gap-4 animate-pulse">
          <div className="h-8 bg-slate-200 rounded w-48" />
          <div className="h-6 bg-slate-200 rounded-full w-24" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-pulse">
          <div className="h-44 bg-slate-100 rounded-2xl" />
          <div className="h-44 bg-slate-100 rounded-2xl" />
        </div>
        <div className="h-64 bg-slate-100 rounded-2xl animate-pulse" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-7xl mx-auto py-12 text-center space-y-4">
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 max-w-md mx-auto">
          <Icon name="error" className="text-3xl text-rose-500 mb-2 mx-auto block" />
          <p className="font-semibold text-sm">{error || "Không tìm thấy đơn hàng."}</p>
        </div>
        <Link
          href="/admin/orders"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white font-semibold text-xs rounded-xl hover:bg-blue-700 transition"
        >
          <Icon name="arrow_back" className="text-base" />
          Quay lại danh sách đơn hàng
        </Link>
      </div>
    );
  }

  const oBadge = getOrderStatusBadge(order.order_status);
  const pBadge = getPaymentStatusBadge(order.payment_status);
  const isGift = Boolean(order.recipient_name);
  const hasUsedVoucher = allVouchers.some((v) => v.usage_status === "USED");

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Header & Breadcrumb */}
      <div className="border-b border-slate-200 pb-4">
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Link href="/admin/orders" className="hover:text-blue-600 transition">
                ĐƠN HÀNG
              </Link>
              <span>&rsaquo;</span>
              <span className="text-slate-600">Chi tiết đơn hàng ORD-{order.order_id}</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
              <span>Đơn hàng ORD-{order.order_id}</span>
              <StatusBadge status={oBadge.status} label={oBadge.label} />
              <StatusBadge status={pBadge.status} label={pBadge.label} />
            </h1>
          </div>

          <Link
            href="/admin/orders"
            className="px-4 py-2 bg-white border border-slate-200 text-slate-700 font-semibold text-xs rounded-xl hover:bg-slate-50 transition shadow-2xs inline-flex items-center gap-1.5"
          >
            <Icon name="arrow_back" className="text-base" />
            Quay lại danh sách đơn hàng
          </Link>
        </div>
      </div>

      {/* Cảnh báo Không đủ điều kiện Hủy */}
      {hasUsedVoucher && order.order_status !== "CANCELLED" && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 space-y-1">
          <div className="font-bold flex items-center gap-1.5 text-rose-900">
            <Icon name="block" className="text-lg" />
            Không đủ điều kiện hủy đơn hàng
          </div>
          <p className="text-xs">
            Đơn hàng có chứa voucher đã được khách hàng sử dụng tại cơ sở đối tác. Hệ thống không thể thực hiện hủy đơn hoặc hoàn tiền.
          </p>
        </div>
      )}

      {/* Thông tin Hủy đơn (Nếu đơn đã hủy) */}
      {order.order_status === "CANCELLED" && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl space-y-1">
          <div className="font-bold text-xs text-rose-900 flex items-center gap-1.5">
            <Icon name="cancel" className="text-base" />
            Thông tin Hủy đơn & Hoàn tiền
          </div>
          <p className="text-xs text-rose-800">
            <span className="font-semibold">Lý do hủy:</span> {order.cancel_reason || "Không có lý do"}
          </p>
          {order.cancel_at && (
            <p className="text-[11px] text-rose-600 font-medium">
              Thời gian hủy: {formatDateDisplay(order.cancel_at)}
              {order.cancel_admin_name && ` (Bởi: ${order.cancel_admin_name})`}
            </p>
          )}
        </div>
      )}

      {/* Grid: Người Mua & Người Nhận (Phân định buyer_user_id & recipient_user_id) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Khung 1: Người mua (Buyer) */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Icon name="person" className="text-blue-600 text-base" />
              THÔNG TIN NGƯỜI MUA (BUYER)
            </div>
            <span className="text-[11px] text-slate-400 font-mono">ID: #{order.buyer_id}</span>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500 text-xs">Họ và tên:</span>
              <span className="font-bold text-slate-900">{order.buyer_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 text-xs">Số điện thoại:</span>
              <span className="font-semibold text-slate-800 font-mono text-xs">{order.buyer_phone || "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 text-xs">Email:</span>
              <span className="font-semibold text-slate-800 text-xs">{order.buyer_email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 text-xs">Ngày đặt hàng:</span>
              <span className="font-semibold text-slate-800 text-xs">{formatDateDisplay(order.created_at)}</span>
            </div>
          </div>
        </div>

        {/* Khung 2: Người nhận (Recipient) */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Icon name="card_giftcard" className="text-emerald-600 text-base" />
              THÔNG TIN NGƯỜI NHẬN (RECIPIENT)
            </div>
            {isGift ? (
              <span className="px-2.5 py-0.5 bg-purple-50 text-purple-700 font-bold text-[11px] rounded-md border border-purple-200">
                🎁 Mua tặng quà
              </span>
            ) : (
              <span className="px-2.5 py-0.5 bg-slate-100 text-slate-600 font-semibold text-[11px] rounded-md">
                Tự nhận
              </span>
            )}
          </div>

          {isGift && order.recipient_name ? (
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500 text-xs">Họ và tên người nhận:</span>
                <span className="font-bold text-slate-900">{order.recipient_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 text-xs">Số điện thoại:</span>
                <span className="font-semibold text-slate-800 font-mono text-xs">{order.recipient_phone || "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 text-xs">Email:</span>
                <span className="font-semibold text-slate-800 text-xs">{order.recipient_email || "—"}</span>
              </div>
            </div>
          ) : (
            <div className="py-4 text-center text-slate-500 text-xs space-y-1">
              <Icon name="check_circle" className="text-2xl text-slate-300 block mx-auto" />
              <p className="font-semibold text-slate-700">Người mua tự nhận voucher</p>
              <p className="text-[11px] text-slate-400">Voucher phát hành được lưu trực tiếp vào tài khoản người mua.</p>
            </div>
          )}
        </div>
      </div>

      {/* Khung 3: Bảng Dòng Sản Phẩm (`order_items`) */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/80 flex items-center justify-between">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            CHI TIẾT DÒNG SẢN PHẨM TRONG ĐƠN (ORDER_ITEMS)
          </div>
          <div className="text-xs font-semibold text-slate-600">
            Tổng thanh toán: <strong className="text-blue-700 text-sm ml-1">{formatCurrency(order.total_amount)}</strong>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/60 text-slate-500 text-xs font-bold uppercase tracking-wider border-b border-slate-200">
                <th className="py-3.5 px-6">CHƯƠNG TRÌNH VOUCHER</th>
                <th className="py-3.5 px-6">ĐỐI TÁC PHÁT HÀNH</th>
                <th className="py-3.5 px-6">ĐƠN GIÁ (UNIT_PRICE)</th>
                <th className="py-3.5 px-6">SỐ LƯỢNG</th>
                <th className="py-3.5 px-6 text-right">THÀNH TIỀN</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-base">
              {order.items.map((item) => {
                const unitPrice = Number(item.unit_price) || 0;
                const origPrice = Number(item.original_unit_price) || 0;
                const lineTotal = unitPrice * item.quantity;

                return (
                  <tr key={item.order_item_id} className="hover:bg-slate-50/60 transition">
                    <td className="py-4 px-6">
                      <div className="font-bold text-slate-900">{item.program_name}</div>
                      <div className="text-[11px] text-blue-600 font-mono mt-0.5">Mã CT: #{item.program_id}</div>
                    </td>
                    <td className="py-4 px-6 font-medium text-slate-800">{item.partner_name}</td>
                    <td className="py-4 px-6">
                      <div className="font-semibold text-slate-800">{formatCurrency(unitPrice)}</div>
                      {origPrice > unitPrice && (
                        <div className="text-[11px] text-slate-400 line-through">{formatCurrency(origPrice)}</div>
                      )}
                    </td>
                    <td className="py-4 px-6 font-bold text-slate-800">{item.quantity}</td>
                    <td className="py-4 px-6 text-right font-bold text-blue-700">
                      {formatCurrency(lineTotal)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Khung 4: Danh Sách Voucher Phát Hành */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/80 flex items-center justify-between">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            DANH SÁCH VOUCHER PHÁT HÀNH ({allVouchers.length} VOUCHER)
          </div>
        </div>

        {allVouchers.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            Chưa có voucher nào được phát hành cho đơn hàng này.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {allVouchers.map((v) => (
              <div
                key={v.issued_voucher_id}
                className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/50 transition"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm">{v.program_name}</span>
                    <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                      {v.partner_name}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 font-mono">
                    <span>
                      Mã Voucher: <strong className="text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded">{v.voucher_code}</strong>
                    </span>
                    {v.applicable_region && (
                      <span className="text-slate-500">Khu vực: {v.applicable_region}</span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Hạn sử dụng: {formatDateDisplay(v.expires_at)}
                    {v.used_at && (
                      <span className="text-blue-600 font-semibold ml-2">
                        • Đã dùng lúc: {formatDateDisplay(v.used_at)}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4">
                  <span className="font-bold text-slate-900 text-sm">
                    {formatCurrency(v.unit_price)}
                  </span>
                  <span
                    className={`px-3 py-1 font-semibold text-xs rounded-full border ${
                      v.usage_status === "UNUSED"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : v.usage_status === "USED"
                        ? "bg-blue-50 text-blue-700 border-blue-200"
                        : "bg-slate-100 text-slate-500 border-slate-200 line-through"
                    }`}
                  >
                    {v.usage_status === "UNUSED"
                      ? "Chưa sử dụng"
                      : v.usage_status === "USED"
                      ? "Đã sử dụng tại store"
                      : "Đã vô hiệu"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Action Footer: Nút Hủy Đơn Hàng (UC-ADM-10) */}
      <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-xs text-slate-500">
          Trạng thái đơn: <strong className="text-slate-800">{oBadge.label}</strong> | Thanh toán:{" "}
          <strong className="text-slate-800">{pBadge.label}</strong> | Phương thức:{" "}
          <strong className="text-slate-800">{order.payment_method}</strong>
        </div>

        {order.order_status !== "CANCELLED" && (
          <Button
            disabled={!isEligibleForCancellation()}
            onClick={() => {
              setModalError(null);
              setIsCancelModalOpen(true);
            }}
            className={`px-5 py-2.5 font-bold text-xs rounded-xl transition shadow-xs flex items-center gap-2 ${
              isEligibleForCancellation()
                ? "bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100"
                : "bg-slate-100 border border-slate-200 text-slate-400 cursor-not-allowed"
            }`}
            title={
              !isEligibleForCancellation()
                ? "Đơn hàng chứa voucher đã sử dụng, không thể hủy!"
                : "Hủy đơn hàng và hoàn tiền mô phỏng"
            }
          >
            <Icon name="cancel" className="text-base" />
            Hủy đơn hàng & Hoàn tiền mô phỏng
          </Button>
        )}
      </div>

      {/* Dialog con: Nhập lý do hủy đơn hàng (UC-ADM-10) */}
      {isCancelModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md p-6 space-y-4 animate-in fade-in zoom-in-95">
            <h4 className="font-bold text-slate-900 text-base">Xác nhận Hủy đơn hàng & Hoàn tiền</h4>
            <p className="text-xs text-slate-500">
              Vui lòng nhập lý do hủy đơn hàng <span className="font-bold text-slate-800">ORD-{order.order_id}</span> của khách hàng{" "}
              <span className="font-bold text-slate-800">{order.buyer_name}</span>.
            </p>

            {modalError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-medium">
                {modalError}
              </div>
            )}

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs space-y-1">
              <div className="font-bold">Lưu ý khi xác nhận hủy đơn:</div>
              <ul className="list-disc list-inside space-y-0.5 text-[11px] text-amber-800">
                <li>Ghi nhận hoàn tiền mô phỏng {formatCurrency(order.total_amount)}.</li>
                <li>Chuyển trạng thái toàn bộ voucher chưa dùng sang Đã vô hiệu.</li>
                <li>Lưu vết thao tác vào Nhật ký hệ thống.</li>
              </ul>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Lý do hủy đơn hàng (Lưu vào Nhật ký hệ thống)
              </label>
              <textarea
                rows={3}
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Ví dụ: Khách hàng đổi ý mua gói voucher khác, hoặc yêu cầu hủy trước giờ áp dụng..."
                className="w-full p-3 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setIsCancelModalOpen(false)}
                disabled={isCancelling}
                className="text-xs"
              >
                Hủy thao tác
              </Button>
              <Button
                onClick={handleConfirmCancelOrder}
                disabled={isCancelling || !cancelReason.trim()}
                className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-rose-600 transition-all"
              >
                {isCancelling ? "Đang xử lý..." : "Xác nhận Hủy & Hoàn tiền"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
