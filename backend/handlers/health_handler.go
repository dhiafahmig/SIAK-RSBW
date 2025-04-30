package handlers

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"siak-rsbw/backend/utils"
	"time"

	"gorm.io/driver/mysql"
	"gorm.io/gorm"
)

// DatabaseStatus menyimpan informasi status database
type DatabaseStatus struct {
	Connected   bool      `json:"connected"`
	Message     string    `json:"message"`
	TimeChecked time.Time `json:"time_checked"`
	DBName      string    `json:"db_name,omitempty"`
	Tables      []string  `json:"tables,omitempty"`
	DBType      string    `json:"db_type,omitempty"`
}

// MySQLStatus menyimpan informasi status koneksi MySQL
type MySQLStatus struct {
	Connected   bool      `json:"connected"`
	Message     string    `json:"message"`
	TimeChecked time.Time `json:"time_checked"`
	Host        string    `json:"host"`
	Port        string    `json:"port"`
	User        string    `json:"user"`
	Database    string    `json:"database"`
}

// HealthResponse adalah struktur respons untuk endpoint health check
type HealthResponse struct {
	MySQLDB    DatabaseStatus `json:"mysql_db"`
	MainDBType string         `json:"main_db_type"`
}

// HealthCheckHandler menangani permintaan untuk memeriksa kesehatan aplikasi
func HealthCheckHandler(w http.ResponseWriter, r *http.Request) {
	// Set header Content-Type
	w.Header().Set("Content-Type", "application/json")

	// Siapkan response dengan status database MySQL
	response := HealthResponse{
		MainDBType: utils.GetDatabaseType(),
	}

	// Periksa koneksi database MySQL
	response.MySQLDB = checkDatabaseConnection(utils.DB, "mysql")

	// Encode response JSON
	encoder := json.NewEncoder(w)
	if err := encoder.Encode(response); err != nil {
		http.Error(w, "Gagal mengenkode response", http.StatusInternalServerError)
		return
	}
}

// checkDatabaseConnection memeriksa koneksi database dan mengembalikan status
func checkDatabaseConnection(db *gorm.DB, dbType string) DatabaseStatus {
	if db == nil {
		log.Printf("Koneksi database %s tidak tersedia", dbType)
		return DatabaseStatus{
			Connected:   false,
			Message:     fmt.Sprintf("Database %s tidak tersedia", dbType),
			TimeChecked: time.Now(),
			DBType:      dbType,
		}
	}

	// Dapatkan instance SQL DB dari GORM
	sqlDB, err := db.DB()
	if err != nil {
		return DatabaseStatus{
			Connected:   false,
			Message:     "Gagal mendapatkan instance database: " + err.Error(),
			TimeChecked: time.Now(),
			DBType:      dbType,
		}
	}

	// Coba ping database
	err = sqlDB.Ping()
	if err != nil {
		return DatabaseStatus{
			Connected:   false,
			Message:     "Gagal melakukan ping ke database: " + err.Error(),
			TimeChecked: time.Now(),
			DBType:      dbType,
		}
	}

	// Coba dapatkan nama database
	var dbName string
	var tables []string

	if dbType == "mysql" {
		row := db.Raw("SELECT DATABASE()").Row()
		row.Scan(&dbName)

		// Dapatkan daftar tabel
		if dbName != "" {
			rows, err := db.Raw("SHOW TABLES").Rows()
			if err == nil {
				defer rows.Close()
				for rows.Next() {
					var tableName string
					rows.Scan(&tableName)
					tables = append(tables, tableName)
				}
			}
		}
	}

	return DatabaseStatus{
		Connected:   true,
		Message:     fmt.Sprintf("Koneksi database %s aktif", dbType),
		TimeChecked: time.Now(),
		DBName:      dbName,
		Tables:      tables,
		DBType:      dbType,
	}
}

// MySQLCheckHandler menangani permintaan untuk memeriksa koneksi ke MySQL
func MySQLCheckHandler(w http.ResponseWriter, r *http.Request) {
	// Set header Content-Type
	w.Header().Set("Content-Type", "application/json")

	// Periksa koneksi MySQL
	mysqlHost := getEnv("MYSQL_HOST", "localhost")
	mysqlPort := getEnv("MYSQL_PORT", "3306")
	mysqlUser := getEnv("MYSQL_USER", "root")
	mysqlPassword := getEnv("MYSQL_PASSWORD", "")
	mysqlDBName := getEnv("MYSQL_DBNAME", "sik_test")

	// Format DSN untuk MySQL
	dsn := fmt.Sprintf("%s:%s@tcp(%s:%s)/%s?charset=utf8mb4&parseTime=True&loc=Local",
		mysqlUser, mysqlPassword, mysqlHost, mysqlPort, mysqlDBName)

	var status MySQLStatus
	status.TimeChecked = time.Now()
	status.Host = mysqlHost
	status.Port = mysqlPort
	status.User = mysqlUser
	status.Database = mysqlDBName

	// Coba koneksi ke MySQL
	db, err := gorm.Open(mysql.Open(dsn), &gorm.Config{})
	if err != nil {
		status.Connected = false
		status.Message = fmt.Sprintf("Gagal terhubung ke database MySQL: %v", err)
	} else {
		// Dapatkan objek database SQL
		sqlDB, err := db.DB()
		if err != nil {
			status.Connected = false
			status.Message = fmt.Sprintf("Gagal mendapatkan objek SQL DB: %v", err)
		} else {
			// Tes Ping
			err = sqlDB.Ping()
			if err != nil {
				status.Connected = false
				status.Message = fmt.Sprintf("Ping database gagal: %v", err)
			} else {
				status.Connected = true
				status.Message = "Berhasil terhubung ke database MySQL"

				// Tutup koneksi setelah test
				sqlDB.Close()
			}
		}
	}

	// Encode response JSON
	encoder := json.NewEncoder(w)
	if err := encoder.Encode(status); err != nil {
		http.Error(w, "Gagal mengenkode response", http.StatusInternalServerError)
		return
	}
}

// getEnv mengambil nilai variabel lingkungan atau nilai default jika tidak ada
func getEnv(key, defaultValue string) string {
	if value, exists := os.LookupEnv(key); exists {
		return value
	}
	return defaultValue
}
