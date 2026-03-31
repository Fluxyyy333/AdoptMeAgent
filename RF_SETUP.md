# Redfinger Termux Setup Guide

## Step 1: Install Dependencies

Buka **Termux** di Redfinger dan jalankan commands ini:

### Update Package Manager
```bash
pkg update -y && pkg upgrade -y
```

### Install curl (untuk HTTP request)
```bash
pkg install curl -y
```

Verify:
```bash
curl --version
```

Should output something like:
```
curl 7.85.0 (aarch64-unknown-linux-android) libcurl/7.85.0...
```

### Install Lua (untuk menjalankan hopper.lua)
```bash
pkg install lua -y
```

Verify:
```bash
lua -v
```

Should output:
```
Lua 5.4.4  Copyright (C) 1994-2022 Lua.org, PUC-Rio
```

### Install Git (optional, untuk clone repo)
```bash
pkg install git -y
```

---

## Step 2: Create Hopper Directory

```bash
# Navigate ke sdcard
cd /sdcard

# Create directory
mkdir -p hopper

# Go into directory
cd hopper

# Verify
pwd
# Output: /sdcard/hopper

# List files
ls -la
# Should be empty
```

---

## Step 3: Get hopper.lua File

### Option A: Clone from GitHub (Recommended)

```bash
cd /sdcard
git clone https://github.com/Fluxyyy333/AdoptMeAgent.git
cp AdoptMeAgent/Hopper/hopper.lua /sdcard/hopper/
```

### Option B: Download via curl

```bash
cd /sdcard/hopper
curl -O https://raw.githubusercontent.com/Fluxyyy333/AdoptMeAgent/main/Hopper/hopper.lua
```

### Option C: Manual Copy via ADB (dari PC)

```bash
# Di Windows PC, jalankan:
adb push hopper.lua /sdcard/hopper/
```

---

## Step 4: Verify Setup

```bash
cd /sdcard/hopper
ls -la
# Should show:
# -rw-r--r-- ... hopper.lua

# Test run
lua hopper.lua
```

Should show menu:
```
=== HOPPER v1.6 ===

Package : -
Account : -
PS      : 0
Hop     : OFF
Server  : -
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

If ini muncul, **setup berhasil!** ✅

---

## Step 5: Configure Hopper (dari Menu)

Dari menu di atas, ikuti langkah ini:

### 5.1: Set PC IP Address (Option 8 - NEW!)

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

**Tidak perlu nano/edit file lagi!** Langsung set dari menu.

### 5.2: Set Package (Option 1)

```
Pilih > 1
=== SET PACKAGE ===

Package tersedia:
  1. com.facebook.katana
  2. com.roblox.client
  ... (list packages)

Nomor / nama (kosong=batal) > 2
[+] Package: com.roblox.client
```

### 5.3: Set Cookie (Option 2)

```
Pilih > 2
=== SET COOKIE ===

Paste .ROBLOSECURITY (kosong=batal):

_|WARNING:-DO-NOT-SHARE-THIS...
[+] Cookie disimpan.
[*] Fetching account info...
[+] Account: YourName (12345)
```

### 5.4: Kelola PS Links (Option 3)

```
Pilih > 3
=== PS LINKS ===

  (kosong)

1=Tambah  2=Hapus  3=Clear  0=Kembali

Pilih > 1
Paste link (kosong=selesai):

https://www.roblox.com/games/920587237?privateServerLinkCode=abc123
  [+] 1
https://www.roblox.com/games/920587237?privateServerLinkCode=def456
  [+] 2
(blank line to finish)
[+] 2 ditambahkan.
```

### 5.5: Set Hop Interval (Option 4)

```
Pilih > 4
=== SET HOP INTERVAL ===

Saat ini: OFF

Hop tiap berapa menit? (0=OFF) > 50
[+] Hop: 50m
```

### 5.6: Set Device ID (Option 7)

```
Pilih > 7
=== SET DEVICE ID ===

ID unik untuk device ini (misal: rf-01)

Device ID (kosong=batal) > rf-01
[+] Device ID: rf-01
[*] Registering with backend...
[+] Registered.
```

---

## Step 6: START Hopper

```
(kembali ke menu utama)

=== HOPPER v1.6 ===

Package : com.roblox.client
Account : YourName (12345)
PS      : 2
Hop     : 50m
IP/URL  : 192.168.1.100
Device  : rf-01

Pilih > 5
[*] Hopper running... Ctrl+C to stop
```

Hopper sudah berjalan! ✅

---

## Monitor Hopper

Display akan update setiap 15 detik:

```
========================
  HOPPER MONITOR v1.6
========================

Pkg    : com.roblox.client
PS     : 1 / 2
Status : RUNNING [ONLINE]
Crash  : 0
Runtime: 5m
Hop    : 12m / 50m

--- Log ---
[08:30:15] Hopper Started
[08:30:20] Launching PS 1/2
[08:30:45] Cookie injected
[08:31:00] Hopping every 50 minutes

========================
[Ctrl+C] = STOP
OFFLINE MODE: Hopper continues with
cached settings when backend down
========================
```

---

## Offline Mode (v1.6 Feature)

Jika PC/backend mati:

1. Hopper detect backend unreachable
2. Switch to **[OFFLINE]** mode
3. **Tetap hopping** dengan cached settings
4. Coba reconnect setiap 30 detik
5. Saat PC/backend hidup lagi → balik **[ONLINE]**

**PC bisa shutdown, hopper tetap jalan!** 🚀

---

## Troubleshooting

### Termux can't install packages
```
# Try clear cache
pkg clean

# Then retry
pkg install lua -y
```

### curl not found
```
# Reinstall
pkg install curl -y

# Verify
curl --version
```

### hopper.lua not found
```bash
ls -la /sdcard/hopper/
# If empty, download again:
cd /sdcard/hopper
curl -O https://raw.githubusercontent.com/Fluxyyy333/AdoptMeAgent/main/Hopper/hopper.lua
```

### Can't reach backend (IP address wrong)
1. Check IP PC di Windows: `ipconfig`
2. Set IP dari menu option 8
3. Test ping dari Termux: `ping 192.168.1.100`
4. If timeout, check firewall di PC (port 3000 harus open)

### Device not showing in dashboard
1. Wait 10 seconds for registration
2. Check backend running: `node server.js`
3. Refresh browser: `F5`
4. Check hopper log di Termux: lihat `[+] Registered` message

---

## Files & Config

Config tersimpan di:
```
/sdcard/.hopper_pkg           ← Package name
/sdcard/.hopper_cookie        ← Cookie
/sdcard/.hopper_hop           ← Hop interval
/sdcard/.hopper_device_id     ← Device ID
/sdcard/.hopper_server        ← Server URL/IP
/sdcard/.hopper_config_cache  ← Offline mode cache (NEW v1.6)
/sdcard/private_servers.txt   ← PS links list
/sdcard/hopper_log.txt        ← Log file
```

Jika mau reset, hapus files:
```bash
rm /sdcard/.hopper_*
```

---

## Quick Command Reference

```bash
# Navigate ke hopper
cd /sdcard/hopper

# Run hopper
lua hopper.lua

# View log
tail -f hopper_log.txt

# Check Roblox running
su -c 'pidof com.roblox.client'

# View hopper config
cat /sdcard/.hopper_*
```

---

## Next Steps

1. **Dashboard Setup (PC)**: http://localhost:5173
2. **Register Device**: Dashboard → "+ Add Device"
3. **Add PS Links**: Private Servers tab → paste links
4. **Inject Cookie**: Cookies tab → paste → Inject
5. **Test Commands**: Start/Endpoint/Stop buttons
6. **Monitor**: Watch hopper in Termux, see [ONLINE] or [OFFLINE]

---

**Setup selesai!** Hopper siap 24/7 🚀
