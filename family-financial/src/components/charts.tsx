"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatIDR, formatIDRCompact } from "@/lib/format";
import type { CategorySlice, MonthPoint } from "@/lib/types";

/* ---------- shared tooltip ---------- */

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { name: string; value: number; color?: string; dataKey?: string }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-2xl border border-cream/10 bg-forest-900 px-4 py-3 shadow-[var(--shadow-pop)]">
      {label && (
        <p className="mb-1.5 text-[11px] font-bold tracking-wider text-cream/50 uppercase">{label}</p>
      )}
      <div className="space-y-1">
        {payload.map((p) => (
          <div key={p.dataKey ?? p.name} className="flex items-center gap-2.5">
            <span className="h-2 w-2 rounded-full" style={{ background: p.color ?? "#c9a227" }} />
            <span className="text-[12px] font-medium text-cream/60">{p.name}</span>
            <span className="num ml-auto pl-4 text-[13px] font-semibold text-cream">
              {formatIDRCompact(p.value)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

const AXIS_TICK = { fill: "#7a857e", fontSize: 11.5, fontWeight: 600 };

/* ---------- cashflow bars ---------- */

export function CashflowChart({ data, height = 300 }: { data: MonthPoint[]; height?: number }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} barGap={4} margin={{ top: 8, right: 4, bottom: 0, left: -14 }}>
        <CartesianGrid vertical={false} stroke="#e9e5d8" strokeDasharray="3 5" />
        <XAxis dataKey="label" tickLine={false} axisLine={false} tick={AXIS_TICK} dy={8} />
        <YAxis
          tickLine={false}
          axisLine={false}
          tick={AXIS_TICK}
          tickFormatter={(v: number) => formatIDRCompact(v).replace("Rp ", "")}
        />
        <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(18,122,91,0.05)" }} />
        <Bar dataKey="income" name="Pemasukan" fill="#127a5b" radius={[7, 7, 7, 7]} maxBarSize={22} />
        <Bar dataKey="expense" name="Pengeluaran" fill="#d95d4e" radius={[7, 7, 7, 7]} maxBarSize={22} />
      </BarChart>
    </ResponsiveContainer>
  );
}

/* ---------- expense donut ---------- */

export function ExpenseDonut({
  data,
  size = 190,
  centerLabel,
  centerValue,
}: {
  data: CategorySlice[];
  size?: number;
  centerLabel: string;
  centerValue: string;
}) {
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius={size * 0.34}
            outerRadius={size * 0.46}
            paddingAngle={3}
            cornerRadius={6}
            strokeWidth={0}
            startAngle={90}
            endAngle={-270}
          >
            {data.map((d) => (
              <Cell key={d.name} fill={d.color} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[10.5px] font-bold tracking-[0.12em] text-muted uppercase">{centerLabel}</span>
        <span className="num mt-0.5 text-[19px] font-semibold text-ink">{centerValue}</span>
      </div>
    </div>
  );
}

/* ---------- net savings area ---------- */

export function NetAreaChart({ data, height = 260 }: { data: MonthPoint[]; height?: number }) {
  const chartData = data.map((d) => ({ ...d, net: d.income - d.expense }));
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={chartData} margin={{ top: 8, right: 4, bottom: 0, left: -14 }}>
        <defs>
          <linearGradient id="netFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#127a5b" stopOpacity={0.28} />
            <stop offset="100%" stopColor="#127a5b" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke="#e9e5d8" strokeDasharray="3 5" />
        <XAxis dataKey="label" tickLine={false} axisLine={false} tick={AXIS_TICK} dy={8} />
        <YAxis
          tickLine={false}
          axisLine={false}
          tick={AXIS_TICK}
          tickFormatter={(v: number) => formatIDRCompact(v).replace("Rp ", "")}
        />
        <Tooltip content={<ChartTooltip />} cursor={{ stroke: "#127a5b", strokeOpacity: 0.2 }} />
        <Area
          type="monotone"
          dataKey="net"
          name="Selisih Bersih"
          stroke="#127a5b"
          strokeWidth={2.5}
          fill="url(#netFill)"
          dot={{ r: 3.5, fill: "#127a5b", strokeWidth: 2, stroke: "#faf9f3" }}
          activeDot={{ r: 5, fill: "#0b2e24", strokeWidth: 2, stroke: "#c9a227" }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

/* ---------- single series mini bars (transaksi page) ---------- */

export function MiniBars({
  data,
  height = 120,
}: {
  data: { label: string; value: number }[];
  height?: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
        <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(18,122,91,0.05)" }} />
        <Bar dataKey="value" name="Pengeluaran" fill="#c9a227" radius={[5, 5, 5, 5]} maxBarSize={14} />
        <XAxis dataKey="label" hide />
        <YAxis hide domain={[0, "dataMax"]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export { formatIDR };
