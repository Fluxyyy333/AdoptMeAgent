import { useState, useEffect } from "react";
import { get, post } from "../api";

export default function Cookies() {
  const [devices, setDevices] = useState([]);
  const [cookies, setCookies] = useState({});
  const [bulkText, setBulkText] = useState("");
  const [injecting, setInjecting] = useState(false);

  async function load() {
    const devs = await get("/devices");
    setDevices(devs);

    const allCookies = await get("/cookies");
    const map = {};
    allCookies.forEach((c) => (map[c.device_id] = c));
    setCookies(map);
  }

  useEffect(() => {
    load();
  }, []);

  const cookieLines = bulkText.split("\n").map((l) => l.trim()).filter(Boolean);
  const needed = devices.length;

  async function inject() {
    if (cookieLines.length === 0) return;
    setInjecting(true);
    await post("/cookies/bulk-inject", { cookies: cookieLines });
    setBulkText("");
    await load();
    setInjecting(false);
  }

  return (
    <div>
      <div className="page-header">
        <h2>Cookies</h2>
        <p>Bulk inject cookies to devices</p>
      </div>

      {/* Device List */}
      <div className="card">
        <div className="row-between mb">
          <div className="card-title" style={{ margin: 0 }}>Devices ({devices.length})</div>
          <span className="dim">{Object.keys(cookies).length} / {devices.length} with cookie</span>
        </div>

        {devices.length === 0 ? (
          <div className="dim text-center" style={{ padding: 20 }}>
            No devices registered.
          </div>
        ) : (
          <div style={{ maxHeight: 250, overflowY: "auto" }}>
            {devices.map((d) => {
              const hasCookie = !!cookies[d.id];
              const isOnline = d.status !== "offline";
              return (
                <div className="cookie-device-row" key={d.id}>
                  <div className="row" style={{ gap: 10 }}>
                    <span className={`dot ${isOnline ? "on" : "off"}`} />
                    <span style={{ color: "#e6edf3", fontSize: 13 }}>{d.name}</span>
                  </div>
                  <span className="dim">
                    {hasCookie
                      ? cookies[d.id].roblox_username || "cookie set"
                      : "no cookie"}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Bulk Inject */}
      <div className="card">
        <div className="row-between mb">
          <div className="card-title" style={{ margin: 0 }}>
            Cookies ({cookieLines.length} needed: {needed})
          </div>
          <span className="dim">{cookieLines.length} / {needed}</span>
        </div>

        <div className="field">
          <label>Paste {needed} cookie(s), one per line</label>
          <textarea
            rows={6}
            value={bulkText}
            onChange={(e) => setBulkText(e.target.value)}
            placeholder={"_|WARNING:-DO-NOT-SHARE-THIS...\n_|WARNING:-DO-NOT-SHARE-THIS..."}
          />
        </div>

        <button
          className="btn-primary"
          onClick={inject}
          disabled={injecting || cookieLines.length === 0}
        >
          {injecting ? "Injecting..." : `Inject (${cookieLines.length})`}
        </button>
      </div>
    </div>
  );
}
