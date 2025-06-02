package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"siak-rsbw/backend/models"
	"siak-rsbw/backend/utils"
	"time"
)

// PenerimaanObatHandler menangani permintaan untuk mendapatkan laporan penerimaan obat dari database MySQL
func PenerimaanObatHandler(w http.ResponseWriter, r *http.Request) {
	// Set header Content-Type
	w.Header().Set("Content-Type", "application/json")

	// Hanya menerima metode GET
	if r.Method != http.MethodGet {
		http.Error(w, "Metode tidak diizinkan", http.StatusMethodNotAllowed)
		return
	}

	// Ambil parameter tanggal dari query URL
	tanggalAwal := r.URL.Query().Get("tanggal_awal")
	tanggalAkhir := r.URL.Query().Get("tanggal_akhir")

	// Jika tanggal tidak disediakan, gunakan rentang bulan ini
	if tanggalAwal == "" || tanggalAkhir == "" {
		now := time.Now()
		firstOfMonth := time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, now.Location())
		lastOfMonth := time.Date(now.Year(), now.Month()+1, 0, 23, 59, 59, 0, now.Location())

		if tanggalAwal == "" {
			tanggalAwal = firstOfMonth.Format("2006-01-02")
		}

		if tanggalAkhir == "" {
			tanggalAkhir = lastOfMonth.Format("2006-01-02")
		}
	}

	// Ambil instance MySQL DB dari utils
	db := utils.GetMySQLDB()
	if db == nil {
		http.Error(w, "Koneksi ke database MySQL tidak tersedia", http.StatusInternalServerError)
		return
	}

	// Cek apakah koneksi database berfungsi
	sqlDB, err := db.DB()
	if err != nil {
		errMessage := fmt.Sprintf("Gagal mendapatkan instance SQL DB: %v", err)
		fmt.Println(errMessage)
		http.Error(w, errMessage, http.StatusInternalServerError)
		return
	}

	// Test ping
	err = sqlDB.Ping()
	if err != nil {
		errMessage := fmt.Sprintf("Ping database gagal: %v", err)
		fmt.Println(errMessage)
		http.Error(w, errMessage, http.StatusInternalServerError)
		return
	}

	fmt.Println("Koneksi ke database MySQL berhasil!")

	// Query SQL untuk penerimaan obat
	query := `
		SELECT
			pemesanan.tgl_pesan AS tanggal_penerimaan,
			pemesanan.no_faktur AS no_penerimaan,
			datasuplier.kode_suplier AS kode_supplier,
			datasuplier.nama_suplier AS nama_supplier,
			SUM(detailpesan.jumlah * detailpesan.h_pesan) AS total
		FROM
			pemesanan
		INNER JOIN 
			detailpesan ON detailpesan.no_faktur = pemesanan.no_faktur
		INNER JOIN
			datasuplier ON datasuplier.kode_suplier = pemesanan.kode_suplier
		WHERE
			pemesanan.tgl_pesan BETWEEN ? AND ?
		GROUP BY
			pemesanan.no_faktur
		ORDER BY
			pemesanan.tgl_pesan DESC
	`

	// Eksekusi query
	var result []models.PenerimaanObat
	err = db.Raw(query,
		tanggalAwal,
		tanggalAkhir,
	).Scan(&result).Error

	if err != nil {
		http.Error(w, fmt.Sprintf("Gagal menjalankan query: %v", err), http.StatusInternalServerError)
		return
	}

	// Jika tidak ada hasil, kembalikan array kosong
	if result == nil {
		result = []models.PenerimaanObat{}
	}

	// Hitung total penerimaan
	var totalPenerimaan float64
	for _, item := range result {
		totalPenerimaan += item.Total
	}

	// Siapkan response
	response := map[string]interface{}{
		"status":  "success",
		"message": "Data penerimaan obat berhasil diambil dari database",
		"filter": map[string]string{
			"tanggal_awal":  tanggalAwal,
			"tanggal_akhir": tanggalAkhir,
		},
		"total_data":       len(result),
		"total_penerimaan": totalPenerimaan,
		"keterangan":       "Data merupakan penerimaan obat yang dikelompokkan berdasarkan nomor faktur",
		"data":             result,
	}

	// Encode respons ke JSON
	encoder := json.NewEncoder(w)
	if err := encoder.Encode(response); err != nil {
		http.Error(w, fmt.Sprintf("Gagal mengenkode response: %v", err), http.StatusInternalServerError)
		return
	}
}
