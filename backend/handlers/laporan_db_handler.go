package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"siak-rsbw/backend/models"
	"siak-rsbw/backend/utils"
	"time"

	"gorm.io/driver/mysql"
	"gorm.io/gorm"
)

// LaporanRawatInapDBHandler menangani permintaan untuk mendapatkan laporan rawat inap dari database MySQL
func LaporanRawatInapDBHandler(w http.ResponseWriter, r *http.Request) {
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

	// Cek apakah DB menggunakan MySQL
	dbType := utils.GetDatabaseType()
	if dbType != "mysql" {
		http.Error(w, "Endpoint ini hanya tersedia untuk database MySQL", http.StatusBadRequest)
		return
	}

	// Ambil konfigurasi MySQL
	mysqlHost := getEnvironmentVar("MYSQL_HOST", "192.168.10.88")
	mysqlPort := getEnvironmentVar("MYSQL_PORT", "3306")
	mysqlUser := getEnvironmentVar("MYSQL_USER", "backup")
	mysqlPassword := getEnvironmentVar("MYSQL_PASSWORD", "backup")
	mysqlDBName := getEnvironmentVar("MYSQL_DBNAME", "sik")

	// Log informasi koneksi
	fmt.Printf("Mencoba koneksi ke MySQL: %s@%s:%s/%s\n",
		mysqlUser, mysqlHost, mysqlPort, mysqlDBName)

	// Buat string koneksi DSN - tambahkan parameter allowAllFiles=true untuk akses eksternal
	dsn := fmt.Sprintf("%s:%s@tcp(%s:%s)/%s?charset=utf8mb4&parseTime=True&loc=Local&allowAllFiles=true",
		mysqlUser, mysqlPassword, mysqlHost, mysqlPort, mysqlDBName)

	// Tambahkan timeout yang lebih panjang
	gormConfig := &gorm.Config{
		PrepareStmt: true, // Siapkan statement untuk performa lebih baik
	}

	// Buat koneksi baru ke database dengan menampilkan log error lengkap
	db, err := gorm.Open(mysql.Open(dsn), gormConfig)
	if err != nil {
		errMessage := fmt.Sprintf("Gagal terhubung ke database: %v\nDSN: %s", err, dsn)
		fmt.Println(errMessage) // Cetak error ke log server
		http.Error(w, errMessage, http.StatusInternalServerError)
		return
	}

	// Coba test koneksi dengan ping
	sqlDB, err := db.DB()
	if err != nil {
		errMessage := fmt.Sprintf("Gagal mendapatkan instance SQL DB: %v", err)
		fmt.Println(errMessage)
		http.Error(w, errMessage, http.StatusInternalServerError)
		return
	}

	// Set timeout dan nilai-nilai koneksi
	sqlDB.SetConnMaxLifetime(time.Minute * 3)
	sqlDB.SetMaxOpenConns(10)
	sqlDB.SetMaxIdleConns(10)

	// Test ping
	err = sqlDB.Ping()
	if err != nil {
		errMessage := fmt.Sprintf("Ping database gagal: %v", err)
		fmt.Println(errMessage)
		http.Error(w, errMessage, http.StatusInternalServerError)
		return
	}

	fmt.Println("Koneksi ke database berhasil!")

	// Query SQL
	query := `
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
	`

	// Eksekusi query
	var result []models.LaporanRawatInap
	err = db.Raw(query,
		tanggalAwal,
		tanggalAkhir,
		tanggalAwal,
		tanggalAkhir,
	).Scan(&result).Error

	if err != nil {
		http.Error(w, fmt.Sprintf("Gagal menjalankan query: %v", err), http.StatusInternalServerError)
		return
	}

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
