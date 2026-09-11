"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowDownLeft,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Plus,
  ReceiptText,
  RotateCcw,
  Search,
  Trash2,
} from "lucide-react";
import { CategoryDot, TransactionForm } from "@/components/transaction-form";
import { ConfirmDialog } from "@/components/overlay";
import { EmptyState, Segmented, Spinner, groupBy, useToast } from "@/components/ui";
import {
  currentMonthKey,
  dayLabel,
  formatIDR,
  formatIDRCompact,
  monthKeyLabel,
  shiftMonthKey,
} from "@/lib/format";
import type { CategoryRow, TxRow, TxType } from "@/lib/types";

type TypeFilter = "all" | TxType;

interface TxResponse {
  rows: TxRow[];
  totals: { income: number; expense: number; count: number };
}

export default function TransaksiPage() {
  const { push } = useToast();
  const [data, setData] = useState<TxResponse | null>(null);
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [loading, setLoading] = useState(true);

  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [month, setMonth] = useState<string>(currentMonthKey());
  const [query, setQuery] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<TxRow | null>(null);
  const [deleting, setDeleting] = useState<TxRow | null>(null);
  const [deletingBusy, setDeletingBusy] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(query), 280);
    return () => clearTimeout(t);
  }, [query]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (typeFilter !== "all") params.set("type", typeFilter);
      if (month !== "all") params.set("month", month);
      if (debouncedQ) params.set("q", debouncedQ);
      const res = await fetch(`/api/transactions?${params.toString()}`, { cache: "no-store" });
      setData(await res.json());
    } catch {
      push("Gagal memuat transaksi", "error");
    } finally {
      setLoading(false);
    }
  }, [typeFilter, month, debouncedQ, push]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    fetch("/api/categories", { cache: "no-store" })
      .then((r) => r.json())
      .then(setCategories)
      .catch(() => {});
  }, []);

  const grouped = useMemo(() => (data ? groupBy(data.rows, (t) => t.date) : []), [data]);
  const net = (data?.totals.income ?? 0) - (data?.totals.expense ?? 0);

  async function confirmDelete() {
    if (!deleting || deletingBusy) return;
    setDeletingBusy(true);
    try {
      const res = await fetch(`/api/transactions/${deleting.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      push("Transaksi dihapus");
      setDeleting(null);
      load();
    } catch {
      push("Gagal menghapus transaksi", "error");
    } finally {
      setDeletingBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-5 pt-7 lg:px-10 lg:pt-10">
      {/* header */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="flex flex-wrap items-end justify-between gap-4"
      >
        <div>
          <h1 className="font-display text-[30px] font-semibold tracking-tight text-ink lg:text-[36px]">
            Transaksi
          </h1>
          <p className="mt-1 text-[13.5px] text-muted">
            Semua catatan pemasukan dan pengeluaran keluarga
          </p>
        </div>
        <button
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
          className="btn btn-gold !px-5 !py-3"
        >
          <Plus size={17} strokeWidth={2.6} />
          Tambah Transaksi
        </button>
      </motion.div>

      {/* summary strip */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.06, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="mt-6 grid grid-cols-3 gap-3"
      >
        <div className="card !rounded-2xl p-4 lg:p-5">
          <div className="flex items-center gap-2 text-[11px] font-bold tracking-wider text-moss-700 uppercase">
            <ArrowDownLeft size={14} strokeWidth={2.6} /> Masuk
          </div>
          <p className="num mt-2 text-[17px] font-semibold text-ink lg:text-[22px]" title={formatIDR(data?.totals.income ?? 0)}>
            {formatIDRCompact(data?.totals.income ?? 0)}
          </p>
        </div>
        <div className="card !rounded-2xl p-4 lg:p-5">
          <div className="flex items-center gap-2 text-[11px] font-bold tracking-wider text-clay-600 uppercase">
            <ArrowUpRight size={14} strokeWidth={2.6} /> Keluar
          </div>
          <p className="num mt-2 text-[17px] font-semibold text-ink lg:text-[22px]" title={formatIDR(data?.totals.expense ?? 0)}>
            {formatIDRCompact(data?.totals.expense ?? 0)}
          </p>
        </div>
        <div className="card !rounded-2xl p-4 lg:p-5">
          <div className="text-[11px] font-bold tracking-wider text-muted uppercase">Selisih</div>
          <p
            className={`num mt-2 text-[17px] font-semibold lg:text-[22px] ${net >= 0 ? "text-moss-700" : "text-clay-600"}`}
            title={formatIDR(net)}
          >
            {net >= 0 ? "+" : "−"}
            {formatIDRCompact(Math.abs(net))}
          </p>
        </div>
      </motion.div>

      {/* filters */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="mt-5 flex flex-wrap items-center gap-3"
      >
        <Segmented<TypeFilter>
          options={[
            { value: "all", label: "Semua" },
            { value: "income", label: "Pemasukan" },
            { value: "expense", label: "Pengeluaran" },
          ]}
          value={typeFilter}
          onChange={setTypeFilter}
        />

        <div className="inline-flex items-center gap-1 rounded-2xl border border-line bg-cream p-1">
          <button
            onClick={() => setMonth((m) => (m === "all" ? currentMonthKey() : shiftMonthKey(m, -1)))}
            className="rounded-xl p-2 text-muted transition-colors hover:bg-paper hover:text-ink"
            aria-label="Bulan sebelumnya"
          >
            <ChevronLeft size={16} strokeWidth={2.4} />
          </button>
          <button
            onClick={() => setMonth("all")}
            className={`min-w-[138px] rounded-xl px-3 py-2 text-[13px] font-bold transition-colors ${
              month === "all" ? "text-ink" : "text-ink hover:bg-paper"
            }`}
            title="Klik untuk melihat semua periode"
          >
            {month === "all" ? "Semua Periode" : monthKeyLabel(month)}
          </button>
          <button
            onClick={() => setMonth((m) => (m === "all" ? currentMonthKey() : shiftMonthKey(m, 1)))}
            className="rounded-xl p-2 text-muted transition-colors hover:bg-paper hover:text-ink"
            aria-label="Bulan berikutnya"
          >
            <ChevronRight size={16} strokeWidth={2.4} />
          </button>
        </div>

        {month !== currentMonthKey() && (
          <button
            onClick={() => setMonth(currentMonthKey())}
            className="inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-[12px] font-bold text-moss-700 transition-colors hover:text-forest-900"
          >
            <RotateCcw size={12} strokeWidth={2.6} /> Bulan ini
          </button>
        )}

        <div className="relative min-w-[200px] flex-1">
          <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari catatan atau kategori…"
            className="input !pl-10"
          />
        </div>
      </motion.div>

      {/* list */}
      <div className="mt-5">
        {loading ? (
          <Spinner />
        ) : !data || data.rows.length === 0 ? (
          <div className="card">
            <EmptyState
              icon={ReceiptText}
              title="Belum ada transaksi"
              hint="Tidak ada transaksi yang cocok dengan filter saat ini. Coba ubah periode atau kata kunci pencarian."
              action={
                <button
                  onClick={() => {
                    setEditing(null);
                    setFormOpen(true);
                  }}
                  className="btn btn-primary !text-[13px]"
                >
                  <Plus size={15} strokeWidth={2.6} /> Catat transaksi pertama
                </button>
              }
            />
          </div>
        ) : (
          <div className="space-y-5">
            {grouped.map(([date, txs], gi) => (
              <motion.section
                key={date}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(gi * 0.04, 0.3), duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              >
                <div className="mb-2 flex items-baseline justify-between px-1">
                  <h3 className="text-[12.5px] font-bold tracking-wide text-muted uppercase">{dayLabel(date)}</h3>
                  <DayTotal txs={txs} />
                </div>
                <ul className="card divide-y divide-line-soft overflow-hidden !rounded-2xl">
                  {txs.map((tx) => (
                    <TxRowItem
                      key={tx.id}
                      tx={tx}
                      onEdit={() => {
                        setEditing(tx);
                        setFormOpen(true);
                      }}
                      onDelete={() => setDeleting(tx)}
                    />
                  ))}
                </ul>
              </motion.section>
            ))}
          </div>
        )}
      </div>

      <TransactionForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSaved={load}
        editing={editing}
        categories={categories}
      />
      <ConfirmDialog
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        onConfirm={confirmDelete}
        loading={deletingBusy}
        title="Hapus transaksi ini?"
        message={`“${deleting?.note ?? deleting?.categoryName ?? "Transaksi"}” senilai ${
          deleting ? formatIDR(deleting.amount) : ""
        } akan dihapus permanen dan tidak dapat dikembalikan.`}
      />
    </div>
  );
}

function DayTotal({ txs }: { txs: TxRow[] }) {
  const net = txs.reduce((acc, t) => acc + (t.type === "income" ? t.amount : -t.amount), 0);
  return (
    <span className={`text-[12px] font-bold ${net >= 0 ? "text-moss-700" : "text-clay-600"}`}>
      {net >= 0 ? "+" : "−"}
      {formatIDRCompact(Math.abs(net))}
    </span>
  );
}

function TxRowItem({ tx, onEdit, onDelete }: { tx: TxRow; onEdit: () => void; onDelete: () => void }) {
  const income = tx.type === "income";
  return (
    <li className="group flex items-center gap-3.5 px-4 py-3.5 transition-colors hover:bg-paper/60 lg:px-5">
      <CategoryDot color={tx.categoryColor} icon={tx.categoryIcon} size={38} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[14px] font-bold text-ink">{tx.note ?? tx.categoryName ?? "Transaksi"}</p>
        <p className="mt-0.5 text-[12px] font-medium text-muted">{tx.categoryName ?? "Tanpa kategori"}</p>
      </div>
      <p className={`num text-[14.5px] font-semibold ${income ? "text-moss-700" : "text-ink"}`}>
        {income ? "+" : "−"}
        {formatIDR(tx.amount)}
      </p>
      <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
        <button
          onClick={onEdit}
          className="rounded-lg p-2 text-muted transition-colors hover:bg-line-soft hover:text-ink"
          aria-label="Ubah"
        >
          <Pencil size={15} strokeWidth={2.2} />
        </button>
        <button
          onClick={onDelete}
          className="rounded-lg p-2 text-muted transition-colors hover:bg-clay-100 hover:text-clay-600"
          aria-label="Hapus"
        >
          <Trash2 size={15} strokeWidth={2.2} />
        </button>
      </div>
    </li>
  );
}
