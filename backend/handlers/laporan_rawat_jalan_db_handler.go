package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"siak-rsbw/backend/models"
	"siak-rsbw/backend/utils"
	"time"
)

// RawatJalanHandler menangani permintaan untuk mendapatkan laporan rawat jalan dari database MySQL
func RawatJalanHandler(w http.ResponseWriter, r *http.Request) {
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
	includePiutang := r.URL.Query().Get("include_piutang") // Parameter baru untuk mengontrol penggabungan piutang

	// Log parameter untuk debugging
	fmt.Printf("Parameter filter rawat jalan: tanggal_awal=%s, tanggal_akhir=%s, filter_by=%s, include_piutang=%s\n",
		tanggalAwal, tanggalAkhir, filterBy, includePiutang)

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
	if filterBy == "tgl_bayar" {
		query = `
			SELECT DISTINCT
				reg_periksa.no_rawat,
				pasien.no_rkm_medis,
				pasien.nm_pasien,
				reg_periksa.tgl_registrasi,
				poliklinik.nm_poli,
				nota_jalan.no_nota,
				nota_jalan.tanggal as tgl_bayar,
				detail_nota_jalan.besar_bayar
			FROM
				reg_periksa
			INNER JOIN pasien ON reg_periksa.no_rkm_medis = pasien.no_rkm_medis
			INNER JOIN poliklinik ON reg_periksa.kd_poli = poliklinik.kd_poli
			LEFT JOIN nota_jalan ON nota_jalan.no_rawat = reg_periksa.no_rawat
			LEFT JOIN detail_nota_jalan ON detail_nota_jalan.no_rawat = reg_periksa.no_rawat
			WHERE
				nota_jalan.tanggal BETWEEN ? AND ?
				AND reg_periksa.status_lanjut = 'Ralan'
			GROUP BY
				reg_periksa.no_rawat
		`
	} else if filterBy == "tgl_registrasi" {
		query = `
			SELECT DISTINCT
				reg_periksa.no_rawat,
				pasien.no_rkm_medis,
				pasien.nm_pasien,
				reg_periksa.tgl_registrasi,
				poliklinik.nm_poli,
				nota_jalan.no_nota,
				nota_jalan.tanggal as tgl_bayar,
				detail_nota_jalan.besar_bayar
			FROM
				reg_periksa
			INNER JOIN pasien ON reg_periksa.no_rkm_medis = pasien.no_rkm_medis
			INNER JOIN poliklinik ON reg_periksa.kd_poli = poliklinik.kd_poli
			LEFT JOIN nota_jalan ON nota_jalan.no_rawat = reg_periksa.no_rawat
			LEFT JOIN detail_nota_jalan ON detail_nota_jalan.no_rawat = reg_periksa.no_rawat
			WHERE
				reg_periksa.tgl_registrasi BETWEEN ? AND ?
				AND reg_periksa.status_lanjut = 'Ralan'
			GROUP BY
				reg_periksa.no_rawat
		`
	} else {
		// Query default atau filterBy=both (filter by tgl_registrasi OR tgl_bayar)
		query = `
			SELECT DISTINCT
				reg_periksa.no_rawat,
				pasien.no_rkm_medis,
				pasien.nm_pasien,
				reg_periksa.tgl_registrasi,
				poliklinik.nm_poli,
				nota_jalan.no_nota,
				nota_jalan.tanggal as tgl_bayar,
				detail_nota_jalan.besar_bayar
			FROM
				reg_periksa
			INNER JOIN pasien ON reg_periksa.no_rkm_medis = pasien.no_rkm_medis
			INNER JOIN poliklinik ON reg_periksa.kd_poli = poliklinik.kd_poli
			LEFT JOIN nota_jalan ON nota_jalan.no_rawat = reg_periksa.no_rawat
			LEFT JOIN detail_nota_jalan ON detail_nota_jalan.no_rawat = reg_periksa.no_rawat
			WHERE
				(reg_periksa.tgl_registrasi BETWEEN ? AND ?)
				OR (nota_jalan.tanggal BETWEEN ? AND ?)
				AND reg_periksa.status_lanjut = 'Ralan'
			GROUP BY
				reg_periksa.no_rawat
		`
	}

	// Eksekusi query
	var result []models.LaporanRawatJalan

	// Log detail query untuk debugging
	fmt.Printf("Filter By: %s\n", filterBy)
	fmt.Printf("Query yang dijalankan: %s\n", query)
	fmt.Printf("Parameter: tanggal_awal=%s, tanggal_akhir=%s\n", tanggalAwal, tanggalAkhir)

	var queryErr error
	if filterBy == "tgl_bayar" || filterBy == "tgl_registrasi" {
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
		result = []models.LaporanRawatJalan{}
	}

	// Hitung total pembayaran rawat jalan
	var totalBayarRawatJalan float64
	for _, item := range result {
		totalBayarRawatJalan += item.BesarBayar
	}

	// Tambahkan data piutang pasien
	var piutangResults []models.LaporanPiutangPasien
	var totalPiutang float64

	// Query SQL untuk piutang pasien dengan alias yang jelas untuk setiap kolom
	piutangQuery := `
		SELECT
			reg_periksa.no_rawat AS no_rawat, 
			penjab.png_jawab AS png_jawab, 
			detail_piutang_pasien.nama_bayar AS nama_bayar, 
			CAST(detail_piutang_pasien.totalpiutang AS DECIMAL(15,2)) AS totalpiutang
		FROM
			reg_periksa
			INNER JOIN piutang_pasien ON reg_periksa.no_rawat = piutang_pasien.no_rawat
			INNER JOIN detail_piutang_pasien ON reg_periksa.no_rawat = detail_piutang_pasien.no_rawat
			INNER JOIN penjab ON detail_piutang_pasien.kd_pj = penjab.kd_pj
		WHERE
			piutang_pasien.tgl_piutang BETWEEN ? AND ?
			AND reg_periksa.status_lanjut = 'Ralan'  -- Filter hanya untuk rawat jalan
	`

	// Eksekusi query menggunakan map untuk melihat data mentah dari database
	var rawPiutangResults []map[string]interface{}
	piutangQueryErr := db.Raw(piutangQuery, tanggalAwal, tanggalAkhir).Scan(&rawPiutangResults).Error
	if piutangQueryErr != nil {
		fmt.Printf("Gagal menjalankan query piutang: %v\n", piutangQueryErr)
		// Lanjutkan dengan data rawat jalan saja jika query piutang gagal
	} else {
		// Konversi hasil mentah ke struct LaporanPiutangPasien
		for _, raw := range rawPiutangResults {
			var piutang float64

			// Coba ekstrak nilai totalpiutang dengan berbagai cara
			if val, ok := raw["totalpiutang"]; ok {
				switch v := val.(type) {
				case float64:
					piutang = v
				case float32:
					piutang = float64(v)
				case int64:
					piutang = float64(v)
				case int:
					piutang = float64(v)
				case string:
					fmt.Sscanf(v, "%f", &piutang)
				case []uint8:
					// Konversi []uint8 ke string lalu ke float64
					str := string(v)
					fmt.Sscanf(str, "%f", &piutang)
				case map[string]interface{}:
					// Jika nilai adalah map, coba ambil sebagai float
					if floatVal, ok := v["value"].(float64); ok {
						piutang = floatVal
					}
				case nil:
					// Abaikan nilai nil
					piutang = 0
				default:
					fmt.Printf("Tipe data tidak dikenali untuk totalpiutang: %T dengan nilai %v\n", v, v)
				}
			}

			item := models.LaporanPiutangPasien{
				NoRawat:      fmt.Sprintf("%v", raw["no_rawat"]),
				PngJawab:     fmt.Sprintf("%v", raw["png_jawab"]),
				NamaBayar:    fmt.Sprintf("%v", raw["nama_bayar"]),
				TotalPiutang: piutang,
			}
			piutangResults = append(piutangResults, item)
			totalPiutang += piutang
		}

		// Jika total piutang masih 0 dan ada data piutang, coba query sum
		if totalPiutang == 0 && len(piutangResults) > 0 {
			var sumResult struct {
				Total float64
			}

			sumQuery := `
				SELECT SUM(CAST(detail_piutang_pasien.totalpiutang AS DECIMAL(15,2))) as total
				FROM
					reg_periksa
					INNER JOIN piutang_pasien ON reg_periksa.no_rawat = piutang_pasien.no_rawat
					INNER JOIN detail_piutang_pasien ON reg_periksa.no_rawat = detail_piutang_pasien.no_rawat
					INNER JOIN penjab ON detail_piutang_pasien.kd_pj = penjab.kd_pj
				WHERE
					piutang_pasien.tgl_piutang BETWEEN ? AND ?
					AND reg_periksa.status_lanjut = 'Ralan'  -- Filter hanya untuk rawat jalan
			`

			sumErr := db.Raw(sumQuery, tanggalAwal, tanggalAkhir).Scan(&sumResult).Error
			if sumErr == nil {
				totalPiutang = sumResult.Total
			} else {
				fmt.Printf("Gagal menjalankan query sum piutang: %v\n", sumErr)
			}
		}
	}

	fmt.Printf("Jumlah data piutang yang ditemukan: %d\n", len(piutangResults))
	fmt.Printf("Total piutang: %.2f\n", totalPiutang)

	// Query untuk mendapatkan gabungan total rawat jalan dan piutang
	var totalGabunganQuery string

	if filterBy == "tgl_bayar" {
		totalGabunganQuery = `
			SELECT 
				COALESCE(SUM(jalan.total), 0) as total_rawat_jalan,
				COALESCE(SUM(piutang.total), 0) as total_piutang,
				COALESCE(SUM(jalan.total), 0) + COALESCE(SUM(piutang.total), 0) as total_pendapatan
			FROM
			(
				-- Subquery untuk total rawat jalan dengan filter tgl_bayar
				SELECT 
					SUM(detail_nota_jalan.besar_bayar) as total
				FROM
					reg_periksa
				INNER JOIN pasien ON reg_periksa.no_rkm_medis = pasien.no_rkm_medis
				INNER JOIN poliklinik ON reg_periksa.kd_poli = poliklinik.kd_poli
				LEFT JOIN nota_jalan ON nota_jalan.no_rawat = reg_periksa.no_rawat
				LEFT JOIN detail_nota_jalan ON detail_nota_jalan.no_rawat = reg_periksa.no_rawat
				WHERE
					nota_jalan.tanggal BETWEEN ? AND ?
					AND reg_periksa.status_lanjut = 'Ralan'
			) as jalan,
			(
				-- Subquery untuk total piutang dengan periode yang sama
				SELECT 
					SUM(CAST(detail_piutang_pasien.totalpiutang AS DECIMAL(15,2))) as total
				FROM
					reg_periksa
					INNER JOIN piutang_pasien ON reg_periksa.no_rawat = piutang_pasien.no_rawat
					INNER JOIN detail_piutang_pasien ON reg_periksa.no_rawat = detail_piutang_pasien.no_rawat
				WHERE
					piutang_pasien.tgl_piutang BETWEEN ? AND ?
					AND reg_periksa.status_lanjut = 'Ralan'
			) as piutang
		`
	} else if filterBy == "tgl_registrasi" {
		totalGabunganQuery = `
			SELECT 
				COALESCE(SUM(jalan.total), 0) as total_rawat_jalan,
				COALESCE(SUM(piutang.total), 0) as total_piutang,
				COALESCE(SUM(jalan.total), 0) + COALESCE(SUM(piutang.total), 0) as total_pendapatan
			FROM
			(
				-- Subquery untuk total rawat jalan dengan filter tgl_registrasi
				SELECT 
					SUM(detail_nota_jalan.besar_bayar) as total
				FROM
					reg_periksa
				INNER JOIN pasien ON reg_periksa.no_rkm_medis = pasien.no_rkm_medis
				INNER JOIN poliklinik ON reg_periksa.kd_poli = poliklinik.kd_poli
				LEFT JOIN nota_jalan ON nota_jalan.no_rawat = reg_periksa.no_rawat
				LEFT JOIN detail_nota_jalan ON detail_nota_jalan.no_rawat = reg_periksa.no_rawat
				WHERE
					reg_periksa.tgl_registrasi BETWEEN ? AND ?
					AND reg_periksa.status_lanjut = 'Ralan'
			) as jalan,
			(
				-- Subquery untuk total piutang dengan periode yang sama
				SELECT 
					SUM(CAST(detail_piutang_pasien.totalpiutang AS DECIMAL(15,2))) as total
				FROM
					reg_periksa
					INNER JOIN piutang_pasien ON reg_periksa.no_rawat = piutang_pasien.no_rawat
					INNER JOIN detail_piutang_pasien ON reg_periksa.no_rawat = detail_piutang_pasien.no_rawat
				WHERE
					piutang_pasien.tgl_piutang BETWEEN ? AND ?
					AND reg_periksa.status_lanjut = 'Ralan'
			) as piutang
		`
	} else {
		// Default (both)
		totalGabunganQuery = `
			SELECT 
				COALESCE(SUM(jalan.total), 0) as total_rawat_jalan,
				COALESCE(SUM(piutang.total), 0) as total_piutang,
				COALESCE(SUM(jalan.total), 0) + COALESCE(SUM(piutang.total), 0) as total_pendapatan
			FROM
			(
				-- Subquery untuk total rawat jalan dengan filter both
				SELECT 
					SUM(detail_nota_jalan.besar_bayar) as total
				FROM
					reg_periksa
				INNER JOIN pasien ON reg_periksa.no_rkm_medis = pasien.no_rkm_medis
				INNER JOIN poliklinik ON reg_periksa.kd_poli = poliklinik.kd_poli
				LEFT JOIN nota_jalan ON nota_jalan.no_rawat = reg_periksa.no_rawat
				LEFT JOIN detail_nota_jalan ON detail_nota_jalan.no_rawat = reg_periksa.no_rawat
				WHERE
					(reg_periksa.tgl_registrasi BETWEEN ? AND ?)
					OR (nota_jalan.tanggal BETWEEN ? AND ?)
					AND reg_periksa.status_lanjut = 'Ralan'
			) as jalan,
			(
				-- Subquery untuk total piutang dengan periode yang sama
				SELECT 
					SUM(CAST(detail_piutang_pasien.totalpiutang AS DECIMAL(15,2))) as total
				FROM
					reg_periksa
					INNER JOIN piutang_pasien ON reg_periksa.no_rawat = piutang_pasien.no_rawat
					INNER JOIN detail_piutang_pasien ON reg_periksa.no_rawat = detail_piutang_pasien.no_rawat
				WHERE
					piutang_pasien.tgl_piutang BETWEEN ? AND ?
					AND reg_periksa.status_lanjut = 'Ralan'
			) as piutang
		`
	}

	// Log query yang akan dijalankan
	fmt.Printf("Filter By: %s\n", filterBy)
	fmt.Printf("Query gabungan yang akan dijalankan: %s\n", totalGabunganQuery)
	fmt.Printf("Parameter: tanggal_awal=%s, tanggal_akhir=%s\n", tanggalAwal, tanggalAkhir)

	// Eksekusi query total gabungan
	var totalGabungan struct {
		TotalRawatJalan float64 `json:"total_rawat_jalan"`
		TotalPiutang    float64 `json:"total_piutang"`
		TotalPendapatan float64 `json:"total_pendapatan"`
	}

	var totalGabunganErr error
	if filterBy == "tgl_bayar" || filterBy == "tgl_registrasi" {
		totalGabunganErr = db.Raw(totalGabunganQuery,
			tanggalAwal, tanggalAkhir,
			tanggalAwal, tanggalAkhir).Scan(&totalGabungan).Error
	} else {
		totalGabunganErr = db.Raw(totalGabunganQuery,
			tanggalAwal, tanggalAkhir,
			tanggalAwal, tanggalAkhir,
			tanggalAwal, tanggalAkhir).Scan(&totalGabungan).Error
	}

	if totalGabunganErr != nil {
		fmt.Printf("Gagal menjalankan query total gabungan: %v\n", totalGabunganErr)
		// Tetap gunakan total yang dihitung dari query terpisah jika query gabungan gagal
	} else {
		// Jika query gabungan berhasil, gunakan nilai totalnya
		totalBayarRawatJalan = totalGabungan.TotalRawatJalan
		totalPiutang = totalGabungan.TotalPiutang

		fmt.Printf("Total dari query gabungan - Rawat Jalan: %.2f, Piutang: %.2f, Total: %.2f\n",
			totalGabungan.TotalRawatJalan, totalGabungan.TotalPiutang, totalGabungan.TotalPendapatan)
	}

	// Siapkan response
	response := map[string]interface{}{
		"status":  "success",
		"message": "Data laporan rawat jalan dan piutang pasien berhasil diambil dari database",
		"filter": map[string]string{
			"tanggal_awal":  tanggalAwal,
			"tanggal_akhir": tanggalAkhir,
		},
		"total_data_rawat_jalan":  len(result),
		"total_bayar_rawat_jalan": totalBayarRawatJalan,
		"data_rawat_jalan":        result,
		"total_data_piutang":      len(piutangResults),
		"total_piutang":           totalPiutang,
		"data_piutang":            piutangResults,
		"total_pendapatan":        totalBayarRawatJalan + totalPiutang,
	}

	// Jika parameter includePiutang = false, hapus data piutang detail
	if includePiutang == "false" {
		delete(response, "data_piutang")
	}

	// Encode respons ke JSON
	encoder := json.NewEncoder(w)
	if err := encoder.Encode(response); err != nil {
		http.Error(w, fmt.Sprintf("Gagal mengenkode response: %v", err), http.StatusInternalServerError)
		return
	}
}
