import { pgTable, text, serial, timestamp, varchar, integer, doublePrecision } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const CARD_TYPES = ["virtual", "physical"] as const;
export type CardType = (typeof CARD_TYPES)[number];

export const CARD_STATUSES = ["active", "frozen", "expired", "cancelled", "pending_activation"] as const;
export type CardStatus = (typeof CARD_STATUSES)[number];

export const cardsTable = pgTable("cards", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  type: varchar("type", { length: 20 }).notNull().default("virtual"),
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
  contactEmail: varchar("contact_email", { length: 255 }),
  contactPhone: varchar("contact_phone", { length: 30 }),
  contactPhoneDialCode: varchar("contact_phone_dial_code", { length: 10 }),
  activationCode: varchar("activation_code", { length: 20 }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertCardSchema = createInsertSchema(cardsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertCard = z.infer<typeof insertCardSchema>;
export type Card = typeof cardsTable.$inferSelect;
