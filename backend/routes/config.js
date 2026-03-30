const express = require("express");
const router = express.Router();
const db = require("../db");

// GET /api/config
router.get("/", (req, res) => {
  const cfg = db.prepare("SELECT * FROM ageup_config WHERE id=1").get();
  res.json(cfg);
});

// PUT /api/config
router.put("/", (req, res) => {
  const { potion_handler_username } = req.body;
  db.prepare(
    "UPDATE ageup_config SET potion_handler_username=?, updated_at=? WHERE id=1"
  ).run(potion_handler_username || "", Date.now());
  res.json({ ok: true });
});

// POST /api/config/ageup-mode  — redirect all devices to ageup PS
router.post("/ageup-mode", (req, res) => {
  const devices = db.prepare("SELECT id FROM devices").all();
  const now = Date.now();
  for (const d of devices) {
    db.prepare("UPDATE devices SET mode='ageup' WHERE id=?").run(d.id);
    db.prepare(
      "INSERT INTO device_commands (device_id, command, payload, created_at) VALUES (?,?,?,?)"
    ).run(d.id, "set_mode", JSON.stringify({ mode: "ageup" }), now);
  }
  res.json({ ok: true, affected: devices.length });
});

// POST /api/config/resume  — resume normal mode
router.post("/resume", (req, res) => {
  const devices = db.prepare("SELECT id FROM devices").all();
  const now = Date.now();
  for (const d of devices) {
    db.prepare("UPDATE devices SET mode='normal' WHERE id=?").run(d.id);
    db.prepare(
      "INSERT INTO device_commands (device_id, command, payload, created_at) VALUES (?,?,?,?)"
    ).run(d.id, "set_mode", JSON.stringify({ mode: "normal" }), now);
  }
  res.json({ ok: true, affected: devices.length });
});

module.exports = router;
