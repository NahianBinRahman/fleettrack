"use client";

import React from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Calendar, ChevronDown } from "lucide-react";

interface YearOption {
  id: string;
  year: number;
  label: string;
  status: string;
}

interface FinancialYearSelectorProps {
  years: YearOption[];
  currentYearId: string;
  className?: string;
}

export function FinancialYearSelector({
  years,
  currentYearId,
  className,
}: FinancialYearSelectorProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = e.target.value;
    const params = new URLSearchParams(searchParams.toString());
    params.set("fy", selectedId);
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className={`relative inline-flex items-center ${className}`}>
      <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200/90 rounded-xl shadow-xs text-xs font-medium text-slate-700 hover:border-slate-300">
        <Calendar className="w-3.5 h-3.5 text-[#0d2847]" />
        <span className="text-slate-400">FY:</span>
        <select
          value={currentYearId}
          onChange={handleYearChange}
          className="bg-transparent border-0 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-0 cursor-pointer pr-4"
        >
          {years.map((y) => (
            <option key={y.id} value={y.id}>
              {y.label} ({y.status})
            </option>
          ))}
        </select>
        <ChevronDown className="w-3 h-3 text-slate-400 -ml-3 pointer-events-none" />
      </div>
    </div>
  );
}
