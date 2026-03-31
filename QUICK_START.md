# Quick Start — Adopt Me Hopper v2.0

## Setup PC (5 menit)

### Terminal 1: Backend
```bash
cd backend
node server.js
# Backend running on http://localhost:3000
```

### Terminal 2: Frontend
```bash
cd frontend
npx vite
# Local: http://localhost:5173
```

Open browser: **`http://localhost:5173`**

---

## Setup RF (Redfinger) — First Time

**Detailed guide:** See [RF_SETUP.md](RF_SETUP.md) for complete setup with mkdir, curl, package install

### Quick: Jalankan Hopper (RF Termux)

```bash
cd /sdcard/hopper
lua hopper.lua
```

Menu akan muncul. **Isi langsung dari menu (v1.6.1+):**

```
1. Set package           → com.roblox.client
2. Set cookie           → paste .ROBLOSECURITY
3. Kelola PS links      → paste PS links
4. Set hop interval     → e.g., 50 menit
8. Set PC IP address    → e.g., 192.168.1.100 (NEW!)
7. Set device ID        → e.g., rf-01
5. START
```

**No nano editing needed!** Semua dari menu interaktif.

---

### IP Address Setup (New in v1.6.1)

1. **Cari IP PC:**
   ```bash
   # Windows CMD
   ipconfig
   # Catat IPv4 Address, e.g., 192.168.1.100
   ```

2. **Set di hopper menu (option 8):**
   ```
   Pilih > 8
   IP address (contoh: 192.168.1.100) > 192.168.1.100
   [+] Server URL: http://192.168.1.100:3000
   ```

Done! Tidak perlu nano lagi.

---

## Dashboard Control (PC Browser)

### Register Device
Dashboard → "+ Add Device" → ID: `rf-01`, Name: `Redfinger 1` → Register

### Add Private Servers
Private Servers tab → Paste PS links → "Max per device: 6" → Distribute

### Inject Cookies
Cookies tab → Paste N cookies → "Inject (N)"

### Config
Config tab → Set Package, Hop Interval, End Point PS Link → Save

---

## Commands (Dashboard)

| Button | Action | Hopper Does |
|--------|--------|-----------|
| **Start** | Regular hopper | Hop every X minutes, then go to endpoint PS |
| **Endpoint** | Direct to endpoint PS | Skip hopping, go straight to pabrik besar |
| **Stop** | Stop hopper | Stop immediately, stay offline |
| **Del** | Delete device | Remove from dashboard |

---

## Offline Mode (NEW v1.6)

### Scenario
PC mati → Backend down → What happens?

### Answer ✅
**Hopper tetap jalan!**

### How
1. Hopper detect backend unreachable
2. Switch to OFFLINE mode
3. Keep hopping dengan cached settings (hop_interval terakhir)
4. Display: `[OFFLINE]`
5. Coba reconnect setiap 30 detik
6. Saat backend online lagi → balik ONLINE mode

### Contoh
```
8:00  Backend running          → hopper [ONLINE], hopping
8:30  PC crash, backend down   → hopper [OFFLINE], tetap hopping
8:45  Still offline            → hopper [OFFLINE], tetap hopping
9:00  Backend restart          → hopper reconnect
9:05  Connected                → hopper [ONLINE] again
```

**PC bisa shutdown, hopper tetap jalan!** 🚀

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Hopper can't reach backend | Check IP address (`ipconfig`), firewall port 3000 open |
| Device shows offline | Wait 10s, refresh browser |
| Commands not received | Lua must be polling (`Polling...` msg visible) |
| Offline mode stuck | Manual restart: stop Lua (`Ctrl+C`), start again |

---

## Important Files

```
AdoptMeAgent/
├── backend/          ← Node.js + Express server
├── frontend/         ← React dashboard
├── Hopper/
│   └── hopper.lua    ← v1.6 with offline mode
├── GUIDE.md          ← Full documentation
└── QUICK_START.md    ← This file
```

---

## Versions

- **v2.0.0** — Dashboard v2 (WinterHub sidebar, settings, bulk-inject)
- **Hopper v1.6** — Offline mode (auto-continue when backend down)

---

## Next

1. Test offline mode: Stop backend saat hopper running, see `[OFFLINE]`
2. Setup 24/7: PC bisa shutdown, hopper tetap jalan
3. Check GUIDE.md untuk detail lengkap

---

**Questions?** Check GUIDE.md atau git log.
