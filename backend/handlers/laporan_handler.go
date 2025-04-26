package handlers

import (
	"time"
)

// parseDate adalah helper untuk mengubah string tanggal menjadi time.Time
func parseDate(dateStr string) time.Time {
	t, err := time.Parse("2006-01-02", dateStr)
	if err != nil {
		// Jika gagal parse, kembalikan waktu sekarang sebagai fallback
		return time.Now()
	}
	return t
}
