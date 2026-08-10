"use client";

import { useState, useEffect } from "react";
import { Branch } from "@/lib/types/profile";
import Icon from "@/components/shared/ui/Icon";

interface BranchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (branch: Branch) => void;
  editingBranch: Branch | null;
}

export default function BranchModal({
  isOpen,
  onClose,
  onSave,
  editingBranch,
}: BranchModalProps) {
  const [name, setName] = useState("");
  const [region, setRegion] = useState("Miền Nam");
  const [address, setAddress] = useState("");
  const [status, setStatus] = useState<"active" | "inactive">("active");
  const [errors, setErrors] = useState<{ name?: string; region?: string; address?: string }>({});

  useEffect(() => {
    if (editingBranch) {
      setName(editingBranch.name);
      setRegion(editingBranch.region || "Miền Nam");
      setAddress(editingBranch.address);
      setStatus(editingBranch.status);
    } else {
      setName("");
      setRegion("Miền Nam");
      setAddress("");
      setStatus("active");
    }
    setErrors({});
  }, [editingBranch, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { name?: string; region?: string; address?: string } = {};

    if (!name.trim()) {
      newErrors.name = "Vui lòng nhập tên chi nhánh.";
    }
    if (!region.trim()) {
      newErrors.region = "Vui lòng chọn hoặc nhập khu vực.";
    }
    if (!address.trim()) {
      newErrors.address = "Vui lòng nhập địa chỉ chi nhánh.";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSave({
      id: editingBranch ? editingBranch.id : `br-${Date.now()}`,
      name: name.trim(),
      region: region.trim(),
      address: address.trim(),
      status,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
      <div className="bg-surface-bright rounded-2xl border border-outline-variant shadow-2xl w-full max-w-lg overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-outline-variant/40 flex justify-between items-center bg-surface-container-low">
          <h3 className="text-xl font-bold text-on-surface flex items-center gap-2">
            <Icon name="location_city" className="text-primary" />
            {editingBranch ? "Chỉnh sửa chi nhánh" : "Thêm chi nhánh mới"}
          </h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high transition-colors"
          >
            <Icon name="close" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-base">
          {/* Tên chi nhánh */}
          <div>
            <label className="block font-semibold text-on-surface mb-1">
              Tên chi nhánh <span className="text-error">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }));
              }}
              placeholder="VD: Highlands Nguyễn Du"
              className={`w-full border rounded-lg px-4 py-2.5 text-on-surface outline-none transition-colors ${
                errors.name
                  ? "border-error focus:ring-2 focus:ring-error/30 bg-error-container/10"
                  : "border-outline-variant focus:ring-2 focus:ring-primary"
              }`}
            />
            {errors.name && (
              <p className="text-sm text-error font-medium mt-1 flex items-center gap-1">
                <Icon name="error" className="text-sm" /> {errors.name}
              </p>
            )}
          </div>

          {/* Khu vực */}
          <div>
            <label className="block font-semibold text-on-surface mb-1">
              Khu vực <span className="text-error">*</span>
            </label>
            <select
              value={region}
              onChange={(e) => {
                setRegion(e.target.value);
                if (errors.region) setErrors((prev) => ({ ...prev, region: undefined }));
              }}
              className={`w-full border rounded-lg px-4 py-2.5 text-on-surface outline-none transition-colors ${
                errors.region
                  ? "border-error focus:ring-2 focus:ring-error/30 bg-error-container/10"
                  : "border-outline-variant focus:ring-2 focus:ring-primary"
              }`}
            >
              <option value="Miền Nam">Miền Nam</option>
              <option value="Miền Bắc">Miền Bắc</option>
              <option value="Miền Trung">Miền Trung</option>
              <option value="Tây Nguyên">Tây Nguyên</option>
              <option value="Quốc tế / Khác">Quốc tế / Khác</option>
            </select>
            {errors.region && (
              <p className="text-sm text-error font-medium mt-1 flex items-center gap-1">
                <Icon name="error" className="text-sm" /> {errors.region}
              </p>
            )}
          </div>

          {/* Địa chỉ */}
          <div>
            <label className="block font-semibold text-on-surface mb-1">
              Địa chỉ chi nhánh <span className="text-error">*</span>
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => {
                setAddress(e.target.value);
                if (errors.address) setErrors((prev) => ({ ...prev, address: undefined }));
              }}
              placeholder="VD: 135 Nguyễn Du, Quận 1, TP.HCM"
              className={`w-full border rounded-lg px-4 py-2.5 text-on-surface outline-none transition-colors ${
                errors.address
                  ? "border-error focus:ring-2 focus:ring-error/30 bg-error-container/10"
                  : "border-outline-variant focus:ring-2 focus:ring-primary"
              }`}
            />
            {errors.address && (
              <p className="text-sm text-error font-medium mt-1 flex items-center gap-1">
                <Icon name="error" className="text-sm" /> {errors.address}
              </p>
            )}
          </div>

          {/* Trạng thái */}
          <div>
            <label className="block font-semibold text-on-surface mb-1">Trạng thái hoạt động</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as "active" | "inactive")}
              className="w-full border border-outline-variant rounded-lg px-4 py-2.5 text-on-surface focus:ring-2 focus:ring-primary outline-none"
            >
              <option value="active">Hoạt động</option>
              <option value="inactive">Tạm dừng hoạt động</option>
            </select>
          </div>

          {/* Actions */}
          <div className="pt-4 border-t border-outline-variant/40 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-on-surface-variant hover:bg-surface-container-high rounded-lg font-medium transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-primary text-on-primary font-bold rounded-lg hover:bg-surface-tint shadow-sm transition-colors"
            >
              {editingBranch ? "Lưu thay đổi" : "Thêm mới"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
