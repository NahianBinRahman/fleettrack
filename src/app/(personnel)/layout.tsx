import React from "react";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/shared/Sidebar";
import { MobileNav } from "@/components/shared/MobileNav";
import { db } from "@/lib/db";
import { FinancialYearSelector } from "@/components/shared/FinancialYearSelector";

export default async function PersonnelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  // Get active and available financial years
  const financialYears = await db.financialYear.findMany({
    orderBy: { year: "desc" },
    select: { id: true, year: true, label: true, status: true },
  });

  const activeYear =
    financialYears.find((fy) => fy.status === "ACTIVE") || financialYears[0];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row text-slate-900">
      {/* Mobile Top Navigation */}
      <MobileNav user={user as any} />

      {/* Desktop Sidebar */}
      <Sidebar user={user as any} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header Bar */}
        <header className="hidden lg:flex items-center justify-between px-8 py-4 bg-white border-b border-slate-200/80 sticky top-0 z-30 shadow-2xs">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Officer Portal
            </span>
            <span className="text-slate-300">/</span>
            <span className="text-xs font-semibold text-slate-700">
              {user.unit || "Naval Unit"}
            </span>
          </div>

          <div className="flex items-center gap-4">
            {activeYear && (
              <FinancialYearSelector
                years={financialYears}
                currentYearId={activeYear.id}
              />
            )}
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
              <span className="text-xs font-bold text-slate-800">{user.name}</span>
              <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                {user.serviceId}
              </span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
