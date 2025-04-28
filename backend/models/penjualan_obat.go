package models

import "time"

// PenjualanBebasObat adalah model untuk hasil query penjualan bebas obat
type PenjualanBebasObat struct {
	NoPenjualan      string    `json:"no_penjualan"`
	TanggalPenjualan time.Time `json:"tanggal_penjualan"`
	Total            float64   `json:"total"`
}

// PenerimaanObat adalah model untuk hasil query penerimaan obat
type PenerimaanObat struct {
	NoPenerimaan      string    `json:"no_penerimaan"`
	TanggalPenerimaan time.Time `json:"tanggal_penerimaan"`
	Total             float64   `json:"total"`
}
