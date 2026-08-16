export interface LegalInfo {
  taxId: string; // Mã số thuế
  businessLicenseNo: string;
  issueDate: string;
  issuePlace: string;
  verificationStatus: "verified" | "pending" | "rejected";
}

export interface RepresentativeInfo {
  fullName: string;
  title: string;
  identityNo: string;
  phone: string;
  email: string;
}

export interface Branch {
  id: string;
  name: string;
  region: string; // Khu vực (VD: Miền Nam, Miền Bắc, Miền Trung...)
  address: string;
  phone: string;
  status: "active" | "inactive";
}

export interface PartnerProfile {
  businessName: string;
  brandLogo?: string | null;
  legalInfo: LegalInfo;
  representativeInfo: RepresentativeInfo;
  branches: Branch[];
}

export type ProfileFormErrors = Record<string, string>;
