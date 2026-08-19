/**
 * @file CreateEmployeeModal.tsx
 * @description Modal form hỗ trợ Đối tác chủ quản tạo mới tài khoản Nhân viên chi nhánh:
 * - Thu thập thông tin cá nhân (họ tên, email, SĐT, CCCD, giới tính, quốc tịch).
 * - Chọn chi nhánh làm việc (chỉ hiển thị các chi nhánh `status === 'active'`).
 * - Nhập mật khẩu khởi tạo (tối thiểu 8 ký tự).
 * - Gọi API `partnerApi.createEmployee`, xử lý hiển thị lỗi và kích hoạt callback `onSuccess` khi tạo thành công.
 */

"use client";

import { useEffect, useState } from "react";
import Icon from "@/components/shared/ui/Icon";
import { Branch } from "@/lib/types/partner-profile";
import { partnerApi } from "@/lib/partner-api";

/** Props truyền vào modal tạo nhân viên */
interface CreateEmployeeModalProps {
  isOpen: boolean;           // Trạng thái mở/đóng modal
  onClose: () => void;       // Hàm đóng modal
  onSuccess: () => void;     // Callback sau khi tạo thành công (để tải lại danh sách)
  branches: Branch[];        // Danh sách các chi nhánh của đối tác
}

export default function CreateEmployeeModal({
  isOpen,
  onClose,
  onSuccess,
  branches,
}: CreateEmployeeModalProps) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [identityNo, setIdentityNo] = useState("");
  const [gender, setGender] = useState("MALE");
  const [nationality, setNationality] = useState("Việt Nam");
  const [branchId, setBranchId] = useState<string>("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Chỉ cho phép gán nhân viên vào các chi nhánh đang hoạt động
  const activeBranches = branches.filter((b) => b.status === "active");

  // Reset form về trạng thái ban đầu mỗi khi mở modal
  useEffect(() => {
    if (isOpen) {
      setFullName("");
      setEmail("");
      setPhone("");
      setIdentityNo("");
      setGender("MALE");
      setNationality("Việt Nam");
      setBranchId(activeBranches.length > 0 ? activeBranches[0].id : "");
      setPassword("");
      setError("");
    }
  }, [isOpen, branches]);

  if (!isOpen) return null;

  /**
   * Xử lý submit form tạo nhân viên
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!fullName.trim() || !email.trim() || !password || !branchId) {
      setError("Vui lòng điền đầy đủ họ tên, email, mật khẩu và chọn chi nhánh.");
      return;
    }

    if (password.length < 8) {
      setError("Mật khẩu phải có ít nhất 8 ký tự.");
      return;
    }

    setIsSubmitting(true);
    try {
      await partnerApi.createEmployee({
        full_name: fullName.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
        identity_no: identityNo.trim() || undefined,
        gender,
        nationality,
        branch_id: Number(branchId),
        password,
      });
      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể tạo tài khoản nhân viên.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn">
      <div className="bg-surface border border-outline-variant rounded-2xl w-full max-w-lg shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header Modal */}
        <div className="px-6 py-4 border-b border-outline-variant/50 flex items-center justify-between bg-surface-bright">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold">
              <Icon name="person_add" className="text-lg" />
            </div>
            <h3 className="font-bold text-lg text-on-surface">Thêm nhân viên mới</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-surface-container-high flex items-center justify-center text-on-surface-variant transition-colors"
          >
            <Icon name="close" className="text-xl" />
          </button>
        </div>

        {/* Thân Form nhập thông tin */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          {error && (
            <div className="p-3 rounded-xl bg-error/10 border border-error/20 text-error text-xs font-medium flex items-center gap-2">
              <Icon name="error" className="text-base shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="text-xs font-semibold text-on-surface block mb-1">
              Họ và tên nhân viên *
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="VD: Nguyễn Văn A"
              required
              className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl px-3.5 py-2.5 text-sm text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-on-surface block mb-1">
                Email đăng nhập *
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nhanvien@example.com"
                required
                className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl px-3.5 py-2.5 text-sm text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-on-surface block mb-1">
                Số điện thoại
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="VD: 0901234567"
                className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl px-3.5 py-2.5 text-sm text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-on-surface block mb-1">
                Số CCCD / CMND
              </label>
              <input
                type="text"
                value={identityNo}
                onChange={(e) => setIdentityNo(e.target.value)}
                placeholder="12 chữ số"
                className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl px-3.5 py-2.5 text-sm text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-on-surface block mb-1">
                Giới tính
              </label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl px-3.5 py-2.5 text-sm text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              >
                <option value="MALE">Nam</option>
                <option value="FEMALE">Nữ</option>
                <option value="OTHER">Khác</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-on-surface block mb-1">
              Chi nhánh phân công *
            </label>
            {activeBranches.length > 0 ? (
              <select
                value={branchId}
                onChange={(e) => setBranchId(e.target.value)}
                required
                className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl px-3.5 py-2.5 text-sm text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary font-medium"
              >
                {activeBranches.map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name} ({branch.address})
                  </option>
                ))}
              </select>
            ) : (
              <p className="text-xs text-error font-medium p-2 bg-error/10 rounded-lg">
                Chưa có chi nhánh nào đang hoạt động. Vui lòng tạo chi nhánh trước.
              </p>
            )}
          </div>

          <div>
            <label className="text-xs font-semibold text-on-surface block mb-1">
              Mật khẩu khởi tạo * (tối thiểu 8 ký tự)
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={8}
              className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl px-3.5 py-2.5 text-sm text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* Nút hành động */}
          <div className="pt-4 border-t border-outline-variant/40 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-outline-variant text-sm font-semibold text-on-surface hover:bg-surface-container-high transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting || activeBranches.length === 0}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-on-primary text-sm font-bold hover:opacity-95 disabled:opacity-50 transition-opacity shadow-sm"
            >
              {isSubmitting && <Icon name="progress_activity" className="animate-spin text-base" />}
              <span>Tạo tài khoản</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
