# PROGRESS — Adopt Me Farming Ecosystem
Last updated: 2026-03-30

---

## Status: Phase 1 MVP SELESAI — Backend + Frontend + Lua Polling

---

## Phase 0 — Research & Setup ✓ SELESAI

- [x] Research Starpets API via HTTP Toolkit
- [x] Confirmed: market.apineural.com tanpa Cloudflare
- [x] Confirmed: Auth Bearer JWT Token
- [x] Endpoint inventory, list item, store terpetakan
- [x] Arsitektur 3 modul final
- [x] Pipeline final: Hopper → Collector → Potion Handler (manual) → Storage
- [x] Potion Handler: manual di emulator, bukan akun RF
- [x] Collector: buffer tanpa limit, filter reject non-neon
- [x] Storage: hold mega, transfer ke Starpets manual (later)
- [x] Mega Maker dihandle oleh Potion Handler (script utility)
- [x] Switch: manual only
- [x] Hopper Lua v1.4 running stabil di RF

---

## Phase 1 — Web Hopper ✓ MVP SELESAI

### Backend ✓
- [x] Setup Node.js + Express + SQLite
- [x] Schema: devices, device_ps, device_cookies, ageup_config, device_commands
- [x] POST /api/devices/register
- [x] GET  /api/devices/:id/command (polling)
- [x] POST /api/devices/:id/status
- [x] Cookie store per device + auto queue inject_cookie
- [x] PS management: add/delete per device
- [x] PS type: normal / ageup
- [x] ageup_config: simpan username Potion Handler
- [x] Age Up Mode + Resume: switch semua device sekaligus
- [x] Auto-offline detection (>2 menit tidak poll)

### Frontend ✓
- [x] Setup React + Vite (dark theme)
- [x] Device list + status + last seen
- [x] Register device dari UI
- [x] Send commands: Start / Stop / Inject All
- [x] Cookie set + inject dari UI
- [x] PS management per device (add/delete, normal/ageup)
- [x] Input username Potion Handler
- [x] Age Up Mode + Resume button

### Lua (Termux) ✓
- [x] Hopper v1.5: web backend integration
- [x] Polling: GET /api/devices/:id/command tiap 60 detik
- [x] Execute remote commands (stop, inject_cookie, inject_all, set_mode)
- [x] Report status: POST /api/devices/:id/status
- [x] Auto register on startup
- [x] Menu: set server URL + device ID

### Belum Ada / Known Gaps
- [ ] Auth/security di backend (jangan expose tanpa VPN)
- [ ] Bulk PS distribute (saat ini per-device)
- [ ] Global start/stop button di frontend
- [ ] Log viewer per device di frontend

---

## Phase 2 — Starpets ⏳ BELUM MULAI

- [ ] Chrome extension: Manifest V3 + JWT extract
- [ ] Backend: JWT store, inventory, list, reprice
- [ ] Frontend: akun list, inventory, bulk reprice

---

## Phase 3 — Switch + Polish ⏳ BELUM MULAI

- [ ] Cookie folder A/B + switch manual
- [ ] Unified dashboard
- [ ] Bug fix end-to-end

---

## Hopper Lua — Version History

### v1.4 — v1.4.2 ✓ CONFIRMED
- Hop timer, join PS, watchdog, crash recovery
- Inject Ronix: key, autoexec, trackstat
- Cookie inject: shared_prefs + WebView sqlite3
- Menu UI, hop persist, PS resume, account info fetch

### v1.4.3 (2026-03-30) ✓
- Fix io.popen → temp file (fixes dead input after cookie inject)
- Fix Ctrl+C detection via isleep (Lua 5.1+5.3 compat)

### v1.5 (2026-03-30) ⏳ TESTING
- Web backend integration: register, poll, status report
- Menu: set server URL + device ID
- Poll commands tiap 60 detik selama hopper running
- Handle remote commands: stop, inject_cookie, inject_all, set_mode

---

## Starpets API — Status

### Confirmed ✓
```
GET  /api/v2/inventory/items/{userId}
GET  /api/v2/store/items/u/{userId}/c/u..
POST /api/store/items/add
GET  /api/user/store/link
GET  /api/store/commission  (25%)
```

### Belum Captured ⚠️
```
- Reprice + remove listing
- JWT expire time + localStorage key
```

---

## Blockers Aktif

1. ~~Cookie inject Roblox~~ → **SELESAI v1.4.1** ✓
2. JWT localStorage key → cek F12 Console starpets.gg
3. Reprice + remove → HTTP Toolkit session lagi

---

## Next Actions
```
1. [PC]   Mulai Phase 1 backend: Node.js + Express + SQLite setup
2. [PC]   Cek localStorage JWT starpets.gg
3. [PC]   Capture reprice + remove di HTTP Toolkit
```
