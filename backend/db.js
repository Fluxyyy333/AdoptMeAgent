const Database = require("better-sqlite3");
const path = require("path");

const db = new Database(path.join(__dirname, "hopper.db"));
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.exec(`
  CREATE TABLE IF NOT EXISTS devices (
    id         TEXT PRIMARY KEY,
    name       TEXT NOT NULL,
    status     TEXT NOT NULL DEFAULT 'offline',
    last_seen  INTEGER,
    pkg_name   TEXT DEFAULT '',
    hop_min    INTEGER DEFAULT 0,
    start_mode TEXT NOT NULL DEFAULT 'regular'
  );

  CREATE TABLE IF NOT EXISTS ps_pool (
    id      INTEGER PRIMARY KEY AUTOINCREMENT,
    ps_link TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS device_ps (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    device_id TEXT NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
    ps_link   TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS device_cookies (
    id               INTEGER PRIMARY KEY AUTOINCREMENT,
    device_id        TEXT NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
    cookie           TEXT NOT NULL,
    roblox_username  TEXT DEFAULT '',
    roblox_id        TEXT DEFAULT '',
    account_type     TEXT NOT NULL DEFAULT 'farmer'
  );

  CREATE TABLE IF NOT EXISTS device_commands (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    device_id  TEXT NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
    command    TEXT NOT NULL,
    payload    TEXT DEFAULT '{}',
    created_at INTEGER NOT NULL,
    sent       INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS global_config (
    id                INTEGER PRIMARY KEY CHECK (id = 1),
    pkg_name          TEXT DEFAULT '',
    hop_interval      INTEGER DEFAULT 50,
    endpoint_ps       TEXT DEFAULT '',
    endpoint_interval INTEGER DEFAULT 30
  );

  INSERT OR IGNORE INTO global_config (id) VALUES (1);
`);

// Migration: add start_mode column if missing (from old schema)
try {
  db.prepare("SELECT start_mode FROM devices LIMIT 1").get();
} catch {
  db.exec("ALTER TABLE devices ADD COLUMN start_mode TEXT NOT NULL DEFAULT 'regular'");
}

module.exports = db;
