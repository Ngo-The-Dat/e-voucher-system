export interface EmployeeProfile {
  id: number;
  full_name: string;
  email: string;
  phone: string | null;
  gender: string | null;
  identity_no: string | null;
  nationality: string | null;
  status: 'ACTIVE' | 'LOCKED';
  created_at: string;
  last_login_at: string | null;
  branch: {
    id: number;
    name: string;
    address: string;
    phone: string | null;
    region: string | null;
    status: string;
  };
  partner: {
    id: number;
    business_name: string;
    brand_logo: string | null;
  };
}

export interface PartnerEmployeeItem {
  id: number;
  full_name: string;
  email: string;
  phone: string | null;
  gender: string | null;
  identity_no: string | null;
  nationality: string | null;
  status: 'ACTIVE' | 'LOCKED';
  approval_status?: 'PENDING' | 'APPROVED' | 'REJECTED';
  admin_feedback?: string | null;
  created_at: string;
  last_login_at: string | null;
  branch: {
    id: number;
    name: string;
    address: string;
    status: string;
  };
}

export interface CreateEmployeePayload {
  full_name: string;
  email: string;
  phone?: string;
  identity_no?: string;
  gender?: string;
  nationality?: string;
  password: string;
  branch_id: number;
}
