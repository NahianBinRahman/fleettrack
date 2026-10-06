import React from "react";
import { BudgetMetrics, formatBDT, getStatusTheme } from "@/lib/money";
import { cn } from "@/lib/utils";

interface BudgetUtilizationBarProps {
  metrics: BudgetMetrics;
  showLabels?: boolean;
  className?: string;
}

export function BudgetUtilizationBar({
  metrics,
  showLabels = true,
  className,
}: BudgetUtilizationBarProps) {
  const theme = getStatusTheme(metrics.statusLevel);
  const spentWidth = Math.min(100, Math.max(0, metrics.spentPercentage));
  const pendingWidth = Math.min(
    100 - spentWidth,
    Math.max(0, metrics.committedPercentage - metrics.spentPercentage)
  );

  return (
    <div className={cn("w-full space-y-2", className)}>
      {showLabels && (
        <div className="flex justify-between items-center text-xs">
          <span className="text-slate-600 font-medium">
            {metrics.committedPercentage.toFixed(1)}% Committed
          </span>
          <span className="text-slate-500 font-mono">
            {formatBDT(metrics.committedPaisa)} / {formatBDT(metrics.allocatedPaisa)}
          </span>
        </div>
      )}

      {/* Progress Track */}
      <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden flex relative">
        <div
          className={cn("h-full transition-all duration-500", theme.progressBar)}
          style={{ width: `${spentWidth}%` }}
          title={`Spent: ${metrics.spentPercentage.toFixed(1)}%`}
        />
        <div
          className="h-full bg-amber-400 opacity-80 transition-all duration-500"
          style={{ width: `${pendingWidth}%` }}
          title={`Pending: ${(metrics.committedPercentage - metrics.spentPercentage).toFixed(1)}%`}
        />
      </div>

      {showLabels && (
        <div className="flex justify-between items-center text-[11px] text-slate-500">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1">
              <span className={cn("w-2 h-2 rounded-full", theme.progressBar)} />
              Spent: {formatBDT(metrics.spentPaisa)}
            </span>
            {metrics.pendingPaisa > BigInt(0) && (
              <span className="inline-flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                Pending: {formatBDT(metrics.pendingPaisa)}
              </span>
            )}
          </div>
          <span className={metrics.isOverBudget ? "text-rose-600 font-semibold" : "text-emerald-700 font-medium"}>
            {metrics.isOverBudget ? "Over Budget" : `${formatBDT(metrics.availablePaisa)} left`}
          </span>
        </div>
      )}
    </div>
  );
}
