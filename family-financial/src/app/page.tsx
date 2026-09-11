"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowDownLeft,
  ArrowRight,
  ArrowUpRight,
  Gem,
  Plus,
  Scale,
} from "lucide-react";
import { CashflowChart, ExpenseDonut } from "@/components/charts";
import { TransactionForm, CategoryDot } from "@/components/transaction-form";
import { CountUp, DeltaChip, IconBadge, useToast } from "@/components/ui";
import { assetMeta } from "@/lib/icons";
import {
  formatIDR,
  formatIDRCompact,
  formatDateID,
  formatDateLongID,
  greetingID,
  monthKeyLabel,
  todayISO,
} from "@/lib/format";
import type { CategoryRow, StatsResponse, TxRow } from "@/lib/types";

const reveal = (i: number) => ({
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
  transition: { delay: 0.06 * i, duration: 0.55, ease: [0.22, 1, 0.36, 1] as const },
});

function pctDelta(cur: number, prev: number): number | null {
  if (!prev) return null;
  return ((cur - prev) / prev) * 100;
}

export default function DashboardPage() {
  const { push } = useToast();
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);

  const load = useCallback(async () => {
    try {
      const [s, c] = await Promise.all([
        fetch("/api/stats", { cache: "no-store" }).then((r) => r.json()),
        fetch("/api/categories", { cache: "no-store" }).then((r) => r.json()),
      ]);
      setStats(s);
      setCategories(c);
    } catch {
      push("Gagal memuat data", "error");
    } finally {
      setLoading(false);
    }
  }, [push]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading || !stats) {
    return (
      <div className="mx-auto max-w-7xl px-5 pt-8 lg:px-10 lg:pt-12">
        <div className="skeleton h-10 w-64" />
        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="skeleton h-36" />
          ))}
        </div>
        <div className="mt-4 grid gap-4 xl:grid-cols-3">
          <div className="skeleton h-80 xl:col-span-2" />
          <div className="skeleton h-80" />
        </div>
      </div>
    );
  }

  const monthNet = stats.monthIncome - stats.monthExpense;
  const expenseTotal = stats.expenseByCategory.reduce((a, b) => a + b.value, 0);

  return (
    <div className="mx-auto max-w-7xl px-5 pt-7 lg:px-10 lg:pt-10">
      {/* ============ HEADER ============ */}
      <motion.header {...reveal(0)} className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[13px] font-semibold tracking-wide text-muted">
            {formatDateLongID(todayISO())}
          </p>
          <h1 className="font-display mt-1 text-[30px] leading-tight font-semibold tracking-tight text-ink lg:text-[36px]">
            {greetingID()}, Keluarga Wijaya
          </h1>
        </div>
        <button onClick={() => setFormOpen(true)} className="btn btn-gold !px-5 !py-3">
          <Plus size={17} strokeWidth={2.6} />
          Tambah Transaksi
        </button>
      </motion.header>

      {/* ============ KPI ROW ============ */}
      <div className="mt-7 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {/* Net worth — dark hero card */}
        <motion.div
          {...reveal(1)}
          className="relative overflow-hidden rounded-[22px] bg-forest-900 p-6 text-cream shadow-[var(--shadow-card)]"
        >
          <div className="pointer-events-none absolute -right-10 -top-14 h-44 w-44 rounded-full bg-gold-500/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-12 -left-8 h-36 w-36 rounded-full bg-moss-500/25 blur-3xl" />
          <div className="relative">
            <div className="flex items-center gap-2.5">
              <IconBadge icon={Scale} color="#c9a227" bg="rgba(201,162,39,0.16)" size={34} />
              <p className="text-[12px] font-bold tracking-[0.1em] text-cream/55 uppercase">
                Kekayaan Bersih
              </p>
            </div>
            <p className="num mt-4 text-[30px] font-semibold tracking-tight" title={formatIDR(stats.netWorth)}>
              <CountUp value={stats.netWorth} format={formatIDRCompact} />
            </p>
            <p className="mt-2 text-[12.5px] leading-relaxed text-cream/50">
              {stats.assetCount} aset tercatat + saldo kas{" "}
              <span className="font-semibold text-gold-500">{formatIDRCompact(stats.balance)}</span>
            </p>
          </div>
        </motion.div>

        <KpiCard
          i={2}
          icon={<ArrowDownLeft size={16} strokeWidth={2.6} />}
          iconClass="bg-moss-100 text-moss-700"
          label={`Pemasukan · ${monthKeyLabel(stats.monthKey)}`}
          value={stats.monthIncome}
          delta={pctDelta(stats.monthIncome, stats.prevMonthIncome)}
          deltaNote="vs bulan lalu"
        />
        <KpiCard
          i={3}
          icon={<ArrowUpRight size={16} strokeWidth={2.6} />}
          iconClass="bg-clay-100 text-clay-600"
          label={`Pengeluaran · ${monthKeyLabel(stats.monthKey)}`}
          value={stats.monthExpense}
          delta={pctDelta(stats.monthExpense, stats.prevMonthExpense)}
          deltaNote="vs bulan lalu"
          invertDelta
        />
        <motion.div {...reveal(4)} className="card p-6">
          <div className="flex items-center gap-2.5">
            <IconBadge icon={Gem} color="#7a5c12" bg="#f4eedc" size={34} />
            <p className="text-[12px] font-bold tracking-[0.1em] text-muted uppercase">Nilai Aset</p>
          </div>
          <p className="num mt-4 text-[28px] font-semibold tracking-tight text-ink" title={formatIDR(stats.totalAssets)}>
            <CountUp value={stats.totalAssets} format={formatIDRCompact} />
          </p>
          <Link
            href="/aset"
            className="mt-2 inline-flex items-center gap-1.5 text-[12.5px] font-bold text-moss-700 transition-colors hover:text-forest-900"
          >
            Kelola aset <ArrowRight size={13} strokeWidth={2.6} />
          </Link>
        </motion.div>
      </div>

      {/* ============ CHARTS ROW ============ */}
      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <motion.section {...reveal(5)} className="card p-6 xl:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-[19px] font-semibold text-ink">Arus Kas</h2>
              <p className="mt-0.5 text-[12.5px] text-muted">8 bulan terakhir</p>
            </div>
            <div className="flex items-center gap-4 text-[12px] font-semibold text-ink-soft">
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-moss-600" /> Pemasukan
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-clay-500" /> Pengeluaran
              </span>
            </div>
          </div>
          <div className="mt-4">
            <CashflowChart data={stats.cashflow} />
          </div>
        </motion.section>

        {/* Expense donut */}
        <motion.section {...reveal(6)} className="card flex flex-col p-6">
          <h2 className="font-display text-[19px] font-semibold text-ink">Pengeluaran</h2>
          <p className="mt-0.5 text-[12.5px] text-muted">{monthKeyLabel(stats.monthKey)} · per kategori</p>
          {stats.expenseByCategory.length === 0 ? (
            <div className="flex flex-1 items-center justify-center py-10 text-sm text-muted">
              Belum ada pengeluaran bulan ini
            </div>
          ) : (
            <>
              <div className="mt-3 flex justify-center">
                <ExpenseDonut
                  data={stats.expenseByCategory.slice(0, 6)}
                  centerLabel="Total"
                  centerValue={formatIDRCompact(expenseTotal)}
                />
              </div>
              <ul className="mt-4 space-y-2.5">
                {stats.expenseByCategory.slice(0, 4).map((c) => (
                  <li key={c.name} className="flex items-center gap-2.5 text-[13px]">
                    <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: c.color }} />
                    <span className="truncate font-medium text-ink-soft">{c.name}</span>
                    <span className="ml-auto pl-2 font-bold text-ink">
                      {expenseTotal ? Math.round((c.value / expenseTotal) * 100) : 0}%
                    </span>
                  </li>
                ))}
              </ul>
              <Link
                href="/laporan"
                className="mt-4 inline-flex items-center gap-1.5 text-[12.5px] font-bold text-moss-700 transition-colors hover:text-forest-900"
              >
                Lihat laporan lengkap <ArrowRight size={13} strokeWidth={2.6} />
              </Link>
            </>
          )}
        </motion.section>
      </div>

      {/* ============ BOTTOM ROW ============ */}
      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        {/* Recent transactions */}
        <motion.section {...reveal(7)} className="card p-6 xl:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-[19px] font-semibold text-ink">Transaksi Terbaru</h2>
              <p className="mt-0.5 text-[12.5px] text-muted">{stats.txCount} transaksi tercatat</p>
            </div>
            <Link href="/transaksi" className="btn btn-ghost !px-4 !py-2 !text-[13px]">
              Semua <ArrowRight size={14} strokeWidth={2.5} />
            </Link>
          </div>
          <ul className="mt-3 divide-y divide-line-soft">
            {stats.recent.map((tx) => (
              <TxListItem key={tx.id} tx={tx} />
            ))}
          </ul>
        </motion.section>

        {/* Asset overview */}
        <motion.section {...reveal(8)} className="card flex flex-col p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-[19px] font-semibold text-ink">Portofolio Aset</h2>
            <Link
              href="/aset"
              className="inline-flex items-center gap-1 text-[12.5px] font-bold text-moss-700 hover:text-forest-900"
            >
              Detail <ArrowRight size={13} strokeWidth={2.6} />
            </Link>
          </div>
          <p className="num mt-3 text-[24px] font-semibold text-ink">
            <CountUp value={stats.totalAssets} format={formatIDRCompact} />
          </p>

          {/* Allocation bar */}
          <div className="mt-3 flex h-2.5 w-full overflow-hidden rounded-full bg-paper">
            {stats.assetByType.map((t) => (
              <div
                key={t.type}
                style={{
                  width: `${stats.totalAssets ? (t.value / stats.totalAssets) * 100 : 0}%`,
                  background: assetMeta(t.type).color,
                }}
                title={`${assetMeta(t.type).label} — ${formatIDR(t.value)}`}
              />
            ))}
          </div>
          <div className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1.5">
            {stats.assetByType.slice(0, 4).map((t) => (
              <span key={t.type} className="flex items-center gap-1.5 text-[11.5px] font-semibold text-ink-soft">
                <span className="h-2 w-2 rounded-full" style={{ background: assetMeta(t.type).color }} />
                {assetMeta(t.type).label}
              </span>
            ))}
          </div>

          <ul className="mt-5 flex-1 space-y-3">
            {stats.assetsTop.map((a) => {
              const meta = assetMeta(a.type);
              return (
                <li key={a.id} className="flex items-center gap-3">
                  <IconBadge icon={meta.icon} color={meta.color} bg={meta.bg} size={36} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13.5px] font-bold text-ink">{a.name}</p>
                    <p className="text-[11.5px] font-medium text-muted">{meta.label}</p>
                  </div>
                  <p className="num text-[13.5px] font-semibold text-ink">{formatIDRCompact(a.value)}</p>
                </li>
              );
            })}
          </ul>
        </motion.section>
      </div>

      <TransactionForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSaved={load}
        editing={null}
        categories={categories}
      />
    </div>
  );
}

/* ---------- sub components ---------- */

function KpiCard({
  i,
  icon,
  iconClass,
  label,
  value,
  delta,
  deltaNote,
  invertDelta,
}: {
  i: number;
  icon: React.ReactNode;
  iconClass: string;
  label: string;
  value: number;
  delta: number | null;
  deltaNote: string;
  invertDelta?: boolean;
}) {
  return (
    <motion.div {...reveal(i)} className="card p-6">
      <div className="flex items-center gap-2.5">
        <div className={`flex h-[34px] w-[34px] items-center justify-center rounded-[12px] ${iconClass}`}>
          {icon}
        </div>
        <p className="text-[12px] font-bold tracking-[0.1em] text-muted uppercase">{label}</p>
      </div>
      <p className="num mt-4 text-[28px] font-semibold tracking-tight text-ink" title={formatIDR(value)}>
        <CountUp value={value} format={formatIDRCompact} />
      </p>
      <div className="mt-2 flex items-center gap-2">
        <DeltaChip pct={delta} invert={invertDelta} />
        <span className="text-[11.5px] font-medium text-muted">{deltaNote}</span>
      </div>
    </motion.div>
  );
}

function TxListItem({ tx }: { tx: TxRow }) {
  const income = tx.type === "income";
  return (
    <li className="flex items-center gap-3.5 py-3.5">
      <CategoryDot color={tx.categoryColor} icon={tx.categoryIcon} size={38} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[14px] font-bold text-ink">{tx.note ?? tx.categoryName ?? "Transaksi"}</p>
        <p className="mt-0.5 text-[12px] font-medium text-muted">
          {tx.categoryName ?? "Tanpa kategori"} · {formatDateID(tx.date)}
        </p>
      </div>
      <p
        className={`num text-[14.5px] font-semibold ${income ? "text-moss-700" : "text-ink"}`}
      >
        {income ? "+" : "−"}
        {formatIDRCompact(tx.amount)}
      </p>
    </li>
  );
}
