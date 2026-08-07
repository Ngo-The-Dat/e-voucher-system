"use client";

import Icon from "@/components/admin/Icon";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { MOCK_ORDERS, OrderData } from "../data";

export default function OrderDetailPage() {
  const params = useParams();
  const orderId = (params?.id as string) || "ORD-8801";

  // Tìm dữ liệu đơn hàng theo ID
  const initialOrder = MOCK_ORDERS.find((o) => o.orderId === orderId) || MOCK_ORDERS[0];
  const [order, setOrder] = useState<OrderData>(initialOrder);

  // Dialog State
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");

  const formatCurrency = (val: number) => {
    return val.toLocaleString("vi-VN") + " ₫";
  };

  const getOrderStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return { label: "Chờ xử lý", class: "bg-amber-50 text-amber-700 border-amber-200" };
      case "CONFIRMED":
        return { label: "Đã xác nhận", class: "bg-blue-50 text-blue-700 border-blue-200" };
      case "COMPLETED":
        return { label: "Hoàn thành", class: "bg-emerald-50 text-emerald-700 border-emerald-200" };
      case "CANCELLED":
        return { label: "Đã hủy", class: "bg-rose-50 text-rose-700 border-rose-200" };
      default:
        return { label: status, class: "bg-slate-100 text-slate-700 border-slate-200" };
    }
  };

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case "UNPAID":
        return { label: "Chưa thanh toán", class: "bg-amber-50 text-amber-700 border-amber-200" };
      case "PAID":
        return { label: "Đã thanh toán", class: "bg-emerald-50 text-emerald-700 border-emerald-200" };
      case "FAILED":
        return { label: "Thanh toán thất bại", class: "bg-rose-50 text-rose-700 border-rose-200" };
      case "REFUNDED":
        return { label: "Đã hoàn tiền", class: "bg-purple-50 text-purple-700 border-purple-200" };
      default:
        return { label: status, class: "bg-slate-100 text-slate-700 border-slate-200" };
    }
  };

  // Kiểm tra chính sách hủy đơn hàng (RB-14 / UC-ADM-10 Luồng A1)
  const isEligibleForCancellation = () => {
    if (order.orderStatus === "CANCELLED") return false;
    // Nếu có voucher nào trong đơn đã sử dụng (USED) -> Không đủ điều kiện hủy
    const hasUsedVoucher = order.vouchers.some((v) => v.status === "USED");
    return !hasUsedVoucher;
  };

  // Thực hiện Hủy đơn hàng và hoàn tiền mô phỏng (UC-ADM-10)
  const handleConfirmCancelOrder = () => {
    if (!cancelReason.trim()) {
      alert("Vui lòng nhập lý do hủy đơn hàng!");
      return;
    }

    const nowStr =
      new Date().toLocaleDateString("vi-VN") +
      " " +
      new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });

    setOrder((prev) => ({
      ...prev,
      orderStatus: "CANCELLED",
      paymentStatus: "REFUNDED",
      cancelReason: cancelReason,
      cancelledAt: nowStr,
      // RB-13: Chuyển các voucher chưa dùng sang trạng thái Đã vô hiệu
      vouchers: prev.vouchers.map((v) => ({
        ...v,
        status: v.status === "UNUSED" ? "INVALIDATED" : v.status,
      })),
    }));

    setIsCancelModalOpen(false);
    setCancelReason("");
    alert(
      `Đã hủy đơn hàng [${order.orderId}] thành công. Hệ thống đã ghi nhận hoàn tiền mô phỏng và vô hiệu hóa các voucher phát hành.`
    );
  };

  const oBadge = getOrderStatusBadge(order.orderStatus);
  const pBadge = getPaymentStatusBadge(order.paymentStatus);

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
              <span className="text-slate-600">Chi tiết đơn hàng {order.orderId}</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
              <span>Đơn hàng {order.orderId}</span>
              <span className={`px-3 py-1 font-semibold text-xs rounded-full border ${oBadge.class}`}>
                {oBadge.label}
              </span>
              <span className={`px-3 py-1 font-semibold text-xs rounded-full border ${pBadge.class}`}>
                {pBadge.label}
              </span>
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

      {/* Cảnh báo Không đủ điều kiện Hủy (RB-14 / Luồng A1 UC-ADM-10) */}
      {order.vouchers.some((v) => v.status === "USED") && order.orderStatus !== "CANCELLED" && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 space-y-1">
          <div className="font-bold flex items-center gap-1.5 text-rose-900">
            <Icon name="block" className="text-lg" />
            Không đủ điều kiện hủy đơn hàng (Quy tắc RB-14)
          </div>
          <p className="text-xs">
            Đơn hàng có chứa voucher đã được khách hàng sử dụng tại cửa hàng đối tác. Hệ thống không thể thực hiện hủy đơn hoặc hoàn tiền.
          </p>
        </div>
      )}

      {/* Thông tin Hủy đơn (Nếu đơn đã hủy) */}
      {order.orderStatus === "CANCELLED" && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl space-y-1">
          <div className="font-bold text-xs text-rose-900 flex items-center gap-1.5">
            <Icon name="cancel" className="text-base" />
            Thông tin Hủy đơn & Hoàn tiền mô phỏng
          </div>
          <p className="text-xs text-rose-800">
            <span className="font-semibold">Lý do hủy:</span> {order.cancelReason || "Không có lý do"}
          </p>
          {order.cancelledAt && (
            <p className="text-[11px] text-rose-600 font-medium">Thời gian hủy: {order.cancelledAt}</p>
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
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500 text-xs">Họ và tên:</span>
              <span className="font-bold text-slate-900">{order.buyerName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 text-xs">Số điện thoại:</span>
              <span className="font-semibold text-slate-800 font-mono text-xs">{order.buyerPhone}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 text-xs">Email:</span>
              <span className="font-semibold text-slate-800 text-xs">{order.buyerEmail}</span>
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
            {order.isGift ? (
              <span className="px-2.5 py-0.5 bg-purple-50 text-purple-700 font-bold text-[11px] rounded-md border border-purple-200">
                🎁 Mua tặng quà
              </span>
            ) : (
              <span className="px-2.5 py-0.5 bg-slate-100 text-slate-600 font-semibold text-[11px] rounded-md">
                Tự nhận
              </span>
            )}
          </div>

          {order.isGift && order.recipientName ? (
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500 text-xs">Họ và tên người nhận:</span>
                <span className="font-bold text-slate-900">{order.recipientName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 text-xs">Số điện thoại:</span>
                <span className="font-semibold text-slate-800 font-mono text-xs">{order.recipientPhone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 text-xs">Email:</span>
                <span className="font-semibold text-slate-800 text-xs">{order.recipientEmail}</span>
              </div>
            </div>
          ) : (
            <div className="py-4 text-center text-slate-500 text-xs space-y-1">
              <Icon name="check_circle" className="text-2xl text-slate-300 block" />
              <p className="font-semibold text-slate-700">Người mua tự nhận voucher</p>
              <p className="text-[11px] text-slate-400">Người mua & Người nhận thông tin trùng khớp nhau.</p>
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
            Tổng thanh toán: <strong className="text-blue-700 text-sm ml-1">{formatCurrency(order.totalAmount)}</strong>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/60 text-slate-500 text-xs font-bold uppercase tracking-wider border-b border-slate-200">
                <th className="py-3.5 px-6">CHƯƠNG TRÌNH VOUCHER</th>
                <th className="py-3.5 px-6">ĐỐI TÁC PHÁT HÀNH</th>
                <th className="py-3.5 px-6">ĐƠN GIÁ (UNIT_PRICE)</th>
                <th className="py-3.5 px-6">SỐ LƯỢNG (QUANTITY)</th>
                <th className="py-3.5 px-6 text-right">THÀNH TIỀN (LINE_TOTAL)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {order.orderItems.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-50/60 transition">
                  <td className="py-4 px-6">
                    <div className="font-bold text-slate-900">{item.programTitle}</div>
                    <div className="text-[11px] text-blue-600 font-mono mt-0.5">{item.programId}</div>
                  </td>
                  <td className="py-4 px-6 font-medium text-slate-800">{item.merchantName}</td>
                  <td className="py-4 px-6 font-semibold text-slate-800">{formatCurrency(item.unitPrice)}</td>
                  <td className="py-4 px-6 font-bold text-slate-800">{item.quantity}</td>
                  <td className="py-4 px-6 text-right font-bold text-blue-700">
                    {formatCurrency(item.lineTotal)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Khung 4: Danh Sách Voucher Phát Hành */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/80 flex items-center justify-between">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            DANH SÁCH VOUCHER PHÁT HÀNH ({order.vouchers.length} VOUCHER)
          </div>
        </div>

        <div className="divide-y divide-slate-100">
          {order.vouchers.map((v, idx) => (
            <div key={idx} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/50 transition">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 text-sm">{v.voucherTitle}</span>
                  <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                    {v.merchantName}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-xs text-slate-600 font-mono">
                  <span>Mã voucher PH: <strong className="text-slate-800">{v.voucherCode}</strong></span>
                  <span>Mã QR: <strong className="text-slate-800">{v.qrCode}</strong></span>
                </div>
                <div className="text-[11px] text-slate-400">
                  Hạn sử dụng: {v.expiryDate}
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-4">
                <span className="font-bold text-slate-900 text-sm">
                  {formatCurrency(v.price)}
                </span>
                <span
                  className={`px-3 py-1 font-semibold text-xs rounded-full border ${
                    v.status === "UNUSED"
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : v.status === "USED"
                      ? "bg-blue-50 text-blue-700 border-blue-200"
                      : "bg-slate-100 text-slate-500 border-slate-200 line-through"
                  }`}
                >
                  {v.status === "UNUSED"
                    ? "Chưa sử dụng"
                    : v.status === "USED"
                    ? "Đã sử dụng tại store"
                    : "Đã vô hiệu"}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Action Footer: Nút Hủy Đơn Hàng (UC-ADM-10) */}
      <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between gap-4">
        <div className="text-xs text-slate-500">
          Trạng thái hiện tại: <strong className="text-slate-800">{oBadge.label}</strong> | Thanh toán: <strong className="text-slate-800">{pBadge.label}</strong>
        </div>

        {order.orderStatus !== "CANCELLED" && (
          <button
            disabled={!isEligibleForCancellation()}
            onClick={() => setIsCancelModalOpen(true)}
            className={`px-5 py-2.5 font-bold text-xs rounded-xl transition shadow-xs flex items-center gap-2 ${
              isEligibleForCancellation()
                ? "bg-rose-600 hover:bg-rose-700 text-white"
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
          </button>
        )}
      </div>

      {/* Dialog con: Nhập lý do hủy đơn hàng (UC-ADM-10) */}
      {isCancelModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md p-6 space-y-4">
            <h4 className="font-bold text-slate-900 text-base">Xác nhận Hủy đơn hàng & Hoàn tiền</h4>
            <p className="text-xs text-slate-500">
              Vui lòng nhập lý do hủy đơn hàng <span className="font-bold text-slate-800">{order.orderId}</span> của khách hàng{" "}
              <span className="font-bold text-slate-800">{order.buyerName}</span>.
            </p>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs space-y-1">
              <div className="font-bold">Lưu ý khi xác nhận hủy đơn:</div>
              <ul className="list-disc list-inside space-y-0.5 text-[11px] text-amber-800">
                <li>Ghi nhận hoàn tiền mô phỏng {formatCurrency(order.totalAmount)}.</li>
                <li>Chuyển trạng thái toàn bộ voucher chưa dùng sang Đã vô hiệu (RB-13).</li>
                <li>Lưu vết thao tác vào Nhật ký hệ thống.</li>
              </ul>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Lý do hủy đơn hàng (Lưu vào Nhật ký hệ thống)
              </label>
              <textarea
                rows={4}
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Ví dụ: Khách hàng đổi ý mua gói voucher khác, hoặc yêu cầu hủy trước giờ áp dụng..."
                className="w-full p-3 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setIsCancelModalOpen(false)}
                className="px-4 py-2 bg-white border border-slate-200 text-slate-600 font-semibold text-xs rounded-xl hover:bg-slate-50 transition"
              >
                Hủy thao tác
              </button>
              <button
                onClick={handleConfirmCancelOrder}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl transition shadow-xs"
              >
                Xác nhận Hủy & Hoàn tiền
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
