package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"siak-rsbw/backend/models"
	"siak-rsbw/backend/utils"
	"time"
)

// LaporanRawatInapHandler menangani permintaan untuk mendapatkan laporan rawat inap dari database MySQL
func LaporanRawatInapHandler(w http.ResponseWriter, r *http.Request) {
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
	filterBy := r.URL.Query().Get("filter_by")

	// Log parameter untuk debugging
	fmt.Printf("Parameter filter: tanggal_awal=%s, tanggal_akhir=%s, filter_by=%s\n",
		tanggalAwal, tanggalAkhir, filterBy)

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

	// Query SQL
	var query string

	// Buat query berdasarkan filter
	if filterBy == "tgl_keluar" {
		query = `
			SELECT DISTINCT
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
				kamar_inap.tgl_keluar BETWEEN ? AND ?
				AND kamar_inap.tgl_keluar IS NOT NULL
			GROUP BY
				reg_periksa.no_rawat
		`
	} else if filterBy == "tgl_masuk" {
		query = `
			SELECT DISTINCT
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
				kamar_inap.tgl_masuk BETWEEN ? AND ?
			GROUP BY
				reg_periksa.no_rawat
		`
	} else {
		// Query default atau filterBy=both (filter by tgl_masuk OR tgl_keluar)
		query = `
			SELECT DISTINCT
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
			GROUP BY
				reg_periksa.no_rawat
		`
	}

	// Eksekusi query
	var result []models.LaporanRawatInap

	// Log detail query untuk debugging
	fmt.Printf("Filter By: %s\n", filterBy)
	fmt.Printf("Query yang dijalankan: %s\n", query)
	fmt.Printf("Parameter: tanggal_awal=%s, tanggal_akhir=%s\n", tanggalAwal, tanggalAkhir)

	var queryErr error
	if filterBy == "tgl_keluar" || filterBy == "tgl_masuk" {
		queryErr = db.Raw(query,
			tanggalAwal,
			tanggalAkhir,
		).Scan(&result).Error
	} else {
		// Untuk filter "both", tetap menggunakan 4 parameter
		queryErr = db.Raw(query,
			tanggalAwal,
			tanggalAkhir,
			tanggalAwal,
			tanggalAkhir,
		).Scan(&result).Error
	}

	if queryErr != nil {
		http.Error(w, fmt.Sprintf("Gagal menjalankan query: %v", queryErr), http.StatusInternalServerError)
		return
	}

	// Log jumlah hasil untuk debugging
	fmt.Printf("Jumlah data yang ditemukan: %d\n", len(result))

	// Jika tidak ada hasil, kembalikan array kosong
	if result == nil {
		result = []models.LaporanRawatInap{}
	}

	// Hitung total pembayaran
	var totalBayar float64
	for _, item := range result {
		totalBayar += item.BesarBayar
	}

	// Siapkan response
	response := map[string]interface{}{
		"status":  "success",
		"message": "Data laporan rawat inap berhasil diambil dari database",
		"filter": map[string]string{
			"tanggal_awal":  tanggalAwal,
			"tanggal_akhir": tanggalAkhir,
		},
		"total_data":  len(result),
		"total_bayar": totalBayar,
		"data":        result,
	}

	// Encode respons ke JSON
	encoder := json.NewEncoder(w)
	if err := encoder.Encode(response); err != nil {
		http.Error(w, fmt.Sprintf("Gagal mengenkode response: %v", err), http.StatusInternalServerError)
		return
	}
}

// getEnvironmentVar mengambil nilai variabel lingkungan atau nilai default jika tidak ada
func getEnvironmentVar(key, defaultValue string) string {
	if value, exists := os.LookupEnv(key); exists {
		return value
	}
	return defaultValue
}
