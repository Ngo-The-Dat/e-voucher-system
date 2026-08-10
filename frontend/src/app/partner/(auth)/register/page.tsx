"use client";

import { useState } from "react";
import Link from "next/link";
import { partnerApi } from "@/lib/partner-api";
import { Button } from "@/components/shared/ui/Button";
import { Input } from "@/components/shared/ui/Input";
import Icon from "@/components/shared/ui/Icon";

const emptyForm = { fullName: "", identityNo: "", phone: "", email: "", businessName: "", taxCode: "", password: "", confirmPassword: "" };

export default function RegisterPage() {
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const update = (key: keyof typeof form, value: string) => setForm((current) => ({ ...current, [key]: value }));

  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); setError(null);
    if (form.password.length < 8) { setError("Mật khẩu phải có ít nhất 8 ký tự."); return; }
    if (form.password !== form.confirmPassword) { setError("Mật khẩu xác nhận không khớp."); return; }
    setLoading(true);
    try {
      await partnerApi.register({
        full_name: form.fullName, identity_no: form.identityNo, phone: form.phone,
        email: form.email, business_name: form.businessName, tax_code: form.taxCode,
        password: form.password,
      });
      setSuccess(true);
    } catch (err) { setError(err instanceof Error ? err.message : "Đăng ký thất bại."); }
    finally { setLoading(false); }
  };

  if (success) return <main className="w-full max-w-lg bg-surface-bright rounded-2xl border border-outline-variant shadow-xl p-8 text-center">
    <Icon name="check_circle" className="text-6xl text-secondary" />
    <h1 className="text-2xl font-bold mt-4">Đăng ký thành công</h1>
    <p className="text-on-surface-variant mt-2">Tài khoản đang chờ quản trị viên phê duyệt. Bạn có thể đăng nhập sau khi được duyệt.</p>
    <Link href="/partner/login" className="inline-block mt-6 px-6 py-3 bg-primary text-on-primary rounded-xl font-bold">Đến trang đăng nhập</Link>
  </main>;

  const fields: Array<[keyof typeof form, string, string, string]> = [
    ["fullName", "Họ và tên đại diện", "text", "Nguyễn Văn A"],
    ["identityNo", "CCCD / CMND", "text", "012345678901"],
    ["phone", "Số điện thoại", "tel", "0912345678"],
    ["email", "Email", "email", "doitac@example.com"],
    ["businessName", "Tên doanh nghiệp", "text", "Công ty TNHH ABC"],
    ["taxCode", "Mã số thuế", "text", "0312345678"],
    ["password", "Mật khẩu", "password", "Tối thiểu 8 ký tự"],
    ["confirmPassword", "Xác nhận mật khẩu", "password", "Nhập lại mật khẩu"],
  ];
  return <main className="w-full max-w-2xl bg-surface-bright rounded-2xl border border-outline-variant shadow-xl p-8">
    <div className="text-center mb-6"><h1 className="text-2xl font-bold">Đăng ký tài khoản đối tác</h1><p className="text-sm text-on-surface-variant">Thông tin sẽ được gửi trực tiếp tới hệ thống để chờ phê duyệt.</p></div>
    {error && <div className="mb-4 p-3 rounded-lg bg-error-container/40 text-error font-semibold">{error}</div>}
    <form onSubmit={submit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {fields.map(([key, label, type, placeholder]) => <label key={key} className="font-semibold">{label}<span className="text-error"> *</span><Input className="mt-1" type={type} placeholder={placeholder} value={form[key]} onChange={(e) => update(key, e.target.value)} required /></label>)}
      <div className="sm:col-span-2 flex justify-between items-center mt-2"><Link href="/partner/login" className="text-primary font-bold">Đã có tài khoản?</Link><Button type="submit" disabled={loading} className="!text-white">{loading ? "Đang đăng ký..." : "Đăng ký"}</Button></div>
    </form>
  </main>;
}
