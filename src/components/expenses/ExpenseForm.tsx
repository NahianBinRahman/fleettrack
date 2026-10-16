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
  title: z.string().min(3, "ভাউচারের শিরোনাম কমপক্ষে ৩ অক্ষরের হতে হবে").max(100, "শিরোনাম অতিরিক্ত দীর্ঘ"),
  categoryId: z.string().min(1, "একটি ব্যয়ের খাত নির্বাচন করুন"),
  amountBDT: z
    .number()
    .positive("টাকার পরিমাণ ০ এর বেশি হতে হবে"),
  date: z.string().min(1, "লেনদেনের তারিখ আবশ্যক"),
  referenceNumber: z.string().min(3, "রেফারেন্স নম্বর আবশ্যক"),
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
    if (isExceedingBudget) {
      setServerError(
        `দাখিল ব্যর্থ: এই ভাউচারটি (${formatBDT(enteredAmountPaisa)}) আপনার অবশিষ্ট বার্ষিক বাজেটের (${formatBDT(effectiveAvailablePaisa)}) চেয়ে বেশি। বার্ষিক বরাদ্দের ১০০% এর বেশি ব্যয় অনুমোদিত নয়।`
      );
      return;
    }

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
        setServerError(result.error || "ভাউচার সংরক্ষণে ত্রুটি দেখা দিয়েছে");
      } else {
        setSuccessMessage("ব্যয় ভাউচারটি সফলভাবে লেজারে যুক্ত হয়েছে!");
      }
    } catch (err: any) {
      setServerError(err.message || "একটি অপ্রত্যাশিত ত্রুটি ঘটেছে");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Live Budget Context Card */}
      <div className="p-4 bg-slate-900 text-white rounded-2xl border border-slate-800 shadow-md">
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800 text-xs font-semibold uppercase tracking-wider text-slate-400">
          <span>সক্রিয় বাজেট বরাদ্দ (FY 2026)</span>
          <span className="text-[#d4af37]">বাংলাদেশি টাকা (BDT)</span>
        </div>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div>
            <p className="text-[11px] text-slate-400">বার্ষিক বাজেট</p>
            <p className="text-sm sm:text-base font-bold text-slate-100 font-mono mt-0.5">
              {formatBDT(budgetContext.allocatedPaisa)}
            </p>
          </div>
          <div>
            <p className="text-[11px] text-slate-400">ব্যয়কৃত</p>
            <p className="text-sm sm:text-base font-bold text-amber-400 font-mono mt-0.5">
              {formatBDT(budgetContext.committedPaisa)}
            </p>
          </div>
          <div>
            <p className="text-[11px] text-slate-400">অবশিষ্ট</p>
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
          <div className="mt-3 pt-3 border-t border-slate-800 flex items-start gap-2.5 text-rose-300 text-xs p-2.5 rounded-xl bg-rose-950/60 border border-rose-500/40">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-rose-200">কঠোর বাজেট সীমা প্রয়োগকৃত (সর্বোচ্চ ১০০%)</p>
              <p className="mt-0.5 leading-relaxed">
                প্রদত্ত ভাউচারের পরিমাণ ({formatBDT(enteredAmountPaisa)}) অবশিষ্ট বাজেটের সীমা ({formatBDT(effectiveAvailablePaisa)}) অপেক্ষা{" "}
                <strong className="underline">{formatBDT(enteredAmountPaisa - effectiveAvailablePaisa)}</strong> বেশি। বরাদ্দের ১০০% অতিক্রম করার কারণে দাখিল ব্লক করা হয়েছে।
              </p>
            </div>
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
            ভাউচারের শিরোনাম *
          </label>
          <Input
            placeholder="যেমন: ট্যাকটিক্যাল রাডার রক্ষণাবেক্ষণ যন্ত্রাংশ প্রতিস্থাপন"
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
              টাকার পরিমাণ (৳ BDT) *
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
              ব্যয়ের খাত / ক্যাটাগরি *
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
              লেনদেনের তারিখ *
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
              রেফারেন্স / ভাউচার নম্বর *
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
            বিবরণ / উদ্দেশ্য
          </label>
          <Textarea
            placeholder="অপারেশনাল যৌক্তিকতা, রিকুইজিশন ভাউচার নম্বর বা ব্যয়ের বিস্তারিত উদ্দেশ্য..."
            rows={3}
            {...register("description")}
          />
        </div>

        {/* Administrative Notes */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
            প্রশাসনিক নোট (যদি থাকে)
          </label>
          <Input
            placeholder="যেমন: কমান্ডিং অফিসার কর্তৃক কোটেশন অনুমোদিত, ডেলিভারি চালানের অপেক্ষা"
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
            বাতিল
          </Button>
          <Button
            type="submit"
            variant="naval"
            disabled={isSubmitting || (isExceedingBudget && enteredAmountBDT > 0)}
            className="min-w-32"
          >
            {isSubmitting
              ? "সংরক্ষণ হচ্ছে..."
              : isExceedingBudget && enteredAmountBDT > 0
              ? "১০০% বাজেট অতিক্রম করেছে"
              : initialData
              ? "পরিবর্তন সংরক্ষণ করুন"
              : "ব্যয় যুক্ত করুন"}
          </Button>
        </div>
      </form>
    </div>
  );
}
