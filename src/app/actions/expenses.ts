"use server";

import { db } from "@/lib/db";
import { getCurrentUser, requireAuth } from "@/lib/auth";
import { logAuditAction } from "@/lib/audit";
import { formatBDT } from "@/lib/money";
import { revalidatePath } from "next/cache";

export async function createExpenseAction(data: {
  title: string;
  categoryId: string;
  amountPaisa: bigint;
  date: string;
  referenceNumber: string;
  description?: string;
  notes?: string;
}) {
  const user = await requireAuth();

  // Find active financial year
  const activeYear = await db.financialYear.findFirst({
    where: { status: "ACTIVE" },
  });

  if (!activeYear) {
    return { success: false, error: "No active financial year found for expenditures." };
  }

  // Get user's allocation for active financial year
  const allocation = await db.budgetAllocation.findUnique({
    where: {
      userId_financialYearId: {
        userId: user.id,
        financialYearId: activeYear.id,
      },
    },
  });

  if (!allocation) {
    return {
      success: false,
      error: "No annual budget allocation has been assigned to your account for the active financial year.",
    };
  }

  // Authoritative server-side calculation of current spending
  const userExpenses = await db.expense.findMany({
    where: {
      userId: user.id,
      financialYearId: activeYear.id,
      status: { in: ["APPROVED", "PENDING", "PROCESSING"] },
    },
    select: { amount: true, status: true },
  });

  const spentPaisa = userExpenses
    .filter((e) => e.status === "APPROVED")
    .reduce((acc, e) => acc + e.amount, BigInt(0));

  const pendingPaisa = userExpenses
    .filter((e) => e.status === "PENDING" || e.status === "PROCESSING")
    .reduce((acc, e) => acc + e.amount, BigInt(0));

  const committedPaisa = spentPaisa + pendingPaisa;
  const availablePaisa = allocation.allocatedAmount - committedPaisa;

  // Check unique reference number
  const existingRef = await db.expense.findUnique({
    where: { referenceNumber: data.referenceNumber },
  });

  if (existingRef) {
    return {
      success: false,
      error: `Reference voucher number "${data.referenceNumber}" already exists in the system.`,
    };
  }

  // Strictly enforce 100% budget limit rule: CANNOT EXCEED 100% BUDGET
  if (data.amountPaisa > availablePaisa) {
    return {
      success: false,
      error: `Strict Budget Ceiling Enforced: This voucher (${formatBDT(data.amountPaisa)}) exceeds your remaining available budget (${formatBDT(availablePaisa)}). In accordance with naval regulations, personnel expenditures cannot exceed 100% of authorized annual allocation.`,
    };
  }

  const status = "PENDING";
  const notes = data.notes || "";

  const createdExpense = await db.expense.create({
    data: {
      userId: user.id,
      financialYearId: activeYear.id,
      categoryId: data.categoryId,
      title: data.title,
      description: data.description || null,
      amount: data.amountPaisa,
      referenceNumber: data.referenceNumber,
      date: new Date(data.date),
      status: status,
      notes: notes.trim() || null,
    },
  });

  // Audit log
  await logAuditAction({
    actorId: user.id,
    actorName: user.name,
    actorRole: user.role,
    action: "EXPENSE_CREATED",
    entityType: "Expense",
    entityId: createdExpense.id,
    newValue: {
      referenceNumber: createdExpense.referenceNumber,
      title: createdExpense.title,
      amount: formatBDT(createdExpense.amount),
      status: createdExpense.status,
    },
  });

  revalidatePath("/dashboard");
  revalidatePath("/expenses");
  revalidatePath("/my-budget");
  revalidatePath("/admin");
  revalidatePath("/admin/expenses");

  return { success: true, expenseId: createdExpense.id };
}

export async function updateExpenseAction(
  expenseId: string,
  data: {
    title: string;
    categoryId: string;
    amountPaisa: bigint;
    date: string;
    referenceNumber: string;
    description?: string;
    notes?: string;
    status?: string;
  }
) {
  const user = await requireAuth();

  const existingExpense = await db.expense.findUnique({
    where: { id: expenseId },
  });

  if (!existingExpense) {
    return { success: false, error: "Voucher not found." };
  }

  // Authorization: Only owner or Admin can modify
  if (user.role !== "ADMIN" && existingExpense.userId !== user.id) {
    return { success: false, error: "Unauthorized: You can only edit your own vouchers." };
  }

  // Non-admins cannot modify an APPROVED expense or change status
  if (user.role !== "ADMIN" && existingExpense.status === "APPROVED") {
    return {
      success: false,
      error: "Approved expenditures are locked and cannot be edited by personnel. Contact HQ Admin.",
    };
  }

  // Check reference number uniqueness if changed
  if (data.referenceNumber !== existingExpense.referenceNumber) {
    const conflict = await db.expense.findUnique({
      where: { referenceNumber: data.referenceNumber },
    });
    if (conflict) {
      return { success: false, error: "Voucher reference number already taken." };
    }
  }

  // Only Admin can set or change status
  const nextStatus =
    user.role === "ADMIN" && data.status ? data.status : existingExpense.status;

  const updatedExpense = await db.expense.update({
    where: { id: expenseId },
    data: {
      title: data.title,
      categoryId: data.categoryId,
      amount: data.amountPaisa,
      date: new Date(data.date),
      referenceNumber: data.referenceNumber,
      description: data.description || null,
      notes: data.notes || null,
      status: nextStatus,
    },
  });

  // Audit log
  await logAuditAction({
    actorId: user.id,
    actorName: user.name,
    actorRole: user.role,
    action:
      existingExpense.status !== nextStatus
        ? "EXPENSE_STATUS_CHANGED"
        : "EXPENSE_UPDATED",
    entityType: "Expense",
    entityId: expenseId,
    previousValue: {
      title: existingExpense.title,
      amount: formatBDT(existingExpense.amount),
      status: existingExpense.status,
    },
    newValue: {
      title: updatedExpense.title,
      amount: formatBDT(updatedExpense.amount),
      status: updatedExpense.status,
    },
  });

  revalidatePath("/dashboard");
  revalidatePath("/expenses");
  revalidatePath("/my-budget");
  revalidatePath("/admin");
  revalidatePath("/admin/expenses");

  return { success: true };
}

export async function deleteExpenseAction(expenseId: string) {
  const user = await requireAuth();

  const existingExpense = await db.expense.findUnique({
    where: { id: expenseId },
  });

  if (!existingExpense) {
    return { success: false, error: "Expense not found." };
  }

  // Authorization: Only owner or Admin can delete
  if (user.role !== "ADMIN" && existingExpense.userId !== user.id) {
    return { success: false, error: "Unauthorized: You can only delete your own expenses." };
  }

  if (user.role !== "ADMIN" && existingExpense.status === "APPROVED") {
    return {
      success: false,
      error: "Approved expenditures are locked and cannot be deleted by general personnel.",
    };
  }

  await db.expense.delete({
    where: { id: expenseId },
  });

  // Audit log
  await logAuditAction({
    actorId: user.id,
    actorName: user.name,
    actorRole: user.role,
    action: "EXPENSE_DELETED",
    entityType: "Expense",
    entityId: expenseId,
    previousValue: {
      title: existingExpense.title,
      referenceNumber: existingExpense.referenceNumber,
      amount: formatBDT(existingExpense.amount),
      status: existingExpense.status,
    },
  });

  revalidatePath("/dashboard");
  revalidatePath("/expenses");
  revalidatePath("/my-budget");
  revalidatePath("/admin");
  revalidatePath("/admin/expenses");

  return { success: true };
}
