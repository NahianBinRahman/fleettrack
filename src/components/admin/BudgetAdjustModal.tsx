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
      setErrorMessage("New allocation amount must be greater than zero.");
      return;
    }

    if (isBelowCommitted && !allowBelowCommitted) {
      setErrorMessage(
        "Allocation cannot be reduced below already committed funds without explicit administrative override acknowledgment."
      );
      return;
    }

    if (!reason.trim()) {
      setErrorMessage("Please state the administrative justification for adjusting this officer's allocation.");
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
        setErrorMessage(result.error || "Failed to update allocation.");
      } else {
        onClose();
      }
    } catch (err: any) {
      setErrorMessage(err.message || "An error occurred.");
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
              Administrative Authorization
            </span>
            <h3 className="text-lg font-bold text-white mt-0.5">
              Adjust Annual Budget Allocation
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
                Current Allocation
              </span>
              <p className="text-base font-bold font-mono text-slate-900 mt-0.5">
                {formatBDT(personnel.currentAllocatedPaisa)}
              </p>
              <p className="text-[11px] text-slate-500 mt-1 font-mono">
                Committed: {formatBDT(committedPaisa)}
              </p>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase text-slate-500">
                New Proposed Allocation
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
                  ({differencePaisa > BigInt(0) ? "increment" : differencePaisa < BigInt(0) ? "reduction" : "no change"})
                </span>
              </p>
            </div>
          </div>

          {/* Resulting Available Context */}
          <div className="p-3 rounded-lg bg-blue-50/70 border border-blue-200/80 flex items-center justify-between text-xs">
            <span className="text-blue-950 font-medium">
              Resulting Available Balance:
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
                Critical Business Rule Warning
              </div>
              <p className="leading-relaxed text-rose-700">
                The proposed allocation ({formatBDT(newAmountPaisa)}) is lower than the officer's already committed funds ({formatBDT(committedPaisa)}). Reducing below committed vouchers will put this account into a budget deficit of{" "}
                <strong>{formatBDT(-newAvailablePaisa)}</strong>.
              </p>
              <label className="flex items-center gap-2 pt-1 font-medium text-rose-900 cursor-pointer">
                <input
                  type="checkbox"
                  checked={allowBelowCommitted}
                  onChange={(e) => setAllowBelowCommitted(e.target.checked)}
                  className="rounded text-rose-600 focus:ring-rose-500"
                />
                Confirm administrative authority override to reduce below committed amount
              </label>
            </div>
          )}

          {/* Input New Amount */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
              New Annual Allocation (৳ BDT) *
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
              Official Directive / Reason for Adjustment *
            </label>
            <Textarea
              placeholder="e.g., Authorized mid-year budget increment per Naval Administrative Order #44/2026 for urgent drydock deployment."
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
            />
            <p className="text-[11px] text-slate-500">
              This adjustment and rationale will be permanently recorded in the immutable audit ledger.
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
              Cancel
            </Button>
            <Button
              type="submit"
              variant="naval"
              disabled={isSubmitting || (isBelowCommitted && !allowBelowCommitted)}
            >
              {isSubmitting ? "Authorizing..." : "Authorize Allocation"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
