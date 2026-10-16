import React from "react";
import { BudgetMetrics, formatBDT } from "@/lib/money";
import { AlertCircle, AlertTriangle, CheckCircle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

interface BudgetAlertProps {
  metrics: BudgetMetrics;
  className?: string;
  bangla?: boolean;
}

export function BudgetAlert({ metrics, className, bangla = false }: BudgetAlertProps) {
  // If committed percentage is over 100%
  if (metrics.committedPercentage > 100) {
    return (
      <div
        className={cn(
          "flex items-start gap-3 p-4 rounded-xl border border-rose-200 bg-rose-50 text-rose-900 text-sm",
          className
        )}
      >
        <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-rose-800">
            {bangla ? "বাজেট বরাদ্দ অতিক্রম করেছে (Exceeded)" : "Budget Allocation Exceeded"}
          </p>
          <p className="text-rose-700 text-xs leading-relaxed">
            {bangla
              ? `আপনার দাখিলকৃত ব্যয় (${formatBDT(metrics.committedPaisa)}) বার্ষিক নির্ধারিত সিলিং ${formatBDT(metrics.allocatedPaisa)} ছাড়িয়ে গেছে (ঘাটতি: ${formatBDT(-metrics.availablePaisa)})। পরবর্তী ভাউচার অনুমোদনের জন্য অ্যাডমিন কর্তৃক অতিরিক্ত বরাদ্দ প্রয়োজন।`
              : `Your committed expenditures (${formatBDT(metrics.committedPaisa)}) exceed your annual allocated ceiling of ${formatBDT(metrics.allocatedPaisa)} by ${formatBDT(-metrics.availablePaisa)}. Further expense approvals require an authorized budget increment from the Administrator.`}
          </p>
        </div>
      </div>
    );
  }

  // Critical (95 - 100%)
  if (metrics.committedPercentage >= 95) {
    return (
      <div
        className={cn(
          "flex items-start gap-3 p-4 rounded-xl border border-orange-200 bg-orange-50 text-orange-900 text-sm",
          className
        )}
      >
        <AlertTriangle className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-orange-800">
            {bangla ? "জরুরি বাজেট সতর্কতা (Critical Threshold)" : "Critical Allocation Threshold"}
          </p>
          <p className="text-orange-700 text-xs leading-relaxed">
            {bangla
              ? `আপনি আপনার বার্ষিক বরাদ্দের ${metrics.committedPercentage.toFixed(1)}% ব্যয় করে ফেলেছেন। নতুন ব্যয়ের জন্য মাত্র ${formatBDT(metrics.availablePaisa)} অবশিষ্ট রয়েছে।`
              : `You have committed ${metrics.committedPercentage.toFixed(1)}% of your annual budget. Only ${formatBDT(metrics.availablePaisa)} remains available for pending official expenditures.`}
          </p>
        </div>
      </div>
    );
  }

  // Approaching Limit (80 - 95%)
  if (metrics.committedPercentage >= 80) {
    return (
      <div
        className={cn(
          "flex items-start gap-3 p-4 rounded-xl border border-amber-200 bg-amber-50 text-amber-900 text-sm",
          className
        )}
      >
        <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-amber-800">
            {bangla ? "বাজেট সীমার কাছাকাছি (Approaching Limit)" : "Approaching Budget Limit"}
          </p>
          <p className="text-amber-700 text-xs leading-relaxed">
            {bangla
              ? `আপনার বার্ষিক বরাদ্দের ${metrics.committedPercentage.toFixed(1)}% ব্যয় সম্পন্ন হয়েছে। বর্তমানে অবশিষ্ট রয়েছে ${formatBDT(metrics.availablePaisa)}।${
                  metrics.pendingPaisa > BigInt(0)
                    ? ` (এর মধ্যে ${formatBDT(metrics.pendingPaisa)} অনুমোদনের অপেক্ষায় আছে)`
                    : ""
                }`
              : `You have utilized ${metrics.committedPercentage.toFixed(1)}% of your annual budget. Available remaining balance is ${formatBDT(metrics.availablePaisa)}.${
                  metrics.pendingPaisa > BigInt(0)
                    ? ` (${formatBDT(metrics.pendingPaisa)} is currently pending approval).`
                    : ""
                }`}
          </p>
        </div>
      </div>
    );
  }

  // Pending Notice if there's pending money
  if (metrics.pendingPaisa > BigInt(0)) {
    return (
      <div
        className={cn(
          "flex items-start gap-3 p-4 rounded-xl border border-blue-200 bg-blue-50/80 text-blue-900 text-sm",
          className
        )}
      >
        <Info className="w-5 h-5 text-[#0d2847] shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-blue-950">
            {bangla ? "ভাউচার পর্যালোচনায় রয়েছে (Pending Vouchers)" : "Pending Expenditures Under Review"}
          </p>
          <p className="text-blue-800 text-xs leading-relaxed">
            {bangla
              ? `মোট ${formatBDT(metrics.pendingPaisa)} মূল্যের ভাউচার অনুমোদনের অপেক্ষায় রয়েছে। আপনার অব্যবহৃত অবশিষ্ট বাজেট ${formatBDT(metrics.availablePaisa)}।`
              : `${formatBDT(metrics.pendingPaisa)} is currently in processing/pending approval status. Your uncommitted available budget is ${formatBDT(metrics.availablePaisa)}.`}
          </p>
        </div>
      </div>
    );
  }

  // Healthy state
  return (
    <div
      className={cn(
        "flex items-start gap-3 p-4 rounded-xl border border-emerald-200 bg-emerald-50/70 text-emerald-900 text-sm",
        className
      )}
    >
      <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
      <div className="space-y-1">
        <p className="font-semibold text-emerald-950">
          {bangla ? "বাজেট স্থিতি সন্তোষজনক (Healthy Status)" : "Budget Status Healthy"}
        </p>
        <p className="text-emerald-800 text-xs leading-relaxed">
          {bangla
            ? `আপনি বার্ষিক বরাদ্দের ${metrics.committedPercentage.toFixed(1)}% ব্যবহার করেছেন। নতুন বরাদ্দের জন্য পর্যাপ্ত তহবিল (${formatBDT(metrics.availablePaisa)}) অবশিষ্ট রয়েছে।`
            : `You have utilized ${metrics.committedPercentage.toFixed(1)}% of your annual allocation. Your remaining available budget is ${formatBDT(metrics.availablePaisa)}.`}
        </p>
      </div>
    </div>
  );
}
