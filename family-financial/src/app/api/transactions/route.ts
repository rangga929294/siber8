import { db } from "@/db";
import { categories, transactions } from "@/db/schema";
import { and, desc, eq, sql, type SQL } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const selectShape = {
  id: transactions.id,
  type: transactions.type,
  amount: transactions.amount,
  note: transactions.note,
  date: transactions.date,
  categoryId: transactions.categoryId,
  categoryName: categories.name,
  categoryIcon: categories.icon,
  categoryColor: categories.color,
};

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const conditions: SQL[] = [];

  const type = sp.get("type");
  if (type === "income" || type === "expense") {
    conditions.push(eq(transactions.type, type));
  }

  const month = sp.get("month");
  if (month && /^\d{4}-\d{2}$/.test(month)) {
    conditions.push(
      sql`${transactions.date} >= (${month + "-01"})::date AND ${transactions.date} < ((${month + "-01"})::date + interval '1 month')`,
    );
  }

  const q = sp.get("q")?.trim();
  if (q) {
    const like = `%${q}%`;
    conditions.push(sql`(${transactions.note} ILIKE ${like} OR ${categories.name} ILIKE ${like})`);
  }

  const categoryId = sp.get("categoryId");
  if (categoryId && /^\d+$/.test(categoryId)) {
    conditions.push(eq(transactions.categoryId, Number(categoryId)));
  }

  const where = conditions.length ? and(...conditions) : undefined;

  const [rows, totals] = await Promise.all([
    db
      .select(selectShape)
      .from(transactions)
      .leftJoin(categories, eq(transactions.categoryId, categories.id))
      .where(where)
      .orderBy(desc(transactions.date), desc(transactions.id))
      .limit(400),
    db
      .select({
        income: sql<number>`COALESCE(SUM(CASE WHEN ${transactions.type}='income' THEN ${transactions.amount} END),0)::float8`,
        expense: sql<number>`COALESCE(SUM(CASE WHEN ${transactions.type}='expense' THEN ${transactions.amount} END),0)::float8`,
        count: sql<number>`COUNT(*)::int`,
      })
      .from(transactions)
      .leftJoin(categories, eq(transactions.categoryId, categories.id))
      .where(where),
  ]);

  return NextResponse.json({
    rows: rows.map((r) => ({ ...r, amount: Number(r.amount) })),
    totals: totals[0] ?? { income: 0, expense: 0, count: 0 },
  });
}

export async function POST(req: NextRequest) {
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

    const [created] = await db
      .insert(transactions)
      .values({
        type,
        amount: amt.toFixed(2),
        categoryId: categoryId ? Number(categoryId) : null,
        date,
        note: typeof note === "string" && note.trim() ? note.trim() : null,
      })
      .returning();

    return NextResponse.json({ ok: true, id: created.id });
  } catch {
    return NextResponse.json({ error: "Gagal menyimpan transaksi" }, { status: 500 });
  }
}
