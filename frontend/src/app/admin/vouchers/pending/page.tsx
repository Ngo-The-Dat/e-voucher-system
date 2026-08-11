"use client";

import Icon from "@/components/shared/ui/Icon";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/shared/ui/Button";
import FormField from "@/components/shared/ui/FormField";
import StatusBadge from "@/components/shared/ui/StatusBadge";
import Pagination from "@/components/shared/ui/Pagination";

interface VoucherApprovalItem {
  requestId: string;
  programCode: string;
  programName: string;
  partnerName: string;
  taxCode: string;
  branchName: string;
  branchArea: string;
  originalPrice: number;
  salePrice: number;
  discountRate: number;
  issueQuantity: number;
  startDateSell: string;
  endDateSell: string;
  startDateUse: string;
  endDateUse: string;
  requestDate: string;
  requestTime: string;
  approvalStatus: "PENDING" | "APPROVED" | "REJECTED";
  displayStatus: "DRAFT" | "PENDING_APPROVAL" | "PUBLISHED" | "HIDDEN" | "ENDED";
  adminFeedback?: string;
}

export default function PendingVouchersPage() {
  const [currentPage, setCurrentPage] = useState(1);

  // Modal State
  const [selectedVoucher, setSelectedVoucher] = useState<VoucherApprovalItem | null>(null);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  const [vouchers, setVouchers] = useState<VoucherApprovalItem[]>([
    {
      requestId: "REQ-001",
      programCode: "VCH-HG-050",
      programName: "Voucher 50.000đ áp dụng toàn hệ thống Highlands Coffee",
      partnerName: "Công ty Cổ phần DV Cà Phê Cao Nguyên (Highlands)",
      taxCode: "0303725714",
      branchName: "Highlands Coffee - Chi nhánh Quận 1",
      branchArea: "TP. Hồ Chí Minh",
      originalPrice: 50000,
      salePrice: 35000,
      discountRate: 30,
      issueQuantity: 5000,
      startDateSell: "2026-08-05",
      endDateSell: "2026-09-05",
      startDateUse: "2026-08-05",
      endDateUse: "2026-09-30",
      requestDate: "03/08/2026",
      requestTime: "14:30",
      approvalStatus: "PENDING",
      displayStatus: "PENDING_APPROVAL",
    },
    {
      requestId: "REQ-002",
      programCode: "VCH-KC-200",
      programName: "Buffet Lẩu Băng Chuyền Kichi Kichi Ưu Đãi 20%",
      partnerName: "Công ty Cổ phần Thương mại Dịch vụ Cổng Vàng (Golden Gate)",
      taxCode: "0102721191",
      branchName: "Kichi Kichi - Vincom Đồng Khởi",
      branchArea: "TP. Hồ Chí Minh",
      originalPrice: 350000,
      salePrice: 280000,
      discountRate: 20,
      issueQuantity: 1200,
      startDateSell: "2026-08-10",
      endDateSell: "2026-08-30",
      startDateUse: "2026-08-10",
      endDateUse: "2026-09-15",
      requestDate: "02/08/2026",
      requestTime: "09:15",
      approvalStatus: "PENDING",
      displayStatus: "PENDING_APPROVAL",
    },
    {
      requestId: "REQ-003",
      programCode: "VCH-CGV-100",
      programName: "Vé Xem Phim 2D Cuối Tuần CGV Cinemas Tặng Popcorn",
      partnerName: "Công ty TNHH CJ CGV Việt Nam",
      taxCode: "0303675394",
      branchName: "CGV Sư Vạn Hạnh Mall",
      branchArea: "TP. Hồ Chí Minh",
      originalPrice: 120000,
      salePrice: 79000,
      discountRate: 34,
      issueQuantity: 3000,
      startDateSell: "2026-08-08",
      endDateSell: "2026-08-31",
      startDateUse: "2026-08-08",
      endDateUse: "2026-09-30",
      requestDate: "04/08/2026",
      requestTime: "11:20",
      approvalStatus: "PENDING",
      displayStatus: "PENDING_APPROVAL",
    },
    {
      requestId: "REQ-004",
      programCode: "VCH-ERR-001",
      programName: "Chiến dịch ưu đãi sai quy định (Cảnh báo sai giá bán)",
      partnerName: "Đối tác Thử Nghiệm Alpha",
      taxCode: "0319998881",
      branchName: "Chi nhánh Trung Tâm",
      branchArea: "Hà Nội",
      originalPrice: 100000,
      salePrice: 120000,
      discountRate: -20,
      issueQuantity: 500,
      startDateSell: "2026-08-01",
      endDateSell: "2026-08-20",
      startDateUse: "2026-08-01",
      endDateUse: "2026-08-20",
      requestDate: "01/08/2026",
      requestTime: "16:45",
      approvalStatus: "PENDING",
      displayStatus: "PENDING_APPROVAL",
    },
  ]);

  // Chỉ hiển thị các voucher ở trạng thái CHỜ XÉT DUYỆT (PENDING)
  const pendingVouchers = vouchers.filter((item) => item.approvalStatus === "PENDING");

  const formatCurrency = (val: number) => {
    return val.toLocaleString("vi-VN") + " ₫";
  };

  const formatDateString = (dateStr: string) => {
    if (!dateStr) return "";
    const parts = dateStr.split("-");
    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
    return dateStr;
  };

  const getDisplayStatusText = (status: string) => {
    switch (status) {
      case "PENDING_APPROVAL":
        return "Chờ duyệt";
      case "PUBLISHED":
        return "Đang bán";
      case "HIDDEN":
        return "Tạm ngưng";
      case "ENDED":
        return "Ngừng bán";
      case "DRAFT":
      default:
        return "Bản nháp";
    }
  };

  // Phê duyệt Voucher
  const handleApprove = (voucher: VoucherApprovalItem) => {
    setVouchers((prev) =>
      prev.map((item) =>
        item.requestId === voucher.requestId
          ? {
            ...item,
            approvalStatus: "APPROVED",
            displayStatus: "PUBLISHED",
          }
          : item
      )
    );
    setSelectedVoucher(null);
    alert(`Đã phê duyệt thành công Voucher [${voucher.programName}]. Hệ thống đã ghi nhận nhật ký.`);
  };

  // Từ chối Voucher
  const handleConfirmReject = () => {
    if (!selectedVoucher) return;
    if (!rejectReason.trim()) {
      alert("Vui lòng nhập lý do từ chối duyệt voucher!");
      return;
    }

    setVouchers((prev) =>
      prev.map((item) =>
        item.requestId === selectedVoucher.requestId
          ? {
            ...item,
            approvalStatus: "REJECTED",
            displayStatus: "DRAFT",
            adminFeedback: rejectReason,
          }
          : item
      )
    );
    setIsRejectModalOpen(false);
    setSelectedVoucher(null);
    setRejectReason("");
    alert(`Đã từ chối duyệt Voucher [${selectedVoucher.programName}] và gửi phản hồi đến đối tác.`);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Navigation Bar */}
      <div className="border-b border-slate-200 pb-1">
        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <span>VOUCHER</span>
          <span>&rsaquo;</span>
          <span className="text-slate-600">Duyệt voucher</span>
        </div>
        <div className="flex items-center gap-8">
          <Link
            href="/admin/vouchers/pending"
            className="pb-3 text-lg font-bold transition-all relative flex items-center gap-2.5 text-slate-900 border-b-2 border-blue-600"
          >
            <span>Duyệt voucher</span>
            <span className="px-2.5 py-0.5 bg-blue-100 text-blue-700 text-xs font-bold rounded-full">
              {pendingVouchers.length} chờ duyệt
            </span>
          </Link>
          <Link
            href="/admin/vouchers/manage"
            className="pb-3 text-lg font-bold transition-all relative flex items-center gap-2.5 text-slate-400 hover:text-slate-700"
          >
            <span>Quản lý voucher</span>
          </Link>
        </div>
      </div>

      {/* Bảng Danh Sách các Voucher CHỜ XÉT DUYỆT (Đã bỏ bộ lọc) */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 text-slate-500 text-xs font-bold uppercase tracking-wider border-b border-slate-200/80">
                <th className="py-4 px-5">CHƯƠNG TRÌNH VOUCHER</th>
                <th className="py-4 px-5">ĐỐI TÁC & CHI NHÁNH</th>
                <th className="py-4 px-5">GIÁ BÁN / GIÁ GỐC</th>
                <th className="py-4 px-5">SỐ LƯỢNG</th>
                <th className="py-4 px-5">TRẠNG THÁI</th>
                <th className="py-4 px-5 text-right">THAO TÁC</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-base">
              {pendingVouchers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 font-medium">
                    <Icon name="task_alt" className="text-4xl block mb-2 text-slate-300" />
                    Hiện tại không có voucher nào đang chờ xét duyệt.
                  </td>
                </tr>
              ) : (
                pendingVouchers.map((item) => {
                  const isViolationPrice = item.salePrice >= item.originalPrice;
                  return (
                    <tr key={item.requestId} className="hover:bg-slate-50/60 transition">
                      <td className="py-4 px-5 max-w-xs">
                        <div className="font-bold text-slate-900 leading-snug line-clamp-2">
                          {item.programName}
                        </div>
                        {isViolationPrice && (
                          <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 bg-rose-50 border border-rose-200 text-rose-700 text-[10px] font-bold rounded-md">
                            ⚠️ Cảnh báo: Giá bán ≥ Giá gốc
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-5">
                        <div className="font-bold text-slate-800 text-xs">{item.partnerName}</div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          {item.branchName} ({item.branchArea})
                        </div>
                      </td>
                      <td className="py-4 px-5">
                        <div className="font-bold text-blue-700">{formatCurrency(item.salePrice)}</div>
                        <div className="text-xs text-slate-400 line-through">
                          {formatCurrency(item.originalPrice)}
                        </div>
                      </td>
                      <td className="py-4 px-5 font-semibold text-slate-800">
                        {item.issueQuantity.toLocaleString("vi-VN")} lượt
                      </td>
                      <td className="py-4 px-5">
                        <StatusBadge status="pending" label="Chờ xét duyệt" />
                      </td>
                      <td className="py-4 px-5 text-right">
                        <Button
                          variant="outline"
                          onClick={() => setSelectedVoucher(item)}
                          className="px-3.5 py-1.5 bg-blue-50 border-blue-200 text-blue-600 hover:bg-blue-600 hover:text-white text-xs h-auto"
                        >
                          Xem & Duyệt
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer & Phân trang */}
        <Pagination
          currentPage={currentPage}
          totalPages={Math.ceil(pendingVouchers.length / 10) || 1}
          totalItems={pendingVouchers.length}
          itemsPerPage={10}
          onPageChange={setCurrentPage}
          itemName="hồ sơ chờ duyệt"
        />
      </div>

      {/* Modal Chi Tiết & Duyệt Voucher */}
      {selectedVoucher && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
              <div>
                <h3 className="font-bold text-slate-900 text-lg">Chi tiết Yêu cầu Duyệt Voucher</h3>
                <p className="text-xs text-slate-500">Mã chương trình: {selectedVoucher.programCode}</p>
              </div>
              <Button
                variant="ghost"
                onClick={() => setSelectedVoucher(null)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <Icon name="close" />
              </Button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-5 text-sm">
              {/* Cảnh báo tự động nếu giá bán >= giá gốc */}
              {selectedVoucher.salePrice >= selectedVoucher.originalPrice && (
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 space-y-1">
                  <div className="font-bold flex items-center gap-1.5 text-rose-900">
                    <Icon name="warning" className="text-lg" />
                    Cảnh báo Quy tắc Nghiệp vụ
                  </div>
                  <p className="text-xs">
                    Giá bán ({formatCurrency(selectedVoucher.salePrice)}) lớn hơn hoặc bằng Giá gốc (
                    {formatCurrency(selectedVoucher.originalPrice)}). Vui lòng yêu cầu đối tác chỉnh sửa lại.
                  </p>
                </div>
              )}

              {/* Nhóm Thông tin Chương trình */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  THÔNG TIN CHƯƠNG TRÌNH VOUCHER
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-xs text-slate-500 block">Mã chương trình</span>
                    <span className="font-bold text-slate-900 font-mono text-xs">
                      {selectedVoucher.programCode}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 block">Trạng thái hiển thị</span>
                    <span className="font-bold text-blue-600 text-xs">
                      {getDisplayStatusText(selectedVoucher.displayStatus)}
                    </span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-xs text-slate-500 block">Tên chương trình</span>
                    <span className="font-bold text-slate-900 text-base">
                      {selectedVoucher.programName}
                    </span>
                  </div>
                </div>
              </div>

              {/* Nhóm Thông tin Đối tác & Chi nhánh */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  THÔNG TIN ĐỐI TÁC & CHI NHÁNH ÁP DỤNG
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-xs text-slate-500 block">Tên doanh nghiệp</span>
                    <span className="font-bold text-slate-800">{selectedVoucher.partnerName}</span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 block">Mã số thuế</span>
                    <span className="font-bold text-slate-800 font-mono">{selectedVoucher.taxCode}</span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 block">Chi nhánh áp dụng</span>
                    <span className="font-semibold text-slate-800">{selectedVoucher.branchName}</span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 block">Khu vực</span>
                    <span className="font-semibold text-slate-800">{selectedVoucher.branchArea}</span>
                  </div>
                </div>
              </div>

              {/* Nhóm Giá & Số lượng */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100">
                  <span className="text-xs text-slate-500 block">Giá gốc</span>
                  <span className="font-bold text-slate-700 text-base">
                    {formatCurrency(selectedVoucher.originalPrice)}
                  </span>
                </div>
                <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-100">
                  <span className="text-xs text-slate-500 block">Giá bán</span>
                  <span className="font-bold text-emerald-700 text-base">
                    {formatCurrency(selectedVoucher.salePrice)}
                  </span>
                </div>
                <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-100">
                  <span className="text-xs text-slate-500 block">Số lượng phát hành</span>
                  <span className="font-bold text-amber-800 text-base">
                    {selectedVoucher.issueQuantity.toLocaleString("vi-VN")} lượt
                  </span>
                </div>
              </div>

              {/* Nhóm Thời gian Bán & Sử dụng */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  THỜI GIAN ÁP DỤNG
                </div>
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-slate-500 block">Thời gian phát hành/bán:</span>
                    <span className="font-bold text-slate-800">
                      {formatDateString(selectedVoucher.startDateSell)} đến{" "}
                      {formatDateString(selectedVoucher.endDateSell)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Thời gian sử dụng:</span>
                    <span className="font-bold text-slate-800">
                      {formatDateString(selectedVoucher.startDateUse)} đến{" "}
                      {formatDateString(selectedVoucher.endDateUse)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Phản hồi cũ nếu bị từ chối */}
              {selectedVoucher.adminFeedback && (
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl">
                  <span className="text-xs font-bold text-rose-800 block mb-1">
                    Phản hồi từ Admin (Lý do từ chối):
                  </span>
                  <p className="text-xs text-rose-900 font-medium">{selectedVoucher.adminFeedback}</p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-3">
              <Button
                variant="outline"
                onClick={() => setSelectedVoucher(null)}
              >
                Đóng
              </Button>
              {selectedVoucher.approvalStatus === "PENDING" && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setIsRejectModalOpen(true)}
                    className="bg-rose-50 border-rose-200 text-rose-600 hover:bg-rose-600 hover:text-white"
                  >
                    Từ chối duyệt
                  </Button>
                  <Button
                    onClick={() => handleApprove(selectedVoucher)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    Phê duyệt công bố bán
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Dialog con: Nhập lý do từ chối */}
      {isRejectModalOpen && selectedVoucher && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md p-6 space-y-4">
            <h4 className="font-bold text-slate-900 text-base">Từ chối duyệt Voucher</h4>
            <p className="text-xs text-slate-500">
              Vui lòng nhập phản hồi / lý do từ chối để hệ thống thông báo cho đối tác{" "}
              <span className="font-bold text-slate-800">{selectedVoucher.partnerName}</span>.
            </p>
            <div>
              <FormField label="Lý do từ chối (Lưu vào Nhật ký & Yêu cầu duyệt)">
                <textarea
                  rows={4}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Ví dụ: Giá bán lớn hơn giá gốc, hoặc thông tin thời gian không chính xác..."
                  className="w-full p-3 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
                />
              </FormField>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setIsRejectModalOpen(false)}
              >
                Hủy bỏ
              </Button>
              <Button
                onClick={handleConfirmReject}
                className="bg-rose-600 hover:bg-rose-700 text-white"
              >
                Xác nhận từ chối
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
