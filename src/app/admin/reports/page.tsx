import React from "react";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/shared/PageHeader";
import { MoneyDisplay } from "@/components/budget/MoneyDisplay";
import { BudgetStatusBadge } from "@/components/budget/BudgetStatusBadge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { calculateBudgetMetrics, formatBDT } from "@/lib/money";
import {
  Printer,
  FileSpreadsheet,
  Building2,
  AlertTriangle,
  Flame,
  Layers,
  Calendar,
  CheckCircle2,
} from "lucide-react";
import { format } from "date-fns";

export default async function AdminReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ fy?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") redirect("/login");

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
    return <div className="p-8">No financial year available.</div>;
  }

  // Load all personnel with allocations & expenses
  const personnel = await db.user.findMany({
    where: { role: "PERSONNEL" },
    include: {
      allocations: {
        where: { financialYearId: activeYear.id },
      },
      expenses: {
        where: { financialYearId: activeYear.id },
      },
    },
    orderBy: { name: "asc" },
  });

  let totalAllocatedPaisa = BigInt(0);
  let totalSpentPaisa = BigInt(0);
  let totalPendingPaisa = BigInt(0);

  const personnelReportList = personnel.map((p) => {
    const allocated = p.allocations[0]?.allocatedAmount ?? BigInt(0);
    totalAllocatedPaisa += allocated;

    const spent = p.expenses
      .filter((e) => e.status === "APPROVED")
      .reduce((acc, e) => acc + e.amount, BigInt(0));
    totalSpentPaisa += spent;

    const pending = p.expenses
      .filter((e) => e.status === "PENDING" || e.status === "PROCESSING")
      .reduce((acc, e) => acc + e.amount, BigInt(0));
    totalPendingPaisa += pending;

    const metrics = calculateBudgetMetrics(allocated, spent, pending);

    return {
      user: p,
      allocated,
      spent,
      pending,
      metrics,
    };
  });

  const totalCommittedPaisa = totalSpentPaisa + totalPendingPaisa;
  const orgRemainingPaisa = activeYear.totalBudget - totalCommittedPaisa;

  // Category breakdown across organization
  const allExpenses = await db.expense.findMany({
    where: { financialYearId: activeYear.id },
    include: { category: true },
  });

  const categorySummary: Record<string, { total: bigint; count: number }> = {};
  allExpenses.forEach((e) => {
    const name = e.category.name;
    if (!categorySummary[name]) {
      categorySummary[name] = { total: BigInt(0), count: 0 };
    }
    if (e.status === "APPROVED" || e.status === "PENDING") {
      categorySummary[name].total += e.amount;
      categorySummary[name].count += 1;
    }
  });

  // Flagged list: near limit and over budget
  const flaggedPersonnel = personnelReportList.filter(
    (item) => item.metrics.committedPercentage >= 80
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="কমান্ড বাজেট ও সার্বিক নিরীক্ষা রিপোর্ট (Reports)"
        description={`${activeYear.label} অর্থবছরে সমগ্র সংস্থার বাজেট ব্যবহার, খাতভিত্তিক ব্যয় ও অডিট বিশ্লেষণ প্রতিবেদন।`}
      >
        <Button variant="outline" size="sm" className="print:hidden">
          <Printer className="w-4 h-4 mr-1.5" />
          প্রিন্ট / PDF রিপোর্ট
        </Button>
      </PageHeader>

      {/* Main Report Container */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-8">
        {/* Report Header */}
        <div className="border-b border-slate-200 pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-widest text-[#0d2847]">
              নৌ সদর দপ্তর &bull; প্রশাসনিক পরিদপ্তর
            </span>
            <h2 className="text-xl font-bold text-slate-900">
              বার্ষিক আর্থিক অডিট ও ইউনিট ব্যয় প্রতিবেদন (Annual Fiscal Audit)
            </h2>
            <p className="text-xs text-slate-500 font-mono">
              অডিট সময়কাল: {activeYear.label} &bull; প্রস্তুতের সময়: {format(new Date(), "dd MMMM yyyy, HH:mm")}
            </p>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1 sm:text-right">
            <p className="font-bold text-slate-900">{user.name}</p>
            <p className="text-slate-600">{user.rank} &bull; {user.serviceId}</p>
            <p className="text-slate-500">নৌ প্রশাসন পরিদপ্তর (Naval HQ)</p>
          </div>
        </div>

        {/* Top Organization Financial Position */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-5 bg-slate-50 rounded-xl border border-slate-200 text-center">
          <div>
            <span className="text-[10px] font-bold uppercase text-slate-500">
              সংস্থার বাজেট সিলিং
            </span>
            <p className="text-lg font-bold font-mono text-blue-950 mt-1">
              {formatBDT(activeYear.totalBudget)}
            </p>
          </div>

          <div>
            <span className="text-[10px] font-bold uppercase text-slate-500">
              মোট বরাদ্দকৃত তহবিল
            </span>
            <p className="text-lg font-bold font-mono text-slate-800 mt-1">
              {formatBDT(totalAllocatedPaisa)}
            </p>
            <span className="text-[10px] text-slate-400">
              {((Number(totalAllocatedPaisa) / Number(activeYear.totalBudget)) * 100).toFixed(1)}% সিলিংয়ের
            </span>
          </div>

          <div>
            <span className="text-[10px] font-bold uppercase text-slate-500">
              অব্যয়িত কমান্ড রিজার্ভ
            </span>
            <p className="text-lg font-bold font-mono text-amber-700 mt-1">
              {formatBDT(activeYear.totalBudget - totalAllocatedPaisa)}
            </p>
            <span className="text-[10px] text-slate-400">
              {((Number(activeYear.totalBudget - totalAllocatedPaisa) / Number(activeYear.totalBudget)) * 100).toFixed(1)}% রিজার্ভ
            </span>
          </div>

          <div>
            <span className="text-[10px] font-bold uppercase text-slate-500">
              বরাদ্দপ্রাপ্ত কর্মকর্তা
            </span>
            <p className="text-lg font-bold font-mono text-emerald-700 mt-1">
              {personnel.length}{" "}
              <span className="text-xs font-normal text-slate-500">জন কমিশনপ্রাপ্ত</span>
            </p>
            <span className="text-[10px] text-slate-400">
              ১০০% সক্রিয় নৌ সার্ভিস
            </span>
          </div>
        </div>

        {/* Flagged / Near Limit Alert Section */}
        {flaggedPersonnel.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-amber-700 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              উচ্চ ব্যয় পর্যবেক্ষণ তালিকা (&ge; ৮০% ব্যয়কৃত)
            </h3>
            <div className="border border-amber-200 bg-amber-50/30 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-amber-100/60 text-[11px] font-bold uppercase text-amber-900">
                  <tr>
                    <th className="py-2.5 px-3">কর্মকর্তা ও সার্ভিস আইডি</th>
                    <th className="py-2.5 px-3">ইউনিট</th>
                    <th className="py-2.5 px-3 text-right">বরাদ্দকৃত</th>
                    <th className="py-2.5 px-3 text-right">ব্যয়কৃত</th>
                    <th className="py-2.5 px-3 text-right">অবশিষ্ট</th>
                    <th className="py-2.5 px-3 text-center">স্ট্যাটাস</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-amber-100">
                  {flaggedPersonnel.map((item) => (
                    <tr key={item.user.id} className="hover:bg-amber-50/60">
                      <td className="py-2 px-3">
                        <span className="font-bold text-slate-900 block">
                          {item.user.name}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {item.user.serviceId}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-slate-600">
                        {item.user.unit}
                      </td>
                      <td className="py-2 px-3 text-right font-mono font-semibold">
                        {formatBDT(item.allocated)}
                      </td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                        {formatBDT(item.metrics.committedPaisa)} ({item.metrics.committedPercentage.toFixed(1)}%)
                      </td>
                      <td
                        className={`py-2 px-3 text-right font-mono font-bold ${
                          item.metrics.isOverBudget ? "text-rose-600" : "text-slate-800"
                        }`}
                      >
                        {formatBDT(item.metrics.availablePaisa)}
                      </td>
                      <td className="py-2 px-3 text-center">
                        <BudgetStatusBadge
                          status={item.metrics.statusLevel}
                          showIcon={false}
                          className="text-[10px]"
                          bangla
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Organization Category Spending Report */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#0d2847]" />
            সংস্থার খাতভিত্তিক ব্যয় বিবরণী
          </h3>
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-[11px] font-bold uppercase text-slate-600">
                <tr>
                  <th className="py-2.5 px-4">প্রকিউরমেন্ট খাত</th>
                  <th className="py-2.5 px-4 text-center">মোট ভাউচার</th>
                  <th className="py-2.5 px-4 text-right">ব্যয়কৃত পরিমাণ (BDT)</th>
                  <th className="py-2.5 px-4 text-right">বাজেটের শতকরা হার</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {Object.entries(categorySummary).map(([catName, data]) => {
                  const percent =
                    activeYear.totalBudget > BigInt(0)
                      ? Number((data.total * BigInt(1000)) / activeYear.totalBudget) / 10
                      : 0;

                  return (
                    <tr key={catName} className="hover:bg-slate-50">
                      <td className="py-2.5 px-4 font-semibold text-slate-800">
                        {catName}
                      </td>
                      <td className="py-2.5 px-4 text-center text-slate-500 font-mono">
                        {data.count}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono font-bold text-slate-900">
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

        {/* Complete Personnel Utilization Roster */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-[#0d2847]" />
            সকল কর্মকর্তার বাজেট বরাদ্দ ও ব্যয় খতিয়ান ({personnelReportList.length} জন কর্মকর্তা)
          </h3>
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-[11px] font-bold uppercase text-slate-600">
                <tr>
                  <th className="py-2.5 px-3">কর্মকর্তা</th>
                  <th className="py-2.5 px-3">সার্ভিস আইডি</th>
                  <th className="py-2.5 px-3 text-right">বরাদ্দকৃত</th>
                  <th className="py-2.5 px-3 text-right">ব্যয়কৃত</th>
                  <th className="py-2.5 px-3 text-right">প্রক্রিয়াধীন</th>
                  <th className="py-2.5 px-3 text-right">অবশিষ্ট</th>
                  <th className="py-2.5 px-3 text-center">ব্যয়ের হার</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {personnelReportList.map((item) => (
                  <tr key={item.user.id} className="hover:bg-slate-50">
                    <td className="py-2 px-3 font-semibold text-slate-900">
                      {item.user.name}
                    </td>
                    <td className="py-2 px-3 font-mono text-slate-500">
                      {item.user.serviceId}
                    </td>
                    <td className="py-2 px-3 text-right font-mono">
                      {formatBDT(item.allocated)}
                    </td>
                    <td className="py-2 px-3 text-right font-mono text-slate-800">
                      {formatBDT(item.spent)}
                    </td>
                    <td className="py-2 px-3 text-right font-mono text-amber-600">
                      {item.pending > BigInt(0) ? formatBDT(item.pending) : "—"}
                    </td>
                    <td
                      className={`py-2 px-3 text-right font-mono font-bold ${
                        item.metrics.isOverBudget ? "text-rose-600" : "text-emerald-700"
                      }`}
                    >
                      {formatBDT(item.metrics.availablePaisa)}
                    </td>
                    <td className="py-2 px-3 text-center">
                      <span
                        className={`font-mono text-[11px] font-bold ${
                          item.metrics.committedPercentage > 100
                            ? "text-rose-600"
                            : item.metrics.committedPercentage >= 80
                            ? "text-amber-600"
                            : "text-slate-700"
                        }`}
                      >
                        {item.metrics.committedPercentage.toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Formal Signature Footer */}
        <div className="pt-8 border-t border-slate-200 grid grid-cols-2 gap-8 text-xs text-slate-500">
          <div>
            <p className="font-semibold text-slate-800">পরিচালক, নৌ প্রশাসন পরিদপ্তর</p>
            <div className="h-12 border-b border-dashed border-slate-300 mt-2" />
            <p className="mt-1 font-mono text-[11px]">Commodore K. M. Tariqul Islam, ndc, psc</p>
          </div>
          <div>
            <p className="font-semibold text-slate-800">প্রিন্সিপাল স্টাফ অফিসার প্রত্যায়ন</p>
            <div className="h-12 border-b border-dashed border-slate-300 mt-2" />
            <p className="mt-1 font-mono text-[11px]">নৌ সদর দপ্তর, ঢাকা</p>
          </div>
        </div>
      </div>
    </div>
  );
}
