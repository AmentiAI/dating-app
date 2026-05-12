/**
 * Applies all SQL files in db/migrations using DATABASE_URL from .env
 * Run: node scripts/migrate.cjs
 */
const fs = require("node:fs");
const path = require("node:path");
const pg = require("pg");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

let url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is not set.");
  process.exit(1);
}

if (url.includes("channel_binding=require")) {
  url = url.replace(/&channel_binding=require\b/i, "");
}

const migrationsDir = path.join(__dirname, "..", "db", "migrations");
const migrationFiles = fs
  .readdirSync(migrationsDir)
  .filter((f) => f.endsWith(".sql"))
  .sort((a, b) => a.localeCompare(b, "en"));

const client = new pg.Client({
  connectionString: url,
  ssl: { rejectUnauthorized: true },
});

(async () => {
  await client.connect();
  try {
    for (const file of migrationFiles) {
      const fullPath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(fullPath, "utf8");
      await client.query(sql);
      console.log("Migration applied:", fullPath);
    }
  } finally {
    await client.end();
  }
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
