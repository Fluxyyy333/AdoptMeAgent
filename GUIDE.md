# GUIDE — Hopper Dashboard v2.0 Setup & Testing

## Architecture

```
┌─────────────────────────────────────────┐
│  Browser: http://your-pc:5173           │
│  (Dashboard, PS, Cookies, Config)       │
└────────────────┬────────────────────────┘
                 │ HTTP (Vite proxy)
     ┌───────────┴────────────────┐
     │                            │
┌────▼──────────┐   ┌────────────▼────────┐
│ Backend       │   │ Frontend React      │
│ :3000/api/*   │   │ :5173 (dev/prod)    │
│ Express       │   │ - Dashboard         │
│ + SQLite      │   │ - Private Servers   │
└────┬──────────┘   │ - Cookies           │
     │              │ - Config            │
     │ HTTP polling └─────────────────────┘
     │ (every 10s)
  ┌──▼──────────────────────────┐
  │ Redfinger Termux             │
  │ Lua v1.5+ hopper script      │
  │ - Polls /api/devices/cmd     │
  │ - Reports status             │
  │ - Executes: start/stop       │
  └──────────────────────────────┘
```

---

## 1. Local Development (Windows PC)

### Prerequisites
- Node.js v18+
- npm

### Terminal 1: Backend
```bash
cd backend
node server.js
# Output: Backend running on http://localhost:3000
```

Verify:
```bash
curl http://localhost:3000/api/devices
# Returns: []
```

### Terminal 2: Frontend
```bash
cd frontend
npx vite
# Output: Local: http://localhost:5173
```

**Open browser:** `http://localhost:5173`

---

## 2. First Time Setup (UI)

### Register Devices
Dashboard tab → "+ Add Device"
- Device ID: `rf-01`, `rf-02`, etc. (unique)
- Display Name: `Redfinger 1`, etc.
- Click: Register

### Add Private Servers
Private Servers tab:
1. Paste PS links (one per line)
2. Set "Max PS per device" (e.g., 6)
3. Click "Distribute"

### Inject Cookies
Cookies tab:
1. Paste N cookies (N = device count)
2. Click "Inject (N)"
3. Devices get `inject_cookie` command queued

### Global Config
Config tab:
- **Package Name**: `com.roblox.client`
- **Hop Interval**: `50` (minutes)
- **End Point PS Link**: `https://...?privateServerLinkCode=...` (pabrik besar)
- **End Point Interval**: `30` (minutes)
- Click: Save

---

## 3. Testing on Redfinger

### Step 1: Find Your PC's IP
Windows CMD:
```bash
ipconfig
```
Look for "IPv4 Address", e.g., `192.168.1.100`

### Step 2: Update Lua Script
In Redfinger Termux, edit `hopper.lua`:
```lua
-- Line ~10, update:
local BACKEND = "http://192.168.1.100:3000"
```

### Step 3: Start Lua Hopper
```bash
cd ~/hopper
lua hopper.lua
```

Output should show:
```
[Device ID: rf-01]
Polling http://192.168.1.100:3000/api/devices/rf-01/command
```

### Step 4: Send Commands from Dashboard

**Start Regular Hopper** → Click "Start" button
- Lua receives: `{command: "start", payload: {mode: "regular"}}`
- Hopper runs for `hop_interval` minutes
- Then moves to End Point PS Link

**Start End Point Only** → Click "Endpoint" button
- Lua receives: `{command: "start", payload: {mode: "endpoint"}}`
- Goes directly to End Point PS (no hopping)
- Stays for `endpoint_interval` minutes

**Stop** → Click "Stop" button
- Lua receives: `{command: "stop"}`
- Stops immediately

**Inject Cookie**
- Cookies tab → paste → Inject
- Lua receives: `{command: "inject_cookie", payload: {cookie: "..."}}`

### Step 5: Monitor Status
- Dashboard stat cards update every 10s
- Device cards show: status, last seen, PS count, cookie, hop mins
- Red = offline (not seen for 2+ mins)

---

## 4. Firewall Setup

Open port 3000 for Redfinger to reach backend:

**Windows Defender (PowerShell as Admin):**
```powershell
netsh advfirewall firewall add rule name="Hopper Backend" dir=in action=allow protocol=tcp localport=3000
```

Or manually:
- Windows Defender → Advanced Settings → Inbound Rules → New Rule
- Port: 3000, TCP, Allow

---

## 5. API Reference

### Devices
```
POST /api/devices/register
  Body: {id, name, pkg_name}
  → Register/update device

GET /api/devices
  → Get all devices

GET /api/devices/:id/command
  → Lua polls this every 10s
  → Returns: {command, payload} or {command: "none"}

POST /api/devices/:id/status
  Body: {status, hop_min, pkg_name}
  → Lua reports status

POST /api/devices/:id/command
  Body: {command, payload}
  → Queue command to device

DELETE /api/devices/:id
  → Delete device
```

### Private Servers
```
GET /api/ps/pool
  → Get all PS links

POST /api/ps/pool
  Body: {links: [...]}
  → Add multiple PS links

DELETE /api/ps/pool
  → Clear all

POST /api/ps/distribute
  Body: {max_per_device}
  → Distribute round-robin

GET /api/ps/distribution
  → Get distribution grouped by device

GET /api/ps?device_id=x
  → Lua polls this
  → Returns: [{id, device_id, ps_link}, ...]
```

### Cookies
```
GET /api/cookies?device_id=x
  → Get cookies for device

POST /api/cookies/bulk-inject
  Body: {cookies: [...]}
  → Distribute N cookies to N devices (1:1)
```

### Settings
```
GET /api/settings
  → Get global config

PUT /api/settings
  Body: {pkg_name, hop_interval, endpoint_ps, endpoint_interval}
  → Update config
```

---

## 6. Manual API Testing (Optional)

```bash
# Register device
curl -X POST http://localhost:3000/api/devices/register \
  -H "Content-Type: application/json" \
  -d '{"id":"test-01","name":"Test","pkg_name":"com.roblox.client"}'

# List devices
curl http://localhost:3000/api/devices

# Add PS links
curl -X POST http://localhost:3000/api/ps/pool \
  -H "Content-Type: application/json" \
  -d '{"links":["https://...?code=abc","https://...?code=def"]}'

# Distribute
curl -X POST http://localhost:3000/api/ps/distribute \
  -H "Content-Type: application/json" \
  -d '{"max_per_device":6}'

# Send command
curl -X POST http://localhost:3000/api/devices/test-01/command \
  -H "Content-Type: application/json" \
  -d '{"command":"start","payload":{"mode":"regular"}}'

# Poll command (Lua perspective)
curl http://localhost:3000/api/devices/test-01/command

# Bulk inject cookies
curl -X POST http://localhost:3000/api/cookies/bulk-inject \
  -H "Content-Type: application/json" \
  -d '{"cookies":["_|WARNING...","..|WARNING..."]}'

# Get config
curl http://localhost:3000/api/settings

# Update config
curl -X PUT http://localhost:3000/api/settings \
  -H "Content-Type: application/json" \
  -d '{"pkg_name":"com.roblox.client","hop_interval":50,"endpoint_ps":"https://...","endpoint_interval":30}'
```

---

## 7. Troubleshooting

### Backend Port Already in Use
```bash
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### Lua Can't Reach Backend
- Verify IP address is correct (`ipconfig`)
- Check firewall allows port 3000
- Test: `ping 192.168.1.100` from RF Termux

### Device Shows "Offline" but Lua is Running
- Check Lua has correct BACKEND URL
- Verify `/api/devices/:id/status` endpoint is called
- Restart backend: `node server.js`

### Commands Not Received
- Ensure Lua is polling `/api/devices/:id/command`
- Check backend logs for errors
- Test endpoint manually: `curl http://localhost:3000/api/devices/rf-01/command`

### PS Links Not Distributed
- Click "Distribute" button first
- Check "Current Distribution" section shows devices
- Verify `GET /api/ps?device_id=rf-01` returns links

---

## 8. Production Deployment

### Build Frontend
```bash
cd frontend
npm run build
# Output: dist/ folder with minified assets
```

### Serve Static Files (Optional)
Add to `backend/server.js`:
```javascript
app.use(express.static(path.join(__dirname, "../frontend/dist")));
```

Then backend serves both API and frontend on port 3000.

### Firewall for Redfinger Cloud
If Redfinger is cloud-based, use:
- Ngrok: `ngrok http 3000` → get public URL
- Cloudflare Tunnel: `cloudflare tunnel`
- Update Lua `BACKEND` to the public URL

---

## 9. Offline Mode (Hopper v1.6)

### Scenario
Your PC running the backend shuts down or crashes. **What happens to the hopper in Redfinger?**

### Before v1.6
❌ Hopper stops immediately → Devices stop hopping

### With v1.6 (Offline Mode)
✅ **Hopper keeps running!**

### How It Works

1. **Normal Mode (Backend Online)**
   ```
   Hopper polls backend every 60 seconds
   ↓
   Backend responds with commands
   ↓
   Hopper executes (hop, start, stop, inject)
   ↓
   Display: [ONLINE]
   ```

2. **Backend Down Detected**
   ```
   Hopper tries to poll backend
   ↓
   Connection timeout/refused
   ↓
   is_offline = true
   ↓
   Load cached config (hop_interval, etc)
   ↓
   Display: [OFFLINE]
   ```

3. **Offline Mode (Backend Unreachable)**
   ```
   Hopper uses cached hop_interval (e.g., 50 minutes)
   ↓
   Keeps hopping automatically
   ↓
   Keeps running app if it crashes
   ↓
   Polls backend every 30s (faster retry)
   ↓
   Display: [OFFLINE]
   ```

4. **Backend Reconnects**
   ```
   Polling succeeds again
   ↓
   is_offline = false
   ↓
   Resume normal 60s polling
   ↓
   Can receive commands from dashboard again
   ↓
   Display: [ONLINE]
   ```

### Example Timeline

```
Time  Event                           Hopper Status
---------------------------------------------
8:00  Backend running                 ONLINE, hopping
8:30  PC crashes / backend down       Still hopping (offline mode)
8:31  Config cached locally           [OFFLINE] indicator
9:00  Backend still down              Still hopping with cached settings
9:15  PC restarted, backend online    Reconnected!
9:16  Now responsive to dashboard     ONLINE again
```

### What Gets Cached?

Hopper saves to `~/.hopper_config_cache`:
- `hop_interval` — minutes between hops
- `endpoint_ps` — (planned for future)
- `endpoint_interval` — (planned for future)

### Limitations in Offline Mode

- ❌ Cannot receive new commands from dashboard
- ❌ Cannot get updated PS links
- ❌ Cannot receive config changes
- ✅ But hopping continues with **last known settings**

### Use Cases

1. **Scheduled PC maintenance**
   - Stop backend → Hopper keeps running
   - Restart PC → Hopper reconnects automatically

2. **Internet outage**
   - Internet down → Hopper continues offline
   - Internet back → Hopper resumes syncing

3. **24/7 hopping without PC**
   - Run Lua script overnight
   - PC can shutdown
   - Hopper keeps going in offline mode

---

## 9. File Layout

```
AdoptMeAgent/
├── backend/
│   ├── server.js
│   ├── db.js              # Schema migration-safe
│   ├── routes/
│   │   ├── devices.js     # Device CRUD + polling
│   │   ├── ps.js          # PS pool + distribute
│   │   ├── cookies.js     # Cookie + bulk-inject
│   │   └── settings.js    # Global config (NEW)
│   ├── package.json
│   └── hopper.db          # Auto-created (gitignored)
├── frontend/
│   ├── src/
│   │   ├── App.jsx        # Sidebar nav (NEW)
│   │   ├── App.css        # GitHub dark theme
│   │   ├── api.js
│   │   └── components/
│   │       ├── Dashboard.jsx      # Stat cards + device list (NEW)
│   │       ├── PrivateServers.jsx # Pool + distribute (NEW)
│   │       ├── Cookies.jsx        # Bulk inject (NEW)
│   │       └── Config.jsx         # Global settings (NEW)
│   ├── package.json
│   └── vite.config.js
├── Hopper/
│   └── hopper.lua         # v1.5: polling + commands
├── MASTERPLAN.md
├── PROGRESS.md
└── GUIDE.md               # ← This file
```

---

## 10. Version History

**v2.0.0 + Hopper v1.6** (Current)
- **Backend:** Complete UI rewrite: WinterHub-style sidebar
  * Schema: ps_pool, global_config, device_ps simplified
  * New settings endpoint (replaces config route)
  * Bulk-inject cookies (1:1 distribution)
  * Dashboard: stat cards + device cards
  * Private Servers: pool + distribute + distribution view
  * Cookies: device list + bulk paste + inject
  * Config: package, hop interval, endpoint PS, endpoint interval

- **Hopper v1.6: Offline Mode** 🔥 NEW
  * ✅ Auto-detects when backend/PC is down
  * ✅ Caches config locally (hop_interval, etc)
  * ✅ **Continues hopping without backend** using cached settings
  * ✅ Auto-retry connect every 30s (faster reconnection)
  * ✅ Resumes normal operation when backend online
  * ✅ PC can shutdown/restart without stopping hopper!

**v1.5.0**
- Basic web backend + React MVP
- Device register + cookie + PS link per device
- Start/Stop/Inject commands

---

## Support

For issues:
- Check MASTERPLAN.md (project roadmap)
- Check API_NOTES.md (detailed API docs)
- Review git log: `git log --oneline`
