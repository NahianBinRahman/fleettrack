import React from "react";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { calculateBudgetMetrics, formatBDT } from "@/lib/money";
import { BudgetStatCard } from "@/components/budget/BudgetStatCard";
import { MoneyDisplay } from "@/components/budget/MoneyDisplay";
import { BudgetStatusBadge } from "@/components/budget/BudgetStatusBadge";
import { OrganizationBudgetChart } from "@/components/charts/OrganizationBudgetChart";
import { MonthlySpendingChart } from "@/components/charts/MonthlySpendingChart";
import { UtilizationDistributionChart } from "@/components/charts/UtilizationDistributionChart";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  Building2,
  Users,
  Wallet,
  Receipt,
  Clock,
  AlertTriangle,
  Flame,
  ArrowRight,
  TrendingUp,
  BarChart3,
  ShieldAlert,
  FileSpreadsheet,
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

export default async function AdminOverviewPage({
  searchParams,
}: {
  searchParams: Promise<{ fy?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") redirect("/login");

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

  // ১. সংস্থার মোট বাজেট
  const orgTotalBudgetPaisa = activeYear.totalBudget;

  // ২. চলতি অর্থবছরে বরাদ্দপ্রাপ্ত সকল অফিসার
  const personnelWithAllocations = await db.user.findMany({
    where: { role: "PERSONNEL" },
    include: {
      allocations: {
        where: { financialYearId: activeYear.id },
      },
      expenses: {
        where: { financialYearId: activeYear.id },
      },
    },
  });

  const totalPersonnelCount = personnelWithAllocations.length;
  const activePersonnelCount = personnelWithAllocations.filter((p) => p.isActive).length;

  // সংস্থার সামগ্রিক হিসাব
  let totalAllocatedPaisa = BigInt(0);
  let totalSpentPaisa = BigInt(0);
  let totalPendingPaisa = BigInt(0);

  const personnelMetricsList = personnelWithAllocations.map((p) => {
    const alloc = p.allocations[0]?.allocatedAmount ?? BigInt(0);
    totalAllocatedPaisa += alloc;

    const spent = p.expenses
      .filter((e) => e.status === "APPROVED")
      .reduce((acc, e) => acc + e.amount, BigInt(0));
    totalSpentPaisa += spent;

    const pending = p.expenses
      .filter((e) => e.status === "PENDING" || e.status === "PROCESSING")
      .reduce((acc, e) => acc + e.amount, BigInt(0));
    totalPendingPaisa += pending;

    const metrics = calculateBudgetMetrics(alloc, spent, pending);
    return {
      user: p,
      allocatedPaisa: alloc,
      spentPaisa: spent,
      pendingPaisa: pending,
      metrics,
    };
  });

  const totalCommittedPaisa = totalSpentPaisa + totalPendingPaisa;
  const orgRemainingPaisa = orgTotalBudgetPaisa - totalCommittedPaisa;

  // সীমার কাছাকাছি এবং অতিরিক্ত খরচকারী অফিসার
  const overBudgetPersonnel = personnelMetricsList.filter(
    (item) => item.metrics.committedPercentage > 100
  );
  const nearLimitPersonnel = personnelMetricsList.filter(
    (item) =>
      item.metrics.committedPercentage >= 80 &&
      item.metrics.committedPercentage <= 100
  );

  // ইউটিলাইজেশন টায়ার
  const tierCounts = {
    tier1: 0, // 0 - 50%
    tier2: 0, // 50 - 75%
    tier3: 0, // 75 - 90%
    tier4: 0, // 90 - 100%
    tier5: 0, // 100%+
  };

  personnelMetricsList.forEach((item) => {
    const pct = item.metrics.committedPercentage;
    if (pct > 100) tierCounts.tier5++;
    else if (pct >= 90) tierCounts.tier4++;
    else if (pct >= 75) tierCounts.tier3++;
    else if (pct >= 50) tierCounts.tier2++;
    else tierCounts.tier1++;
  });

  const distributionChartData = [
    { range: "০–৫০%", count: tierCounts.tier1, label: "স্বাভাবিক ব্যয়", color: "#10b981" },
    { range: "৫০–৭৫%", count: tierCounts.tier2, label: "মধ্যম", color: "#3b82f6" },
    { range: "৭৫–৯০%", count: tierCounts.tier3, label: "সীমার কাছাকাছি", color: "#f59e0b" },
    { range: "৯০–১০০%", count: tierCounts.tier4, label: "জরুরি সতর্কতা", color: "#f97316" },
    { range: "১০০%+", count: tierCounts.tier5, label: "সীমা অতিক্রান্ত", color: "#ef4444" },
  ];

  // সর্বোচ্চ বাজেট ব্যবহারকারী শীর্ষ ৬ জন অফিসার
  const highestUtilizationList = [...personnelMetricsList]
    .sort((a, b) => b.metrics.committedPercentage - a.metrics.committedPercentage)
    .slice(0, 6);

  // মাসভিত্তিক সামগ্রিক খরচ
  const orgExpenses = await db.expense.findMany({
    where: { financialYearId: activeYear.id },
    select: { date: true, amount: true, status: true },
  });

  const monthMap: Record<string, { amountPaisa: bigint; count: number }> = {};
  const monthOrder = ["Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May", "Jun"];
  monthOrder.forEach((m) => {
    monthMap[m] = { amountPaisa: BigInt(0), count: 0 };
  });

  orgExpenses
    .filter((e) => e.status === "APPROVED" || e.status === "PENDING")
    .forEach((e) => {
      const monthStr = format(new Date(e.date), "MMM");
      if (monthMap[monthStr]) {
        monthMap[monthStr].amountPaisa += e.amount;
        monthMap[monthStr].count += 1;
      }
    });

  const monthlyOrgChartData = monthOrder.map((m) => ({
    month: monthTranslation[m] || m,
    amountPaisa: monthMap[m].amountPaisa,
    count: monthMap[m].count,
  }));

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* ১. শীর্ষ কমান্ড ব্যানার (Executive Directorate Banner) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#d4af37]">
            হেডকোয়ার্টার্স কমান্ড ওভারভিউ &bull; {activeYear.label} ({activeYear.status === "ACTIVE" ? "চলতি অর্থবছর" : activeYear.status})
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-0.5">
            নেভাল বাজেট প্রশাসনিক ওভারভিউ
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            সার্বিকভাবে {formatBDT(orgTotalBudgetPaisa)} সংস্থা-ব্যাপী বরাদ্দ এবং {totalPersonnelCount} জন অফিসারের বাজেট তদারকি
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link href="/admin/personnel">
            <Button variant="naval" size="default" className="shadow-sm">
              <Users className="w-4 h-4" />
              অফিসার ব্যবস্থাপনা ({activePersonnelCount})
            </Button>
          </Link>
          <Link href="/admin/reports">
            <Button variant="outline" size="default">
              <FileSpreadsheet className="w-4 h-4" />
              এইচকিউ রিপোর্ট
            </Button>
          </Link>
        </div>
      </div>

      {/* ২. সংস্থার মূল পরিসংখ্যান কার্ড (Organization KPIs) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <BudgetStatCard
          title="সংস্থার মোট বার্ষিক বাজেট"
          amountInPaisa={orgTotalBudgetPaisa}
          icon={<Building2 className="w-5 h-5" />}
          variant="primary"
          subtitle={`অনুমোদিত মোট সিলিং (${activeYear.label})`}
        />
        <BudgetStatCard
          title="অফিসারদের মোট বরাদ্দ"
          amountInPaisa={totalAllocatedPaisa}
          icon={<Wallet className="w-5 h-5" />}
          variant="remaining"
          highlight={true}
          percentage={
            orgTotalBudgetPaisa > BigInt(0)
              ? Number((totalAllocatedPaisa * BigInt(1000)) / orgTotalBudgetPaisa) / 10
              : 0
          }
          subtitle="বিভিন্ন ইউনিটের অনুকূলে প্রদত্ত"
        />
        <BudgetStatCard
          title="কমান্ড রিজার্ভ ফান্ড"
          amountInPaisa={orgTotalBudgetPaisa - totalAllocatedPaisa}
          icon={<Clock className="w-5 h-5" />}
          variant="pending"
          percentage={
            orgTotalBudgetPaisa > BigInt(0)
              ? Number(((orgTotalBudgetPaisa - totalAllocatedPaisa) * BigInt(1000)) / orgTotalBudgetPaisa) / 10
              : 0
          }
          subtitle="নতুন বরাদ্দের জন্য উপলব্ধ"
        />
        <div className="p-5 rounded-xl border border-slate-200 bg-white shadow-xs flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                কমিশন্ড অফিসারবৃন্দ
              </span>
              <p className="text-2xl font-black text-slate-900 mt-1">
                {activePersonnelCount}{" "}
                <span className="text-xs font-normal text-slate-500">/ {totalPersonnelCount} জন অন্তর্ভুক্ত</span>
              </p>
            </div>
            <div className="p-2.5 rounded-xl bg-blue-50 text-[#0d2847]">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>সক্রিয় কোটা বরাদ্দপ্রাপ্ত</span>
            <span className="font-semibold text-emerald-600">১০০% সক্রিয়</span>
          </div>
        </div>
      </div>

      {/* ৩. সতর্কতা ও নজরদারি সারাংশ (Status Callout Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-white rounded-2xl border border-slate-200/90 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-[#0d2847] flex items-center justify-center font-bold text-lg shrink-0">
            {activePersonnelCount}
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
              সক্রিয় অফিসারবৃন্দ
            </p>
            <p className="text-sm font-semibold text-slate-900 mt-0.5">
              অর্থবছরের কোটা সহ অন্তর্ভুক্ত
            </p>
          </div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-amber-200/90 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-lg shrink-0">
            {nearLimitPersonnel.length}
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-amber-700">
              সীমার কাছাকাছি (৮০–১০০%)
            </p>
            <p className="text-sm font-semibold text-slate-800 mt-0.5">
              নজরদারি প্রয়োজন
            </p>
          </div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-rose-200/90 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold text-lg shrink-0">
            {overBudgetPersonnel.length}
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-rose-700">
              সীমা অতিক্রান্ত (&gt;১০০%)
            </p>
            <p className="text-sm font-semibold text-slate-800 mt-0.5">
              বাজেট ঘাটতি চিহ্নিত
            </p>
          </div>
        </div>
      </div>

      {/* ৪. প্রাথমিক ভিজ্যুয়ালাইজেশন: সংস্থার ব্যবহার ও মাসিক গতিধারা */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* সংস্থার বাজেট বণ্টন বার চার্ট */}
        <Card className="border-slate-200/80 shadow-xs">
          <CardHeader className="pb-2 border-b border-slate-100">
            <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-[#0d2847]" />
              সংস্থার বাজেট ইউটিলাইজেশন (Budget Utilization)
            </CardTitle>
            <CardDescription className="text-xs text-slate-500 mt-0.5">
              সংস্থার মোট বার্ষিক সিলিং বনাম অফিসারদের প্রদত্ত মোট বরাদ্দ
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-3">
            <OrganizationBudgetChart
              totalBudgetPaisa={orgTotalBudgetPaisa}
              allocatedPaisa={totalAllocatedPaisa}
              reservePaisa={orgTotalBudgetPaisa - totalAllocatedPaisa}
              height={260}
              bangla={true}
            />
          </CardContent>
        </Card>

        {/* সংস্থার সামগ্রিক মাসিক গতিধারা */}
        <Card className="border-slate-200/80 shadow-xs">
          <CardHeader className="pb-2 border-b border-slate-100">
            <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#0d2847]" />
              সংস্থার মাসিক খরচের গতিধারা (Monthly Expenditure)
            </CardTitle>
            <CardDescription className="text-xs text-slate-500 mt-0.5">
              সকল নৌ স্কোয়াড্রন ও ইউনিটের সামগ্রিক মাসিক খরচের চিত্র
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-3">
            <MonthlySpendingChart data={monthlyOrgChartData} height={260} bangla={true} />
          </CardContent>
        </Card>
      </div>

      {/* ৫. ডিস্ট্রিবিউশন হিস্টোগ্রাম ও সর্বোচ্চ ব্যবহারকারী অফিসার তালিকা */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* বাজেট ব্যবহারের বণ্টন */}
        <Card className="border-slate-200/80 shadow-xs">
          <CardHeader className="pb-2 border-b border-slate-100">
            <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-[#0d2847]" />
              অফিসারদের বাজেট ব্যবহারের অনুপাত (Distribution Tiers)
            </CardTitle>
            <CardDescription className="text-xs text-slate-500 mt-0.5">
              ব্যবহারের হার অনুযায়ী অফিসারের সংখ্যা
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-3">
            <UtilizationDistributionChart data={distributionChartData} height={240} bangla={true} />
          </CardContent>
        </Card>

        {/* সর্বোচ্চ বাজেট ব্যবহারকারী অফিসারবৃন্দ */}
        <Card className="border-slate-200/80 shadow-xs flex flex-col justify-between">
          <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-slate-100">
            <div>
              <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                সর্বোচ্চ বাজেট ব্যবহারকারী (Highest Utilization)
              </CardTitle>
              <CardDescription className="text-xs text-slate-500 mt-0.5">
                বরাদ্দকৃত সীমার কাছাকাছি বা অতিরিক্ত ব্যয়কারী অফিসারবৃন্দ
              </CardDescription>
            </div>
            <Link
              href="/admin/personnel"
              className="text-xs font-bold text-[#0d2847] hover:underline flex items-center gap-1 px-2.5 py-1 rounded-lg hover:bg-slate-100 transition-colors"
            >
              সকল অফিসার
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </CardHeader>
          <CardContent className="divide-y divide-slate-100 flex-1 pt-2">
            {highestUtilizationList.map((item) => (
              <div
                key={item.user.id}
                className="py-2.5 flex items-center justify-between gap-3 hover:bg-slate-50/60 transition-colors rounded-lg px-2"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/admin/personnel/${item.user.id}`}
                      className="font-bold text-xs text-slate-900 hover:text-blue-900 truncate"
                    >
                      {item.user.name}
                    </Link>
                    <BudgetStatusBadge
                      status={item.metrics.statusLevel}
                      showIcon={false}
                      bangla={true}
                      className="text-[10px] px-1.5 py-0"
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 truncate mt-0.5">
                    {item.user.serviceId} &bull; {item.user.unit || "ইউনিট"}
                  </p>
                </div>

                <div className="text-right shrink-0">
                  <p
                    className={`font-mono text-sm font-extrabold ${
                      item.metrics.committedPercentage > 100
                        ? "text-rose-600"
                        : item.metrics.committedPercentage >= 80
                        ? "text-amber-600"
                        : "text-slate-800"
                    }`}
                  >
                    {item.metrics.committedPercentage.toFixed(1)}%
                  </p>
                  <p className="text-[10px] text-slate-400 font-mono">
                    {formatBDT(item.metrics.committedPaisa)} / {formatBDT(item.allocatedPaisa)}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
