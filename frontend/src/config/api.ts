// Konfigurasi API
const API_CONFIG = {
  BASE_URL: process.env.REACT_APP_API_URL || 'http://192.168.20.101:8080',
  ENDPOINTS: {
    AUTH: {
      LOGIN: '/api/auth/login',
      REGISTER: '/api/auth/register',
    },
    LAPORAN: {
      RAWAT_JALAN: '/api/laporan/rawat-jalan',
      RAWAT_INAP: '/api/laporan/rawat-inap',
      PENJUALAN_OBAT: '/api/laporan/penjualan-obat',
      PENERIMAAN_OBAT: '/api/laporan/penerimaan-obat',
    },
    USER: {
      SETTINGS: '/api/user/settings',
      DARK_MODE: '/api/user/settings/dark-mode',
    }
  }
};

export default API_CONFIG; 