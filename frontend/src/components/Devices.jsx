import { useState, useEffect } from "react";
import { get, post, put, del } from "../api";

function timeSince(ms) {
  if (!ms) return "never";
  const s = Math.floor((Date.now() - ms) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  return `${Math.floor(s / 3600)}h ago`;
}

function DeviceCard({ device, onRefresh }) {
  const [showCookie, setShowCookie] = useState(false);
  const [cookie, setCookie]   = useState("");
  const [cookieInfo, setCookieInfo] = useState(null);

  useEffect(() => {
    get(`/cookies?device_id=${device.id}`).then((rows) => {
      if (rows.length > 0) setCookieInfo(rows[0]);
    });
  }, [device.id]);

  async function sendCmd(command) {
    await post(`/devices/${device.id}/command`, { command });
    alert(`Command "${command}" queued.`);
  }

  async function saveCookie() {
    if (!cookie.trim()) return;
    await post("/cookies", { device_id: device.id, cookie: cookie.trim() });
    setShowCookie(false);
    setCookie("");
    onRefresh();
    alert("Cookie saved & inject_cookie queued.");
  }

  async function deleteDevice() {
    if (!confirm(`Delete device "${device.name}"?`)) return;
    await del(`/devices/${device.id}`);
    onRefresh();
  }

  const status = device.status || "offline";

  return (
    <div className="card">
      <div className="row" style={{ justifyContent: "space-between", marginBottom: 10 }}>
        <div className="row">
          <strong style={{ color: "#fff" }}>{device.name}</strong>
          <span className={`badge ${status}`}>{status}</span>
          {device.mode === "ageup" && <span className="badge ageup">AGE UP</span>}
        </div>
        <button className="btn-danger" onClick={deleteDevice}>Delete</button>
      </div>

      <table>
        <tbody>
          <tr><td className="dim">ID</td><td className="mono">{device.id}</td></tr>
          <tr><td className="dim">Package</td><td>{device.pkg_name || "-"}</td></tr>
          <tr><td className="dim">Hop</td><td>{device.hop_min > 0 ? `${device.hop_min}m` : "OFF"}</td></tr>
          <tr><td className="dim">Last seen</td><td>{timeSince(device.last_seen)}</td></tr>
          {cookieInfo && (
            <tr>
              <td className="dim">Account</td>
              <td>
                {cookieInfo.roblox_username
                  ? `${cookieInfo.roblox_username} (${cookieInfo.roblox_id})`
                  : <span className="mono">{cookieInfo.cookie.slice(0, 20)}...</span>}
              </td>
            </tr>
          )}
        </tbody>
      </table>

      <div className="row mt">
        <button className="btn-ghost" onClick={() => sendCmd("start")}>Start</button>
        <button className="btn-ghost" onClick={() => sendCmd("stop")}>Stop</button>
        <button className="btn-ghost" onClick={() => sendCmd("inject_all")}>Inject All</button>
        <button className="btn-ghost" onClick={() => setShowCookie(!showCookie)}>
          {showCookie ? "Cancel" : "Set Cookie"}
        </button>
      </div>

      {showCookie && (
        <div className="mt">
          <div className="field">
            <label>Paste .ROBLOSECURITY cookie</label>
            <textarea
              rows={3}
              value={cookie}
              onChange={(e) => setCookie(e.target.value)}
              placeholder="_|WARNING..."
            />
          </div>
          <button className="btn-primary" onClick={saveCookie}>Save & Inject</button>
        </div>
      )}
    </div>
  );
}

export default function Devices() {
  const [devices, setDevices] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [newId, setNewId]   = useState("");
  const [newName, setNewName] = useState("");

  async function load() {
    setDevices(await get("/devices"));
  }

  useEffect(() => {
    load();
    const t = setInterval(load, 10_000);
    return () => clearInterval(t);
  }, []);

  async function addDevice() {
    if (!newId.trim() || !newName.trim()) return alert("ID and name required");
    await post("/devices/register", { id: newId.trim(), name: newName.trim() });
    setNewId(""); setNewName(""); setShowAdd(false);
    load();
  }

  async function ageUpMode() {
    await post("/config/ageup-mode", {});
    alert("Age Up Mode activated for all devices.");
    load();
  }

  async function resumeMode() {
    await post("/config/resume", {});
    alert("Resumed normal mode for all devices.");
    load();
  }

  return (
    <div>
      <div className="row" style={{ justifyContent: "space-between", marginBottom: 16 }}>
        <h2 style={{ color: "#fff" }}>Devices ({devices.length})</h2>
        <div className="row">
          <button className="btn-orange" onClick={ageUpMode}>Age Up Mode</button>
          <button className="btn-green"  onClick={resumeMode}>Resume</button>
          <button className="btn-primary" onClick={() => setShowAdd(!showAdd)}>
            {showAdd ? "Cancel" : "+ Add Device"}
          </button>
        </div>
      </div>

      {showAdd && (
        <div className="card">
          <h2>Register Device</h2>
          <div className="field">
            <label>Device ID (unique, e.g. rf-01)</label>
            <input value={newId} onChange={(e) => setNewId(e.target.value)} placeholder="rf-01" />
          </div>
          <div className="field">
            <label>Display Name</label>
            <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Redfinger 1" />
          </div>
          <button className="btn-primary" onClick={addDevice}>Register</button>
        </div>
      )}

      {devices.length === 0 && (
        <div className="dim" style={{ marginTop: 24, textAlign: "center" }}>
          No devices registered. Add one above or register from the Lua script.
        </div>
      )}

      {devices.map((d) => (
        <DeviceCard key={d.id} device={d} onRefresh={load} />
      ))}
    </div>
  );
}
