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
	NamaObat          string    `json:"nama_obat"`
	NamaSupplier      string    `json:"nama_supplier"`
	Jumlah            int       `json:"jumlah"`
	Satuan            string    `json:"satuan"`
	HargaSatuan       float64   `json:"harga_satuan"`
	Total             float64   `json:"total"`
	Petugas           string    `json:"petugas"`
}
