const express = require("express");
const router = express.Router();
const db = require("../db");

// GET /api/ps?device_id=xxx
router.get("/", (req, res) => {
  const { device_id } = req.query;
  if (device_id) {
    const rows = db.prepare(
      "SELECT * FROM device_ps WHERE device_id=? AND active=1 ORDER BY id"
    ).all(device_id);
    return res.json(rows);
  }
  const rows = db.prepare("SELECT * FROM device_ps ORDER BY device_id, id").all();
  res.json(rows);
});

// POST /api/ps
router.post("/", (req, res) => {
  const { device_id, ps_link, ps_type } = req.body;
  if (!device_id || !ps_link) return res.status(400).json({ error: "device_id and ps_link required" });

  const device = db.prepare("SELECT id FROM devices WHERE id=?").get(device_id);
  if (!device) return res.status(404).json({ error: "device not found" });

  const type = ps_type === "ageup" ? "ageup" : "normal";
  const result = db.prepare(
    "INSERT INTO device_ps (device_id, ps_link, ps_type) VALUES (?,?,?)"
  ).run(device_id, ps_link, type);

  res.json({ ok: true, id: result.lastInsertRowid });
});

// DELETE /api/ps/:id
router.delete("/:id", (req, res) => {
  db.prepare("DELETE FROM device_ps WHERE id=?").run(req.params.id);
  res.json({ ok: true });
});

// PUT /api/ps/:id  — change type or active
router.put("/:id", (req, res) => {
  const { ps_type, active } = req.body;
  const updates = [];
  const vals = [];
  if (ps_type != null) { updates.push("ps_type=?"); vals.push(ps_type); }
  if (active  != null) { updates.push("active=?");  vals.push(active ? 1 : 0); }
  if (!updates.length)  return res.status(400).json({ error: "nothing to update" });
  vals.push(req.params.id);
  db.prepare(`UPDATE device_ps SET ${updates.join(",")} WHERE id=?`).run(...vals);
  res.json({ ok: true });
});

module.exports = router;
