const express = require("express");
const router = express.Router();
const db = require("../db");

// ── PS Pool ──

// GET /api/ps/pool
router.get("/pool", (req, res) => {
  const rows = db.prepare("SELECT * FROM ps_pool ORDER BY id").all();
  res.json(rows);
});

// POST /api/ps/pool  — bulk add
router.post("/pool", (req, res) => {
  const { links } = req.body; // array of strings
  if (!Array.isArray(links) || links.length === 0)
    return res.status(400).json({ error: "links array required" });

  const insert = db.prepare("INSERT INTO ps_pool (ps_link) VALUES (?)");
  const tx = db.transaction((items) => {
    for (const link of items) {
      const trimmed = link.trim();
      if (trimmed) insert.run(trimmed);
    }
  });
  tx(links);

  res.json({ ok: true, count: links.filter((l) => l.trim()).length });
});

// DELETE /api/ps/pool  — clear all
router.delete("/pool", (req, res) => {
  db.prepare("DELETE FROM ps_pool").run();
  res.json({ ok: true });
});

// DELETE /api/ps/pool/:id  — remove single
router.delete("/pool/:id", (req, res) => {
  db.prepare("DELETE FROM ps_pool WHERE id=?").run(req.params.id);
  res.json({ ok: true });
});

// ── Distribute ──

// POST /api/ps/distribute  — distribute pool to devices evenly
router.post("/distribute", (req, res) => {
  const { max_per_device } = req.body;
  if (!max_per_device || max_per_device < 1)
    return res.status(400).json({ error: "max_per_device required (>= 1)" });

  const pool = db.prepare("SELECT * FROM ps_pool ORDER BY id").all();
  const devices = db.prepare("SELECT id, name FROM devices ORDER BY name").all();

  if (pool.length === 0) return res.status(400).json({ error: "PS pool is empty" });
  if (devices.length === 0) return res.status(400).json({ error: "No devices registered" });

  // Clear existing assignments
  db.prepare("DELETE FROM device_ps").run();

  // Round-robin distribute
  const insert = db.prepare("INSERT INTO device_ps (device_id, ps_link) VALUES (?,?)");
  const tx = db.transaction(() => {
    let deviceIdx = 0;
    const counts = {};
    devices.forEach((d) => (counts[d.id] = 0));

    for (const ps of pool) {
      // Find next device that hasn't hit max
      let attempts = 0;
      while (counts[devices[deviceIdx].id] >= max_per_device && attempts < devices.length) {
        deviceIdx = (deviceIdx + 1) % devices.length;
        attempts++;
      }
      if (attempts >= devices.length) break; // all full

      const dev = devices[deviceIdx];
      insert.run(dev.id, ps.ps_link);
      counts[dev.id]++;
      deviceIdx = (deviceIdx + 1) % devices.length;
    }
  });
  tx();

  const distribution = db.prepare(
    "SELECT device_id, COUNT(*) as count FROM device_ps GROUP BY device_id"
  ).all();

  res.json({ ok: true, distribution });
});

// GET /api/ps/distribution  — current distribution grouped by device
router.get("/distribution", (req, res) => {
  const rows = db.prepare(`
    SELECT dp.id, dp.device_id, dp.ps_link, d.name as device_name
    FROM device_ps dp
    JOIN devices d ON d.id = dp.device_id
    ORDER BY d.name, dp.id
  `).all();
  res.json(rows);
});

// GET /api/ps?device_id=x  — get PS links for a specific device (Lua polls this)
router.get("/", (req, res) => {
  const { device_id } = req.query;
  if (device_id) {
    const rows = db.prepare("SELECT * FROM device_ps WHERE device_id=? ORDER BY id").all(device_id);
    return res.json(rows);
  }
  res.json(db.prepare("SELECT * FROM device_ps ORDER BY device_id, id").all());
});

module.exports = router;
