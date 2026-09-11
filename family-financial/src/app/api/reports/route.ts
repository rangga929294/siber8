import { db } from "@/db";
import { sql, type SQL } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import type { CategorySlice, ReportResponse } from "@/lib/types";

export const dynamic = "force-dynamic";

const MONTH_SHORT = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

async function rows<T>(q: SQL): Promise<T[]> {
  const res = await db.execute(q);
  return (res as unknown as { rows: T[] }).rows;
}

export async function GET(req: NextRequest) {
  const yearParam = req.nextUrl.searchParams.get("year");
  const year = yearParam && /^\d{4}$/.test(yearParam) ? Number(yearParam) : new Date().getFullYear();
  const start = `${year}-01-01`;

  const [months, totals, expenseCat, incomeCat] = await Promise.all([
    rows<{ key: string; income: number; expense: number }>(sql`
      WITH months AS (
        SELECT generate_series(
          ${start}::date,
          (${start}::date + interval '11 months')::date,
          interval '1 month') AS m)
      SELECT to_char(m, 'YYYY-MM') AS key,
             COALESCE(SUM(CASE WHEN t.type='income' THEN t.amount END),0)::float8 AS income,
             COALESCE(SUM(CASE WHEN t.type='expense' THEN t.amount END),0)::float8 AS expense
      FROM months LEFT JOIN transactions t ON date_trunc('month', t.date) = m
      GROUP BY m ORDER BY m`),
    rows<{ total_income: number; total_expense: number; tx_count: number }>(sql`
      SELECT COALESCE(SUM(CASE WHEN type='income' THEN amount END),0)::float8 AS total_income,
             COALESCE(SUM(CASE WHEN type='expense' THEN amount END),0)::float8 AS total_expense,
             COUNT(*)::int AS tx_count
      FROM transactions
      WHERE date >= ${start}::date AND date < (${start}::date + interval '1 year')::date`),
    rows<CategorySlice>(sql`
      SELECT c.name, c.color, c.icon, SUM(t.amount)::float8 AS value
      FROM transactions t JOIN categories c ON c.id = t.category_id
      WHERE t.type='expense' AND date >= ${start}::date AND date < (${start}::date + interval '1 year')::date
      GROUP BY c.id, c.name, c.color, c.icon ORDER BY value DESC`),
    rows<CategorySlice>(sql`
      SELECT c.name, c.color, c.icon, SUM(t.amount)::float8 AS value
      FROM transactions t JOIN categories c ON c.id = t.category_id
      WHERE t.type='income' AND date >= ${start}::date AND date < (${start}::date + interval '1 year')::date
      GROUP BY c.id, c.name, c.color, c.icon ORDER BY value DESC`),
  ]);

  const t = totals[0] ?? { total_income: 0, total_expense: 0, tx_count: 0 };

  const body: ReportResponse = {
    year,
    months: months.map((m) => ({
      key: m.key,
      label: MONTH_SHORT[Number(m.key.slice(5, 7)) - 1] ?? m.key,
      income: Number(m.income),
      expense: Number(m.expense),
    })),
    totalIncome: t.total_income,
    totalExpense: t.total_expense,
    net: t.total_income - t.total_expense,
    expenseByCategory: expenseCat.map((e) => ({ ...e, value: Number(e.value) })),
    incomeByCategory: incomeCat.map((e) => ({ ...e, value: Number(e.value) })),
    txCount: t.tx_count,
  };

  return NextResponse.json(body);
}
