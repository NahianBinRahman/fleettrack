"use client";

import React, { useState } from "react";
import { ExpenseTable } from "@/components/expenses/ExpenseTable";
import { ExpenseForm } from "@/components/expenses/ExpenseForm";
import { ExpenseRecord } from "@/components/expenses/ExpenseDetailDrawer";
import { Button } from "@/components/ui/button";
import { PlusCircle, X } from "lucide-react";
import {
  createExpenseAction,
  updateExpenseAction,
  deleteExpenseAction,
} from "@/app/actions/expenses";

interface CategoryOption {
  id: string;
  name: string;
}

interface ExpensesClientProps {
  expenses: ExpenseRecord[];
  categories: CategoryOption[];
  budgetContext: {
    allocatedPaisa: bigint;
    committedPaisa: bigint;
    availablePaisa: bigint;
  };
}

export function ExpensesClient({
  expenses,
  categories,
  budgetContext,
}: ExpensesClientProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<ExpenseRecord | null>(null);

  const handleOpenAddForm = () => {
    setEditingExpense(null);
    setIsFormOpen(true);
  };

  const handleEditExpense = (expense: ExpenseRecord) => {
    setEditingExpense(expense);
    setIsFormOpen(true);
  };

  const handleFormSubmit = async (formData: {
    title: string;
    categoryId: string;
    amountPaisa: bigint;
    date: string;
    referenceNumber: string;
    description?: string;
    notes?: string;
  }) => {
    if (editingExpense) {
      const res = await updateExpenseAction(editingExpense.id, formData);
      if (res.success) {
        setIsFormOpen(false);
        setEditingExpense(null);
      }
      return res;
    } else {
      const res = await createExpenseAction(formData);
      if (res.success) {
        setIsFormOpen(false);
      }
      return res;
    }
  };

  const handleDeleteExpense = async (expenseId: string) => {
    await deleteExpenseAction(expenseId);
  };

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900">
            ব্যয় লেজার ও ভাউচার তালিকা (Expense Ledger)
          </h2>
          <p className="text-xs text-slate-500">
            অপারেশনাল খরচের ভাউচার দাখিল, তদারকি ও নিরীক্ষণ
          </p>
        </div>

        <Button
          variant="naval"
          onClick={handleOpenAddForm}
          className="shadow-sm"
        >
          <PlusCircle className="w-4 h-4" />
          নতুন ভাউচার দাখিল
        </Button>
      </div>

      {/* Main Expense Table with responsive Mobile Cards */}
      <ExpenseTable
        expenses={expenses}
        categories={categories}
        onEditExpense={handleEditExpense}
        onDeleteExpense={handleDeleteExpense}
        showOfficerColumn={false}
        canModify={true}
      />

      {/* Add / Edit Expense Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200">
            <div className="p-5 bg-[#091726] text-white flex items-center justify-between shrink-0">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#d4af37]">
                  নেভাল ভাউচার সাবমিশন
                </span>
                <h3 className="text-lg font-bold text-white">
                  {editingExpense ? "খরচের ভাউচার সম্পাদনা" : "নতুন খরচের ভাউচার দাখিল"}
                </h3>
              </div>
              <button
                onClick={() => {
                  setIsFormOpen(false);
                  setEditingExpense(null);
                }}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              <ExpenseForm
                initialData={editingExpense}
                categories={categories}
                budgetContext={budgetContext}
                onSubmit={handleFormSubmit}
                onCancel={() => {
                  setIsFormOpen(false);
                  setEditingExpense(null);
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
