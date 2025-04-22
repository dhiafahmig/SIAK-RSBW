package utils

import (
	"errors"
	"os"
	"time"

	"github.com/golang-jwt/jwt/v4"
)

// JWTSecret adalah kunci rahasia untuk penandatanganan JWT
var JWTSecret = []byte(getJWTSecret())

// TokenData menyimpan data yang diambil dari token JWT
type TokenData struct {
	UserID   uint
	Username string
	Role     string
}

func getJWTSecret() string {
	secret := os.Getenv("JWT_SECRET")
	if secret == "" {
		return "rahasia_jwt_siak_rsbw" // Default secret jika tidak diset
	}
	return secret
}

// GenerateJWT membuat token JWT baru
func GenerateJWT(userID uint) (string, error) {
	// Buat klaim token
	claims := jwt.MapClaims{
		"user_id": userID,
		"exp":     time.Now().Add(24 * time.Hour).Unix(), // Token berlaku 24 jam
		"iat":     time.Now().Unix(),
	}

	// Buat token dengan claims dan algoritma HS256
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)

	// Tanda tangani token dengan secret key
	tokenString, err := token.SignedString(JWTSecret)
	if err != nil {
		return "", err
	}

	return tokenString, nil
}

// ValidateJWT memvalidasi token JWT dan mengembalikan user ID
func ValidateJWT(tokenString string) (uint, error) {
	tokenData, err := ValidateJWTWithData(tokenString)
	if err != nil {
		return 0, err
	}
	return tokenData.UserID, nil
}

// ValidateJWTWithData memvalidasi token JWT dan mengembalikan data pengguna
func ValidateJWTWithData(tokenString string) (TokenData, error) {
	var tokenData TokenData

	// Parse token
	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		// Validasi algoritma signing
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, errors.New("algoritma token tidak valid")
		}
		return JWTSecret, nil
	})

	if err != nil {
		return tokenData, err
	}

	// Validasi token
	if !token.Valid {
		return tokenData, errors.New("token tidak valid")
	}

	// Ambil claims
	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		return tokenData, errors.New("gagal mendapatkan claims")
	}

	// Ambil user ID dari claims
	userIDFloat, ok := claims["user_id"].(float64)
	if !ok {
		return tokenData, errors.New("user_id tidak ditemukan atau format tidak valid")
	}

	// Ambil username dan role jika tersedia
	username, _ := claims["username"].(string)
	role, _ := claims["role"].(string)

	// Isi token data
	tokenData.UserID = uint(userIDFloat)
	tokenData.Username = username
	tokenData.Role = role

	return tokenData, nil
}
