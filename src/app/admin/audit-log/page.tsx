import React from "react";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/shared/PageHeader";
import { AuditLogViewer } from "@/components/admin/AuditLogViewer";

export default async function AdminAuditLogPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") redirect("/login");

  const logs = await db.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="প্রশাসনিক ও আর্থিক অডিট ট্রেইল (Audit Log)"
        description="বাজেট সমন্বয়, ভাউচারের পরিবর্তন ও ব্যবহারকারীর কার্যকলাপের অপরিবর্তনীয় সিস্টেম রেকর্ড।"
      />

      <AuditLogViewer logs={logs} />
    </div>
  );
}
