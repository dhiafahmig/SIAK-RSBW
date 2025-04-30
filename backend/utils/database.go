package utils

import (
	"fmt"
	"log"
	"os"

	"github.com/joho/godotenv"
	"gorm.io/driver/mysql"
	"gorm.io/gorm"
)

// DB adalah instance database PostgreSQL yang akan digunakan di seluruh aplikasi
var DB *gorm.DB

// MySQLDB adalah instance database MySQL yang akan digunakan di seluruh aplikasi
var MySQLDB *gorm.DB

// Menyimpan tipe database yang sedang digunakan sebagai database utama
var dbTypeUsed string

// InitDatabase menginisialisasi koneksi database
func InitDatabase() {
	// Load .env
	err := godotenv.Load()
	if err != nil {
		log.Println("Menggunakan variabel lingkungan sistem")
	}

	// Hanya inisialisasi MySQL
	initMySQLDB()
}

// initMySQLDB menginisialisasi koneksi ke database MySQL
func initMySQLDB() {
	dsn := fmt.Sprintf("%s:%s@tcp(%s:%s)/%s?charset=utf8mb4&parseTime=True&loc=Local",
		os.Getenv("MYSQL_USER"),
		os.Getenv("MYSQL_PASSWORD"),
		os.Getenv("MYSQL_HOST"),
		os.Getenv("MYSQL_PORT"),
		os.Getenv("MYSQL_DBNAME"))

	db, err := gorm.Open(mysql.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatalf("Gagal terhubung ke MySQL: %v", err) // Hentikan aplikasi jika gagal
	}

	// Set kedua variabel DB dan MySQLDB ke koneksi yang sama
	DB = db
	MySQLDB = db
	log.Println("MySQL siap digunakan")
}

// getEnv mengambil nilai variabel lingkungan atau nilai default jika tidak ada
func getEnv(key, defaultValue string) string {
	if value, exists := os.LookupEnv(key); exists {
		return value
	}
	return defaultValue
}

// GetDatabaseType mengembalikan jenis database yang sedang digunakan
func GetDatabaseType() string {
	return dbTypeUsed
}

// GetDB mengembalikan instance database yang telah diinisialisasi
func GetDB() *gorm.DB {
	return DB
}

// GetMySQLDB mengembalikan instance database MySQL yang telah diinisialisasi
func GetMySQLDB() *gorm.DB {
	return DB
}

// CloseDatabase menutup koneksi database
func CloseDatabase() {
	// Tutup koneksi MySQL jika ada
	if MySQLDB != nil && MySQLDB != DB { // Hindari menutup dua kali jika MySQLDB sama dengan DB
		sqlDB, err := MySQLDB.DB()
		if err != nil {
			log.Printf("Error mendapatkan database MySQL: %v", err)
		} else {
			sqlDB.Close()
			log.Println("Koneksi MySQL ditutup")
		}
	}
}

// GetUserDB mengembalikan instance database yang benar untuk operasi user
func GetUserDB() *gorm.DB {
	// Gunakan database utama (bisa MySQL)
	return DB
}
