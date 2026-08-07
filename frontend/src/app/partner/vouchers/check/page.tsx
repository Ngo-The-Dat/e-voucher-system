"use client";

import TopAppBar from "@/components/layout/TopAppBar";
import Icon from "@/components/ui/Icon";
import { useState } from "react";
import { initialCategories } from "@/lib/mock-vouchers";
import { VoucherItem } from "@/lib/types/voucher";
import {
  CheckResultIdleCode,
  CheckResultIdleQr,
  CheckResultInvalid,
  CheckResultValid,
  CheckResultRedeemed,
} from "@/components/voucher/CheckResultStates";

type CheckType = "code" | "qr";

type CheckResultState =
  | { type: "idle" }
  | { type: "invalid_code" }
  | { type: "invalid_qr" }
  | { type: "valid"; voucher: VoucherItem }
  | { type: "redeemed_success"; voucherTitle: string; code: string; redeemedAt: string };

// Demo Voucher cho trường hợp Hợp lệ
const demoVoucher: VoucherItem = {
  id: "VC-HL-2023-001",
  code: "VC-HL-2023-001",
  title: "Ưu đãi Giảm 50k cho Đơn Cuối Tuần",
  categoryId: "cat-01",
  categoryName: initialCategories[0]?.name || "Đồ uống & Cà phê",
  branchIds: ["br-01", "br-02"],
  branchNames: ["Highlands Nguyễn Du", "Highlands Lê Duẩn"],
  originalPrice: 150000,
  sellingPrice: 100000,
  discountAmount: 50000,
  issuedQuantity: 1000,
  sellStartDate: "2023-12-01",
  sellEndDate: "2023-12-25",
  useStartDate: "2023-12-01",
  useEndDate: "2024-12-31",
  displayStatus: "active",
  status: "approved",
};

export default function CheckVoucherPage() {
  const [checkType, setCheckType] = useState<CheckType>("code");
  const [inputCode, setInputCode] = useState("");
  const [resultState, setResultState] = useState<CheckResultState>({ type: "idle" });

  const handleCheckCode = (codeVal?: string, forceInvalid = false) => {
    const codeToTest = (codeVal !== undefined ? codeVal : inputCode).trim().toUpperCase();
    if (forceInvalid || !codeToTest || codeToTest.includes("SAI")) {
      setResultState({ type: "invalid_code" });
    } else {
      setResultState({ type: "valid", voucher: { ...demoVoucher, code: codeToTest || demoVoucher.code } });
    }
  };

  const handleCheckQr = (forceInvalid = false) => {
    setResultState(forceInvalid ? { type: "invalid_qr" } : { type: "valid", voucher: demoVoucher });
  };

  const handleConfirmRedeem = () => {
    const targetVoucher = resultState.type === "valid" ? resultState.voucher : demoVoucher;
    setResultState({
      type: "redeemed_success",
      voucherTitle: targetVoucher.title,
      code: targetVoucher.code,
      redeemedAt: new Date().toLocaleString("vi-VN"),
    });
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
            <CheckResultValid voucher={resultState.voucher} onConfirm={handleConfirmRedeem} onReset={handleReset} />
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
              onTryValid={() => { const c = "VC-HL-2023-001"; setInputCode(c); handleCheckCode(c, false); }}
              onTryInvalid={() => { const c = "VC-HL-SAI-999"; setInputCode(c); handleCheckCode(c, true); }}
            />
          )}
          {resultState.type === "idle" && checkType === "qr" && (
            <CheckResultIdleQr
              onTryValid={() => handleCheckQr(false)}
              onTryInvalid={() => handleCheckQr(true)}
            />
          )}
        </div>
      </main>
    </div>
  );
}
