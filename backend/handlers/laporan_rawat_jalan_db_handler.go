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

	// Buat query berdasarkan filter dengan optimasi untuk kecepatan
	if filterBy == "tgl_bayar" {
		query = `
			SELECT 
				reg_periksa.no_rawat,
				pasien.no_rkm_medis,
				pasien.nm_pasien,
				reg_periksa.tgl_registrasi,
				poliklinik.nm_poli,
				nota_jalan.no_nota,
				nota_jalan.tanggal as tgl_bayar,
				COALESCE(detail_nota_jalan.besar_bayar, 0) as besar_bayar,
				penjab.png_jawab,
				reg_periksa.kd_pj
			FROM
				reg_periksa USE INDEX (status_lanjut)
			INNER JOIN pasien ON reg_periksa.no_rkm_medis = pasien.no_rkm_medis
			INNER JOIN poliklinik ON reg_periksa.kd_poli = poliklinik.kd_poli
			INNER JOIN penjab ON reg_periksa.kd_pj = penjab.kd_pj
			LEFT JOIN nota_jalan ON nota_jalan.no_rawat = reg_periksa.no_rawat
			LEFT JOIN detail_nota_jalan ON detail_nota_jalan.no_rawat = reg_periksa.no_rawat
			WHERE
				nota_jalan.tanggal BETWEEN ? AND ?
				AND reg_periksa.status_lanjut = 'Ralan'
			ORDER BY detail_nota_jalan.besar_bayar DESC
			LIMIT 300
		`
	} else if filterBy == "tgl_registrasi" {
		query = `
			SELECT 
				reg_periksa.no_rawat,
				pasien.no_rkm_medis,
				pasien.nm_pasien,
				reg_periksa.tgl_registrasi,
				poliklinik.nm_poli,
				nota_jalan.no_nota,
				nota_jalan.tanggal as tgl_bayar,
				COALESCE(detail_nota_jalan.besar_bayar, 0) as besar_bayar,
				penjab.png_jawab,
				reg_periksa.kd_pj
			FROM
				reg_periksa USE INDEX (tgl_registrasi, status_lanjut)
			INNER JOIN pasien ON reg_periksa.no_rkm_medis = pasien.no_rkm_medis
			INNER JOIN poliklinik ON reg_periksa.kd_poli = poliklinik.kd_poli
			INNER JOIN penjab ON reg_periksa.kd_pj = penjab.kd_pj
			LEFT JOIN nota_jalan ON nota_jalan.no_rawat = reg_periksa.no_rawat
			LEFT JOIN detail_nota_jalan ON detail_nota_jalan.no_rawat = reg_periksa.no_rawat
			WHERE
				reg_periksa.tgl_registrasi BETWEEN ? AND ?
				AND reg_periksa.status_lanjut = 'Ralan'
			ORDER BY penjab.png_jawab LIKE '%BPJS%' DESC, detail_nota_jalan.besar_bayar DESC
			LIMIT 300
		`
	} else {
		// Query default atau filterBy=both (filter by tgl_registrasi OR tgl_bayar)
		query = `
			SELECT 
				reg_periksa.no_rawat,
				pasien.no_rkm_medis,
				pasien.nm_pasien,
				reg_periksa.tgl_registrasi,
				poliklinik.nm_poli,
				nota_jalan.no_nota,
				nota_jalan.tanggal as tgl_bayar,
				COALESCE(detail_nota_jalan.besar_bayar, 0) as besar_bayar,
				penjab.png_jawab,
				reg_periksa.kd_pj
			FROM
				reg_periksa USE INDEX (tgl_registrasi, status_lanjut)
			INNER JOIN pasien ON reg_periksa.no_rkm_medis = pasien.no_rkm_medis
			INNER JOIN poliklinik ON reg_periksa.kd_poli = poliklinik.kd_poli
			INNER JOIN penjab ON reg_periksa.kd_pj = penjab.kd_pj
			LEFT JOIN nota_jalan ON nota_jalan.no_rawat = reg_periksa.no_rawat
			LEFT JOIN detail_nota_jalan ON detail_nota_jalan.no_rawat = reg_periksa.no_rawat
			WHERE
				reg_periksa.tgl_registrasi BETWEEN ? AND ?
				AND reg_periksa.status_lanjut = 'Ralan'
			ORDER BY penjab.png_jawab LIKE '%BPJS%' DESC, detail_nota_jalan.besar_bayar DESC
			LIMIT 300
		`
	}

	// Eksekusi query
	var result []models.LaporanRawatJalan

	// Log detail query untuk debugging
	fmt.Printf("Filter By: %s\n", filterBy)
	fmt.Printf("Query yang dijalankan: %s\n", query)
	fmt.Printf("Parameter: tanggal_awal=%s, tanggal_akhir=%s\n", tanggalAwal, tanggalAkhir)

	var queryErr error
	if filterBy == "tgl_bayar" {
		queryErr = db.Raw(query,
			tanggalAwal, tanggalAkhir, // Parameter untuk nota_jalan.tanggal
		).Scan(&result).Error
	} else if filterBy == "tgl_registrasi" {
		queryErr = db.Raw(query,
			tanggalAwal, tanggalAkhir, // Parameter untuk reg_periksa.tgl_registrasi
		).Scan(&result).Error
	} else {
		// Untuk filter "both", gunakan 2 parameter untuk satu query
		queryErr = db.Raw(query,
			tanggalAwal, tanggalAkhir, // Parameter untuk reg_periksa.tgl_registrasi
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

	// Query untuk total pembayaran rawat jalan (dipisahkan untuk performa lebih baik)
	var totalBayarRawatJalan float64
	var totalQuery string

	if filterBy == "tgl_bayar" {
		totalQuery = `
			SELECT COALESCE(SUM(detail_nota_jalan.besar_bayar), 0) as total
			FROM reg_periksa USE INDEX (status_lanjut)
			INNER JOIN nota_jalan ON nota_jalan.no_rawat = reg_periksa.no_rawat
			LEFT JOIN detail_nota_jalan ON detail_nota_jalan.no_rawat = reg_periksa.no_rawat
			WHERE nota_jalan.tanggal BETWEEN ? AND ?
			AND reg_periksa.status_lanjut = 'Ralan'
		`
	} else if filterBy == "tgl_registrasi" {
		totalQuery = `
			SELECT COALESCE(SUM(detail_nota_jalan.besar_bayar), 0) as total
			FROM reg_periksa USE INDEX (tgl_registrasi, status_lanjut)
			LEFT JOIN nota_jalan ON nota_jalan.no_rawat = reg_periksa.no_rawat
			LEFT JOIN detail_nota_jalan ON detail_nota_jalan.no_rawat = reg_periksa.no_rawat
			WHERE reg_periksa.tgl_registrasi BETWEEN ? AND ?
			AND reg_periksa.status_lanjut = 'Ralan'
		`
	} else {
		totalQuery = `
			SELECT COALESCE(SUM(detail_nota_jalan.besar_bayar), 0) as total
			FROM reg_periksa USE INDEX (tgl_registrasi, status_lanjut)
			LEFT JOIN nota_jalan ON nota_jalan.no_rawat = reg_periksa.no_rawat
			LEFT JOIN detail_nota_jalan ON detail_nota_jalan.no_rawat = reg_periksa.no_rawat
			WHERE reg_periksa.tgl_registrasi BETWEEN ? AND ?
			AND reg_periksa.status_lanjut = 'Ralan'
		`
	}

	var totalResult struct {
		Total float64
	}

	var totalQueryErr error
	if filterBy == "tgl_bayar" || filterBy == "tgl_registrasi" {
		totalQueryErr = db.Raw(totalQuery, tanggalAwal, tanggalAkhir).Scan(&totalResult).Error
	} else {
		totalQueryErr = db.Raw(totalQuery, tanggalAwal, tanggalAkhir).Scan(&totalResult).Error
	}

	if totalQueryErr == nil {
		totalBayarRawatJalan = totalResult.Total
	} else {
		fmt.Printf("Gagal menjalankan query total: %v\n", totalQueryErr)
		// Hitung dari hasil yang ada jika query gagal
		for _, item := range result {
			totalBayarRawatJalan += item.BesarBayar
		}
	}

	// Tambahkan data piutang pasien - optimasi query piutang
	var piutangResults []models.LaporanPiutangPasien
	var totalPiutang float64

	// Query SQL untuk total piutang (tanpa detail untuk kecepatan)
	piutangTotalQuery := `
		SELECT COALESCE(SUM(CAST(detail_piutang_pasien.totalpiutang AS DECIMAL(15,2))), 0) as total
		FROM reg_periksa USE INDEX (status_lanjut)
		INNER JOIN piutang_pasien ON reg_periksa.no_rawat = piutang_pasien.no_rawat
		INNER JOIN detail_piutang_pasien ON reg_periksa.no_rawat = detail_piutang_pasien.no_rawat
		WHERE piutang_pasien.tgl_piutang BETWEEN ? AND ?
		AND reg_periksa.status_lanjut = 'Ralan'
	`

	var piutangTotalResult struct {
		Total float64
	}

	piutangTotalErr := db.Raw(piutangTotalQuery, tanggalAwal, tanggalAkhir).Scan(&piutangTotalResult).Error
	if piutangTotalErr == nil {
		totalPiutang = piutangTotalResult.Total
	} else {
		fmt.Printf("Gagal menjalankan query total piutang: %v\n", piutangTotalErr)
	}

	// Hanya ambil detail piutang jika includePiutang = true
	if includePiutang == "true" {
		// Query SQL untuk piutang pasien dengan alias yang jelas untuk setiap kolom
		piutangQuery := `
			SELECT
				reg_periksa.no_rawat AS no_rawat, 
				penjab.png_jawab AS png_jawab, 
				detail_piutang_pasien.nama_bayar AS nama_bayar, 
				CAST(detail_piutang_pasien.totalpiutang AS DECIMAL(15,2)) AS totalpiutang
			FROM
				reg_periksa USE INDEX (status_lanjut)
				INNER JOIN piutang_pasien ON reg_periksa.no_rawat = piutang_pasien.no_rawat
				INNER JOIN detail_piutang_pasien ON reg_periksa.no_rawat = detail_piutang_pasien.no_rawat
				INNER JOIN penjab ON detail_piutang_pasien.kd_pj = penjab.kd_pj
			WHERE
				piutang_pasien.tgl_piutang BETWEEN ? AND ?
				AND reg_periksa.status_lanjut = 'Ralan'
			LIMIT 500
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
			}
		}
	}

	fmt.Printf("Jumlah data piutang yang ditemukan: %d\n", len(piutangResults))
	fmt.Printf("Total piutang: %.2f\n", totalPiutang)

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
