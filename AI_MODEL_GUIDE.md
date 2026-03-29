# AI MODEL GUIDE — Adopt Me Ecosystem

## Tools
```
Claude Web → Planning, architecture, Lua, complex debug
Cursor     → Coding harian: Node.js, React, Extension
```

---

## Model per Task

| Task | Tool | Model |
|------|------|-------|
| Planning & architecture | Claude Web | Sonnet |
| Node.js backend | Cursor | Sonnet |
| React frontend | Cursor | Sonnet |
| Chrome Extension | Cursor | Sonnet |
| Lua scripts | Claude Web | Sonnet |
| Debug biasa | Cursor / Claude Web | Sonnet |
| Debug kompleks (stuck 3x) | Claude Web | Opus |
| JWT / Auth issues | Claude Web | Opus |
| Architecture besar | Claude Web | Opus |

---

## Kapan Switch ke Opus
```
1. Sonnet kasih solusi sama 2x masih salah
2. Bug tidak masuk akal
3. Auth / security logic
4. Keputusan design besar
```

---

## Cursor Shortcuts
```
Ctrl+L → Chat
Ctrl+K → Inline edit
Ctrl+I → Composer (multi-file)
```

---

## Template Prompt

### Mulai sesi baru
```
Baca MASTERPLAN.md dan PROGRESS.md.
Lanjut dari: [task]
```

### Coding
```
Buatkan [fungsi/file] untuk [tujuan].
Input: [apa] | Output: [apa] | Constraint: [apa]
```

### Debug
```
Error: [exact error]
File: [nama] baris: [nomor]
Fungsi: [nama] | Sudah dicoba: [apa]
```

---

## File Kunci di Root Project
```
MASTERPLAN.md   → arsitektur lengkap
PROGRESS.md     → update tiap task selesai
API_NOTES.md    → Starpets API research
.cursorrules    → auto-load di Cursor
```

### Isi .cursorrules
```
Project: Adopt Me Farming Ecosystem
Baca MASTERPLAN.md untuk full context.
Baca PROGRESS.md untuk status terkini.
Stack: Node.js + Express + SQLite + React + Vite
Rules:
- Jangan ubah schema tanpa konfirmasi
- Tanya dulu kalau tambah dependency baru
- Semua API call harus ada error handling
- Log operasi penting ke database
```

---

## Workflow Harian
```
Pagi    → Claude Web: review PROGRESS, plan hari ini
Coding  → Cursor: "Baca MASTERPLAN+PROGRESS, lanjut X"
          Update PROGRESS tiap task selesai
Stuck   → Cursor 5 menit → Claude Web kalau tidak resolved
```

---

## Budget
```
Claude Pro ($20) + Cursor Pro ($20) → cukup
Upgrade Max kalau sering rate limit
```
