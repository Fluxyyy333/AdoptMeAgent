# API NOTES — Starpets

## Infrastructure
```
Frontend : starpets.gg           → ada Cloudflare (abaikan)
API      : market.apineural.com  → TIDAK ada Cloudflare ✓
Auth     : auth.apineural.com
```

---

## Authentication
```
Type   : Bearer JWT
Header : Authorization: Bearer {token}
Sumber : Chrome profile login via Google OAuth

auth.apineural.com:
GET /api/user/glurl  → Google OAuth URL
GET /api/user/vkurl  → VK OAuth
GET /api/user/dsurl  → Discord OAuth
```

### JWT — Belum Diketahui
```
Lokasi : localStorage atau memory?
Test   : starpets.gg → F12 Console:
         Object.keys(localStorage)
         → cari key value dimulai "eyJ"
Expire : belum diketahui
```

---

## Endpoints Confirmed ✓
```
GET  /api/v2/inventory/items/{userId}
Response: [{id, productId, name, type, age, rare,
            flyable, rideable, imageUri}]

GET  /api/v2/store/items/u/{userId}/c/u..
POST /api/store/items/add
     { linkedRobloxAccountId, items:[{id, price}] }
GET  /api/user/store/link
GET  /api/store/commission   → 25%
GET  /api/inventory/items/purchased
GET  /api/trades/deposit
GET  /api/trades/withdrawal
```

## Endpoints Belum Dicapture ⚠️
```
- Reprice item on sale  (PATCH /api/store/items/{id} ?)
- Remove listing        (DELETE /api/store/items/{id} ?)
- Add akun via cookie
- Error response JWT invalid
```

### Cara Capture
```
HTTP Toolkit → Fresh Chrome → login starpets.gg
Aksi 1: ubah harga item On Sale → Save
Aksi 2: delete item On Sale
Screenshot: method + URL + body + response
```

---

## Pricing
```
Komisi : 25%
Terima : harga × 0.75
```

---

## Inventory Response Fields
```
id        : string  ← gunakan untuk listing
productId : number  ← jenis pet
name      : string
age       : newborn/junior/pre_teen/teen/post_teen/full_grown
rare      : common/uncommon/rare/ultra_rare/legendary
flyable   : boolean
rideable  : boolean
```
