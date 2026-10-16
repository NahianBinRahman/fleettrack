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

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <PageHeader
        title="অফিসার প্রোফাইল (Personnel Profile)"
        description="দাপ্তরিক নেভাল সার্ভিস রেকর্ড, প্রশাসনিক দায়িত্ব ও অ্যাকাউন্ট তথ্যাবলী।"
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* অফিসার কার্ড */}
        <div className="md:col-span-1">
          <Card className="border-slate-200/80 shadow-xs text-center p-6 space-y-4">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-[#0b1f3a] to-[#1e4e85] text-[#d4af37] border-2 border-[#d4af37]/50 flex items-center justify-center mx-auto text-xl font-black shadow-lg">
              {user.rank ? user.rank.slice(0, 2).toUpperCase() : "NAV"}
            </div>

            <div>
              <h2 className="text-base font-bold text-slate-900">{user.name}</h2>
              <p className="text-xs font-semibold text-slate-500 mt-0.5">
                {user.rank || "কমিশন্ড অফিসার"}
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
                সক্রিয় সামরিক সেবা (Active Service)
              </Badge>
            </div>
          </Card>
        </div>

        {/* দাপ্তরিক বিবরণ ও নিরাপত্তা */}
        <div className="md:col-span-2 space-y-6">
          <Card className="border-slate-200/80 shadow-xs">
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#0d2847]" />
                নেভাল প্রশাসনিক পদায়ন ও দায়িত্ব
              </CardTitle>
              <CardDescription className="text-xs text-slate-500 mt-0.5">
                ইউনিট অ্যাসাইনমেন্ট ও কমান্ডের সাংগঠনিক কাঠামো
              </CardDescription>
            </CardHeader>
            <CardContent className="divide-y divide-slate-100 text-xs pt-2">
              <div className="flex items-center justify-between py-2.5">
                <span className="text-slate-500 flex items-center gap-2">
                  <User className="w-4 h-4 text-slate-400" />
                  পূর্ণ নাম (Officer Name)
                </span>
                <span className="font-semibold text-slate-900">{user.name}</span>
              </div>

              <div className="flex items-center justify-between py-2.5">
                <span className="text-slate-500 flex items-center gap-2">
                  <Award className="w-4 h-4 text-slate-400" />
                  কমিশন্ড পদবি (Rank)
                </span>
                <span className="font-semibold text-slate-900">{user.rank || "জেনারেল সার্ভিস"}</span>
              </div>

              <div className="flex items-center justify-between py-2.5">
                <span className="text-slate-500 flex items-center gap-2">
                  <Building className="w-4 h-4 text-slate-400" />
                  দায়িত্বপ্রাপ্ত ইউনিট (Assigned Unit)
                </span>
                <span className="font-semibold text-slate-900">{user.unit || "নেভাল ইউনিট"}</span>
              </div>

              <div className="flex items-center justify-between py-2.5">
                <span className="text-slate-500 flex items-center gap-2">
                  <Mail className="w-4 h-4 text-slate-400" />
                  দাপ্তরিক ইমেইল (Official Email)
                </span>
                <span className="font-mono text-slate-800">{user.email}</span>
              </div>

              <div className="flex items-center justify-between py-2.5">
                <span className="text-slate-500 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-slate-400" />
                  অ্যাক্সেস রোল (Role Level)
                </span>
                <span className="font-bold text-[#0d2847]">{user.role === "ADMIN" ? "HQ অ্যাডমিন" : "অফিসার (Personnel)"}</span>
              </div>
            </CardContent>
          </Card>

          {/* নিরাপত্তা ও ক্রেডেনশিয়াল */}
          <Card className="border-slate-200/80 shadow-xs">
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Key className="w-4 h-4 text-[#0d2847]" />
                নিরাপত্তা ও সেশন তথ্যাবলী
              </CardTitle>
              <CardDescription className="text-xs text-slate-500 mt-0.5">
                এনক্রিপশন ও নিরাপদ অ্যাক্সেস স্থিতি
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-xs text-slate-600 pt-3">
              <p className="leading-relaxed">
                আপনার সেশনটি HMAC-SHA256 এনক্রিপ্টেড সুরক্ষিত JWT কুকি এবং নিরাপদ SameSite পলিসির মাধ্যমে পরিচালিত।
              </p>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-slate-600">
                পাসওয়ার্ড পরিবর্তন, ইউনিট বদলি বা অন্য যেকোনো তথ্যের সংশোধনের জন্য নেভাল হেডকোয়ার্টার্স অ্যাডমিনিস্ট্রেটিভ ডিরেক্টরেটে যোগাযোগ করুন।
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
