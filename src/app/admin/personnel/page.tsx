import React from "react";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/shared/PageHeader";
import { PersonnelClient } from "./PersonnelClient";
import { calculateBudgetMetrics } from "@/lib/money";

export default async function AdminPersonnelPage({
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

  // Load all personnel users
  const personnelUsers = await db.user.findMany({
    where: { role: "PERSONNEL" },
    include: {
      allocations: {
        where: { financialYearId: activeYear.id },
      },
      expenses: {
        where: { financialYearId: activeYear.id },
      },
    },
    orderBy: { name: "asc" },
  });

  const personnelRows = personnelUsers.map((p) => {
    const allocation = p.allocations[0];
    const allocatedPaisa = allocation?.allocatedAmount ?? BigInt(0);
    const allocationId = allocation?.id ?? "";

    const spentPaisa = p.expenses
      .filter((e) => e.status === "APPROVED")
      .reduce((acc, e) => acc + e.amount, BigInt(0));

    const pendingPaisa = p.expenses
      .filter((e) => e.status === "PENDING" || e.status === "PROCESSING")
      .reduce((acc, e) => acc + e.amount, BigInt(0));

    const metrics = calculateBudgetMetrics(allocatedPaisa, spentPaisa, pendingPaisa);

    return {
      userId: p.id,
      allocationId: allocationId,
      name: p.name,
      email: p.email,
      serviceId: p.serviceId,
      rank: p.rank,
      unit: p.unit,
      isActive: p.isActive,
      allocatedPaisa,
      spentPaisa,
      pendingPaisa,
      metrics,
    };
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Personnel &amp; Budget Management"
        description={`Manage operational budget quotas, status, and authorizations for ${personnelRows.length} commissioned personnel in ${activeYear.label}.`}
      />

      <PersonnelClient
        personnel={personnelRows}
        activeYearLabel={activeYear.label}
      />
    </div>
  );
}
