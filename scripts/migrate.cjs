/**
 * Applies SQL files in db/migrations using DATABASE_URL from .env.
 * Tracks applied files in public.schema_migrations so re-runs are safe.
 * Run: npm run db:migrate
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
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.schema_migrations (
        filename TEXT PRIMARY KEY,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    const { rows: cntRows } = await client.query(
      "SELECT COUNT(*)::int AS c FROM public.schema_migrations"
    );
    if (cntRows[0].c === 0) {
      const { rows: usrRows } = await client.query(
        "SELECT to_regclass('public.users') IS NOT NULL AS ok"
      );
      const { rows: colRows } = await client.query(`
        SELECT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema = 'public' AND table_name = 'conversations' AND column_name = 'match_id'
        ) AS ok
      `);
      if (usrRows[0].ok && colRows[0].ok) {
        for (const file of migrationFiles) {
          await client.query(
            "INSERT INTO public.schema_migrations (filename) VALUES ($1) ON CONFLICT DO NOTHING",
            [file]
          );
        }
        console.log(
          "Recorded prior migrations in schema_migrations (database already up to date; no SQL re-run)."
        );
        await client.end();
        return;
      }
    }

    for (const file of migrationFiles) {
      const { rowCount } = await client.query(
        "SELECT 1 FROM public.schema_migrations WHERE filename = $1",
        [file]
      );
      if (rowCount > 0) {
        console.log("Already applied:", file);
        continue;
      }

      const fullPath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(fullPath, "utf8");
      await client.query(sql);
      await client.query("INSERT INTO public.schema_migrations (filename) VALUES ($1)", [file]);
      console.log("Migration applied:", file);
    }
  } finally {
    await client.end();
  }
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
