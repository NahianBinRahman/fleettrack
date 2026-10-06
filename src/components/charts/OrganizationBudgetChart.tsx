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
  reservePaisa?: bigint | number;
  height?: number;
}

export function OrganizationBudgetChart({
  totalBudgetPaisa,
  allocatedPaisa,
  reservePaisa,
  height = 260,
}: OrgBudgetChartProps) {
  const totPaisa = typeof totalBudgetPaisa === "bigint" ? totalBudgetPaisa : BigInt(totalBudgetPaisa);
  const allocPaisa = typeof allocatedPaisa === "bigint" ? allocatedPaisa : BigInt(allocatedPaisa);
  const unallocatedPaisa = reservePaisa !== undefined 
    ? (typeof reservePaisa === "bigint" ? reservePaisa : BigInt(reservePaisa))
    : totPaisa - allocPaisa;

  const data = [
    {
      name: "Org Annual Ceiling",
      amountPaisa: totPaisa,
      value: Number(totPaisa) / 100,
      color: "#0b1f3a",
      description: "Approved Annual Budget Ceiling",
    },
    {
      name: "Allocated to Personnel",
      amountPaisa: allocPaisa,
      value: Number(allocPaisa) / 100,
      color: "#1e4e85",
      description: "Allocated across Commissioned Personnel",
    },
    {
      name: "Unallocated Reserve",
      amountPaisa: unallocatedPaisa,
      value: Number(unallocatedPaisa) / 100,
      color: "#d4af37",
      description: "Retained Command Operational Reserve",
    },
  ];

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const p = payload[0].payload;
      return (
        <div className="bg-slate-900 text-white p-3.5 rounded-xl shadow-xl border border-slate-700 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color }} />
            <p className="font-bold text-slate-200">{p.name}</p>
          </div>
          <p className="text-white font-mono font-bold text-base mt-1.5">
            {formatBDT(p.amountPaisa)}
          </p>
          <p className="text-slate-400 text-[11px] mt-0.5">{p.description}</p>
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
          margin={{ top: 20, right: 10, left: -10, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 11, fill: "#64748b", fontWeight: 500 }}
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
          <Bar dataKey="value" radius={[8, 8, 0, 0]} maxBarSize={60}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
