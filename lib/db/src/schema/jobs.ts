import { pgTable, text, serial, timestamp, varchar, integer, jsonb } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const JOB_STATUSES = ["pending", "processing", "completed", "failed"] as const;
export type JobStatus = (typeof JOB_STATUSES)[number];

export const JOB_TYPES = ["card_creation"] as const;
export type JobType = (typeof JOB_TYPES)[number];

export const jobsTable = pgTable("jobs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  type: varchar("type", { length: 50 }).notNull(),
  status: varchar("status", { length: 20 }).notNull().default("pending"),
  result: jsonb("result"),
  error: text("error"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export type Job = typeof jobsTable.$inferSelect;
export type InsertJob = typeof jobsTable.$inferInsert;
