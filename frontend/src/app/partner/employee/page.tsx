/**
 * @file page.tsx (Partner Employee Portal)
 * @description Trang giao diện làm việc chính của Nhân viên chi nhánh đối tác tại quầy thu ngân / điểm bán:
 * - Tra cứu và xác thực tính hợp lệ của voucher bằng cách nhập mã code thủ công hoặc quét mã QR qua camera.
 * - Quản lý máy trạng thái giao diện (`resultState`): idle, invalid_code, invalid_qr, valid (chờ xác nhận), redeemed_success, request_error.
 * - Khóa thao tác (`checkLockRef`, `redeemLockRef`) để ngăn ngừa click đúp (Double Submission).
 * - Xác nhận đổi voucher (Redeem) gắn liền với chi nhánh làm việc của nhân viên đang đăng nhập.
 */

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

/** Phương thức kiểm tra: 'code' (nhập tay) hoặc 'qr' (quét camera) */
type CheckType = "code" | "qr";

/**
 * Máy trạng thái giao diện kết quả kiểm tra voucher
 */
type CheckResultState =
  | { type: "idle" }                                                                             // Trạng thái ban đầu, chờ nhập/quét
  | { type: "invalid_code" }                                                                     // Mã code không tồn tại, hết hạn hoặc đã dùng
  | { type: "invalid_qr" }                                                                       // Mã QR không hợp lệ hoặc quét lỗi
  | { type: "request_error"; message: string }                                                   // Lỗi hệ thống hoặc kết nối mạng
  | { type: "valid"; voucher: VoucherItem }                                                      // Voucher hợp lệ, hiển thị chi tiết và nút xác nhận đổi
  | { type: "redeemed_success"; voucherTitle: string; code: string; redeemedAt: string };       // Đã đổi thành công tại quầy

/**
 * Chuyển đổi dữ liệu trả về từ API tra cứu voucher sang định dạng VoucherItem của Frontend
 */
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

  // Khóa logic chống click liên tiếp khi đang gọi API
  const checkLockRef = useRef(false);
  const redeemLockRef = useRef(false);

  const branchName = profile?.branch?.name ?? "Chi nhánh được phân công";
  const branchId = profile?.branch?.id;

  /**
   * Xử lý tra cứu voucher qua mã code nhập tay
   */
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

  /**
   * Xử lý tra cứu voucher qua mã QR quét được từ camera
   */
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

  /**
   * Xác nhận sử dụng voucher (Redeem) tại chi nhánh của nhân viên
   */
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

  /** Đặt lại trạng thái màn hình để kiểm tra voucher kế tiếp */
  const handleReset = () => {
    setInputCode("");
    setResultState({ type: "idle" });
  };

  return (
    <main className="p-4 sm:p-6 md:p-8 flex-1 overflow-y-auto max-w-4xl w-full mx-auto flex flex-col space-y-6">
      {/* Header thông tin chi nhánh công tác */}
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

      {/* Tabs chuyển đổi giữa Nhập mã tay và Quét QR */}
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

      {/* Vùng hiển thị kết quả kiểm tra & thao tác Redeem */}
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
