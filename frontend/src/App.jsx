import { useState } from "react";
import Devices from "./components/Devices";
import PSManager from "./components/PSManager";
import Config from "./components/Config";
import "./App.css";

const TABS = ["Devices", "PS Links", "Config"];

export default function App() {
  const [tab, setTab] = useState("Devices");

  return (
    <div className="app">
      <header>
        <h1>Hopper Dashboard</h1>
        <nav>
          {TABS.map((t) => (
            <button
              key={t}
              className={tab === t ? "active" : ""}
              onClick={() => setTab(t)}
            >
              {t}
            </button>
          ))}
        </nav>
      </header>

      <main>
        {tab === "Devices"  && <Devices />}
        {tab === "PS Links" && <PSManager />}
        {tab === "Config"   && <Config />}
      </main>
    </div>
  );
}
