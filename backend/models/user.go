package models

import (
	"time"

	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

// User merepresentasikan model pengguna dalam database
type User struct {
	ID        uint      `json:"id" gorm:"primaryKey;autoIncrement"`
	Username  string    `json:"username" gorm:"type:longtext;unique;not null"`
	Password  string    `json:"-" gorm:"type:longtext;not null"` // "-" berarti tidak dikembalikan dalam JSON
	Role      string    `json:"role" gorm:"type:varchar(191);default:'user'"`
	Name      string    `json:"name" gorm:"type:longtext"`
	DarkMode  bool      `json:"dark_mode" gorm:"type:tinyint(1);default:0"`
	CreatedAt time.Time `json:"created_at" gorm:"type:datetime(3)"`
	UpdatedAt time.Time `json:"updated_at" gorm:"type:datetime(3)"`
}

// CheckPassword membandingkan password yang diberikan dengan password yang tersimpan
func (u *User) CheckPassword(password string) error {
	return bcrypt.CompareHashAndPassword([]byte(u.Password), []byte(password))
}

// SetPassword menghash dan menyimpan password untuk user
func (u *User) SetPassword(password string) error {
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return err
	}
	u.Password = string(hashedPassword)
	return nil
}

// FindUserByUsername mencari user berdasarkan username
func FindUserByUsername(db *gorm.DB, username string) (*User, error) {
	var user User
	result := db.Where("username = ?", username).First(&user)
	return &user, result.Error
}

// FindUserByID mencari user berdasarkan ID
func FindUserByID(db *gorm.DB, id uint) (*User, error) {
	var user User
	result := db.Where("id = ?", id).First(&user)
	return &user, result.Error
}

// ValidateCredentials memvalidasi username dan password
func ValidateCredentials(db *gorm.DB, username, password string) (*User, error) {
	user, err := FindUserByUsername(db, username)
	if err != nil {
		return nil, err
	}

	err = user.CheckPassword(password)
	if err != nil {
		return nil, err
	}

	return user, nil
}
