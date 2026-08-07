import Icon from "@/components/ui/Icon";

interface ToastProps {
  message: string | null;
  /** Loại toast: mặc định "success" */
  type?: "success" | "error";
}

/**
 * Toast notification cố định góc trên phải.
 * Dùng: {toastMessage && <Toast message={toastMessage} />}
 */
export default function Toast({ message, type = "success" }: ToastProps) {
  if (!message) return null;

  const isError = type === "error";

  return (
    <div
      className={`fixed top-20 right-6 z-50 font-bold px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 animate-slideDown border border-white/20 ${
        isError
          ? "bg-error text-on-error"
          : "bg-primary text-on-primary"
      }`}
    >
      <Icon name={isError ? "error" : "check_circle"} className="text-2xl shrink-0" />
      <span>{message}</span>
    </div>
  );
}
