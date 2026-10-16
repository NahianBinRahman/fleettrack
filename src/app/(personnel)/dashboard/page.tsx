import React from "react";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { calculateBudgetMetrics, formatBDT, getStatusTheme } from "@/lib/money";
import { BudgetStatCard } from "@/components/budget/BudgetStatCard";
import { BudgetProgressRing } from "@/components/budget/BudgetProgressRing";
import { BudgetAlert } from "@/components/budget/BudgetAlert";
import { ExpenseStatusBadge } from "@/components/budget/ExpenseStatusBadge";
import { BudgetStatusBadge } from "@/components/budget/BudgetStatusBadge";
import { MoneyDisplay } from "@/components/budget/MoneyDisplay";
import { MonthlySpendingChart } from "@/components/charts/MonthlySpendingChart";
import { CategoryDistributionChart } from "@/components/charts/CategoryDistributionChart";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import Link from "next/link";
import {
  Wallet,
  Receipt,
  Clock,
  CheckCircle,
  PlusCircle,
  ArrowRight,
  TrendingUp,
  PieChart as PieIcon,
  FileText,
  Calendar,
  ShieldCheck,
  BarChart3,
  ExternalLink,
} from "lucide-react";
import { format } from "date-fns";

// বাংলা মাসের নাম
const monthTranslation: Record<string, string> = {
  Jul: "জুলাই",
  Aug: "আগস্ট",
  Sep: "সেপ্টেম্বর",
  Oct: "অক্টোবর",
  Nov: "নভেম্বর",
  Dec: "ডিসেম্বর",
  Jan: "জানুয়ারি",
  Feb: "ফেব্রুয়ারি",
  Mar: "মার্চ",
  Apr: "এপ্রিল",
  May: "মে",
  Jun: "জুন",
};

// খরচের খাতের বাংলা নাম
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

export default async function PersonnelDashboard({
  searchParams,
}: {
  searchParams: Promise<{ fy?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const resolvedParams = await searchParams;

  // বর্তমান বা অনুরোধকৃত আর্থিক বছর নির্ধারণ
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
    return (
      <div className="p-8 text-center text-slate-500 rounded-xl bg-white border border-slate-200">
        সিস্টেমে কোনো আর্থিক বছর সক্রিয় নেই। অনুগ্রহ করে হেডকোয়ার্টার অ্যাডমিনের সাথে যোগাযোগ করুন।
      </div>
    );
  }

  // চলতি অর্থবছরে এই অফিসারের বাজেট বরাদ্দ
  const allocation = await db.budgetAllocation.findUnique({
    where: {
      userId_financialYearId: {
        userId: user.id,
        financialYearId: activeYear.id,
      },
    },
  });

  const allocatedPaisa = allocation?.allocatedAmount ?? BigInt(0);

  // চলতি অর্থবছরে ইউজারের সমস্ত খরচের ভাউচার
  const expenses = await db.expense.findMany({
    where: {
      userId: user.id,
      financialYearId: activeYear.id,
    },
    include: { category: true },
    orderBy: { date: "desc" },
  });

  // অনুমোদিত ও অপেক্ষমাণ খরচের হিসাব
  const spentPaisa = expenses
    .filter((e) => e.status === "APPROVED")
    .reduce((acc, e) => acc + e.amount, BigInt(0));

  const pendingPaisa = expenses
    .filter((e) => e.status === "PENDING" || e.status === "PROCESSING")
    .reduce((acc, e) => acc + e.amount, BigInt(0));

  const metrics = calculateBudgetMetrics(allocatedPaisa, spentPaisa, pendingPaisa);
  const theme = getStatusTheme(metrics.statusLevel);

  // মাসভিত্তিক খরচের গতিধারা (মাসগুলো বাংলায়)
  const monthMap: Record<string, { amountPaisa: bigint; count: number }> = {};
  const monthOrder = [
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  ];
  monthOrder.forEach((m) => {
    monthMap[m] = { amountPaisa: BigInt(0), count: 0 };
  });

  expenses
    .filter((e) => e.status === "APPROVED" || e.status === "PENDING")
    .forEach((e) => {
      const monthStr = format(new Date(e.date), "MMM");
      if (monthMap[monthStr]) {
        monthMap[monthStr].amountPaisa += e.amount;
        monthMap[monthStr].count += 1;
      }
    });

  const monthlyChartData = monthOrder.map((m) => ({
    month: monthTranslation[m] || m,
    amountPaisa: monthMap[m].amountPaisa,
    count: monthMap[m].count,
  }));

  // খাতভিত্তিক খরচের বণ্টন (বাংলায় ক্যাটাগরি)
  const categoryMap: Record<string, { amountPaisa: bigint; count: number }> = {};
  expenses
    .filter((e) => e.status === "APPROVED" || e.status === "PENDING")
    .forEach((e) => {
      const catName = categoryTranslation[e.category.name] || e.category.name;
      if (!categoryMap[catName]) {
        categoryMap[catName] = { amountPaisa: BigInt(0), count: 0 };
      }
      categoryMap[catName].amountPaisa += e.amount;
      categoryMap[catName].count += 1;
    });

  const categoryChartData = Object.entries(categoryMap).map(([name, data]) => ({
    name,
    amountPaisa: data.amountPaisa,
    count: data.count,
  }));

  const recentExpenses = expenses.slice(0, 6);

  // সময়ের উপর ভিত্তি করে বাংলা শুভেচ্ছা
  const hour = new Date().getHours();
  const greetingBn =
    hour < 12 ? "শুভ সকাল" : hour < 17 ? "শুভ অপরাহ্ন" : "শুভ সন্ধ্যা";

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* ১. শীর্ষ হেডার ও শুভেচ্ছা ব্যানার (Header & Greeting) */}
      <div className="bg-gradient-to-r from-[#0d2847] via-[#12365e] to-[#1a497d] text-white p-5 sm:p-7 rounded-2xl shadow-lg border border-blue-900/40 relative overflow-hidden">
        {/* ব্যাকগ্রাউন্ড লাইট ইফেক্ট */}
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 relative z-10">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs text-amber-300 font-medium">
              <Calendar className="w-3.5 h-3.5" />
              <span>{activeYear.label}</span>
              <span>&bull;</span>
              <span className="capitalize">{activeYear.status === "ACTIVE" ? "চলতি সক্রিয় অর্থবছর" : activeYear.status}</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mt-1">
              {greetingBn}, {user.rank ? `${user.rank} ${user.name}` : user.name}
            </h1>

            <p className="text-xs sm:text-sm text-slate-200">
              ইউনিট: <span className="font-semibold text-amber-200">{user.unit || "অফিসার কমান্ড"}</span>
              {user.serviceId && <span> &bull; সার্ভিস আইডি: {user.serviceId}</span>}
            </p>
          </div>

          {/* মোবাইল ও ডেস্কটপ অ্যাকশন বাটনসমূহ */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0 pt-2 md:pt-0">
            <Link href="/expenses" className="w-full sm:w-auto">
              <Button
                variant="default"
                size="default"
                className="w-full sm:w-auto bg-[#d4af37] hover:bg-[#c29e2e] text-slate-950 font-bold shadow-md gap-2"
              >
                <PlusCircle className="w-4 h-4" />
                নতুন ভাউচার দাখিল
              </Button>
            </Link>

            <Link href="/my-budget" className="w-full sm:w-auto">
              <Button
                variant="outline"
                size="default"
                className="w-full sm:w-auto bg-white/10 hover:bg-white/20 border-white/25 text-white gap-2"
              >
                <Wallet className="w-4 h-4" />
                বাজেট বিবরণী
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* ২. মূল ৪টি পরিসংখ্যান কার্ড (Primary KPI Cards in Bangla) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* মোট বাজেট বরাদ্দ */}
        <BudgetStatCard
          title="মোট বরাদ্দকৃত বাজেট"
          amountInPaisa={metrics.allocatedPaisa}
          icon={<Wallet className="w-5 h-5" />}
          variant="primary"
          subtitle={`নির্ধারিত বাজেট সিলিং (${activeYear.label})`}
        />

        {/* অনুমোদিত খরচ */}
        <BudgetStatCard
          title="অনুমোদিত মোট ব্যয়"
          amountInPaisa={metrics.spentPaisa}
          icon={<Receipt className="w-5 h-5" />}
          variant="spent"
          percentage={metrics.spentPercentage}
          subtitle="অনুমোদিত খরচের ভাউচার"
        />

        {/* অপেক্ষমাণ ভাউচার */}
        <BudgetStatCard
          title="অনুমোদনের অপেক্ষায়"
          amountInPaisa={metrics.pendingPaisa}
          icon={<Clock className="w-5 h-5" />}
          variant="pending"
          percentage={metrics.committedPercentage - metrics.spentPercentage}
          subtitle="প্রক্রিয়াধীন ভাউচারসমূহ"
        />

        {/* অবশিষ্ট বাজেট */}
        <BudgetStatCard
          title="অবশিষ্ট বরাদ্দ"
          amountInPaisa={metrics.availablePaisa}
          icon={<CheckCircle className="w-5 h-5" />}
          variant="remaining"
          highlight={!metrics.isOverBudget}
          subtitle={metrics.isOverBudget ? "বাজেট ঘাটতি (Deficit)" : "নতুন খরচের জন্য উপলব্ধ"}
        />
      </div>

      {/* ৩. বাজেট সতর্কবার্তা ও অ্যালার্ট ব্যানার (Bangla Alert) */}
      <BudgetAlert metrics={metrics} bangla={true} />

      {/* ৪. ভিজ্যুয়াল বাজেট রিং ও সংক্ষেপ (Progress Ring + Overview) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* বাম কলাম: বাজেট প্রগ্রেস মিটার */}
        <div className="lg:col-span-1 flex flex-col">
          <BudgetProgressRing metrics={metrics} bangla={true} className="h-full shadow-xs" />
        </div>

        {/* ডান কলাম: বাজেট ব্যবহারের স্পষ্ট বার ও সারাংশ কার্ড */}
        <div className="lg:col-span-2">
          <Card className="h-full border-slate-200/90 shadow-xs flex flex-col justify-between">
            <CardHeader className="pb-3 border-b border-slate-100">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-[#0d2847]" />
                    বাজেট ব্যবহারের সার্বিক অবস্থা
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-500 mt-0.5">
                    চলতি অর্থবছরে আপনার মোট বাজেটের বাস্তবায়ন ও খরচের চিত্র
                  </CardDescription>
                </div>
                <BudgetStatusBadge status={metrics.statusLevel} bangla={true} />
              </div>
            </CardHeader>

            <CardContent className="pt-6 space-y-6">
              {/* ডুয়াল প্রগ্রেস বার */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs font-semibold text-slate-700">
                  <span>মোট ব্যবহার: {metrics.committedPercentage.toFixed(1)}%</span>
                  <span>সিলিং: {formatBDT(metrics.allocatedPaisa)}</span>
                </div>

                <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden flex p-0.5 border border-slate-200">
                  {/* অনুমোদিত খরচ বার */}
                  <div
                    style={{ width: `${Math.min(100, metrics.spentPercentage)}%` }}
                    className={`${theme.progressBar} h-full rounded-l-full transition-all duration-500`}
                    title={`অনুমোদিত: ${metrics.spentPercentage.toFixed(1)}%`}
                  />
                  {/* অপেক্ষমাণ খরচ বার */}
                  {metrics.committedPercentage > metrics.spentPercentage && (
                    <div
                      style={{
                        width: `${Math.min(
                          100 - metrics.spentPercentage,
                          metrics.committedPercentage - metrics.spentPercentage
                        )}%`,
                      }}
                      className="bg-amber-400 h-full transition-all duration-500"
                      title={`অপেক্ষমাণ: ${(metrics.committedPercentage - metrics.spentPercentage).toFixed(1)}%`}
                    />
                  )}
                </div>
              </div>

              {/* ৩টি স্পষ্ট কলামে হিসাবের সারাংশ */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70">
                  <span className="text-[11px] font-semibold text-slate-500 block">অনুমোদিত ব্যয়</span>
                  <div className="text-lg font-bold text-slate-900 mt-0.5">
                    {formatBDT(metrics.spentPaisa)}
                  </div>
                  <span className="text-[11px] text-slate-500">
                    বাজেটের {metrics.spentPercentage.toFixed(1)}%
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200/70">
                  <span className="text-[11px] font-semibold text-amber-800 block">অনুমোদনের অপেক্ষায়</span>
                  <div className="text-lg font-bold text-amber-900 mt-0.5">
                    {formatBDT(metrics.pendingPaisa)}
                  </div>
                  <span className="text-[11px] text-amber-700">
                    বাজেটের {(metrics.committedPercentage - metrics.spentPercentage).toFixed(1)}%
                  </span>
                </div>

                <div
                  className={`p-3.5 rounded-xl border ${
                    metrics.isOverBudget
                      ? "bg-rose-50 border-rose-200"
                      : "bg-emerald-50/70 border-emerald-200/70"
                  }`}
                >
                  <span
                    className={`text-[11px] font-semibold block ${
                      metrics.isOverBudget ? "text-rose-800" : "text-emerald-800"
                    }`}
                  >
                    {metrics.isOverBudget ? "বাজেট ঘাটতি" : "অবশিষ্ট ফান্ড"}
                  </span>
                  <div
                    className={`text-lg font-bold mt-0.5 ${
                      metrics.isOverBudget ? "text-rose-700" : "text-emerald-900"
                    }`}
                  >
                    {metrics.isOverBudget
                      ? `-${formatBDT(-metrics.availablePaisa)}`
                      : formatBDT(metrics.availablePaisa)}
                  </div>
                  <span
                    className={`text-[11px] ${
                      metrics.isOverBudget ? "text-rose-600" : "text-emerald-700"
                    }`}
                  >
                    {metrics.isOverBudget
                      ? "বরাদ্দ অতিক্রম করেছে"
                      : `${Math.max(0, 100 - metrics.committedPercentage).toFixed(1)}% অবশিষ্ট`}
                  </span>
                </div>
              </div>

              {/* কুইক নেভিগেশন শর্টকাট (Quick Actions) */}
              <div className="pt-2 border-t border-slate-100 flex flex-wrap gap-2 text-xs">
                <Link
                  href="/expenses"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors"
                >
                  <PlusCircle className="w-3.5 h-3.5 text-blue-900" />
                  নতুন ভাউচার সাবমিট
                </Link>
                <Link
                  href="/my-budget"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors"
                >
                  <Wallet className="w-3.5 h-3.5 text-blue-900" />
                  সম্পূর্ণ বাজেট স্টেটমেন্ট
                </Link>
                <Link
                  href="/reports"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors"
                >
                  <FileText className="w-3.5 h-3.5 text-blue-900" />
                  ব্যয় রিপোর্ট ডাউনলোড
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ৫. বিশ্লেষণ ও চার্ট গ্রিড (Monthly Spending + Category Distribution) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* মাসিক ব্যয়ের গতিধারা */}
        <div className="lg:col-span-2">
          <Card className="h-full border-slate-200/90 shadow-xs">
            <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-slate-100">
              <div>
                <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-[#0d2847]" />
                  মাসিক ব্যয়ের গতিধারা (Monthly Trend)
                </CardTitle>
                <CardDescription className="text-xs text-slate-500 mt-0.5">
                  চলতি অর্থবছরে মাসভিত্তিক ব্যয়ের অগ্রগতি ও বণ্টন
                </CardDescription>
              </div>
              <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-md">
                টাকা (৳ BDT)
              </span>
            </CardHeader>
            <CardContent className="pt-4">
              <MonthlySpendingChart data={monthlyChartData} height={240} bangla={true} />
            </CardContent>
          </Card>
        </div>

        {/* খাতভিত্তিক ব্যয় বণ্টন */}
        <div className="lg:col-span-1">
          <Card className="h-full border-slate-200/90 shadow-xs">
            <CardHeader className="pb-2 border-b border-slate-100">
              <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                <PieIcon className="w-4 h-4 text-[#0d2847]" />
                খাতভিত্তিক ব্যয় (Category Breakdown)
              </CardTitle>
              <CardDescription className="text-xs text-slate-500 mt-0.5">
                বিভিন্ন খাতে ব্যয়ের অনুপাত
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-3">
              <CategoryDistributionChart data={categoryChartData} height={220} bangla={true} />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ৬. সাম্প্রতিক খরচের ভাউচার তালিকা (Recent Expenses List) */}
      <Card className="border-slate-200/90 shadow-xs">
        <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#0d2847]" />
              সাম্প্রতিক খরচের ভাউচারসমূহ (Recent Vouchers)
            </CardTitle>
            <CardDescription className="text-xs text-slate-500 mt-0.5">
              দাখিলকৃত সর্বশেষ খরচের ভাউচার ও অনুমোদন স্থিতি
            </CardDescription>
          </div>
          <Link
            href="/expenses"
            className="text-xs font-bold text-[#0d2847] hover:underline flex items-center gap-1 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            সবগুলো দেখুন
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </CardHeader>

        <CardContent className="pt-3">
          {recentExpenses.length === 0 ? (
            <div className="py-10 text-center text-slate-400 text-xs">
              চলতি অর্থবছরে এখনো কোনো খরচের ভাউচার রেকর্ড করা হয়নি।
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {recentExpenses.map((exp) => (
                <div
                  key={exp.id}
                  className="py-3.5 px-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 hover:bg-slate-50/80 transition-colors rounded-xl"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-bold text-slate-900 truncate">
                        {exp.title}
                      </p>
                      <ExpenseStatusBadge status={exp.status} bangla={true} />
                    </div>

                    <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 mt-1 text-xs text-slate-500">
                      <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-700 font-medium">
                        {exp.referenceNumber}
                      </span>
                      <span>&bull;</span>
                      <span className="font-medium text-slate-700">
                        {categoryTranslation[exp.category.name] || exp.category.name}
                      </span>
                      <span>&bull;</span>
                      <span>{formatBengaliDate(exp.date)}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-1 sm:pt-0 border-t sm:border-0 border-slate-100">
                    <span className="sm:hidden text-xs text-slate-500 font-medium">পরিমাণ:</span>
                    <MoneyDisplay
                      amountInPaisa={exp.amount}
                      size="base"
                      color="blue"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
