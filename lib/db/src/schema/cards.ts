import { pgTable, text, serial, timestamp, varchar, integer, doublePrecision } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const cardsTable = pgTable("cards", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  cardNumber: varchar("card_number", { length: 19 }).notNull().unique(),
  cardholderName: varchar("cardholder_name", { length: 100 }).notNull(),
  expiryMonth: integer("expiry_month").notNull(),
  expiryYear: integer("expiry_year").notNull(),
  cvv: varchar("cvv", { length: 4 }).notNull(),
  balance: doublePrecision("balance").notNull().default(0),
  currency: varchar("currency", { length: 10 }).notNull().default("EUR"),
  status: varchar("status", { length: 20 }).notNull().default("active"),
  label: varchar("label", { length: 100 }),
  color: varchar("color", { length: 50 }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertCardSchema = createInsertSchema(cardsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertCard = z.infer<typeof insertCardSchema>;
export type Card = typeof cardsTable.$inferSelect;
