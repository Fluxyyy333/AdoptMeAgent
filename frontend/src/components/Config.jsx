import { useState, useEffect } from "react";
import { get, put } from "../api";

export default function Config() {
  const [username, setUsername] = useState("");
  const [saved, setSaved]       = useState("");

  useEffect(() => {
    get("/config").then((cfg) => {
      setUsername(cfg.potion_handler_username || "");
      setSaved(cfg.potion_handler_username || "");
    });
  }, []);

  async function save() {
    await put("/config", { potion_handler_username: username });
    setSaved(username);
    alert("Saved.");
  }

  return (
    <div>
      <div className="card">
        <h2>Age Up Config</h2>
        <div className="field">
          <label>Potion Handler Username (Roblox)</label>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="YourRobloxUsername"
          />
          <div className="dim" style={{ marginTop: 4 }}>
            Username akun yang kamu pakai untuk age up di emulator. Digunakan sebagai whitelist auto-trade dari Collector.
          </div>
        </div>
        {saved && (
          <div style={{ marginBottom: 12, color: "#4ade80", fontSize: 13 }}>
            Saved: {saved}
          </div>
        )}
        <button className="btn-primary" onClick={save}>Save</button>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <h2>About</h2>
        <table>
          <tbody>
            <tr><td className="dim">Backend</td><td>Node.js + Express + SQLite</td></tr>
            <tr><td className="dim">Frontend</td><td>React + Vite</td></tr>
            <tr><td className="dim">Hopper</td><td>Lua v1.4.3 (Termux)</td></tr>
            <tr><td className="dim">Version</td><td>Phase 1 MVP</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
