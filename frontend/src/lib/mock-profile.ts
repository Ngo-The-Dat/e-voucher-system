import { PartnerProfile } from "./types/profile";

export const initialPartnerProfile: PartnerProfile = {
  legalInfo: {
    taxId: "0312345678",
    businessLicenseNo: "0312345678-001",
    issueDate: "2018-05-12",
    issuePlace: "Sở Kế hoạch và Đầu tư TP. Hồ Chí Minh",
    verificationStatus: "verified",
  },
  representativeInfo: {
    fullName: "Nguyễn Văn An",
    title: "Tổng Giám Đốc",
    identityNo: "079199012345",
    phone: "0901234567",
    email: "nguyenvanan@highlandscoffee.com.vn",
  },
  branches: [
    {
      id: "br-01",
      name: "Highlands Nguyễn Du",
      region: "Miền Nam",
      address: "135 Nguyễn Du, Quận 1, TP.HCM",
      phone: "028 3822 1234",
      status: "active",
    },
    {
      id: "br-02",
      name: "Highlands Võ Văn Tần",
      region: "Miền Nam",
      address: "202 Võ Văn Tần, Quận 3, TP.HCM",
      phone: "028 3930 5678",
      status: "active",
    },
    {
      id: "br-03",
      name: "Highlands Trang Tiền",
      region: "Miền Bắc",
      address: "1 Tràng Tiền, Hoàn Kiếm, Hà Nội",
      phone: "024 3934 9999",
      status: "active",
    },
  ],
};

const STORAGE_KEY = "partner_profile_strict_v2_data";

export function getStoredPartnerProfile(): PartnerProfile {
  if (typeof window === "undefined") return initialPartnerProfile;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error("Failed to parse stored profile", e);
  }
  return initialPartnerProfile;
}

export function savePartnerProfile(profile: PartnerProfile): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  } catch (e) {
    console.error("Failed to save profile to localStorage", e);
  }
}
