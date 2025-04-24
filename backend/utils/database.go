package utils

import (
	"fmt"
	"log"
	"os"
	"siak-rsbw/backend/models"

	"github.com/joho/godotenv"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/driver/mysql"
	"gorm.io/driver/postgres"
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
	// Load variabel lingkungan dari file .env
	err := godotenv.Load()
	if err != nil {
		log.Println("Info: File .env tidak ditemukan, menggunakan variabel lingkungan sistem")
	}

	// Ambil parameter koneksi dari variabel lingkungan
	dbType := getEnv("DB_TYPE", "postgres") // Default tetap PostgreSQL
	// Simpan tipe database
	dbTypeUsed = dbType

	// Inisialisasi database PostgreSQL
	initPostgresDB()

	// Inisialisasi database MySQL
	initMySQLDB()
}

// initPostgresDB menginisialisasi koneksi ke database PostgreSQL
func initPostgresDB() {
	dbHost := getEnv("DB_HOST", "localhost")
	dbPort := getEnv("DB_PORT", "5432") // Default port PostgreSQL
	dbUser := getEnv("DB_USER", "postgres")
	dbPassword := getEnv("DB_PASSWORD", "")
	dbName := getEnv("DB_NAME", "siak_rsbw")
	sslMode := getEnv("DB_SSLMODE", "disable") // disable untuk development, require untuk production

	// Format DSN (Data Source Name) PostgreSQL
	dsn := fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=%s TimeZone=Asia/Jakarta client_encoding=UTF8",
		dbHost, dbPort, dbUser, dbPassword, dbName, sslMode)
	dialector := postgres.Open(dsn)
	log.Println("Mencoba koneksi ke database PostgreSQL...")

	// Buka koneksi ke database PostgreSQL
	db, err := gorm.Open(dialector, &gorm.Config{})
	if err != nil {
		log.Printf("Peringatan: Gagal terhubung ke database PostgreSQL: %v", err)
	} else {
		log.Println("Berhasil terhubung ke database PostgreSQL")
		DB = db

		// Jika DB_TYPE adalah postgres, set sebagai database utama
		if dbTypeUsed == "postgres" {
			log.Println("PostgreSQL ditetapkan sebagai database utama")
		}
	}
}

// initMySQLDB menginisialisasi koneksi ke database MySQL
func initMySQLDB() {
	// Format DSN (Data Source Name) MySQL
	mysqlHost := getEnv("MYSQL_HOST", "192.168.10.88")
	mysqlPort := getEnv("MYSQL_PORT", "3306")
	mysqlUser := getEnv("MYSQL_USER", "backup")
	mysqlPassword := getEnv("MYSQL_PASSWORD", "backup")
	mysqlDBName := getEnv("MYSQL_DBNAME", "sik") // Database MySQL default "sik"

	// Log konfigurasi
	log.Printf("Mencoba koneksi ke MySQL: %s@%s:%s/%s", mysqlUser, mysqlHost, mysqlPort, mysqlDBName)

	dsn := fmt.Sprintf("%s:%s@tcp(%s:%s)/%s?charset=utf8mb4&parseTime=True&loc=Local&allowAllFiles=true",
		mysqlUser, mysqlPassword, mysqlHost, mysqlPort, mysqlDBName)
	dialector := mysql.Open(dsn)

	// Buka koneksi ke database MySQL
	db, err := gorm.Open(dialector, &gorm.Config{})
	if err != nil {
		log.Printf("Peringatan: Gagal terhubung ke database MySQL: %v", err)
	} else {
		log.Println("Berhasil terhubung ke database MySQL")
		MySQLDB = db

		// Jika DB_TYPE adalah mysql, set sebagai database utama
		if dbTypeUsed == "mysql" {
			log.Println("MySQL ditetapkan sebagai database utama")
			DB = MySQLDB
		}
	}
}

// CreateDefaultAdminIfNotExists membuat user admin default jika belum ada
// Fungsi ini dipertahankan tapi tidak digunakan
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
			DarkMode: false, // Default light mode
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
	return MySQLDB
}

// CloseDatabase menutup koneksi database
func CloseDatabase() {
	// Tutup koneksi PostgreSQL jika ada
	if DB != nil {
		sqlDB, err := DB.DB()
		if err != nil {
			log.Printf("Error mendapatkan database PostgreSQL: %v", err)
		} else {
			sqlDB.Close()
			log.Println("Koneksi PostgreSQL ditutup")
		}
	}

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
	// Jika menggunakan MySQL sebagai database utama tapi user ada di PostgreSQL
	if dbTypeUsed == "mysql" && DB != MySQLDB {
		// Gunakan PostgreSQL untuk users
		return DB
	}
	// Gunakan database utama (bisa PostgreSQL atau MySQL)
	return DB
}
