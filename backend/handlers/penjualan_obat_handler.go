package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"siak-rsbw/backend/models"
	"siak-rsbw/backend/utils"
	"time"
)

// PenjualanBebasObatHandler menangani permintaan untuk mendapatkan laporan penjualan bebas obat dari database MySQL
func PenjualanBebasObatHandler(w http.ResponseWriter, r *http.Request) {
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

	// Query SQL untuk penjualan bebas obat
	query := `
		SELECT
			penjualan.tgl_jual AS tanggal_penjualan,
			penjualan.nota_jual AS no_penjualan,
			SUM(detailjual.total) AS total
		FROM
			penjualan
		INNER JOIN 
			detailjual ON detailjual.nota_jual = penjualan.nota_jual
		WHERE
			penjualan.status = 'Sudah Dibayar' AND
			penjualan.tgl_jual BETWEEN ? AND ?
		GROUP BY
			penjualan.nota_jual
		ORDER BY
			penjualan.tgl_jual DESC
	`

	// Eksekusi query
	var result []models.PenjualanBebasObat
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
		result = []models.PenjualanBebasObat{}
	}

	// Hitung total penjualan
	var totalPenjualan float64
	for _, item := range result {
		totalPenjualan += item.Total
	}

	// Siapkan response
	response := map[string]interface{}{
		"status":  "success",
		"message": "Data penjualan bebas obat berhasil diambil dari database",
		"filter": map[string]string{
			"tanggal_awal":  tanggalAwal,
			"tanggal_akhir": tanggalAkhir,
		},
		"total_data":      len(result),
		"total_penjualan": totalPenjualan,
		"keterangan":      "Data merupakan pendapatan dari penjualan obat bebas yang sudah dibayar",
		"data":            result,
	}

	// Encode respons ke JSON
	encoder := json.NewEncoder(w)
	if err := encoder.Encode(response); err != nil {
		http.Error(w, fmt.Sprintf("Gagal mengenkode response: %v", err), http.StatusInternalServerError)
		return
	}
}
