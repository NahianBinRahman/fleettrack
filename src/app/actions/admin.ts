"use server";

import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { logAuditAction } from "@/lib/audit";
import { formatBDT } from "@/lib/money";
import { hashPassword } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function adjustAllocationAction(data: {
  allocationId: string;
  newAmountPaisa: bigint;
  reason: string;
}) {
  const admin = await requireAdmin();

  const allocation = await db.budgetAllocation.findUnique({
    where: { id: data.allocationId },
    include: { user: true, financialYear: true },
  });

  if (!allocation) {
    return { success: false, error: "Budget allocation record not found." };
  }

  const previousAmount = allocation.allocatedAmount;

  // Record history
  await db.budgetAllocationHistory.create({
    data: {
      allocationId: allocation.id,
      changedById: admin.id,
      previousAmount: previousAmount,
      newAmount: data.newAmountPaisa,
      reason: data.reason,
    },
  });

  // Update allocation
  const updated = await db.budgetAllocation.update({
    where: { id: data.allocationId },
    data: {
      allocatedAmount: data.newAmountPaisa,
      notes: data.reason,
    },
  });

  // Audit log
  await logAuditAction({
    actorId: admin.id,
    actorName: admin.name,
    actorRole: "ADMIN",
    action: "ALLOCATION_CHANGED",
    entityType: "BudgetAllocation",
    entityId: allocation.id,
    previousValue: {
      user: allocation.user.name,
      allocatedAmount: formatBDT(previousAmount),
    },
    newValue: {
      user: allocation.user.name,
      allocatedAmount: formatBDT(data.newAmountPaisa),
      reason: data.reason,
    },
  });

  revalidatePath("/admin");
  revalidatePath("/admin/personnel");
  revalidatePath(`/admin/personnel/${allocation.userId}`);
  revalidatePath("/dashboard");
  revalidatePath("/my-budget");

  return { success: true };
}

export async function toggleUserStatusAction(userId: string, currentActive: boolean) {
  const admin = await requireAdmin();

  const user = await db.user.update({
    where: { id: userId },
    data: { isActive: !currentActive },
  });

  await logAuditAction({
    actorId: admin.id,
    actorName: admin.name,
    actorRole: "ADMIN",
    action: "USER_STATUS_CHANGED",
    entityType: "User",
    entityId: userId,
    previousValue: { isActive: currentActive },
    newValue: { isActive: !currentActive, name: user.name },
  });

  revalidatePath("/admin/personnel");
  revalidatePath(`/admin/personnel/${userId}`);
}

export async function createPersonnelAction(data: {
  name: string;
  email: string;
  serviceId: string;
  rank: string;
  unit: string;
  initialAllocationBDT: number;
}) {
  const admin = await requireAdmin();

  const existing = await db.user.findFirst({
    where: {
      OR: [{ email: data.email.toLowerCase() }, { serviceId: data.serviceId }],
    },
  });

  if (existing) {
    return {
      success: false,
      error: "User with this official email or Service ID already exists.",
    };
  }

  const activeYear = await db.financialYear.findFirst({
    where: { status: "ACTIVE" },
  });

  if (!activeYear) {
    return { success: false, error: "No active financial year found." };
  }

  const defaultPasswordHash = await hashPassword("password123");

  const newUser = await db.user.create({
    data: {
      name: data.name,
      email: data.email.toLowerCase(),
      serviceId: data.serviceId,
      rank: data.rank,
      unit: data.unit,
      role: "PERSONNEL",
      passwordHash: defaultPasswordHash,
      isActive: true,
    },
  });

  // Create allocation
  const allocationPaisa = BigInt(data.initialAllocationBDT) * BigInt(100);
  await db.budgetAllocation.create({
    data: {
      userId: newUser.id,
      financialYearId: activeYear.id,
      allocatedAmount: allocationPaisa,
      notes: `Initial FY ${activeYear.year} allocation approved by HQ`,
    },
  });

  await logAuditAction({
    actorId: admin.id,
    actorName: admin.name,
    actorRole: "ADMIN",
    action: "USER_CREATED",
    entityType: "User",
    entityId: newUser.id,
    newValue: {
      name: newUser.name,
      serviceId: newUser.serviceId,
      rank: newUser.rank,
      initialAllocation: formatBDT(allocationPaisa),
    },
  });

  revalidatePath("/admin/personnel");
  revalidatePath("/admin");

  return { success: true, userId: newUser.id };
}

export async function updateExpenseStatusAction(
  expenseId: string,
  newStatus: string,
  notes?: string
) {
  const admin = await requireAdmin();

  const expense = await db.expense.findUnique({
    where: { id: expenseId },
  });

  if (!expense) {
    return { success: false, error: "Voucher not found." };
  }

  const prevStatus = expense.status;

  await db.expense.update({
    where: { id: expenseId },
    data: {
      status: newStatus,
      notes: notes ? `${notes} (Updated by HQ)` : expense.notes,
    },
  });

  await logAuditAction({
    actorId: admin.id,
    actorName: admin.name,
    actorRole: "ADMIN",
    action: "EXPENSE_STATUS_CHANGED",
    entityType: "Expense",
    entityId: expenseId,
    previousValue: { status: prevStatus },
    newValue: { status: newStatus, notes: notes || null },
  });

  revalidatePath("/admin");
  revalidatePath("/admin/expenses");
  revalidatePath("/dashboard");
  revalidatePath("/expenses");

  return { success: true };
}

export async function createFinancialYearAction(data: {
  year: number;
  label: string;
  totalBudgetBDT: number;
  status: string;
  startDate: string;
  endDate: string;
}) {
  const admin = await requireAdmin();

  const existingYear = await db.financialYear.findUnique({
    where: { year: data.year },
  });

  if (existingYear) {
    return { success: false, error: `Financial year ${data.year} already exists.` };
  }

  // If new year is set to ACTIVE, set existing active to CLOSED
  if (data.status === "ACTIVE") {
    await db.financialYear.updateMany({
      where: { status: "ACTIVE" },
      data: { status: "CLOSED" },
    });
  }

  const totalBudgetPaisa = BigInt(data.totalBudgetBDT) * BigInt(100);

  const newFY = await db.financialYear.create({
    data: {
      year: data.year,
      label: data.label,
      totalBudget: totalBudgetPaisa,
      status: data.status,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
    },
  });

  await logAuditAction({
    actorId: admin.id,
    actorName: admin.name,
    actorRole: "ADMIN",
    action: "YEAR_CREATED",
    entityType: "FinancialYear",
    entityId: newFY.id,
    newValue: {
      year: newFY.year,
      label: newFY.label,
      totalBudget: formatBDT(totalBudgetPaisa),
      status: newFY.status,
    },
  });

  revalidatePath("/admin/financial-years");
  revalidatePath("/admin");

  return { success: true };
}

export async function updateFinancialYearStatusAction(
  yearId: string,
  newStatus: string
) {
  const admin = await requireAdmin();

  // If making ACTIVE, close current active
  if (newStatus === "ACTIVE") {
    await db.financialYear.updateMany({
      where: { status: "ACTIVE" },
      data: { status: "CLOSED" },
    });
  }

  const updated = await db.financialYear.update({
    where: { id: yearId },
    data: { status: newStatus },
  });

  await logAuditAction({
    actorId: admin.id,
    actorName: admin.name,
    actorRole: "ADMIN",
    action: "YEAR_UPDATED",
    entityType: "FinancialYear",
    entityId: yearId,
    newValue: { status: newStatus, year: updated.year },
  });

  revalidatePath("/admin/financial-years");
  revalidatePath("/admin");
  revalidatePath("/dashboard");

  return { success: true };
}
