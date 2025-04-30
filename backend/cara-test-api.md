# Cara Menggunakan API Laporan Rawat Inap

## Konfigurasi MySQL

Konfigurasi MySQL di file `.env`:

```
MYSQL_HOST=192.168.10.88
MYSQL_PORT=3306
MYSQL_USER=backup
MYSQL_PASSWORD=backup
MYSQL_DBNAME=sik
```

## Perubahan Penting

1. **Automigrate Dihapus**:
   - Seluruh proses auto migrate dihapus dari kode
   - Aplikasi tidak akan membuat tabel otomatis di database
   - Semua tabel harus sudah tersedia di database

2. **Pembuatan User Admin Dinonaktifkan**:
   - Aplikasi tidak akan membuat user admin secara otomatis
   - Ini mencegah masalah hak akses dengan user database yang terbatas

3. **Koneksi MySQL Ditingkatkan**:
   - Menggunakan `MYSQL_HOST` untuk koneksi MySQL
   - Parameter koneksi yang lebih lengkap untuk menangani koneksi eksternal

## Menjalankan Server

Untuk menjalankan server API:

```
cd backend
go run main.go
```

Anda akan melihat output seperti ini jika berhasil:
```
Koneksi MySQL: backup@192.168.10.88:3306/sik
Menggunakan database MySQL
Berhasil terhubung ke database mysql
Auto migrate dan pembuatan user admin dinonaktifkan
Server berjalan di http://localhost:8080
```

## Mengakses API

API dapat diakses melalui:

1. **Data Dummy (Selalu Tersedia)**:
   ```
   http://localhost:8080/api/laporan/rawat-inap
   ```

2. **Data MySQL dari Server Remote**:
   ```
   http://localhost:8080/api/laporan/rawat-inap/db
   ```

Anda juga dapat menambahkan parameter tanggal:
```
http://localhost:8080/api/laporan/rawat-inap/db?tanggal_awal=2023-01-01&tanggal_akhir=2023-12-31
```

## Persyaratan Database

Karena auto migrate dihapus, database harus sudah memiliki tabel-tabel berikut:

- `reg_periksa`
- `pasien`
- `kamar_inap`
- `nota_inap`
- `detail_nota_inap`

## Query yang Digunakan

Query SQL yang digunakan dalam API:

```sql
SELECT
    reg_periksa.no_rawat,
    pasien.no_rkm_medis,
    pasien.nm_pasien,
    kamar_inap.tgl_masuk,
    kamar_inap.tgl_keluar,
    nota_inap.no_nota,
    nota_inap.tanggal,
    detail_nota_inap.besar_bayar
FROM
    reg_periksa
INNER JOIN pasien ON reg_periksa.no_rkm_medis = pasien.no_rkm_medis
INNER JOIN kamar_inap ON kamar_inap.no_rawat = reg_periksa.no_rawat
LEFT JOIN nota_inap ON nota_inap.no_rawat = reg_periksa.no_rawat
LEFT JOIN detail_nota_inap ON detail_nota_inap.no_rawat = reg_periksa.no_rawat
WHERE
    (kamar_inap.tgl_masuk BETWEEN ? AND ?)
    OR (kamar_inap.tgl_keluar BETWEEN ? AND ?)
```

## Contoh Response

Jika berhasil, response akan terlihat seperti ini:

```json
{
  "status": "success",
  "message": "Data laporan rawat inap berhasil diambil dari database",
  "filter": {
    "tanggal_awal": "2023-01-01",
    "tanggal_akhir": "2023-12-31"
  },
  "total_data": 42,
  "total_bayar": 75000000.5,
  "data": [
    {
      "no_rawat": "2023/01/001",
      "no_rkm_medis": "RM001",
      "nm_pasien": "NAMA PASIEN",
      "tgl_masuk": "2023-01-05T00:00:00Z",
      "tgl_keluar": "2023-01-08T00:00:00Z",
      "no_nota": "NOTA001",
      "tanggal": "2023-01-08T00:00:00Z",
      "besar_bayar": 1500000
    },
    // ... data lainnya ...
  ]
} 