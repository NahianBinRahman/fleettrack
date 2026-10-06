import React from "react";
import { formatBDT } from "@/lib/money";
import { cn } from "@/lib/utils";

interface MoneyDisplayProps {
  amountInPaisa: bigint | number | null | undefined;
  className?: string;
  size?: "xs" | "sm" | "base" | "lg" | "xl" | "2xl" | "3xl";
  color?: "default" | "emerald" | "amber" | "rose" | "blue" | "muted" | "gold";
  includeDecimals?: boolean;
  compact?: boolean;
}

export function MoneyDisplay({
  amountInPaisa,
  className,
  size = "base",
  color = "default",
  includeDecimals = false,
  compact = false,
}: MoneyDisplayProps) {
  const formatted = formatBDT(amountInPaisa, { includeDecimals, compact });

  const sizeClasses = {
    xs: "text-xs font-semibold",
    sm: "text-sm font-semibold",
    base: "text-base font-semibold",
    lg: "text-lg font-bold tracking-tight",
    xl: "text-xl font-bold tracking-tight",
    "2xl": "text-2xl font-extrabold tracking-tight",
    "3xl": "text-3xl md:text-4xl font-black tracking-tight",
  };

  const colorClasses = {
    default: "text-slate-900 dark:text-slate-100",
    emerald: "text-emerald-600 dark:text-emerald-400",
    amber: "text-amber-600 dark:text-amber-400",
    rose: "text-rose-600 dark:text-rose-400",
    blue: "text-[#0d2847] dark:text-blue-400",
    muted: "text-slate-500 dark:text-slate-400",
    gold: "text-[#b08d24] dark:text-[#d4af37]",
  };

  return (
    <span className={cn("inline-flex items-baseline font-mono tabular-nums", sizeClasses[size], colorClasses[color], className)}>
      {formatted}
    </span>
  );
}
