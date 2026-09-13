import { integer, pgTable, serial, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

// ---------------------------------------------------------------------------
// Identity
// ---------------------------------------------------------------------------

// Users are provisioned by Clerk; the `id` mirrors the Clerk user id so that
// JWT subjects map 1:1 to rows without a separate join.
export const users = pgTable(
  "users",
  {
    id: text("id").primaryKey().notNull(),
    email: text("email").notNull(),
    name: text("name"),
    characterId: integer("character_id").references(() => characters.id, {
      onDelete: "set null",
    }),
    totalXp: integer("total_xp").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("users_email_unique").on(table.email)],
);

// Characters are the avatar identities a user can select.
export const characters = pgTable("characters", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull(),
  description: text("description"),
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
