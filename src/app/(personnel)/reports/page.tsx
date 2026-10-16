import React from "react";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { calculateBudgetMetrics, formatBDT } from "@/lib/money";
import { PageHeader } from "@/components/shared/PageHeader";
import { MoneyDisplay } from "@/components/budget/MoneyDisplay";
import { ExpenseStatusBadge } from "@/components/budget/ExpenseStatusBadge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Printer,
  Download,
  FileBarChart,
  Shield,
  Calendar,
  Layers,
  CheckCircle2,
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

function formatBengaliDate(dateInput: Date | string): string {
  const d = new Date(dateInput);
  const day = d.getDate();
  const banglaMonths = [
    "জানুয়ারি", "ফেব্রুয়ারি", "মার্চ", "এপ্রিল", "মে", "জুন",
    "জুলাই", "আগস্ট", "সেপ্টেম্বর", "অক্টোবর", "নভেম্বর", "ডিসেম্বর"
  ];
  const month = banglaMonths[d.getMonth()];
  const year = d.getFullYear();
  return `${day} ${month} ${year}`;
}

export default async function PersonnelReportsPage({
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

  // বাজেট বরাদ্দ
  const allocation = await db.budgetAllocation.findUnique({
    where: {
      userId_financialYearId: {
        userId: user.id,
        financialYearId: activeYear.id,
      },
    },
  });

  const allocatedPaisa = allocation?.allocatedAmount ?? BigInt(0);

  // খরচের ভাউচারসমূহ
  const expenses = await db.expense.findMany({
    where: {
      userId: user.id,
      financialYearId: activeYear.id,
    },
    include: { category: true },
    orderBy: { date: "asc" },
  });

  const spentPaisa = expenses
    .filter((e) => e.status === "APPROVED")
    .reduce((acc, e) => acc + e.amount, BigInt(0));

  const pendingPaisa = expenses
    .filter((e) => e.status === "PENDING" || e.status === "PROCESSING")
    .reduce((acc, e) => acc + e.amount, BigInt(0));

  const metrics = calculateBudgetMetrics(allocatedPaisa, spentPaisa, pendingPaisa);

  // খাতভিত্তিক সারসংক্ষেপ
  const categorySummary: Record<string, { total: bigint; count: number }> = {};
  expenses.forEach((e) => {
    const rawName = e.category.name;
    const name = categoryTranslation[rawName] || rawName;
    if (!categorySummary[name]) {
      categorySummary[name] = { total: BigInt(0), count: 0 };
    }
    if (e.status === "APPROVED" || e.status === "PENDING") {
      categorySummary[name].total += e.amount;
      categorySummary[name].count += 1;
    }
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <PageHeader
        title="ব্যক্তিগত ব্যয় প্রতিবেদন (Expenditure Report)"
        description={`${activeYear.label} অর্থবছরে ${user.rank || ""} ${user.name} (${user.serviceId})-এর আনুষ্ঠানিক ব্যয় অডিট বিবরণী।`}
      />

      {/* প্রাতিষ্ঠানিক আনুষ্ঠানিক রিপোর্ট কন্টেইনার */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-8">
        {/* রিপোর্টের প্রাতিষ্ঠানিক হেডার */}
        <div className="border-b border-slate-200 pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-widest text-[#0d2847]">
              বাংলাদেশ নৌবাহিনী &bull; প্রশাসনিক অধিদপ্তর
            </span>
            <h2 className="text-xl font-bold text-slate-900">
              বার্ষিক বাজেট বাস্তবায়ন ও ব্যয় নিরীক্ষা বিবরণী
            </h2>
            <p className="text-xs text-slate-500 font-mono">
              অর্থবছর: {activeYear.label} &bull; প্রস্তুতের তারিখ: {format(new Date(), "dd MMMM yyyy, HH:mm")}
            </p>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1 sm:text-right">
            <p className="font-bold text-slate-900">{user.name}</p>
            <p className="text-slate-600">{user.serviceId} &bull; {user.rank}</p>
            <p className="text-slate-500">{user.unit || "নেভাল ইউনিট"}</p>
          </div>
        </div>

        {/* আর্থিক সারাংশ কেপিআই ম্যাট্রিক্স */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-5 bg-slate-50 rounded-xl border border-slate-200 text-center">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              অনুমোদিত বাজেট সিলিং
            </span>
            <p className="text-lg font-bold font-mono text-blue-950 mt-1">
              {formatBDT(metrics.allocatedPaisa)}
            </p>
          </div>

          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              অনুমোদিত মোট ব্যয়
            </span>
            <p className="text-lg font-bold font-mono text-slate-800 mt-1">
              {formatBDT(metrics.spentPaisa)}
            </p>
            <span className="text-[10px] text-slate-500">
              বরাদ্দের {metrics.spentPercentage.toFixed(1)}%
            </span>
          </div>

          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              অনুমোদনের অপেক্ষায়
            </span>
            <p className="text-lg font-bold font-mono text-amber-600 mt-1">
              {formatBDT(metrics.pendingPaisa)}
            </p>
          </div>

          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              অবশিষ্ট ব্যালেন্স
            </span>
            <p
              className={`text-lg font-bold font-mono mt-1 ${
                metrics.isOverBudget ? "text-rose-600" : "text-emerald-700"
              }`}
            >
              {formatBDT(metrics.availablePaisa)}
            </p>
            <span className="text-[10px] text-slate-500">
              {metrics.isOverBudget ? "বাজেট ঘাটতি" : `${(100 - metrics.committedPercentage).toFixed(1)}% অবশিষ্ট`}
            </span>
          </div>
        </div>

        {/* খাতভিত্তিক ব্যয়ের টেবিল */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#0d2847]" />
            খাতভিত্তিক ব্যয়ের সারসংক্ষেপ (Category Summary)
          </h3>
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-[11px] font-bold uppercase text-slate-600">
                <tr>
                  <th className="py-2.5 px-4">খরচের খাত</th>
                  <th className="py-2.5 px-4 text-center">ভাউচার সংখ্যা</th>
                  <th className="py-2.5 px-4 text-right">মোট ব্যয় (BDT)</th>
                  <th className="py-2.5 px-4 text-right">বরাদ্দের অংশ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {Object.entries(categorySummary).map(([catName, data]) => {
                  const percent =
                    allocatedPaisa > BigInt(0)
                      ? Number((data.total * BigInt(1000)) / allocatedPaisa) / 10
                      : 0;

                  return (
                    <tr key={catName} className="hover:bg-slate-50">
                      <td className="py-2.5 px-4 font-semibold text-slate-800">
                        {catName}
                      </td>
                      <td className="py-2.5 px-4 text-center text-slate-500 font-mono">
                        {data.count}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono font-semibold text-slate-900">
                        {formatBDT(data.total)}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono text-slate-600">
                        {percent.toFixed(1)}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* সম্পূর্ণ ভাউচার লেজার */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#0d2847]" />
            আইটেমভিত্তিক ভাউচার লেজার (Voucher Ledger)
          </h3>
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-[11px] font-bold uppercase text-slate-600">
                <tr>
                  <th className="py-2.5 px-3">তারিখ</th>
                  <th className="py-2.5 px-3">রেফারেন্স নং</th>
                  <th className="py-2.5 px-3">ভাউচারের বিবরণ</th>
                  <th className="py-2.5 px-3">খাত</th>
                  <th className="py-2.5 px-3">অবস্থা</th>
                  <th className="py-2.5 px-3 text-right">পরিমাণ (BDT)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {expenses.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-slate-400">
                      কোনো খরচের ভাউচার পাওয়া যায়নি।
                    </td>
                  </tr>
                ) : (
                  expenses.map((exp) => (
                    <tr key={exp.id} className="hover:bg-slate-50">
                      <td className="py-2 px-3 font-mono text-slate-600 whitespace-nowrap">
                        {formatBengaliDate(exp.date)}
                      </td>
                      <td className="py-2 px-3 font-mono text-slate-500">
                        {exp.referenceNumber}
                      </td>
                      <td className="py-2 px-3 font-medium text-slate-900 max-w-xs truncate">
                        {exp.title}
                      </td>
                      <td className="py-2 px-3 text-slate-600">
                        {categoryTranslation[exp.category.name] || exp.category.name}
                      </td>
                      <td className="py-2 px-3">
                        <ExpenseStatusBadge status={exp.status} bangla={true} />
                      </td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                        {formatBDT(exp.amount)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* আনুষ্ঠানিক স্বাক্ষর ও অনুমোদন ফুটনোট */}
        <div className="pt-8 border-t border-slate-200 grid grid-cols-2 gap-8 text-xs text-slate-500">
          <div>
            <p className="font-semibold text-slate-800">দায়িত্বপ্রাপ্ত অফিসারের স্বাক্ষর ও সিল</p>
            <div className="h-12 border-b border-dashed border-slate-300 mt-2" />
            <p className="mt-1 font-mono text-[11px]">{user.name} ({user.serviceId})</p>
          </div>
          <div>
            <p className="font-semibold text-slate-800">প্রশাসনিক কমান্ড যাচাইকারী কর্মকর্তার স্বাক্ষর</p>
            <div className="h-12 border-b border-dashed border-slate-300 mt-2" />
            <p className="mt-1 font-mono text-[11px]">নেভাল অ্যাডমিনিস্ট্রেটিভ ডিরেক্টরেট</p>
          </div>
        </div>
      </div>
    </div>
  );
}
