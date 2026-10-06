import React from "react";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect, notFound } from "next/navigation";
import { PersonnelDetailClient } from "./PersonnelDetailClient";
import { calculateBudgetMetrics } from "@/lib/money";
import { format } from "date-fns";

export default async function AdminPersonnelDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ fy?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") redirect("/login");

  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;

  const officer = await db.user.findUnique({
    where: { id: resolvedParams.id },
  });

  if (!officer) notFound();

  let activeYear;
  if (resolvedSearchParams?.fy) {
    activeYear = await db.financialYear.findUnique({
      where: { id: resolvedSearchParams.fy },
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

  if (!activeYear) notFound();

  // Load allocation with history
  let allocation = await db.budgetAllocation.findUnique({
    where: {
      userId_financialYearId: {
        userId: officer.id,
        financialYearId: activeYear.id,
      },
    },
    include: {
      history: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

  // If officer has no allocation yet for this year, create or default
  if (!allocation) {
    allocation = await db.budgetAllocation.create({
      data: {
        userId: officer.id,
        financialYearId: activeYear.id,
        allocatedAmount: BigInt(0),
        notes: "Baseline pending allocation",
      },
      include: {
        history: true,
      },
    });
  }

  // Load officer expenses
  const expenses = await db.expense.findMany({
    where: {
      userId: officer.id,
      financialYearId: activeYear.id,
    },
    include: {
      category: {
        select: { id: true, name: true },
      },
      user: {
        select: { id: true, name: true, serviceId: true, rank: true },
      },
    },
    orderBy: { date: "desc" },
  });

  const categories = await db.expenseCategory.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  // Calculate metrics
  const spentPaisa = expenses
    .filter((e) => e.status === "APPROVED")
    .reduce((acc, e) => acc + e.amount, BigInt(0));

  const pendingPaisa = expenses
    .filter((e) => e.status === "PENDING" || e.status === "PROCESSING")
    .reduce((acc, e) => acc + e.amount, BigInt(0));

  const metrics = calculateBudgetMetrics(
    allocation.allocatedAmount,
    spentPaisa,
    pendingPaisa
  );

  // Monthly trend
  const monthMap: Record<string, { amountPaisa: bigint; count: number }> = {};
  const monthNames = ["Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May", "Jun"];
  monthNames.forEach((m) => {
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

  const monthlyChartData = monthNames.map((m) => ({
    month: m,
    amountPaisa: monthMap[m].amountPaisa,
    count: monthMap[m].count,
  }));

  // Category chart
  const catMap: Record<string, { amountPaisa: bigint; count: number }> = {};
  expenses
    .filter((e) => e.status === "APPROVED" || e.status === "PENDING")
    .forEach((e) => {
      const catName = e.category.name;
      if (!catMap[catName]) {
        catMap[catName] = { amountPaisa: BigInt(0), count: 0 };
      }
      catMap[catName].amountPaisa += e.amount;
      catMap[catName].count += 1;
    });

  const categoryChartData = Object.entries(catMap).map(([name, data]) => ({
    name,
    amountPaisa: data.amountPaisa,
    count: data.count,
  }));

  return (
    <PersonnelDetailClient
      officer={{
        id: officer.id,
        name: officer.name,
        email: officer.email,
        serviceId: officer.serviceId,
        rank: officer.rank,
        unit: officer.unit,
        isActive: officer.isActive,
      }}
      allocation={{
        id: allocation.id,
        allocatedAmount: allocation.allocatedAmount,
        notes: allocation.notes,
        history: allocation.history,
      }}
      metrics={metrics}
      expenses={expenses as any}
      categories={categories}
      monthlyChartData={monthlyChartData}
      categoryChartData={categoryChartData}
      yearLabel={activeYear.label}
    />
  );
}
