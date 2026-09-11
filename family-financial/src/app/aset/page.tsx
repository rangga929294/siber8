"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Gem, Pencil, Plus, Trash2, TrendingUp } from "lucide-react";
import { AssetForm } from "@/components/asset-form";
import { ConfirmDialog } from "@/components/overlay";
import { CountUp, EmptyState, IconBadge, Spinner, useToast } from "@/components/ui";
import { ASSET_TYPES, ASSET_TYPE_KEYS, assetMeta } from "@/lib/icons";
import { formatDateID, formatIDR, formatIDRCompact, todayISO } from "@/lib/format";
import type { AssetRow } from "@/lib/types";

export default function AsetPage() {
  const { push } = useToast();
  const [assets, setAssets] = useState<AssetRow[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<AssetRow | null>(null);
  const [deleting, setDeleting] = useState<AssetRow | null>(null);
  const [deletingBusy, setDeletingBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/assets", { cache: "no-store" });
      setAssets(await res.json());
    } catch {
      push("Gagal memuat aset", "error");
    } finally {
      setLoading(false);
    }
  }, [push]);

  useEffect(() => {
    load();
  }, [load]);

  const total = useMemo(() => (assets ?? []).reduce((a, b) => a + b.value, 0), [assets]);
  const byType = useMemo(() => {
    const map = new Map<string, number>();
    for (const a of assets ?? []) map.set(a.type, (map.get(a.type) ?? 0) + a.value);
    return [...map.entries()].sort((x, y) => y[1] - x[1]);
  }, [assets]);

  const filtered = useMemo(
    () => (assets ?? []).filter((a) => typeFilter === "all" || a.type === typeFilter),
    [assets, typeFilter],
  );

  async function confirmDelete() {
    if (!deleting || deletingBusy) return;
    setDeletingBusy(true);
    try {
      const res = await fetch(`/api/assets/${deleting.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      push("Aset dihapus");
      setDeleting(null);
      load();
    } catch {
      push("Gagal menghapus aset", "error");
    } finally {
      setDeletingBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-5 pt-7 lg:px-10 lg:pt-10">
      {/* header */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="flex flex-wrap items-end justify-between gap-4"
      >
        <div>
          <h1 className="font-display text-[30px] font-semibold tracking-tight text-ink lg:text-[36px]">Aset Keluarga</h1>
          <p className="mt-1 text-[13.5px] text-muted">Pencatatan harta & kekayaan per {formatDateID(todayISO())}</p>
        </div>
        <button
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
          className="btn btn-gold !px-5 !py-3"
        >
          <Plus size={17} strokeWidth={2.6} />
          Tambah Aset
        </button>
      </motion.div>

      {/* hero */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.06, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="relative mt-6 overflow-hidden rounded-[26px] bg-forest-900 p-7 text-cream shadow-[var(--shadow-card)] lg:p-9"
      >
        <div className="pointer-events-none absolute -right-16 -top-24 h-72 w-72 rounded-full bg-gold-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 left-1/3 h-60 w-60 rounded-full bg-moss-500/25 blur-3xl" />
        <div className="relative grid gap-8 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="text-[12px] font-bold tracking-[0.14em] text-cream/50 uppercase">Total Nilai Aset</p>
            <p className="num mt-2 text-[40px] font-semibold leading-none tracking-tight lg:text-[48px]" title={formatIDR(total)}>
              <CountUp value={total} format={formatIDRCompact} />
            </p>
            <div className="mt-4 flex items-center gap-2 text-[13px] font-medium text-cream/60">
              <TrendingUp size={15} className="text-gold-500" />
              {(assets ?? []).length} aset tercatat dalam {byType.length} kategori
            </div>
          </div>
          <div>
            <div className="flex h-3.5 w-full overflow-hidden rounded-full bg-cream/10">
              {byType.map(([type, value]) => (
                <div
                  key={type}
                  style={{
                    width: `${total ? (value / total) * 100 : 0}%`,
                    background: assetMeta(type).color,
                  }}
                  className="transition-all duration-700"
                  title={`${assetMeta(type).label} — ${formatIDR(value)}`}
                />
              ))}
            </div>
            <ul className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2.5">
              {byType.map(([type, value]) => (
                <li key={type} className="flex items-center gap-2 text-[12.5px]">
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: assetMeta(type).color }} />
                  <span className="font-semibold text-cream/75">{assetMeta(type).label}</span>
                  <span className="num ml-auto font-semibold text-cream">
                    {total ? Math.round((value / total) * 100) : 0}%
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </motion.div>

      {/* filter chips */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.12, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="mt-6 flex flex-wrap gap-2"
      >
        <button className="chip" data-active={typeFilter === "all"} onClick={() => setTypeFilter("all")}>
          Semua · {(assets ?? []).length}
        </button>
        {ASSET_TYPE_KEYS.map((k) => {
          const count = (assets ?? []).filter((a) => a.type === k).length;
          if (count === 0) return null;
          return (
            <button key={k} className="chip" data-active={typeFilter === k} onClick={() => setTypeFilter(k)}>
              {ASSET_TYPES[k].label} · {count}
            </button>
          );
        })}
      </motion.div>

      {/* grid */}
      <div className="mt-5">
        {loading ? (
          <Spinner />
        ) : filtered.length === 0 ? (
          <div className="card">
            <EmptyState
              icon={Gem}
              title="Belum ada aset"
              hint="Mulai catat kekayaan keluarga seperti rumah, kendaraan, tabungan, dan investasi."
              action={
                <button
                  onClick={() => {
                    setEditing(null);
                    setFormOpen(true);
                  }}
                  className="btn btn-primary !text-[13px]"
                >
                  <Plus size={15} strokeWidth={2.6} /> Catat aset pertama
                </button>
              }
            />
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((a, i) => {
              const meta = assetMeta(a.type);
              const share = total ? (a.value / total) * 100 : 0;
              return (
                <motion.article
                  key={a.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i * 0.05, 0.4), duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                  className="card group relative overflow-hidden p-5 transition-shadow hover:shadow-[var(--shadow-pop)]"
                >
                  <div
                    className="pointer-events-none absolute inset-x-0 top-0 h-1"
                    style={{ background: `linear-gradient(90deg, ${meta.color}, transparent)` }}
                  />
                  <div className="flex items-start justify-between gap-3">
                    <IconBadge icon={meta.icon} color={meta.color} bg={meta.bg} size={44} />
                    <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                      <button
                        onClick={() => {
                          setEditing(a);
                          setFormOpen(true);
                        }}
                        className="rounded-lg p-2 text-muted transition-colors hover:bg-line-soft hover:text-ink"
                        aria-label="Ubah aset"
                      >
                        <Pencil size={15} strokeWidth={2.2} />
                      </button>
                      <button
                        onClick={() => setDeleting(a)}
                        className="rounded-lg p-2 text-muted transition-colors hover:bg-clay-100 hover:text-clay-600"
                        aria-label="Hapus aset"
                      >
                        <Trash2 size={15} strokeWidth={2.2} />
                      </button>
                    </div>
                  </div>
                  <h3 className="mt-4 text-[15px] font-bold leading-snug text-ink">{a.name}</h3>
                  <p className="mt-0.5 text-[12px] font-semibold" style={{ color: meta.color }}>
                    {meta.label}
                    {a.acquiredAt && <span className="font-medium text-muted"> · sejak {formatDateID(a.acquiredAt)}</span>}
                  </p>
                  <p className="num mt-3 text-[22px] font-semibold tracking-tight text-ink" title={formatIDR(a.value)}>
                    {formatIDRCompact(a.value)}
                  </p>
                  <div className="mt-3">
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-paper">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${Math.max(share, 2)}%`, background: meta.color }}
                      />
                    </div>
                    <p className="mt-1.5 text-[11px] font-semibold text-muted">{share.toFixed(1)}% dari total aset</p>
                  </div>
                  {a.note && (
                    <p className="mt-3 border-t border-line-soft pt-3 text-[12px] leading-relaxed text-muted">{a.note}</p>
                  )}
                </motion.article>
              );
            })}
          </div>
        )}
      </div>

      <AssetForm open={formOpen} onClose={() => setFormOpen(false)} onSaved={load} editing={editing} />
      <ConfirmDialog
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        onConfirm={confirmDelete}
        loading={deletingBusy}
        title="Hapus aset ini?"
        message={`“${deleting?.name ?? ""}” senilai ${deleting ? formatIDR(deleting.value) : ""} akan dihapus dari pencatatan kekayaan keluarga.`}
      />
    </div>
  );
}
