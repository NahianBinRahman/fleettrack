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
        title="প্রাতিষ্ঠানিক ও সিস্টেম সেটিংস (Settings)"
        description="নৌ প্রশাসনিক বাজেট ব্যবস্থাপনা সিস্টেমের কনফিগারেশন প্যারামিটার ও মানদণ্ড।"
      />

      <div className="space-y-6">
        {/* Currency & Financial Standards */}
        <Card className="border-slate-200/80 shadow-xs">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Coins className="w-4 h-4 text-[#0d2847]" />
              মুদ্রা ও আর্থিক নির্ভুলতা মানদণ্ড (Currency Standard)
            </CardTitle>
            <CardDescription>
              অ্যাপ্লিকেশনে প্রযুক্ত আর্থিক হিসাবরক্ষণ নীতিমালা
            </CardDescription>
          </CardHeader>
          <CardContent className="divide-y divide-slate-100 text-xs">
            <div className="flex items-center justify-between py-2.5">
              <span className="text-slate-500">অফিসিয়াল মুদ্রা</span>
              <span className="font-bold text-slate-900">বাংলাদেশি টাকা (BDT / ৳)</span>
            </div>
            <div className="flex items-center justify-between py-2.5">
              <span className="text-slate-500">মুদ্রার প্রতীক</span>
              <span className="font-bold font-mono text-blue-900 text-sm">৳</span>
            </div>
            <div className="flex items-center justify-between py-2.5">
              <span className="text-slate-500">আর্থিক সঞ্চয় ইঞ্জিন</span>
              <span className="font-mono text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded">
                ইনটিজার মাইনর ইউনিট (Paisa: ১ BDT = ১০০ Paisa)
              </span>
            </div>
            <div className="flex items-center justify-between py-2.5">
              <span className="text-slate-500">দশমিক রাউন্ডিং সুরক্ষা</span>
              <span className="font-semibold text-slate-800">
                সার্ভার-সাইড BigInt গাণিতিক হিসাব দ্বারা শতভাগ রাউন্ডিং ত্রুটিমুক্ত
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Institutional Unit Architecture */}
        <Card className="border-slate-200/80 shadow-xs">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Building className="w-4 h-4 text-[#0d2847]" />
              নৌ ইউনিট কাঠামো (Hierarchy)
            </CardTitle>
            <CardDescription>
              কমান্ড গঠন ও প্রশাসনিক বিন্যাস
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-xs text-slate-600">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
              <p className="font-bold text-slate-900">নির্ধারিত সংস্থা:</p>
              <p>নৌ সদর দপ্তর প্রশাসনিক পরিদপ্তর &bull; ফ্লিট প্রকিউরমেন্ট ও লজিস্টিকস ডিভিশন</p>
              <p className="text-slate-500">বর্তমান সক্রিয় কর্মকর্তা সিলিং: ১০০+ কমিশনড অফিসার</p>
            </div>
          </CardContent>
        </Card>

        {/* Database & Security Architecture */}
        <Card className="border-slate-200/80 shadow-xs">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Database className="w-4 h-4 text-[#0d2847]" />
              ডাটাবেস ও নিরাপত্তা আর্কিটেকচার (Security)
            </CardTitle>
            <CardDescription>
              ডাটাবেস ইঞ্জিন ও অ্যাক্সেস নিয়ন্ত্রণ যাচাইকরণ
            </CardDescription>
          </CardHeader>
          <CardContent className="divide-y divide-slate-100 text-xs">
            <div className="flex items-center justify-between py-2.5">
              <span className="text-slate-500">রিলেশনাল ওআরএম লেয়ার</span>
              <span className="font-mono text-slate-800 font-semibold">Prisma ORM (v6.4.1)</span>
            </div>
            <div className="flex items-center justify-between py-2.5">
              <span className="text-slate-500">ডাটা স্টোরেজ ইঞ্জিন</span>
              <span className="font-semibold text-slate-800">
                রিলেশনাল ডাটাবেস (PostgreSQL / SQLite Production Model)
              </span>
            </div>
            <div className="flex items-center justify-between py-2.5">
              <span className="text-slate-500">সেশন নিরাপত্তা</span>
              <span className="font-semibold text-slate-800">
                HMAC-SHA256 এনক্রিপ্টেড JWT HTTP-অনলি কুকিজ
              </span>
            </div>
            <div className="flex items-center justify-between py-2.5">
              <span className="text-slate-500">অডিট লগিং</span>
              <span className="font-semibold text-emerald-700 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                সক্রিয় অপরিবর্তনীয় লেজার (Immutable Ledger)
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
