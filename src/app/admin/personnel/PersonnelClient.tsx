"use client";

import React, { useState } from "react";
import { PersonnelTable, PersonnelRow } from "@/components/admin/PersonnelTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  UserPlus,
  X,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import {
  adjustAllocationAction,
  toggleUserStatusAction,
  createPersonnelAction,
} from "@/app/actions/admin";

interface PersonnelClientProps {
  personnel: PersonnelRow[];
  activeYearLabel: string;
}

export function PersonnelClient({
  personnel,
  activeYearLabel,
}: PersonnelClientProps) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // New Personnel Form State
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [serviceId, setServiceId] = useState("");
  const [rank, setRank] = useState("Lieutenant");
  const [unit, setUnit] = useState("");
  const [initialAllocationBDT, setInitialAllocationBDT] = useState<number>(250000);

  const handleAdjustBudget = async (data: {
    allocationId: string;
    newAmountPaisa: bigint;
    reason: string;
  }) => {
    return await adjustAllocationAction(data);
  };

  const handleToggleStatus = async (userId: string, currentActive: boolean) => {
    await toggleUserStatusAction(userId, currentActive);
  };

  const handleCreatePersonnel = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsSubmitting(true);

    try {
      const res = await createPersonnelAction({
        name,
        email,
        serviceId,
        rank,
        unit,
        initialAllocationBDT,
      });

      if (!res.success) {
        setErrorMessage(res.error || "Failed to create account.");
      } else {
        setSuccessMessage("Officer account successfully created and enrolled with allocation!");
        // Reset form
        setName("");
        setEmail("");
        setServiceId("");
        setUnit("");
        setInitialAllocationBDT(250000);
        setTimeout(() => {
          setIsAddModalOpen(false);
          setSuccessMessage(null);
        }, 1500);
      }
    } catch (err: any) {
      setErrorMessage(err.message || "An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">
            Commissioned Personnel Directory
          </h2>
          <p className="text-xs text-slate-500">
            Audit, reallocate budgets, and manage access privileges across naval units
          </p>
        </div>

        <Button
          variant="naval"
          onClick={() => setIsAddModalOpen(true)}
          className="shadow-sm"
        >
          <UserPlus className="w-4 h-4" />
          Enroll Personnel Member
        </Button>
      </div>

      {/* Main Personnel Table */}
      <PersonnelTable
        personnel={personnel}
        onAdjustBudget={handleAdjustBudget}
        onToggleStatus={handleToggleStatus}
      />

      {/* Enroll Personnel Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 bg-[#091726] text-white flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#d4af37]">
                  Personnel Enrolment
                </span>
                <h3 className="text-lg font-bold text-white mt-0.5">
                  Register New Naval Personnel Member
                </h3>
                <p className="text-xs text-slate-400">
                  Initial budget quota will be allocated for {activeYearLabel}
                </p>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePersonnel} className="p-6 space-y-4">
              {errorMessage && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {successMessage && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>{successMessage}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Full Officer Name *
                </label>
                <Input
                  placeholder="e.g. Commander M. Rashidul Haque, psc, BN"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Service ID (Official #) *
                  </label>
                  <Input
                    placeholder="NAV-2088"
                    value={serviceId}
                    onChange={(e) => setServiceId(e.target.value)}
                    className="font-mono text-sm"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Commissioned Rank *
                  </label>
                  <select
                    value={rank}
                    onChange={(e) => setRank(e.target.value)}
                    className="w-full h-10 px-3 py-2 bg-white rounded-lg border border-slate-300 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0d2847]"
                  >
                    <option value="Captain">Captain</option>
                    <option value="Commander">Commander</option>
                    <option value="Lieutenant Commander">Lieutenant Commander</option>
                    <option value="Lieutenant">Lieutenant</option>
                    <option value="Sub-Lieutenant">Sub-Lieutenant</option>
                    <option value="Chief Petty Officer">Chief Petty Officer</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Assigned Operational Unit *
                </label>
                <Input
                  placeholder="e.g. Coastal Surveillance Squadron Alpha"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Official Email Address *
                </label>
                <Input
                  type="email"
                  placeholder="officer.name@fleettrack.mil.bd"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Initial Annual Allocation (৳ BDT) *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-400 font-bold text-sm">
                    ৳
                  </span>
                  <Input
                    type="number"
                    step="5000"
                    placeholder="250000"
                    className="pl-8 font-mono text-sm font-semibold"
                    value={initialAllocationBDT}
                    onChange={(e) => setInitialAllocationBDT(parseFloat(e.target.value) || 0)}
                    required
                  />
                </div>
                <p className="text-[11px] text-slate-500">
                  Default temporary account password will be set to: <code className="font-mono text-slate-700">password123</code>
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddModalOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="naval"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Enrolling..." : "Enroll Officer"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
