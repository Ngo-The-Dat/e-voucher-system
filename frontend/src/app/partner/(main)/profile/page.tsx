"use client";

import { useState } from "react";
import TopAppBar from "@/components/partner/layout/TopAppBar";
import Icon from "@/components/shared/ui/Icon";
import StatusBadge from "@/components/shared/ui/StatusBadge";
import Toast from "@/components/shared/ui/Toast";
import ValidationErrorBanner from "@/components/shared/ui/ValidationErrorBanner";
import BranchModal from "@/components/partner/profile/BranchModal";
import LegalInfoSection from "@/components/partner/profile/LegalInfoSection";
import RepresentativeSection from "@/components/partner/profile/RepresentativeSection";
import BranchesSection from "@/components/partner/profile/BranchesSection";
import { PartnerProfile, ProfileFormErrors, Branch } from "@/lib/types/profile";
import { useProfile } from "@/hooks/useProfile";
import { useProfileValidation } from "@/hooks/useProfileValidation";

const TABS = [
  { id: "all", label: "Tất cả thông tin hồ sơ", icon: "assignment" },
  { id: "legal", label: "Thông tin pháp lý & Mã số thuế", icon: "gavel" },
  { id: "rep", label: "Người đại diện", icon: "badge" },
  { id: "branch", label: "Danh sách chi nhánh", icon: "location_city" },
];

export default function ProfilePage() {
  const { profile, isLoading, setProfile, reload, save } = useProfile();
  const { validate } = useProfileValidation();

  const [activeTab, setActiveTab] = useState("all");
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [errors, setErrors] = useState<ProfileFormErrors>({});
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Branch Modal State
  const [isBranchModalOpen, setIsBranchModalOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);

  if (isLoading || !profile) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 bg-background min-h-screen">
        <div className="flex items-center gap-3 text-on-surface-variant font-medium text-lg">
          <Icon name="progress_activity" className="animate-spin text-primary" />
          <span>Đang tải thông tin hồ sơ đối tác...</span>
        </div>
      </div>
    );
  }

  // --- Change handlers ---
  const handleLegalChange = (field: keyof PartnerProfile["legalInfo"], value: string) => {
    setProfile((prev) =>
      prev ? { ...prev, legalInfo: { ...prev.legalInfo, [field]: value } } : prev
    );
    setHasUnsavedChanges(true);
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const handleRepChange = (field: keyof PartnerProfile["representativeInfo"], value: string) => {
    setProfile((prev) =>
      prev ? { ...prev, representativeInfo: { ...prev.representativeInfo, [field]: value } } : prev
    );
    setHasUnsavedChanges(true);
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  // --- Validation moved to useProfileValidation hook ---

  // --- Submit / Reset ---
  const handleSaveProfile = () => {
    const newErrors = validate(profile);
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    save(profile);
    setHasUnsavedChanges(false);
    setErrors({});
    setToastMessage("Cập nhật thành công!");
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleResetProfile = () => {
    reload();
    setHasUnsavedChanges(false);
    setErrors({});
  };

  // --- Branch actions ---
  const handleSaveBranch = (branch: Branch) => {
    setProfile((prev) => {
      if (!prev) return prev;
      const idx = prev.branches.findIndex((b) => b.id === branch.id);
      const updated = [...prev.branches];
      if (idx >= 0) updated[idx] = branch;
      else updated.push(branch);
      return { ...prev, branches: updated };
    });
    setHasUnsavedChanges(true);
  };

  const handleDeleteBranch = (id: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa chi nhánh này?")) return;
    setProfile((prev) =>
      prev ? { ...prev, branches: prev.branches.filter((b) => b.id !== id) } : prev
    );
    setHasUnsavedChanges(true);
  };

  const handleToggleBranchStatus = (id: string) => {
    setProfile((prev) =>
      prev
        ? {
            ...prev,
            branches: prev.branches.map((b) =>
              b.id === id
                ? { ...b, status: b.status === "active" ? "inactive" : "active" }
                : b
            ),
          }
        : prev
    );
    setHasUnsavedChanges(true);
  };

  const errorCount = Object.keys(errors).length;

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-background min-h-screen relative pb-28 w-full">
      <TopAppBar title="Quản lý hồ sơ đối tác" />

      <Toast message={toastMessage} />

      <main className="p-6 md:p-8 flex-1 overflow-y-auto w-full max-w-none space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-outline-variant/40 pb-4">
          <div>
            <h2 className="text-2xl font-bold text-on-surface mb-1">Quản lý hồ sơ đối tác</h2>
            <p className="text-base text-on-surface-variant">
              Xem và chỉnh sửa các nhóm thông tin: Thông tin pháp lý, Người đại diện và Danh sách chi nhánh.
            </p>
          </div>
          <StatusBadge status="running" label="Hồ sơ đã sẵn sàng" />
        </div>

        <ValidationErrorBanner errorCount={errorCount} submitLabel="Xác nhận" />

        {/* Tabs */}
        <div className="border-b border-outline-variant">
          <ul className="flex flex-wrap -mb-px text-base font-semibold gap-6">
            {TABS.map((tab) => {
              const isSelected = activeTab === tab.id;
              return (
                <li key={tab.id}>
                  <button
                    onClick={() => setActiveTab(tab.id)}
                    className={`inline-flex items-center gap-2 pb-3.5 pt-1 border-b-2 font-semibold transition-colors ${
                      isSelected
                        ? "border-primary text-primary font-bold"
                        : "border-transparent text-on-surface-variant hover:text-on-surface hover:border-outline-variant"
                    }`}
                  >
                    <Icon name={tab.icon} className="text-[20px]" />
                    <span>{tab.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Sections */}
        <div className="space-y-8">
          {(activeTab === "all" || activeTab === "legal") && (
            <LegalInfoSection
              legalInfo={profile.legalInfo}
              errors={errors}
              onChange={handleLegalChange}
            />
          )}

          {(activeTab === "all" || activeTab === "rep") && (
            <RepresentativeSection
              repInfo={profile.representativeInfo}
              errors={errors}
              onChange={handleRepChange}
            />
          )}

          {(activeTab === "all" || activeTab === "branch") && (
            <BranchesSection
              branches={profile.branches}
              onAdd={() => { setEditingBranch(null); setIsBranchModalOpen(true); }}
              onEdit={(b) => { setEditingBranch(b); setIsBranchModalOpen(true); }}
              onDelete={handleDeleteBranch}
              onToggleStatus={handleToggleBranchStatus}
            />
          )}
        </div>
      </main>

      {/* Branch Modal */}
      <BranchModal
        isOpen={isBranchModalOpen}
        onClose={() => setIsBranchModalOpen(false)}
        onSave={handleSaveBranch}
        editingBranch={editingBranch}
      />

      {/* Sticky Save Bar */}
      {hasUnsavedChanges && (
        <div className="fixed bottom-0 right-0 left-0 md:left-64 bg-surface-bright/95 backdrop-blur-md border-t border-outline-variant px-8 py-4 z-40 flex justify-between items-center shadow-2xl">
          <div className="flex items-center gap-3 text-base">
            <span className="w-3 h-3 rounded-full bg-tertiary-amber animate-pulse" />
            <span className="font-semibold text-on-surface">Bạn có thông tin thay đổi chưa lưu.</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleResetProfile}
              className="text-base px-5 py-2.5 font-semibold text-on-surface-variant hover:bg-surface-container-high rounded-xl transition-colors"
            >
              Hủy thay đổi
            </button>
            <button
              type="button"
              onClick={handleSaveProfile}
              className="text-base font-bold px-7 py-2.5 bg-primary text-on-primary rounded-xl hover:bg-surface-tint shadow-md hover:shadow-lg transition-all flex items-center gap-2"
            >
              <Icon name="check_circle" className="text-[20px]" />
              <span>Xác nhận</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
