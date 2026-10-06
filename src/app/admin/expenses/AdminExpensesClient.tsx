"use client";

import React, { useState } from "react";
import { ExpenseTable } from "@/components/expenses/ExpenseTable";
import { ExpenseRecord, ExpenseDetailDrawer } from "@/components/expenses/ExpenseDetailDrawer";
import { ExpenseStatusBadge } from "@/components/budget/ExpenseStatusBadge";
import { MoneyDisplay } from "@/components/budget/MoneyDisplay";
import { Button } from "@/components/ui/button";
import { updateExpenseStatusAction } from "@/app/actions/admin";
import { deleteExpenseAction } from "@/app/actions/expenses";
import { CheckCircle2, XCircle, RefreshCw, Ban } from "lucide-react";

interface AdminExpensesClientProps {
  expenses: ExpenseRecord[];
  categories: { id: string; name: string }[];
}

export function AdminExpensesClient({
  expenses,
  categories,
}: AdminExpensesClientProps) {
  const [selectedExpense, setSelectedExpense] = useState<ExpenseRecord | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const handleStatusChange = async (expenseId: string, newStatus: string) => {
    setIsUpdatingStatus(true);
    try {
      await updateExpenseStatusAction(expenseId, newStatus);
      if (selectedExpense && selectedExpense.id === expenseId) {
        setSelectedExpense({ ...selectedExpense, status: newStatus });
      }
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleDeleteExpense = async (expenseId: string) => {
    await deleteExpenseAction(expenseId);
  };

  const pendingCount = expenses.filter(
    (e) => e.status === "PENDING" || e.status === "PROCESSING"
  ).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">
            Organization-Wide Expenditure Ledger
          </h2>
          <p className="text-xs text-slate-500">
            Centrally audit, review, and authorize procurement vouchers across all naval units
          </p>
        </div>

        {pendingCount > 0 && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            {pendingCount} vouchers pending administrative approval
          </div>
        )}
      </div>

      {/* Main Expense Table with Officer column shown */}
      <ExpenseTable
        expenses={expenses}
        categories={categories}
        onDeleteExpense={handleDeleteExpense}
        showOfficerColumn={true}
        canModify={true}
      />
    </div>
  );
}
