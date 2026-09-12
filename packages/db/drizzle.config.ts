import { fileURLToPath } from "node:url";
import { defineConfig } from "drizzle-kit";

try {
  process.loadEnvFile(
    fileURLToPath(new URL("../../.env", import.meta.url)),
  );
} catch {
  // No root .env; DATABASE_URL may already be set in the environment.
}

export default defineConfig({
  schema: "./src/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
