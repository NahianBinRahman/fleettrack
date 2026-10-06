"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { formatBDT, calculateBudgetMetrics, BudgetMetrics } from "@/lib/money";
import { BudgetStatusBadge } from "@/components/budget/BudgetStatusBadge";
import { BudgetUtilizationBar } from "@/components/budget/BudgetUtilizationBar";
import { MoneyDisplay } from "@/components/budget/MoneyDisplay";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BudgetAdjustModal } from "./BudgetAdjustModal";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import {
  Search,
  Filter,
  Eye,
  SlidersHorizontal,
  Power,
  RotateCcw,
  CheckCircle2,
  XCircle,
  ExternalLink,
} from "lucide-react";

export interface PersonnelRow {
  userId: string;
  allocationId: string;
  name: string;
  email: string;
  serviceId: string;
  rank?: string | null;
  unit?: string | null;
  isActive: boolean;
  allocatedPaisa: bigint;
  spentPaisa: bigint;
  pendingPaisa: bigint;
  metrics: BudgetMetrics;
}

interface PersonnelTableProps {
  personnel: PersonnelRow[];
  onAdjustBudget: (data: {
    allocationId: string;
    newAmountPaisa: bigint;
    reason: string;
  }) => Promise<{ success: boolean; error?: string }>;
  onToggleStatus: (userId: string, currentActive: boolean) => Promise<void>;
}

export function PersonnelTable({
  personnel,
  onAdjustBudget,
  onToggleStatus,
}: PersonnelTableProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [utilizationFilter, setUtilizationFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [sortBy, setSortBy] = useState<"utilization" | "allocated" | "name">("utilization");

  // Selected for budget adjustment modal
  const [adjustTarget, setAdjustTarget] = useState<PersonnelRow | null>(null);

  // Status toggle confirm
  const [toggleTarget, setToggleTarget] = useState<PersonnelRow | null>(null);
  const [isToggling, setIsToggling] = useState(false);

  const filteredPersonnel = useMemo(() => {
    return personnel.filter((p) => {
      // Search query
      const matchesSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.serviceId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.unit && p.unit.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (p.rank && p.rank.toLowerCase().includes(searchQuery.toLowerCase()));

      // Status
      const matchesStatus =
        statusFilter === "ALL" ||
        (statusFilter === "ACTIVE" && p.isActive) ||
        (statusFilter === "INACTIVE" && !p.isActive);

      // Utilization level
      let matchesUtil = true;
      if (utilizationFilter === "EXCEEDED") {
        matchesUtil = p.metrics.committedPercentage > 100;
      } else if (utilizationFilter === "APPROACHING") {
        matchesUtil = p.metrics.committedPercentage >= 80 && p.metrics.committedPercentage <= 100;
      } else if (utilizationFilter === "HEALTHY") {
        matchesUtil = p.metrics.committedPercentage < 80;
      }

      return matchesSearch && matchesStatus && matchesUtil;
    });
  }, [personnel, searchQuery, statusFilter, utilizationFilter]);

  const sortedPersonnel = useMemo(() => {
    return [...filteredPersonnel].sort((a, b) => {
      if (sortBy === "utilization") {
        return b.metrics.committedPercentage - a.metrics.committedPercentage;
      }
      if (sortBy === "allocated") {
        return a.allocatedPaisa < b.allocatedPaisa ? 1 : -1;
      }
      if (sortBy === "name") {
        return a.name.localeCompare(b.name);
      }
      return 0;
    });
  }, [filteredPersonnel, sortBy]);

  const handleConfirmToggle = async () => {
    if (!toggleTarget) return;
    setIsToggling(true);
    try {
      await onToggleStatus(toggleTarget.userId, toggleTarget.isActive);
      setToggleTarget(null);
    } finally {
      setIsToggling(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Search and Filter Controls */}
      <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <Input
            placeholder="Search officer name, service ID, unit..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            icon={<Search className="w-4 h-4 text-slate-400" />}
          />

          <select
            value={utilizationFilter}
            onChange={(e) => setUtilizationFilter(e.target.value)}
            className="w-full h-10 px-3 py-2 bg-white rounded-lg border border-slate-300 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#0d2847]"
          >
            <option value="ALL">All Utilization Tiers</option>
            <option value="HEALTHY">Healthy (&lt; 80%)</option>
            <option value="APPROACHING">Near Limit (80% – 100%)</option>
            <option value="EXCEEDED">Exceeded Budget (&gt; 100%)</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full h-10 px-3 py-2 bg-white rounded-lg border border-slate-300 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#0d2847]"
          >
            <option value="ALL">All Accounts</option>
            <option value="ACTIVE">Active Only</option>
            <option value="INACTIVE">Deactivated</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="w-full h-10 px-3 py-2 bg-white rounded-lg border border-slate-300 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#0d2847]"
          >
            <option value="utilization">Highest Utilization First</option>
            <option value="allocated">Highest Allocation First</option>
            <option value="name">Name (A–Z)</option>
          </select>
        </div>

        <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
          <span>
            Found <strong className="text-slate-800">{sortedPersonnel.length}</strong> personnel members
          </span>
          {(searchQuery || utilizationFilter !== "ALL" || statusFilter !== "ALL") && (
            <button
              onClick={() => {
                setSearchQuery("");
                setUtilizationFilter("ALL");
                setStatusFilter("ALL");
              }}
              className="text-xs text-blue-700 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Desktop Personnel Table */}
      <div className="hidden md:block bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4">Officer / Service ID</th>
                <th className="py-3.5 px-4">Designation & Unit</th>
                <th className="py-3.5 px-4 text-right">Assigned (BDT)</th>
                <th className="py-3.5 px-4 text-right">Spent</th>
                <th className="py-3.5 px-4 text-right">Available</th>
                <th className="py-3.5 px-4 w-44">Budget Utilization</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sortedPersonnel.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500 text-sm">
                    No naval personnel found matching the criteria.
                  </td>
                </tr>
              ) : (
                sortedPersonnel.map((p) => (
                  <tr key={p.userId} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4">
                      <Link
                        href={`/admin/personnel/${p.userId}`}
                        className="font-bold text-slate-900 hover:text-blue-900 transition-colors flex items-center gap-1.5"
                      >
                        {p.name}
                        <ExternalLink className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100" />
                      </Link>
                      <span className="font-mono text-xs text-slate-500">{p.serviceId}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-medium text-xs text-slate-700 block">
                        {p.rank || "Officer"}
                      </span>
                      <span className="text-[11px] text-slate-500 block truncate max-w-xs">
                        {p.unit || "Naval Unit"}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <MoneyDisplay amountInPaisa={p.allocatedPaisa} size="sm" color="blue" />
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <MoneyDisplay amountInPaisa={p.spentPaisa} size="sm" />
                      {p.pendingPaisa > BigInt(0) && (
                        <p className="text-[10px] text-amber-600 font-mono">
                          +{formatBDT(p.pendingPaisa)} pend.
                        </p>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <MoneyDisplay
                        amountInPaisa={p.metrics.availablePaisa}
                        size="sm"
                        color={p.metrics.isOverBudget ? "rose" : "emerald"}
                      />
                    </td>
                    <td className="py-3.5 px-4">
                      <BudgetUtilizationBar metrics={p.metrics} showLabels={true} />
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                          p.isActive
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-slate-100 text-slate-600 border border-slate-200"
                        }`}
                      >
                        {p.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Link
                          href={`/admin/personnel/${p.userId}`}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-blue-900 hover:bg-blue-50 transition-colors"
                          title="View Officer Details"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => setAdjustTarget(p)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-amber-700 hover:bg-amber-50 transition-colors"
                          title="Adjust Budget Allocation"
                        >
                          <SlidersHorizontal className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setToggleTarget(p)}
                          className={`p-1.5 rounded-lg transition-colors ${
                            p.isActive
                              ? "text-slate-400 hover:text-rose-700 hover:bg-rose-50"
                              : "text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                          }`}
                          title={p.isActive ? "Deactivate Account" : "Activate Account"}
                        >
                          <Power className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card List */}
      <div className="md:hidden space-y-3">
        {sortedPersonnel.map((p) => (
          <div
            key={p.userId}
            className="p-4 bg-white rounded-2xl border border-slate-200/90 shadow-xs space-y-3"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <Link
                  href={`/admin/personnel/${p.userId}`}
                  className="font-bold text-slate-900 text-sm hover:text-blue-900"
                >
                  {p.name}
                </Link>
                <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                  <span className="font-mono">{p.serviceId}</span>
                  <span>•</span>
                  <span>{p.rank}</span>
                </div>
              </div>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                  p.isActive
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                {p.isActive ? "Active" : "Inactive"}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 p-2.5 bg-slate-50 rounded-xl text-xs text-center">
              <div>
                <span className="text-[10px] text-slate-400">Allocated</span>
                <p className="font-bold text-slate-800 font-mono mt-0.5">
                  {formatBDT(p.allocatedPaisa)}
                </p>
              </div>
              <div>
                <span className="text-[10px] text-slate-400">Spent</span>
                <p className="font-bold text-slate-800 font-mono mt-0.5">
                  {formatBDT(p.spentPaisa)}
                </p>
              </div>
              <div>
                <span className="text-[10px] text-slate-400">Available</span>
                <p
                  className={`font-bold font-mono mt-0.5 ${
                    p.metrics.isOverBudget ? "text-rose-600" : "text-emerald-700"
                  }`}
                >
                  {formatBDT(p.metrics.availablePaisa)}
                </p>
              </div>
            </div>

            <BudgetUtilizationBar metrics={p.metrics} showLabels={true} />

            <div className="flex items-center justify-between pt-2 border-t border-slate-100 gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 text-xs"
                onClick={() => setAdjustTarget(p)}
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                Adjust Budget
              </Button>
              <Link href={`/admin/personnel/${p.userId}`} className="flex-1">
                <Button variant="secondary" size="sm" className="w-full text-xs">
                  <Eye className="w-3.5 h-3.5" />
                  View Ledger
                </Button>
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* Adjust Budget Modal */}
      {adjustTarget && (
        <BudgetAdjustModal
          isOpen={!!adjustTarget}
          onClose={() => setAdjustTarget(null)}
          personnel={{
            userId: adjustTarget.userId,
            allocationId: adjustTarget.allocationId,
            name: adjustTarget.name,
            rank: adjustTarget.rank,
            serviceId: adjustTarget.serviceId,
            unit: adjustTarget.unit,
            currentAllocatedPaisa: adjustTarget.allocatedPaisa,
            spentPaisa: adjustTarget.spentPaisa,
            pendingPaisa: adjustTarget.pendingPaisa,
          }}
          onSave={onAdjustBudget}
        />
      )}

      {/* Toggle Status Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!toggleTarget}
        onClose={() => setToggleTarget(null)}
        onConfirm={handleConfirmToggle}
        title={toggleTarget?.isActive ? "Deactivate Officer Account?" : "Activate Officer Account?"}
        description={
          toggleTarget?.isActive
            ? `Deactivating ${toggleTarget.name} (${toggleTarget.serviceId}) will immediately suspend their sign-in privileges and voucher submissions. Their historical budget and expense records will remain intact.`
            : `Re-activating ${toggleTarget?.name} (${toggleTarget?.serviceId}) will restore their access to the FleetTrack portal.`
        }
        confirmText={toggleTarget?.isActive ? "Deactivate Account" : "Activate Account"}
        variant={toggleTarget?.isActive ? "danger" : "primary"}
        isLoading={isToggling}
      />
    </div>
  );
}
