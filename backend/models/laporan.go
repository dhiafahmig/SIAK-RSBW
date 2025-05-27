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
	NoRawat       string    `json:"no_rawat"`
	NoRkmMedis    string    `json:"no_rkm_medis"`
	NmPasien      string    `json:"nm_pasien"`
	TglRegistrasi time.Time `json:"tgl_registrasi"`
	NmPoli        string    `json:"nm_poli"`
	NoNota        string    `json:"no_nota"`
	TglBayar      time.Time `json:"tgl_bayar"`
	BesarBayar    float64   `json:"besar_bayar"`
}

// LaporanPiutangPasien adalah model untuk hasil query laporan piutang pasien
type LaporanPiutangPasien struct {
	NoRawat      string  `json:"no_rawat"`
	PngJawab     string  `json:"png_jawab"`
	NamaBayar    string  `json:"nama_bayar"`
	TotalPiutang float64 `json:"totalpiutang"`
}

// TanggalFilter adalah struktur untuk filter tanggal di request
type TanggalFilter struct {
	TanggalAwal  string `json:"tanggal_awal"`
	TanggalAkhir string `json:"tanggal_akhir"`
}
