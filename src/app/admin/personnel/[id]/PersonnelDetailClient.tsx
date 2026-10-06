"use client";

import React, { useState } from "react";
import { BudgetProgressRing } from "@/components/budget/BudgetProgressRing";
import { BudgetStatCard } from "@/components/budget/BudgetStatCard";
import { BudgetStatusBadge } from "@/components/budget/BudgetStatusBadge";
import { MonthlySpendingChart } from "@/components/charts/MonthlySpendingChart";
import { CategoryDistributionChart } from "@/components/charts/CategoryDistributionChart";
import { ExpenseTable } from "@/components/expenses/ExpenseTable";
import { BudgetAdjustModal } from "@/components/admin/BudgetAdjustModal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { adjustAllocationAction, toggleUserStatusAction } from "@/app/actions/admin";
import { deleteExpenseAction, updateExpenseAction } from "@/app/actions/expenses";
import { formatBDT, BudgetMetrics } from "@/lib/money";
import { format } from "date-fns";
import {
  Wallet,
  Receipt,
  Clock,
  CheckCircle,
  SlidersHorizontal,
  Power,
  History,
  TrendingUp,
  Tag,
  Shield,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";

interface AllocationHistoryItem {
  id: string;
  previousAmount: bigint;
  newAmount: bigint;
  reason?: string | null;
  createdAt: Date | string;
}

interface PersonnelDetailClientProps {
  officer: {
    id: string;
    name: string;
    email: string;
    serviceId: string;
    rank?: string | null;
    unit?: string | null;
    isActive: boolean;
  };
  allocation: {
    id: string;
    allocatedAmount: bigint;
    notes?: string | null;
    history: AllocationHistoryItem[];
  };
  metrics: BudgetMetrics;
  expenses: any[];
  categories: { id: string; name: string }[];
  monthlyChartData: { month: string; amountPaisa: bigint; count: number }[];
  categoryChartData: { name: string; amountPaisa: bigint; count: number }[];
  yearLabel: string;
}

export function PersonnelDetailClient({
  officer,
  allocation,
  metrics,
  expenses,
  categories,
  monthlyChartData,
  categoryChartData,
  yearLabel,
}: PersonnelDetailClientProps) {
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [isActive, setIsActive] = useState(officer.isActive);

  const handleAdjustSave = async (data: {
    allocationId: string;
    newAmountPaisa: bigint;
    reason: string;
  }) => {
    return await adjustAllocationAction(data);
  };

  const handleToggleStatus = async () => {
    await toggleUserStatusAction(officer.id, isActive);
    setIsActive(!isActive);
  };

  const handleDeleteExpense = async (expenseId: string) => {
    await deleteExpenseAction(expenseId);
  };

  return (
    <div className="space-y-6">
      {/* Back button and Profile Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div className="space-y-1">
          <Link
            href="/admin/personnel"
            className="text-xs font-semibold text-slate-500 hover:text-blue-900 flex items-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Personnel Directory
          </Link>
          <div className="flex items-center gap-3 pt-1">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              {officer.name}
            </h1>
            <BudgetStatusBadge status={metrics.statusLevel} />
            <span
              className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                isActive
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-slate-100 text-slate-600"
              }`}
            >
              {isActive ? "Active" : "Inactive"}
            </span>
          </div>
          <p className="text-xs text-slate-500 font-mono">
            {officer.serviceId} &bull; {officer.rank || "Officer"} &bull; {officer.unit || "Naval Unit"} &bull; {officer.email}
          </p>
        </div>

        {/* Admin Controls */}
        <div className="flex items-center gap-2.5">
          <Button
            variant="naval"
            size="default"
            onClick={() => setIsAdjustModalOpen(true)}
            className="shadow-sm"
          >
            <SlidersHorizontal className="w-4 h-4" />
            Adjust Budget Allocation
          </Button>

          <Button
            variant="outline"
            size="default"
            onClick={handleToggleStatus}
            className={isActive ? "text-rose-600 hover:bg-rose-50" : "text-emerald-600 hover:bg-emerald-50"}
          >
            <Power className="w-4 h-4" />
            {isActive ? "Deactivate" : "Activate"}
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <BudgetStatCard
          title="Assigned Annual Budget"
          amountInPaisa={metrics.allocatedPaisa}
          icon={<Wallet className="w-5 h-5" />}
          variant="primary"
          subtitle={`Ceiling for ${yearLabel}`}
        />
        <BudgetStatCard
          title="Total Spent"
          amountInPaisa={metrics.spentPaisa}
          icon={<Receipt className="w-5 h-5" />}
          variant="spent"
          percentage={metrics.spentPercentage}
          subtitle="Approved Vouchers"
        />
        <BudgetStatCard
          title="Pending / Processing"
          amountInPaisa={metrics.pendingPaisa}
          icon={<Clock className="w-5 h-5" />}
          variant="pending"
          subtitle="Awaiting Verification"
        />
        <BudgetStatCard
          title="Remaining Balance"
          amountInPaisa={metrics.availablePaisa}
          icon={<CheckCircle className="w-5 h-5" />}
          variant="remaining"
          highlight={!metrics.isOverBudget}
          subtitle={metrics.isOverBudget ? "Deficit" : "Available Funds"}
        />
      </div>

      {/* Progress Ring + Monthly Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <BudgetProgressRing metrics={metrics} />
        </div>

        <div className="lg:col-span-2">
          <Card className="h-full border-slate-200/80 shadow-xs">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[#0d2847]" />
                Monthly Expenditure Velocity
              </CardTitle>
              <CardDescription>
                Expenditures incurred by this officer across {yearLabel}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-2">
              <MonthlySpendingChart data={monthlyChartData} height={250} />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Category Breakdown & Allocation History */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown */}
        <Card className="border-slate-200/80 shadow-xs">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Tag className="w-4 h-4 text-[#0d2847]" />
              Category Expenditure Distribution
            </CardTitle>
            <CardDescription>
              Spending broken down by official procurement category
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            <CategoryDistributionChart data={categoryChartData} height={220} />
          </CardContent>
        </Card>

        {/* Allocation History */}
        <Card className="border-slate-200/80 shadow-xs">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <History className="w-4 h-4 text-[#0d2847]" />
              Budget Modification History
            </CardTitle>
            <CardDescription>
              Formal administrative directives and adjustments for this officer
            </CardDescription>
          </CardHeader>
          <CardContent>
            {allocation.history.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">
                Initial allocation active with no subsequent amendments.
              </p>
            ) : (
              <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                {allocation.history.map((hist) => (
                  <div
                    key={hist.id}
                    className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">
                        {formatBDT(hist.newAmount)}
                      </span>
                      <span className="font-mono text-[10px] text-slate-400">
                        {format(new Date(hist.createdAt), "dd MMM yyyy, HH:mm")}
                      </span>
                    </div>
                    {hist.previousAmount > BigInt(0) && (
                      <p className="text-[11px] text-slate-500 font-mono">
                        Previous: {formatBDT(hist.previousAmount)}
                      </p>
                    )}
                    {hist.reason && (
                      <p className="text-slate-600 italic mt-0.5">
                        &ldquo;{hist.reason}&rdquo;
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Transaction History for this Officer */}
      <div className="space-y-3">
        <h3 className="text-base font-bold text-slate-900">
          Officer Expenditure Vouchers ({expenses.length})
        </h3>
        <ExpenseTable
          expenses={expenses}
          categories={categories}
          onDeleteExpense={handleDeleteExpense}
          showOfficerColumn={false}
          canModify={true}
        />
      </div>

      {/* Adjust Budget Modal */}
      <BudgetAdjustModal
        isOpen={isAdjustModalOpen}
        onClose={() => setIsAdjustModalOpen(false)}
        personnel={{
          userId: officer.id,
          allocationId: allocation.id,
          name: officer.name,
          rank: officer.rank,
          serviceId: officer.serviceId,
          unit: officer.unit,
          currentAllocatedPaisa: metrics.allocatedPaisa,
          spentPaisa: metrics.spentPaisa,
          pendingPaisa: metrics.pendingPaisa,
        }}
        onSave={handleAdjustSave}
      />
    </div>
  );
}
