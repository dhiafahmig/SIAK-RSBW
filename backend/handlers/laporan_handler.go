package handlers

import (
	"encoding/json"
	"net/http"
	"siak-rsbw/backend/models"
	"time"
)

// LaporanRawatInapHandler menangani permintaan untuk mendapatkan laporan rawat inap
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

	// Data dummy untuk contoh
	dummyData := []models.LaporanRawatInap{
		{
			NoRawat:    "2023/01/001",
			NoRkmMedis: "RM001",
			NmPasien:   "NAMA PASIEN 1",
			TglMasuk:   parseDate("2023-01-05"),
			TglKeluar:  parseDate("2023-01-08"),
			NoNota:     "NOTA001",
			Tanggal:    parseDate("2023-01-08"),
			BesarBayar: 1500000,
		},
		{
			NoRawat:    "2023/01/002",
			NoRkmMedis: "RM002",
			NmPasien:   "NAMA PASIEN 2",
			TglMasuk:   parseDate("2023-01-10"),
			TglKeluar:  parseDate("2023-01-15"),
			NoNota:     "NOTA002",
			Tanggal:    parseDate("2023-01-15"),
			BesarBayar: 2000000,
		},
	}

	// Hitung total pembayaran
	var totalBayar float64
	for _, data := range dummyData {
		totalBayar += data.BesarBayar
	}

	// Siapkan response
	response := map[string]interface{}{
		"status":  "success",
		"message": "Data laporan rawat inap berhasil diambil",
		"filter": map[string]string{
			"tanggal_awal":  tanggalAwal,
			"tanggal_akhir": tanggalAkhir,
		},
		"total_data":  len(dummyData),
		"total_bayar": totalBayar,
		"data":        dummyData,
	}

	// Encode respons ke JSON
	encoder := json.NewEncoder(w)
	if err := encoder.Encode(response); err != nil {
		http.Error(w, "Gagal mengenkode response", http.StatusInternalServerError)
		return
	}
}

// parseDate adalah helper untuk mengubah string tanggal menjadi time.Time
func parseDate(dateStr string) time.Time {
	t, err := time.Parse("2006-01-02", dateStr)
	if err != nil {
		// Jika gagal parse, kembalikan waktu sekarang sebagai fallback
		return time.Now()
	}
	return t
}

// LaporanRawatJalanHandler menangani permintaan untuk mendapatkan laporan rawat jalan (data dummy)
func LaporanRawatJalanHandler(w http.ResponseWriter, r *http.Request) {
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

	// Data dummy untuk contoh
	dummyData := []models.LaporanRawatJalan{
		{
			NoRawat:    "2023/01/101",
			NoRkmMedis: "RM101",
			NmPasien:   "PASIEN RAWAT JALAN 1",
			NoNota:     "NJ001",
			Tanggal:    parseDate("2023-01-12"),
			BesarBayar: 750000,
		},
		{
			NoRawat:    "2023/01/102",
			NoRkmMedis: "RM102",
			NmPasien:   "PASIEN RAWAT JALAN 2",
			NoNota:     "NJ002",
			Tanggal:    parseDate("2023-01-15"),
			BesarBayar: 1250000,
		},
	}

	// Hitung total pembayaran
	var totalBayar float64
	for _, data := range dummyData {
		totalBayar += data.BesarBayar
	}

	// Siapkan response
	response := map[string]interface{}{
		"status":  "success",
		"message": "Data laporan rawat jalan berhasil diambil",
		"filter": map[string]string{
			"tanggal_awal":  tanggalAwal,
			"tanggal_akhir": tanggalAkhir,
		},
		"total_data":  len(dummyData),
		"total_bayar": totalBayar,
		"data":        dummyData,
	}

	// Encode respons ke JSON
	encoder := json.NewEncoder(w)
	if err := encoder.Encode(response); err != nil {
		http.Error(w, "Gagal mengenkode response", http.StatusInternalServerError)
		return
	}
}
