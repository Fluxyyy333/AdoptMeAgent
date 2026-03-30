const express = require("express");
const router = express.Router();
const db = require("../db");

// POST /api/devices/register
router.post("/register", (req, res) => {
  const { id, name, pkg_name } = req.body;
  if (!id || !name) return res.status(400).json({ error: "id and name required" });

  const existing = db.prepare("SELECT id FROM devices WHERE id = ?").get(id);
  if (existing) {
    db.prepare("UPDATE devices SET name=?, pkg_name=?, last_seen=?, status='idle' WHERE id=?")
      .run(name, pkg_name || "", Date.now(), id);
  } else {
    db.prepare("INSERT INTO devices (id, name, pkg_name, last_seen, status) VALUES (?,?,?,?,'idle')")
      .run(id, name, pkg_name || "", Date.now());
  }

  res.json({ ok: true });
});

// GET /api/devices
router.get("/", (req, res) => {
  const devices = db.prepare("SELECT * FROM devices ORDER BY name").all();
  res.json(devices);
});

// GET /api/devices/:id
router.get("/:id", (req, res) => {
  const device = db.prepare("SELECT * FROM devices WHERE id=?").get(req.params.id);
  if (!device) return res.status(404).json({ error: "not found" });
  res.json(device);
});

// DELETE /api/devices/:id
router.delete("/:id", (req, res) => {
  db.prepare("DELETE FROM devices WHERE id=?").run(req.params.id);
  res.json({ ok: true });
});

// GET /api/devices/:id/command  — Lua polls this
router.get("/:id/command", (req, res) => {
  const { id } = req.params;

  // Update last_seen + status
  db.prepare("UPDATE devices SET last_seen=?, status=CASE WHEN status='offline' THEN 'idle' ELSE status END WHERE id=?")
    .run(Date.now(), id);

  // Get oldest unsent command
  const cmd = db.prepare(
    "SELECT * FROM device_commands WHERE device_id=? AND sent=0 ORDER BY created_at ASC LIMIT 1"
  ).get(id);

  if (cmd) {
    db.prepare("UPDATE device_commands SET sent=1 WHERE id=?").run(cmd.id);
    return res.json({ command: cmd.command, payload: JSON.parse(cmd.payload || "{}") });
  }

  res.json({ command: "none" });
});

// POST /api/devices/:id/status  — Lua reports status
router.post("/:id/status", (req, res) => {
  const { id } = req.params;
  const { status, hop_min, pkg_name } = req.body;

  const updates = ["last_seen=?"];
  const vals = [Date.now()];

  if (status)   { updates.push("status=?");   vals.push(status); }
  if (hop_min != null) { updates.push("hop_min=?");  vals.push(hop_min); }
  if (pkg_name) { updates.push("pkg_name=?"); vals.push(pkg_name); }

  vals.push(id);
  db.prepare(`UPDATE devices SET ${updates.join(",")} WHERE id=?`).run(...vals);

  res.json({ ok: true });
});

// POST /api/devices/:id/command  — send command to device
router.post("/:id/command", (req, res) => {
  const { id } = req.params;
  const { command, payload } = req.body;
  if (!command) return res.status(400).json({ error: "command required" });

  db.prepare("INSERT INTO device_commands (device_id, command, payload, created_at) VALUES (?,?,?,?)")
    .run(id, command, JSON.stringify(payload || {}), Date.now());

  res.json({ ok: true });
});

module.exports = router;
