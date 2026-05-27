import { relations, sql } from "drizzle-orm";
import {
  date,
  integer,
  numeric,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

export const operationTypeEnum = pgEnum("operation_type", ["transfer", "deposit"]);

export const wallets = pgTable("wallets", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  dailyLimit: numeric("daily_limit", { precision: 14, scale: 2 }).notNull(),
  monthlyLimit: numeric("monthly_limit", { precision: 14, scale: 2 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const operations = pgTable("operations", {
  id: serial("id").primaryKey(),
  walletId: integer("wallet_id")
    .notNull()
    .references(() => wallets.id, { onDelete: "cascade" }),
  type: operationTypeEnum("type").notNull(),
  amount: numeric("amount", { precision: 14, scale: 2 }).notNull(),
  operationDate: date("operation_date").notNull().default(sql`CURRENT_DATE`),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const walletsRelations = relations(wallets, ({ many }) => ({
  operations: many(operations),
}));

export const operationsRelations = relations(operations, ({ one }) => ({
  wallet: one(wallets, {
    fields: [operations.walletId],
    references: [wallets.id],
  }),
}));
