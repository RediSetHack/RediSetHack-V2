import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema.js";

export type Database = PostgresJsDatabase<typeof schema>;

export function createDb(connectionString: string): Database {
  const client = postgres(connectionString, { max: 10 });
  return drizzle(client, { schema });
}

export const db: Database | null = process.env.DATABASE_URL
  ? createDb(process.env.DATABASE_URL)
  : null;

export * from "./schema.js";
export { DEFAULT_CHARACTERS, seed } from "./seed.js";