package middleware

import (
	"context"
	"net/http"
	"siak-rsbw/backend/utils"
	"strings"
)

// AuthMiddleware adalah middleware untuk autentikasi JWT
func AuthMiddleware(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// Ambil header Authorization
		authHeader := r.Header.Get("Authorization")
		if authHeader == "" {
			http.Error(w, "Authorization header tidak ditemukan", http.StatusUnauthorized)
			return
		}

		// Periksa format Bearer token
		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			http.Error(w, "Format Authorization header tidak valid", http.StatusUnauthorized)
			return
		}

		// Validasi token
		tokenData, err := utils.ValidateJWTWithData(parts[1])
		if err != nil {
			http.Error(w, "Token tidak valid: "+err.Error(), http.StatusUnauthorized)
			return
		}

		// Buat context baru dengan userID dan userRole
		ctx := context.WithValue(r.Context(), "userID", tokenData.UserID)
		ctx = context.WithValue(ctx, "userRole", tokenData.Role)
		ctx = context.WithValue(ctx, "username", tokenData.Username)

		// Lanjutkan dengan request yang memiliki context baru
		next(w, r.WithContext(ctx))
	}
}

// AdminMiddleware adalah middleware untuk memeriksa apakah pengguna adalah admin
func AdminMiddleware(next http.HandlerFunc) http.HandlerFunc {
	// Pertama gunakan AuthMiddleware untuk otentikasi
	return AuthMiddleware(func(w http.ResponseWriter, r *http.Request) {
		// Ambil role dari context
		role, ok := r.Context().Value("userRole").(string)
		if !ok {
			http.Error(w, "Gagal mendapatkan role pengguna", http.StatusInternalServerError)
			return
		}

		// Periksa apakah role adalah admin (case insensitive)
		if strings.ToLower(role) != "admin" {
			http.Error(w, "Akses ditolak: Memerlukan hak admin", http.StatusForbidden)
			return
		}

		// Jika pengguna adalah admin, lanjutkan
		next(w, r)
	})
}

// EnableCORS adalah middleware untuk menangani Cross-Origin Resource Sharing
func EnableCORS(handler http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Set header CORS
		w.Header().Set("Access-Control-Allow-Origin", "http://localhost:3000") // Sesuaikan dengan URL frontend Anda
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
		w.Header().Set("Access-Control-Allow-Credentials", "true")

		// Menangani permintaan OPTIONS (preflight)
		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}

		// Lanjutkan ke handler berikutnya
		handler.ServeHTTP(w, r)
	})
}
