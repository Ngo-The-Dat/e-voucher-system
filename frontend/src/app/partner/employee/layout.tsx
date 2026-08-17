"use client";

import React from "react";
import { EmployeeProvider, useEmployee } from "@/context/EmployeeContext";
import EmployeeTopAppBar from "@/components/partner/employee/EmployeeTopAppBar";

function EmployeeLayoutContent({ children }: { children: React.ReactNode }) {
  const { profile } = useEmployee();

  return (
    <div className="min-h-screen bg-background text-on-background flex flex-col w-full antialiased">
      <EmployeeTopAppBar profile={profile} />
      <div className="flex-1 flex flex-col min-w-0 w-full">{children}</div>
    </div>
  );
}

export default function EmployeeLayout({ children }: { children: React.ReactNode }) {
  return (
    <EmployeeProvider>
      <EmployeeLayoutContent>{children}</EmployeeLayoutContent>
    </EmployeeProvider>
  );
}
