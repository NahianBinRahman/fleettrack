"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { formatBDT, bdtToPaisa, paisaToBDT } from "@/lib/money";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertCircle,
  CheckCircle2,
  Calendar,
  Tag,
  Hash,
  FileText,
  DollarSign,
  AlertTriangle,
} from "lucide-react";
import { ExpenseRecord } from "./ExpenseDetailDrawer";

const expenseSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(100, "Title too long"),
  categoryId: z.string().min(1, "Please select an expense category"),
  amountBDT: z
    .number()
    .positive("Amount must be greater than zero"),
  date: z.string().min(1, "Transaction date is required"),
  referenceNumber: z.string().min(3, "Reference number is required"),
  description: z.string().optional(),
  notes: z.string().optional(),
});

type ExpenseFormData = z.infer<typeof expenseSchema>;

interface CategoryOption {
  id: string;
  name: string;
}

interface ExpenseFormProps {
  initialData?: ExpenseRecord | null;
  categories: CategoryOption[];
  budgetContext: {
    allocatedPaisa: bigint;
    committedPaisa: bigint;
    availablePaisa: bigint;
  };
  onSubmit: (data: {
    title: string;
    categoryId: string;
    amountPaisa: bigint;
    date: string;
    referenceNumber: string;
    description?: string;
    notes?: string;
  }) => Promise<{ success: boolean; error?: string }>;
  onCancel: () => void;
}

export function ExpenseForm({
  initialData,
  categories,
  budgetContext,
  onSubmit,
  onCancel,
}: ExpenseFormProps) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Generate a realistic default reference number if new
  const defaultRef =
    initialData?.referenceNumber ||
    `EXP-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

  const defaultDate = initialData
    ? new Date(initialData.date).toISOString().split("T")[0]
    : new Date().toISOString().split("T")[0];

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      title: initialData?.title || "",
      categoryId: initialData?.category.id || (categories[0]?.id ?? ""),
      amountBDT: initialData ? paisaToBDT(initialData.amount) : undefined,
      date: defaultDate,
      referenceNumber: defaultRef,
      description: initialData?.description || "",
      notes: initialData?.notes || "",
    },
  });

  const enteredAmountBDT = watch("amountBDT") || 0;
  const enteredAmountPaisa = bdtToPaisa(enteredAmountBDT);

  // If editing, existing expense amount is already in committed, so adjust for comparison
  const existingExpensePaisa = initialData ? BigInt(initialData.amount) : BigInt(0);
  const effectiveAvailablePaisa = budgetContext.availablePaisa + existingExpensePaisa;
  const isExceedingBudget = enteredAmountPaisa > effectiveAvailablePaisa;

  const handleFormSubmit = async (formData: ExpenseFormData) => {
    setServerError(null);
    setSuccessMessage(null);
    setIsSubmitting(true);

    try {
      const result = await onSubmit({
        title: formData.title,
        categoryId: formData.categoryId,
        amountPaisa: bdtToPaisa(formData.amountBDT),
        date: formData.date,
        referenceNumber: formData.referenceNumber,
        description: formData.description,
        notes: formData.notes,
      });

      if (!result.success) {
        setServerError(result.error || "An error occurred while saving the voucher");
      } else {
        setSuccessMessage("Expense voucher successfully submitted to the ledger!");
      }
    } catch (err: any) {
      setServerError(err.message || "An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Live Budget Context Card */}
      <div className="p-4 bg-slate-900 text-white rounded-2xl border border-slate-800 shadow-md">
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800 text-xs font-semibold uppercase tracking-wider text-slate-400">
          <span>Active Allocation Context (FY 2026)</span>
          <span className="text-[#d4af37]">Bangladeshi Taka</span>
        </div>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div>
            <p className="text-[11px] text-slate-400">Annual Budget</p>
            <p className="text-sm sm:text-base font-bold text-slate-100 font-mono mt-0.5">
              {formatBDT(budgetContext.allocatedPaisa)}
            </p>
          </div>
          <div>
            <p className="text-[11px] text-slate-400">Committed</p>
            <p className="text-sm sm:text-base font-bold text-amber-400 font-mono mt-0.5">
              {formatBDT(budgetContext.committedPaisa)}
            </p>
          </div>
          <div>
            <p className="text-[11px] text-slate-400">Available</p>
            <p
              className={`text-sm sm:text-base font-bold font-mono mt-0.5 ${
                budgetContext.availablePaisa < BigInt(0)
                  ? "text-rose-400"
                  : "text-emerald-400"
              }`}
            >
              {formatBDT(budgetContext.availablePaisa)}
            </p>
          </div>
        </div>

        {/* Warning if input exceeds remaining */}
        {isExceedingBudget && enteredAmountBDT > 0 && (
          <div className="mt-3 pt-3 border-t border-slate-800 flex items-start gap-2 text-rose-300 text-xs">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <p>
              Warning: Entered amount ({formatBDT(enteredAmountPaisa)}) exceeds your available balance ({formatBDT(effectiveAvailablePaisa)}) by{" "}
              <strong>{formatBDT(enteredAmountPaisa - effectiveAvailablePaisa)}</strong>. Submissions over the allocated ceiling may be flagged or rejected.
            </p>
          </div>
        )}
      </div>

      {serverError && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{serverError}</span>
        </div>
      )}

      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Main Form */}
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
        {/* Title */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Voucher Title *
          </label>
          <Input
            placeholder="e.g., Tactical Radar Maintenance Parts Replacement"
            {...register("title")}
          />
          {errors.title && (
            <p className="text-xs text-rose-600">{errors.title.message}</p>
          )}
        </div>

        {/* Amount & Category Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Amount in BDT */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Amount (৳ BDT) *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-slate-400 font-bold text-sm">
                ৳
              </span>
              <Input
                type="number"
                step="1"
                placeholder="25000"
                className="pl-8 font-mono text-sm font-semibold"
                {...register("amountBDT", { valueAsNumber: true })}
              />
            </div>
            {errors.amountBDT && (
              <p className="text-xs text-rose-600">{errors.amountBDT.message}</p>
            )}
          </div>

          {/* Category */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Expense Category *
            </label>
            <select
              {...register("categoryId")}
              className="w-full h-10 px-3 py-2 bg-white rounded-lg border border-slate-300 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0d2847]"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            {errors.categoryId && (
              <p className="text-xs text-rose-600">{errors.categoryId.message}</p>
            )}
          </div>
        </div>

        {/* Date & Reference Number Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Date */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Transaction Date *
            </label>
            <Input
              type="date"
              icon={<Calendar className="w-4 h-4 text-slate-400" />}
              {...register("date")}
            />
            {errors.date && (
              <p className="text-xs text-rose-600">{errors.date.message}</p>
            )}
          </div>

          {/* Reference */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Reference / Voucher Number *
            </label>
            <Input
              icon={<Hash className="w-4 h-4 text-slate-400" />}
              className="font-mono text-sm"
              {...register("referenceNumber")}
            />
            {errors.referenceNumber && (
              <p className="text-xs text-rose-600">{errors.referenceNumber.message}</p>
            )}
          </div>
        </div>

        {/* Description */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Description / Purpose
          </label>
          <Textarea
            placeholder="Detail the operational justification, requisition voucher number, or purpose of expenditure..."
            rows={3}
            {...register("description")}
          />
        </div>

        {/* Administrative Notes */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Internal Administrative Notes
          </label>
          <Input
            placeholder="e.g., Quotation approved by Officer Commanding, awaiting delivery challan"
            {...register("notes")}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="naval"
            disabled={isSubmitting}
            className="min-w-32"
          >
            {isSubmitting
              ? "Submitting..."
              : initialData
              ? "Save Changes"
              : "Record Expense"}
          </Button>
        </div>
      </form>
    </div>
  );
}
