"use client";

import Icon from "@/components/shared/ui/Icon";
import { useState } from "react";
import Link from "next/link";
import { Input } from "@/components/shared/ui/Input";

interface User {
  id: string;
  name: string;
  avatarInitials: string;
  avatarBg: string;
  email: string;
  role: "Khách hàng" | "Đối tác" | "Quản trị viên";
  status: "Đang hoạt động" | "Đã khóa";
}

export default function UserManagementPage() {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const initialUsers: User[] = [
    {
      id: "USR-001",
      name: "Nguyễn Văn A",
      avatarInitials: "NA",
      avatarBg: "bg-blue-100 text-blue-700",
      email: "nva@email.com",
      role: "Khách hàng",
      status: "Đang hoạt động",
    },
    {
      id: "USR-002",
      name: "Trần Thị B",
      avatarInitials: "TB",
      avatarBg: "bg-amber-100 text-amber-800",
      email: "bpartner@email.com",
      role: "Đối tác",
      status: "Đang hoạt động",
    },
    {
      id: "USR-003",
      name: "Lê Văn C",
      avatarInitials: "LC",
      avatarBg: "bg-slate-200 text-slate-600",
      email: "lvc_lock@email.com",
      role: "Khách hàng",
      status: "Đã khóa",
    },
  ];

  const handleReset = () => {
    setSearch("");
    setRoleFilter("");
    setStatusFilter("");
  };

  const filteredUsers = initialUsers.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());

    const matchesRole =
      !roleFilter ||
      (roleFilter === "customer" && u.role === "Khách hàng") ||
      (roleFilter === "partner" && u.role === "Đối tác") ||
      (roleFilter === "admin" && u.role === "Quản trị viên");

    const matchesStatus =
      !statusFilter ||
      (statusFilter === "active" && u.status === "Đang hoạt động") ||
      (statusFilter === "locked" && u.status === "Đã khóa");

    return matchesSearch && matchesRole && matchesStatus;
  });

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
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200/80 flex flex-col md:flex-row gap-4 items-center justify-between">
        {/* Search Input */}
        <div className="w-full md:w-96 relative">
          <Icon name="search" className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-lg z-10" />
          <Input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo tên đăng nhập, email hoặc số điện thoại"
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-sm placeholder:text-slate-400 text-slate-800 focus:bg-white transition"
          />
        </div>

        {/* Filters Group */}
        <div className="flex flex-wrap gap-3 w-full md:w-auto items-center">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 font-medium focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 appearance-none pr-10 relative bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2364748B%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[position:right_12px_center] bg-[length:16px_16px]"
          >
            <option value="">Vai trò: Tất cả</option>
            <option value="customer">Khách hàng</option>
            <option value="partner">Đối tác</option>
            <option value="admin">Quản trị viên</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 font-medium focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 appearance-none pr-10 relative bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2364748B%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[position:right_12px_center] bg-[length:16px_16px]"
          >
            <option value="">Trạng thái: Tất cả</option>
            <option value="active">Đang hoạt động</option>
            <option value="locked">Đã khóa</option>
          </select>

          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-semibold transition cursor-pointer"
          >
            <Icon name="filter_alt_off" className="text-lg text-slate-500" />
            <span>Đặt lại</span>
          </button>
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
              {filteredUsers.map((user) => (
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
                        <div
                          className={`font-bold text-slate-900 text-sm ${user.status === "Đã khóa"
                              ? "line-through text-slate-500"
                              : ""
                            }`}
                        >
                          {user.name}
                        </div>
                        <div className="text-slate-400 text-xs md:hidden mt-0.5">
                          {user.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-slate-500 text-sm hidden md:table-cell">
                    {user.email}
                  </td>
                  <td className="py-4 px-6">
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-xs ${user.role === "Đối tác"
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
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
