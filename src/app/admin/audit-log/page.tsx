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
        title="Administrative &amp; Financial Audit Trail"
        description="Immutable system log tracking all budget adjustments, voucher lifecycles, and user authorization events."
      />

      <AuditLogViewer logs={logs} />
    </div>
  );
}
