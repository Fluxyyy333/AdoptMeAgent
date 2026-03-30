# GUIDE — Adopt Me Hopper Dashboard Setup & Testing

## Architecture
```
[Windows Server / PC]
  ├── backend/   (Node.js + Express + SQLite)  → port 3000
  ├── frontend/  (React + Vite)                → port 5173 (dev)
  └── Hopper/    (hopper.lua)                  → di Termux tiap device RF
```

Device Lua script poll backend tiap 60 detik untuk ambil command.
Frontend akses backend via API proxy (vite dev) atau langsung (production).

---

## 1. Setup Backend (di PC / Windows Server)

### Prerequisites
- Node.js v18+
- npm

### Install & Run
```bash
cd backend
npm install
node server.js
```
Output: `Backend running on http://localhost:3000`

### Verifikasi
```bash
curl http://localhost:3000/api/devices
# Harus return: []

curl http://localhost:3000/api/config
# Harus return: {"id":1,"potion_handler_username":"","updated_at":0}
```

---

## 2. Setup Frontend (di PC / Windows Server)

### Install & Run
```bash
cd frontend
npm install
npm run dev
```
Output: `Local: http://localhost:5173/`

Buka browser ke `http://localhost:5173` → Hopper Dashboard.

### Production Build (opsional)
```bash
cd frontend
npm run build
```
File statis di `frontend/dist/` — bisa serve dari Express nanti.

---

## 3. Setup Lua di Termux (tiap device Redfinger)

### Prerequisites
- Termux terinstall + rooted
- `pkg install lua54 curl`
- File `hopper.lua` sudah ada di device (push via git / manual copy)

### Jalankan
```bash
cd /sdcard
lua54 hopper.lua
```

### Konfigurasi pertama kali
Dari menu Hopper:
1. **Set package** (pilih `1`) → pilih Roblox package dari list
2. **Set cookie** (pilih `2`) → paste .ROBLOSECURITY cookie
3. **Kelola PS links** (pilih `3`) → tambah PS link
4. **Set hop interval** (pilih `4`) → misal `50` (menit)
5. **Set server URL** (pilih `6`) → `http://IP_PC:3000`
6. **Set device ID** (pilih `7`) → `rf-01` (unik per device)
7. **START** (pilih `5`)

> **PENTING**: Server URL harus IP yang bisa dijangkau dari Redfinger.
> Kalau PC di jaringan lokal, pakai IP LAN (misal `192.168.1.100`).
> Kalau Redfinger cloud, harus pakai IP publik / tunneling.

---

## 4. Firewall

Backend perlu port 3000 terbuka supaya device RF bisa akses.

Windows:
```powershell
netsh advfirewall firewall add rule name="Hopper Backend" dir=in action=allow protocol=tcp localport=3000
```

---

## 5. Testing Guide

### Test A: Backend API (dari PC)

```bash
# Register device
curl -X POST http://localhost:3000/api/devices/register \
  -H "Content-Type: application/json" \
  -d '{"id":"test-01","name":"Test Device","pkg_name":"com.roblox.client"}'

# List devices → harus muncul test-01
curl http://localhost:3000/api/devices

# Add PS link
curl -X POST http://localhost:3000/api/ps \
  -H "Content-Type: application/json" \
  -d '{"device_id":"test-01","ps_link":"https://www.roblox.com/games/920587237?privateServerLinkCode=abc123","ps_type":"normal"}'

# List PS links
curl http://localhost:3000/api/ps?device_id=test-01

# Send command to device
curl -X POST http://localhost:3000/api/devices/test-01/command \
  -H "Content-Type: application/json" \
  -d '{"command":"start"}'

# Poll command (simulates Lua polling)
curl http://localhost:3000/api/devices/test-01/command
# Harus return: {"command":"start","payload":{}}

# Poll lagi → harus return none
curl http://localhost:3000/api/devices/test-01/command
# Harus return: {"command":"none"}

# Set cookie
curl -X POST http://localhost:3000/api/cookies \
  -H "Content-Type: application/json" \
  -d '{"device_id":"test-01","cookie":"_|WARNING_FAKE_COOKIE","roblox_username":"TestUser","roblox_id":"12345"}'

# Age Up Mode → all devices switch to ageup
curl -X POST http://localhost:3000/api/config/ageup-mode

# Resume → all devices back to normal
curl -X POST http://localhost:3000/api/config/resume

# Set potion handler username
curl -X PUT http://localhost:3000/api/config \
  -H "Content-Type: application/json" \
  -d '{"potion_handler_username":"MyPotionHandler"}'

# Verify config
curl http://localhost:3000/api/config

# Cleanup
curl -X DELETE http://localhost:3000/api/devices/test-01
```

### Test B: Frontend UI (di browser)

1. Buka `http://localhost:5173`
2. **Tab Devices:**
   - Klik "+ Add Device" → isi ID `rf-01`, name `Redfinger 1` → Register
   - Device muncul dengan status `idle`
   - Klik "Set Cookie" → paste cookie → Save & Inject
   - Klik Start/Stop/Inject All → harus show alert "Command queued"
   - Klik "Age Up Mode" → semua device status jadi AGEUP badge
   - Klik "Resume" → badge hilang
3. **Tab PS Links:**
   - Pilih device dari dropdown
   - Add PS link → muncul di tabel
   - Delete → link hilang
   - Test tipe normal dan ageup
4. **Tab Config:**
   - Set potion handler username → Save → muncul "Saved: ..."

### Test C: Lua ↔ Backend (di Termux)

1. Jalankan `lua54 hopper.lua`
2. Set server URL (menu 6) → `http://IP_PC:3000`
3. Set device ID (menu 7) → `rf-01`
   - Harus muncul "[+] Registered."
4. Cek dashboard frontend → device `rf-01` harus muncul
5. Dari dashboard, klik "Set Cookie" → paste cookie → Save
6. Di Termux, START hopper (menu 5)
7. Cek dashboard → status harus berubah ke `running`
8. Dari dashboard, send "Stop" command
9. Tunggu ~60 detik (polling interval) → hopper harus stop

### Test D: Auto-offline Detection

1. Register device via Lua, START hopper
2. Kill Termux (force close)
3. Tunggu ~2 menit
4. Cek dashboard → status harus berubah ke `offline`

---

## 6. File Layout

```
AdoptMeAgent/
├── backend/
│   ├── server.js          # Express server entry
│   ├── db.js              # SQLite schema + init
│   ├── routes/
│   │   ├── devices.js     # Device CRUD + command polling
│   │   ├── ps.js          # PS link management
│   │   ├── cookies.js     # Cookie store + inject
│   │   └── config.js      # Age Up config + mode switch
│   ├── package.json
│   └── hopper.db          # Auto-created (gitignored)
├── frontend/
│   ├── src/
│   │   ├── App.jsx        # Main app + tab navigation
│   │   ├── App.css        # Dark theme styles
│   │   ├── api.js         # API helper (get/post/put/del)
│   │   └── components/
│   │       ├── Devices.jsx    # Device list + register + commands
│   │       ├── PSManager.jsx  # PS link CRUD per device
│   │       └── Config.jsx     # Potion handler config
│   └── vite.config.js     # Proxy /api → localhost:3000
├── Hopper/
│   └── hopper.lua         # v1.5: standalone + web backend polling
├── MASTERPLAN.md
├── PROGRESS.md
└── GUIDE.md               # ← file ini
```

---

## 7. API Reference

| Method | Endpoint | Body | Description |
|--------|----------|------|-------------|
| POST | /api/devices/register | {id, name, pkg_name} | Register/update device |
| GET | /api/devices | - | List all devices |
| GET | /api/devices/:id | - | Get single device |
| DELETE | /api/devices/:id | - | Delete device |
| GET | /api/devices/:id/command | - | Poll next command (Lua) |
| POST | /api/devices/:id/command | {command, payload} | Queue command |
| POST | /api/devices/:id/status | {status, hop_min, pkg_name} | Report status (Lua) |
| GET | /api/ps?device_id=x | - | List PS links |
| POST | /api/ps | {device_id, ps_link, ps_type} | Add PS link |
| DELETE | /api/ps/:id | - | Delete PS link |
| PUT | /api/ps/:id | {ps_type, active} | Update PS link |
| GET | /api/cookies?device_id=x | - | List cookies |
| POST | /api/cookies | {device_id, cookie, ...} | Set cookie + queue inject |
| DELETE | /api/cookies/:id | - | Delete cookie |
| GET | /api/config | - | Get ageup config |
| PUT | /api/config | {potion_handler_username} | Update config |
| POST | /api/config/ageup-mode | - | Switch all to ageup |
| POST | /api/config/resume | - | Resume normal mode |

---

## 8. Known Limitations

- Lua Ctrl+C stop belum 100% reliable di semua Termux build
- Cookie inject bisa bikin input mati di versi lama (fixed v1.4.3 via temp file)
- Polling interval 60 detik → command delay max 1 menit
- Belum ada auth di backend → jangan expose ke internet tanpa VPN/tunnel
- Database di-auto-create, backup manual jika perlu
