import React from "react";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/shared/Sidebar";
import { MobileNav } from "@/components/shared/MobileNav";
import { db } from "@/lib/db";
import { FinancialYearSelector } from "@/components/shared/FinancialYearSelector";
import { ShieldCheck } from "lucide-react";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  // Authorization: Only Admin can access admin routes
  if (user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const financialYears = await db.financialYear.findMany({
    orderBy: { year: "desc" },
    select: { id: true, year: true, label: true, status: true },
  });

  const activeYear =
    financialYears.find((fy) => fy.status === "ACTIVE") || financialYears[0];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row text-slate-900">
      <MobileNav user={user as any} />
      <Sidebar user={user as any} />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Admin Header */}
        <header className="hidden lg:flex items-center justify-between px-8 py-4 bg-white border-b border-slate-200/80 sticky top-0 z-30 shadow-2xs">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#0d2847] bg-[#0d2847]/10 px-2.5 py-1 rounded-lg border border-[#0d2847]/20">
              <ShieldCheck className="w-4 h-4 text-[#d4af37]" />
              HQ Administrative Command
            </span>
            <span className="text-slate-300">/</span>
            <span className="text-xs font-semibold text-slate-600">
              Naval Headquarters &bull; Finance &amp; Procurement Wing
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
              <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-blue-100 text-blue-900 font-mono">
                Admin
              </span>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
