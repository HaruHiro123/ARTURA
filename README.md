# ARTURA — EN/ID & Single-Original Stock Fix

Proyek lengkap berdasarkan `ARTURA-BILINGUAL-EN-ID-FIX(2).zip`.

## Jalankan di Windows / VS Code

1. Ekstrak ZIP ke folder baru. Simpan proyek lama sebagai cadangan.
2. Buka folder `ARTURA-BILINGUAL-SOLD-FIX` yang berisi `package.json` melalui VS Code.
3. Hentikan server proyek lama dengan Ctrl+C jika masih berjalan.
4. Di terminal folder proyek, jalankan:

```powershell
npm ci
npm run dev
```

Buka alamat Local yang dicetak Vite, biasanya `http://localhost:5173/`. Terminal harus tetap berjalan. Gunakan browser dan alamat/port yang sama untuk melihat data lama. `localhost:5173` dan `localhost:5174` mempunyai penyimpanan terpisah.

## Coba transaksi sampai Sold

1. Buka Shop/Toko dan pilih Jasper atau Waguri yang masih tersedia.
2. Masukkan ke keranjang, lalu lengkapi checkout.
3. Pilih metode pembayaran dan unggah contoh gambar bukti untuk demo.
4. Buka `/admin/login`, gunakan **admin** / **artura123** (login demo lokal).
5. Buka Orders/Pesanan, pilih pesanan tersebut, klik **Verify Payment / Verifikasi Pembayaran**.
6. Pembayaran menjadi Paid/Terbayar dan karya otomatis menjadi **Sold/Terjual** dalam satu penyimpanan.
7. Buka Shop atau detail karya. Tombol beli sudah nonaktif. Refresh halaman: status tetap tersimpan.

Pesanan yang belum dibayar menahan reservasi karya agar tidak dibuat pesanan kedua. Pembatalan pesanan yang belum dibayar melepaskan reservasi. Bukti pembayaran yang baru diunggah masih menunggu verifikasi. Karya yang sudah terjual tidak boleh dijadikan Available lagi melalui edit admin. Untuk penjualan karya berbeda, buat item baru.

## Perbaikan utama

- Menghapus MutationObserver yang mengganti potongan kata di DOM. Semua terjemahan UI kini dipanggil melalui context React dan kamus frasa utuh.
- EN/ID meliputi halaman publik, pilihan konfigurasi, placeholder, unggahan, pesan error, status, nota, tabel dan panel admin. Penggantian bahasa tidak mengosongkan isian formulir.
- Nama karya, nama pelanggan, alamat, kontak, dan isi ulasan tidak diterjemahkan. Nama dan teks bebas buatan pengguna bukan terjemahan otomatis. Teks baru yang ditambahkan ke kode perlu ditambahkan ke kamus.
- Pilihan bahasa tersimpan, atribut `lang`/judul dokumen ikut berubah, dan tanggal menggunakan locale aktif. Harga tetap memakai rupiah.
- Verifikasi pembayaran dan perubahan stok ditulis bersamaan. Kegagalan penyimpanan tidak menghasilkan status Paid tanpa Sold.
- Transaksi ganda karya original diblokir, harga checkout dihitung kembali dari katalog, pesanan batal tidak dapat menerima bukti atau diaktifkan kembali.
- Transaksi lama dengan pembayaran Paid otomatis memperbaiki status karya yang belum Sold. Gambar bawaan yang tersimpan dengan URL build lama disesuaikan dengan aset saat ini.
- Bentuk data penyimpanan yang rusak dipulihkan, perubahan antar-tab disinkronkan, dan kegagalan menyimpan tidak ditampilkan sebagai sukses.
- Validasi harga, email/kode pos, slug duplikat, tautan HTTPS hasil digital, dan status pengiriman diperketat. Unggahan bukti tidak dapat dikirim saat gambar sedang diproses.
- Harga awal pada kartu commission mengikuti harga admin. Nominal harga lama pada deskripsi preset dihapus supaya tidak bertentangan dengan kalkulator.
- Seluruh 20 gambar original dan `Omni.mp4` tetap disertakan. Desain hero, animasi, dan fitur pengiriman/nota dari ZIP terbaru dipertahankan.

## Data versi sebelumnya

Aplikasi membaca data lama dari key `artura_*`. Penyimpanan aktif baru memakai `artura.store.v2` supaya status pembayaran dan stok dapat ditulis bersamaan. Data lama tidak perlu dihapus. Reset melalui Settings akan mengganti data aktif, sehingga lakukan hanya jika memang ingin mengulang demo dari awal.

Aplikasi ini masih frontend dengan localStorage dan login admin demo. Stok dan transaksi berlaku untuk browser/origin tersebut; belum merupakan stok global lintas perangkat atau pelanggan. Penjualan sungguhan memerlukan backend, database dengan transaksi stok, autentikasi server, serta integrasi/verifikasi pembayaran. Tidak ada uang atau pesanan kurir yang diproses otomatis oleh kode ini.

## Verifikasi

```powershell
npm run lint
npm test
npm run build
```

Tes browser opsional (server uji memakai port 5173, jadi hentikan server dev dahulu):

```powershell
npx playwright install chromium
npm run test:e2e
```

Hasil browser dibuat di `test-results/`. Ringkasan pengujian versi ini tersedia pada `QA-REPORT.md`. Skrip browser menggunakan data uji lokal, tanpa transaksi uang sungguhan.

## File yang paling relevan

| File | Peran |
| --- | --- |
| `src/i18n/LanguageContext.jsx` | Pilihan bahasa dan context React |
| `src/i18n/useLanguage.js` | Hook untuk komponen |
| `src/i18n/translations.js` | Pasangan frasa EN/ID |
| `src/i18n/translate.js` | Pencocokan frasa utuh dan label status |
| `src/context/ArturaDataProvider.jsx` | Penyimpanan terpadu dan operasi admin/pelanggan |
| `src/utils/transactionRules.js` | Aturan stok tunggal, pembayaran, dan reservasi |
| `src/utils/store.js` | Migrasi serta validasi data tersimpan |
| `tests/regressions.test.mjs` | Tes regresi logika |
| `tests/browser.e2e.cjs` | Uji alur pengguna melalui browser |
