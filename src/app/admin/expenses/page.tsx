import React from "react";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/shared/PageHeader";
import { AdminExpensesClient } from "./AdminExpensesClient";

export default async function AdminExpensesPage({
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
    return <div className="p-8">No financial year active.</div>;
  }

  const expenses = await db.expense.findMany({
    where: { financialYearId: activeYear.id },
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

  return (
    <div className="space-y-6">
      <PageHeader
        title="Organization Expenditure Vouchers"
        description={`Audit and monitor all official procurement vouchers across naval units for ${activeYear.label}.`}
      />

      <AdminExpensesClient
        expenses={expenses as any}
        categories={categories}
      />
    </div>
  );
}
