"use client";

import { FormEvent, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { customerAuthApi, CustomerUser } from "@/lib/customer-api";
import { Check, CircleAlert, Mail, Phone, User as UserIcon, Camera, Save, ArrowLeft, ShieldCheck, Edit2, X } from "lucide-react";
import Link from "next/link";

export default function CustomerProfilePage() {
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [originalData, setOriginalData] = useState({ fullName: "", phone: "" });
  
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load initial data
    const fetchUser = async () => {
      try {
        const userData = await customerAuthApi.getMe();
        setFullName(userData.full_name || "");
        setPhone(userData.phone || "");
        setEmail(userData.email || "");
        setOriginalData({ fullName: userData.full_name || "", phone: userData.phone || "" });
      } catch (err: any) {
        console.error("fetchUser error:", err);
        setError("Không thể tải thông tin tài khoản. Lỗi: " + (err.message || String(err)));
      } finally {
        setIsLoading(false);
      }
    };
    fetchUser();
  }, []);

  const handleCancel = () => {
    setFullName(originalData.fullName);
    setPhone(originalData.phone);
    setIsEditing(false);
    setError("");
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    
    if (!fullName.trim()) {
      setError("Họ và tên không được để trống.");
      return;
    }

    setIsSubmitting(true);

    try {
      const updatedUser = await customerAuthApi.updateProfile({
        full_name: fullName,
        phone: phone || undefined,
      });
      
      setSuccess("Cập nhật thông tin thành công.");
      setOriginalData({ fullName, phone: phone || "" });
      setIsEditing(false);
      
      // Update local storage and dispatch event so Header can update
      localStorage.setItem("customer_user", JSON.stringify(updatedUser));
      window.dispatchEvent(new Event("customer-auth-changed"));
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Đã xảy ra lỗi khi cập nhật thông tin.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[80vh] flex justify-center items-center bg-gray-50/50">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full border-t-2 border-[#0f2c59] animate-spin"></div>
          <div className="absolute inset-2 rounded-full border-r-2 border-blue-400 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
        </div>
      </div>
    );
  }

  const userInitials = fullName ? fullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'U';

  return (
    <div className="min-h-screen bg-gray-50/50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        {/* Header Breadcrumbs/Actions */}
        <div className="mb-8 flex items-center justify-between">
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-[#0f2c59] transition-colors group">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Quay lại trang chủ
          </Link>
        </div>

        <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden flex flex-col md:flex-row">
          
          {/* Left Sidebar - Profile Overview */}
          <div className="w-full md:w-1/3 bg-gradient-to-br from-[#0f2c59] to-[#1a4480] p-8 text-white flex flex-col items-center justify-center relative overflow-hidden">
            {/* Background Decoration */}
            <div className="absolute top-0 right-0 -mt-16 -mr-16 w-48 h-48 bg-white opacity-5 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 -mb-16 -ml-16 w-56 h-56 bg-blue-400 opacity-10 rounded-full blur-3xl"></div>
            
            <div className="relative group cursor-pointer mb-6 z-10">
              <div className="w-32 h-32 rounded-full border-4 border-white/20 bg-white/10 flex items-center justify-center text-4xl font-bold overflow-hidden shadow-lg backdrop-blur-sm transition-all duration-300 group-hover:border-white/40">
                {userInitials}
              </div>
              <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <Camera className="w-8 h-8 text-white" />
              </div>
            </div>
            
            <h2 className="text-2xl font-bold mb-1 text-center z-10">{fullName || "Người dùng"}</h2>
            <p className="text-blue-200 text-sm mb-6 flex items-center gap-1.5 z-10">
              <ShieldCheck className="w-4 h-4" /> Tài khoản đã xác thực
            </p>
            
            <div className="w-full h-px bg-white/10 my-4 z-10"></div>
            
            <div className="w-full space-y-3 mt-4 z-10">
              <div className="flex items-center gap-3 text-sm text-white/90 bg-white/10 p-3 rounded-xl border border-white/10 backdrop-blur-sm">
                <Mail className="w-4 h-4 shrink-0" />
                <span className="truncate font-medium">{email}</span>
              </div>
              {phone && (
                <div className="flex items-center gap-3 text-sm text-white/90 bg-white/10 p-3 rounded-xl border border-white/10 backdrop-blur-sm">
                  <Phone className="w-4 h-4 shrink-0" />
                  <span className="font-medium">{phone}</span>
                </div>
              )}
            </div>
          </div>

          {/* Right Content - Edit Form */}
          <div className="w-full md:w-2/3 p-8 md:p-12 relative">
            <div className="mb-8 flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Hồ sơ tài khoản</h1>
                <p className="text-gray-500 mt-2">Quản lý thông tin cá nhân và cách thức liên hệ của bạn.</p>
              </div>
              
              {!isEditing && (
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="bg-[#0f2c59]/5 text-[#0f2c59] hover:bg-[#0f2c59]/10 px-4 py-2 rounded-lg font-semibold text-sm transition-colors flex items-center gap-2 cursor-pointer"
                >
                  <Edit2 className="w-4 h-4" />
                  Chỉnh sửa
                </button>
              )}
            </div>

            {error && (
              <div className="mb-8 p-4 rounded-2xl bg-error/5 border border-error/20 text-error text-sm font-medium flex items-start gap-3 animate-fadeIn">
                <CircleAlert className="w-5 h-5 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="mb-8 p-4 rounded-2xl bg-green-50 border border-green-200 text-green-700 text-sm font-medium flex items-start gap-3 animate-fadeIn">
                <Check className="w-5 h-5 shrink-0 mt-0.5" />
                <span>{success}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Form Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Full Name */}
                <div className="col-span-1 md:col-span-2 group">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Họ và tên {isEditing && <span className="text-error">*</span>}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-[#0f2c59] transition-colors">
                      <UserIcon className="w-5 h-5" />
                    </div>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Nhập họ và tên của bạn"
                      required
                      disabled={!isEditing}
                      className={`w-full py-3.5 pl-11 pr-4 rounded-xl transition-all font-medium focus:outline-none ${
                        isEditing 
                          ? "bg-gray-50/50 border border-gray-200 focus:bg-white focus:border-[#0f2c59] focus:ring-4 focus:ring-[#0f2c59]/10 text-gray-900" 
                          : "bg-transparent border border-transparent text-gray-800"
                      }`}
                    />
                  </div>
                </div>
                
                {/* Phone */}
                <div className="col-span-1 group">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Số điện thoại</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-[#0f2c59] transition-colors">
                      <Phone className="w-5 h-5" />
                    </div>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder={isEditing ? "Nhập số điện thoại" : "Chưa cập nhật"}
                      disabled={!isEditing}
                      className={`w-full py-3.5 pl-11 pr-4 rounded-xl transition-all font-medium focus:outline-none ${
                        isEditing 
                          ? "bg-gray-50/50 border border-gray-200 focus:bg-white focus:border-[#0f2c59] focus:ring-4 focus:ring-[#0f2c59]/10 text-gray-900" 
                          : "bg-transparent border border-transparent text-gray-800"
                      }`}
                    />
                  </div>
                </div>
                
                {/* Email (Disabled always) */}
                <div className="col-span-1">
                  <label className="block text-sm font-semibold text-gray-700 mb-2 flex justify-between items-center">
                    Email
                    {isEditing && <span className="text-xs text-gray-500 font-medium px-2 py-0.5 bg-gray-100 rounded-md border border-gray-200">Không thể đổi</span>}
                  </label>
                  <div className={`relative ${isEditing ? "opacity-70" : ""}`}>
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                      <Mail className="w-5 h-5" />
                    </div>
                    <input
                      type="email"
                      value={email}
                      disabled
                      className={`w-full py-3.5 pl-11 pr-4 rounded-xl transition-all font-medium focus:outline-none ${
                        isEditing 
                          ? "bg-gray-100 border border-gray-200 text-gray-600 cursor-not-allowed" 
                          : "bg-transparent border border-transparent text-gray-800"
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons (Only visible when editing) */}
              {isEditing && (
                <div className="pt-8 mt-8 border-t border-gray-100 flex items-center justify-end animate-fadeIn">
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="px-6 py-3.5 text-sm font-semibold text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-xl transition-colors mr-4 cursor-pointer flex items-center gap-2"
                  >
                    <X className="w-4 h-4" />
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || !fullName.trim()}
                    className="bg-[#0f2c59] text-white font-bold px-8 py-3.5 rounded-xl hover:bg-[#0f2c59]/90 hover:shadow-lg hover:shadow-[#0f2c59]/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 disabled:hover:shadow-none"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Đang lưu...
                      </>
                    ) : (
                      <>
                        <Save className="w-5 h-5" />
                        Lưu thay đổi
                      </>
                    )}
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
