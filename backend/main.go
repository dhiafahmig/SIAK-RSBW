package main

import (
	"log"
	"net/http"
	"siak-rsbw/backend/handlers"
	"siak-rsbw/backend/middleware"
	"siak-rsbw/backend/utils"
)

func main() {
	// Inisialisasi koneksi database
	utils.InitDatabase()

	// Konfigurasi server
	port := "8080"

	// Multiplexer untuk routing
	mux := http.NewServeMux()

	// Menambahkan CORS middleware ke semua routes
	handler := middleware.EnableCORS(mux)

	// Route untuk endpoint diagnostik
	mux.HandleFunc("/api/health", handlers.HealthCheckHandler)

	// Route untuk memperbaiki database
	mux.HandleFunc("/api/fix-database", handlers.FixDatabaseHandler)

	// Route untuk login
	mux.HandleFunc("/api/auth/login", handlers.LoginHandler)

	// Route untuk registrasi
	mux.HandleFunc("/api/auth/register", handlers.RegisterHandler)

	// Route yang diproteksi
	mux.HandleFunc("/api/profile", middleware.AuthMiddleware(handlers.ProfileHandler))

	// Route untuk pengaturan pengguna
	mux.HandleFunc("/api/user/settings", middleware.AuthMiddleware(handlers.GetUserSettingsHandler))
	mux.HandleFunc("/api/user/settings/dark-mode", middleware.AuthMiddleware(handlers.UpdateDarkModeHandler))

	// Route untuk manajemen pengguna: GET (list) dan POST (create)
	mux.HandleFunc("/api/users", middleware.AuthMiddleware(func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodGet:
			handlers.GetUsersHandler(w, r)
		case http.MethodPost:
			handlers.CreateUserHandler(w, r)
		default:
			http.Error(w, "Metode tidak diizinkan", http.StatusMethodNotAllowed)
		}
	}))

	// Route untuk manajemen pengguna: GET (single), PUT (update), DELETE
	mux.HandleFunc("/api/users/", middleware.AuthMiddleware(func(w http.ResponseWriter, r *http.Request) {
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
	}))

	// Informasi server
	log.Printf("Server berjalan di http://localhost:%s", port)

	// Menjalankan server
	log.Fatal(http.ListenAndServe(":"+port, handler))
}
