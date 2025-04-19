package handlers

import (
	"encoding/json"
	"net/http"
	"siak-rsbw/backend/models"
	"siak-rsbw/backend/utils"
)

// LoginRequest struktur untuk request login
type LoginRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

// LoginResponse struktur untuk response login
type LoginResponse struct {
	Token string      `json:"token"`
	User  models.User `json:"user"`
}

// LoginHandler menangani permintaan login
func LoginHandler(w http.ResponseWriter, r *http.Request) {
	// Hanya menerima metode POST
	if r.Method != http.MethodPost {
		http.Error(w, "Metode tidak diijinkan", http.StatusMethodNotAllowed)
		return
	}

	// Decode request JSON
	var request LoginRequest
	decoder := json.NewDecoder(r.Body)
	if err := decoder.Decode(&request); err != nil {
		http.Error(w, "Format JSON tidak valid", http.StatusBadRequest)
		return
	}

	// Validasi kredensial
	user := models.ValidateCredentials(request.Username, request.Password)
	if user == nil {
		http.Error(w, "Username atau password salah", http.StatusUnauthorized)
		return
	}

	// Buat JWT token
	token, err := utils.GenerateJWT(user.ID)
	if err != nil {
		http.Error(w, "Gagal membuat token", http.StatusInternalServerError)
		return
	}

	// Buat response
	response := LoginResponse{
		Token: token,
		User: models.User{
			ID:       user.ID,
			Username: user.Username,
			Role:     user.Role,
			Name:     user.Name,
		},
	}

	// Set header Content-Type
	w.Header().Set("Content-Type", "application/json")

	// Encode response JSON
	encoder := json.NewEncoder(w)
	if err := encoder.Encode(response); err != nil {
		http.Error(w, "Gagal mengenkode response", http.StatusInternalServerError)
		return
	}
}

// ProfileHandler menangani permintaan untuk mendapatkan profil pengguna
func ProfileHandler(w http.ResponseWriter, r *http.Request) {
	// Hanya menerima metode GET
	if r.Method != http.MethodGet {
		http.Error(w, "Metode tidak diijinkan", http.StatusMethodNotAllowed)
		return
	}

	// Dapatkan userID dari context request
	// Context ini diisi oleh middleware auth
	userID, ok := r.Context().Value("userID").(string)
	if !ok {
		http.Error(w, "Tidak terautentikasi", http.StatusUnauthorized)
		return
	}

	// Cari user berdasarkan ID
	user := models.FindUserByID(userID)
	if user == nil {
		http.Error(w, "Pengguna tidak ditemukan", http.StatusNotFound)
		return
	}

	// Set header Content-Type
	w.Header().Set("Content-Type", "application/json")

	// Encode response JSON
	encoder := json.NewEncoder(w)
	if err := encoder.Encode(user); err != nil {
		http.Error(w, "Gagal mengenkode response", http.StatusInternalServerError)
		return
	}
}
