"use client";

import React, { useState, useMemo } from "react";
import { format } from "date-fns";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Filter,
  History,
  Shield,
  Clock,
  ArrowRight,
  User,
  RotateCcw,
} from "lucide-react";

export interface AuditLogRecord {
  id: string;
  actorName: string;
  actorRole: string;
  action: string;
  entityType: string;
  entityId: string;
  previousValue?: string | null;
  newValue?: string | null;
  ipAddress?: string | null;
  createdAt: Date | string;
}

interface AuditLogViewerProps {
  logs: AuditLogRecord[];
}

export function AuditLogViewer({ logs }: AuditLogViewerProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [actionFilter, setActionFilter] = useState("ALL");

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const matchesSearch =
        log.actorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.entityId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (log.previousValue && log.previousValue.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (log.newValue && log.newValue.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesAction =
        actionFilter === "ALL" || log.action === actionFilter;

      return matchesSearch && matchesAction;
    });
  }, [logs, searchQuery, actionFilter]);

  const formatJSONValue = (valStr?: string | null) => {
    if (!valStr) return null;
    try {
      const parsed = JSON.parse(valStr);
      return (
        <pre className="text-[11px] font-mono text-slate-700 bg-slate-100 p-2 rounded max-h-32 overflow-y-auto whitespace-pre-wrap">
          {JSON.stringify(parsed, null, 2)}
        </pre>
      );
    } catch {
      return <span className="font-mono text-xs">{valStr}</span>;
    }
  };

  const getActionBadge = (action: string) => {
    switch (action) {
      case "ALLOCATION_CHANGED":
        return <Badge variant="warning">Allocation Changed</Badge>;
      case "EXPENSE_CREATED":
        return <Badge variant="info">Expense Created</Badge>;
      case "EXPENSE_UPDATED":
        return <Badge variant="secondary">Expense Updated</Badge>;
      case "EXPENSE_DELETED":
        return <Badge variant="destructive">Expense Deleted</Badge>;
      case "EXPENSE_STATUS_CHANGED":
        return <Badge variant="success">Status Changed</Badge>;
      case "USER_STATUS_CHANGED":
        return <Badge variant="outline">User Status</Badge>;
      case "USER_CREATED":
        return <Badge variant="info">User Enrolled</Badge>;
      default:
        return <Badge variant="outline">{action}</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      {/* Search and Action Filter */}
      <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="w-full sm:w-80">
          <Input
            placeholder="Search audit trail, actor, entity ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            icon={<Search className="w-4 h-4 text-slate-400" />}
          />
        </div>

        <div className="w-full sm:w-auto flex items-center gap-3">
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="w-full sm:w-60 h-10 px-3 py-2 bg-white rounded-lg border border-slate-300 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#0d2847]"
          >
            <option value="ALL">All Audit Actions</option>
            <option value="ALLOCATION_CHANGED">Budget Allocation Changed</option>
            <option value="EXPENSE_CREATED">Expense Created</option>
            <option value="EXPENSE_UPDATED">Expense Updated</option>
            <option value="EXPENSE_DELETED">Expense Deleted</option>
            <option value="EXPENSE_STATUS_CHANGED">Expense Status Changed</option>
            <option value="USER_STATUS_CHANGED">User Account Modified</option>
            <option value="USER_CREATED">Personnel Account Enrolled</option>
          </select>

          {(searchQuery || actionFilter !== "ALL") && (
            <button
              onClick={() => {
                setSearchQuery("");
                setActionFilter("ALL");
              }}
              className="text-xs text-blue-700 hover:underline flex items-center gap-1 cursor-pointer shrink-0"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Audit Log Timeline Entries */}
      <div className="space-y-3">
        {filteredLogs.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 text-slate-500 text-sm">
            No audit log records match the search parameters.
          </div>
        ) : (
          filteredLogs.map((log) => (
            <div
              key={log.id}
              className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-3 transition-all hover:border-slate-300"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-100 text-[#0d2847] flex items-center justify-center text-xs font-bold shrink-0">
                    <Shield className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900">
                        {log.actorName}
                      </span>
                      <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                        {log.actorRole}
                      </span>
                    </div>
                    <span className="text-xs text-slate-500">
                      Target Entity: <strong className="font-mono text-slate-700">{log.entityType} ({log.entityId})</strong>
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 sm:self-center">
                  {getActionBadge(log.action)}
                  <span className="text-xs text-slate-400 font-mono flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {format(new Date(log.createdAt), "dd MMM yyyy, HH:mm")}
                  </span>
                </div>
              </div>

              {/* Diff Values if any */}
              {(log.previousValue || log.newValue) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                  {log.previousValue && (
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold uppercase text-slate-400">
                        Previous Value / State
                      </span>
                      {formatJSONValue(log.previousValue)}
                    </div>
                  )}
                  {log.newValue && (
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold uppercase text-blue-800">
                        New Value / State
                      </span>
                      {formatJSONValue(log.newValue)}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
