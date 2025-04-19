package utils

import (
	"errors"
	"time"

	"github.com/golang-jwt/jwt/v4"
)

// Secret key untuk menandatangani JWT
// Pada implementasi nyata, ini harus disimpan dengan aman
// misalnya di environment variables
const jwtSecret = "siak-rsbw-secret-key"

// GenerateJWT membuat token JWT baru
func GenerateJWT(userID string) (string, error) {
	// Buat klaim token
	claims := jwt.MapClaims{
		"user_id": userID,
		"exp":     time.Now().Add(24 * time.Hour).Unix(), // Token berlaku 24 jam
		"iat":     time.Now().Unix(),
	}

	// Buat token dengan claims dan algoritma HS256
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)

	// Tanda tangani token dengan secret key
	tokenString, err := token.SignedString([]byte(jwtSecret))
	if err != nil {
		return "", err
	}

	return tokenString, nil
}

// ValidateJWT memvalidasi token JWT
func ValidateJWT(tokenString string) (string, error) {
	// Parse token
	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		// Validasi algoritma signing
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, errors.New("algoritma token tidak valid")
		}
		return []byte(jwtSecret), nil
	})

	if err != nil {
		return "", err
	}

	// Validasi token
	if !token.Valid {
		return "", errors.New("token tidak valid")
	}

	// Ambil claims
	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		return "", errors.New("gagal mendapatkan claims")
	}

	// Ambil user ID dari claims
	userID, ok := claims["user_id"].(string)
	if !ok {
		return "", errors.New("user_id tidak ditemukan")
	}

	return userID, nil
}
