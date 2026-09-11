import { db } from "@/db";
import { categories } from "@/db/schema";
import { asc } from "drizzle-orm";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const rows = await db
    .select()
    .from(categories)
    .orderBy(asc(categories.type), asc(categories.id));
  return NextResponse.json(rows);
}
