"use client";

import { useEffect, useState } from "react";
import { Sheet } from "@/components/overlay";
import { useToast } from "@/components/ui";
import { ASSET_TYPES, ASSET_TYPE_KEYS } from "@/lib/icons";
import type { AssetRow } from "@/lib/types";

function digitsOnly(v: string) {
  return v.replace(/[^\d]/g, "").slice(0, 15);
}
function groupDigits(v: string) {
  if (!v) return "";
  return Number(v).toLocaleString("id-ID");
}

export function AssetForm({
  open,
  onClose,
  onSaved,
  editing,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  editing: AssetRow | null;
}) {
  const { push } = useToast();
  const [name, setName] = useState("");
  const [type, setType] = useState<string>("tunai");
  const [value, setValue] = useState("");
  const [acquiredAt, setAcquiredAt] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (editing) {
      setName(editing.name);
      setType(editing.type);
      setValue(String(Math.round(editing.value)));
      setAcquiredAt(editing.acquiredAt?.slice(0, 10) ?? "");
      setNote(editing.note ?? "");
    } else {
      setName("");
      setType("tunai");
      setValue("");
      setAcquiredAt("");
      setNote("");
    }
  }, [open, editing]);

  const valid = name.trim().length > 1 && value !== "" && Number(value) > 0;

  async function submit() {
    if (!valid || loading) return;
    setLoading(true);
    try {
      const res = await fetch(editing ? `/api/assets/${editing.id}` : "/api/assets", {
        method: editing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          type,
          value: Number(value),
          acquiredAt: acquiredAt || null,
          note: note.trim() || null,
        }),
      });
      if (!res.ok) throw new Error();
      push(editing ? "Aset berhasil diperbarui" : "Aset baru berhasil dicatat");
      onSaved();
      onClose();
    } catch {
      push("Gagal menyimpan aset", "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={editing ? "Ubah Aset" : "Tambah Aset"}
      subtitle="Catat harta dan kekayaan keluarga"
    >
      <div>
        <label className="label">Nama Aset</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="mis. Rumah Keluarga, Deposito BCA"
          className="input"
          maxLength={120}
          autoFocus
        />
      </div>

      <div className="mt-6">
        <label className="label">Jenis Aset</label>
        <div className="grid grid-cols-2 gap-2">
          {ASSET_TYPE_KEYS.map((k) => {
            const meta = ASSET_TYPES[k];
            const active = type === k;
            return (
              <button
                key={k}
                onClick={() => setType(k)}
                className={`flex items-center gap-2.5 rounded-2xl border-2 px-3 py-2.5 text-left text-[13px] font-semibold transition-all ${
                  active
                    ? "border-forest-900 bg-forest-900 text-cream"
                    : "border-line bg-paper text-ink-soft hover:border-muted/50"
                }`}
              >
                <span
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
                  style={{
                    background: active ? "rgba(242,240,232,0.14)" : meta.bg,
                    color: active ? "#f2f0e8" : meta.color,
                  }}
                >
                  <meta.icon size={14} strokeWidth={2.4} />
                </span>
                {meta.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-6">
        <label className="label">Nilai Saat Ini</label>
        <div className="relative">
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 font-display text-lg font-semibold text-muted">
            Rp
          </span>
          <input
            inputMode="numeric"
            value={groupDigits(value)}
            onChange={(e) => setValue(digitsOnly(e.target.value))}
            placeholder="0"
            className="input !py-4 pl-12 font-display !text-[22px] font-semibold tracking-tight"
          />
        </div>
        <p className="mt-2 text-[12px] leading-relaxed text-muted">
          Isi estimasi nilai wajar saat ini, bukan harga beli.
        </p>
      </div>

      <div className="mt-6 grid gap-5">
        <div>
          <label className="label">Tanggal Perolehan (opsional)</label>
          <input type="date" value={acquiredAt} onChange={(e) => setAcquiredAt(e.target.value)} className="input" />
        </div>
        <div>
          <label className="label">Catatan (opsional)</label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="mis. Sisa KPR 8 tahun, bunga deposito 5,5%"
            className="input min-h-[88px] resize-none"
            maxLength={240}
          />
        </div>
      </div>

      <button onClick={submit} disabled={!valid || loading} className="btn btn-primary mt-8 w-full !py-4 text-[15px]">
        {loading ? "Menyimpan…" : editing ? "Simpan Perubahan" : "Simpan Aset"}
      </button>
    </Sheet>
  );
}
