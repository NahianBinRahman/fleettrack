"use client";

import React from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { formatBDT } from "@/lib/money";

interface MonthlySpendingData {
  month: string;
  amountPaisa: bigint | number;
  count: number;
}

interface MonthlySpendingChartProps {
  data: MonthlySpendingData[];
  height?: number;
}

export function MonthlySpendingChart({
  data,
  height = 260,
}: MonthlySpendingChartProps) {
  const chartData = data.map((d) => ({
    month: d.month,
    amount: Number(d.amountPaisa) / 100,
    amountPaisa: d.amountPaisa,
    count: d.count,
  }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const p = payload[0].payload;
      return (
        <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl border border-slate-700 text-xs">
          <p className="font-semibold text-slate-300">{label}</p>
          <p className="text-emerald-400 font-bold text-sm mt-1">
            {formatBDT(p.amountPaisa)}
          </p>
          <p className="text-slate-400 text-[11px] mt-0.5">
            {p.count} expenditure {p.count === 1 ? "voucher" : "vouchers"}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={chartData}
          margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
        >
          <defs>
            <linearGradient id="spendGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#0d2847" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#0d2847" stopOpacity={0.0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
          <XAxis
            dataKey="month"
            tick={{ fontSize: 11, fill: "#64748b" }}
            axisLine={{ stroke: "#cbd5e1" }}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "#64748b" }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(val) => {
              if (val >= 100000) return `৳${(val / 100000).toFixed(0)}L`;
              if (val >= 1000) return `৳${(val / 1000).toFixed(0)}k`;
              return `৳${val}`;
            }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="amount"
            stroke="#0d2847"
            strokeWidth={2.5}
            fillOpacity={1}
            fill="url(#spendGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
