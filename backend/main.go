package main

import (
	"log"
	"net/http"
	"siak-rsbw/backend/handlers"
	"siak-rsbw/backend/middleware"
)

func main() {
	// Konfigurasi server
	port := "8080"

	// Multiplexer untuk routing
	mux := http.NewServeMux()

	// Menambahkan CORS middleware ke semua routes
	handler := middleware.EnableCORS(mux)

	// Route untuk login
	mux.HandleFunc("/api/auth/login", handlers.LoginHandler)

	// Route yang diproteksi
	mux.HandleFunc("/api/profile", middleware.AuthMiddleware(handlers.ProfileHandler))

	// Informasi server
	log.Printf("Server berjalan di http://localhost:%s", port)

	// Menjalankan server
	log.Fatal(http.ListenAndServe(":"+port, handler))
}
