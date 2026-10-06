import React from "react";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Settings,
  Shield,
  Coins,
  Building,
  CheckCircle2,
  HardDrive,
  Database,
  Lock,
} from "lucide-react";

export default async function AdminSettingsPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") redirect("/login");

  return (
    <div className="space-y-6 max-w-4xl">
      <PageHeader
        title="Institutional &amp; System Settings"
        description="Configuration parameters for the Naval Administrative Budget Management System."
      />

      <div className="space-y-6">
        {/* Currency & Financial Standards */}
        <Card className="border-slate-200/80 shadow-xs">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Coins className="w-4 h-4 text-[#0d2847]" />
              Currency &amp; Monetary Precision Standard
            </CardTitle>
            <CardDescription>
              Configured financial conventions enforced across the application
            </CardDescription>
          </CardHeader>
          <CardContent className="divide-y divide-slate-100 text-xs">
            <div className="flex items-center justify-between py-2.5">
              <span className="text-slate-500">Official Currency</span>
              <span className="font-bold text-slate-900">Bangladeshi Taka (BDT / ৳)</span>
            </div>
            <div className="flex items-center justify-between py-2.5">
              <span className="text-slate-500">Currency Symbol</span>
              <span className="font-bold font-mono text-blue-900 text-sm">৳</span>
            </div>
            <div className="flex items-center justify-between py-2.5">
              <span className="text-slate-500">Monetary Storage Engine</span>
              <span className="font-mono text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded">
                Integer Minor Units (Paisa: 1 BDT = 100 Paisa)
              </span>
            </div>
            <div className="flex items-center justify-between py-2.5">
              <span className="text-slate-500">Floating-Point Protection</span>
              <span className="font-semibold text-slate-800">
                Guaranteed zero-rounding error (Server-side BigInt arithmetic)
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Institutional Unit Architecture */}
        <Card className="border-slate-200/80 shadow-xs">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Building className="w-4 h-4 text-[#0d2847]" />
              Naval Unit Hierarchy
            </CardTitle>
            <CardDescription>
              Command formation and administrative structure
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-xs text-slate-600">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
              <p className="font-bold text-slate-900">Designated Organization:</p>
              <p>Naval Headquarters Administrative Directorate &bull; Fleet Procurement &amp; Logistics Division</p>
              <p className="text-slate-500">Current active personnel ceiling: 100+ Commissioned Officers</p>
            </div>
          </CardContent>
        </Card>

        {/* Database & Security Architecture */}
        <Card className="border-slate-200/80 shadow-xs">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Database className="w-4 h-4 text-[#0d2847]" />
              Persistence &amp; Security Architecture
            </CardTitle>
            <CardDescription>
              Database engines and access control verification
            </CardDescription>
          </CardHeader>
          <CardContent className="divide-y divide-slate-100 text-xs">
            <div className="flex items-center justify-between py-2.5">
              <span className="text-slate-500">Relational ORM Layer</span>
              <span className="font-mono text-slate-800 font-semibold">Prisma ORM (v6.4.1)</span>
            </div>
            <div className="flex items-center justify-between py-2.5">
              <span className="text-slate-500">Persistence Engine</span>
              <span className="font-semibold text-slate-800">
                Relational Database (PostgreSQL / SQLite Production Model)
              </span>
            </div>
            <div className="flex items-center justify-between py-2.5">
              <span className="text-slate-500">Session Security</span>
              <span className="font-semibold text-slate-800">
                HMAC-SHA256 Encrypted JWT HTTP-only Cookies
              </span>
            </div>
            <div className="flex items-center justify-between py-2.5">
              <span className="text-slate-500">Audit Logging</span>
              <span className="font-semibold text-emerald-700 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Active Immutable Ledger
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
