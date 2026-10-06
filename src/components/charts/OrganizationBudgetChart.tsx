"use client";

import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { formatBDT } from "@/lib/money";

interface OrgBudgetChartProps {
  totalBudgetPaisa: bigint | number;
  allocatedPaisa: bigint | number;
  spentPaisa: bigint | number;
  pendingPaisa: bigint | number;
  remainingPaisa: bigint | number;
  height?: number;
}

export function OrganizationBudgetChart({
  totalBudgetPaisa,
  allocatedPaisa,
  spentPaisa,
  pendingPaisa,
  remainingPaisa,
  height = 260,
}: OrgBudgetChartProps) {
  const data = [
    {
      name: "Org Total",
      amountPaisa: totalBudgetPaisa,
      value: Number(totalBudgetPaisa) / 100,
      color: "#0b1f3a",
    },
    {
      name: "Allocated",
      amountPaisa: allocatedPaisa,
      value: Number(allocatedPaisa) / 100,
      color: "#1e4e85",
    },
    {
      name: "Spent",
      amountPaisa: spentPaisa,
      value: Number(spentPaisa) / 100,
      color: "#10b981",
    },
    {
      name: "Pending",
      amountPaisa: pendingPaisa,
      value: Number(pendingPaisa) / 100,
      color: "#f59e0b",
    },
    {
      name: "Remaining",
      amountPaisa: remainingPaisa,
      value: Number(remainingPaisa) / 100,
      color: "#64748b",
    },
  ];

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const p = payload[0].payload;
      return (
        <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl border border-slate-700 text-xs">
          <p className="font-semibold text-slate-300">{p.name}</p>
          <p className="text-white font-bold text-sm mt-1">{formatBDT(p.amountPaisa)}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 15, right: 10, left: -15, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 11, fill: "#64748b" }}
            axisLine={{ stroke: "#cbd5e1" }}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "#64748b" }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(val) => {
              if (val >= 10000000) return `৳${(val / 10000000).toFixed(1)}Cr`;
              if (val >= 100000) return `৳${(val / 100000).toFixed(0)}L`;
              return `৳${val}`;
            }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="value" radius={[6, 6, 0, 0]}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
