import { db } from "@/db";
import { assets } from "@/db/schema";
import { desc, sql } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const rows = await db.select().from(assets).orderBy(desc(assets.value));
  return NextResponse.json(
    rows.map((a) => ({
      ...a,
      value: Number(a.value),
    })),
  );
}

export async function POST(req: NextRequest) {
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

    const [created] = await db
      .insert(assets)
      .values({
        name: name.trim(),
        type: typeof type === "string" && type ? type : "lainnya",
        value: val.toFixed(2),
        acquiredAt: acquiredAt && /^\d{4}-\d{2}-\d{2}$/.test(acquiredAt) ? acquiredAt : null,
        note: typeof note === "string" && note.trim() ? note.trim() : null,
      })
      .returning({ id: assets.id });

    return NextResponse.json({ ok: true, id: created.id });
  } catch {
    return NextResponse.json({ error: "Gagal menyimpan aset" }, { status: 500 });
  }
}
