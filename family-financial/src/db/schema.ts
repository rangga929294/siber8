import {
  date,
  integer,
  numeric,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  type: varchar("type", { length: 10 }).notNull(), // income | expense
  icon: varchar("icon", { length: 50 }).notNull().default("circle"),
  color: varchar("color", { length: 20 }).notNull().default("#127A5B"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  type: varchar("type", { length: 10 }).notNull(), // income | expense
  amount: numeric("amount", { precision: 16, scale: 2 }).notNull(),
  categoryId: integer("category_id").references(() => categories.id, {
    onDelete: "set null",
  }),
  note: text("note"),
  date: date("date").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const assets = pgTable("assets", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 150 }).notNull(),
  type: varchar("type", { length: 50 }).notNull(), // tunai | bank | investasi | properti | kendaraan | lainnya
  value: numeric("value", { precision: 16, scale: 2 }).notNull(),
  acquiredAt: date("acquired_at"),
  note: text("note"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Category = typeof categories.$inferSelect;
export type Transaction = typeof transactions.$inferSelect;
export type Asset = typeof assets.$inferSelect;
