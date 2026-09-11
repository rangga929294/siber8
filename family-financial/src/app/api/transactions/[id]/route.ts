import { db } from "@/db";
import { transactions } from "@/db/schema";
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
    const { type, amount, categoryId, date, note } = body ?? {};

    if (type !== "income" && type !== "expense") {
      return NextResponse.json({ error: "Jenis transaksi tidak valid" }, { status: 400 });
    }
    const amt = Number(amount);
    if (!isFinite(amt) || amt <= 0) {
      return NextResponse.json({ error: "Jumlah harus lebih dari nol" }, { status: 400 });
    }
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json({ error: "Tanggal tidak valid" }, { status: 400 });
    }

    const [updated] = await db
      .update(transactions)
      .set({
        type,
        amount: amt.toFixed(2),
        categoryId: categoryId ? Number(categoryId) : null,
        date,
        note: typeof note === "string" && note.trim() ? note.trim() : null,
      })
      .where(eq(transactions.id, id))
      .returning({ id: transactions.id });

    if (!updated) return NextResponse.json({ error: "Transaksi tidak ditemukan" }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Gagal memperbarui transaksi" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const id = parseId((await ctx.params).id);
  if (!id) return NextResponse.json({ error: "ID tidak valid" }, { status: 400 });

  const [deleted] = await db
    .delete(transactions)
    .where(eq(transactions.id, id))
    .returning({ id: transactions.id });

  if (!deleted) return NextResponse.json({ error: "Transaksi tidak ditemukan" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
