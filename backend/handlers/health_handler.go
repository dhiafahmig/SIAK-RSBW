package handlers

import (
	"encoding/json"
	"net/http"
	"siak-rsbw/backend/utils"
	"time"
)

// DatabaseStatus menyimpan informasi status database
type DatabaseStatus struct {
	Connected   bool      `json:"connected"`
	Message     string    `json:"message"`
	TimeChecked time.Time `json:"time_checked"`
	DBName      string    `json:"db_name,omitempty"`
	Tables      []string  `json:"tables,omitempty"`
}

// HealthCheckHandler menangani permintaan untuk memeriksa kesehatan aplikasi
func HealthCheckHandler(w http.ResponseWriter, r *http.Request) {
	// Set header Content-Type
	w.Header().Set("Content-Type", "application/json")

	// Periksa koneksi database
	var status DatabaseStatus

	// Dapatkan instance SQL DB dari GORM
	sqlDB, err := utils.DB.DB()
	if err != nil {
		status = DatabaseStatus{
			Connected:   false,
			Message:     "Gagal mendapatkan instance database: " + err.Error(),
			TimeChecked: time.Now(),
		}
	} else {
		// Coba ping database
		err = sqlDB.Ping()
		if err != nil {
			status = DatabaseStatus{
				Connected:   false,
				Message:     "Gagal melakukan ping ke database: " + err.Error(),
				TimeChecked: time.Now(),
			}
		} else {
			// Coba dapatkan nama database
			var dbName string
			row := utils.DB.Raw("SELECT current_database()").Row()
			row.Scan(&dbName)

			// Dapatkan daftar tabel
			var tables []string
			if dbName != "" {
				rows, err := utils.DB.Raw("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'").Rows()
				if err == nil {
					defer rows.Close()
					for rows.Next() {
						var tableName string
						rows.Scan(&tableName)
						tables = append(tables, tableName)
					}
				}
			}

			status = DatabaseStatus{
				Connected:   true,
				Message:     "Koneksi database aktif",
				TimeChecked: time.Now(),
				DBName:      dbName,
				Tables:      tables,
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

// FixDatabaseHandler menangani permintaan untuk memperbaiki database
func FixDatabaseHandler(w http.ResponseWriter, r *http.Request) {
	// Set header Content-Type
	w.Header().Set("Content-Type", "application/json")

	// Hanya menerima metode POST
	if r.Method != http.MethodPost {
		http.Error(w, "Metode tidak diijinkan", http.StatusMethodNotAllowed)
		return
	}

	// Coba lakukan auto migrate ulang
	err := utils.DB.AutoMigrate(utils.GetUserModel())
	if err != nil {
		http.Error(w, "Gagal melakukan auto migrate: "+err.Error(), http.StatusInternalServerError)
		return
	}

	// Buat user admin default jika belum ada
	err = utils.CreateDefaultAdminIfNotExists()
	if err != nil {
		http.Error(w, "Gagal membuat user admin: "+err.Error(), http.StatusInternalServerError)
		return
	}

	// Berhasil
	response := map[string]string{
		"status":  "success",
		"message": "Database telah diperbaiki dan tabel users telah dibuat. User admin default telah dibuat jika belum ada.",
	}

	// Encode response JSON
	encoder := json.NewEncoder(w)
	if err := encoder.Encode(response); err != nil {
		http.Error(w, "Gagal mengenkode response", http.StatusInternalServerError)
		return
	}
}
