"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { Sheet } from "@/components/overlay";
import { IconBadge, useToast } from "@/components/ui";
import { iconFor } from "@/lib/icons";
import { formatIDR, todayISO } from "@/lib/format";
import type { CategoryRow, TxRow, TxType } from "@/lib/types";

function digitsOnly(v: string) {
  return v.replace(/[^\d]/g, "").slice(0, 13);
}
function groupDigits(v: string) {
  if (!v) return "";
  return Number(v).toLocaleString("id-ID");
}

export function TransactionForm({
  open,
  onClose,
  onSaved,
  editing,
  categories,
  defaultType = "expense",
}: {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  editing: TxRow | null;
  categories: CategoryRow[];
  defaultType?: TxType;
}) {
  const { push } = useToast();
  const [type, setType] = useState<TxType>(defaultType);
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [date, setDate] = useState(todayISO());
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  const filtered = useMemo(() => categories.filter((c) => c.type === type), [categories, type]);

  useEffect(() => {
    if (!open) return;
    if (editing) {
      setType(editing.type);
      setAmount(String(Math.round(editing.amount)));
      setCategoryId(editing.categoryId);
      setDate(editing.date.slice(0, 10));
      setNote(editing.note ?? "");
    } else {
      setType(defaultType);
      setAmount("");
      setCategoryId(null);
      setDate(todayISO());
      setNote("");
    }
  }, [open, editing, defaultType]);

  // Reset category if it doesn't match the selected type
  useEffect(() => {
    if (categoryId && !filtered.some((c) => c.id === categoryId)) setCategoryId(null);
  }, [filtered, categoryId]);

  const valid = amount !== "" && Number(amount) > 0 && categoryId !== null && date !== "";

  async function submit() {
    if (!valid || loading) return;
    setLoading(true);
    try {
      const res = await fetch(
        editing ? `/api/transactions/${editing.id}` : "/api/transactions",
        {
          method: editing ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type, amount: Number(amount), categoryId, date, note: note.trim() || null }),
        },
      );
      if (!res.ok) throw new Error();
      push(editing ? "Transaksi berhasil diperbarui" : `Transaksi ${formatIDR(Number(amount))} tercatat`);
      onSaved();
      onClose();
    } catch {
      push("Gagal menyimpan transaksi", "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={editing ? "Ubah Transaksi" : "Tambah Transaksi"}
      subtitle={editing ? "Perbarui detail catatan keuangan" : "Catat pemasukan atau pengeluaran baru"}
    >
      {/* Type selector */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => setType("expense")}
          className={`flex items-center justify-center gap-2 rounded-2xl border-2 px-4 py-3.5 text-sm font-bold transition-all ${
            type === "expense"
              ? "border-clay-500 bg-clay-100 text-clay-600"
              : "border-line bg-paper text-muted hover:border-muted/50"
          }`}
        >
          <ArrowUpRight size={17} strokeWidth={2.5} />
          Pengeluaran
        </button>
        <button
          onClick={() => setType("income")}
          className={`flex items-center justify-center gap-2 rounded-2xl border-2 px-4 py-3.5 text-sm font-bold transition-all ${
            type === "income"
              ? "border-moss-600 bg-moss-100 text-moss-700"
              : "border-line bg-paper text-muted hover:border-muted/50"
          }`}
        >
          <ArrowDownLeft size={17} strokeWidth={2.5} />
          Pemasukan
        </button>
      </div>

      {/* Amount */}
      <div className="mt-6">
        <label className="label">Jumlah</label>
        <div className="relative">
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 font-display text-lg font-semibold text-muted">
            Rp
          </span>
          <input
            inputMode="numeric"
            value={groupDigits(amount)}
            onChange={(e) => setAmount(digitsOnly(e.target.value))}
            placeholder="0"
            className="input !py-4 pl-12 font-display !text-[22px] font-semibold tracking-tight"
            autoFocus
          />
        </div>
      </div>

      {/* Category */}
      <div className="mt-6">
        <label className="label">Kategori</label>
        <div className="grid grid-cols-2 gap-2">
          {filtered.map((c) => {
            const active = categoryId === c.id;
            return (
              <button
                key={c.id}
                onClick={() => setCategoryId(c.id)}
                className={`flex items-center gap-2.5 rounded-2xl border-2 px-3 py-2.5 text-left text-[13px] font-semibold transition-all ${
                  active
                    ? "border-forest-900 bg-forest-900 text-cream"
                    : "border-line bg-paper text-ink-soft hover:border-muted/50"
                }`}
              >
                <span
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
                  style={{
                    background: active ? "rgba(242,240,232,0.14)" : `${c.color}18`,
                    color: active ? "#f2f0e8" : c.color,
                  }}
                >
                  {(() => {
                    const I = iconFor(c.icon);
                    return <I size={14} strokeWidth={2.4} />;
                  })()}
                </span>
                <span className="leading-tight">{c.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Date + note */}
      <div className="mt-6 grid gap-5">
        <div>
          <label className="label">Tanggal</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="input" />
        </div>
        <div>
          <label className="label">Catatan (opsional)</label>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="mis. Belanja mingguan di pasar"
            className="input"
            maxLength={160}
          />
        </div>
      </div>

      <button onClick={submit} disabled={!valid || loading} className="btn btn-primary mt-8 w-full !py-4 text-[15px]">
        {loading ? "Menyimpan…" : editing ? "Simpan Perubahan" : "Simpan Transaksi"}
      </button>
    </Sheet>
  );
}

export function CategoryDot({ color, icon, size = 40 }: { color?: string | null; icon?: string | null; size?: number }) {
  const c = color ?? "#64748B";
  return <IconBadge icon={iconFor(icon)} color={c} bg={`${c}16`} size={size} />;
}
