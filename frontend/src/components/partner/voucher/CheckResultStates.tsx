import Icon from "@/components/shared/ui/Icon";
import { VoucherItem } from "@/lib/types/voucher";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useEffect, useRef } from "react";

interface CheckResultIdleCodeProps {
  inputCode: string;
  onInputChange: (v: string) => void;
  onSubmit: () => void;
}

export function CheckResultIdleCode({
  inputCode, onInputChange, onSubmit,
}: CheckResultIdleCodeProps) {
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(); }} className="space-y-6 max-w-lg mx-auto w-full text-center">
      <div className="w-16 h-16 bg-primary-container/30 text-primary rounded-full flex items-center justify-center mx-auto shadow-sm">
        <Icon name="vpn_key" className="text-3xl" />
      </div>
      <div>
        <h3 className="text-xl font-bold text-on-surface">Nhập mã Voucher Code</h3>
        <p className="text-base text-on-surface-variant mt-1">Nhập chính xác chuỗi ký tự mã voucher của khách hàng để đối chiếu.</p>
      </div>
      <input
        type="text"
        value={inputCode}
        onChange={(e) => onInputChange(e.target.value.toUpperCase())}
        placeholder="VD: VC-HL-2023-001"
        className="w-full border-2 border-outline-variant rounded-xl px-5 py-4 text-center text-xl uppercase tracking-widest text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all bg-surface"
      />
      <button type="submit" className="w-full py-4 bg-primary text-on-primary font-bold rounded-xl hover:bg-surface-tint transition-all shadow-md text-base flex items-center justify-center gap-2">
        <Icon name="search" className="text-xl" /><span>Xác nhận</span>
      </button>
    </form>
  );
}

interface CheckResultIdleQrProps {
  onScan: (value: string) => void;
  onError: () => void;
}

export function CheckResultIdleQr({ onScan, onError }: CheckResultIdleQrProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const onScanRef = useRef(onScan);
  const onErrorRef = useRef(onError);

  useEffect(() => { onScanRef.current = onScan; }, [onScan]);
  useEffect(() => { onErrorRef.current = onError; }, [onError]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !navigator.mediaDevices?.getUserMedia) {
      onErrorRef.current();
      return;
    }

    let active = true;
    let controls: { stop: () => void } | undefined;

    const startScanner = async () => {
      const { BrowserQRCodeReader } = await import("@zxing/browser");
      if (!active) return;
      const reader = new BrowserQRCodeReader();
      const scannerControls = await reader.decodeFromConstraints(
        { video: { facingMode: { ideal: "environment" } } },
        video,
        (result) => {
          if (!active || !result) return;
          active = false;
          controls?.stop();
          onScanRef.current(result.getText());
        },
      );
      controls = scannerControls;
      if (!active) scannerControls.stop();
    };

    startScanner().catch(() => {
      if (!active) return;
      active = false;
      onErrorRef.current();
    });

    return () => {
      active = false;
      controls?.stop();
      video.srcObject instanceof MediaStream
        && video.srcObject.getTracks().forEach((track) => track.stop());
    };
  }, []);

  return (
    <div className="space-y-6 max-w-lg mx-auto w-full text-center">
      <div className="w-16 h-16 bg-primary-container/30 text-primary rounded-full flex items-center justify-center mx-auto shadow-sm">
        <Icon name="qr_code_scanner" className="text-3xl" />
      </div>
      <div>
        <h3 className="text-xl font-bold text-on-surface">Quét mã QR Voucher</h3>
        <p className="text-base text-on-surface-variant mt-1">Đưa camera đối diện mã QR trên thiết bị của khách hàng để quét mã.</p>
      </div>
      <div className="w-64 h-64 border-4 border-dashed border-primary rounded-2xl mx-auto overflow-hidden bg-black shadow-inner relative">
        <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
        <span className="absolute bottom-2 inset-x-2 text-xs text-white font-medium px-3 py-1.5 rounded-lg bg-black/60">
          Đưa mã QR vào giữa khung hình
        </span>
      </div>
    </div>
  );
}

interface CheckResultInvalidProps {
  type: "code" | "qr";
  onReset: () => void;
}

export function CheckResultInvalid({ type, onReset }: CheckResultInvalidProps) {
  return (
    <div className="text-center p-8 bg-error-container/20 rounded-2xl border-2 border-error space-y-4 animate-fadeIn">
      <div className="w-16 h-16 rounded-full bg-error text-on-error flex items-center justify-center mx-auto shadow-md">
        <Icon name={type === "code" ? "close" : "qr_code_2"} className="text-3xl font-bold" />
      </div>
      <div>
        <h3 className="text-2xl font-bold text-error">{type === "code" ? "Mã không hợp lệ" : "QR không hợp lệ"}</h3>
        <p className="text-base text-on-surface mt-1">
          {type === "code"
            ? "Mã voucher vừa nhập không tồn tại trong hệ thống. Vui lòng kiểm tra lại."
            : "Mã QR vừa quét không hợp lệ hoặc không thuộc hệ thống voucher này."}
        </p>
      </div>
      <button onClick={onReset} className="px-6 py-2.5 bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-bold rounded-xl transition-colors border border-outline-variant text-base">
        {type === "code" ? "Thử lại mã khác" : "Quét lại mã QR khác"}
      </button>
    </div>
  );
}

interface CheckResultValidProps {
  voucher: VoucherItem;
  onConfirm: () => void;
  onReset: () => void;
}

export function CheckResultValid({ voucher, onConfirm, onReset }: CheckResultValidProps) {
  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="bg-secondary-container/20 border-2 border-secondary rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex justify-between items-start border-b border-secondary/30 pb-4">
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary text-on-secondary font-bold text-xs">
              <Icon name="check_circle" className="text-sm" /> Hợp lệ sẵn sàng sử dụng
            </span>
            <h3 className="text-2xl font-bold text-on-surface mt-2">{voucher.title}</h3>
            <p className="text-base font-bold text-primary mt-0.5">Mã: {voucher.code}</p>
          </div>
          <div className="text-right">
            <span className="text-sm text-on-surface-variant block">Mức ưu đãi:</span>
            <span className="text-2xl font-bold text-primary">{formatCurrency(voucher.sellingPrice)}</span>
            <span className="line-through text-xs text-on-surface-variant block">{formatCurrency(voucher.originalPrice)}</span>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-base">
          <div>
            <span className="block text-sm text-on-surface-variant font-medium">Danh mục:</span>
            <span className="font-bold text-on-surface">{voucher.categoryName}</span>
          </div>
          <div>
            <span className="block text-sm text-on-surface-variant font-medium">Thời hạn sử dụng:</span>
            <span className="font-bold text-on-surface">{formatDate(voucher.useStartDate)} đến {formatDate(voucher.useEndDate)}</span>
          </div>
          <div className="sm:col-span-2">
            <span className="block text-sm text-on-surface-variant font-medium mb-1">Chi nhánh áp dụng:</span>
            <div className="flex flex-wrap gap-2">
              {voucher.branchNames?.map((name, i) => (
                <span key={i} className="px-3 py-1 bg-surface-container-high rounded-full text-sm font-semibold border border-outline-variant text-on-surface">📍 {name}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="flex justify-end gap-4 pt-2">
        <button onClick={onReset} className="px-6 py-3 rounded-xl font-semibold text-on-surface-variant hover:bg-surface-container-high transition-colors text-base">Hủy bỏ</button>
        <button onClick={onConfirm} className="px-8 py-3 rounded-xl font-bold bg-secondary text-on-secondary hover:bg-secondary-container hover:text-on-secondary-container transition-all shadow-lg text-base flex items-center gap-2">
          <Icon name="task_alt" className="text-xl" /><span>Xác nhận sử dụng</span>
        </button>
      </div>
    </div>
  );
}

interface CheckResultRedeemedProps {
  voucherTitle: string;
  code: string;
  redeemedAt: string;
  onReset: () => void;
}

export function CheckResultRedeemed({ voucherTitle, code, redeemedAt, onReset }: CheckResultRedeemedProps) {
  return (
    <div className="text-center p-8 bg-secondary-container/30 rounded-2xl border-2 border-secondary space-y-4 animate-scaleUp">
      <div className="w-20 h-20 rounded-full bg-secondary text-on-secondary flex items-center justify-center mx-auto shadow-xl">
        <Icon name="check_circle" className="text-4xl" />
      </div>
      <div>
        <h3 className="text-2xl font-bold text-secondary">Sử dụng voucher thành công!</h3>
        <p className="text-lg font-bold text-on-surface mt-1">{voucherTitle}</p>
        <p className="text-base font-semibold text-on-surface-variant mt-0.5">Mã voucher: {code}</p>
        <p className="text-sm text-on-surface-variant mt-2">Thời gian ghi nhận sử dụng: <strong>{redeemedAt}</strong></p>
      </div>
      <button onClick={onReset} className="px-8 py-3 bg-primary text-on-primary font-bold rounded-xl hover:bg-surface-tint transition-all shadow-md text-base">
        Tiếp tục kiểm tra mã khác
      </button>
    </div>
  );
}
