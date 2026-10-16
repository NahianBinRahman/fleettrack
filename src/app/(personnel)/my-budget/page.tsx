import React from "react";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { calculateBudgetMetrics, formatBDT } from "@/lib/money";
import { PageHeader } from "@/components/shared/PageHeader";
import { BudgetStatusBadge } from "@/components/budget/BudgetStatusBadge";
import { MoneyDisplay } from "@/components/budget/MoneyDisplay";
import { BudgetProgressRing } from "@/components/budget/BudgetProgressRing";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Wallet,
  ShieldCheck,
  History,
  Tag,
  CheckCircle2,
  Calendar,
  AlertCircle,
  FileCheck,
} from "lucide-react";
import { format } from "date-fns";

const categoryTranslation: Record<string, string> = {
  "Fuel & Propulsion": "জ্বালানি ও পরিচালনা",
  "Hull & Machinery Maintenance": "জাহাজ ও যন্ত্রপাতি মেরামত",
  "Operational Provisions & Messing": "রেশন ও মেস সরবরাহ",
  "Naval Aviation & Flight Operations": "এভিয়েশন ও ফ্লাইট কার্যক্রম",
  "Medical Supplies & Healthcare": "চিকিৎসা সামগ্রী ও সেবা",
  "Telecommunications & IT": "টেলিকম ও তথ্যপ্রযুক্তি",
  "Training & Fleet Exercises": "প্রশিক্ষণ ও নৌমহড়া",
  "Administrative Stationery & Supplies": "দাপ্তরিক স্টেশনারি ও সামগ্রী",
  "Uniform & Personnel Gear": "পোশাক ও সামরিক সরঞ্জাম",
  "Port Logistics & Berthing": "বন্দর লজিস্টিকস ও নোঙর",
};

function formatBengaliDateTime(d: Date | string): string {
  const dateObj = new Date(d);
  const day = dateObj.getDate();
  const banglaMonths = [
    "জানুয়ারি", "ফেব্রুয়ারি", "মার্চ", "এপ্রিল", "মে", "জুন",
    "জুলাই", "আগস্ট", "সেপ্টেম্বর", "অক্টোবর", "নভেম্বর", "ডিসেম্বর"
  ];
  const month = banglaMonths[dateObj.getMonth()];
  const year = dateObj.getFullYear();
  const hours = dateObj.getHours().toString().padStart(2, "0");
  const minutes = dateObj.getMinutes().toString().padStart(2, "0");
  return `${day} ${month} ${year}, ${hours}:${minutes}`;
}

export default async function MyBudgetPage({
  searchParams,
}: {
  searchParams: Promise<{ fy?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const resolvedParams = await searchParams;

  let activeYear;
  if (resolvedParams?.fy) {
    activeYear = await db.financialYear.findUnique({
      where: { id: resolvedParams.fy },
    });
  }
  if (!activeYear) {
    activeYear = await db.financialYear.findFirst({
      where: { status: "ACTIVE" },
    });
  }
  if (!activeYear) {
    activeYear = await db.financialYear.findFirst({
      orderBy: { year: "desc" },
    });
  }

  if (!activeYear) {
    return <div className="p-8 text-center text-slate-500">কোনো অর্থবছর সক্রিয় নেই।</div>;
  }

  // হিস্ট্রি সহ ইউজারের বাজেট বরাদ্দ লোড
  const allocation = await db.budgetAllocation.findUnique({
    where: {
      userId_financialYearId: {
        userId: user.id,
        financialYearId: activeYear.id,
      },
    },
    include: {
      history: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

  const allocatedPaisa = allocation?.allocatedAmount ?? BigInt(0);

  // ইউজারের খরচ লোড
  const expenses = await db.expense.findMany({
    where: {
      userId: user.id,
      financialYearId: activeYear.id,
    },
    include: { category: true },
  });

  const spentPaisa = expenses
    .filter((e) => e.status === "APPROVED")
    .reduce((acc, e) => acc + e.amount, BigInt(0));

  const pendingPaisa = expenses
    .filter((e) => e.status === "PENDING" || e.status === "PROCESSING")
    .reduce((acc, e) => acc + e.amount, BigInt(0));

  const metrics = calculateBudgetMetrics(allocatedPaisa, spentPaisa, pendingPaisa);

  // খাতভিত্তিক সারসংক্ষেপ
  const categorySummary: Record<string, { spent: bigint; count: number }> = {};
  expenses.forEach((e) => {
    const rawName = e.category.name;
    const name = categoryTranslation[rawName] || rawName;
    if (!categorySummary[name]) {
      categorySummary[name] = { spent: BigInt(0), count: 0 };
    }
    if (e.status === "APPROVED" || e.status === "PENDING") {
      categorySummary[name].spent += e.amount;
      categorySummary[name].count += 1;
    }
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <PageHeader
        title="আমার বার্ষিক বাজেট বরাদ্দ (My Budget Allocation)"
        description={`${activeYear.label} অর্থবছরে ${user.name} (${user.serviceId})-এর জন্য নির্ধারিত সরকারি বাজেট সিলিং ও ব্যয়ের বিবরণ।`}
        badge={<BudgetStatusBadge status={metrics.statusLevel} bangla={true} />}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* বাম কলাম: বাজেট প্রগ্রেস মিটার */}
        <div className="lg:col-span-1">
          <BudgetProgressRing metrics={metrics} bangla={true} />
        </div>

        {/* ডান কলাম: বরাদ্দ কোটা ও হিসাব কার্ড */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-slate-200/80 shadow-xs">
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[#0d2847]" />
                অফিসিয়াল বরাদ্দ কোটা (Sanctioned Quota)
              </CardTitle>
              <CardDescription className="text-xs text-slate-500 mt-0.5">
                নেভাল প্রশাসনিক কমান্ড কর্তৃক অনুমোদিত বার্ষিক সিলিং
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200/80 text-center">
                <div>
                  <span className="text-[11px] text-slate-500 font-semibold uppercase">
                    অনুমোদিত মোট বরাদ্দ
                  </span>
                  <div className="mt-1">
                    <MoneyDisplay
                      amountInPaisa={allocatedPaisa}
                      size="xl"
                      color="blue"
                    />
                  </div>
                </div>

                <div>
                  <span className="text-[11px] text-slate-500 font-semibold uppercase">
                    মোট ব্যবহৃত / দায়বদ্ধ
                  </span>
                  <div className="mt-1">
                    <MoneyDisplay
                      amountInPaisa={metrics.committedPaisa}
                      size="xl"
                      color="amber"
                    />
                  </div>
                  <span className="text-[10px] text-slate-400">
                    বরাদ্দের {metrics.committedPercentage.toFixed(1)}%
                  </span>
                </div>

                <div>
                  <span className="text-[11px] text-slate-500 font-semibold uppercase">
                    অবশিষ্ট ব্যালেন্স
                  </span>
                  <div className="mt-1">
                    <MoneyDisplay
                      amountInPaisa={metrics.availablePaisa}
                      size="xl"
                      color={metrics.isOverBudget ? "rose" : "emerald"}
                    />
                  </div>
                  <span className="text-[10px] text-slate-400">
                    {metrics.isOverBudget ? "ঘাটতি (Deficit)" : "নতুন খরচের জন্য অবশিষ্ট"}
                  </span>
                </div>
              </div>

              {allocation?.notes && (
                <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-lg text-xs text-blue-950 flex items-start gap-2.5">
                  <FileCheck className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">প্রশাসনিক নির্দেশনা (Directive): </span>
                    {allocation.notes}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* বরাদ্দ পরিবর্তন ও অডিট হিস্ট্রি */}
          <Card className="border-slate-200/80 shadow-xs">
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                <History className="w-4 h-4 text-[#0d2847]" />
                বরাদ্দ সমন্বয় ও অডিট রেকর্ড (Audit History)
              </CardTitle>
              <CardDescription className="text-xs text-slate-500 mt-0.5">
                হেডকোয়ার্টার্স কর্তৃক বরাদ্দের অতীত সমন্বয় ও অনুমোদনের ইতিহাস
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-3">
              {!allocation?.history || allocation.history.length === 0 ? (
                <p className="text-xs text-slate-400 py-3">
                  প্রাথমিক বেসলাইন বরাদ্দ সক্রিয় রয়েছে, কোনো পরিবর্তন করা হয়নি।
                </p>
              ) : (
                <div className="space-y-3">
                  {allocation.history.map((hist) => (
                    <div
                      key={hist.id}
                      className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">
                            সংশোধিত বরাদ্দ: {formatBDT(hist.newAmount)}
                          </span>
                          {hist.previousAmount > BigInt(0) && (
                            <span className="text-[10px] text-slate-500 font-mono">
                              (পূর্বে ছিল {formatBDT(hist.previousAmount)})
                            </span>
                          )}
                        </div>
                        {hist.reason && (
                          <p className="text-slate-600 italic">
                            &ldquo;{hist.reason}&rdquo;
                          </p>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-400 font-mono shrink-0">
                        {formatBengaliDateTime(hist.createdAt)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* খাতভিত্তিক খরচের বিবরণ */}
      <Card className="border-slate-200/80 shadow-xs">
        <CardHeader className="border-b border-slate-100">
          <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Tag className="w-4 h-4 text-[#0d2847]" />
            খাতভিত্তিক ব্যয়ের বিবরণ (Category Breakdown)
          </CardTitle>
          <CardDescription className="text-xs text-slate-500 mt-0.5">
            চলতি অর্থবছরে বিভিন্ন অপারেশনাল খাতে মোট ব্যয়ের হিসাব
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(categorySummary).map(([catName, data]) => {
              const catPercent =
                allocatedPaisa > BigInt(0)
                  ? Number((data.spent * BigInt(1000)) / allocatedPaisa) / 10
                  : 0;

              return (
                <div
                  key={catName}
                  className="p-4 rounded-xl border border-slate-200 bg-white space-y-2 hover:border-slate-300 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-800">
                      {catName}
                    </span>
                    <span className="text-[11px] font-mono text-slate-500">
                      {data.count} টি ভাউচার
                    </span>
                  </div>

                  <div className="flex items-baseline justify-between">
                    <MoneyDisplay amountInPaisa={data.spent} size="base" color="blue" />
                    <span className="text-xs font-semibold text-slate-600">
                      {catPercent.toFixed(1)}%
                    </span>
                  </div>

                  {/* মাইক্রো প্রগ্রেস বার */}
                  <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#163860] rounded-full"
                      style={{ width: `${Math.min(100, catPercent)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
