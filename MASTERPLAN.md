# MASTERPLAN — Adopt Me Farming Ecosystem

## Overview
Centralized web-based management system untuk Adopt Me farming.
3 modul dalam 1 dashboard. Personal use, tidak dipublikasi.
Server: Windows Server 2019 RDP (24/7).
Device: Redfinger cloud Android + Termux + Lua.

---

## Tech Stack
```
Backend   : Node.js + Express
Database  : SQLite (better-sqlite3)
Frontend  : React + Vite
Extension : Chrome Extension Manifest V3
Device    : Termux Lua script di Redfinger (RF)
```

---

## Farming Pipeline — Full Flow

### Pet Evolution Chain
```
Normal pet age 1-6
4x Normal age 6  →  Neon age 1-6
4x Neon age 6    →  Mega (max)
```

### Pipeline
```
HOPPER SERVERS (semua PS normal)
  Farmer akun
  → harvest age 6 saja
  → trade ke Hopper akun

  Hopper akun
  → auto neon (4 normal age 6 = 1 neon age 1)
  → auto trade neon age 1 ke Collector
    (kalau Collector tidak merespon → hold, coba lagi)

AGE UP SERVER (1 PS khusus, centralized)

  [Role: Collector] — 1-2 akun RF
  → auto accept neon age 1 dari semua hopper
  → filter: tolak pet non-neon atau age < 6
  → buffer neon tanpa batas stok
  → auto trade ke Potion Handler
    (username Potion Handler diinput manual di dashboard)

  [Manual — kamu di emulator 4-8 tab]
  Potion Handler
  → terima neon age 1 dari Collector
  → age up potion neon 1 → 6
  → auto mega (4 neon age 6 = 1 mega)
  → auto trade mega ke Storage
    (username Storage diinput di script config)

  [Role: Storage] — 1-2 akun RF
  → auto accept mega dari Potion Handler
  → hold mega sampai siap di-listing di Starpets
  → transfer ke Starpets akun (manual, dikerjakan belakangan)
```

### Handler Kondisi Khusus
```
Potion Handler sedang tidak aktif (kamu offline):
  Collector terus terima + buffer neon dari hopper
  → tidak ada yang perlu dilakukan
  → begitu kamu aktif → Collector langsung drain buffer

Pet di bawah age 6 / non-neon masuk ke Collector:
  Collector filter reject otomatis (script utility config)
  → dikembalikan ke pengirim (hopper)
  → tidak ganggu pipeline
```

---

## Modul 1 — WEB HOPPER

### Konsep
Control terpusat untuk hopper Roblox di multiple RF device.
Device polling ke backend tiap 60 detik untuk ambil command.

### Status Hopper Lua v1.4
```
[OK]  Hop timer via os.time()
[OK]  Join PS via intent scheme
[OK]  Watchdog crash recovery
[OK]  Stop via q + Enter
[OK]  Inject Ronix: _key.txt, Accept.lua, Trackstat.lua
[OK]  Menu-based UI
[OK]  Package persist
[OK]  PS links management
[OK]  Cookie persist + format nick:pass:cookie
[???] Cookie inject ke RobloxSharedPreferences.xml
      → akan diselesaikan di chat terpisah
```

### Fitur Web

**Device Management**
- Register device baru
- Status per device: online / offline / running / idle
- Last seen timestamp

**PS Management**
- Tambah / hapus PS links
- PS Type:
  - `normal` — rotation hop biasa
  - `ageup`  — Age Up Server, tidak ikut rotation
- Distribusi otomatis PS ke device

**Account Management**
- Cookie store per device
  - Format: cookie langsung atau nick:pass:cookie
- Age Up Server akun:
  - Collector: input cookie akun RF
  - Storage: input cookie akun RF
  - Potion Handler username: input manual
    (untuk whitelist auto trade dari Collector)

**Script Manager**
- Inject Ronix key ke semua device
- Inject autoexec ke semua device

**Age Up Mode**
- Tombol "Age Up Mode":
  semua device redirect ke Age Up PS sekaligus
- Tombol "Resume": kembali ke rotation normal

**Monitor**
- Status per device: PS aktif, crash count, runtime
- Log per device
- Global start / stop

### Flow Device (Lua Termux)
```
1. Poll: GET /api/device/command/{id}  (tiap 60 detik)
2. Execute command
3. Report: POST /api/device/status/{id}
```

### File Paths di RF
```
~/private_servers.txt
~/.hopper_pkg
~/.hopper_cookie
~/.hopper_stop
/sdcard/hopper_log.txt
/storage/emulated/0/RonixExploit/internal/_key.txt
/storage/emulated/0/RonixExploit/autoexec/Accept.lua
/storage/emulated/0/RonixExploit/autoexec/Trackstat.lua
```

---

## Modul 2 — STARPETS MANAGER
*Prioritas rendah — dikerjakan setelah Modul 1 optimal*

### Konsep
Manage listing dan pricing di starpets.gg via API.
1 Chrome profile = 1 akun Starpets.
Target: 5-8 Chrome profile, ~50 akun.

### API
```
Base URL  : https://market.apineural.com
Auth      : Authorization: Bearer {JWT}
Cloudflare: TIDAK ada di API layer ✓
```

### Endpoints Confirmed
```
GET  /api/v2/inventory/items/{userId}
GET  /api/v2/store/items/u/{userId}/c/u..
POST /api/store/items/add
     { linkedRobloxAccountId, items:[{id, price}] }
GET  /api/user/store/link
GET  /api/store/commission   (25%)
GET  /api/inventory/items/purchased
```

### Endpoints Belum Captured
```
- Reprice item on sale
- Remove / unlist item
- Add akun via cookie
- Error response JWT invalid
```

### Chrome Extension
- Extract JWT dari tab starpets.gg
- Kirim JWT ke backend

### Fitur Web (MVP)
- Add akun via JWT extract
- Load inventory per akun
- Bulk list + bulk reprice
- Remove listing
- Freeze / relink akun

---

## Modul 3 — SWITCH (MANUAL)
*Dikerjakan setelah Modul 1 dan 2 stabil*

### Konsep
Pindahkan akun antara Hopper dan Starpets secara manual.

### Folder
```
Folder A → akun Starpets
Folder B → akun Hopper
```

### Fitur
- Preview sebelum execute
- Execute switch
- History log

---

## Database Schema
```sql
devices (
  id, name, status, last_seen, pkg_name, hop_min, mode
)
device_ps (
  id, device_id, ps_link,
  ps_type,   -- 'normal' | 'ageup'
  active
)
device_cookies (
  id, device_id, cookie,
  roblox_username, roblox_id,
  account_type
  -- 'farmer' | 'hopper' | 'collector' | 'storage'
)
ageup_config (
  id, potion_handler_username,
  -- username Roblox akun Potion Handler (manual di emu)
  -- untuk whitelist auto trade dari Collector
  updated_at
)
starpets_accounts (
  id, roblox_id, jwt_token, jwt_expires,
  store_id, status, folder
)
cookie_folders (
  id, name, folder_type, capacity
)
switch_log (
  id, triggered_by, accounts_switched, timestamp, notes
)
```

---

## Development Phases

### Phase 1 — Web Hopper (PRIORITAS UTAMA)
Hari 1-2:
- Project setup: Node.js + Express + SQLite + React + Vite
- Backend: device registry, polling, command dispatch
- Backend: cookie store, PS management (normal + ageup)
- Backend: ageup_config (simpan username Potion Handler)
- Lua: tambah HTTP polling ke backend
- Frontend: device dashboard, PS management
- Frontend: Age Up Mode + Resume button
- Frontend: input username Potion Handler

### Phase 2 — Starpets
Hari 3:
- Chrome extension: JWT extractor
- Backend: inventory, list, reprice wrapper
- Frontend: akun list, inventory, bulk reprice

### Phase 3 — Switch + Polish
Hari 4-5:
- Cookie folder A/B + switch manual
- Unified dashboard
- Bug fix, edge cases

---

## Development Rules
1. MVP dulu, polish belakangan
2. Satu fitur selesai dan tested sebelum lanjut
3. Tidak scope creep tanpa diskusi
4. Semua API call harus ada error handling
5. Log operasi penting ke database
