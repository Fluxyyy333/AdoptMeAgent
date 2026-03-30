const Database = require("better-sqlite3");
const path = require("path");

const db = new Database(path.join(__dirname, "hopper.db"));

db.exec(`
  CREATE TABLE IF NOT EXISTS devices (
    id         TEXT PRIMARY KEY,
    name       TEXT NOT NULL,
    status     TEXT NOT NULL DEFAULT 'offline',
    last_seen  INTEGER,
    pkg_name   TEXT DEFAULT '',
    hop_min    INTEGER DEFAULT 0,
    mode       TEXT NOT NULL DEFAULT 'normal'
  );

  CREATE TABLE IF NOT EXISTS device_ps (
    id       INTEGER PRIMARY KEY AUTOINCREMENT,
    device_id TEXT NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
    ps_link  TEXT NOT NULL,
    ps_type  TEXT NOT NULL DEFAULT 'normal',
    active   INTEGER NOT NULL DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS device_cookies (
    id               INTEGER PRIMARY KEY AUTOINCREMENT,
    device_id        TEXT NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
    cookie           TEXT NOT NULL,
    roblox_username  TEXT DEFAULT '',
    roblox_id        TEXT DEFAULT '',
    account_type     TEXT NOT NULL DEFAULT 'farmer'
  );

  CREATE TABLE IF NOT EXISTS ageup_config (
    id                       INTEGER PRIMARY KEY CHECK (id = 1),
    potion_handler_username  TEXT DEFAULT '',
    updated_at               INTEGER
  );

  INSERT OR IGNORE INTO ageup_config (id, potion_handler_username, updated_at)
  VALUES (1, '', 0);

  CREATE TABLE IF NOT EXISTS device_commands (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    device_id TEXT NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
    command   TEXT NOT NULL,
    payload   TEXT DEFAULT '{}',
    created_at INTEGER NOT NULL,
    sent      INTEGER NOT NULL DEFAULT 0
  );
`);

module.exports = db;
