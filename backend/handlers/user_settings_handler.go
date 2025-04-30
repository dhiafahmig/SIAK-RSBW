package handlers

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"siak-rsbw/backend/models"
	"siak-rsbw/backend/utils"
	"strconv"
)

// GetUserSettingsHandler menangani permintaan mendapatkan pengaturan pengguna
func GetUserSettingsHandler(w http.ResponseWriter, r *http.Request) {
	// Hanya menerima metode GET
	if r.Method != http.MethodGet {
		http.Error(w, "Metode tidak diijinkan", http.StatusMethodNotAllowed)
		return
	}

	// Mendapatkan ID dari query parameter
	userIDStr := r.URL.Query().Get("id")
	if userIDStr == "" {
		http.Error(w, "ID pengguna diperlukan", http.StatusBadRequest)
		return
	}

	userID, err := strconv.ParseUint(userIDStr, 10, 32)
	if err != nil {
		http.Error(w, "ID pengguna tidak valid", http.StatusBadRequest)
		return
	}

	// Mendapatkan koneksi database
	db := utils.GetDB()

	// Mencari pengguna di database
	user, err := models.FindUserByID(db, uint(userID))
	if err != nil {
		http.Error(w, "Pengguna tidak ditemukan", http.StatusNotFound)
		return
	}

	log.Printf("GetUserSettings - User ID: %d, Dark Mode: %v (Type: %T)", user.ID, user.DarkMode, user.DarkMode)

	// Menyiapkan respons
	response := map[string]interface{}{
		"dark_mode": user.DarkMode,
	}

	// Mengatur header
	w.Header().Set("Content-Type", "application/json")

	// Encode respons ke JSON
	json.NewEncoder(w).Encode(response)
}

// UpdateDarkModeHandler menangani permintaan memperbarui preferensi dark mode
func UpdateDarkModeHandler(w http.ResponseWriter, r *http.Request) {
	// Hanya menerima metode POST
	if r.Method != http.MethodPost {
		http.Error(w, "Metode tidak diijinkan", http.StatusMethodNotAllowed)
		return
	}

	// Mendapatkan ID dari query parameter
	userIDStr := r.URL.Query().Get("id")
	if userIDStr == "" {
		http.Error(w, "ID pengguna diperlukan", http.StatusBadRequest)
		return
	}

	userID, err := strconv.ParseUint(userIDStr, 10, 32)
	if err != nil {
		http.Error(w, "ID pengguna tidak valid", http.StatusBadRequest)
		return
	}

	// Decode body permintaan
	var request struct {
		DarkMode interface{} `json:"dark_mode"`
	}

	if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
		log.Printf("UpdateDarkMode - Error decoding request: %v", err)
		http.Error(w, "Format permintaan tidak valid", http.StatusBadRequest)
		return
	}

	log.Printf("UpdateDarkMode - Request payload: %+v (Type DarkMode: %T)", request, request.DarkMode)

	// Konversi dark_mode ke boolean
	var darkModeValue bool
	switch v := request.DarkMode.(type) {
	case bool:
		darkModeValue = v
	case float64:
		darkModeValue = v != 0
	case int:
		darkModeValue = v != 0
	case string:
		darkModeValue = v == "true" || v == "1"
	default:
		log.Printf("UpdateDarkMode - Unknown dark_mode type: %T, value: %v", request.DarkMode, request.DarkMode)
		http.Error(w, fmt.Sprintf("Tipe data dark_mode tidak didukung: %T", request.DarkMode), http.StatusBadRequest)
		return
	}

	log.Printf("UpdateDarkMode - Converted darkModeValue: %v", darkModeValue)

	// Mendapatkan koneksi database
	db := utils.GetDB()

	// Mencari pengguna di database
	user, err := models.FindUserByID(db, uint(userID))
	if err != nil {
		http.Error(w, "Pengguna tidak ditemukan", http.StatusNotFound)
		return
	}

	log.Printf("UpdateDarkMode - Before update - User ID: %d, Current Dark Mode: %v", user.ID, user.DarkMode)

	// Update preferensi dark mode
	user.DarkMode = darkModeValue
	result := db.Save(user)
	if result.Error != nil {
		log.Printf("UpdateDarkMode - Error saving to database: %v", result.Error)
		http.Error(w, "Gagal menyimpan pengaturan", http.StatusInternalServerError)
		return
	}

	log.Printf("UpdateDarkMode - After update - User ID: %d, New Dark Mode: %v, Rows affected: %d", user.ID, user.DarkMode, result.RowsAffected)

	// Menyiapkan respons
	response := map[string]interface{}{
		"message":   "Preferensi dark mode diperbarui",
		"dark_mode": user.DarkMode,
		"user_id":   user.ID,
	}

	// Mengatur header
	w.Header().Set("Content-Type", "application/json")

	// Encode respons ke JSON
	json.NewEncoder(w).Encode(response)
}
