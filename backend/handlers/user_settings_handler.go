package handlers

import (
	"encoding/json"
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
		DarkMode bool `json:"dark_mode"`
	}

	if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
		http.Error(w, "Format permintaan tidak valid", http.StatusBadRequest)
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

	// Update preferensi dark mode
	user.DarkMode = request.DarkMode
	db.Save(user)

	// Menyiapkan respons
	response := map[string]interface{}{
		"message":   "Preferensi dark mode diperbarui",
		"dark_mode": user.DarkMode,
	}

	// Mengatur header
	w.Header().Set("Content-Type", "application/json")

	// Encode respons ke JSON
	json.NewEncoder(w).Encode(response)
}
