"use client";

import { PartnerProfile, ProfileFormErrors } from "@/lib/types/profile";
import { useCallback } from "react";

/**
 * Hook chứa toàn bộ validation logic cho profile form.
 * Tách riêng khỏi page để dễ test và tái sử dụng.
 */
export function useProfileValidation() {
  const validate = useCallback(
    (profile: PartnerProfile): ProfileFormErrors => {
      const errors: ProfileFormErrors = {};
      const { legalInfo, representativeInfo } = profile;

      // Thông tin pháp lý
      if (!legalInfo.taxId.trim()) {
        errors.taxId = "Mã số thuế không được để trống.";
      } else if (!/^[0-9]{10,13}$/.test(legalInfo.taxId.trim())) {
        errors.taxId = "Mã số thuế phải bao gồm 10 đến 13 chữ số.";
      }
      if (!legalInfo.businessLicenseNo.trim())
        errors.businessLicenseNo = "Số ĐKKD / Giấy phép kinh doanh không được để trống.";
      if (!legalInfo.issueDate.trim())
        errors.issueDate = "Ngày cấp không được để trống.";
      if (!legalInfo.issuePlace.trim())
        errors.issuePlace = "Nơi cấp không được để trống.";

      // Người đại diện
      if (!representativeInfo.fullName.trim())
        errors.fullName = "Họ và tên người đại diện không được để trống.";
      if (!representativeInfo.title.trim())
        errors.title = "Chức danh người đại diện không được để trống.";
      if (!representativeInfo.identityNo.trim()) {
        errors.identityNo = "Số CCCD / CMND không được để trống.";
      } else if (!/^[0-9]{9,12}$/.test(representativeInfo.identityNo.trim())) {
        errors.identityNo = "Số CCCD / CMND phải gồm 9 hoặc 12 chữ số.";
      }
      if (!representativeInfo.phone.trim()) {
        errors.phone = "Số điện thoại liên hệ không được để trống.";
      } else if (!/^[0-9+\s-]{9,12}$/.test(representativeInfo.phone.trim())) {
        errors.phone = "Số điện thoại liên hệ không hợp lệ.";
      }
      if (!representativeInfo.email.trim()) {
        errors.email = "Email liên hệ không được để trống.";
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(representativeInfo.email.trim())) {
        errors.email = "Định dạng email không hợp lệ (VD: email@example.com).";
      }

      return errors;
    },
    []
  );

  return { validate };
}
