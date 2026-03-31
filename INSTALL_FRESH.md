# Install Hopper di Redfinger Fresh (curl + mkdir)

Panduan untuk **Redfinger yang baru**, hanya sampai register device, kemudian setup cookie/package/PS dari web dashboard.

---

## PART 1: PC Setup (5 menit)

### Terminal 1: Start Backend
```bash
cd backend
node server.js
```

Expected output:
```
Backend running on http://localhost:3000
```

### Terminal 2: Start Frontend
```bash
cd frontend
npx vite
```

Expected output:
```
Local: http://localhost:5173
```

### Buka Browser
```
http://localhost:5173
```

Harusnya muncul **Hopper Dashboard** dengan sidebar (Dashboard, Private Servers, Cookies, Config).

---

## PART 2: Redfinger Termux Setup

### Step 1: Install Termux (jika belum)

Download dari Play Store atau F-Droid: **Termux**

### Step 2: Open Termux, Update & Install Dependencies

```bash
pkg update -y && pkg upgrade -y
```

Wait sampai selesai (bisa 1-2 menit).

```bash
pkg install curl -y
pkg install lua -y
```

Verify:
```bash
curl --version
lua -v
```

Expected output:
```
curl 7.85.0 (aarch64-unknown-linux-android)...
Lua 5.4.4  Copyright (C) 1994-2022...
```

### Step 3: Create Hopper Directory

```bash
mkdir -p /sdcard/hopper
cd /sdcard/hopper
pwd
```

Expected output:
```
/sdcard/hopper
```

### Step 4: Download hopper.lua via curl

```bash
curl -O https://raw.githubusercontent.com/Fluxyyy333/AdoptMeAgent/main/Hopper/hopper.lua
```

Verify file exists:
```bash
ls -la hopper.lua
```

Expected output:
```
-rw-r--r--  1 user user  45678 Jan 1 08:00 hopper.lua
```

### Step 5: Find Your PC's IP Address

**Di Windows PC, buka CMD:**
```cmd
ipconfig
```

Cari bagian "Ethernet adapter" atau "WiFi":
```
IPv4 Address. . . . . . . . . . : 192.168.1.100
```

**Catat IP ini: `192.168.1.100`** (sesuaikan dengan IP kamu)

### Step 6: Run Hopper for First Time

**Di Termux RF:**
```bash
cd /sdcard/hopper
lua hopper.lua
```

Menu akan muncul:
```
=== HOPPER v1.6 ===

Package : -
Account : -
PS      : 0
Hop     : OFF
IP/URL  : -
Device  : -

1. Set package
2. Set cookie
3. Kelola PS links
4. Set hop interval
5. START
6. Set server URL (advanced)
7. Set device ID
8. Set PC IP address (quick setup)
0. Keluar

Pilih >
```

### Step 7: Set Device ID & IP (Only These Two)

**Input: 8** (Set PC IP address)
```
Pilih > 8
=== SET PC IP ADDRESS ===

Cari IP PC di Windows:
  1. Buka CMD
  2. Ketik: ipconfig
  3. Lihat IPv4 Address (misal: 192.168.1.100)

IP address (contoh: 192.168.1.100) > 192.168.1.100
[+] Server URL: http://192.168.1.100:3000
```

Back to menu. **Input: 7** (Set device ID)
```
Pilih > 7
=== SET DEVICE ID ===

ID unik untuk device ini (misal: rf-01)

Device ID (kosong=batal) > rf-01
[+] Device ID: rf-01
[*] Registering with backend...
[+] Registered.
```

Output harusnya `[+] Registered.`

Menu kembali. **Input: 0** (Keluar)
```
Pilih > 0
Keluar.
```

Hopper selesai, kembali ke Termux prompt.

---

## PART 3: Check Dashboard (Web)

### Device Registered?

Buka browser:
```
http://localhost:5173
```

Dashboard tab, harusnya device **rf-01** sudah muncul dengan status **offline** atau **idle**.

### Device Card Shows:
```
rf-01
🔵 idle
ID: rf-01
PS: 0
Cookie: No
Hop: -
Seen: now
```

**Jika muncul, Register sukses!** ✅

---

## PART 4: Setup dari Dashboard Web (bukan Termux)

Sekarang setup **package, cookie, PS links dari dashboard**, tidak perlu kembali ke Termux menu.

### 4.1: Set Package

**Dashboard → Config tab:**
1. Scroll ke "Package Name"
2. Isi: `com.roblox.client`
3. Click "Save"

### 4.2: Set Cookie

**Dashboard → Cookies tab:**
1. Paste N cookies (satu per line)
   ```
   _|WARNING:-DO-NOT-SHARE-THIS...
   (paste more cookies here)
   ```
2. Click "Inject (N)"
3. Device akan terima command `inject_cookie`

Check Termux → hopper bisa detect command ini later

### 4.3: Add Private Servers

**Dashboard → Private Servers tab:**
1. Paste PS links (satu per line)
   ```
   https://www.roblox.com/games/920587237?privateServerLinkCode=abc123
   https://www.roblox.com/games/920587237?privateServerLinkCode=def456
   ```
2. Click "Add Links"
3. Set "Max PS per device" = 6
4. Click "Distribute"

### 4.4: Set Hop Interval

**Dashboard → Config tab:**
1. Scroll ke "Hop Interval"
2. Isi: `50` (minutes)
3. Click "Save"

---

## PART 5: Start Hopper (di Termux RF)

Sekarang device sudah register, dan package/cookie/PS sudah set dari web.

**Di Termux RF:**
```bash
cd /sdcard/hopper
lua hopper.lua
```

Menu muncul lagi. **Input: 5** (START)
```
Pilih > 5

[*] Injecting cookie...
[+] Cookie injected.
[*] Fetching account info...
[+] Account: YourRobloxName (12345)

[+] All injected.

========================
  HOPPER MONITOR v1.6
========================

Pkg    : com.roblox.client
PS     : 2 / 2
Status : RUNNING [ONLINE]
Crash  : 0
Runtime: 0m
Hop    : 0m / 50m

--- Log ---
[08:30:15] Hopper Started
[08:30:20] Launching PS 1/2
[08:30:45] Cookie injected

========================
[Ctrl+C] = STOP
OFFLINE MODE: Hopper continues with
cached settings when backend down
========================
```

**Hopper sudah jalan!** ✅

---

## PART 6: Monitor (Dashboard)

Refresh dashboard `http://localhost:5173`

Device **rf-01** harusnya:
- Status: **RUNNING** (green badge)
- PS: 2
- Cookie: Yes
- Hop: 0m / 50m (counting down)

Monitor setiap 15 detik auto-update.

---

## Summary

| Step | Where | What |
|------|-------|------|
| 1 | PC | Start backend & frontend |
| 2 | Termux RF | Install curl, lua |
| 3 | Termux RF | mkdir + curl download hopper.lua |
| 4 | Termux RF | Set device ID + IP address only |
| 5 | Web Dashboard | Set package, cookie, PS links |
| 6 | Termux RF | START hopper |
| 7 | Web Dashboard | Monitor device status |

**Tidak perlu Termux UI menu untuk cookie/package/PS!** Semua dari web dashboard.

---

## Important Commands Reference

### Termux Commands (untuk fresh install)
```bash
# Update & install dependencies
pkg update -y && pkg upgrade -y
pkg install curl -y
pkg install lua -y

# Create directory
mkdir -p /sdcard/hopper
cd /sdcard/hopper

# Download hopper.lua
curl -O https://raw.githubusercontent.com/Fluxyyy333/AdoptMeAgent/main/Hopper/hopper.lua

# Verify file
ls -la hopper.lua

# Run hopper
lua hopper.lua
```

### Menu Options (di hopper.lua)
```
8 = Set PC IP address
7 = Set device ID
5 = START
0 = Exit
```

### File Locations (after setup)
```bash
/sdcard/hopper/              # hopper directory
/sdcard/hopper_log.txt       # Log file
/sdcard/.hopper_device_id    # Device ID
/sdcard/.hopper_server       # Server URL/IP
```

---

## Troubleshooting

### Device tidak muncul di dashboard
- Wait 10 detik
- Refresh browser (F5)
- Check backend running: `node server.js` di PC

### Can't reach backend
- Check IP address di Windows: `ipconfig`
- Set IP lagi dari menu 8
- Test ping: `ping 192.168.1.100`
- Open firewall port 3000 di PC

### Hopper jalan tapi status offline di dashboard
- Wait 30 detik (status update setiap 30s)
- Check log: `tail -f /sdcard/hopper_log.txt`

### Package/cookie/PS tidak terdeteksi
- Set dari dashboard web (lebih mudah)
- Atau set dari Termux menu (1, 2, 3)
- Check dashboard refresh

---

## Next (Optional)

### Offline Mode Testing
1. Hopper jalan dengan hop interval 50 menit
2. Matikan backend: `Ctrl+C` di terminal backend
3. Lihat hopper Termux → akan switch `[OFFLINE]`
4. Hopper tetap hop
5. Start backend lagi: `node server.js`
6. Hopper auto-reconnect → `[ONLINE]`

**PC bisa shutdown, hopper tetap jalan!** 🚀

---

**Selesai! Hopper ready untuk production.** ✅
