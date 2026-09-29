// One-time helper for databases that were built with `drizzle-kit push` (no
// migration journal). If the schema already exists but the journal is empty,
// records the first (baseline) migration as applied so `drizzle-kit migrate`
// only runs what comes after it. No-op otherwise.
import { readdirSync, readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { join } from "node:path";
import { DATABASE_URL } from "../src/env";

const dir = join(import.meta.dir, "../drizzle/migrations");
const first = readdirSync(dir).sort()[0];
if (!first) throw new Error("no migrations found");

const sql = new Bun.SQL(DATABASE_URL, { max: 1 });
const [{ has_schema }] =
  await sql`select to_regclass('public.admins') is not null as has_schema`;
const [{ has_journal }] =
  await sql`select to_regclass('drizzle.__drizzle_migrations') is not null as has_journal`;
const applied = has_journal
  ? (await sql`select 1 from drizzle.__drizzle_migrations limit 1`).length
  : 0;

if (has_schema && !applied) {
  const hash = createHash("sha256")
    .update(readFileSync(join(dir, first, "migration.sql"), "utf8"))
    .digest("hex");
  const m = first.match(/^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/)!;
  const createdAt = Date.UTC(
    +m[1]!,
    +m[2]! - 1,
    +m[3]!,
    +m[4]!,
    +m[5]!,
    +m[6]!,
  );
  await sql`create schema if not exists drizzle`;
  await sql`create table if not exists drizzle.__drizzle_migrations (id serial primary key, hash text not null, created_at bigint, name text, applied_at timestamptz default now())`;
  await sql`insert into drizzle.__drizzle_migrations (hash, created_at, name) values (${hash}, ${createdAt}, ${first})`;
  console.info(`📌 baselined existing schema at ${first}`);
} else {
  console.info("baseline not needed");
}
await sql.close();
