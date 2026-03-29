# CLAUDE.md — Adopt Me Farming Ecosystem

## Wajib dibaca sebelum mulai
Baca MASTERPLAN.md untuk full context project.
Baca PROGRESS.md untuk status task terkini.
Baca API_NOTES.md kalau mengerjakan Starpets module.

## Stack
- Backend  : Node.js + Express
- Database : SQLite (better-sqlite3)
- Frontend : React + Vite
- Extension: Chrome Extension Manifest V3
- Device   : Lua script di Termux (Redfinger Android)

## Rules
- Jangan ubah database schema tanpa konfirmasi user
- Tanya dulu kalau mau tambah dependency baru
- Semua API call harus ada error handling
- Log operasi penting ke database
- Satu fitur selesai dan tested sebelum lanjut ke berikutnya
- Update PROGRESS.md setiap task selesai
