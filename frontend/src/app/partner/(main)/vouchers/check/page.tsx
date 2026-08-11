"use client";

import TopAppBar from "@/components/partner/layout/TopAppBar";
import Icon from "@/components/shared/ui/Icon";
import { useEffect, useRef, useState } from "react";
import { ApiError, partnerApi } from "@/lib/partner-api";
import { Branch } from "@/lib/types/profile";
import { VoucherItem } from "@/lib/types/voucher";
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
  id: String(row.issued_voucher_id), code: row.voucher_code, title: row.program_name,
  categoryId: "", categoryName: row.category_name ?? "",
  branchIds: (row.branch_ids ?? []).map(String), branchNames: row.branch_names ?? [],
  originalPrice: Number(row.original_price), sellingPrice: Number(row.sale_price),
  discountAmount: Number(row.discount_amount ?? 0), issuedQuantity: 1,
  sellStartDate: "", sellEndDate: "", useStartDate: row.use_start_at,
  useEndDate: row.expires_at ?? row.use_end_at, displayStatus: "active", status: "approved",
});

export default function CheckVoucherPage() {
  const [checkType, setCheckType] = useState<CheckType>("code");
  const [inputCode, setInputCode] = useState("");
  const [resultState, setResultState] = useState<CheckResultState>({ type: "idle" });
  const [branches, setBranches] = useState<Branch[]>([]);
  const [isChecking, setIsChecking] = useState(false);
  const [isRedeeming, setIsRedeeming] = useState(false);
  const checkLockRef = useRef(false);
  const redeemLockRef = useRef(false);

  useEffect(() => {
    partnerApi.getBranches().then((rows) => setBranches(rows.filter((b) => b.status === "active")))
      .catch((error) => console.error("Failed to load branches", error));
  }, []);

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
      if (row.usage_status !== "UNUSED") { setResultState({ type: "invalid_code" }); return; }
      setResultState({ type: "valid", voucher: mapLookupVoucher(row) });
    } catch (error) {
      setResultState(error instanceof ApiError && error.status === 404
        ? { type: "invalid_code" }
        : { type: "request_error", message: error instanceof Error ? error.message : "Không thể kiểm tra voucher. Vui lòng thử lại." });
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
      if (row.usage_status !== "UNUSED") { setResultState({ type: "invalid_qr" }); return; }
      setResultState({ type: "valid", voucher: mapLookupVoucher(row) });
    } catch (error) {
      setResultState(error instanceof ApiError && error.status === 404
        ? { type: "invalid_qr" }
        : { type: "request_error", message: error instanceof Error ? error.message : "Không thể kiểm tra mã QR. Vui lòng thử lại." });
    } finally {
      checkLockRef.current = false;
      setIsChecking(false);
    }
  };

  const handleConfirmRedeem = async () => {
    if (resultState.type !== "valid" || redeemLockRef.current) return;
    const branch = branches.find((item) => resultState.voucher.branchIds.includes(item.id));
    if (!branch) {
      setResultState({ type: "request_error", message: "Không tìm thấy chi nhánh đang hoạt động phù hợp với voucher." });
      return;
    }
    redeemLockRef.current = true;
    setIsRedeeming(true);
    try {
      const result = await partnerApi.redeemVoucher(resultState.voucher.code, branch.id);
      setResultState({
        type: "redeemed_success", voucherTitle: resultState.voucher.title,
        code: resultState.voucher.code, redeemedAt: new Date(result.redeemed_at).toLocaleString("vi-VN"),
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
    <div className="flex-1 flex flex-col min-w-0 bg-background min-h-screen w-full">
      <TopAppBar title="Kiểm tra voucher" />

      <main className="p-6 md:p-8 flex-1 overflow-y-auto max-w-4xl w-full mx-auto flex flex-col space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-on-surface mb-1">Kiểm tra & Xác nhận Voucher</h2>
          <p className="text-base text-on-surface-variant">Vui lòng chọn phương thức kiểm tra mã để đối chiếu và xác nhận sử dụng.</p>
        </div>

        {/* Tab chọn loại */}
        <div className="bg-surface-container-high rounded-xl p-1.5 flex shadow-inner">
          {(["code", "qr"] as const).map((type) => (
            <button
              key={type}
              onClick={() => { setCheckType(type); handleReset(); }}
              className={`flex-1 py-3 rounded-lg text-base font-bold flex items-center justify-center gap-2 transition-all ${
                checkType === type ? "bg-primary text-on-primary shadow-md" : "text-on-surface-variant hover:text-on-surface"
              }`}
            >
              <Icon name={type === "code" ? "keyboard" : "qr_code_scanner"} className="text-xl" />
              <span>{type === "code" ? "Kiểm tra bằng Code" : "Quét mã QR"}</span>
            </button>
          ))}
        </div>

        {/* Workspace */}
        <div className="bg-surface-bright border border-outline-variant rounded-2xl p-6 md:p-8 shadow-sm flex-1 min-h-[420px] flex flex-col justify-center relative overflow-hidden">
          {resultState.type === "invalid_code" && (
            <CheckResultInvalid type="code" onReset={handleReset} />
          )}
          {resultState.type === "invalid_qr" && (
            <CheckResultInvalid type="qr" onReset={handleReset} />
          )}
          {resultState.type === "valid" && (
            <CheckResultValid voucher={resultState.voucher} onConfirm={handleConfirmRedeem} onReset={handleReset} isConfirming={isRedeeming} />
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
    </div>
  );
}
