import pg from "pg";

// Load .env into process.env (native Node, no dotenv dependency).
try {
  process.loadEnvFile();
} catch {
  // .env already loaded or not present — rely on the real environment.
}

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set — add it to .env");
}

// Keep one pool across dev-server hot reloads.
const globalForDb = globalThis as unknown as { pgPool?: pg.Pool };

export const db = (globalForDb.pgPool ??= new pg.Pool({
  connectionString,
  max: 5,
}));
