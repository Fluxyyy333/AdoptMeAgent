import { useState, useEffect } from "react";
import { get, put } from "../api";

export default function Config() {
  const [settings, setSettings] = useState({
    pkg_name: "",
    hop_interval: 50,
    endpoint_ps: "",
    endpoint_interval: 30,
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    get("/settings").then((cfg) => {
      setSettings({
        pkg_name: cfg.pkg_name || "",
        hop_interval: cfg.hop_interval ?? 50,
        endpoint_ps: cfg.endpoint_ps || "",
        endpoint_interval: cfg.endpoint_interval ?? 30,
      });
    });
  }, []);

  function update(key, value) {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  }

  async function save() {
    setSaving(true);
    await put("/settings", settings);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  return (
    <div>
      <div className="row-between">
        <div className="page-header">
          <h2>Config</h2>
          <p>Global settings for all devices</p>
        </div>
        <button className="btn-primary" onClick={save} disabled={saving}>
          {saving ? "Saving..." : saved ? "Saved!" : "Save"}
        </button>
      </div>

      {/* Hopper Settings */}
      <div className="card">
        <div className="card-title">Hopper</div>

        <div className="settings-row">
          <div className="settings-label">
            <h4>Package Name</h4>
            <p>Android package name for the Roblox app</p>
          </div>
          <div className="settings-input">
            <input
              value={settings.pkg_name}
              onChange={(e) => update("pkg_name", e.target.value)}
              placeholder="com.roblox.client"
            />
          </div>
        </div>

        <div className="settings-row">
          <div className="settings-label">
            <h4>Hop Interval</h4>
            <p>Minutes between server hops</p>
          </div>
          <div className="settings-input">
            <div className="input-with-unit">
              <input
                type="number"
                min={0}
                value={settings.hop_interval}
                onChange={(e) => update("hop_interval", parseInt(e.target.value) || 0)}
                style={{ width: 100 }}
              />
              <span className="unit">min</span>
            </div>
          </div>
        </div>
      </div>

      {/* End Point Settings */}
      <div className="card">
        <div className="card-title">End Point PS Link</div>

        <div className="settings-row">
          <div className="settings-label">
            <h4>End Point PS Link</h4>
            <p>PS link where all devices gather after hopping (pabrik besar)</p>
          </div>
          <div className="settings-input" style={{ width: 350 }}>
            <input
              value={settings.endpoint_ps}
              onChange={(e) => update("endpoint_ps", e.target.value)}
              placeholder="https://www.roblox.com/games/...?privateServerLinkCode=..."
            />
          </div>
        </div>

        <div className="settings-row">
          <div className="settings-label">
            <h4>End Point Interval</h4>
            <p>Minutes to stay at end point before next cycle</p>
          </div>
          <div className="settings-input">
            <div className="input-with-unit">
              <input
                type="number"
                min={1}
                value={settings.endpoint_interval}
                onChange={(e) => update("endpoint_interval", parseInt(e.target.value) || 1)}
                style={{ width: 100 }}
              />
              <span className="unit">min</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
