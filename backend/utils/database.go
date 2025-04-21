package utils

import (
	"fmt"
	"log"
	"os"
	"siak-rsbw/backend/models"

	"github.com/joho/godotenv"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

// DB adalah instance database yang akan digunakan di seluruh aplikasi
var DB *gorm.DB

// InitDatabase menginisialisasi koneksi database
func InitDatabase() {
	// Load variabel lingkungan dari file .env
	err := godotenv.Load()
	if err != nil {
		log.Println("Info: File .env tidak ditemukan, menggunakan variabel lingkungan sistem")
	}

	// Ambil parameter koneksi dari variabel lingkungan
	dbHost := getEnv("DB_HOST", "localhost")
	dbPort := getEnv("DB_PORT", "5432")
	dbUser := getEnv("DB_USER", "postgres")
	dbPassword := getEnv("DB_PASSWORD", "")
	dbName := getEnv("DB_NAME", "siak_rsbw")
	sslMode := getEnv("DB_SSLMODE", "disable") // disable untuk development, require untuk production

	// Format DSN (Data Source Name) PostgreSQL
	dsn := fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=%s TimeZone=Asia/Jakarta client_encoding=UTF8",
		dbHost, dbPort, dbUser, dbPassword, dbName, sslMode)

	// Buka koneksi ke database
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatalf("Gagal terhubung ke database: %v", err)
	}

	log.Println("Berhasil terhubung ke database PostgreSQL")
	DB = db

	// Auto migrate schema database (membuat tabel secara otomatis)
	err = DB.AutoMigrate(&models.User{})
	if err != nil {
		log.Fatalf("Gagal melakukan auto migrate: %v", err)
	}

	// Buat user admin default jika belum ada
	err = CreateDefaultAdminIfNotExists()
	if err != nil {
		log.Fatalf("Gagal membuat user admin: %v", err)
	}
}

// CreateDefaultAdminIfNotExists membuat user admin default jika belum ada
func CreateDefaultAdminIfNotExists() error {
	// Periksa apakah user admin sudah ada
	var adminCount int64
	DB.Model(&models.User{}).Where("username = ?", "admin").Count(&adminCount)
	if adminCount == 0 {
		// Hash password "admin123"
		hashedPassword, err := bcrypt.GenerateFromPassword([]byte("admin123"), bcrypt.DefaultCost)
		if err != nil {
			return fmt.Errorf("gagal hash password: %v", err)
		}

		admin := models.User{
			Username: "admin",
			Password: string(hashedPassword),
			Role:     "admin",
			Name:     "Administrator",
		}

		result := DB.Create(&admin)
		if result.Error != nil {
			return fmt.Errorf("gagal membuat user admin: %v", result.Error)
		}
		log.Println("User admin default berhasil dibuat")
	}
	return nil
}

// GetUserModel mengembalikan model User untuk automigrate
func GetUserModel() models.User {
	return models.User{}
}

// getEnv mengambil nilai variabel lingkungan atau nilai default jika tidak ada
func getEnv(key, defaultValue string) string {
	if value, exists := os.LookupEnv(key); exists {
		return value
	}
	return defaultValue
}

// CloseDatabase menutup koneksi database
func CloseDatabase() {
	sqlDB, err := DB.DB()
	if err != nil {
		log.Printf("Error mendapatkan database SQL: %v", err)
		return
	}
	sqlDB.Close()
}
