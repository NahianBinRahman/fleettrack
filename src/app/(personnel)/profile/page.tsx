import React from "react";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  User,
  Shield,
  Award,
  Building,
  Mail,
  Key,
  ShieldCheck,
  CheckCircle,
} from "lucide-react";
import { format } from "date-fns";

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <div className="space-y-6 max-w-4xl">
      <PageHeader
        title="Personnel Profile"
        description="Official naval administrative service record and security credentials."
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Officer Card */}
        <div className="md:col-span-1">
          <Card className="border-slate-200/80 shadow-xs text-center p-6 space-y-4">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-[#0b1f3a] to-[#1e4e85] text-[#d4af37] border-2 border-[#d4af37]/50 flex items-center justify-center mx-auto text-xl font-black shadow-lg">
              {user.rank ? user.rank.slice(0, 2).toUpperCase() : "NAV"}
            </div>

            <div>
              <h2 className="text-base font-bold text-slate-900">{user.name}</h2>
              <p className="text-xs font-semibold text-slate-500 mt-0.5">
                {user.rank || "Commissioned Officer"}
              </p>
              <div className="mt-2">
                <span className="font-mono text-xs px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 font-bold border border-slate-200">
                  {user.serviceId}
                </span>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100">
              <Badge variant="success" className="w-full justify-center py-1">
                <CheckCircle className="w-3.5 h-3.5" />
                Active Commissioned Service
              </Badge>
            </div>
          </Card>
        </div>

        {/* Official Details & Security */}
        <div className="md:col-span-2 space-y-6">
          <Card className="border-slate-200/80 shadow-xs">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#0d2847]" />
                Naval Administrative Assignment
              </CardTitle>
              <CardDescription>
                Unit assignment and Directorate command structure
              </CardDescription>
            </CardHeader>
            <CardContent className="divide-y divide-slate-100 text-xs">
              <div className="flex items-center justify-between py-2.5">
                <span className="text-slate-500 flex items-center gap-2">
                  <User className="w-4 h-4 text-slate-400" />
                  Full Officer Name
                </span>
                <span className="font-semibold text-slate-900">{user.name}</span>
              </div>

              <div className="flex items-center justify-between py-2.5">
                <span className="text-slate-500 flex items-center gap-2">
                  <Award className="w-4 h-4 text-slate-400" />
                  Commissioned Rank
                </span>
                <span className="font-semibold text-slate-900">{user.rank || "General Service"}</span>
              </div>

              <div className="flex items-center justify-between py-2.5">
                <span className="text-slate-500 flex items-center gap-2">
                  <Building className="w-4 h-4 text-slate-400" />
                  Assigned Operational Unit
                </span>
                <span className="font-semibold text-slate-900">{user.unit || "Naval Unit"}</span>
              </div>

              <div className="flex items-center justify-between py-2.5">
                <span className="text-slate-500 flex items-center gap-2">
                  <Mail className="w-4 h-4 text-slate-400" />
                  Official Communication Email
                </span>
                <span className="font-mono text-slate-800">{user.email}</span>
              </div>

              <div className="flex items-center justify-between py-2.5">
                <span className="text-slate-500 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-slate-400" />
                  Access Role Level
                </span>
                <span className="font-bold text-[#0d2847]">{user.role}</span>
              </div>
            </CardContent>
          </Card>

          {/* Security & Authentication */}
          <Card className="border-slate-200/80 shadow-xs">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Key className="w-4 h-4 text-[#0d2847]" />
                Security &amp; Session Credentials
              </CardTitle>
              <CardDescription>
                Multi-layer encryption and authorized access status
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-xs text-slate-600">
              <p className="leading-relaxed">
                Your session is secured using HMAC-SHA256 encrypted JWT session cookies with strict SameSite protection.
              </p>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-slate-600">
                To update your credentials, official designations, or report unauthorized access, please submit an official memorandum to the Naval Headquarters Administrative Directorate.
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
