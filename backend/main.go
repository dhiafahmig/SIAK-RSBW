package main

import (
	"log"
	"net/http"
	"siak-rsbw/backend/handlers"
	"siak-rsbw/backend/middleware"
	"siak-rsbw/backend/utils"
)

// Fungsi untuk menambahkan header CORS langsung
func addCORSHeaders(w http.ResponseWriter) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
	w.Header().Set("Access-Control-Allow-Credentials", "true")
}

// Wrapper untuk handler yang menambahkan header CORS
func withCORS(handler http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		addCORSHeaders(w)

		// Menangani permintaan OPTIONS (preflight)
		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}

		handler(w, r)
	}
}

func main() {
	// Inisialisasi koneksi database
	utils.InitDatabase()

	// Konfigurasi server
	port := "8080"
	host := "0.0.0.0" // Menggunakan 0.0.0.0 agar bisa diakses dari semua interface

	// Multiplexer untuk routing
	mux := http.NewServeMux()

	// CORS middleware dinonaktifkan sementara
	// handler := middleware.EnableCORS(mux)
	// Gunakan mux langsung tanpa middleware CORS
	handler := mux

	// Route untuk endpoint diagnostik
	mux.HandleFunc("/api/health", withCORS(handlers.HealthCheckHandler))

	// Route untuk tes koneksi MySQL
	mux.HandleFunc("/api/mysql-check", withCORS(handlers.MySQLCheckHandler))

	// Route untuk laporan rawat inap
	mux.HandleFunc("/api/laporan/rawat-inap", withCORS(handlers.LaporanRawatInapHandler))

	// Route untuk laporan rawat jalan
	mux.HandleFunc("/api/laporan/rawat-jalan", withCORS(handlers.RawatJalanHandler))

	// Route untuk penjualan bebas obat
	mux.HandleFunc("/api/laporan/penjualan-obat", withCORS(handlers.PenjualanBebasObatHandler))

	// Route untuk penerimaan obat
	mux.HandleFunc("/api/laporan/penerimaan-obat", withCORS(handlers.PenerimaanObatHandler))

	// Route untuk login
	mux.HandleFunc("/api/auth/login", withCORS(handlers.LoginHandler))

	// Route untuk registrasi
	mux.HandleFunc("/api/auth/register", withCORS(handlers.RegisterHandler))

	// Route yang diproteksi
	mux.HandleFunc("/api/profile", withCORS(middleware.AuthMiddleware(handlers.ProfileHandler)))

	// Route untuk pengaturan pengguna
	mux.HandleFunc("/api/user/settings", withCORS(middleware.AuthMiddleware(handlers.GetUserSettingsHandler)))
	mux.HandleFunc("/api/user/settings/dark-mode", withCORS(middleware.AuthMiddleware(handlers.UpdateDarkModeHandler)))

	// Route untuk manajemen pengguna: GET (list) dan POST (create)
	// Hanya admin yang dapat mengakses
	mux.HandleFunc("/api/users", withCORS(middleware.AdminMiddleware(func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodGet:
			handlers.GetUsersHandler(w, r)
		case http.MethodPost:
			handlers.CreateUserHandler(w, r)
		default:
			http.Error(w, "Metode tidak diizinkan", http.StatusMethodNotAllowed)
		}
	})))

	// Route untuk manajemen pengguna: GET (single), PUT (update), DELETE
	// Hanya admin yang dapat mengakses, kecuali untuk mendapatkan profil sendiri
	mux.HandleFunc("/api/users/", withCORS(middleware.AuthMiddleware(func(w http.ResponseWriter, r *http.Request) {
		// Ambil userID dan role dari context
		userIDCtx := r.Context().Value("userID")
		roleCtx := r.Context().Value("userRole")

		// Deteksi jika ini adalah admin atau pengguna yang mengakses profilnya sendiri
		userID, ok := userIDCtx.(uint)
		role, roleOk := roleCtx.(string)
		isAdmin := roleOk && role == "admin"

		// Baca ID dari URL
		pathID := handlers.GetIDFromURL(r.URL.Path)

		// Untuk GET, izinkan jika admin atau mengakses profil sendiri
		if r.Method == http.MethodGet && (isAdmin || (ok && pathID == int(userID))) {
			handlers.GetUserHandler(w, r)
			return
		}

		// Untuk PUT, izinkan jika admin atau mengubah profil sendiri
		if r.Method == http.MethodPut && (isAdmin || (ok && pathID == int(userID))) {
			handlers.UpdateUserHandler(w, r)
			return
		}

		// Untuk DELETE dan metode lain, hanya admin yang diizinkan
		if !isAdmin {
			http.Error(w, "Akses ditolak: Memerlukan hak admin", http.StatusForbidden)
			return
		}

		// Proses permintaan jika memiliki hak akses
		switch r.Method {
		case http.MethodGet:
			handlers.GetUserHandler(w, r)
		case http.MethodPut:
			handlers.UpdateUserHandler(w, r)
		case http.MethodDelete:
			handlers.DeleteUserHandler(w, r)
		default:
			http.Error(w, "Metode tidak diizinkan", http.StatusMethodNotAllowed)
		}
	})))

	// Informasi server
	log.Printf("Server berjalan di http://%s:%s", host, port)

	// Menjalankan server
	server := &http.Server{
		Addr:    host + ":" + port,
		Handler: handler,
	}

	log.Printf("Mencoba mengakses server melalui: http://%s:%s", host, port)
	log.Printf("Atau melalui IP lokal: http://192.168.20.101:%s", port)

	log.Fatal(server.ListenAndServe())
}
