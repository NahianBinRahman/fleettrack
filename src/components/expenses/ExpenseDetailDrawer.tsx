"use client";

import React from "react";
import { formatBDT } from "@/lib/money";
import { ExpenseStatusBadge } from "@/components/budget/ExpenseStatusBadge";
import { MoneyDisplay } from "@/components/budget/MoneyDisplay";
import { Button } from "@/components/ui/button";
import {
  X,
  Calendar,
  Tag,
  Hash,
  FileText,
  User,
  AlertCircle,
  Pencil,
  Trash2,
} from "lucide-react";

export interface ExpenseRecord {
  id: string;
  title: string;
  description?: string | null;
  amount: bigint | number;
  referenceNumber: string;
  date: Date | string;
  status: string;
  notes?: string | null;
  category: {
    id: string;
    name: string;
  };
  user?: {
    id: string;
    name: string;
    serviceId: string;
    rank?: string | null;
  };
}

interface ExpenseDetailDrawerProps {
  expense: ExpenseRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (expense: ExpenseRecord) => void;
  onDelete?: (expense: ExpenseRecord) => void;
  canModify?: boolean;
}

export function ExpenseDetailDrawer({
  expense,
  isOpen,
  onClose,
  onEdit,
  onDelete,
  canModify = true,
}: ExpenseDetailDrawerProps) {
  if (!isOpen || !expense) return null;

  const formattedDate = new Date(expense.date).toLocaleDateString("en-BD", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-300 border-l border-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Expenditure Voucher
            </span>
            <div className="flex items-center gap-2 mt-1">
              <span className="font-mono text-xs font-semibold text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200">
                {expense.referenceNumber}
              </span>
              <ExpenseStatusBadge status={expense.status} />
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Content */}
        <div className="p-6 space-y-6 flex-1">
          {/* Main Title & Amount */}
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-slate-900 leading-snug">
              {expense.title}
            </h2>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
              <span className="text-xs font-semibold uppercase text-slate-500">
                Voucher Amount
              </span>
              <MoneyDisplay
                amountInPaisa={expense.amount}
                size="2xl"
                color="blue"
              />
            </div>
          </div>

          {/* Officer Attribution (for admin view) */}
          {expense.user && (
            <div className="p-3.5 rounded-xl bg-blue-50/60 border border-blue-100 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#0d2847] text-[#d4af37] flex items-center justify-center text-xs font-bold shrink-0">
                <User className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-slate-900 truncate">
                  {expense.user.name}
                </p>
                <p className="text-[11px] text-slate-500">
                  {expense.user.serviceId} {expense.user.rank ? `• ${expense.user.rank}` : ""}
                </p>
              </div>
            </div>
          )}

          {/* Meta Details List */}
          <div className="space-y-3 divide-y divide-slate-100 text-xs">
            <div className="flex items-center justify-between py-2">
              <span className="text-slate-500 flex items-center gap-2">
                <Tag className="w-4 h-4 text-slate-400" />
                Category
              </span>
              <span className="font-semibold text-slate-800">
                {expense.category.name}
              </span>
            </div>

            <div className="flex items-center justify-between py-2">
              <span className="text-slate-500 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-slate-400" />
                Transaction Date
              </span>
              <span className="font-medium text-slate-800">{formattedDate}</span>
            </div>

            <div className="flex items-center justify-between py-2">
              <span className="text-slate-500 flex items-center gap-2">
                <Hash className="w-4 h-4 text-slate-400" />
                Reference Number
              </span>
              <span className="font-mono text-slate-800">
                {expense.referenceNumber}
              </span>
            </div>
          </div>

          {/* Description */}
          {expense.description && (
            <div className="space-y-1.5 pt-2">
              <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-slate-400" />
                Purpose / Description
              </span>
              <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-200/80 leading-relaxed whitespace-pre-wrap">
                {expense.description}
              </p>
            </div>
          )}

          {/* Notes */}
          {expense.notes && (
            <div className="space-y-1.5 pt-1">
              <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                Administrative Notes
              </span>
              <p className="text-xs text-slate-600 bg-amber-50/50 p-3 rounded-lg border border-amber-200/60 leading-relaxed">
                {expense.notes}
              </p>
            </div>
          )}
        </div>

        {/* Drawer Actions */}
        {canModify && (
          <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex items-center gap-3">
            {onEdit && (
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  onClose();
                  onEdit(expense);
                }}
              >
                <Pencil className="w-4 h-4" />
                Edit Voucher
              </Button>
            )}
            {onDelete && (
              <Button
                variant="destructive"
                className="flex-1"
                onClick={() => {
                  onClose();
                  onDelete(expense);
                }}
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
