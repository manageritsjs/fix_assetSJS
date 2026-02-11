# Fix Asset SJS

Aplikasi manajemen aset tetap lengkap dengan fitur depresiasi, jurnal otomatis, dan barcode scanner.

## Fitur Utama

- **Master Aset:** CRUD aset dengan detail lengkap (kode, nama, kategori, lokasi, dll).
- **Depresiasi:** Perhitungan otomatis (Garis Lurus & Saldo Menurun).
- **Jurnal Otomatis:** Integrasi dengan sistem akuntansi sederhana.
- **Barcode & QR:** Generate label aset dan scan via kamera.
- **Laporan:** Daftar aset, jadwal penyusutan, dan ringkasan nilai buku.

## Prasyarat

- Node.js v16+
- SQL Anywhere 17 Client & ODBC Driver
- Database instance `fixdb` berjalan.

## Instalasi

1. **Clone Repository:**
   ```bash
   git clone https://github.com/manageritsjs/fix_assetSJS.git
   cd fix_assetSJS
   ```

2. **Backend Setup:**
   ```bash
   cd server
   npm install
   # Pastikan creds DB di db.js sesuai (default: dba/dbasjs)
   npm start
   ```

3. **Frontend Setup:**
   ```bash
   cd client
   npm install
   npm run dev
   ```

4. **Database Setup:**
   Pastikan server database berjalan:
   ```cmd
   dbeng17 -n fixdb /path/to/fixdb.db
   ```
   Tabel akan otomatis dibuat saat backend pertama kali dijalankan.

## Lisensi

Private - Fix Asset SJS
