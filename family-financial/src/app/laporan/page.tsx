"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowDownLeft,
  ArrowUpRight,
  CalendarRange,
  ChevronLeft,
  ChevronRight,
  PiggyBank,
} from "lucide-react";
import { CashflowChart, NetAreaChart } from "@/components/charts";
import { CountUp, IconBadge, Spinner, useToast } from "@/components/ui";
import { iconFor } from "@/lib/icons";
import { MONTHS_ID, formatIDR, formatIDRCompact } from "@/lib/format";
import type { ReportResponse } from "@/lib/types";

const reveal = (i: number) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { delay: 0.06 * i, duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
});

export default function LaporanPage() {
  const { push } = useToast();
  const [year, setYear] = useState(new Date().getFullYear());
  const [report, setReport] = useState<ReportResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/reports?year=${year}`, { cache: "no-store" });
      setReport(await res.json());
    } catch {
      push("Gagal memuat laporan", "error");
    } finally {
      setLoading(false);
    }
  }, [year, push]);

  useEffect(() => {
    load();
  }, [load]);

  const insights = useMemo(() => {
    if (!report) return null;
    const active = report.months.filter((m) => m.income > 0 || m.expense > 0);
    if (active.length === 0) return null;
    const netOf = (m: (typeof active)[number]) => m.income - m.expense;
    const best = [...active].sort((a, b) => netOf(b) - netOf(a))[0];
    const worst = [...active].sort((a, b) => netOf(a) - netOf(b))[0];
    const avgExpense = report.totalExpense / active.length;
    return { best, worst, avgExpense };
  }, [report]);

  const savingsRate = report && report.totalIncome > 0 ? (report.net / report.totalIncome) * 100 : 0;
  const topCategories = report?.expenseByCategory.slice(0, 6) ?? [];
  const maxCat = topCategories[0]?.value ?? 1;

  return (
    <div className="mx-auto max-w-7xl px-5 pt-7 lg:px-10 lg:pt-10">
      {/* header */}
      <motion.div {...reveal(0)} className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-[30px] font-semibold tracking-tight text-ink lg:text-[36px]">Laporan</h1>
          <p className="mt-1 text-[13.5px] text-muted">Analisis arus kas keluarga sepanjang tahun</p>
        </div>
        <div className="inline-flex items-center gap-1 rounded-2xl border border-line bg-cream p-1">
          <button
            onClick={() => setYear((y) => y - 1)}
            className="rounded-xl p-2 text-muted transition-colors hover:bg-paper hover:text-ink"
            aria-label="Tahun sebelumnya"
          >
            <ChevronLeft size={16} strokeWidth={2.4} />
          </button>
          <span className="num min-w-[76px] px-2 py-2 text-center text-[15px] font-bold text-ink">{year}</span>
          <button
            onClick={() => setYear((y) => y + 1)}
            disabled={year >= new Date().getFullYear()}
            className="rounded-xl p-2 text-muted transition-colors hover:bg-paper hover:text-ink disabled:opacity-30"
            aria-label="Tahun berikutnya"
          >
            <ChevronRight size={16} strokeWidth={2.4} />
          </button>
        </div>
      </motion.div>

      {loading || !report ? (
        <div className="mt-8">
          <Spinner label="Menyusun laporan…" />
        </div>
      ) : (
        <>
          {/* KPI row */}
          <div className="mt-6 grid grid-cols-2 gap-3 xl:grid-cols-4">
            <motion.div {...reveal(1)} className="card !rounded-2xl p-5">
              <div className="flex items-center gap-2 text-[11px] font-bold tracking-wider text-moss-700 uppercase">
                <ArrowDownLeft size={14} strokeWidth={2.6} /> Pemasukan {year}
              </div>
              <p className="num mt-2.5 text-[20px] font-semibold text-ink lg:text-[24px]" title={formatIDR(report.totalIncome)}>
                <CountUp value={report.totalIncome} format={formatIDRCompact} />
              </p>
            </motion.div>
            <motion.div {...reveal(2)} className="card !rounded-2xl p-5">
              <div className="flex items-center gap-2 text-[11px] font-bold tracking-wider text-clay-600 uppercase">
                <ArrowUpRight size={14} strokeWidth={2.6} /> Pengeluaran {year}
              </div>
              <p className="num mt-2.5 text-[20px] font-semibold text-ink lg:text-[24px]" title={formatIDR(report.totalExpense)}>
                <CountUp value={report.totalExpense} format={formatIDRCompact} />
              </p>
            </motion.div>
            <motion.div {...reveal(3)} className="card !rounded-2xl p-5">
              <div className="text-[11px] font-bold tracking-wider text-muted uppercase">Selisih Bersih</div>
              <p
                className={`num mt-2.5 text-[20px] font-semibold lg:text-[24px] ${report.net >= 0 ? "text-moss-700" : "text-clay-600"}`}
                title={formatIDR(report.net)}
              >
                {report.net >= 0 ? "+" : "−"}
                <CountUp value={Math.abs(report.net)} format={formatIDRCompact} />
              </p>
            </motion.div>
            <motion.div {...reveal(4)} className="relative overflow-hidden rounded-2xl bg-forest-900 p-5 text-cream">
              <div className="pointer-events-none absolute -right-6 -top-8 h-24 w-24 rounded-full bg-gold-500/25 blur-2xl" />
              <div className="relative">
                <div className="flex items-center gap-2 text-[11px] font-bold tracking-wider text-cream/55 uppercase">
                  <PiggyBank size={14} className="text-gold-500" /> Rasio Menabung
                </div>
                <p className="num mt-2.5 text-[20px] font-semibold lg:text-[24px]">{savingsRate.toFixed(0)}%</p>
              </div>
            </motion.div>
          </div>

          {/* charts */}
          <div className="mt-4 grid gap-4 xl:grid-cols-2">
            <motion.section {...reveal(5)} className="card p-6">
              <h2 className="font-display text-[19px] font-semibold text-ink">Pemasukan vs Pengeluaran</h2>
              <p className="mt-0.5 text-[12.5px] text-muted">Per bulan sepanjang {year}</p>
              <div className="mt-4">
                <CashflowChart data={report.months} height={280} />
              </div>
            </motion.section>
            <motion.section {...reveal(6)} className="card p-6">
              <h2 className="font-display text-[19px] font-semibold text-ink">Tren Selisih Bersih</h2>
              <p className="mt-0.5 text-[12.5px] text-muted">Surplus atau defisit tiap bulan</p>
              <div className="mt-4">
                <NetAreaChart data={report.months} height={280} />
              </div>
            </motion.section>
          </div>

          {/* categories + table */}
          <div className="mt-4 grid gap-4 xl:grid-cols-5">
            <motion.section {...reveal(7)} className="card p-6 xl:col-span-2">
              <h2 className="font-display text-[19px] font-semibold text-ink">Kategori Teratas</h2>
              <p className="mt-0.5 text-[12.5px] text-muted">Pengeluaran terbesar di {year}</p>
              {topCategories.length === 0 ? (
                <p className="py-10 text-center text-sm text-muted">Belum ada data pengeluaran</p>
              ) : (
                <ul className="mt-5 space-y-4">
                  {topCategories.map((c, i) => {
                    const I = iconFor(c.icon);
                    const shareAll = report.totalExpense ? (c.value / report.totalExpense) * 100 : 0;
                    return (
                      <li key={c.name}>
                        <div className="flex items-center gap-3">
                          <span className="num w-5 text-[13px] font-semibold text-muted">{i + 1}</span>
                          <IconBadge icon={I} color={c.color} bg={`${c.color}16`} size={32} />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-[13.5px] font-bold text-ink">{c.name}</p>
                            <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-paper">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${(c.value / maxCat) * 100}%` }}
                                transition={{ delay: 0.3 + i * 0.07, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                                className="h-full rounded-full"
                                style={{ background: c.color }}
                              />
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="num text-[13.5px] font-semibold text-ink">{formatIDRCompact(c.value)}</p>
                            <p className="text-[11px] font-semibold text-muted">{shareAll.toFixed(0)}%</p>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </motion.section>

            <motion.section {...reveal(8)} className="card overflow-hidden p-0 xl:col-span-3">
              <div className="flex items-center gap-2.5 p-6 pb-4">
                <IconBadge icon={CalendarRange} color="#0e6b4e" bg="#dff0e8" size={34} />
                <h2 className="font-display text-[19px] font-semibold text-ink">Rincian Bulanan</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[520px] text-[13px]">
                  <thead>
                    <tr className="border-y border-line bg-paper/60 text-left text-[11px] font-bold tracking-wider text-muted uppercase">
                      <th className="py-3 pl-6 pr-3">Bulan</th>
                      <th className="px-3 py-3 text-right">Masuk</th>
                      <th className="px-3 py-3 text-right">Keluar</th>
                      <th className="px-3 py-3 text-right">Selisih</th>
                      <th className="py-3 pl-3 pr-6 text-right">Rasio</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line-soft">
                    {report.months.map((m, i) => {
                      const net = m.income - m.expense;
                      const empty = m.income === 0 && m.expense === 0;
                      return (
                        <tr key={m.key} className="transition-colors hover:bg-paper/60">
                          <td className="py-3 pl-6 pr-3 font-bold text-ink">
                            {MONTHS_ID[i]}
                            {empty && <span className="ml-2 text-[10.5px] font-semibold text-muted">—</span>}
                          </td>
                          <td className="num px-3 py-3 text-right font-medium text-ink-soft">
                            {empty ? "–" : formatIDRCompact(m.income)}
                          </td>
                          <td className="num px-3 py-3 text-right font-medium text-ink-soft">
                            {empty ? "–" : formatIDRCompact(m.expense)}
                          </td>
                          <td className={`num px-3 py-3 text-right font-semibold ${empty ? "text-muted" : net >= 0 ? "text-moss-700" : "text-clay-600"}`}>
                            {empty ? "–" : `${net >= 0 ? "+" : "−"}${formatIDRCompact(Math.abs(net))}`}
                          </td>
                          <td className="num py-3 pl-3 pr-6 text-right font-semibold text-ink-soft">
                            {empty || !m.income ? "–" : `${Math.round(((m.income - m.expense) / m.income) * 100)}%`}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </motion.section>
          </div>

          {/* insights */}
          {insights && (
            <motion.div {...reveal(9)} className="mt-4 grid gap-4 md:grid-cols-3">
              <div className="card !rounded-2xl p-5">
                <p className="text-[11px] font-bold tracking-wider text-muted uppercase">Bulan Paling Hemat</p>
                <p className="font-display mt-2 text-[20px] font-semibold text-ink">
                  {MONTHS_ID[Number(insights.best.key.slice(5, 7)) - 1]}
                </p>
                <p className="mt-1 text-[12.5px] font-semibold text-moss-700">
                  Surplus {formatIDR(insights.best.income - insights.best.expense)}
                </p>
              </div>
              <div className="card !rounded-2xl p-5">
                <p className="text-[11px] font-bold tracking-wider text-muted uppercase">Bulan Terboros</p>
                <p className="font-display mt-2 text-[20px] font-semibold text-ink">
                  {MONTHS_ID[Number(insights.worst.key.slice(5, 7)) - 1]}
                </p>
                <p className="mt-1 text-[12.5px] font-semibold text-clay-600">
                  Pengeluaran {formatIDR(insights.worst.expense)}
                </p>
              </div>
              <div className="card !rounded-2xl p-5">
                <p className="text-[11px] font-bold tracking-wider text-muted uppercase">Rata-rata Pengeluaran</p>
                <p className="font-display mt-2 text-[20px] font-semibold text-ink">{formatIDRCompact(insights.avgExpense)}</p>
                <p className="mt-1 text-[12.5px] font-medium text-muted">per bulan sepanjang {year}</p>
              </div>
            </motion.div>
          )}
        </>
      )}
    </div>
  );
}
