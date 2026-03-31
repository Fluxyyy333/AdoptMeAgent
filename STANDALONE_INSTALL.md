# Standalone Hopper v1.7 - Super Simple Install

## Step 1: Install Lua
```bash
pkg install lua54
```
Tunggu sampai selesai.

## Step 2: Download Hopper
```bash
mkdir -p ~/scripts
curl -sL https://raw.githubusercontent.com/Fluxyyy333/AdoptMeAgent/main/Hopper/hopper.lua \
  -o ~/scripts/hopper.lua
```

## Step 3: Run Hopper
```bash
lua5.4 ~/scripts/hopper.lua
```

Menu akan muncul:
```
1. Set package
2. Set cookie
3. Kelola PS links
4. Set hop interval
0. Keluar
```

---

## Setup Flow

**Pertama kali:**

1. **Input: 1** → Set package `com.roblox.client`
2. **Input: 2** → Paste cookie `.ROBLOSECURITY`
3. **Input: 3** → Paste PS links (satu per line, kosong = selesai)
4. **Input: 4** → Set hop interval (contoh: `50` menit)
5. **Input: 0** → Keluar

**Hopper mulai jalan otomatis!** Akan hop setiap X menit, terus jalan sampai Ctrl+C.

---

## Selanjutnya

Tinggal jalankan:
```bash
lua5.4 ~/scripts/hopper.lua
```

Hopper load config lama dan langsung hop. Tidak perlu setup lagi.

---

## Monitor

Display update setiap 15 detik. Lihat:
- Package name
- PS count
- Status (RUNNING / NOT RUNNING)
- Crash count
- Runtime
- Hop countdown

---

## Stop

Tekan **Ctrl+C** di Termux untuk stop hopper.

---

**Selesai! Pure standalone, zero dependencies, works forever offline.** 🚀
