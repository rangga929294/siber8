import { db } from "@/db";
import { assets } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function parseId(raw: string) {
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function PUT(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const id = parseId((await ctx.params).id);
  if (!id) return NextResponse.json({ error: "ID tidak valid" }, { status: 400 });

  try {
    const body = await req.json();
    const { name, type, value, acquiredAt, note } = body ?? {};

    if (typeof name !== "string" || name.trim().length < 2) {
      return NextResponse.json({ error: "Nama aset wajib diisi" }, { status: 400 });
    }
    const val = Number(value);
    if (!isFinite(val) || val <= 0) {
      return NextResponse.json({ error: "Nilai aset harus lebih dari nol" }, { status: 400 });
    }

    const [updated] = await db
      .update(assets)
      .set({
        name: name.trim(),
        type: typeof type === "string" && type ? type : "lainnya",
        value: val.toFixed(2),
        acquiredAt: acquiredAt && /^\d{4}-\d{2}-\d{2}$/.test(acquiredAt) ? acquiredAt : null,
        note: typeof note === "string" && note.trim() ? note.trim() : null,
      })
      .where(eq(assets.id, id))
      .returning({ id: assets.id });

    if (!updated) return NextResponse.json({ error: "Aset tidak ditemukan" }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Gagal memperbarui aset" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const id = parseId((await ctx.params).id);
  if (!id) return NextResponse.json({ error: "ID tidak valid" }, { status: 400 });

  const [deleted] = await db.delete(assets).where(eq(assets.id, id)).returning({ id: assets.id });
  if (!deleted) return NextResponse.json({ error: "Aset tidak ditemukan" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
