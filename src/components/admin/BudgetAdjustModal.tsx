"use client";

import React, { useState } from "react";
import { formatBDT, bdtToPaisa, paisaToBDT } from "@/lib/money";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertTriangle,
  X,
  ArrowRight,
  ShieldAlert,
} from "lucide-react";

interface BudgetAdjustModalProps {
  isOpen: boolean;
  onClose: () => void;
  personnel: {
    userId: string;
    allocationId: string;
    name: string;
    rank?: string | null;
    serviceId: string;
    unit?: string | null;
    currentAllocatedPaisa: bigint;
    spentPaisa: bigint;
    pendingPaisa: bigint;
  };
  onSave: (data: {
    allocationId: string;
    newAmountPaisa: bigint;
    reason: string;
  }) => Promise<{ success: boolean; error?: string }>;
}

export function BudgetAdjustModal({
  isOpen,
  onClose,
  personnel,
  onSave,
}: BudgetAdjustModalProps) {
  const currentAllocatedBDT = paisaToBDT(personnel.currentAllocatedPaisa);
  const committedPaisa = personnel.spentPaisa + personnel.pendingPaisa;
  const committedBDT = paisaToBDT(committedPaisa);

  const [newAmountBDT, setNewAmountBDT] = useState<number>(currentAllocatedBDT);
  const [reason, setReason] = useState("");
  const [allowBelowCommitted, setAllowBelowCommitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const newAmountPaisa = bdtToPaisa(newAmountBDT || 0);
  const differencePaisa = newAmountPaisa - personnel.currentAllocatedPaisa;
  const newAvailablePaisa = newAmountPaisa - committedPaisa;
  const isBelowCommitted = newAmountPaisa < committedPaisa;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (newAmountBDT <= 0) {
      setErrorMessage("নতুন বরাদ্দের পরিমাণ অবশ্যই ০-এর বেশি হতে হবে।");
      return;
    }

    if (isBelowCommitted && !allowBelowCommitted) {
      setErrorMessage(
        "ইতিমধ্যে ব্যয়কৃত পরিমাণের চেয়ে নিচে বরাদ্দ কমাতে বিশেষ প্রশাসনিক ওভাররাইড সম্মতি প্রদান করা আবশ্যক।"
      );
      return;
    }

    if (!reason.trim()) {
      setErrorMessage("অনুগ্রহ করে এই কর্মকর্তার বাজেট পরিবর্তনের প্রশাসনিক কারণ বা নির্দেশনা উল্লেখ করুন।");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await onSave({
        allocationId: personnel.allocationId,
        newAmountPaisa,
        reason,
      });

      if (!result.success) {
        setErrorMessage(result.error || "বরাদ্দ হালনাগাদ করতে ব্যর্থ হয়েছে।");
      } else {
        onClose();
      }
    } catch (err: any) {
      setErrorMessage(err.message || "একটি ত্রুটি দেখা দিয়েছে।");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-6 bg-[#091726] text-white flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#d4af37]">
              প্রশাসনিক অনুমোদন
            </span>
            <h3 className="text-lg font-bold text-white mt-0.5">
              বার্ষিক বাজেট বরাদ্দ পরিবর্তন
            </h3>
            <p className="text-xs text-slate-300">
              {personnel.name} ({personnel.serviceId})
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Comparison Cards */}
          <div className="grid grid-cols-2 gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div>
              <span className="text-[10px] font-bold uppercase text-slate-500">
                বর্তমান বরাদ্দ
              </span>
              <p className="text-base font-bold font-mono text-slate-900 mt-0.5">
                {formatBDT(personnel.currentAllocatedPaisa)}
              </p>
              <p className="text-[11px] text-slate-500 mt-1 font-mono">
                ব্যয়কৃত: {formatBDT(committedPaisa)}
              </p>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase text-slate-500">
                প্রস্তাবিত নতুন বরাদ্দ
              </span>
              <p className="text-base font-bold font-mono text-blue-900 mt-0.5">
                {formatBDT(newAmountPaisa)}
              </p>
              <p
                className={`text-[11px] font-semibold mt-1 flex items-center gap-1 ${
                  differencePaisa > BigInt(0)
                    ? "text-emerald-600"
                    : differencePaisa < BigInt(0)
                    ? "text-rose-600"
                    : "text-slate-500"
                }`}
              >
                <span>
                  {differencePaisa >= BigInt(0) ? "+" : ""}
                  {formatBDT(differencePaisa)}
                </span>
                <span className="text-[10px] text-slate-400 font-normal">
                  ({differencePaisa > BigInt(0) ? "বৃদ্ধি" : differencePaisa < BigInt(0) ? "হ্রাস" : "অপরিবর্তিত"})
                </span>
              </p>
            </div>
          </div>

          {/* Resulting Available Context */}
          <div className="p-3 rounded-lg bg-blue-50/70 border border-blue-200/80 flex items-center justify-between text-xs">
            <span className="text-blue-950 font-medium">
              চূড়ান্ত অবশিষ্ট ব্যালেন্স:
            </span>
            <span
              className={`font-mono font-bold ${
                newAvailablePaisa < BigInt(0) ? "text-rose-600" : "text-emerald-700"
              }`}
            >
              {formatBDT(newAvailablePaisa)}
            </span>
          </div>

          {/* Warning if reducing below committed */}
          {isBelowCommitted && (
            <div className="p-4 rounded-xl border border-rose-300 bg-rose-50 text-rose-900 text-xs space-y-2">
              <div className="flex items-center gap-2 font-bold text-rose-800">
                <ShieldAlert className="w-4 h-4 text-rose-600" />
                সতর্কবার্তা: বাজেট নিয়ম লঙ্ঘন
              </div>
              <p className="leading-relaxed text-rose-700">
                প্রস্তাবিত বরাদ্দ ({formatBDT(newAmountPaisa)}) ইতিমধ্যে ব্যয়কৃত তহবিলের ({formatBDT(committedPaisa)}) চেয়ে কম। ব্যয়কৃত তহবিলের নিচে বরাদ্দ কমালে অ্যাকাউন্টটিতে{" "}
                <strong>{formatBDT(-newAvailablePaisa)}</strong> ঘাটতি সৃষ্টি হবে।
              </p>
              <label className="flex items-center gap-2 pt-1 font-medium text-rose-900 cursor-pointer">
                <input
                  type="checkbox"
                  checked={allowBelowCommitted}
                  onChange={(e) => setAllowBelowCommitted(e.target.checked)}
                  className="rounded text-rose-600 focus:ring-rose-500"
                />
                ব্যয়কৃত পরিমাণের নিচে বরাদ্দ কমাতে বিশেষ প্রশাসনিক অনুমোদন নিশ্চিত করছি
              </label>
            </div>
          )}

          {/* Input New Amount */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
              নতুন বার্ষিক বরাদ্দ (৳ BDT) *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-slate-400 font-bold text-sm">
                ৳
              </span>
              <Input
                type="number"
                step="5000"
                value={newAmountBDT}
                onChange={(e) => setNewAmountBDT(parseFloat(e.target.value) || 0)}
                className="pl-8 font-mono text-sm font-semibold"
                required
              />
            </div>
          </div>

          {/* Justification / Reason */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
              বরাদ্দ পরিবর্তনের সরকারি কারণ বা নির্দেশনা *
            </label>
            <Textarea
              placeholder="যেমন: নৌ প্রশাসনিক আদেশ ৪৪/২০২৬ অনুযায়ী ড্রাই ডক জরুরি অপারেশনের জন্য মধ্যবর্তী বরাদ্দ বৃদ্ধি।"
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
            />
            <p className="text-[11px] text-slate-500">
              এই সমন্বয় ও কারণ অডিট লেজারে স্থায়ীভাবে সংরক্ষিত হবে।
            </p>
          </div>

          {errorMessage && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              বাতিল
            </Button>
            <Button
              type="submit"
              variant="naval"
              disabled={isSubmitting || (isBelowCommitted && !allowBelowCommitted)}
            >
              {isSubmitting ? "অনুমোদন হচ্ছে..." : "বরাদ্দ অনুমোদন করুন"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
