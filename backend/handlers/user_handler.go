package handlers

import (
	"encoding/json"
	"net/http"
	"siak-rsbw/backend/models"
	"siak-rsbw/backend/utils"
	"strconv"
	"strings"

	"gorm.io/gorm"
)

// UserRequest menyimpan data permintaan pengguna
type UserRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
	Name     string `json:"name"`
	Role     string `json:"role"`
}

// GetIDFromURL mengekstrak ID dari URL (misalnya /api/users/123 akan mengembalikan 123)
func GetIDFromURL(path string) int {
	pathParts := strings.Split(path, "/")
	if len(pathParts) < 4 {
		return 0
	}

	idStr := pathParts[3]
	id, err := strconv.Atoi(idStr)
	if err != nil {
		return 0
	}

	return id
}

// Fungsi helper untuk mendapatkan database yang benar untuk user
func getUserDB() *gorm.DB {
	var dbToUse *gorm.DB
	// Jika menggunakan MySQL sebagai database utama tapi user ada di PostgreSQL
	if utils.GetDatabaseType() == "mysql" && utils.DB != utils.GetMySQLDB() {
		// Gunakan PostgreSQL untuk users
		dbToUse = utils.DB
	} else if utils.GetDatabaseType() == "mysql" && utils.DB == utils.GetMySQLDB() {
		// Jika menggunakan MySQL dan tabel users sudah dipindahkan ke MySQL
		dbToUse = utils.DB
	} else {
		// PostgreSQL adalah database utama
		dbToUse = utils.DB
	}
	return dbToUse
}

// GetUsersHandler menangani permintaan mendapatkan semua pengguna
func GetUsersHandler(w http.ResponseWriter, r *http.Request) {
	// Hanya menerima metode GET
	if r.Method != http.MethodGet {
		http.Error(w, "Metode tidak diizinkan", http.StatusMethodNotAllowed)
		return
	}

	// Verifikasi autentikasi
	_, ok := r.Context().Value("userID").(uint)
	if !ok {
		http.Error(w, "Tidak terautentikasi", http.StatusUnauthorized)
		return
	}

	// Dapatkan user role dari context
	userRole, ok := r.Context().Value("userRole").(string)
	if !ok || userRole != "admin" {
		http.Error(w, "Tidak memiliki izin", http.StatusForbidden)
		return
	}

	// Dapatkan semua pengguna dari database
	var users []models.User
	result := getUserDB().Order("id desc").Find(&users)
	if result.Error != nil {
		http.Error(w, "Gagal mengambil data pengguna: "+result.Error.Error(), http.StatusInternalServerError)
		return
	}

	// Kirim respons
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(users)
}

// GetUserHandler menangani permintaan mendapatkan pengguna berdasarkan ID
func GetUserHandler(w http.ResponseWriter, r *http.Request) {
	// Hanya menerima metode GET
	if r.Method != http.MethodGet {
		http.Error(w, "Metode tidak diizinkan", http.StatusMethodNotAllowed)
		return
	}

	// Dapatkan user ID dari context
	userID, ok := r.Context().Value("userID").(uint)
	if !ok {
		http.Error(w, "Tidak terautentikasi", http.StatusUnauthorized)
		return
	}

	// Dapatkan user role dari context
	userRole, ok := r.Context().Value("userRole").(string)
	if !ok {
		http.Error(w, "Tidak terautentikasi", http.StatusUnauthorized)
		return
	}

	// Dapatkan ID pengguna dari URL
	pathParts := strings.Split(r.URL.Path, "/")
	if len(pathParts) < 4 {
		http.Error(w, "ID pengguna diperlukan", http.StatusBadRequest)
		return
	}

	targetIDStr := pathParts[3]
	targetID, err := strconv.ParseUint(targetIDStr, 10, 32)
	if err != nil {
		http.Error(w, "ID pengguna tidak valid", http.StatusBadRequest)
		return
	}

	// Periksa izin: hanya admin atau pengguna itu sendiri yang bisa melihat detail
	if userRole != "admin" && userID != uint(targetID) {
		http.Error(w, "Tidak memiliki izin", http.StatusForbidden)
		return
	}

	// Dapatkan pengguna dari database
	user, err := models.FindUserByID(getUserDB(), uint(targetID))
	if err != nil {
		http.Error(w, "Pengguna tidak ditemukan", http.StatusNotFound)
		return
	}

	// Kirim respons
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(user)
}

// CreateUserHandler menangani permintaan membuat pengguna baru
func CreateUserHandler(w http.ResponseWriter, r *http.Request) {
	// Hanya menerima metode POST
	if r.Method != http.MethodPost {
		http.Error(w, "Metode tidak diizinkan", http.StatusMethodNotAllowed)
		return
	}

	// Dapatkan user role dari context
	userRole, ok := r.Context().Value("userRole").(string)
	if !ok || userRole != "admin" {
		http.Error(w, "Tidak memiliki izin", http.StatusForbidden)
		return
	}

	// Decode permintaan JSON
	var req UserRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
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
	getUserDB().Model(&models.User{}).Where("username = ?", req.Username).Count(&existingUserCount)
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
	if err := newUser.SetPassword(req.Password); err != nil {
		http.Error(w, "Gagal mengatur password: "+err.Error(), http.StatusInternalServerError)
		return
	}

	// Simpan ke database
	result := getUserDB().Create(&newUser)
	if result.Error != nil {
		http.Error(w, "Gagal membuat pengguna: "+result.Error.Error(), http.StatusInternalServerError)
		return
	}

	// Kirim respons
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(newUser)
}

// UpdateUserHandler menangani permintaan memperbarui pengguna
func UpdateUserHandler(w http.ResponseWriter, r *http.Request) {
	// Hanya menerima metode PUT
	if r.Method != http.MethodPut {
		http.Error(w, "Metode tidak diizinkan", http.StatusMethodNotAllowed)
		return
	}

	// Dapatkan user ID dari context
	userID, ok := r.Context().Value("userID").(uint)
	if !ok {
		http.Error(w, "Tidak terautentikasi", http.StatusUnauthorized)
		return
	}

	// Dapatkan user role dari context
	userRole, ok := r.Context().Value("userRole").(string)
	if !ok {
		http.Error(w, "Tidak terautentikasi", http.StatusUnauthorized)
		return
	}

	// Dapatkan ID pengguna dari URL
	pathParts := strings.Split(r.URL.Path, "/")
	if len(pathParts) < 4 {
		http.Error(w, "ID pengguna diperlukan", http.StatusBadRequest)
		return
	}

	targetIDStr := pathParts[3]
	targetID, err := strconv.ParseUint(targetIDStr, 10, 32)
	if err != nil {
		http.Error(w, "ID pengguna tidak valid", http.StatusBadRequest)
		return
	}

	// Periksa izin: hanya admin atau pengguna itu sendiri yang bisa memperbarui
	if userRole != "admin" && userID != uint(targetID) {
		http.Error(w, "Tidak memiliki izin", http.StatusForbidden)
		return
	}

	// Dapatkan pengguna dari database
	user, err := models.FindUserByID(getUserDB(), uint(targetID))
	if err != nil {
		http.Error(w, "Pengguna tidak ditemukan", http.StatusNotFound)
		return
	}

	// Decode permintaan JSON
	var req UserRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Format JSON tidak valid", http.StatusBadRequest)
		return
	}

	// Perbarui bidang-bidang yang diberikan
	if req.Name != "" {
		user.Name = req.Name
	}

	// Hanya admin yang bisa mengubah role
	if req.Role != "" && userRole == "admin" {
		user.Role = req.Role
	}

	// Jika password diubah, hash dan simpan password baru
	if req.Password != "" {
		if err := user.SetPassword(req.Password); err != nil {
			http.Error(w, "Gagal mengatur password: "+err.Error(), http.StatusInternalServerError)
			return
		}
	}

	// Jika username diubah, periksa konflik
	if req.Username != "" && req.Username != user.Username {
		// Hanya admin yang bisa mengubah username
		if userRole != "admin" {
			http.Error(w, "Tidak memiliki izin untuk mengubah username", http.StatusForbidden)
			return
		}

		// Cek apakah username sudah ada
		var existingUserCount int64
		getUserDB().Model(&models.User{}).Where("username = ?", req.Username).Count(&existingUserCount)
		if existingUserCount > 0 {
			http.Error(w, "Username sudah digunakan", http.StatusConflict)
			return
		}

		user.Username = req.Username
	}

	// Simpan perubahan ke database
	result := getUserDB().Save(user)
	if result.Error != nil {
		http.Error(w, "Gagal memperbarui pengguna: "+result.Error.Error(), http.StatusInternalServerError)
		return
	}

	// Kirim respons
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(user)
}

// DeleteUserHandler menangani permintaan menghapus pengguna
func DeleteUserHandler(w http.ResponseWriter, r *http.Request) {
	// Hanya menerima metode DELETE
	if r.Method != http.MethodDelete {
		http.Error(w, "Metode tidak diizinkan", http.StatusMethodNotAllowed)
		return
	}

	// Dapatkan user ID dari context
	userID, ok := r.Context().Value("userID").(uint)
	if !ok {
		http.Error(w, "Tidak terautentikasi", http.StatusUnauthorized)
		return
	}

	// Dapatkan user role dari context
	userRole, ok := r.Context().Value("userRole").(string)
	if !ok || userRole != "admin" {
		http.Error(w, "Tidak memiliki izin", http.StatusForbidden)
		return
	}

	// Dapatkan ID pengguna dari URL
	pathParts := strings.Split(r.URL.Path, "/")
	if len(pathParts) < 4 {
		http.Error(w, "ID pengguna diperlukan", http.StatusBadRequest)
		return
	}

	targetIDStr := pathParts[3]
	targetID, err := strconv.ParseUint(targetIDStr, 10, 32)
	if err != nil {
		http.Error(w, "ID pengguna tidak valid", http.StatusBadRequest)
		return
	}

	// Mencegah penghapusan diri sendiri
	if userID == uint(targetID) {
		http.Error(w, "Tidak dapat menghapus akun Anda sendiri", http.StatusForbidden)
		return
	}

	// Dapatkan pengguna dari database
	user, err := models.FindUserByID(getUserDB(), uint(targetID))
	if err != nil {
		http.Error(w, "Pengguna tidak ditemukan", http.StatusNotFound)
		return
	}

	// Hapus pengguna dari database
	result := getUserDB().Delete(user)
	if result.Error != nil {
		http.Error(w, "Gagal menghapus pengguna: "+result.Error.Error(), http.StatusInternalServerError)
		return
	}

	// Kirim respons
	w.Header().Set("Content-Type", "application/json")
	response := map[string]string{
		"message": "Pengguna berhasil dihapus",
	}
	json.NewEncoder(w).Encode(response)
}
