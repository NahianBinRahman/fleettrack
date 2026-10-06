import React from "react";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { calculateBudgetMetrics, formatBDT } from "@/lib/money";
import { BudgetStatCard } from "@/components/budget/BudgetStatCard";
import { MoneyDisplay } from "@/components/budget/MoneyDisplay";
import { BudgetStatusBadge } from "@/components/budget/BudgetStatusBadge";
import { OrganizationBudgetChart } from "@/components/charts/OrganizationBudgetChart";
import { MonthlySpendingChart } from "@/components/charts/MonthlySpendingChart";
import { UtilizationDistributionChart } from "@/components/charts/UtilizationDistributionChart";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  Building2,
  Users,
  Wallet,
  Receipt,
  Clock,
  AlertTriangle,
  Flame,
  ArrowRight,
  TrendingUp,
  BarChart3,
  ShieldAlert,
  FileSpreadsheet,
} from "lucide-react";
import { format } from "date-fns";

export default async function AdminOverviewPage({
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
    return <div className="p-8">No financial year configured.</div>;
  }

  // 1. Organization Total Budget
  const orgTotalBudgetPaisa = activeYear.totalBudget;

  // 2. Load all personnel with allocations for this financial year
  const personnelWithAllocations = await db.user.findMany({
    where: { role: "PERSONNEL" },
    include: {
      allocations: {
        where: { financialYearId: activeYear.id },
      },
      expenses: {
        where: { financialYearId: activeYear.id },
      },
    },
  });

  const totalPersonnelCount = personnelWithAllocations.length;
  const activePersonnelCount = personnelWithAllocations.filter((p) => p.isActive).length;

  // Calculate organization totals & individual metrics
  let totalAllocatedPaisa = BigInt(0);
  let totalSpentPaisa = BigInt(0);
  let totalPendingPaisa = BigInt(0);

  const personnelMetricsList = personnelWithAllocations.map((p) => {
    const alloc = p.allocations[0]?.allocatedAmount ?? BigInt(0);
    totalAllocatedPaisa += alloc;

    const spent = p.expenses
      .filter((e) => e.status === "APPROVED")
      .reduce((acc, e) => acc + e.amount, BigInt(0));
    totalSpentPaisa += spent;

    const pending = p.expenses
      .filter((e) => e.status === "PENDING" || e.status === "PROCESSING")
      .reduce((acc, e) => acc + e.amount, BigInt(0));
    totalPendingPaisa += pending;

    const metrics = calculateBudgetMetrics(alloc, spent, pending);
    return {
      user: p,
      allocatedPaisa: alloc,
      spentPaisa: spent,
      pendingPaisa: pending,
      metrics,
    };
  });

  const totalCommittedPaisa = totalSpentPaisa + totalPendingPaisa;
  const orgRemainingPaisa = orgTotalBudgetPaisa - totalCommittedPaisa;

  // Near limit & Over budget counts
  const overBudgetPersonnel = personnelMetricsList.filter(
    (item) => item.metrics.committedPercentage > 100
  );
  const nearLimitPersonnel = personnelMetricsList.filter(
    (item) =>
      item.metrics.committedPercentage >= 80 &&
      item.metrics.committedPercentage <= 100
  );

  // Utilization distribution tiers
  const tierCounts = {
    tier1: 0, // 0 - 50%
    tier2: 0, // 50 - 75%
    tier3: 0, // 75 - 90%
    tier4: 0, // 90 - 100%
    tier5: 0, // 100%+
  };

  personnelMetricsList.forEach((item) => {
    const pct = item.metrics.committedPercentage;
    if (pct > 100) tierCounts.tier5++;
    else if (pct >= 90) tierCounts.tier4++;
    else if (pct >= 75) tierCounts.tier3++;
    else if (pct >= 50) tierCounts.tier2++;
    else tierCounts.tier1++;
  });

  const distributionChartData = [
    { range: "0–50%", count: tierCounts.tier1, label: "Healthy Low", color: "#10b981" },
    { range: "50–75%", count: tierCounts.tier2, label: "Moderate", color: "#3b82f6" },
    { range: "75–90%", count: tierCounts.tier3, label: "Approaching", color: "#f59e0b" },
    { range: "90–100%", count: tierCounts.tier4, label: "Critical", color: "#f97316" },
    { range: "100%+", count: tierCounts.tier5, label: "Exceeded Limit", color: "#ef4444" },
  ];

  // Highest utilization list (top 6 closest to or exceeding limit)
  const highestUtilizationList = [...personnelMetricsList]
    .sort((a, b) => b.metrics.committedPercentage - a.metrics.committedPercentage)
    .slice(0, 6);

  // Organization-wide Monthly trend
  const orgExpenses = await db.expense.findMany({
    where: { financialYearId: activeYear.id },
    select: { date: true, amount: true, status: true },
  });

  const monthMap: Record<string, { amountPaisa: bigint; count: number }> = {};
  const monthNames = ["Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May", "Jun"];
  monthNames.forEach((m) => {
    monthMap[m] = { amountPaisa: BigInt(0), count: 0 };
  });

  orgExpenses
    .filter((e) => e.status === "APPROVED" || e.status === "PENDING")
    .forEach((e) => {
      const monthStr = format(new Date(e.date), "MMM");
      if (monthMap[monthStr]) {
        monthMap[monthStr].amountPaisa += e.amount;
        monthMap[monthStr].count += 1;
      }
    });

  const monthlyOrgChartData = monthNames.map((m) => ({
    month: m,
    amountPaisa: monthMap[m].amountPaisa,
    count: monthMap[m].count,
  }));

  return (
    <div className="space-y-6">
      {/* Executive Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#d4af37]">
            Executive Directorate View &bull; {activeYear.label} ({activeYear.status})
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-0.5">
            Naval Administrative Budget Overview
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Centrally monitoring ৳10,000,000 organization-wide allocation across {totalPersonnelCount} active officers
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link href="/admin/personnel">
            <Button variant="naval" size="default" className="shadow-sm">
              <Users className="w-4 h-4" />
              Manage Personnel ({activePersonnelCount})
            </Button>
          </Link>
          <Link href="/admin/reports">
            <Button variant="outline" size="default">
              <FileSpreadsheet className="w-4 h-4" />
              HQ Reports
            </Button>
          </Link>
        </div>
      </div>

      {/* Top Level Organization KPIs: Focused on Total Allocated to Personnel (No Org Spent) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <BudgetStatCard
          title="Organization Annual Budget"
          amountInPaisa={orgTotalBudgetPaisa}
          icon={<Building2 className="w-5 h-5" />}
          variant="primary"
          subtitle={`Annual Ceiling (FY ${activeYear.year})`}
        />
        <BudgetStatCard
          title="Total Allocated to Personnel"
          amountInPaisa={totalAllocatedPaisa}
          icon={<Wallet className="w-5 h-5" />}
          variant="remaining"
          highlight={true}
          percentage={
            orgTotalBudgetPaisa > BigInt(0)
              ? Number((totalAllocatedPaisa * BigInt(1000)) / orgTotalBudgetPaisa) / 10
              : 0
          }
          subtitle="Distributed across Naval Units"
        />
        <BudgetStatCard
          title="Unallocated Command Reserve"
          amountInPaisa={orgTotalBudgetPaisa - totalAllocatedPaisa}
          icon={<Clock className="w-5 h-5" />}
          variant="pending"
          percentage={
            orgTotalBudgetPaisa > BigInt(0)
              ? Number(((orgTotalBudgetPaisa - totalAllocatedPaisa) * BigInt(1000)) / orgTotalBudgetPaisa) / 10
              : 0
          }
          subtitle="Available for New Allocations"
        />
        <div className="p-5 rounded-xl border border-slate-200 bg-white shadow-xs flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Commissioned Personnel
              </span>
              <p className="text-2xl font-black text-slate-900 mt-1">
                {activePersonnelCount}{" "}
                <span className="text-xs font-normal text-slate-500">/ 100+ Authorized</span>
              </p>
            </div>
            <div className="p-2.5 rounded-xl bg-blue-50 text-[#0d2847]">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Enrolled with active quota</span>
            <span className="font-semibold text-emerald-600">100% Active</span>
          </div>
        </div>
      </div>

      {/* Warning/Status Callout Row: Personnel Limit Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-white rounded-2xl border border-slate-200/90 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-[#0d2847] flex items-center justify-center font-bold text-lg shrink-0">
            {activePersonnelCount}
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Active Officers
            </p>
            <p className="text-sm font-semibold text-slate-900 mt-0.5">
              Enrolled with FY Allocations
            </p>
          </div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-amber-200/90 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-lg shrink-0">
            {nearLimitPersonnel.length}
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-amber-700">
              Near Limit (80–100%)
            </p>
            <p className="text-sm font-semibold text-slate-800 mt-0.5">
              Require Budget Monitoring
            </p>
          </div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-rose-200/90 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold text-lg shrink-0">
            {overBudgetPersonnel.length}
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-rose-700">
              Exceeded Limit (&gt;100%)
            </p>
            <p className="text-sm font-semibold text-slate-800 mt-0.5">
              Budget Deficit Flagged
            </p>
          </div>
        </div>
      </div>

      {/* Primary Visualizations: Org Utilization + Monthly Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Org Budget Comparison Bar Chart */}
        <Card className="border-slate-200/80 shadow-xs">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-[#0d2847]" />
              Organization Budget Utilization
            </CardTitle>
            <CardDescription>
              Annual organization ceiling vs total allocated to commissioned personnel
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            <OrganizationBudgetChart
              totalBudgetPaisa={orgTotalBudgetPaisa}
              allocatedPaisa={totalAllocatedPaisa}
              reservePaisa={orgTotalBudgetPaisa - totalAllocatedPaisa}
              height={260}
            />
          </CardContent>
        </Card>

        {/* Organization Monthly Trend */}
        <Card className="border-slate-200/80 shadow-xs">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#0d2847]" />
              Organization Monthly Expenditure Trajectory
            </CardTitle>
            <CardDescription>
              Total disbursement velocity across all naval squadrons
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            <MonthlySpendingChart data={monthlyOrgChartData} height={260} />
          </CardContent>
        </Card>
      </div>

      {/* Secondary Row: Distribution Histogram + Highest Utilization Roster */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Budget Utilization Distribution */}
        <Card className="border-slate-200/80 shadow-xs">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-[#0d2847]" />
              Personnel Budget Utilization Distribution
            </CardTitle>
            <CardDescription>
              Count of commissioned officers across utilization percentage tiers
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            <UtilizationDistributionChart data={distributionChartData} height={240} />
          </CardContent>
        </Card>

        {/* Highest Budget Utilization List */}
        <Card className="border-slate-200/80 shadow-xs flex flex-col justify-between">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                Highest Budget Utilization
              </CardTitle>
              <CardDescription>
                Personnel closest to or exceeding assigned annual limits
              </CardDescription>
            </div>
            <Link
              href="/admin/personnel"
              className="text-xs font-semibold text-blue-900 hover:underline flex items-center gap-1"
            >
              All Personnel
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </CardHeader>
          <CardContent className="divide-y divide-slate-100 flex-1">
            {highestUtilizationList.map((item) => (
              <div
                key={item.user.id}
                className="py-2.5 flex items-center justify-between gap-3 hover:bg-slate-50/60 transition-colors rounded-lg px-2"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/admin/personnel/${item.user.id}`}
                      className="font-bold text-xs text-slate-900 hover:text-blue-900 truncate"
                    >
                      {item.user.name}
                    </Link>
                    <BudgetStatusBadge
                      status={item.metrics.statusLevel}
                      showIcon={false}
                      className="text-[10px] px-1.5 py-0"
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 truncate mt-0.5">
                    {item.user.serviceId} &bull; {item.user.unit || "Unit"}
                  </p>
                </div>

                <div className="text-right shrink-0">
                  <p
                    className={`font-mono text-sm font-extrabold ${
                      item.metrics.committedPercentage > 100
                        ? "text-rose-600"
                        : item.metrics.committedPercentage >= 80
                        ? "text-amber-600"
                        : "text-slate-800"
                    }`}
                  >
                    {item.metrics.committedPercentage.toFixed(1)}%
                  </p>
                  <p className="text-[10px] text-slate-400 font-mono">
                    {formatBDT(item.metrics.committedPaisa)} / {formatBDT(item.allocatedPaisa)}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
