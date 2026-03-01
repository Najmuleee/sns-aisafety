import { defineConfig } from "drizzle-kit";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is required to run drizzle commands");
}

// Detect database type from connection string
const isMySQL = connectionString.startsWith("mysql://");
const isSQLite = connectionString.startsWith("file:");

export default defineConfig({
  schema: "./drizzle/schema.ts",
  out: "./drizzle",
  dialect: isSQLite ? "sqlite" : isMySQL ? "mysql" : "mysql",
  dbCredentials: isSQLite
    ? {
        url: connectionString,
      }
    : {
        url: connectionString,
      },
});
