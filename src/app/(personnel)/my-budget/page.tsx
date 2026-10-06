import React from "react";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { calculateBudgetMetrics, formatBDT } from "@/lib/money";
import { PageHeader } from "@/components/shared/PageHeader";
import { BudgetStatusBadge } from "@/components/budget/BudgetStatusBadge";
import { MoneyDisplay } from "@/components/budget/MoneyDisplay";
import { BudgetProgressRing } from "@/components/budget/BudgetProgressRing";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Wallet,
  ShieldCheck,
  History,
  Tag,
  CheckCircle2,
  Calendar,
  AlertCircle,
  FileCheck,
} from "lucide-react";
import { format } from "date-fns";

export default async function MyBudgetPage({
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
    return <div className="p-8">No financial year available.</div>;
  }

  // Load allocation with history
  const allocation = await db.budgetAllocation.findUnique({
    where: {
      userId_financialYearId: {
        userId: user.id,
        financialYearId: activeYear.id,
      },
    },
    include: {
      history: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

  const allocatedPaisa = allocation?.allocatedAmount ?? BigInt(0);

  // Load user expenses
  const expenses = await db.expense.findMany({
    where: {
      userId: user.id,
      financialYearId: activeYear.id,
    },
    include: { category: true },
  });

  const spentPaisa = expenses
    .filter((e) => e.status === "APPROVED")
    .reduce((acc, e) => acc + e.amount, BigInt(0));

  const pendingPaisa = expenses
    .filter((e) => e.status === "PENDING" || e.status === "PROCESSING")
    .reduce((acc, e) => acc + e.amount, BigInt(0));

  const metrics = calculateBudgetMetrics(allocatedPaisa, spentPaisa, pendingPaisa);

  // Group by category
  const categorySummary: Record<string, { spent: bigint; count: number }> = {};
  expenses.forEach((e) => {
    const name = e.category.name;
    if (!categorySummary[name]) {
      categorySummary[name] = { spent: BigInt(0), count: 0 };
    }
    if (e.status === "APPROVED" || e.status === "PENDING") {
      categorySummary[name].spent += e.amount;
      categorySummary[name].count += 1;
    }
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Annual Budget Allocation"
        description={`Authoritative budget authorization breakdown for ${user.name} (${user.serviceId}) across ${activeYear.label}.`}
        badge={<BudgetStatusBadge status={metrics.statusLevel} />}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Radial Visualization */}
        <div className="lg:col-span-1">
          <BudgetProgressRing metrics={metrics} />
        </div>

        {/* Right Column: Allocation Directive & Key Metrics */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-slate-200/80 shadow-xs">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[#0d2847]" />
                Official Allocation Quota
              </CardTitle>
              <CardDescription>
                Sanctioned ceiling approved by Naval Administrative Directorate
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200/80 text-center">
                <div>
                  <span className="text-[11px] text-slate-500 font-semibold uppercase">
                    Sanctioned Allocation
                  </span>
                  <div className="mt-1">
                    <MoneyDisplay
                      amountInPaisa={allocatedPaisa}
                      size="xl"
                      color="blue"
                    />
                  </div>
                </div>

                <div>
                  <span className="text-[11px] text-slate-500 font-semibold uppercase">
                    Total Committed
                  </span>
                  <div className="mt-1">
                    <MoneyDisplay
                      amountInPaisa={metrics.committedPaisa}
                      size="xl"
                      color="amber"
                    />
                  </div>
                  <span className="text-[10px] text-slate-400">
                    {metrics.committedPercentage.toFixed(1)}% of ceiling
                  </span>
                </div>

                <div>
                  <span className="text-[11px] text-slate-500 font-semibold uppercase">
                    Available Balance
                  </span>
                  <div className="mt-1">
                    <MoneyDisplay
                      amountInPaisa={metrics.availablePaisa}
                      size="xl"
                      color={metrics.isOverBudget ? "rose" : "emerald"}
                    />
                  </div>
                  <span className="text-[10px] text-slate-400">
                    {metrics.isOverBudget ? "Deficit" : "Remaining"}
                  </span>
                </div>
              </div>

              {allocation?.notes && (
                <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-lg text-xs text-blue-950 flex items-start gap-2.5">
                  <FileCheck className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Administrative Directive: </span>
                    {allocation.notes}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Allocation Modification History */}
          <Card className="border-slate-200/80 shadow-xs">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <History className="w-4 h-4 text-[#0d2847]" />
                Budget Allocation Audit History
              </CardTitle>
              <CardDescription>
                Historical modifications and sanction directives issued by Headquarters
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!allocation?.history || allocation.history.length === 0 ? (
                <p className="text-xs text-slate-400">
                  Initial baseline allocation active with no subsequent amendments.
                </p>
              ) : (
                <div className="space-y-3">
                  {allocation.history.map((hist) => (
                    <div
                      key={hist.id}
                      className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">
                            Allocation Set to {formatBDT(hist.newAmount)}
                          </span>
                          {hist.previousAmount > BigInt(0) && (
                            <span className="text-[10px] text-slate-500 font-mono">
                              (from {formatBDT(hist.previousAmount)})
                            </span>
                          )}
                        </div>
                        {hist.reason && (
                          <p className="text-slate-600 italic">
                            &ldquo;{hist.reason}&rdquo;
                          </p>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-400 font-mono shrink-0">
                        {format(new Date(hist.createdAt), "dd MMM yyyy, HH:mm")}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Category Consumption Breakdown */}
      <Card className="border-slate-200/80 shadow-xs">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Tag className="w-4 h-4 text-[#0d2847]" />
            Category-wise Commitment Breakdown
          </CardTitle>
          <CardDescription>
            Cumulative expenditure by operational category for this financial year
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(categorySummary).map(([catName, data]) => {
              const catPercent =
                allocatedPaisa > BigInt(0)
                  ? Number((data.spent * BigInt(1000)) / allocatedPaisa) / 10
                  : 0;

              return (
                <div
                  key={catName}
                  className="p-4 rounded-xl border border-slate-200 bg-white space-y-2 hover:border-slate-300 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-800">
                      {catName}
                    </span>
                    <span className="text-[11px] font-mono text-slate-500">
                      {data.count} vouchers
                    </span>
                  </div>

                  <div className="flex items-baseline justify-between">
                    <MoneyDisplay amountInPaisa={data.spent} size="base" color="blue" />
                    <span className="text-xs font-semibold text-slate-600">
                      {catPercent.toFixed(1)}%
                    </span>
                  </div>

                  {/* Micro progress bar */}
                  <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#163860] rounded-full"
                      style={{ width: `${Math.min(100, catPercent)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
