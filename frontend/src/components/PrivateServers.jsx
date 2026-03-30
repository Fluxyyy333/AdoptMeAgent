import { useState, useEffect } from "react";
import { get, post, del } from "../api";

export default function PrivateServers() {
  const [pool, setPool] = useState([]);
  const [distribution, setDistribution] = useState([]);
  const [devices, setDevices] = useState([]);
  const [bulkText, setBulkText] = useState("");
  const [maxPerDevice, setMaxPerDevice] = useState(6);
  const [distributing, setDistributing] = useState(false);

  async function loadPool() {
    setPool(await get("/ps/pool"));
  }

  async function loadDistribution() {
    setDistribution(await get("/ps/distribution"));
    setDevices(await get("/devices"));
  }

  useEffect(() => {
    loadPool();
    loadDistribution();
  }, []);

  async function addLinks() {
    const links = bulkText.split("\n").map((l) => l.trim()).filter(Boolean);
    if (links.length === 0) return;
    await post("/ps/pool", { links });
    setBulkText("");
    loadPool();
  }

  async function clearPool() {
    if (!confirm("Clear all PS links from pool?")) return;
    await del("/ps/pool");
    loadPool();
  }

  async function removeLink(id) {
    await del(`/ps/pool/${id}`);
    loadPool();
  }

  async function distribute() {
    if (devices.length === 0) return alert("No devices registered");
    setDistributing(true);
    await post("/ps/distribute", { max_per_device: maxPerDevice });
    await loadDistribution();
    setDistributing(false);
  }

  // Group distribution by device
  const grouped = {};
  distribution.forEach((d) => {
    if (!grouped[d.device_id]) grouped[d.device_id] = { name: d.device_name, links: [] };
    grouped[d.device_id].links.push(d);
  });

  const totalCoverable = devices.length * maxPerDevice;

  function truncate(url) {
    if (url.length <= 60) return url;
    return url.slice(0, 35) + "..." + url.slice(-20);
  }

  return (
    <div>
      <div className="page-header">
        <h2>Private Servers</h2>
        <p>Manage PS pool and distribute to devices</p>
      </div>

      {/* PS Pool */}
      <div className="card">
        <div className="row-between mb">
          <div className="card-title" style={{ margin: 0 }}>PS Pool ({pool.length} links)</div>
          {pool.length > 0 && (
            <button className="btn-danger" onClick={clearPool}>Clear All</button>
          )}
        </div>

        <div className="field">
          <label>Add PS Links (one per line)</label>
          <textarea
            rows={4}
            value={bulkText}
            onChange={(e) => setBulkText(e.target.value)}
            placeholder={"https://www.roblox.com/games/...?privateServerLinkCode=...\nhttps://www.roblox.com/games/...?privateServerLinkCode=..."}
          />
        </div>
        <button className="btn-primary" onClick={addLinks}>Add Links</button>

        {pool.length > 0 && (
          <div style={{ marginTop: 16, maxHeight: 300, overflowY: "auto" }}>
            {pool.map((ps, i) => (
              <div className="ps-item" key={ps.id}>
                <span className="ps-index">{i + 1}</span>
                <span className="ps-link">{truncate(ps.ps_link)}</span>
                <button className="btn-danger" onClick={() => removeLink(ps.id)} style={{ padding: "3px 8px", fontSize: 11 }}>
                  Del
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Distribute */}
      <div className="card">
        <div className="card-title">Distribute</div>
        <div className="row" style={{ gap: 16, marginBottom: 16 }}>
          <div>
            <label>Max PS per device</label>
            <div className="row" style={{ gap: 8 }}>
              <input
                type="number"
                min={1}
                value={maxPerDevice}
                onChange={(e) => setMaxPerDevice(parseInt(e.target.value) || 1)}
                style={{ width: 80 }}
              />
              <span className="dim">= up to {totalCoverable} devices coverable</span>
            </div>
          </div>
        </div>
        <button
          className="btn-primary"
          onClick={distribute}
          disabled={distributing || pool.length === 0}
        >
          {distributing ? "Distributing..." : `Distribute (${pool.length} links to ${devices.length} devices)`}
        </button>
      </div>

      {/* Current Distribution */}
      {Object.keys(grouped).length > 0 && (
        <div className="card">
          <div className="card-title">Current Distribution</div>
          {Object.entries(grouped).map(([deviceId, data]) => (
            <div className="dist-group" key={deviceId}>
              <div className="dist-group-header">
                {data.name} ({data.links.length} links)
              </div>
              {data.links.map((link, i) => (
                <div className="ps-item" key={link.id}>
                  <span className="ps-index">{i + 1}</span>
                  <span className="ps-link">{truncate(link.ps_link)}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
