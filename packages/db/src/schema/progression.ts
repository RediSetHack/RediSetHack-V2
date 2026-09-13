import { boolean, date, index, integer, pgTable, serial, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { users } from "./identity.js";
import { stages } from "./catalog.js";

// ---------------------------------------------------------------------------
// Stage progression & daily events
// ---------------------------------------------------------------------------

// Tracks stage completion per user; stages unlock sequentially.
export const userProgress = pgTable(
  "user_progress",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    stageId: integer("stage_id")
      .notNull()
      .references(() => stages.id, { onDelete: "cascade" }),
    completed: boolean("completed").notNull().default(false),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("user_progress_user_stage_unique").on(table.userId, table.stageId),
    index("user_progress_stage_id_index").on(table.stageId),
  ],
);

// One daily modifier per calendar day (Philippine Standard Time, UTC+8).
export const dailyEvents = pgTable(
  "daily_events",
  {
    id: serial("id").primaryKey(),
    eventDate: date("event_date").notNull(),
    // "normal" | "bonus"
    eventType: text("event_type", { enum: ["normal", "bonus"] }).notNull(),
    xpMultiplier: integer("xp_multiplier").notNull().default(1),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("daily_events_event_date_unique").on(table.eventDate)],
);
