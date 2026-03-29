# PROGRESS — Adopt Me Farming Ecosystem
Last updated: 2026-03-29

---

## Status: Phase 0 Selesai — Hopper v1.4 siap di-test di RF

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

## Phase 1 — Web Hopper ⏳ BELUM MULAI

### Backend
- [ ] Setup Node.js + Express + SQLite
- [ ] Schema: devices, device_ps, device_cookies, ageup_config
- [ ] POST /api/device/register
- [ ] GET  /api/device/command/:id
- [ ] POST /api/device/status/:id
- [ ] Cookie store per device
- [ ] PS management: add/delete/distribute
- [ ] PS type: normal / ageup
- [ ] ageup_config: simpan username Potion Handler
      (untuk whitelist Collector → Potion Handler)
- [ ] Age Up Mode: redirect semua device ke ageup PS

### Frontend
- [ ] Setup React + Vite
- [ ] Device list + status monitor
- [ ] PS management UI
- [ ] Cookie inject UI
- [ ] Input username Potion Handler
- [ ] Age Up Mode + Resume button
- [ ] Global start / stop

### Lua (Termux)
- [ ] Polling: GET /api/device/command/:id via curl
- [ ] Execute command dari backend
- [ ] Report: POST /api/device/status/:id

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

## Hopper Lua v1.4 — Status

### Confirmed Work ✓
- Hop timer, join PS, watchdog, stop q+Enter
- Inject Ronix: _key.txt, Accept.lua, Trackstat.lua
- Menu: package, cookie, PS, hop interval, debug
- Cookie persist + format nick:pass:cookie

### Patch 4 (2026-03-29) — Belum di-test ⏳
- Cookie inject: preserve XML existing + restorecon SELinux fix
  → dijadwalkan test besok di RF

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

1. ~~Cookie inject Roblox~~ → Patch 4 sudah dibuat, **test besok di RF**
2. JWT localStorage key → cek F12 Console starpets.gg
3. Reprice + remove → HTTP Toolkit session lagi

---

## Next Actions
```
1. [RF]   Test hopper v1.4 cookie inject:
          curl -L "https://raw.githubusercontent.com/Fluxyyy333/AdoptMeAgent/main/Hopper/hopper.lua" -o ~/hopper.lua
          lua ~/hopper.lua
          → Verify: log "Cookie injected" + cek Roblox login
2. [RF]   Kalau cookie OK → konfirmasi, lanjut Phase 1 backend
3. [PC]   Cek localStorage JWT starpets.gg
4. [PC]   Capture reprice + remove di HTTP Toolkit
```
