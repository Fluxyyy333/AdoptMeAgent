const express = require("express");
const router = express.Router();
const db = require("../db");

// GET /api/settings
router.get("/", (req, res) => {
  const cfg = db.prepare("SELECT * FROM global_config WHERE id = 1").get();
  res.json(cfg || { pkg_name: "", hop_interval: 50, endpoint_ps: "", endpoint_interval: 30 });
});

// PUT /api/settings
router.put("/", (req, res) => {
  const { pkg_name, hop_interval, endpoint_ps, endpoint_interval } = req.body;
  const updates = [];
  const vals = [];

  if (pkg_name !== undefined)          { updates.push("pkg_name=?");          vals.push(pkg_name); }
  if (hop_interval !== undefined)      { updates.push("hop_interval=?");      vals.push(hop_interval); }
  if (endpoint_ps !== undefined)       { updates.push("endpoint_ps=?");       vals.push(endpoint_ps); }
  if (endpoint_interval !== undefined) { updates.push("endpoint_interval=?"); vals.push(endpoint_interval); }

  if (!updates.length) return res.status(400).json({ error: "nothing to update" });

  db.prepare(`UPDATE global_config SET ${updates.join(",")} WHERE id=1`).run(...vals);
  const cfg = db.prepare("SELECT * FROM global_config WHERE id = 1").get();
  res.json(cfg);
});

module.exports = router;
