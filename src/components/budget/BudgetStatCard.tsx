import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { MoneyDisplay } from "./MoneyDisplay";
import { cn } from "@/lib/utils";

interface BudgetStatCardProps {
  title: string;
  amountInPaisa: bigint | number;
  subtitle?: string;
  icon: React.ReactNode;
  variant?: "primary" | "spent" | "pending" | "remaining" | "neutral";
  percentage?: number;
  highlight?: boolean;
}

export function BudgetStatCard({
  title,
  amountInPaisa,
  subtitle,
  icon,
  variant = "neutral",
  percentage,
  highlight = false,
}: BudgetStatCardProps) {
  const borderVariants = {
    primary: "border-blue-900/20 bg-gradient-to-br from-white to-blue-50/40",
    spent: "border-slate-200 bg-white",
    pending: "border-amber-200/80 bg-gradient-to-br from-white to-amber-50/30",
    remaining: highlight
      ? "border-emerald-500/40 bg-gradient-to-br from-white to-emerald-50/40 ring-1 ring-emerald-500/20"
      : "border-slate-200 bg-white",
    neutral: "border-slate-200 bg-white",
  };

  const iconBgVariants = {
    primary: "bg-[#0d2847]/10 text-[#0d2847]",
    spent: "bg-slate-100 text-slate-700",
    pending: "bg-amber-100 text-amber-800",
    remaining: "bg-emerald-100 text-emerald-800",
    neutral: "bg-slate-100 text-slate-700",
  };

  const moneyColor = {
    primary: "blue" as const,
    spent: "default" as const,
    pending: "amber" as const,
    remaining: "emerald" as const,
    neutral: "default" as const,
  };

  return (
    <Card className={cn("transition-all duration-200 hover:shadow-md", borderVariants[variant])}>
      <CardContent className="p-5 flex flex-col justify-between h-full">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              {title}
            </span>
            <div className="pt-0.5">
              <MoneyDisplay
                amountInPaisa={amountInPaisa}
                size="2xl"
                color={moneyColor[variant]}
              />
            </div>
          </div>
          <div className={cn("p-2.5 rounded-xl shrink-0", iconBgVariants[variant])}>
            {icon}
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>{subtitle || "Current Financial Year"}</span>
          {percentage !== undefined && (
            <span className="font-semibold text-slate-700">
              {percentage.toFixed(1)}% of total
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
