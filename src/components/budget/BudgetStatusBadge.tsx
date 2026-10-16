import React from "react";
import { BudgetStatusLevel } from "@/lib/money";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, AlertCircle, AlertTriangle, Flame, Info } from "lucide-react";

interface BudgetStatusBadgeProps {
  status: BudgetStatusLevel;
  className?: string;
  showIcon?: boolean;
  bangla?: boolean;
}

export function BudgetStatusBadge({
  status,
  className,
  showIcon = true,
  bangla = false,
}: BudgetStatusBadgeProps) {
  switch (status) {
    case "HEALTHY":
      return (
        <Badge variant="success" className={className}>
          {showIcon && <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />}
          {bangla ? "স্বাভাবিক (০–৬০%)" : "Healthy (0–60%)"}
        </Badge>
      );
    case "MODERATE":
      return (
        <Badge variant="info" className={className}>
          {showIcon && <Info className="w-3.5 h-3.5 text-blue-600" />}
          {bangla ? "মধ্যম (৬০–৮০%)" : "Moderate (60–80%)"}
        </Badge>
      );
    case "APPROACHING_LIMIT":
      return (
        <Badge variant="warning" className={className}>
          {showIcon && <AlertCircle className="w-3.5 h-3.5 text-amber-600" />}
          {bangla ? "সীমার কাছাকাছি (৮০–৯৫%)" : "Approaching Limit (80–95%)"}
        </Badge>
      );
    case "CRITICAL":
      return (
        <Badge variant="warning" className="border-orange-300 bg-orange-50 text-orange-800">
          {showIcon && <AlertTriangle className="w-3.5 h-3.5 text-orange-600" />}
          {bangla ? "জরুরি সতর্কতা (৯৫–১০০%)" : "Critical (95–100%)"}
        </Badge>
      );
    case "EXCEEDED":
      return (
        <Badge variant="destructive" className={className}>
          {showIcon && <Flame className="w-3.5 h-3.5 text-rose-600" />}
          {bangla ? "সীমা অতিক্রান্ত (>১০০%)" : "Exceeded Limit (>100%)"}
        </Badge>
      );
    default:
      return <Badge variant="outline">{bangla ? "অজানা" : "Unknown"}</Badge>;
  }
}
