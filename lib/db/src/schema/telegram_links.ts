import { pgTable, serial, integer, varchar, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { cardsTable } from "./cards";
import { usersTable } from "./users";

export const telegramLinksTable = pgTable("telegram_links", {
  id: serial("id").primaryKey(),
  cardId: integer("card_id").notNull().references(() => cardsTable.id, { onDelete: "cascade" }),
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  telegramId: varchar("telegram_id", { length: 50 }).notNull(),
  telegramUsername: varchar("telegram_username", { length: 100 }),
  telegramFirstName: varchar("telegram_first_name", { length: 100 }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex("telegram_links_card_id_unique").on(table.cardId),
]);

export type TelegramLink = typeof telegramLinksTable.$inferSelect;
export type InsertTelegramLink = typeof telegramLinksTable.$inferInsert;
