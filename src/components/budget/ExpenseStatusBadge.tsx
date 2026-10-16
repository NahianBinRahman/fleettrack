import React from "react";
import { Badge } from "@/components/ui/badge";
import { Clock, CheckCircle2, XCircle, Ban, RefreshCw } from "lucide-react";

interface ExpenseStatusBadgeProps {
  status: string;
  className?: string;
  bangla?: boolean;
}

export function ExpenseStatusBadge({ status, className, bangla = false }: ExpenseStatusBadgeProps) {
  const normStatus = status.toUpperCase();

  switch (normStatus) {
    case "APPROVED":
      return (
        <Badge variant="success" className={className}>
          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
          {bangla ? "অনুমোদিত" : "Approved / Spent"}
        </Badge>
      );
    case "PENDING":
      return (
        <Badge variant="warning" className={className}>
          <Clock className="w-3 h-3 text-amber-600" />
          {bangla ? "অপেক্ষমাণ" : "Pending"}
        </Badge>
      );
    case "PROCESSING":
      return (
        <Badge variant="info" className={className}>
          <RefreshCw className="w-3 h-3 text-blue-600 animate-spin" />
          {bangla ? "প্রক্রিয়াধীন" : "Processing"}
        </Badge>
      );
    case "REJECTED":
      return (
        <Badge variant="destructive" className={className}>
          <XCircle className="w-3 h-3 text-rose-600" />
          {bangla ? "প্রত্যাখ্যাত" : "Rejected"}
        </Badge>
      );
    case "CANCELLED":
      return (
        <Badge variant="secondary" className={className}>
          <Ban className="w-3 h-3 text-slate-500" />
          {bangla ? "বাতিলকৃত" : "Cancelled"}
        </Badge>
      );
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}
