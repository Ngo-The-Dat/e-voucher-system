"use client";

import Icon from "@/components/shared/ui/Icon";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

export default function PendingPartnerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const partnerId = (params?.id as string) || "MER-901";

  const [status, setStatus] = useState<"Chờ duyệt" | "Đã duyệt" | "Từ chối">("Chờ duyệt");
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [revisionModalOpen, setRevisionModalOpen] = useState(false);
  const [revisionNote, setRevisionNote] = useState("");

  const partnerInfo = {
    id: partnerId,
    companyName: partnerId === "MER-904" ? "Highlands Coffee (Nhượng quyền)" : "Công ty TNHH Dịch vụ Spa Sen Vàng",
    taxId: "0102123456",
    businessType: "Công ty TNHH Hai Thành Viên Trở Lên",
    registrationDate: "01/08/2026",
    address: "Tầng 5, Tòa nhà Lotte Center, 54 Liễu Giai, Ba Đình, Hà Nội",
    representative: {
      name: "Nguyễn Thị Sen",
      email: "sen.nguyen@senvangspa.vn",
      phone: "0987 654 321",
      gender: "Nữ",
      nationality: "Việt Nam",
    },
    documents: [
      { name: "Giấy chứng nhận Đăng ký kinh doanh.pdf", size: "2.4 MB", type: "PDF" },
      { name: "CCCD Người đại diện pháp luật.png", size: "1.1 MB", type: "Image" },
      { name: "Giấy chứng nhận An toàn VSTP.pdf", size: "3.8 MB", type: "PDF" },
    ],
    branches: [
      {
        code: "CN-SV-01",
        name: "Spa Sen Vàng - Liễu Giai",
        address: "54 Liễu Giai, Cống Vị, Ba Đình, Hà Nội",
        region: "Hà Nội",
        status: "Chờ duyệt",
      },
      {
        code: "CN-SV-02",
        name: "Spa Sen Vàng - Nguyễn Trãi",
        address: "234 Nguyễn Trãi, Thanh Xuân, Hà Nội",
        region: "Hà Nội",
        status: "Chờ duyệt",
      },
    ],
  };

  const handleApprove = () => {
    setStatus("Đã duyệt");
    setToastMessage("Hồ sơ đối tác đã được phê duyệt thành công! Đối tác đã được chuyển sang danh sách Quản lý đối tác.");
  };

  const handleConfirmReject = () => {
    if (!rejectionReason.trim()) return;
    setStatus("Từ chối");
    setRejectModalOpen(false);
    setToastMessage(`Đã từ chối hồ sơ đối tác với lý do: "${rejectionReason}"`);
  };

  const handleConfirmRevision = () => {
    if (!revisionNote.trim()) return;
    setRevisionModalOpen(false);
    setToastMessage(`Đã gửi yêu cầu bổ sung thông tin đến người đại diện: "${revisionNote}"`);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-sm font-semibold flex items-center justify-between shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <Icon name="check_circle" className="text-emerald-600 text-xl" />
            <span>{toastMessage}</span>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className="text-emerald-500 hover:text-emerald-700 transition"
          >
            <Icon name="close" className="text-lg" />
          </button>
        </div>
      )}

      {/* Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Link href="/admin/partners/pending" className="hover:text-blue-600 transition">
              ĐỐI TÁC
            </Link>
            <span>&rsaquo;</span>
            <Link href="/admin/partners/pending" className="hover:text-blue-600 transition">
              DUYỆT HỒ SƠ ĐỐI TÁC
            </Link>
            <span>&rsaquo;</span>
            <span className="text-slate-600">CHI TIẾT HỒ SƠ</span>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              {partnerInfo.companyName}
            </h1>
            <span
              className={`px-3 py-1 font-bold text-xs rounded-full inline-flex items-center gap-1.5 ${
                status === "Chờ duyệt"
                  ? "bg-amber-50 text-amber-600 border border-amber-200/70"
                  : status === "Đã duyệt"
                    ? "bg-emerald-50 text-emerald-600 border border-emerald-200/70"
                    : "bg-rose-50 text-rose-600 border border-rose-200/70"
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  status === "Chờ duyệt"
                    ? "bg-amber-500"
                    : status === "Đã duyệt"
                      ? "bg-emerald-500"
                      : "bg-rose-500"
                }`}
              />
              {status}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5">
          <Link
            href="/admin/partners/pending"
            className="px-4 py-2 border border-slate-200 bg-white text-slate-700 font-semibold text-xs rounded-xl hover:bg-slate-50 transition shadow-2xs"
          >
            Quay lại
          </Link>
          {status === "Chờ duyệt" && (
            <>
              <button
                type="button"
                onClick={() => setRevisionModalOpen(true)}
                className="px-4 py-2 border border-slate-200 bg-white text-slate-700 font-semibold text-xs rounded-xl hover:bg-slate-50 hover:border-slate-300 transition shadow-2xs"
              >
                Yêu cầu bổ sung
              </button>
              <button
                type="button"
                onClick={() => setRejectModalOpen(true)}
                className="px-4 py-2 border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100 font-semibold text-xs rounded-xl transition shadow-2xs"
              >
                Từ chối hồ sơ
              </button>
              <button
                type="button"
                onClick={handleApprove}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition shadow-sm flex items-center gap-1.5"
              >
                <Icon name="check" className="text-base" />
                Phê duyệt hồ sơ
              </button>
            </>
          )}
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Thông tin doanh nghiệp */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <Icon name="storefront" className="text-blue-600" />
              Thông tin đăng ký doanh nghiệp
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <span className="block text-slate-400 font-bold uppercase tracking-wider mb-1">
                  Tên doanh nghiệp
                </span>
                <span className="font-bold text-slate-900 text-sm">{partnerInfo.companyName}</span>
              </div>
              <div>
                <span className="block text-slate-400 font-bold uppercase tracking-wider mb-1">
                  Mã số thuế
                </span>
                <span className="font-bold text-slate-900 text-sm">{partnerInfo.taxId}</span>
              </div>
              <div>
                <span className="block text-slate-400 font-bold uppercase tracking-wider mb-1">
                  Ngày đăng ký
                </span>
                <span className="font-semibold text-slate-800 text-sm">{partnerInfo.registrationDate}</span>
              </div>
            </div>
          </div>

          {/* Hồ sơ & Giấy phép đính kèm */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <Icon name="folder_open" className="text-blue-600" />
              Giấy phép & Hồ sơ nộp kèm
            </h2>
            <div className="space-y-2.5">
              {partnerInfo.documents.map((doc, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200/80 rounded-xl hover:border-blue-200 hover:bg-blue-50/20 transition group"
                >
                  <div className="flex items-center gap-3">
                    <Icon name={doc.type === "PDF" ? "picture_as_pdf" : "image"} className="text-blue-500 text-2xl" />
                    <div>
                      <div className="font-bold text-xs text-slate-800 group-hover:text-blue-600 transition">
                        {doc.name}
                      </div>
                      <div className="text-[11px] text-slate-400 font-medium">{doc.size}</div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => alert(`Đang mở tập tin: ${doc.name}`)}
                    className="px-3 py-1 bg-white border border-slate-200 text-slate-700 font-semibold text-xs rounded-lg hover:bg-blue-50 hover:text-blue-600 transition shadow-2xs"
                  >
                    Xem tài liệu
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Danh sách chi nhánh đăng ký */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Icon name="location_on" className="text-blue-600" />
                Danh sách chi nhánh nộp duyệt ({partnerInfo.branches.length})
              </h2>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-200/70">
                    <th className="py-3 px-4">MÃ CHI NHÁNH</th>
                    <th className="py-3 px-4">TÊN CHI NHÁNH</th>
                    <th className="py-3 px-4">ĐỊA CHỈ</th>
                    <th className="py-3 px-4">KHU VỰC</th>
                    <th className="py-3 px-4">TRẠNG THÁI</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {partnerInfo.branches.map((b, i) => (
                    <tr key={i} className="hover:bg-slate-50/60 transition">
                      <td className="py-3 px-4 font-mono font-bold text-slate-800">{b.code}</td>
                      <td className="py-3 px-4 font-bold text-slate-900">{b.name}</td>
                      <td className="py-3 px-4 text-slate-700">{b.address}</td>
                      <td className="py-3 px-4 font-semibold text-slate-700">{b.region}</td>
                      <td className="py-3 px-4">
                        <span className="px-2.5 py-0.5 font-bold text-[11px] rounded-full bg-amber-50 text-amber-700 border border-amber-200 inline-flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                          {b.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column (1 Col) */}
        <div className="space-y-6">
          {/* Thông tin đại diện */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <Icon name="person" className="text-blue-600" />
              Người đại diện pháp luật
            </h2>
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-700 font-bold text-lg flex items-center justify-center shrink-0">
                NS
              </div>
              <div>
                <div className="font-bold text-slate-900 text-sm">
                  {partnerInfo.representative.name}
                </div>
                <div className="text-xs text-slate-400 font-medium">
                  {partnerInfo.representative.email}
                </div>
              </div>
            </div>
            <div className="space-y-2.5 pt-2 border-t border-slate-100 text-xs">
              <div>
                <span className="block text-slate-400 font-bold uppercase tracking-wider">
                  Họ và tên
                </span>
                <span className="font-semibold text-slate-800">
                  {partnerInfo.representative.name}
                </span>
              </div>
              <div>
                <span className="block text-slate-400 font-bold uppercase tracking-wider">
                  Email
                </span>
                <span className="font-semibold text-slate-800">
                  {partnerInfo.representative.email}
                </span>
              </div>
              <div>
                <span className="block text-slate-400 font-bold uppercase tracking-wider">
                  Số điện thoại
                </span>
                <span className="font-semibold text-slate-800">
                  {partnerInfo.representative.phone}
                </span>
              </div>
              <div>
                <span className="block text-slate-400 font-bold uppercase tracking-wider">
                  Giới tính
                </span>
                <span className="font-semibold text-slate-800">
                  {partnerInfo.representative.gender}
                </span>
              </div>
              <div>
                <span className="block text-slate-400 font-bold uppercase tracking-wider">
                  Quốc tịch
                </span>
                <span className="font-semibold text-slate-800">
                  {partnerInfo.representative.nationality}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Từ chối */}
      {rejectModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
                <Icon name="warning" className="text-rose-500" />
                Từ chối hồ sơ đối tác
              </h3>
              <button
                onClick={() => setRejectModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <Icon name="close" />
              </button>
            </div>
            <p className="text-xs text-slate-500">
              Vui lòng nhập lý do từ chối để hệ thống phản hồi chính xác tới người đại diện doanh nghiệp.
            </p>
            <textarea
              rows={3}
              placeholder="Nhập lý do từ chối..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:border-rose-500 focus:ring-1 focus:ring-rose-500 outline-none transition"
            />
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setRejectModalOpen(false)}
                className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                disabled={!rejectionReason.trim()}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition"
              >
                Xác nhận từ chối
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Yêu cầu bổ sung */}
      {revisionModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
                <Icon name="edit_note" className="text-amber-500" />
                Yêu cầu bổ sung hồ sơ
              </h3>
              <button
                onClick={() => setRevisionModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <Icon name="close" />
              </button>
            </div>
            <p className="text-xs text-slate-500">
              Ghi rõ các chứng từ hoặc thông tin doanh nghiệp cần cung cấp thêm.
            </p>
            <textarea
              rows={3}
              placeholder="Ví dụ: Vui lòng bổ sung bản scan Giấy phép An toàn vệ sinh thực phẩm có công chứng..."
              value={revisionNote}
              onChange={(e) => setRevisionNote(e.target.value)}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition"
            />
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setRevisionModalOpen(false)}
                className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmRevision}
                disabled={!revisionNote.trim()}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition"
              >
                Gửi yêu cầu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
