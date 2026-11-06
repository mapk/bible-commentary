// Saves the publicly readable tables to backups/<timestamp>/ as JSON.
// Run with `npm run backup`; scripts/schedule-backup.sh runs it daily.
//
// Uses the anon key, so it only sees what RLS shows anonymous readers. Never
// add a service_role key here. A new folder is written only when the data has
// changed, and this script never deletes a backup.

import { execFile } from "node:child_process";
import { existsSync } from "node:fs";
import { appendFile, mkdir, readdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const TABLES = ["commentary", "chiasms", "chiasm_units"];
const PAGE_SIZE = 500;

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const BACKUP_DIR = join(ROOT, "backups");
const LOG_FILE = join(BACKUP_DIR, "backup.log");

async function log(message) {
  const line = `${new Date().toISOString()} ${message}`;
  console.log(line);
  await mkdir(BACKUP_DIR, { recursive: true });
  await appendFile(LOG_FILE, `${line}\n`);
}

// Scheduled runs have no terminal, so a problem would otherwise go unseen.
function notify(message) {
  return new Promise((resolve) => {
    const script = `display notification ${JSON.stringify(message)} with title "Tolkovanye backup"`;
    execFile("osascript", ["-e", script], () => resolve());
  });
}

async function fetchTable(supabase, table) {
  const rows = [];

  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await supabase
      .from(table)
      .select("*")
      .order("id")
      .range(from, from + PAGE_SIZE - 1);

    if (error) throw new Error(`${table}: ${error.message}`);

    rows.push(...data);
    if (data.length < PAGE_SIZE) return rows;
  }
}

async function latestBackup() {
  const entries = await readdir(BACKUP_DIR, { withFileTypes: true });
  const folders = entries
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith("."))
    .map((entry) => entry.name)
    .sort();

  return folders.length ? join(BACKUP_DIR, folders[folders.length - 1]) : null;
}

async function readIfExists(path) {
  return existsSync(path) ? readFile(path, "utf8") : null;
}

function timestamp() {
  const now = new Date();
  const pad = (value) => String(value).padStart(2, "0");
  return (
    `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}` +
    `-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`
  );
}

async function run() {
  const envFile = join(ROOT, ".env.local");
  if (existsSync(envFile)) process.loadEnvFile(envFile);

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) throw new Error("Missing Supabase settings in .env.local");

  const supabase = createClient(url, anonKey, {
    auth: { persistSession: false },
  });

  await mkdir(BACKUP_DIR, { recursive: true });
  const previous = await latestBackup();
  const files = {};
  const warnings = [];
  let changed = previous === null;

  for (const table of TABLES) {
    const rows = await fetchTable(supabase, table);

    // Zero rows means a failed read or lost data, never a backup worth keeping.
    if (rows.length === 0) throw new Error(`${table} returned no rows`);

    const content = `${JSON.stringify(rows, null, 2)}\n`;
    files[table] = { content, count: rows.length };

    const old = previous && (await readIfExists(join(previous, `${table}.json`)));
    if (old !== content) changed = true;

    if (old) {
      const oldCount = JSON.parse(old).length;
      if (rows.length < oldCount) {
        warnings.push(`${table} dropped from ${oldCount} to ${rows.length} rows`);
      }
    }
  }

  const summary = TABLES.map((table) => `${table} ${files[table].count}`).join(", ");

  if (changed) {
    const name = timestamp();
    const temp = join(BACKUP_DIR, `.incomplete-${name}`);

    await mkdir(temp);
    for (const table of TABLES) {
      await writeFile(join(temp, `${table}.json`), files[table].content);
    }
    // Rename last, so a folder with a normal name is always a complete backup.
    await rename(temp, join(BACKUP_DIR, name));
    await log(`Saved ${name}: ${summary}`);
  } else {
    await log(`No changes since last backup: ${summary}`);
  }

  for (const warning of warnings) {
    await log(`WARNING: ${warning}`);
    await notify(warning);
  }
}

try {
  await run();
} catch (error) {
  await log(`FAILED: ${error.message}`);
  await notify(`Backup failed: ${error.message}`);
  process.exitCode = 1;
} finally {
  // Clears a partial folder from a run that stopped before its rename.
  const entries = await readdir(BACKUP_DIR).catch(() => []);
  await Promise.all(
    entries
      .filter((name) => name.startsWith(".incomplete-"))
      .map((name) => rm(join(BACKUP_DIR, name), { recursive: true, force: true }))
  );
}
