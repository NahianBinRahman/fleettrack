"use client";

import React, { useState, useMemo } from "react";
import { ExpenseRecord, ExpenseDetailDrawer } from "./ExpenseDetailDrawer";
import { ExpenseStatusBadge } from "@/components/budget/ExpenseStatusBadge";
import { MoneyDisplay } from "@/components/budget/MoneyDisplay";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search,
  Filter,
  Eye,
  Pencil,
  Trash2,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Tag,
  Calendar,
} from "lucide-react";
import { format } from "date-fns";

interface CategoryOption {
  id: string;
  name: string;
}

interface ExpenseTableProps {
  expenses: ExpenseRecord[];
  categories: CategoryOption[];
  onEditExpense?: (expense: ExpenseRecord) => void;
  onDeleteExpense?: (expenseId: string) => Promise<void>;
  showOfficerColumn?: boolean;
  canModify?: boolean;
}

export function ExpenseTable({
  expenses,
  categories,
  onEditExpense,
  onDeleteExpense,
  showOfficerColumn = false,
  canModify = true,
}: ExpenseTableProps) {
  // Search & Filters state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [sortField, setSortField] = useState<"date" | "amount" | "title">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Selected expense for drawer
  const [activeExpense, setActiveExpense] = useState<ExpenseRecord | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState<ExpenseRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Filtered & Sorted items
  const filteredExpenses = useMemo(() => {
    return expenses.filter((item) => {
      // Search
      const matchesSearch =
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.referenceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.user?.name && item.user.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()));

      // Category filter
      const matchesCategory =
        selectedCategory === "ALL" || item.category.id === selectedCategory;

      // Status filter
      const matchesStatus =
        selectedStatus === "ALL" || item.status.toUpperCase() === selectedStatus;

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [expenses, searchQuery, selectedCategory, selectedStatus]);

  const sortedExpenses = useMemo(() => {
    return [...filteredExpenses].sort((a, b) => {
      if (sortField === "date") {
        const timeA = new Date(a.date).getTime();
        const timeB = new Date(b.date).getTime();
        return sortOrder === "asc" ? timeA - timeB : timeB - timeA;
      }
      if (sortField === "amount") {
        const amountA = BigInt(a.amount);
        const amountB = BigInt(b.amount);
        if (amountA < amountB) return sortOrder === "asc" ? -1 : 1;
        if (amountA > amountB) return sortOrder === "asc" ? 1 : -1;
        return 0;
      }
      if (sortField === "title") {
        return sortOrder === "asc"
          ? a.title.localeCompare(b.title)
          : b.title.localeCompare(a.title);
      }
      return 0;
    });
  }, [filteredExpenses, sortField, sortOrder]);

  // Paginated items
  const totalPages = Math.max(1, Math.ceil(sortedExpenses.length / pageSize));
  const paginatedExpenses = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedExpenses.slice(start, start + pageSize);
  }, [sortedExpenses, currentPage, pageSize]);

  const handleSort = (field: "date" | "amount" | "title") => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
    setCurrentPage(1);
  };

  const handleResetFilters = () => {
    setSearchQuery("");
    setSelectedCategory("ALL");
    setSelectedStatus("ALL");
    setSortField("date");
    setSortOrder("desc");
    setCurrentPage(1);
  };

  const openDrawer = (expense: ExpenseRecord) => {
    setActiveExpense(expense);
    setIsDrawerOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteTarget || !onDeleteExpense) return;
    setIsDeleting(true);
    try {
      await onDeleteExpense(deleteTarget.id);
      setDeleteTarget(null);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Filter Toolbar */}
      <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search Box */}
          <div className="relative">
            <Input
              type="text"
              placeholder="Search expenses, ref #, description..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              icon={<Search className="w-4 h-4 text-slate-400" />}
            />
          </div>

          {/* Category Filter */}
          <div className="relative">
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full h-10 px-3 py-2 bg-white rounded-lg border border-slate-300 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#0d2847]"
            >
              <option value="ALL">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="relative">
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full h-10 px-3 py-2 bg-white rounded-lg border border-slate-300 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#0d2847]"
            >
              <option value="ALL">All Statuses</option>
              <option value="APPROVED">Approved / Spent</option>
              <option value="PENDING">Pending</option>
              <option value="PROCESSING">Processing</option>
              <option value="REJECTED">Rejected</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>

          {/* Sort / Clear Actions */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="default"
              onClick={() => handleSort("date")}
              className="flex-1 text-xs"
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
              {sortField === "date"
                ? `Date (${sortOrder})`
                : sortField === "amount"
                ? `Amount (${sortOrder})`
                : "Sort"}
            </Button>
            {(searchQuery || selectedCategory !== "ALL" || selectedStatus !== "ALL") && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleResetFilters}
                title="Reset filters"
                className="text-slate-500 hover:text-slate-900"
              >
                <RotateCcw className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Results Count */}
        <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
          <span>
            Showing <strong className="text-slate-700">{filteredExpenses.length}</strong> vouchers
          </span>
          <span>Page {currentPage} of {totalPages}</span>
        </div>
      </div>

      {/* Desktop Table (Hidden on Mobile) */}
      <div className="hidden md:block bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
              <tr>
                <th
                  className="py-3.5 px-4 cursor-pointer hover:text-slate-800"
                  onClick={() => handleSort("date")}
                >
                  <div className="flex items-center gap-1.5">
                    Date
                    {sortField === "date" && (
                      <span className="text-blue-600 font-bold">
                        {sortOrder === "asc" ? "↑" : "↓"}
                      </span>
                    )}
                  </div>
                </th>
                <th
                  className="py-3.5 px-4 cursor-pointer hover:text-slate-800"
                  onClick={() => handleSort("title")}
                >
                  <div className="flex items-center gap-1.5">
                    Expense Voucher
                    {sortField === "title" && (
                      <span className="text-blue-600 font-bold">
                        {sortOrder === "asc" ? "↑" : "↓"}
                      </span>
                    )}
                  </div>
                </th>
                {showOfficerColumn && <th className="py-3.5 px-4">Officer / Unit</th>}
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">Ref Number</th>
                <th className="py-3.5 px-4">Status</th>
                <th
                  className="py-3.5 px-4 text-right cursor-pointer hover:text-slate-800"
                  onClick={() => handleSort("amount")}
                >
                  <div className="flex items-center justify-end gap-1.5">
                    Amount (BDT)
                    {sortField === "amount" && (
                      <span className="text-blue-600 font-bold">
                        {sortOrder === "asc" ? "↑" : "↓"}
                      </span>
                    )}
                  </div>
                </th>
                <th className="py-3.5 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedExpenses.length === 0 ? (
                <tr>
                  <td
                    colSpan={showOfficerColumn ? 8 : 7}
                    className="py-12 text-center text-slate-500 text-sm"
                  >
                    No expense records matching the selected criteria.
                  </td>
                </tr>
              ) : (
                paginatedExpenses.map((exp) => (
                  <tr
                    key={exp.id}
                    className="hover:bg-slate-50/70 transition-colors group cursor-pointer"
                    onClick={() => openDrawer(exp)}
                  >
                    <td className="py-3 px-4 font-mono text-xs text-slate-600 whitespace-nowrap">
                      {format(new Date(exp.date), "dd MMM yyyy")}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900 group-hover:text-blue-900 transition-colors">
                        {exp.title}
                      </div>
                      {exp.description && (
                        <p className="text-xs text-slate-500 truncate max-w-xs">
                          {exp.description}
                        </p>
                      )}
                    </td>
                    {showOfficerColumn && (
                      <td className="py-3 px-4">
                        <span className="font-medium text-xs text-slate-800 block">
                          {exp.user?.name || "Officer"}
                        </span>
                        <span className="text-[11px] text-slate-500 font-mono">
                          {exp.user?.serviceId}
                        </span>
                      </td>
                    )}
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 text-xs font-medium">
                        <Tag className="w-3 h-3 text-slate-400" />
                        {exp.category.name}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-xs text-slate-500">
                      {exp.referenceNumber}
                    </td>
                    <td className="py-3 px-4">
                      <ExpenseStatusBadge status={exp.status} />
                    </td>
                    <td className="py-3 px-4 text-right">
                      <MoneyDisplay
                        amountInPaisa={exp.amount}
                        size="sm"
                        color="blue"
                      />
                    </td>
                    <td
                      className="py-3 px-4 text-center"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => openDrawer(exp)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-blue-800 hover:bg-blue-50 transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {canModify && onEditExpense && (
                          <button
                            onClick={() => onEditExpense(exp)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-amber-700 hover:bg-amber-50 transition-colors"
                            title="Edit Voucher"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                        )}
                        {canModify && onDeleteExpense && (
                          <button
                            onClick={() => setDeleteTarget(exp)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-700 hover:bg-rose-50 transition-colors"
                            title="Delete Voucher"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card List (Displayed on narrow screens) */}
      <div className="md:hidden space-y-3">
        {paginatedExpenses.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-500 text-sm">
            No expenses found.
          </div>
        ) : (
          paginatedExpenses.map((exp) => (
            <div
              key={exp.id}
              onClick={() => openDrawer(exp)}
              className="p-4 bg-white rounded-2xl border border-slate-200/90 shadow-xs space-y-3 active:bg-slate-50 transition-colors cursor-pointer"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm leading-snug">
                    {exp.title}
                  </h4>
                  <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                    <span className="font-mono">{format(new Date(exp.date), "dd MMM yyyy")}</span>
                    <span>•</span>
                    <span className="font-mono">{exp.referenceNumber}</span>
                  </div>
                </div>
                <MoneyDisplay
                  amountInPaisa={exp.amount}
                  size="base"
                  color="blue"
                />
              </div>

              {showOfficerColumn && exp.user && (
                <div className="text-xs text-slate-600 bg-slate-50 p-2 rounded-lg flex items-center justify-between">
                  <span className="font-semibold">{exp.user.name}</span>
                  <span className="font-mono text-slate-500">{exp.user.serviceId}</span>
                </div>
              )}

              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px] font-medium">
                    {exp.category.name}
                  </span>
                  <ExpenseStatusBadge status={exp.status} />
                </div>
                <div
                  className="flex items-center gap-1"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openDrawer(exp)}
                    className="h-8 px-2 text-xs"
                  >
                    View
                  </Button>
                  {canModify && onEditExpense && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEditExpense(exp)}
                      className="h-8 px-2 text-xs text-amber-700"
                    >
                      Edit
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Previous
          </Button>

          <span className="text-xs font-semibold text-slate-600">
            Page {currentPage} of {totalPages}
          </span>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            Next
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      )}

      {/* Drawer */}
      <ExpenseDetailDrawer
        expense={activeExpense}
        isOpen={isDrawerOpen}
        onClose={() => {
          setIsDrawerOpen(false);
          setActiveExpense(null);
        }}
        onEdit={onEditExpense}
        onDelete={(exp) => setDeleteTarget(exp)}
        canModify={canModify}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title="Delete Expense Voucher?"
        description={`Are you sure you want to delete "${deleteTarget?.title}" (${deleteTarget?.referenceNumber})? This expenditure voucher will be permanently removed from the ledger and your available budget balance will be recalculated accordingly.`}
        confirmText="Delete Voucher"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
}
