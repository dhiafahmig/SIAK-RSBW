package handlers

import (
	"encoding/json"
	"log"
	"net/http"
	"siak-rsbw/backend/models"
	"siak-rsbw/backend/utils"
	"time"

	"github.com/golang-jwt/jwt/v4"
)

// LoginRequest menyimpan data permintaan login
type LoginRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

// RegisterRequest menyimpan data permintaan registrasi
type RegisterRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
	Name     string `json:"name"`
	Role     string `json:"role"`
}

// AuthResponse menyimpan data respons otentikasi
type AuthResponse struct {
	Token    string      `json:"token"`
	User     models.User `json:"user"`
	ExpireAt time.Time   `json:"expire_at"`
}

// LoginHandler menangani permintaan login
func LoginHandler(w http.ResponseWriter, r *http.Request) {
	// Hanya menerima metode POST
	if r.Method != http.MethodPost {
		http.Error(w, "Metode tidak diizinkan", http.StatusMethodNotAllowed)
		return
	}

	// Decode permintaan JSON
	var req LoginRequest
	err := json.NewDecoder(r.Body).Decode(&req)
	if err != nil {
		http.Error(w, "Format JSON tidak valid", http.StatusBadRequest)
		return
	}

	// Validasi kredensial
	user, err := models.ValidateCredentials(utils.DB, req.Username, req.Password)
	if err != nil {
		http.Error(w, "Username atau password salah", http.StatusUnauthorized)
		return
	}

	// Buat token JWT
	expirationTime := time.Now().Add(24 * time.Hour)
	claims := jwt.MapClaims{
		"user_id":  user.ID,
		"username": user.Username,
		"role":     user.Role,
		"exp":      expirationTime.Unix(),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString([]byte(utils.JWTSecret))
	if err != nil {
		http.Error(w, "Gagal membuat token", http.StatusInternalServerError)
		return
	}

	// Kirim respons
	w.Header().Set("Content-Type", "application/json")
	response := AuthResponse{
		Token:    tokenString,
		User:     *user,
		ExpireAt: expirationTime,
	}

	err = json.NewEncoder(w).Encode(response)
	if err != nil {
		http.Error(w, "Gagal mengenkode respons", http.StatusInternalServerError)
		return
	}
}

// RegisterHandler menangani permintaan registrasi pengguna baru
func RegisterHandler(w http.ResponseWriter, r *http.Request) {
	// Log request
	log.Printf("RegisterHandler: Menerima request %s ke %s", r.Method, r.URL.Path)

	// Hanya menerima metode POST
	if r.Method != http.MethodPost {
		http.Error(w, "Metode tidak diizinkan", http.StatusMethodNotAllowed)
		return
	}

	// Decode permintaan JSON
	var req RegisterRequest
	err := json.NewDecoder(r.Body).Decode(&req)
	if err != nil {
		http.Error(w, "Format JSON tidak valid", http.StatusBadRequest)
		return
	}

	// Validasi input
	if req.Username == "" || req.Password == "" || req.Name == "" {
		http.Error(w, "Username, password, dan nama wajib diisi", http.StatusBadRequest)
		return
	}

	// Cek apakah username sudah ada
	var existingUserCount int64
	utils.DB.Model(&models.User{}).Where("username = ?", req.Username).Count(&existingUserCount)
	if existingUserCount > 0 {
		http.Error(w, "Username sudah digunakan", http.StatusConflict)
		return
	}

	// Tentukan role (default: user)
	role := req.Role
	if role == "" {
		role = "user"
	}

	// Buat user baru
	newUser := models.User{
		Username: req.Username,
		Name:     req.Name,
		Role:     role,
	}

	// Set dan hash password
	err = newUser.SetPassword(req.Password)
	if err != nil {
		http.Error(w, "Gagal mengatur password: "+err.Error(), http.StatusInternalServerError)
		return
	}

	// Simpan ke database
	result := utils.DB.Create(&newUser)
	if result.Error != nil {
		http.Error(w, "Gagal membuat pengguna: "+result.Error.Error(), http.StatusInternalServerError)
		return
	}

	// Buat token JWT
	expirationTime := time.Now().Add(24 * time.Hour)
	claims := jwt.MapClaims{
		"user_id":  newUser.ID,
		"username": newUser.Username,
		"role":     newUser.Role,
		"exp":      expirationTime.Unix(),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString([]byte(utils.JWTSecret))
	if err != nil {
		http.Error(w, "Gagal membuat token", http.StatusInternalServerError)
		return
	}

	// Kirim respons
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	response := AuthResponse{
		Token:    tokenString,
		User:     newUser,
		ExpireAt: expirationTime,
	}

	err = json.NewEncoder(w).Encode(response)
	if err != nil {
		http.Error(w, "Gagal mengenkode respons", http.StatusInternalServerError)
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
	userID, ok := r.Context().Value("userID").(uint)
	if !ok {
		http.Error(w, "Tidak terautentikasi", http.StatusUnauthorized)
		return
	}

	// Cari user berdasarkan ID
	user, err := models.FindUserByID(utils.DB, userID)
	if err != nil {
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
