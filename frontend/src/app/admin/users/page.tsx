"use client";

import Icon from "@/components/shared/ui/Icon";

import { useState } from "react";
import Link from "next/link";
import { Input } from "@/components/shared/ui/Input";
import { Button } from "@/components/shared/ui/Button";

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
      avatarBg: "bg-primary-fixed text-primary",
      email: "nva@email.com",
      role: "Khách hàng",
      status: "Đang hoạt động",
    },
    {
      id: "USR-002",
      name: "Trần Thị B",
      avatarInitials: "TB",
      avatarBg: "bg-amber-100 text-amber-900",
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
    <div className="max-w-container-max mx-auto space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-text-main mb-1">
          Quản lý người dùng
        </h1>
        <p className="text-sm text-text-muted">
          Quản lý và phân quyền tài khoản người dùng trên hệ thống.
        </p>
      </div>

      {/* Filters & Toolbar */}
      <div className="bg-surface p-4 rounded-xl shadow-sm border border-border flex flex-col md:flex-row gap-4 items-center justify-between">
        {/* Search Input */}
        <div className="w-full md:w-96 relative">
          <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted z-10" />
          <Input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo tên đăng nhập, email hoặc số điện thoại"
            className="w-full pl-10 pr-4 py-2.5 bg-surface border-border rounded-lg text-sm"
          />
        </div>

        {/* Filters Group */}
        <div className="flex flex-wrap gap-3 w-full md:w-auto items-center">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-4 py-2.5 bg-surface border border-border rounded-lg text-sm text-text-main focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 appearance-none pr-10 relative bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2364748B%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[position:right_12px_center] bg-[length:16px_16px]"
          >
            <option value="">Vai trò: Tất cả</option>
            <option value="customer">Khách hàng</option>
            <option value="partner">Đối tác</option>
            <option value="admin">Quản trị viên</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2.5 bg-surface border border-border rounded-lg text-sm text-text-main focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 appearance-none pr-10 relative bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2364748B%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[position:right_12px_center] bg-[length:16px_16px]"
          >
            <option value="">Trạng thái: Tất cả</option>
            <option value="active">Đang hoạt động</option>
            <option value="locked">Đã khóa</option>
          </select>

          <Button
            variant="ghost"
            onClick={handleReset}
            className="text-text-muted bg-slate-100 hover:bg-slate-200"
          >
            <Icon name="filter_alt_off" className="text-[20px] mr-2" />
            <span>Đặt lại</span>
          </Button>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-surface rounded-xl shadow-sm border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 text-slate-500 text-xs font-bold uppercase tracking-wider border-b border-slate-200/80">
                <th className="py-4 px-5">Người dùng</th>
                <th className="py-4 px-5 hidden md:table-cell">Liên hệ</th>
                <th className="py-4 px-5">Vai trò</th>
                <th className="py-4 px-5">Trạng thái</th>
                <th className="py-4 px-5 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-base">
              {filteredUsers.map((user) => (
                <tr
                  key={user.id}
                  className={`hover:bg-slate-50/60 transition ${
                    user.status === "Đã khóa" ? "opacity-75" : ""
                  }`}
                >
                  <td className="py-4 px-5">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${user.avatarBg}`}
                      >
                        {user.avatarInitials}
                      </div>
                      <div>
                        <div
                          className={`font-semibold text-text-main text-[16px] ${
                            user.status === "Đã khóa"
                              ? "line-through decoration-text-muted/50"
                              : ""
                          }`}
                        >
                          {user.name}
                        </div>
                        <div className="text-text-muted text-xs md:hidden">
                          {user.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-5 text-text-muted hidden md:table-cell">
                    {user.email}
                  </td>
                  <td className="py-4 px-5">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        user.role === "Đối tác"
                          ? "bg-amber-100 text-amber-900 border border-amber-200"
                          : user.role === "Quản trị viên"
                          ? "bg-purple-100 text-purple-800"
                          : "bg-slate-200 text-slate-800"
                      }`}
                    >
                      {user.role}
                    </span>
                  </td>
                  <td className="py-4 px-5">
                    {user.status === "Đang hoạt động" ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 mr-1.5" />
                        Đang hoạt động
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                        <Icon name="lock" className="text-[14px] mr-1" />
                        Đã khóa
                      </span>
                    )}
                  </td>
                  <td className="py-4 px-5 text-right">
                    <Link
                      href={`/admin/users/${user.id}`}
                      className="px-4 py-2 text-primary bg-blue-50 hover:bg-blue-100 rounded-lg text-xs font-bold transition-colors inline-flex items-center gap-2"
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
