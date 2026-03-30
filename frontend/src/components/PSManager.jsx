import { useState, useEffect } from "react";
import { get, post, del } from "../api";

export default function PSManager() {
  const [devices, setDevices]   = useState([]);
  const [psLinks, setPsLinks]   = useState([]);
  const [deviceId, setDeviceId] = useState("");
  const [newLink, setNewLink]   = useState("");
  const [newType, setNewType]   = useState("normal");

  async function load() {
    const devs = await get("/devices");
    setDevices(devs);
    if (!deviceId && devs.length > 0) setDeviceId(devs[0].id);
  }

  async function loadPs() {
    if (!deviceId) return;
    setPsLinks(await get(`/ps?device_id=${deviceId}`));
  }

  useEffect(() => { load(); }, []);
  useEffect(() => { loadPs(); }, [deviceId]);

  async function addLink() {
    const link = newLink.trim();
    if (!link || !deviceId) return;
    if (!link.startsWith("http")) return alert("Invalid link");
    await post("/ps", { device_id: deviceId, ps_link: link, ps_type: newType });
    setNewLink("");
    loadPs();
  }

  async function removeLink(id) {
    await del(`/ps/${id}`);
    loadPs();
  }

  function truncate(url) {
    if (url.length <= 50) return url;
    return url.slice(0, 28) + "..." + url.slice(-16);
  }

  return (
    <div>
      <div className="row" style={{ justifyContent: "space-between", marginBottom: 16 }}>
        <h2 style={{ color: "#fff" }}>PS Links</h2>
        <div style={{ minWidth: 200 }}>
          <select value={deviceId} onChange={(e) => setDeviceId(e.target.value)}>
            {devices.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="card">
        <h2>Add PS Link</h2>
        <div className="field">
          <label>PS Link (https://...?code=...)</label>
          <input
            value={newLink}
            onChange={(e) => setNewLink(e.target.value)}
            placeholder="https://www.roblox.com/games/...?privateServerLinkCode=..."
          />
        </div>
        <div className="row">
          <div style={{ flex: 1 }}>
            <label>Type</label>
            <select value={newType} onChange={(e) => setNewType(e.target.value)}>
              <option value="normal">normal</option>
              <option value="ageup">ageup</option>
            </select>
          </div>
          <div style={{ paddingTop: 18 }}>
            <button className="btn-primary" onClick={addLink}>Add</button>
          </div>
        </div>
      </div>

      <div className="card">
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Link</th>
              <th>Type</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {psLinks.length === 0 && (
              <tr><td colSpan={4} className="dim" style={{ textAlign: "center", padding: 20 }}>
                No PS links for this device.
              </td></tr>
            )}
            {psLinks.map((ps, i) => (
              <tr key={ps.id}>
                <td className="dim">{i + 1}</td>
                <td className="mono">{truncate(ps.ps_link)}</td>
                <td>
                  <span className={`badge ${ps.ps_type === "ageup" ? "ageup" : "idle"}`}>
                    {ps.ps_type}
                  </span>
                </td>
                <td>
                  <button className="btn-danger" onClick={() => removeLink(ps.id)}>Del</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
