package models

import "time"

// LaporanRawatInap adalah model untuk hasil query laporan rawat inap
type LaporanRawatInap struct {
	NoRawat    string    `json:"no_rawat"`
	NoRkmMedis string    `json:"no_rkm_medis"`
	NmPasien   string    `json:"nm_pasien"`
	TglMasuk   time.Time `json:"tgl_masuk"`
	TglKeluar  time.Time `json:"tgl_keluar"`
	NoNota     string    `json:"no_nota"`
	Tanggal    time.Time `json:"tanggal"`
	BesarBayar float64   `json:"besar_bayar"`
}

// LaporanRawatJalan adalah model untuk hasil query laporan rawat jalan
type LaporanRawatJalan struct {
	NoRawat    string    `json:"no_rawat"`
	NoRkmMedis string    `json:"no_rkm_medis"`
	NmPasien   string    `json:"nm_pasien"`
	NoNota     string    `json:"no_nota"`
	Tanggal    time.Time `json:"tanggal"`
	BesarBayar float64   `json:"besar_bayar"`
}

// TanggalFilter adalah struktur untuk filter tanggal di request
type TanggalFilter struct {
	TanggalAwal  string `json:"tanggal_awal"`
	TanggalAkhir string `json:"tanggal_akhir"`
}
