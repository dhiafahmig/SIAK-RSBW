package models

// User merepresentasikan model pengguna
type User struct {
	ID       string `json:"id"`
	Username string `json:"username"`
	Password string `json:"-"` // Tidak dikembalikan dalam JSON
	Role     string `json:"role"`
	Name     string `json:"name"`
}

// Untuk demo, buat daftar pengguna statis
// Pada implementasi nyata, ini akan diambil dari database
var users = []User{
	{
		ID:       "1",
		Username: "admin",
		// Dalam implementasi sebenarnya, password harus di-hash
		// Ini hanya contoh untuk demo
		Password: "admin123",
		Role:     "admin",
		Name:     "Administrator",
	},
}

// FindUserByUsername mencari pengguna berdasarkan username
func FindUserByUsername(username string) *User {
	for _, user := range users {
		if user.Username == username {
			return &user
		}
	}
	return nil
}

// FindUserByID mencari pengguna berdasarkan ID
func FindUserByID(id string) *User {
	for _, user := range users {
		if user.ID == id {
			return &user
		}
	}
	return nil
}

// ValidateCredentials validasi username dan password
func ValidateCredentials(username, password string) *User {
	user := FindUserByUsername(username)
	if user != nil && user.Password == password {
		return user
	}
	return nil
}
