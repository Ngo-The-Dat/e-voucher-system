"use client";

import { useEffect, useRef, useState } from "react";
import Icon from "@/components/shared/ui/Icon";
import { ApiError, partnerApi } from "@/lib/partner-api";
import { VoucherItem } from "@/lib/types/voucher";
import { useEmployee } from "@/context/EmployeeContext";
import {
  CheckResultIdleCode,
  CheckResultIdleQr,
  CheckResultInvalid,
  CheckResultValid,
  CheckResultRedeemed,
  CheckResultRequestError,
} from "@/components/partner/voucher/CheckResultStates";

type CheckType = "code" | "qr";

type CheckResultState =
  | { type: "idle" }
  | { type: "invalid_code" }
  | { type: "invalid_qr" }
  | { type: "request_error"; message: string }
  | { type: "valid"; voucher: VoucherItem }
  | { type: "redeemed_success"; voucherTitle: string; code: string; redeemedAt: string };

const mapLookupVoucher = (row: any): VoucherItem => ({
  id: String(row.issued_voucher_id),
  code: row.voucher_code,
  title: row.program_name,
  categoryId: "",
  categoryName: row.category_name ?? "",
  branchIds: (row.branch_ids ?? []).map(String),
  branchNames: row.branch_names ?? [],
  originalPrice: Number(row.original_price),
  sellingPrice: Number(row.sale_price),
  discountAmount: Number(row.discount_amount ?? 0),
  issuedQuantity: 1,
  sellStartDate: "",
  sellEndDate: "",
  useStartDate: row.use_start_at,
  useEndDate: row.expires_at ?? row.use_end_at,
  displayStatus: "active",
  status: "approved",
  thumbnail: null,
  images: [],
});

export default function EmployeeCheckVoucherPage() {
  const { profile } = useEmployee();
  const [checkType, setCheckType] = useState<CheckType>("code");
  const [inputCode, setInputCode] = useState("");
  const [resultState, setResultState] = useState<CheckResultState>({ type: "idle" });
  const [isChecking, setIsChecking] = useState(false);
  const [isRedeeming, setIsRedeeming] = useState(false);
  const checkLockRef = useRef(false);
  const redeemLockRef = useRef(false);

  const branchName = profile?.branch?.name ?? "Chi nhánh được phân công";
  const branchId = profile?.branch?.id;

  const handleCheckCode = async (codeVal?: string) => {
    if (checkLockRef.current) return;
    const codeToTest = (codeVal !== undefined ? codeVal : inputCode).trim().toUpperCase();
    if (!codeToTest) {
      setResultState({ type: "invalid_code" });
      return;
    }
    checkLockRef.current = true;
    setIsChecking(true);
    try {
      const row = await partnerApi.lookupVoucher(codeToTest);
      if (row.usage_status !== "UNUSED") {
        setResultState({ type: "invalid_code" });
        return;
      }
      setResultState({ type: "valid", voucher: mapLookupVoucher(row) });
    } catch (error) {
      setResultState(
        error instanceof ApiError && error.status === 404
          ? { type: "invalid_code" }
          : {
              type: "request_error",
              message: error instanceof Error ? error.message : "Không thể kiểm tra voucher. Vui lòng thử lại.",
            }
      );
    } finally {
      checkLockRef.current = false;
      setIsChecking(false);
    }
  };

  const handleCheckQr = async (qrValue: string) => {
    if (checkLockRef.current) return;
    checkLockRef.current = true;
    setIsChecking(true);
    try {
      const row = await partnerApi.lookupVoucherByQr(qrValue);
      if (row.usage_status !== "UNUSED") {
        setResultState({ type: "invalid_qr" });
        return;
      }
      setResultState({ type: "valid", voucher: mapLookupVoucher(row) });
    } catch (error) {
      setResultState(
        error instanceof ApiError && error.status === 404
          ? { type: "invalid_qr" }
          : {
              type: "request_error",
              message: error instanceof Error ? error.message : "Không thể kiểm tra mã QR. Vui lòng thử lại.",
            }
      );
    } finally {
      checkLockRef.current = false;
      setIsChecking(false);
    }
  };

  const handleConfirmRedeem = async () => {
    if (resultState.type !== "valid" || redeemLockRef.current) return;

    if (!branchId) {
      setResultState({
        type: "request_error",
        message: "Không xác định được chi nhánh của nhân viên. Vui lòng liên hệ quản lý.",
      });
      return;
    }

    redeemLockRef.current = true;
    setIsRedeeming(true);
    try {
      const result = await partnerApi.redeemVoucher(resultState.voucher.code, branchId);
      setResultState({
        type: "redeemed_success",
        voucherTitle: resultState.voucher.title,
        code: resultState.voucher.code,
        redeemedAt: new Date(result.redeemed_at).toLocaleString("vi-VN"),
      });
    } catch (error) {
      setResultState({
        type: "request_error",
        message: error instanceof Error ? error.message : "Không thể xác nhận sử dụng voucher. Vui lòng kiểm tra lại.",
      });
    } finally {
      redeemLockRef.current = false;
      setIsRedeeming(false);
    }
  };

  const handleReset = () => {
    setInputCode("");
    setResultState({ type: "idle" });
  };

  return (
    <main className="p-4 sm:p-6 md:p-8 flex-1 overflow-y-auto max-w-4xl w-full mx-auto flex flex-col space-y-6">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-outline-variant/40 pb-4">
        <div>
          <h2 className="text-2xl font-bold text-on-surface">Kiểm tra & Xác nhận Voucher</h2>
          <p className="text-sm text-on-surface-variant mt-0.5">
            Nhập mã voucher hoặc quét mã QR từ khách hàng để xác thực và áp dụng tại điểm bán.
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto px-3 py-1.5 rounded-lg bg-surface-container-high text-xs font-semibold text-on-surface-variant">
          <Icon name="location_on" className="text-primary text-base" />
          <span>Điểm xác nhận: {branchName}</span>
        </div>
      </div>

      {/* Tabs Chọn Phương Thức */}
      <div className="bg-surface-container-high rounded-xl p-1.5 flex shadow-inner">
        {(["code", "qr"] as const).map((type) => (
          <button
            key={type}
            onClick={() => {
              setCheckType(type);
              handleReset();
            }}
            className={`flex-1 py-3 rounded-lg text-base font-bold flex items-center justify-center gap-2 transition-all ${
              checkType === type
                ? "bg-primary text-on-primary shadow-md"
                : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            <Icon name={type === "code" ? "keyboard" : "qr_code_scanner"} className="text-xl" />
            <span>{type === "code" ? "Kiểm tra bằng Code" : "Quét mã QR"}</span>
          </button>
        ))}
      </div>

      {/* Workspace Hiển Thị Kết Quả */}
      <div className="bg-surface-bright border border-outline-variant rounded-2xl p-6 md:p-8 shadow-sm flex-1 min-h-[420px] flex flex-col justify-center relative overflow-hidden">
        {resultState.type === "invalid_code" && (
          <CheckResultInvalid type="code" onReset={handleReset} />
        )}
        {resultState.type === "invalid_qr" && (
          <CheckResultInvalid type="qr" onReset={handleReset} />
        )}
        {resultState.type === "valid" && (
          <CheckResultValid
            voucher={resultState.voucher}
            onConfirm={handleConfirmRedeem}
            onReset={handleReset}
            isConfirming={isRedeeming}
          />
        )}
        {resultState.type === "request_error" && (
          <CheckResultRequestError message={resultState.message} onReset={handleReset} />
        )}
        {resultState.type === "redeemed_success" && (
          <CheckResultRedeemed
            voucherTitle={resultState.voucherTitle}
            code={resultState.code}
            redeemedAt={resultState.redeemedAt}
            onReset={handleReset}
          />
        )}
        {resultState.type === "idle" && checkType === "code" && (
          <CheckResultIdleCode
            inputCode={inputCode}
            onInputChange={setInputCode}
            onSubmit={() => handleCheckCode()}
            isChecking={isChecking}
          />
        )}
        {resultState.type === "idle" && checkType === "qr" && (
          <CheckResultIdleQr
            onScan={handleCheckQr}
            onError={() => setResultState({ type: "invalid_qr" })}
          />
        )}
      </div>
    </main>
  );
}
