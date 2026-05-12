/**
 * Applies db/migrations/001_initial_schema.sql using DATABASE_URL from .env
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

const sqlPath = path.join(__dirname, "..", "db", "migrations", "001_initial_schema.sql");
const sql = fs.readFileSync(sqlPath, "utf8");

const client = new pg.Client({
  connectionString: url,
  ssl: { rejectUnauthorized: true },
});

(async () => {
  await client.connect();
  try {
    await client.query(sql);
    console.log("Migration applied:", sqlPath);
  } finally {
    await client.end();
  }
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
