import React from "react";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { calculateBudgetMetrics, formatBDT } from "@/lib/money";
import { PageHeader } from "@/components/shared/PageHeader";
import { MoneyDisplay } from "@/components/budget/MoneyDisplay";
import { ExpenseStatusBadge } from "@/components/budget/ExpenseStatusBadge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Printer,
  Download,
  FileBarChart,
  Shield,
  Calendar,
  Layers,
  CheckCircle2,
} from "lucide-react";
import { format } from "date-fns";

export default async function PersonnelReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ fy?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const resolvedParams = await searchParams;

  let activeYear;
  if (resolvedParams?.fy) {
    activeYear = await db.financialYear.findUnique({
      where: { id: resolvedParams.fy },
    });
  }
  if (!activeYear) {
    activeYear = await db.financialYear.findFirst({
      where: { status: "ACTIVE" },
    });
  }
  if (!activeYear) {
    activeYear = await db.financialYear.findFirst({
      orderBy: { year: "desc" },
    });
  }

  if (!activeYear) {
    return <div className="p-8">No financial year active.</div>;
  }

  // Load allocation
  const allocation = await db.budgetAllocation.findUnique({
    where: {
      userId_financialYearId: {
        userId: user.id,
        financialYearId: activeYear.id,
      },
    },
  });

  const allocatedPaisa = allocation?.allocatedAmount ?? BigInt(0);

  // Load all expenses
  const expenses = await db.expense.findMany({
    where: {
      userId: user.id,
      financialYearId: activeYear.id,
    },
    include: { category: true },
    orderBy: { date: "asc" },
  });

  const spentPaisa = expenses
    .filter((e) => e.status === "APPROVED")
    .reduce((acc, e) => acc + e.amount, BigInt(0));

  const pendingPaisa = expenses
    .filter((e) => e.status === "PENDING" || e.status === "PROCESSING")
    .reduce((acc, e) => acc + e.amount, BigInt(0));

  const metrics = calculateBudgetMetrics(allocatedPaisa, spentPaisa, pendingPaisa);

  // Group by category
  const categorySummary: Record<string, { total: bigint; count: number }> = {};
  expenses.forEach((e) => {
    const name = e.category.name;
    if (!categorySummary[name]) {
      categorySummary[name] = { total: BigInt(0), count: 0 };
    }
    if (e.status === "APPROVED" || e.status === "PENDING") {
      categorySummary[name].total += e.amount;
      categorySummary[name].count += 1;
    }
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Personal Expenditure Report"
        description={`Formal annual financial statement for ${user.rank || ""} ${user.name} (${user.serviceId}) for ${activeYear.label}.`}
      >
        <Button variant="outline" size="sm" onClick={undefined} className="print:hidden">
          <Printer className="w-4 h-4 mr-1.5" />
          Print / Export PDF
        </Button>
      </PageHeader>

      {/* Official Institutional Report Container */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-8">
        {/* Report Official Heading */}
        <div className="border-b border-slate-200 pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-widest text-[#0d2847]">
              Bangladesh Navy &bull; Administrative Directorate
            </span>
            <h2 className="text-xl font-bold text-slate-900">
              Annual Budget Utilization &amp; Expense Audit
            </h2>
            <p className="text-xs text-slate-500 font-mono">
              Audit Period: {activeYear.label} &bull; Generated: {format(new Date(), "dd MMMM yyyy, HH:mm")}
            </p>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1 sm:text-right">
            <p className="font-bold text-slate-900">{user.name}</p>
            <p className="text-slate-600">{user.serviceId} &bull; {user.rank}</p>
            <p className="text-slate-500">{user.unit || "Naval Unit"}</p>
          </div>
        </div>

        {/* Financial Summary KPI Matrix */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-5 bg-slate-50 rounded-xl border border-slate-200 text-center">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Sanctioned Budget
            </span>
            <p className="text-lg font-bold font-mono text-blue-950 mt-1">
              {formatBDT(metrics.allocatedPaisa)}
            </p>
          </div>

          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Total Spent (Approved)
            </span>
            <p className="text-lg font-bold font-mono text-slate-800 mt-1">
              {formatBDT(metrics.spentPaisa)}
            </p>
            <span className="text-[10px] text-slate-400">
              {metrics.spentPercentage.toFixed(1)}% utilized
            </span>
          </div>

          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Pending Processing
            </span>
            <p className="text-lg font-bold font-mono text-amber-600 mt-1">
              {formatBDT(metrics.pendingPaisa)}
            </p>
          </div>

          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Uncommitted Balance
            </span>
            <p
              className={`text-lg font-bold font-mono mt-1 ${
                metrics.isOverBudget ? "text-rose-600" : "text-emerald-700"
              }`}
            >
              {formatBDT(metrics.availablePaisa)}
            </p>
            <span className="text-[10px] text-slate-400">
              {metrics.isOverBudget ? "Exceeded" : `${(100 - metrics.committedPercentage).toFixed(1)}% free`}
            </span>
          </div>
        </div>

        {/* Category Breakdown Table */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#0d2847]" />
            Category-wise Expenditure Summary
          </h3>
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-[11px] font-bold uppercase text-slate-600">
                <tr>
                  <th className="py-2.5 px-4">Category</th>
                  <th className="py-2.5 px-4 text-center">Vouchers</th>
                  <th className="py-2.5 px-4 text-right">Committed (BDT)</th>
                  <th className="py-2.5 px-4 text-right">% of Allocation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {Object.entries(categorySummary).map(([catName, data]) => {
                  const percent =
                    allocatedPaisa > BigInt(0)
                      ? Number((data.total * BigInt(1000)) / allocatedPaisa) / 10
                      : 0;

                  return (
                    <tr key={catName} className="hover:bg-slate-50">
                      <td className="py-2.5 px-4 font-semibold text-slate-800">
                        {catName}
                      </td>
                      <td className="py-2.5 px-4 text-center text-slate-500 font-mono">
                        {data.count}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono font-semibold text-slate-900">
                        {formatBDT(data.total)}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono text-slate-600">
                        {percent.toFixed(1)}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Complete Transaction History Table */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#0d2847]" />
            Itemized Voucher Ledger
          </h3>
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-[11px] font-bold uppercase text-slate-600">
                <tr>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Reference #</th>
                  <th className="py-2.5 px-3">Voucher Title</th>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Amount (BDT)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {expenses.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-slate-400">
                      No vouchers found.
                    </td>
                  </tr>
                ) : (
                  expenses.map((exp) => (
                    <tr key={exp.id} className="hover:bg-slate-50">
                      <td className="py-2 px-3 font-mono text-slate-600 whitespace-nowrap">
                        {format(new Date(exp.date), "dd/MM/yyyy")}
                      </td>
                      <td className="py-2 px-3 font-mono text-slate-500">
                        {exp.referenceNumber}
                      </td>
                      <td className="py-2 px-3 font-medium text-slate-900 max-w-xs truncate">
                        {exp.title}
                      </td>
                      <td className="py-2 px-3 text-slate-600">
                        {exp.category.name}
                      </td>
                      <td className="py-2 px-3">
                        <ExpenseStatusBadge status={exp.status} />
                      </td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                        {formatBDT(exp.amount)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Official Certification Footer */}
        <div className="pt-8 border-t border-slate-200 grid grid-cols-2 gap-8 text-xs text-slate-500">
          <div>
            <p className="font-semibold text-slate-800">Officer Signature &amp; Seal</p>
            <div className="h-12 border-b border-dashed border-slate-300 mt-2" />
            <p className="mt-1 font-mono text-[11px]">{user.name} ({user.serviceId})</p>
          </div>
          <div>
            <p className="font-semibold text-slate-800">Administrative Officer Verification</p>
            <div className="h-12 border-b border-dashed border-slate-300 mt-2" />
            <p className="mt-1 font-mono text-[11px]">Naval Administrative Directorate</p>
          </div>
        </div>
      </div>
    </div>
  );
}
