import { fileURLToPath } from "node:url";
import { sql } from "drizzle-orm";
import { characters } from "./schema.js";
import { createDb } from "./index.js";

for (const rel of ["../../.env", "../../../.env", "./.env"]) {
  try {
    process.loadEnvFile(fileURLToPath(new URL(rel, import.meta.url)));
    if (process.env.DATABASE_URL) break;
  } catch {
    // try next
  }
}

export const DEFAULT_CHARACTERS = [
  {
    id: 1,
    name: "Binary Knight",
    slug: "binary-knight",
    description: "Resilient defender of algorithms and clean code.",
  },
  {
    id: 2,
    name: "Code Wizard",
    slug: "code-wizard",
    description: "Master of abstractions, functional spells, and recursion.",
  },
  {
    id: 3,
    name: "Cyber Rogue",
    slug: "cyber-rogue",
    description: "Stealthy bug hunter and security operative.",
  },
  {
    id: 4,
    name: "DevOps Alchemist",
    slug: "devops-alchemist",
    description: "Transmuter of code into scalable cloud infrastructure.",
  },
  {
    id: 5,
    name: "Script Samurai",
    slug: "script-samurai",
    description: "Swift executor of clean syntax and precision tests.",
  },
] as const;

export async function seed(databaseUrl?: string) {
  const url = databaseUrl ?? process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not set");
  }

  const db = createDb(url);
  console.log("Seeding default characters into database...");

  for (const char of DEFAULT_CHARACTERS) {
    await db
      .insert(characters)
      .values({
        id: char.id,
        name: char.name,
        slug: char.slug,
        description: char.description,
      })
      .onConflictDoUpdate({
        target: characters.id,
        set: {
          name: char.name,
          slug: char.slug,
          description: char.description,
        },
      });
  }

  await db.execute(
    sql`SELECT setval(pg_get_serial_sequence('characters', 'id'), coalesce(max(id), 1)) FROM characters;`,
  );

  console.log("Seeded 5 characters successfully!");
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  seed()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("Seeding failed:", err);
      process.exit(1);
    });
}
