import { pgTable, serial, integer, varchar, text, boolean, timestamp } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const notificationsTable = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  type: varchar("type", { length: 50 }).notNull().default("info"),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  isRead: boolean("is_read").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Notification = typeof notificationsTable.$inferSelect;
export type InsertNotification = typeof notificationsTable.$inferInsert;

export const notificationSettingsTable = pgTable("notification_settings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }).unique(),
  transactionAlerts: boolean("transaction_alerts").notNull().default(true),
  topupAlerts: boolean("topup_alerts").notNull().default(true),
  securityAlerts: boolean("security_alerts").notNull().default(true),
  marketingAlerts: boolean("marketing_alerts").notNull().default(true),
});

export type NotificationSettings = typeof notificationSettingsTable.$inferSelect;
