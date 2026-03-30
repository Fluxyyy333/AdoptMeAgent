const express = require("express");
const router = express.Router();
const db = require("../db");

// GET /api/cookies?device_id=xxx
router.get("/", (req, res) => {
  const { device_id } = req.query;
  if (device_id) {
    const rows = db.prepare(
      "SELECT * FROM device_cookies WHERE device_id=? ORDER BY id"
    ).all(device_id);
    return res.json(rows);
  }
  res.json(db.prepare("SELECT * FROM device_cookies ORDER BY device_id, id").all());
});

// POST /api/cookies  — set cookie for device
router.post("/", (req, res) => {
  const { device_id, cookie, roblox_username, roblox_id, account_type } = req.body;
  if (!device_id || !cookie) return res.status(400).json({ error: "device_id and cookie required" });

  const device = db.prepare("SELECT id FROM devices WHERE id=?").get(device_id);
  if (!device) return res.status(404).json({ error: "device not found" });

  // One cookie per device — upsert
  const existing = db.prepare("SELECT id FROM device_cookies WHERE device_id=?").get(device_id);
  if (existing) {
    db.prepare(
      "UPDATE device_cookies SET cookie=?, roblox_username=?, roblox_id=?, account_type=? WHERE device_id=?"
    ).run(cookie, roblox_username || "", roblox_id || "", account_type || "farmer", device_id);
  } else {
    db.prepare(
      "INSERT INTO device_cookies (device_id, cookie, roblox_username, roblox_id, account_type) VALUES (?,?,?,?,?)"
    ).run(device_id, cookie, roblox_username || "", roblox_id || "", account_type || "farmer");
  }

  // Queue inject command to device
  db.prepare(
    "INSERT INTO device_commands (device_id, command, payload, created_at) VALUES (?,?,?,?)"
  ).run(device_id, "inject_cookie", JSON.stringify({ cookie }), Date.now());

  res.json({ ok: true });
});

// DELETE /api/cookies/:id
router.delete("/:id", (req, res) => {
  db.prepare("DELETE FROM device_cookies WHERE id=?").run(req.params.id);
  res.json({ ok: true });
});

module.exports = router;
