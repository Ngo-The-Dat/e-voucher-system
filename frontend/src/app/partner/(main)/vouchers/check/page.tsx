"use client";

import { useEffect, useState } from "react";
import TopAppBar from "@/components/partner/layout/TopAppBar";
import type { Branch } from "@/lib/types/profile";
import type { VoucherItem } from "@/lib/types/voucher";
import { partnerApi } from "@/lib/partner-api";
import {
  CheckResultIdleCode, CheckResultInvalid, CheckResultValid, CheckResultRedeemed,
} from "@/components/partner/voucher/CheckResultStates";

type State = { type: "idle" } | { type: "invalid"; message: string } |
  { type: "valid"; voucher: VoucherItem } |
  { type: "redeemed"; voucherTitle: string; code: string; redeemedAt: string };

export default function CheckVoucherPage() {
  const [inputCode, setInputCode] = useState("");
  const [state, setState] = useState<State>({ type: "idle" });
  const [branches, setBranches] = useState<Branch[]>([]);
  const [branchId, setBranchId] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    partnerApi.getBranches().then((rows) => {
      const active = rows.filter((row) => row.status === "active");
      setBranches(active); setBranchId(active[0]?.id ?? "");
    }).catch(() => setBranches([]));
  }, []);

  const lookup = async () => {
    if (!inputCode.trim()) return;
    setLoading(true);
    try {
      const row = await partnerApi.lookupVoucher(inputCode.trim());
      if (row.usage_status !== "UNUSED") {
        setState({ type: "invalid", message: row.usage_status === "USED" ? "Voucher đã được sử dụng." : "Voucher không còn hiệu lực." });
        return;
      }
      setState({ type: "valid", voucher: {
        id: String(row.issued_voucher_id), code: row.voucher_code, title: row.program_name,
        categoryId: "", categoryName: row.category_name ?? "", branchIds: (row.branch_ids ?? []).map(String),
        branchNames: row.branch_names ?? [], originalPrice: Number(row.original_price), sellingPrice: Number(row.sale_price),
        discountAmount: Number(row.discount_amount ?? 0), issuedQuantity: 1,
        sellStartDate: "", sellEndDate: "", useStartDate: row.use_start_at,
        useEndDate: row.expires_at ?? row.use_end_at, displayStatus: "active", status: "approved",
      }});
    } catch (err) { setState({ type: "invalid", message: err instanceof Error ? err.message : "Mã voucher không hợp lệ." }); }
    finally { setLoading(false); }
  };

  const redeem = async () => {
    if (state.type !== "valid" || !branchId) return;
    setLoading(true);
    try {
      const result = await partnerApi.redeemVoucher(state.voucher.code, branchId);
      setState({ type: "redeemed", voucherTitle: state.voucher.title, code: state.voucher.code, redeemedAt: new Date(result.redeemed_at).toLocaleString("vi-VN") });
    } catch (err) { setState({ type: "invalid", message: err instanceof Error ? err.message : "Không thể sử dụng voucher." }); }
    finally { setLoading(false); }
  };
  const reset = () => { setInputCode(""); setState({ type: "idle" }); };

  return <div className="flex-1 flex flex-col min-w-0 bg-background min-h-screen w-full">
    <TopAppBar title="Kiểm tra voucher" />
    <main className="p-6 md:p-8 flex-1 max-w-4xl w-full mx-auto space-y-6">
      <div><h2 className="text-2xl font-bold">Kiểm tra & Xác nhận Voucher</h2><p className="text-on-surface-variant">Tra cứu mã voucher trên hệ thống trước khi xác nhận sử dụng.</p></div>
      <label className="block font-semibold">Chi nhánh xác nhận
        <select value={branchId} onChange={(e) => setBranchId(e.target.value)} className="mt-2 w-full border border-outline-variant rounded-xl p-3 bg-surface">
          {branches.map((branch) => <option key={branch.id} value={branch.id}>{branch.name}</option>)}
        </select>
      </label>
      <div className="bg-surface-bright border border-outline-variant rounded-2xl p-6 md:p-8 shadow-sm min-h-[420px] flex flex-col justify-center">
        {loading && <p className="text-center text-primary font-bold">Đang xử lý...</p>}
        {!loading && state.type === "idle" && <CheckResultIdleCode inputCode={inputCode} onInputChange={setInputCode} onSubmit={() => void lookup()} />}
        {!loading && state.type === "invalid" && <><p className="text-center text-error font-bold mb-3">{state.message}</p><CheckResultInvalid type="code" onReset={reset} /></>}
        {!loading && state.type === "valid" && <CheckResultValid voucher={state.voucher} onConfirm={() => void redeem()} onReset={reset} />}
        {!loading && state.type === "redeemed" && <CheckResultRedeemed voucherTitle={state.voucherTitle} code={state.code} redeemedAt={state.redeemedAt} onReset={reset} />}
      </div>
    </main>
  </div>;
}
