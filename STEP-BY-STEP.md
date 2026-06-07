═══════════════════════════════════════════════════════════════
  GAS APP BUILDER — STEP BY STEP LENGKAP DARI AWAL
  Chrome Extension + Google Apps Script + Gemini AI
═══════════════════════════════════════════════════════════════

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FASE 1: SETUP GOOGLE APPS SCRIPT BACKEND
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

STEP 1.1: Buka Google Sheets
─────────────────────────────
1. Buka https://sheets.google.com
2. Buat spreadsheet baru (kosong)
3. Beri nama: "GAS App Builder"

STEP 1.2: Buka Apps Script Editor
───────────────────────────────────
4. Klik menu "Extensions" → "Apps Script"
5. Hapus semua kode default (function myFunction()...)
6. Copy paste seluruh isi file: apps-script/Code.gs
7. Klik "Ctrl+S" untuk simpan, beri nama project: "GAS App Builder"

STEP 1.3: Deploy Web App
─────────────────────────
8. Klik tombol "Deploy" → "New deployment"
9. Pilih type: "Web app"
10. Deskripsi: "GAS App Builder API v1"
11. Execute as: "Me"
12. Who has access: "Anyone"
13. Klik "Deploy"
14. Akan muncul popup izin — klik "Authorize access"
15. Pilih akun Google kamu → klik "Allow"
16. COPY URL Web App (https://script.google.com/macros/s/.../exec)
    ⚠️ SIMPAN URL INI! Jangan hilang!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FASE 2: SETUP CHROME EXTENSION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

STEP 2.1: Load Extension ke Chrome
────────────────────────────────────
1. Buka Chrome
2. Ketik di address bar: chrome://extensions/
3. Nyalakan "Developer mode" (pojok kanan atas)
4. Klik "Load unpacked"
5. Pilih folder: gas-app-builder/extension/
6. Extension akan muncul: ⚡ GAS App Builder
7. PIN extension ke toolbar (klik puzzle icon → pin)

STEP 2.2: Test Koneksi ke Google Sheets
─────────────────────────────────────────
8. Klik icon ⚡ GAS di toolbar Chrome
9. Popup akan muncul — klik ⚙️ (Settings)
10. Paste URL Web App dari STEP 1.16
11. Klik "Simpan & Tes"
12. Kalo berhasil: ✅ Terhubung! Spreadsheet: GAS App Builder

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FASE 3: SETUP GEMINI AI (FREE!) 
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

STEP 3.1: Dapatkan Gemini API Key (GRATIS)
───────────────────────────────────────────
1. Buka https://aistudio.google.com/apikey
2. Login dengan akun Google kamu
3. Klik "Create API Key"
4. Pilih project atau buat baru
5. COPY API Key (format: AIzaSy...)

STEP 3.2: Masukkan API Key ke Extension
─────────────────────────────────────────
6. Klik icon ⚡ GAS → ⚙️ (Settings)
7. Scroll ke bagian "🤖 Integrasi Gemini AI"
8. Paste API Key di kolom input
9. Klik "💾 Simpan Key"
10. Klik "🔄 Test Key"
11. Kalo berhasil: ✅ API Key valid! Gemini siap digunakan!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FASE 4: MENGGUNAKAN GAS APP BUILDER
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 TAB DATA — Lihat Data Sheet
───────────────────────────────
1. Klik tab "📋 Data"
2. Pilih sheet dari dropdown
3. Data tampil dalam bentuk card
4. 🔍 Cari data dengan search bar
5. Klik card untuk lihat detail
6. ✏️ Edit atau 🗑️ Hapus data langsung

🗂️ TAB SHEETS — Kelola Sheet
───────────────────────────────
1. Klik tab "🗂️ Sheets"
2. Lihat daftar semua sheet
3. ➕ Buat sheet baru dengan nama
4. Klik "Buka" untuk pindah ke sheet

➕ TAB TAMBAH — Tambah Data Baru
─────────────────────────────────
1. Klik tab "➕ Tambah"
2. Pilih sheet
3. Form otomatis muncul berdasarkan header sheet
4. Isi data → klik "💾 Simpan Data"

🤖 TAB AI — GENERATE SCRIPT PAKAI GEMINI
─────────────────────────────────────────
1. Klik tab "🤖 AI"
2. Pilih quick action (CRUD / Web App / Email / PDF)
   atau ketik deskripsi sendiri
3. Contoh prompt:
   - "Buat fungsi CRUD untuk data karyawan"
   - "Buat Web App untuk form pendaftaran"
   - "Buat auto-email reminder 3 hari sebelum deadline"
   - "Buat fungsi generate PDF laporan dari sheet"
4. Klik "🚀 Generate Script"
5. Gemini akan menulis kode Apps Script
6. 📋 Copy — kode siap di-paste ke Apps Script editor
7. 🚀 Deploy — langsung buka Apps Script editor

📊 TAB STATS — Statistik Data
───────────────────────────────
1. Klik tab "📊 Statistik"
2. Pilih sheet
3. Lihat total baris, kolom, distribusi data

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FASE 5: CARA KERJA — FLOW PENGGUNAAN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

┌──────────────────────────────────────────────────────────┐
│                    CHROME EXTENSION                       │
│  ┌────────────────────────────────────────────────────┐  │
│  │  1. User mengetik prompt di tab AI                  │  │
│  │  2. Extension ambil GEMINI_API_KEY dari storage     │  │
│  │  3. Extension kirim ke Gemini API                   │  │
│  │  4. Gemini balas dengan kode Apps Script            │  │
│  │  5. Extension tampilkan kode + validasi             │  │
│  │  6. User COPY kode                                  │  │
│  └────────────────────────────────────────────────────┘  │
│                          │                                │
│                          ▼                                │
│  ┌────────────────────────────────────────────────────┐  │
│  │               GOOGLE APPS SCRIPT                    │  │
│  │  7. Buka Extensions → Apps Script                  │  │
│  │  8. Paste kode dari extension                      │  │
│  │  9. Klik Save → Deploy                             │  │
│  │ 10. Web App siap digunakan!                        │  │
│  └────────────────────────────────────────────────────┘  │
│                          │                                │
│                          ▼                                │
│  ┌────────────────────────────────────────────────────┐  │
│  │               GOOGLE SHEETS                         │  │
│  │  Data tersimpan & bisa diakses via Extension       │  │
│  └────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────┘

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CONTOH PENGGUNAAN AI GENERATOR
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CONTOH 1: CRUD SEDERHANA
─────────────────────────
Prompt: "Buat fungsi CRUD untuk data inventaris barang"
Hasil: Kode Apps Script dengan fungsi:
  - addItem() — tambah barang baru
  - getItems() — lihat semua barang
  - updateItem() — update data barang
  - deleteItem() — hapus barang

CONTOH 2: WEB APP FORM
───────────────────────
Prompt: "Buat Web App untuk form pendaftaran peserta"
Hasil: doGet() + doPost() + HTML form

CONTOH 3: AUTO EMAIL
────────────────────
Prompt: "Buat auto-email reminder untuk task yang deadline-nya 
         besok, kirim ke kolom Email"
Hasil: Fungsi yang cek tanggal, filter, kirim email via
       GmailApp.sendEmail()

CONTOH 4: GENERATE PDF
───────────────────────
Prompt: "Buat fungsi untuk generate PDF laporan dari data sheet"
Hasil: Fungsi yang bikin PDF dari range sheet pake
       SpreadsheetApp + DriveApp

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STRUKTUR PROJECT LENGKAP
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

gas-app-builder/
├── apps-script/
│   ├── Code.gs           # Google Apps Script backend
│   └── TEMPLATES.md      # Template sheet yang siap pakai
│
├── extension/
│   ├── manifest.json      # Chrome Extension manifest v3
│   ├── popup.html         # Main popup UI (4 tab + AI)
│   ├── options.html       # Settings (Web App URL + Gemini Key)
│   ├── css/
│   │   └── style.css      # Dark theme styles + AI styles
│   ├── js/
│   │   ├── api.js         # GAS API client
│   │   ├── generator.js   # AI Script Generator (Gemini)
│   │   ├── app.js         # Main app logic + AI tab
│   │   └── background.js  # Service worker
│   └── icons/
│       ├── icon16.png
│       ├── icon32.png
│       ├── icon48.png
│       └── icon128.png
│
└── README.md

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TROUBLESHOOTING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

❌ "Gagal terhubung ke GAS Web App"
→ Pastikan URL benar (https://script.google.com/macros/s/.../exec)
→ Pastikan akses "Anyone" di deployment settings
→ Redeploy ulang (Deploy → Manage deployments → Edit → Deploy)

❌ "Gemini API Key tidak valid"
→ Pastikan key diawali "AIzaSy..."
→ Cek di https://aistudio.google.com/apikey
→ Pastikan Gemini API diaktifkan di Google Cloud Console

❌ "Gagal menyimpan data ke sheet"
→ Cek header/nama kolom di sheet
→ Pastikan sheet name yang dipilih benar

❌ "Extension error setelah update"
→ Buka chrome://extensions/ → reload extension
→ Atau Load unpacked ulang

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📦 GitHub: https://github.com/andrikproject/gas-app-builder

Dibuat oleh @andrikproject 🚀
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
