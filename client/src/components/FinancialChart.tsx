"use client";

import { useState, useEffect } from "react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import type { FinancialAnalysisOutput } from "@/types";

interface FinancialChartProps {
  data: FinancialAnalysisOutput;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border rounded-lg p-3 shadow-xl text-xs">
        <p className="text-muted-foreground mb-1">{label}</p>
        {payload.map((entry: { name: string; value: number; color: string }, i: number) => (
          <p key={i} style={{ color: entry.color }} className="font-medium">
            {entry.name}: ${(entry.value / 1e9).toFixed(2)}B
          </p>
        ))}
      </div>
    );
  }
  return null;
}

export function RevenueChart({ data }: FinancialChartProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const chartData = [...(data.revenueHistory || [])].reverse().map((d) => ({
    period: d.period,
    Revenue: d.revenue,
  }));

  if (!mounted) {
    return (
      <div className="h-[200px] w-full bg-muted/40 border border-border rounded-xl animate-pulse flex items-center justify-center text-xs text-muted-foreground">
        Loading Chart...
      </div>
    );
  }

  if (chartData.length === 0) {
    return (
      <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">
        No revenue history available
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
        <XAxis
          dataKey="period"
          tick={{ fill: "rgba(148,163,184,0.7)", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: "rgba(148,163,184,0.7)", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => `$${(v / 1e9).toFixed(0)}B`}
        />
        <Tooltip content={<CustomTooltip />} />
        <Area
          type="monotone"
          dataKey="Revenue"
          stroke="#6366f1"
          strokeWidth={2}
          fill="url(#revenueGradient)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function EarningsChart({ data }: FinancialChartProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const chartData = [...(data.earningsHistory || [])].reverse().map((d) => ({
    period: d.period,
    Earnings: d.earnings,
  }));

  if (!mounted) {
    return (
      <div className="h-[200px] w-full bg-muted/40 border border-border rounded-xl animate-pulse flex items-center justify-center text-xs text-muted-foreground">
        Loading Chart...
      </div>
    );
  }

  if (chartData.length === 0) {
    return (
      <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">
        No earnings history available
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
        <XAxis
          dataKey="period"
          tick={{ fill: "rgba(148,163,184,0.7)", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: "rgba(148,163,184,0.7)", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => `$${(v / 1e9).toFixed(0)}B`}
        />
        <Tooltip content={<CustomTooltip />} />
        <ReferenceLine y={0} stroke="rgba(255,255,255,0.15)" />
        <Bar
          dataKey="Earnings"
          fill="#10b981"
          radius={[4, 4, 0, 0]}
          label={false}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}

interface MetricsChartProps {
  data: FinancialAnalysisOutput;
}

export function MetricsRadar({ data }: MetricsChartProps) {
  const metrics = [
    {
      label: "Revenue Growth",
      value: data.revenueGrowthYoY,
      format: (v: number) => `${v.toFixed(1)}%`,
    },
    {
      label: "Gross Margin",
      value: data.grossMargin,
      format: (v: number) => `${v.toFixed(1)}%`,
    },
    {
      label: "Operating Margin",
      value: data.operatingMargin,
      format: (v: number) => `${v.toFixed(1)}%`,
    },
    {
      label: "Net Margin",
      value: data.netMargin,
      format: (v: number) => `${v.toFixed(1)}%`,
    },
    { label: "ROE", value: data.roe, format: (v: number) => `${v.toFixed(1)}%` },
  ].filter((m) => m.value !== null);

  return (
    <div className="space-y-3">
      {metrics.map((metric) => (
        <div key={metric.label} className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">{metric.label}</span>
            <span className="text-foreground font-medium">
              {metric.value !== null ? metric.format(metric.value) : "N/A"}
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-1000"
              style={{
                width: `${Math.min(Math.max((metric.value ?? 0) + 50, 0), 100)}%`,
                background:
                  (metric.value ?? 0) > 0
                    ? "linear-gradient(90deg, #059669, #10b981)"
                    : "linear-gradient(90deg, #dc2626, #ef4444)",
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
