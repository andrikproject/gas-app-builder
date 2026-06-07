# ⚡ GAS App Builder

**Google Apps Script + Google Sheets — Chrome Extension App Builder**

Kelola data Google Sheets langsung dari Chrome Extension! CRUD, search, stats, dan banyak lagi.

---

## 🚀 Fitur

| Fitur | Keterangan |
|-------|------------|
| 📋 **Data Viewer** | Lihat semua data sheet dalam bentuk card |
| 🔍 **Search** | Cari data di seluruh kolom |
| ➕ **Tambah Data** | Form otomatis berdasarkan header sheet |
| ✏️ **Edit & Hapus** | Update/hapus data langsung dari extension |
| 📊 **Statistik** | Total data, per kolom, grafik bar |
| 🗂️ **Multi Sheet** | Lihat & ganti-ganti sheet |
| 📱 **Dark Theme** | Tampilan modern, enak dilihat |

---

## 🔧 Cara Setup

### 1️⃣ Deploy Google Apps Script

1. Buka [Google Sheets](https://sheets.google.com)
2. Buat spreadsheet baru (atau buka existing)
3. Klik **Extensions → Apps Script**
4. Hapus kode default, paste isi file `apps-script/Code.gs`
5. Klik **Deploy → New deployment**
   - **Type:** Web app
   - **Execute as:** Me
   - **Who has access:** Anyone
6. Klik **Deploy** → **Authorize access** → Copy URL Web App

### 2️⃣ Install Chrome Extension

1. Buka `chrome://extensions/`
2. Nyalakan **Developer mode** (pojok kanan atas)
3. Klik **Load unpacked**
4. Pilih folder `extension/`
5. Extension siap!

### 3️⃣ Konfigurasi URL

1. Klik icon **⚡ GAS** di toolbar Chrome
2. Klik **⚙️** (Settings)
3. Paste URL Web App dari langkah 1
4. Klik **Simpan & Tes**
5. ✅ Kalau koneksi sukses, extension siap dipakai!

---

## 🏗️ Struktur Project

```
gas-app-builder/
├── apps-script/
│   ├── Code.gs          # Google Apps Script backend
│   └── TEMPLATES.md     # Template sheet yang siap pakai
│
└── extension/
    ├── manifest.json     # Chrome Extension manifest v3
    ├── popup.html        # Main popup UI
    ├── options.html      # Settings page
    ├── css/
    │   └── style.css     # Dark theme styles
    ├── js/
    │   ├── api.js        # GAS API client
    │   ├── app.js        # Main application logic
    │   └── background.js # Service worker
    └── icons/
        ├── icon16.png
        ├── icon32.png
        ├── icon48.png
        └── icon128.png
```

---

## 📡 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `?action=getAll&sheet=Sheet1` | GET | Ambil semua data |
| `?action=getRow&sheet=Sheet1&id=1` | GET | Satu baris data |
| `?action=addRow` | POST | Tambah data baru |
| `?action=updateRow` | POST | Update data |
| `?action=deleteRow` | POST | Hapus data |
| `?action=search&sheet=Sheet1&query=xxx` | GET | Cari data |
| `?action=listSheets` | GET | Daftar semua sheet |
| `?action=createSheet` | POST | Buat sheet baru |
| `?action=stats&sheet=Sheet1` | GET | Statistik sheet |
| `?action=info` | GET | Info spreadsheet |

---

## 🧪 Template Sheet Siap Pakai

Ada 5 template di `apps-script/TEMPLATES.md`:
- 📋 Data Karyawan
- 📦 Inventaris Barang
- 📝 Laporan Harian
- 👥 Data Pelanggan (CRM)
- ✅ Task Manager

---

## 🖥️ Screenshots

```
┌──────────────────────────────────────┐
│  ⚡ GAS App Builder          🟢 ⚙️  │
├───┬───┬────┬────┬───────────────────┤
│ 📋 │ 🗂️ │ ➕ │ 📊 │                   │
│ Data│Sheets│Tambah│Stats│             │
├───┴───┴────┴────┴───────────────────┤
│ [Sheet: Data Karyawan ▼] [🔍 Cari]🔄│
│                                      │
│ ┌──────────────────────────────────┐ │
│ │ Andi Saputra              #1    │ │
│ │ Staff IT · Teknologi Informasi  │ │
│ │                    [✏️] [🗑️]   │ │
│ └──────────────────────────────────┘ │
│ ┌──────────────────────────────────┐ │
│ │ Siti Rahma               #2    │ │
│ │ Manager HR · SDM               │ │
│ │                    [✏️] [🗑️]   │ │
│ └──────────────────────────────────┘ │
│                                      │
│         ← [1] [2] [3] →             │
├──────────────────────────────────────┤
│       ✅ Terhubung: Database Karyawan│
└──────────────────────────────────────┘
```

---

## 📦 Tech Stack

- **Chrome Extension** (Manifest V3)
- **Google Apps Script** (Web App)
- **Google Sheets** (Database)
- **Vanilla JavaScript** (No framework)
- **CSS Custom Properties** (Dark theme)

---

## 👤 Credit

Dibuat oleh **@andrikproject**

🚀 Happy building with GAS App Builder!
