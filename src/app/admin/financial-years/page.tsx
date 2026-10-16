import React from "react";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/shared/PageHeader";
import { FinancialYearsClient } from "./FinancialYearsClient";

export default async function FinancialYearsPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") redirect("/login");

  const years = await db.financialYear.findMany({
    orderBy: { year: "desc" },
    include: {
      _count: {
        select: {
          allocations: true,
          expenses: true,
        },
      },
    },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="অর্থবছর ও বাজেট সাইকেল প্রশাসন (Financial Years)"
        description="বার্ষিক সামগ্রিক বাজেট সিলিং, আইনগত অডিট সময়কাল এবং সংরক্ষিত আর্থিক সাইকেল পরিচালনা করুন।"
      />

      <FinancialYearsClient years={years} />
    </div>
  );
}
