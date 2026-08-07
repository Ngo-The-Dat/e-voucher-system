"use client";

import Icon from "@/components/admin/Icon";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

interface Branch {
  code: string;
  name: string;
  address: string;
  region: string;
  status: "Hoạt động" | "Tạm ngưng";
}

interface PartnerDetailData {
  id: string;
  companyName: string;
  taxId: string;
  registrationDate: string;
  status: "Đang hoạt động" | "Tạm khóa";
  representative: {
    name: string;
    email: string;
    phone: string;
    gender: string;
    nationality: string;
  };
  branches: Branch[];
}

const partnerDataMap: Record<string, PartnerDetailData> = {
  "MER-910": {
    id: "MER-910",
    companyName: "Trung tâm Fitness California",
    taxId: "0108889990",
    registrationDate: "10/07/2026",
    status: "Tạm khóa",
    representative: {
      name: "Lê Văn Tiến",
      email: "tien.le@cali.vn",
      phone: "0903 111 222",
      gender: "Nam",
      nationality: "Việt Nam",
    },
    branches: [
      {
        code: "CN-CALI-01",
        name: "California Fitness - Landmark 81",
        address: "720A Điện Biên Phủ, Q. Bình Thạnh, TP.HCM",
        region: "TP. Hồ Chí Minh",
        status: "Tạm ngưng",
      },
      {
        code: "CN-CALI-02",
        name: "California Fitness - Royal City",
        address: "72A Nguyễn Trãi, Thanh Xuân, Hà Nội",
        region: "Hà Nội",
        status: "Tạm ngưng",
      },
    ],
  },
  "MER-907": {
    id: "MER-907",
    companyName: "Siêu thị WinMart+",
    taxId: "0109988776",
    registrationDate: "15/07/2026",
    status: "Đang hoạt động",
    representative: {
      name: "Đỗ Anh Tuấn",
      email: "tuan.do@winmart.vn",
      phone: "0909 888 777",
      gender: "Nam",
      nationality: "Việt Nam",
    },
    branches: [
      {
        code: "CN-WM-01",
        name: "WinMart+ - Cầu Giấy",
        address: "123 Cầu Giấy, Quan Hoa, Cầu Giấy, Hà Nội",
        region: "Hà Nội",
        status: "Hoạt động",
      },
    ],
  },
  "MER-903": {
    id: "MER-903",
    companyName: "Tập đoàn Ẩm thực Golden Gate",
    taxId: "0101239876",
    registrationDate: "30/07/2026",
    status: "Đang hoạt động",
    representative: {
      name: "Trần Minh Đức",
      email: "duc.tran@ggg.com.vn",
      phone: "0912 345 678",
      gender: "Nam",
      nationality: "Việt Nam",
    },
    branches: [
      {
        code: "CN-GG-01",
        name: "Golden Gate - Vincom Ba Triệu",
        address: "191 Bà Triệu, Lê Đại Hành, Hai Bà Trưng, Hà Nội",
        region: "Hà Nội",
        status: "Hoạt động",
      },
      {
        code: "CN-GG-02",
        name: "Golden Gate - Royal City",
        address: "B2-R3 72A Nguyễn Trãi, Thượng Đình, Thanh Xuân, Hà Nội",
        region: "Hà Nội",
        status: "Hoạt động",
      },
      {
        code: "CN-GG-03",
        name: "Golden Gate - Aeon Mall Hà Đông",
        address: "Tầng 2 Aeon Mall, Dương Nội, Hà Đông, Hà Nội",
        region: "Hà Nội",
        status: "Hoạt động",
      },
    ],
  },
};

export default function ManagePartnerDetailPage() {
  const params = useParams();
  const partnerId = (params?.id as string) || "MER-903";

  const partnerInfo = partnerDataMap[partnerId] || {
    id: partnerId,
    companyName: "Đối tác thương mại " + partnerId,
    taxId: "0101239876",
    registrationDate: "30/07/2026",
    status: "Đang hoạt động" as const,
    representative: {
      name: "Trần Minh Đức",
      email: "duc.tran@ggg.com.vn",
      phone: "0912 345 678",
      gender: "Nam",
      nationality: "Việt Nam",
    },
    branches: [],
  };

  const [partnerStatus, setPartnerStatus] = useState<"Đang hoạt động" | "Tạm khóa">(
    partnerInfo.status
  );
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Lock Modal State
  const [lockModalOpen, setLockModalOpen] = useState(false);
  const [lockReason, setLockReason] = useState("");

  // Branch Management State
  const [branches, setBranches] = useState<Branch[]>(partnerInfo.branches);

  // Branch Modal States (Add / Edit)
  const [branchModalOpen, setBranchModalOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [branchForm, setBranchForm] = useState<Branch>({
    code: "",
    name: "",
    address: "",
    region: "Hà Nội",
    status: "Hoạt động",
  });

  // Delete Branch State
  const [deleteBranchCode, setDeleteBranchCode] = useState<string | null>(null);

  // Toggle Lock/Unlock Handlers
  const handleConfirmLockToggle = () => {
    if (partnerStatus === "Đang hoạt động") {
      setPartnerStatus("Tạm khóa");
      setToastMessage(
        `Đã khóa tài khoản đối tác. Lý do: "${lockReason || "Theo chính sách quản lý đối tác"}"`
      );
    } else {
      setPartnerStatus("Đang hoạt động");
      setToastMessage(
        "Đã mở khóa tài khoản đối tác. Đối tác hiện đã có thể hoạt động bình thường."
      );
    }
    setLockModalOpen(false);
    setLockReason("");
  };

  // Branch Add / Edit Openers
  const handleOpenAddBranch = () => {
    setEditingBranch(null);
    setBranchForm({
      code: `CN-00${branches.length + 1}`,
      name: "",
      address: "",
      region: "Hà Nội",
      status: "Hoạt động",
    });
    setBranchModalOpen(true);
  };

  const handleOpenEditBranch = (branch: Branch) => {
    setEditingBranch(branch);
    setBranchForm({ ...branch });
    setBranchModalOpen(true);
  };

  // Save Branch Handler
  const handleSaveBranch = () => {
    if (!branchForm.code.trim() || !branchForm.name.trim() || !branchForm.address.trim()) return;

    if (editingBranch) {
      setBranches((prev) =>
        prev.map((b) => (b.code === editingBranch.code ? { ...branchForm } : b))
      );
      setToastMessage(`Đã cập nhật thông tin chi nhánh "${branchForm.name}"`);
    } else {
      setBranches((prev) => [...prev, { ...branchForm }]);
      setToastMessage(`Đã thêm chi nhánh mới "${branchForm.name}" thành công!`);
    }

    setBranchModalOpen(false);
  };

  // Delete Branch Handler
  const handleConfirmDeleteBranch = () => {
    if (!deleteBranchCode) return;
    const branchToDelete = branches.find((b) => b.code === deleteBranchCode);
    setBranches((prev) => prev.filter((b) => b.code !== deleteBranchCode));
    setToastMessage(`Đã xóa chi nhánh "${branchToDelete?.name || deleteBranchCode}"`);
    setDeleteBranchCode(null);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl text-white text-sm font-semibold flex items-center justify-between shadow-lg animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <Icon name="info" className="text-emerald-400 text-xl" />
            <span>{toastMessage}</span>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className="text-slate-400 hover:text-white transition"
          >
            <Icon name="close" className="text-lg" />
          </button>
        </div>
      )}

      {/* Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Link href="/admin/partners/manage" className="hover:text-blue-600 transition">
              ĐỐI TÁC
            </Link>
            <span>&rsaquo;</span>
            <Link href="/admin/partners/manage" className="hover:text-blue-600 transition">
              QUẢN LÝ ĐỐI TÁC
            </Link>
            <span>&rsaquo;</span>
            <span className="text-slate-600">CHI TIẾT ĐỐI TÁC</span>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              {partnerInfo.companyName}
            </h1>
            <span
              className={`px-3 py-1 font-bold text-xs rounded-full inline-flex items-center gap-1.5 ${
                partnerStatus === "Đang hoạt động"
                  ? "bg-emerald-50 text-emerald-600 border border-emerald-200/70"
                  : "bg-rose-50 text-rose-600 border border-rose-200/70"
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  partnerStatus === "Đang hoạt động" ? "bg-emerald-500" : "bg-rose-500"
                }`}
              />
              {partnerStatus}
            </span>
          </div>
        </div>

        {/* Lock / Unlock Admin Button */}
        <div className="flex items-center gap-2.5">
          <Link
            href="/admin/partners/manage"
            className="px-4 py-2 border border-slate-200 bg-white text-slate-700 font-semibold text-xs rounded-xl hover:bg-slate-50 transition shadow-2xs"
          >
            Quay lại
          </Link>
          <button
            type="button"
            onClick={() => setLockModalOpen(true)}
            className={`px-4 py-2 font-bold text-xs rounded-xl transition shadow-sm flex items-center gap-1.5 text-white ${
              partnerStatus === "Đang hoạt động"
                ? "bg-rose-600 hover:bg-rose-700"
                : "bg-emerald-600 hover:bg-emerald-700"
            }`}
          >
            <Icon name={partnerStatus === "Đang hoạt động" ? "lock" : "lock_open"} className="text-base" />
            {partnerStatus === "Đang hoạt động" ? "Tạm khóa" : "Mở khóa"}
          </button>
        </div>
      </div>

      {/* Grid Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Business Info & Branch Management */}
        <div className="lg:col-span-2 space-y-6">
          {/* Business Info */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <Icon name="domain" className="text-blue-600" />
              Thông tin chung doanh nghiệp
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <span className="block text-slate-400 font-bold uppercase tracking-wider mb-1">
                  Mã đối tác
                </span>
                <span className="font-bold text-slate-900 text-sm">{partnerInfo.id}</span>
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
                <span className="font-semibold text-slate-700">{partnerInfo.registrationDate}</span>
              </div>
              <div>
                <span className="block text-slate-400 font-bold uppercase tracking-wider mb-1">
                  Tổng số chi nhánh
                </span>
                <span className="font-bold text-blue-600">{branches.length} chi nhánh</span>
              </div>
            </div>
          </div>

          {/* Section: Điều chỉnh & Quản lý Chi nhánh theo ERD */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Icon name="store" className="text-blue-600" />
                  Danh sách chi nhánh ({branches.length})
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Quản lý thông tin chi nhánh: Mã chi nhánh, Tên chi nhánh, Địa chỉ, Khu vực, Trạng thái.
                </p>
              </div>
              <button
                type="button"
                onClick={handleOpenAddBranch}
                className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition shadow-2xs flex items-center gap-1.5 shrink-0"
              >
                <Icon name="add" className="text-base" />
                Thêm chi nhánh
              </button>
            </div>

            {/* Branches Table matching ERD */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-200/70">
                    <th className="py-3 px-4">MÃ CHI NHÁNH</th>
                    <th className="py-3 px-4">TÊN CHI NHÁNH</th>
                    <th className="py-3 px-4">ĐỊA CHỈ</th>
                    <th className="py-3 px-4">KHU VỰC</th>
                    <th className="py-3 px-4">TRẠNG THÁI</th>
                    <th className="py-3 px-4 text-right">THAO TÁC</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {branches.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">
                        Chưa có chi nhánh nào. Nhấp "Thêm chi nhánh" để khởi tạo.
                      </td>
                    </tr>
                  ) : (
                    branches.map((b) => (
                      <tr key={b.code} className="hover:bg-slate-50/60 transition">
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-800">{b.code}</td>
                        <td className="py-3.5 px-4 font-bold text-slate-900">{b.name}</td>
                        <td className="py-3.5 px-4 text-slate-700">{b.address}</td>
                        <td className="py-3.5 px-4 font-semibold text-slate-700">{b.region}</td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2.5 py-0.5 font-bold text-[11px] rounded-full inline-flex items-center gap-1 ${
                              b.status === "Hoạt động"
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : "bg-rose-50 text-rose-700 border border-rose-200"
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                b.status === "Hoạt động" ? "bg-emerald-500" : "bg-rose-500"
                              }`}
                            />
                            {b.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleOpenEditBranch(b)}
                              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg transition"
                            >
                              Sửa
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteBranchCode(b.code)}
                              className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 font-semibold rounded-lg transition"
                            >
                              Xóa
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column (1 Col): Representative Info */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <Icon name="badge" className="text-blue-600" />
              Người đại diện quản lý
            </h2>
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-full bg-blue-600 text-white font-bold text-lg flex items-center justify-center shrink-0">
                {partnerInfo.representative.name.substring(0, 2).toUpperCase()}
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

      {/* Modal Khóa / Mở khóa Đối tác */}
      {lockModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
                <Icon name={partnerStatus === "Đang hoạt động" ? "lock" : "lock_open"} className={`${ partnerStatus === "Đang hoạt động" ? "text-rose-500" : "text-emerald-500" }`} />
                {partnerStatus === "Đang hoạt động"
                  ? "Xác nhận tạm khóa đối tác"
                  : "Xác nhận mở khóa đối tác"}
              </h3>
              <button
                onClick={() => setLockModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <Icon name="close" />
              </button>
            </div>
            <p className="text-xs text-slate-500">
              {partnerStatus === "Đang hoạt động"
                ? "Khi bị khóa, đối tác này và tất cả các chi nhánh sẽ tạm thời không thể phát sinh giao dịch mới trên hệ thống."
                : "Đối tác sẽ quay trở lại trạng thái Đang hoạt động và tiếp tục kinh doanh bình thường."}
            </p>
            {partnerStatus === "Đang hoạt động" && (
              <textarea
                rows={3}
                placeholder="Nhập lý do khóa tài khoản đối tác..."
                value={lockReason}
                onChange={(e) => setLockReason(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:border-rose-500 focus:ring-1 focus:ring-rose-500 outline-none transition"
              />
            )}
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setLockModalOpen(false)}
                className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmLockToggle}
                className={`px-4 py-2 font-bold text-xs rounded-xl transition text-white ${
                  partnerStatus === "Đang hoạt động"
                    ? "bg-rose-600 hover:bg-rose-700"
                    : "bg-emerald-600 hover:bg-emerald-700"
                }`}
              >
                {partnerStatus === "Đang hoạt động" ? "Khóa ngay" : "Mở khóa ngay"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Thêm / Sửa Chi nhánh chuẩn theo ERD */}
      {branchModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Icon name="store" className="text-blue-600" />
                {editingBranch ? "Chỉnh sửa thông tin chi nhánh" : "Thêm chi nhánh mới"}
              </h3>
              <button
                onClick={() => setBranchModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <Icon name="close" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Mã chi nhánh *</label>
                  <input
                    type="text"
                    placeholder="e.g. CN-001..."
                    value={branchForm.code}
                    disabled={Boolean(editingBranch)}
                    onChange={(e) => setBranchForm({ ...branchForm, code: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-mono font-bold focus:bg-white focus:border-blue-500 outline-none transition disabled:opacity-60"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Khu vực *</label>
                  <select
                    value={branchForm.region}
                    onChange={(e) => setBranchForm({ ...branchForm, region: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium focus:bg-white focus:border-blue-500 outline-none transition"
                  >
                    <option value="Hà Nội">Hà Nội</option>
                    <option value="TP. Hồ Chí Minh">TP. Hồ Chí Minh</option>
                    <option value="Đà Nẵng">Đà Nẵng</option>
                    <option value="Hải Phòng">Hải Phòng</option>
                    <option value="Cần Thơ">Cần Thơ</option>
                    <option value="Miền Bắc">Miền Bắc</option>
                    <option value="Miền Trung">Miền Trung</option>
                    <option value="Miền Nam">Miền Nam</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-600 mb-1">Tên chi nhánh *</label>
                <input
                  type="text"
                  placeholder="e.g. Golden Gate - Vincom Ba Triệu..."
                  value={branchForm.name}
                  onChange={(e) => setBranchForm({ ...branchForm, name: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium focus:bg-white focus:border-blue-500 outline-none transition"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-600 mb-1">Địa chỉ chi nhánh *</label>
                <input
                  type="text"
                  placeholder="e.g. 191 Bà Triệu, Lê Đại Hành, Hai Bà Trưng, Hà Nội..."
                  value={branchForm.address}
                  onChange={(e) => setBranchForm({ ...branchForm, address: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium focus:bg-white focus:border-blue-500 outline-none transition"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-600 mb-1">Trạng thái *</label>
                <select
                  value={branchForm.status}
                  onChange={(e) =>
                    setBranchForm({
                      ...branchForm,
                      status: e.target.value as "Hoạt động" | "Tạm ngưng",
                    })
                  }
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium focus:bg-white focus:border-blue-500 outline-none transition"
                >
                  <option value="Hoạt động">Hoạt động</option>
                  <option value="Tạm ngưng">Tạm ngưng</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setBranchModalOpen(false)}
                className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleSaveBranch}
                disabled={!branchForm.code.trim() || !branchForm.name.trim() || !branchForm.address.trim()}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition"
              >
                {editingBranch ? "Lưu thay đổi" : "Thêm ngay"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Xóa Chi nhánh */}
      {deleteBranchCode && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-center gap-3">
              <Icon name="delete" className="text-rose-500 text-3xl" />
              <div>
                <h3 className="font-bold text-slate-900 text-base">Xác nhận xóa chi nhánh</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Hành động này sẽ loại bỏ chi nhánh (Mã: {deleteBranchCode}) khỏi hệ thống.
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setDeleteBranchCode(null)}
                className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteBranch}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl transition"
              >
                Xóa chi nhánh
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
