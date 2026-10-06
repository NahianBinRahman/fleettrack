import React from "react";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { calculateBudgetMetrics, formatBDT } from "@/lib/money";
import { BudgetStatCard } from "@/components/budget/BudgetStatCard";
import { BudgetProgressRing } from "@/components/budget/BudgetProgressRing";
import { BudgetAlert } from "@/components/budget/BudgetAlert";
import { ExpenseStatusBadge } from "@/components/budget/ExpenseStatusBadge";
import { MoneyDisplay } from "@/components/budget/MoneyDisplay";
import { MonthlySpendingChart } from "@/components/charts/MonthlySpendingChart";
import { CategoryDistributionChart } from "@/components/charts/CategoryDistributionChart";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import Link from "next/link";
import {
  Wallet,
  Receipt,
  Clock,
  CheckCircle,
  PlusCircle,
  ArrowRight,
  TrendingUp,
  PieChart as PieIcon,
  FileText,
  Calendar,
} from "lucide-react";
import { format } from "date-fns";

export default async function PersonnelDashboard({
  searchParams,
}: {
  searchParams: Promise<{ fy?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const resolvedParams = await searchParams;

  // Determine financial year to show (requested or active)
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
    return (
      <div className="p-8 text-center text-slate-500">
        No financial years configured in system.
      </div>
    );
  }

  // Load user allocation for this financial year
  const allocation = await db.budgetAllocation.findUnique({
    where: {
      userId_financialYearId: {
        userId: user.id,
        financialYearId: activeYear.id,
      },
    },
  });

  const allocatedPaisa = allocation?.allocatedAmount ?? BigInt(0);

  // Load all expenses for this user in this financial year
  const expenses = await db.expense.findMany({
    where: {
      userId: user.id,
      financialYearId: activeYear.id,
    },
    include: { category: true },
    orderBy: { date: "desc" },
  });

  // Calculate metrics
  const spentPaisa = expenses
    .filter((e) => e.status === "APPROVED")
    .reduce((acc, e) => acc + e.amount, BigInt(0));

  const pendingPaisa = expenses
    .filter((e) => e.status === "PENDING" || e.status === "PROCESSING")
    .reduce((acc, e) => acc + e.amount, BigInt(0));

  const metrics = calculateBudgetMetrics(allocatedPaisa, spentPaisa, pendingPaisa);

  // Calculate monthly spending data
  const monthMap: Record<string, { amountPaisa: bigint; count: number }> = {};
  const monthNames = [
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  ];
  monthNames.forEach((m) => {
    monthMap[m] = { amountPaisa: BigInt(0), count: 0 };
  });

  expenses
    .filter((e) => e.status === "APPROVED" || e.status === "PENDING")
    .forEach((e) => {
      const monthStr = format(new Date(e.date), "MMM");
      if (monthMap[monthStr]) {
        monthMap[monthStr].amountPaisa += e.amount;
        monthMap[monthStr].count += 1;
      }
    });

  const monthlyChartData = monthNames.map((m) => ({
    month: m,
    amountPaisa: monthMap[m].amountPaisa,
    count: monthMap[m].count,
  }));

  // Category distribution
  const categoryMap: Record<string, { amountPaisa: bigint; count: number }> = {};
  expenses
    .filter((e) => e.status === "APPROVED" || e.status === "PENDING")
    .forEach((e) => {
      const catName = e.category.name;
      if (!categoryMap[catName]) {
        categoryMap[catName] = { amountPaisa: BigInt(0), count: 0 };
      }
      categoryMap[catName].amountPaisa += e.amount;
      categoryMap[catName].count += 1;
    });

  const categoryChartData = Object.entries(categoryMap).map(([name, data]) => ({
    name,
    amountPaisa: data.amountPaisa,
    count: data.count,
  }));

  const recentExpenses = expenses.slice(0, 5);

  // Time of day greeting
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            {activeYear.label} &bull; {activeYear.status}
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-0.5">
            {greeting}, {user.rank ? `${user.rank} ${user.name}` : user.name}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Naval Operational Ledger for <span className="font-semibold text-slate-700">{user.unit || "Your Unit"}</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/expenses">
            <Button variant="naval" size="default" className="shadow-md">
              <PlusCircle className="w-4 h-4" />
              Submit Voucher
            </Button>
          </Link>
        </div>
      </div>

      {/* Primary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <BudgetStatCard
          title="Total Allocated Budget"
          amountInPaisa={metrics.allocatedPaisa}
          icon={<Wallet className="w-5 h-5" />}
          variant="primary"
          subtitle={`Fixed Ceiling (FY ${activeYear.year})`}
        />
        <BudgetStatCard
          title="Total Spent"
          amountInPaisa={metrics.spentPaisa}
          icon={<Receipt className="w-5 h-5" />}
          variant="spent"
          percentage={metrics.spentPercentage}
          subtitle="Approved Expenditures"
        />
        <BudgetStatCard
          title="Pending / Processing"
          amountInPaisa={metrics.pendingPaisa}
          icon={<Clock className="w-5 h-5" />}
          variant="pending"
          percentage={metrics.committedPercentage - metrics.spentPercentage}
          subtitle="Awaiting Verification"
        />
        <BudgetStatCard
          title="Remaining Available"
          amountInPaisa={metrics.availablePaisa}
          icon={<CheckCircle className="w-5 h-5" />}
          variant="remaining"
          highlight={!metrics.isOverBudget}
          subtitle={metrics.isOverBudget ? "Deficit Balance" : "Uncommitted Funds"}
        />
      </div>

      {/* Budget Alerts Banner */}
      <BudgetAlert metrics={metrics} />

      {/* Main Grid: Progress Ring + Monthly Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Progress Ring Visual Highlight */}
        <div className="lg:col-span-1 flex flex-col">
          <BudgetProgressRing metrics={metrics} className="h-full" />
        </div>

        {/* Right Column: Monthly Spending Chart */}
        <div className="lg:col-span-2">
          <Card className="h-full border-slate-200/80 shadow-xs">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-[#0d2847]" />
                  Monthly Expenditure Trend
                </CardTitle>
                <CardDescription>
                  Cumulative monthly disbursement trajectory across FY {activeYear.year}
                </CardDescription>
              </div>
              <span className="text-xs font-mono font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md">
                ৳ BDT
              </span>
            </CardHeader>
            <CardContent className="pt-4">
              <MonthlySpendingChart data={monthlyChartData} height={250} />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Secondary Grid: Category Distribution + Recent Expenses */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Category Spending Donut */}
        <div className="lg:col-span-1">
          <Card className="h-full border-slate-200/80 shadow-xs">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <PieIcon className="w-4 h-4 text-[#0d2847]" />
                Spending by Category
              </CardTitle>
              <CardDescription>
                Distribution across official procurement categories
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-2">
              <CategoryDistributionChart data={categoryChartData} height={220} />
            </CardContent>
          </Card>
        </div>

        {/* Recent Expenses List */}
        <div className="lg:col-span-2">
          <Card className="h-full border-slate-200/80 shadow-xs">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#0d2847]" />
                  Recent Expenditure Vouchers
                </CardTitle>
                <CardDescription>
                  Latest vouchers submitted to the administrative ledger
                </CardDescription>
              </div>
              <Link
                href="/expenses"
                className="text-xs font-semibold text-blue-900 hover:underline flex items-center gap-1"
              >
                View All
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </CardHeader>
            <CardContent>
              {recentExpenses.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs">
                  No expenditure vouchers recorded for this financial year yet.
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {recentExpenses.map((exp) => (
                    <div
                      key={exp.id}
                      className="py-3 flex items-center justify-between gap-3 hover:bg-slate-50/60 transition-colors rounded-lg px-2"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-bold text-slate-900 truncate">
                            {exp.title}
                          </p>
                          <ExpenseStatusBadge status={exp.status} />
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500">
                          <span className="font-mono">{exp.referenceNumber}</span>
                          <span>&bull;</span>
                          <span>{exp.category.name}</span>
                          <span>&bull;</span>
                          <span>{format(new Date(exp.date), "dd MMM yyyy")}</span>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <MoneyDisplay
                          amountInPaisa={exp.amount}
                          size="sm"
                          color="blue"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
