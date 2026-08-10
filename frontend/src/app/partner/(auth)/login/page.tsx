"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { partnerApi, authStore } from "@/lib/partner-api";
import { Button } from "@/components/shared/ui/Button";
import { Input } from "@/components/shared/ui/Input";
import Icon from "@/components/shared/ui/Icon";

export default function PartnerLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); setLoading(true); setError(null);
    try {
      const result = await partnerApi.login(email, password);
      authStore.setSession(result.token, result.user);
      router.replace("/partner");
    } catch (err) { setError(err instanceof Error ? err.message : "Đăng nhập thất bại."); }
    finally { setLoading(false); }
  };

  return <main className="w-full max-w-md bg-surface-bright rounded-2xl border border-outline-variant shadow-xl p-8">
    <div className="text-center mb-7"><div className="w-12 h-12 mx-auto rounded-xl bg-primary text-on-primary flex items-center justify-center font-bold text-2xl mb-3">L</div><h1 className="text-2xl font-bold">Đăng nhập đối tác</h1><p className="text-sm text-on-surface-variant mt-1">Truy cập hệ thống quản lý voucher</p></div>
    {error && <div className="mb-4 p-3 rounded-lg bg-error-container/40 text-error flex gap-2"><Icon name="error" /> <span>{error}</span></div>}
    <form onSubmit={submit} className="space-y-4">
      <div><label className="block font-semibold mb-1">Email</label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" /></div>
      <div><label className="block font-semibold mb-1">Mật khẩu</label><Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" /></div>
      <Button type="submit" disabled={loading} className="w-full !text-white">{loading ? "Đang đăng nhập..." : "Đăng nhập"}</Button>
    </form>
    <p className="text-center text-sm mt-5">Chưa có tài khoản? <Link href="/partner/register" className="text-primary font-bold">Đăng ký</Link></p>
  </main>;
}
