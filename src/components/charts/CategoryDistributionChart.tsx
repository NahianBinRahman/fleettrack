"use client";

import React from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { formatBDT } from "@/lib/money";

interface CategorySpendingData {
  name: string;
  amountPaisa: bigint | number;
  count: number;
}

interface CategoryDistributionChartProps {
  data: CategorySpendingData[];
  height?: number;
}

const CATEGORY_COLORS = [
  "#0d2847", // Naval Blue
  "#10b981", // Emerald
  "#3b82f6", // Blue
  "#f59e0b", // Amber
  "#8b5cf6", // Purple
  "#ec4899", // Pink
  "#06b6d4", // Cyan
  "#64748b", // Slate
  "#d4af37", // Gold
];

export function CategoryDistributionChart({
  data,
  height = 260,
}: CategoryDistributionChartProps) {
  const totalAmountPaisa = data.reduce(
    (acc, cur) => acc + (typeof cur.amountPaisa === "bigint" ? cur.amountPaisa : BigInt(cur.amountPaisa)),
    BigInt(0)
  );

  const chartData = data.map((item, idx) => {
    const p = typeof item.amountPaisa === "bigint" ? item.amountPaisa : BigInt(item.amountPaisa);
    const percentage = totalAmountPaisa > BigInt(0) ? Number((p * BigInt(1000)) / totalAmountPaisa) / 10 : 0;
    return {
      name: item.name,
      value: Number(p) / 100,
      amountPaisa: p,
      percentage,
      color: CATEGORY_COLORS[idx % CATEGORY_COLORS.length],
    };
  });

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const p = payload[0].payload;
      return (
        <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl border border-slate-700 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
            <p className="font-semibold text-slate-200">{p.name}</p>
          </div>
          <p className="text-emerald-400 font-bold text-sm mt-1">
            {formatBDT(p.amountPaisa)}
          </p>
          <p className="text-slate-400 text-[11px]">
            {p.percentage.toFixed(1)}% of category spending
          </p>
        </div>
      );
    }
    return null;
  };

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-xs text-slate-400">
        No expense category records for this period
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col md:flex-row items-center gap-4">
      <div className="w-full md:w-1/2" style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={80}
              paddingAngle={2}
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="w-full md:w-1/2 space-y-1.5 max-h-56 overflow-y-auto pr-1">
        {chartData.slice(0, 6).map((item) => (
          <div
            key={item.name}
            className="flex items-center justify-between text-xs py-1 border-b border-slate-100 last:border-0"
          >
            <div className="flex items-center gap-2 truncate">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: item.color }}
              />
              <span className="font-medium text-slate-700 truncate">{item.name}</span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="font-mono text-slate-600">{formatBDT(item.amountPaisa)}</span>
              <span className="text-[10px] text-slate-400 font-semibold w-9 text-right">
                {item.percentage.toFixed(0)}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
