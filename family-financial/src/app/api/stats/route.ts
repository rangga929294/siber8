import { db } from "@/db";
import { sql, type SQL } from "drizzle-orm";
import { NextResponse } from "next/server";
import type { AssetRow, CategorySlice, StatsResponse, TxRow } from "@/lib/types";

export const dynamic = "force-dynamic";

const MONTH_SHORT = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

async function rows<T>(q: SQL): Promise<T[]> {
  const res = await db.execute(q);
  return (res as unknown as { rows: T[] }).rows;
}

export async function GET() {
  const [
    totals,
    monthAgg,
    cashflow,
    expenseCat,
    incomeCat,
    recent,
    assetTotals,
    assetByType,
    assetsTop,
  ] = await Promise.all([
    rows<{ total_income: number; total_expense: number; tx_count: number }>(sql`
      SELECT COALESCE(SUM(CASE WHEN type='income' THEN amount END),0)::float8 AS total_income,
             COALESCE(SUM(CASE WHEN type='expense' THEN amount END),0)::float8 AS total_expense,
             COUNT(*)::int AS tx_count
      FROM transactions`),
    rows<{ key: string; income: number; expense: number }>(sql`
      SELECT to_char(date_trunc('month', date), 'YYYY-MM') AS key,
             COALESCE(SUM(CASE WHEN type='income' THEN amount END),0)::float8 AS income,
             COALESCE(SUM(CASE WHEN type='expense' THEN amount END),0)::float8 AS expense
      FROM transactions
      WHERE date >= date_trunc('month', CURRENT_DATE) - interval '1 month'
      GROUP BY 1`),
    rows<{ key: string; income: number; expense: number }>(sql`
      WITH months AS (
        SELECT generate_series(
          date_trunc('month', CURRENT_DATE) - interval '7 months',
          date_trunc('month', CURRENT_DATE),
          interval '1 month') AS m)
      SELECT to_char(m, 'YYYY-MM') AS key,
             COALESCE(SUM(CASE WHEN t.type='income' THEN t.amount END),0)::float8 AS income,
             COALESCE(SUM(CASE WHEN t.type='expense' THEN t.amount END),0)::float8 AS expense
      FROM months LEFT JOIN transactions t ON date_trunc('month', t.date) = m
      GROUP BY m ORDER BY m`),
    rows<CategorySlice>(sql`
      SELECT c.name, c.color, c.icon, SUM(t.amount)::float8 AS value
      FROM transactions t JOIN categories c ON c.id = t.category_id
      WHERE t.type='expense' AND date_trunc('month', t.date) = date_trunc('month', CURRENT_DATE)
      GROUP BY c.id, c.name, c.color, c.icon ORDER BY value DESC`),
    rows<CategorySlice>(sql`
      SELECT c.name, c.color, c.icon, SUM(t.amount)::float8 AS value
      FROM transactions t JOIN categories c ON c.id = t.category_id
      WHERE t.type='income' AND date_trunc('month', t.date) = date_trunc('month', CURRENT_DATE)
      GROUP BY c.id, c.name, c.color, c.icon ORDER BY value DESC`),
    rows<TxRow>(sql`
      SELECT t.id, t.type, t.amount::float8 AS amount, t.note,
             to_char(t.date,'YYYY-MM-DD') AS date,
             t.category_id AS "categoryId", c.name AS "categoryName",
             c.icon AS "categoryIcon", c.color AS "categoryColor"
      FROM transactions t LEFT JOIN categories c ON c.id = t.category_id
      ORDER BY t.date DESC, t.id DESC LIMIT 8`),
    rows<{ total: number; count: number }>(sql`
      SELECT COALESCE(SUM(value),0)::float8 AS total, COUNT(*)::int AS count FROM assets`),
    rows<{ type: string; value: number }>(sql`
      SELECT type, SUM(value)::float8 AS value FROM assets GROUP BY type ORDER BY value DESC`),
    rows<AssetRow>(sql`
      SELECT id, name, type, value::float8 AS value,
             to_char(acquired_at,'YYYY-MM-DD') AS "acquiredAt", note
      FROM assets ORDER BY value DESC LIMIT 5`),
  ]);

  const t = totals[0] ?? { total_income: 0, total_expense: 0, tx_count: 0 };
  const now = new Date();
  const curKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const prevKey = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    .toISOString()
    .slice(0, 7);

  const cur = monthAgg.find((m) => m.key === curKey);
  const prev = monthAgg.find((m) => m.key === prevKey);
  const a = assetTotals[0] ?? { total: 0, count: 0 };

  const body: StatsResponse = {
    monthKey: curKey,
    balance: t.total_income - t.total_expense,
    totalIncome: t.total_income,
    totalExpense: t.total_expense,
    monthIncome: cur?.income ?? 0,
    monthExpense: cur?.expense ?? 0,
    prevMonthIncome: prev?.income ?? 0,
    prevMonthExpense: prev?.expense ?? 0,
    txCount: t.tx_count,
    totalAssets: a.total,
    netWorth: a.total + (t.total_income - t.total_expense),
    assetCount: a.count,
    cashflow: cashflow.map((c) => ({
      key: c.key,
      label: MONTH_SHORT[Number(c.key.slice(5, 7)) - 1] ?? c.key,
      income: c.income,
      expense: c.expense,
    })),
    expenseByCategory: expenseCat.map((e) => ({ ...e, value: Number(e.value) })),
    incomeByCategory: incomeCat.map((e) => ({ ...e, value: Number(e.value) })),
    recent: recent.map((r) => ({ ...r, amount: Number(r.amount) })),
    assetsTop: assetsTop.map((r) => ({ ...r, value: Number(r.value) })),
    assetByType: assetByType.map((r) => ({ ...r, value: Number(r.value) })),
  };

  return NextResponse.json(body);
}
