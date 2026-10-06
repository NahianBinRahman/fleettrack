import React from "react";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/shared/PageHeader";
import { ExpensesClient } from "./ExpensesClient";
import { calculateBudgetMetrics } from "@/lib/money";

export default async function ExpensesPage({
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
    return <div className="p-8">No financial year active.</div>;
  }

  // Load user's allocation
  const allocation = await db.budgetAllocation.findUnique({
    where: {
      userId_financialYearId: {
        userId: user.id,
        financialYearId: activeYear.id,
      },
    },
  });

  const allocatedPaisa = allocation?.allocatedAmount ?? BigInt(0);

  // Load user's expenses
  const expenses = await db.expense.findMany({
    where: {
      userId: user.id,
      financialYearId: activeYear.id,
    },
    include: {
      category: {
        select: { id: true, name: true },
      },
    },
    orderBy: { date: "desc" },
  });

  // Load categories
  const categories = await db.expenseCategory.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  // Calculate authoritative metrics
  const spentPaisa = expenses
    .filter((e) => e.status === "APPROVED")
    .reduce((acc, e) => acc + e.amount, BigInt(0));

  const pendingPaisa = expenses
    .filter((e) => e.status === "PENDING" || e.status === "PROCESSING")
    .reduce((acc, e) => acc + e.amount, BigInt(0));

  const metrics = calculateBudgetMetrics(allocatedPaisa, spentPaisa, pendingPaisa);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Expense Vouchers"
        description={`Manage and review your recorded expenditures for ${activeYear.label}.`}
      />

      <ExpensesClient
        expenses={expenses as any}
        categories={categories}
        budgetContext={{
          allocatedPaisa: metrics.allocatedPaisa,
          committedPaisa: metrics.committedPaisa,
          availablePaisa: metrics.availablePaisa,
        }}
      />
    </div>
  );
}
