import { useState, useEffect } from "react";
import { get, post, del } from "../api";

function timeSince(ms) {
  if (!ms) return "never";
  const s = Math.floor((Date.now() - ms) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  return `${Math.floor(s / 3600)}h ago`;
}

export default function Dashboard() {
  const [devices, setDevices] = useState([]);
  const [cookies, setCookies] = useState({});
  const [psCounts, setPsCounts] = useState({});
  const [showAdd, setShowAdd] = useState(false);
  const [newId, setNewId] = useState("");
  const [newName, setNewName] = useState("");

  async function load() {
    const devs = await get("/devices");
    setDevices(devs);

    const allCookies = await get("/cookies");
    const map = {};
    allCookies.forEach((c) => (map[c.device_id] = c));
    setCookies(map);

    const allPs = await get("/ps");
    const counts = {};
    allPs.forEach((p) => (counts[p.device_id] = (counts[p.device_id] || 0) + 1));
    setPsCounts(counts);
  }

  useEffect(() => {
    load();
    const t = setInterval(load, 10_000);
    return () => clearInterval(t);
  }, []);

  async function addDevice() {
    if (!newId.trim() || !newName.trim()) return;
    await post("/devices/register", { id: newId.trim(), name: newName.trim() });
    setNewId("");
    setNewName("");
    setShowAdd(false);
    load();
  }

  async function deleteDevice(id, name) {
    if (!confirm(`Delete device "${name}"?`)) return;
    await del(`/devices/${id}`);
    load();
  }

  async function sendCmd(deviceId, command, payload) {
    await post(`/devices/${deviceId}/command`, { command, payload });
    load();
  }

  const total = devices.length;
  const online = devices.filter((d) => d.status !== "offline").length;
  const offline = devices.filter((d) => d.status === "offline").length;
  const running = devices.filter((d) => d.status === "running").length;

  return (
    <div>
      <div className="row-between">
        <div className="page-header">
          <h2>Dashboard</h2>
          <p>Overview of all connected devices</p>
        </div>
        <div className="row">
          <button className="btn-ghost" onClick={load}>Refresh</button>
          <button className="btn-primary" onClick={() => setShowAdd(!showAdd)}>
            {showAdd ? "Cancel" : "+ Add Device"}
          </button>
        </div>
      </div>

      {showAdd && (
        <div className="card mb">
          <div className="card-title">Register New Device</div>
          <div className="add-form">
            <div className="field">
              <label>Device ID</label>
              <input
                value={newId}
                onChange={(e) => setNewId(e.target.value)}
                placeholder="rf-01"
                onKeyDown={(e) => e.key === "Enter" && addDevice()}
              />
            </div>
            <div className="field">
              <label>Display Name</label>
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Redfinger 1"
                onKeyDown={(e) => e.key === "Enter" && addDevice()}
              />
            </div>
            <button className="btn-primary" onClick={addDevice} style={{ height: 35 }}>
              Register
            </button>
          </div>
        </div>
      )}

      <div className="stat-cards">
        <StatCard label="Total Devices" value={total} icon={
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
        } />
        <StatCard label="Online" value={online} icon={
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12.55a11 11 0 0 1 14 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/></svg>
        } />
        <StatCard label="Offline" value={offline} icon={
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="1" y1="1" x2="23" y2="23"/><path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55"/><path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39"/></svg>
        } />
        <StatCard label="Running" value={running} icon={
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>
        } />
      </div>

      {devices.length === 0 ? (
        <div className="empty-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="2" y="3" width="20" height="14" rx="2"/>
            <line x1="8" y1="21" x2="16" y2="21"/>
            <line x1="12" y1="17" x2="12" y2="21"/>
          </svg>
          <p>No devices connected yet.</p>
        </div>
      ) : (
        <div className="device-list">
          {devices.map((d) => (
            <DeviceCard
              key={d.id}
              device={d}
              cookie={cookies[d.id]}
              psCount={psCounts[d.id] || 0}
              onDelete={() => deleteDevice(d.id, d.name)}
              onCmd={(cmd, payload) => sendCmd(d.id, cmd, payload)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, icon }) {
  return (
    <div className="stat-card">
      <div className="stat-label">{icon}{label}</div>
      <div className="stat-value">{value}</div>
    </div>
  );
}

function DeviceCard({ device, cookie, psCount, onDelete, onCmd }) {
  const status = device.status || "offline";
  const isOff = status === "offline";
  const isRunning = status === "running";

  return (
    <div className="device-card">
      <div className="device-info">
        <div>
          <div className="row" style={{ gap: 8, marginBottom: 4 }}>
            <span className="device-name">{device.name}</span>
            <span className={`badge ${status}`}>
              <span className="badge-dot" />
              {status}
            </span>
          </div>
          <div className="device-meta">
            <span>ID: {device.id}</span>
            <span>PS: {psCount}</span>
            <span>Cookie: {cookie ? "Yes" : "No"}</span>
            <span>Hop: {device.hop_min > 0 ? `${device.hop_min}m` : "-"}</span>
            <span>Seen: {timeSince(device.last_seen)}</span>
          </div>
        </div>
      </div>
      <div className="device-actions">
        {!isRunning && (
          <>
            <button className="btn-success" onClick={() => onCmd("start", { mode: "regular" })}>
              Start
            </button>
            <button className="btn-endpoint" onClick={() => onCmd("start", { mode: "endpoint" })}>
              Endpoint
            </button>
          </>
        )}
        {isRunning && (
          <button className="btn-danger" onClick={() => onCmd("stop")}>
            Stop
          </button>
        )}
        <button className="btn-danger" onClick={onDelete} style={{ opacity: 0.7 }}>
          Del
        </button>
      </div>
    </div>
  );
}
