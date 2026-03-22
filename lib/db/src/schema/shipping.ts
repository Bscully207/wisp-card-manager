import { pgTable, serial, integer, varchar, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { cardsTable } from "./cards";
import { usersTable } from "./users";

export const SHIPPING_STATUSES = ["in_review", "dispatched", "shipped", "delivered", "cancelled"] as const;
export type ShippingStatus = (typeof SHIPPING_STATUSES)[number];

export const shippingTable = pgTable("shipping", {
  id: serial("id").primaryKey(),
  cardId: integer("card_id").notNull().references(() => cardsTable.id, { onDelete: "cascade" }),
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  status: varchar("status", { length: 20 }).notNull().default("in_review"),
  recipientName: varchar("recipient_name", { length: 200 }).notNull(),
  address: varchar("address", { length: 500 }).notNull(),
  city: varchar("city", { length: 100 }).notNull(),
  country: varchar("country", { length: 100 }).notNull(),
  zipCode: varchar("zip_code", { length: 20 }).notNull(),
  trackingNumber: varchar("tracking_number", { length: 100 }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertShippingSchema = createInsertSchema(shippingTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertShipping = z.infer<typeof insertShippingSchema>;
export type Shipping = typeof shippingTable.$inferSelect;
