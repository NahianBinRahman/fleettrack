"use client";

import React, { useState } from "react";
import { formatBDT } from "@/lib/money";
import { MoneyDisplay } from "@/components/budget/MoneyDisplay";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Calendar,
  PlusCircle,
  X,
  CheckCircle2,
  AlertCircle,
  Archive,
  FileCheck,
  ShieldAlert,
} from "lucide-react";
import {
  createFinancialYearAction,
  updateFinancialYearStatusAction,
} from "@/app/actions/admin";
import { format } from "date-fns";

interface FinancialYearRecord {
  id: string;
  year: number;
  label: string;
  totalBudget: bigint;
  status: string;
  startDate: Date | string;
  endDate: Date | string;
  _count?: {
    allocations: number;
    expenses: number;
  };
}

interface FinancialYearsClientProps {
  years: FinancialYearRecord[];
}

export function FinancialYearsClient({ years }: FinancialYearsClientProps) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form State
  const [yearNumber, setYearNumber] = useState<number>(2028);
  const [label, setLabel] = useState("FY 2027-2028");
  const [totalBudgetBDT, setTotalBudgetBDT] = useState<number>(12000000);
  const [status, setStatus] = useState("DRAFT");
  const [startDate, setStartDate] = useState("2027-07-01");
  const [endDate, setEndDate] = useState("2028-06-30");

  const handleCreateYear = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const res = await createFinancialYearAction({
        year: yearNumber,
        label,
        totalBudgetBDT,
        status,
        startDate,
        endDate,
      });

      if (!res.success) {
        setErrorMessage(res.error || "Failed to create financial year.");
      } else {
        setIsAddModalOpen(false);
      }
    } catch (err: any) {
      setErrorMessage(err.message || "An error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusChange = async (yearId: string, newStatus: string) => {
    await updateFinancialYearStatusAction(yearId, newStatus);
  };

  const getStatusBadge = (statusStr: string) => {
    switch (statusStr) {
      case "ACTIVE":
        return (
          <Badge variant="success" className="font-bold">
            <CheckCircle2 className="w-3 h-3" />
            সক্রিয় অর্থবছর (Active FY)
          </Badge>
        );
      case "CLOSED":
        return (
          <Badge variant="secondary" className="font-semibold text-slate-500">
            <Archive className="w-3 h-3" />
            সমাপ্ত (সংরক্ষিত লেজার)
          </Badge>
        );
      case "DRAFT":
        return (
          <Badge variant="outline" className="text-amber-600 border-amber-300">
            খসড়া (পরিকল্পনাধীন)
          </Badge>
        );
      default:
        return <Badge variant="outline">{statusStr}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">
            অর্থবছর লেজার ও সংবিধিবদ্ধ সংরক্ষণ
          </h2>
          <p className="text-xs text-slate-500">
            প্রতিটি অর্থবছর নিজস্ব স্বাধীন ও অপরিবর্তনীয় ঐতিহাসিক বরাদ্দ এবং ব্যয় রেকর্ড ধারণ করে
          </p>
        </div>

        <Button
          variant="naval"
          onClick={() => setIsAddModalOpen(true)}
          className="shadow-sm"
        >
          <PlusCircle className="w-4 h-4" />
          নতুন অর্থবছর যোগ করুন
        </Button>
      </div>

      {/* Grid of Financial Years */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {years.map((fy) => (
          <Card
            key={fy.id}
            className={`border transition-all duration-200 shadow-xs flex flex-col justify-between ${
              fy.status === "ACTIVE"
                ? "border-blue-900/30 ring-2 ring-[#0d2847]/10 bg-white"
                : "border-slate-200 bg-white/90"
            }`}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 font-mono">
                  {fy.year}
                </span>
                {getStatusBadge(fy.status)}
              </div>
              <CardTitle className="text-xl font-black text-slate-900 pt-1">
                {fy.label}
              </CardTitle>
              <CardDescription>
                {format(new Date(fy.startDate), "MMM yyyy")} &ndash; {format(new Date(fy.endDate), "MMM yyyy")}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  বার্ষিক সামগ্রিক বাজেট (Total Budget)
                </span>
                <div className="mt-1">
                  <MoneyDisplay
                    amountInPaisa={fy.totalBudget}
                    size="xl"
                    color="blue"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
                <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                  <p className="text-[10px] text-slate-400">বরাদ্দপ্রাপ্ত কর্মকর্তা</p>
                  <p className="font-bold text-slate-800 font-mono mt-0.5">
                    {fy._count?.allocations || 0}
                  </p>
                </div>
                <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                  <p className="text-[10px] text-slate-400">সংরক্ষিত ভাউচার</p>
                  <p className="font-bold text-slate-800 font-mono mt-0.5">
                    {fy._count?.expenses || 0}
                  </p>
                </div>
              </div>

              {/* Status Actions */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                {fy.status !== "ACTIVE" && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs text-blue-900 border-blue-200 hover:bg-blue-50"
                    onClick={() => handleStatusChange(fy.id, "ACTIVE")}
                  >
                    সক্রিয় অর্থবছর করুন
                  </Button>
                )}
                {fy.status === "ACTIVE" && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs text-slate-600 hover:bg-slate-100"
                    onClick={() => handleStatusChange(fy.id, "CLOSED")}
                  >
                    অর্থবছর সমাপ্ত করুন
                  </Button>
                )}
                {fy.status === "DRAFT" && (
                  <span className="text-[11px] text-amber-600 font-medium italic">
                    পরিকল্পনাধীন খসড়া
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Modal for Creating New Financial Year */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 bg-[#091726] text-white flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#d4af37]">
                  আর্থিক হিসাবরক্ষণ
                </span>
                <h3 className="text-lg font-bold text-white mt-0.5">
                  নতুন অর্থবছর তৈরি করুন
                </h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateYear} className="p-6 space-y-4">
              {errorMessage && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    আর্থিক বছর *
                  </label>
                  <Input
                    type="number"
                    value={yearNumber}
                    onChange={(e) => {
                      const yr = parseInt(e.target.value) || 2028;
                      setYearNumber(yr);
                      setLabel(`FY ${yr - 1}-${yr}`);
                    }}
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    লেবেল / নাম *
                  </label>
                  <Input
                    value={label}
                    onChange={(e) => setLabel(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  মোট সামগ্রিক বাজেট (৳ BDT) *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-400 font-bold text-sm">
                    ৳
                  </span>
                  <Input
                    type="number"
                    step="100000"
                    value={totalBudgetBDT}
                    onChange={(e) => setTotalBudgetBDT(parseFloat(e.target.value) || 0)}
                    className="pl-8 font-mono text-sm font-semibold"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    শুরুর তারিখ
                  </label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    সমাপ্তির তারিখ
                  </label>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  প্রাথমিক স্ট্যাটাস
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full h-10 px-3 py-2 bg-white rounded-lg border border-slate-300 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0d2847]"
                >
                  <option value="DRAFT">DRAFT (খসড়া পরিকল্পনা)</option>
                  <option value="ACTIVE">ACTIVE (বর্তমান সক্রিয় বছরটি ক্লোজ হবে)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddModalOpen(false)}
                  disabled={isSubmitting}
                >
                  বাতিল
                </Button>
                <Button
                  type="submit"
                  variant="naval"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "তৈরি হচ্ছে..." : "অর্থবছর প্রতিষ্ঠা করুন"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
