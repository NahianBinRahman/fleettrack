"use client";

import React from "react";
import { BudgetMetrics, formatBDT, getStatusTheme } from "@/lib/money";
import { BudgetStatusBadge } from "./BudgetStatusBadge";
import { MoneyDisplay } from "./MoneyDisplay";
import { cn } from "@/lib/utils";

interface BudgetProgressRingProps {
  metrics: BudgetMetrics;
  size?: number;
  strokeWidth?: number;
  className?: string;
}

export function BudgetProgressRing({
  metrics,
  size = 240,
  strokeWidth = 20,
  className,
}: BudgetProgressRingProps) {
  const center = size / 2;
  const radius = center - strokeWidth;
  const circumference = 2 * Math.PI * radius;

  // Percentage calculations
  const spentRatio = Math.min(1, Math.max(0, metrics.spentPercentage / 100));
  const committedRatio = Math.min(1.2, Math.max(0, metrics.committedPercentage / 100));
  const pendingRatio = Math.max(0, committedRatio - spentRatio);

  const spentStrokeDashoffset = circumference - spentRatio * circumference;
  const committedStrokeDashoffset = circumference - Math.min(1, committedRatio) * circumference;

  const theme = getStatusTheme(metrics.statusLevel);

  return (
    <div className={cn("flex flex-col items-center justify-center p-6 bg-white rounded-2xl border border-slate-200/80 shadow-sm", className)}>
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          {/* Background Track */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="transparent"
            stroke="#f1f5f9"
            strokeWidth={strokeWidth}
          />

          {/* Pending Segment (Lighter Amber Arc) */}
          {pendingRatio > 0 && (
            <circle
              cx={center}
              cy={center}
              r={radius}
              fill="transparent"
              stroke="#f59e0b"
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={committedStrokeDashoffset}
              strokeLinecap="round"
              className="transition-all duration-700 ease-out opacity-60"
            />
          )}

          {/* Spent Segment (Primary Arc) */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="transparent"
            stroke={theme.ringColor}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={spentStrokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-700 ease-out"
          />
        </svg>

        {/* Center Content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
          <span className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 tabular-nums">
            {metrics.committedPercentage.toFixed(0)}%
          </span>
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 mt-0.5">
            Budget Used
          </span>
          <div className="mt-1 text-xs text-slate-600 font-medium">
            <span className="font-semibold text-slate-800">{formatBDT(metrics.committedPaisa)}</span>
            {" "}of{" "}
            <span className="text-slate-500">{formatBDT(metrics.allocatedPaisa)}</span>
          </div>
        </div>
      </div>

      {/* Legend & Key Breakdown */}
      <div className="grid grid-cols-3 gap-2 w-full mt-6 pt-5 border-t border-slate-100 text-center">
        <div className="flex flex-col items-center">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: theme.ringColor }} />
            Spent
          </div>
          <MoneyDisplay amountInPaisa={metrics.spentPaisa} size="sm" className="mt-1" />
          <span className="text-[10px] text-slate-400">{metrics.spentPercentage.toFixed(0)}%</span>
        </div>

        <div className="flex flex-col items-center">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            Pending
          </div>
          <MoneyDisplay amountInPaisa={metrics.pendingPaisa} size="sm" color="amber" className="mt-1" />
          <span className="text-[10px] text-slate-400">
            {(metrics.committedPercentage - metrics.spentPercentage).toFixed(0)}%
          </span>
        </div>

        <div className="flex flex-col items-center">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-300" />
            Remaining
          </div>
          <MoneyDisplay
            amountInPaisa={metrics.availablePaisa}
            size="sm"
            color={metrics.isOverBudget ? "rose" : "emerald"}
            className="mt-1"
          />
          <span className="text-[10px] text-slate-400">
            {Math.max(0, 100 - metrics.committedPercentage).toFixed(0)}%
          </span>
        </div>
      </div>

      {/* Contextual Status Pill */}
      <div className="mt-4 flex flex-col items-center gap-1.5">
        <BudgetStatusBadge status={metrics.statusLevel} />
        <p className="text-xs text-slate-500 text-center font-medium">
          {metrics.isOverBudget
            ? `Warning: Exceeded allocated budget by ${formatBDT(-metrics.availablePaisa)}`
            : `${formatBDT(metrics.availablePaisa)} remaining for official allocations`}
        </p>
      </div>
    </div>
  );
}
