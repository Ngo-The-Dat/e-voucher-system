"use client";

import Icon from "@/components/shared/ui/Icon";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Input } from "@/components/shared/ui/Input";
import Pagination from "@/components/shared/ui/Pagination";
import FormField from "@/components/shared/ui/FormField";
import { adminApi, AdminUserListItem } from "@/lib/admin-api";

interface UserDisplay {
  id: string | number;
  name: string;
  avatarInitials: string;
  avatarBg: string;
  email: string;
  phone: string;
  role: "Khách hàng" | "Đối tác" | "Quản trị viên" | "Nhân viên đối tác";
  rawRole: string;
  status: "Đang hoạt động" | "Đã khóa";
}

const getInitials = (name: string): string => {
  const parts = name.trim().split(" ");
  if (parts.length === 0) return "U";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const getAvatarBg = (role: string, index: number): string => {
  if (role === "PARTNER") return "bg-amber-100 text-amber-800";
  if (role === "ADMIN") return "bg-purple-100 text-purple-800";
  const colors = [
    "bg-blue-100 text-blue-700",
    "bg-emerald-100 text-emerald-700",
    "bg-indigo-100 text-indigo-700",
    "bg-rose-100 text-rose-700",
  ];
  return colors[index % colors.length];
};

const mapRole = (role: string): UserDisplay["role"] => {
  switch (role) {
    case "PARTNER":
      return "Đối tác";
    case "ADMIN":
      return "Quản trị viên";
    case "PARTNER_EMPLOYEE":
      return "Nhân viên đối tác";
    default:
      return "Khách hàng";
  }
};

const mapStatus = (status: string): UserDisplay["status"] => {
  return status === "LOCKED" ? "Đã khóa" : "Đang hoạt động";
};

export default function UserManagementPage() {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [users, setUsers] = useState<UserDisplay[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await adminApi.getUsers({
        search: search.trim() || undefined,
        role: roleFilter || undefined,
        status: statusFilter || undefined,
        page: currentPage,
        limit: itemsPerPage,
      });

      if (res && Array.isArray(res.users)) {
        const formatted: UserDisplay[] = res.users.map((u: AdminUserListItem, idx: number) => ({
          id: u.user_id,
          name: u.full_name,
          avatarInitials: getInitials(u.full_name),
          avatarBg: u.status === "LOCKED" ? "bg-slate-200 text-slate-600" : getAvatarBg(u.role, idx),
          email: u.email,
          phone: u.phone || "—",
          role: mapRole(u.role),
          rawRole: u.role,
          status: mapStatus(u.status),
        }));
        setUsers(formatted);
        setTotalPages(res.pagination?.totalPages || 1);
        setTotalItems(res.pagination?.total || formatted.length);
      } else {
        setUsers([]);
        setTotalPages(1);
        setTotalItems(0);
      }
    } catch {
      setUsers([]);
      setTotalPages(1);
      setTotalItems(0);
    } finally {
      setLoading(false);
    }
  }, [search, roleFilter, statusFilter, currentPage]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUsers();
    }, 250);
    return () => clearTimeout(timer);
  }, [fetchUsers]);

  const handleReset = () => {
    setSearch("");
    setRoleFilter("");
    setStatusFilter("");
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Quản lý người dùng
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Quản lý và phân quyền tài khoản người dùng trên hệ thống.
        </p>
      </div>

      {/* Filters & Toolbar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-slate-200/80">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          {/* Search Input */}
          <div className="md:col-span-2">
            <FormField label="Tìm kiếm người dùng">
              <div className="relative">
                <Icon name="search" className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-lg z-10" />
                <Input
                  type="text"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setCurrentPage(1);
                  }}
                  placeholder="Tìm theo tên đăng nhập, email hoặc số điện thoại..."
                  className="w-full h-[38px] pl-10 pr-4 bg-slate-50/50 border border-slate-200 rounded-xl text-sm placeholder:text-slate-400 text-slate-800 focus:bg-white transition"
                />
              </div>
            </FormField>
          </div>

          {/* Vai trò Filter */}
          <div>
            <FormField label="Vai trò">
              <div className="relative">
                <select
                  value={roleFilter}
                  onChange={(e) => {
                    setRoleFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full h-[38px] pl-3.5 pr-9 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 font-medium focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 appearance-none cursor-pointer"
                >
                  <option value="">Tất cả</option>
                  <option value="CUSTOMER">Khách hàng</option>
                  <option value="PARTNER">Đối tác</option>
                  <option value="PARTNER_EMPLOYEE">Nhân viên đối tác</option>
                </select>
                <Icon name="expand_more" className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg pointer-events-none" />
              </div>
            </FormField>
          </div>

          {/* Trạng thái Filter */}
          <div>
            <FormField label="Trạng thái">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <select
                    value={statusFilter}
                    onChange={(e) => {
                      setStatusFilter(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full h-[38px] pl-3.5 pr-9 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 font-medium focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 appearance-none cursor-pointer"
                  >
                    <option value="">Tất cả</option>
                    <option value="ACTIVE">Đang hoạt động</option>
                    <option value="LOCKED">Đã khóa</option>
                  </select>
                  <Icon name="expand_more" className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg pointer-events-none" />
                </div>

                <button
                  type="button"
                  onClick={handleReset}
                  className="h-[38px] px-3 bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-800 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-1 shrink-0"
                  title="Đặt lại bộ lọc"
                >
                  <Icon name="filter_alt_off" className="text-base" />
                  <span>Đặt lại</span>
                </button>
              </div>
            </FormField>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 text-[11px] font-bold uppercase tracking-wider">
                <th className="py-4 px-6">Người dùng</th>
                <th className="py-4 px-6 hidden md:table-cell">Liên hệ</th>
                <th className="py-4 px-6">Vai trò</th>
                <th className="py-4 px-6">Trạng thái</th>
                <th className="py-4 px-6 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {loading && users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    <Icon name="progress_activity" className="inline-block animate-spin text-2xl mb-2 text-primary" />
                    <p className="text-sm">Đang tải danh sách người dùng...</p>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    <Icon name="search" className="inline-block text-3xl mb-2 text-slate-300" />
                    <p className="text-sm font-medium">Không tìm thấy người dùng phù hợp</p>
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr
                    key={user.id}
                    className="hover:bg-slate-50/60 transition"
                  >
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3.5">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${user.avatarBg}`}
                        >
                          {user.avatarInitials}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 text-sm">
                            {user.name}
                          </div>
                          <div className="text-slate-400 text-xs md:hidden mt-0.5">
                            {user.email} {user.phone !== "—" && `• ${user.phone}`}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-slate-500 text-sm hidden md:table-cell">
                      <div>{user.email}</div>
                      {user.phone && user.phone !== "—" && (
                        <div className="text-xs text-slate-400 mt-0.5">{user.phone}</div>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs ${
                          user.role === "Đối tác"
                            ? "bg-amber-100 text-amber-800 font-semibold"
                            : user.role === "Quản trị viên"
                            ? "bg-purple-100 text-purple-800 font-semibold"
                            : "bg-slate-100 text-slate-600 font-medium"
                        }`}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      {user.status === "Đang hoạt động" ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          Đang hoạt động
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-600 border border-rose-100">
                          <Icon name="lock" className="text-xs" />
                          Đã khóa
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <Link
                        href={`/admin/users/${user.id}`}
                        className="px-3.5 py-1.5 text-blue-600 bg-blue-50 hover:bg-blue-600 hover:text-white rounded-lg text-xs font-semibold transition-colors inline-flex items-center"
                      >
                        Xem chi tiết
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {totalItems > 0 && (
          <div className="p-4 border-t border-slate-100">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalItems}
              itemsPerPage={itemsPerPage}
              onPageChange={(page) => setCurrentPage(page)}
              itemName="người dùng"
            />
          </div>
        )}
      </div>
    </div>
  );
}
