import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../../components/Layout';
import axios from 'axios';
import { getCurrentTheme, toggleDarkMode } from '../../../utils/theme';
import API_CONFIG from '../../../config/api';


const LaporanRawatJalan: React.FC = () => {
  const navigate = useNavigate();
  const [userData, setUserData] = useState({
    id: 0,
    username: 'admin',
    name: 'Administrator',
    role: '',
  });
  
  // Set nilai awal darkMode dari utilitas
  const [darkMode, setDarkMode] = useState(getCurrentTheme);
  
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any[]>([]);
  const [piutangData, setPiutangData] = useState<any[]>([]);
  const [sortedData, setSortedData] = useState<any[]>([]);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [sortBy, setSortBy] = useState<string | null>(null);
  const [totalBayarRawatJalan, setTotalBayarRawatJalan] = useState(0);
  const [totalPiutang, setTotalPiutang] = useState(0);
  const [totalPendapatan, setTotalPendapatan] = useState(0);
  const [filter, setFilter] = useState({
    tanggal_awal: '',
    tanggal_akhir: '',
    filter_by: 'tgl_registrasi', // Default filter berdasarkan tanggal registrasi
    include_piutang: 'true', // Default include piutang
  });
  const [enableTransitions, setEnableTransitions] = useState(false);
  
  // Gunakan hari ini untuk kedua tanggal awal dan akhir
  const today = new Date();
  const awal = today.toISOString().split('T')[0];
  const akhir = today.toISOString().split('T')[0];
  
  const [error, setError] = useState('');
  const [notification, setNotification] = useState({
    show: false,
    message: '',
    type: 'success' as 'success' | 'error',
  });

  // Cek jika user belum login, redirect ke halaman login
  useEffect(() => {
    // Set nilai awal notification (harus di awal untuk mencegah error)
    setNotification({
      show: false,
      message: '',
      type: 'success',
    });
    
    const userStr = localStorage.getItem('user');
    if (!userStr) {
      navigate('/login');
      return;
    }

    try {
      const user = JSON.parse(userStr);
      setUserData({
        id: user.id || 0,
        username: user.username || 'admin',
        name: user.name || 'Administrator',
        role: user.role || '',
      });

      // Set filter default ke bulan ini
      const awal = today.toISOString().split('T')[0];
      const akhir = today.toISOString().split('T')[0];
      
      setFilter({
        tanggal_awal: awal,
        tanggal_akhir: akhir,
        filter_by: 'tgl_registrasi',
        include_piutang: 'true',
      });

      // Ambil preferensi tema dari database
      fetchDarkModePreference(user.id);

      // Aktifkan transisi setelah 300ms
      setTimeout(() => {
        setEnableTransitions(true);
      }, 300);
      
      // Fetch data setelah 500ms untuk memastikan filter sudah ter-set
      setTimeout(() => {
        fetchDataWithDates(awal, akhir);
      }, 500);
      
    } catch (error) {
      console.error('Error parsing user data:', error);
      navigate('/login');
    }
  }, [navigate]); // Hanya bergantung pada navigate

  // Efek untuk memantau perubahan tema dan memperbarui preferensi di database
  useEffect(() => {
    // Update tema di localStorage dan DOM menggunakan toggleDarkMode dari utils
    toggleDarkMode(darkMode);
    
    // Update preferensi tema ke database jika user sudah login
    if (userData.id > 0) {
      // Tunda pemanggilan untuk memastikan tema sudah berubah di localStorage
      setTimeout(() => {
        updateDarkModePreference();
      }, 300);
    }
  }, [darkMode, userData.id]);

  // Fungsi untuk memperbarui preferensi dark mode ke database
  const updateDarkModePreference = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token || userData.id === 0) {
        console.log("Token tidak tersedia atau user ID tidak valid:", { token: !!token, userId: userData.id });
        return;
      }

      console.log("Sending dark mode update to database:", { 
        userId: userData.id, 
        darkMode: darkMode, 
        darkModeType: typeof darkMode,
        darkModeValue: darkMode ? 1 : 0,
        endpoint: `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.USER.DARK_MODE}?id=${userData.id}`
      });
      
      // Kirim sebagai angka 1 atau 0 untuk kompatibilitas dengan MySQL tinyint
      const payload = { dark_mode: darkMode ? 1 : 0 };
      console.log("Payload:", JSON.stringify(payload));
      
      const response = await axios.post(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.USER.DARK_MODE}?id=${userData.id}`, 
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log("Dark mode update response:", response.data);
      console.log("Preferensi dark mode berhasil diperbarui di database");
    } catch (error: any) {
      console.error('Error memperbarui preferensi dark mode:', error);
      // Tampilkan detail error jika ada
      if (error.response) {
        console.error('Error response:', error.response.data);
        console.error('Status code:', error.response.status);
      } else if (error.request) {
        console.error('No response received:', error.request);
      } else {
        console.error('Error message:', error.message);
      }
    }
  };

  // Fungsi untuk mengambil preferensi dark mode dari database
  const fetchDarkModePreference = async (userId: number) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      console.log("Fetching dark mode preference from database for user:", userId);
      
      const response = await axios.get(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.USER.SETTINGS}?id=${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      console.log("Dark mode from database:", response.data);
      
      // Set dark mode dari hasil response
      const serverDarkMode = !!response.data.dark_mode; // Pastikan nilai boolean
      console.log("Setting dark mode state to:", serverDarkMode);
      
      // Update state dan localStorage
      setDarkMode(serverDarkMode);
      toggleDarkMode(serverDarkMode);
    } catch (error) {
      console.error('Error fetching dark mode preference:', error);
    }
  };

  // Update sortedData ketika data berubah atau sorting berubah
  useEffect(() => {
    if (data.length > 0) {
      // Buat array gabungan data rawat jalan dengan piutang
      const combinedData = data.map(item => {
        // Cari data piutang yang sesuai dengan no_rawat
        const matchingPiutang = piutangData.filter(p => p.no_rawat === item.no_rawat);
        
        // Hitung total piutang untuk pasien ini
        const totalPiutangPasien = matchingPiutang.reduce((total, p) => total + p.totalpiutang, 0);
        
        // Ambil PNG Jawab dan Nama Bayar dari data piutang pertama jika ada
        const pngJawab = matchingPiutang.length > 0 ? matchingPiutang[0].png_jawab : '';
        const namaBayar = matchingPiutang.length > 0 ? matchingPiutang[0].nama_bayar : '';
        
        // Gabungkan data
        return {
          ...item,
          totalPiutangPasien,
          detailPiutang: matchingPiutang,
          totalNilai: item.besar_bayar + totalPiutangPasien,
          pngJawab,
          namaBayar
        };
      });

      // Sort data gabungan
      const sorted = [...combinedData].sort((a, b) => {
        // Jika tidak ada kolom sort, gunakan urutan default
        if (!sortBy) return 0;
        
        // Untuk data tanggal
        if (sortBy.includes('tgl') || sortBy === 'tanggal') {
          const dateA = new Date(a[sortBy] || 0);
          const dateB = new Date(b[sortBy] || 0);
          
          return sortDir === 'asc' 
            ? dateA.getTime() - dateB.getTime() 
            : dateB.getTime() - dateA.getTime();
        }
        
        // Untuk angka (besar_bayar, totalPiutangPasien, totalNilai)
        if (sortBy === 'besar_bayar' || sortBy === 'totalPiutangPasien' || sortBy === 'totalNilai') {
          const numA = parseFloat(a[sortBy] || 0);
          const numB = parseFloat(b[sortBy] || 0);
          
          return sortDir === 'asc' ? numA - numB : numB - numA;
        }
        
        // Untuk string (default)
        const strA = String(a[sortBy] || '').toLowerCase();
        const strB = String(b[sortBy] || '').toLowerCase();
        
        return sortDir === 'asc' 
          ? strA.localeCompare(strB) 
          : strB.localeCompare(strA);
      });
      
      setSortedData(sorted);
    } else {
      setSortedData([]);
    }
  }, [data, piutangData, sortBy, sortDir]);

  // Fungsi untuk handle sorting
  const handleSort = (column: string) => {
    if (column === sortBy) {
      // Jika kolom yang sama diklik, toggle urutan
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      // Jika kolom berbeda diklik, set sebagai kolom sort dengan urutan default desc
      setSortBy(column);
      setSortDir('desc');
    }
  };

  // Fungsi untuk fetch data dengan tanggal parameter
  const fetchDataWithDates = async (tanggalAwal: string, tanggalAkhir: string) => {
    setLoading(true);
    try {
      // Pastikan untuk mengirimkan parameter filter_by yang benar
      console.log("Mengirim filter_by:", filter.filter_by);
      
      const response = await axios.get(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.LAPORAN.RAWAT_JALAN}`, {
        params: {
          tanggal_awal: tanggalAwal,
          tanggal_akhir: tanggalAkhir,
          filter_by: filter.filter_by,
          include_piutang: filter.include_piutang
        },
      });

      if (response.data.status === 'success') {
        setData(response.data.data_rawat_jalan || []);
        setPiutangData(response.data.data_piutang || []);
        setTotalBayarRawatJalan(response.data.total_bayar_rawat_jalan || 0);
        setTotalPiutang(response.data.total_piutang || 0);
        setTotalPendapatan(response.data.total_pendapatan || 0);
        
        // Log response untuk debugging
        console.log("Response data:", response.data);
        console.log("Data rawat jalan diterima:", response.data.data_rawat_jalan?.length || 0, "records");
        console.log("Data piutang diterima:", response.data.data_piutang?.length || 0, "records");
        console.log("Filter yang digunakan:", response.data.filter);
      } else {
        throw new Error(response.data.message || 'Gagal mengambil data');
      }
    } catch (error: any) {
      console.error('Error fetching data:', error);
      setError(error.message || 'Terjadi kesalahan saat mengambil data');
      setNotification({
        show: true,
        message: error.message || 'Terjadi kesalahan saat mengambil data',
        type: 'error',
      });
      setTimeout(() => {
        setNotification(prev => ({ ...prev, show: false }));
      }, 3000);
    } finally {
      setLoading(false);
    }
  };

  // Fungsi untuk fetch data
  const fetchData = async () => {
    setLoading(true);
    try {
      // Debug: log filter yang digunakan
      console.log("Filter yang digunakan:", filter);
      
      const response = await axios.get(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.LAPORAN.RAWAT_JALAN}`, {
        params: {
          tanggal_awal: filter.tanggal_awal,
          tanggal_akhir: filter.tanggal_akhir,
          filter_by: filter.filter_by,
          include_piutang: filter.include_piutang
        },
      });

      if (response.data.status === 'success') {
        setData(response.data.data_rawat_jalan || []);
        setPiutangData(response.data.data_piutang || []);
        setTotalBayarRawatJalan(response.data.total_bayar_rawat_jalan || 0);
        setTotalPiutang(response.data.total_piutang || 0);
        setTotalPendapatan(response.data.total_pendapatan || 0);
        
        // Log response untuk debugging
        console.log("Response data:", response.data);
        console.log("Data rawat jalan diterima:", response.data.data_rawat_jalan?.length || 0, "records");
        console.log("Data piutang diterima:", response.data.data_piutang?.length || 0, "records");
        console.log("Filter yang digunakan:", response.data.filter);
      } else {
        throw new Error(response.data.message || 'Gagal mengambil data');
      }
    } catch (error: any) {
      console.error('Error fetching data:', error);
      setError(error.message || 'Terjadi kesalahan saat mengambil data');
      setNotification({
        show: true,
        message: error.message || 'Terjadi kesalahan saat mengambil data',
        type: 'error',
      });
      setTimeout(() => {
        setNotification(prev => ({ ...prev, show: false }));
      }, 3000);
    } finally {
      setLoading(false);
    }
  };

  // Handle perubahan input filter
  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    console.log(`Filter berubah: ${name} = ${value}`);
    setFilter(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle submit filter
  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Form disubmit dengan filter:", filter);
    fetchData();
  };

  // Format angka ke Rupiah
  const formatRupiah = (angka: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(angka);
  };

  // Format tanggal
  const formatTanggal = (tanggal: string) => {
    if (!tanggal) return '-';
    
    // Periksa apakah tanggal adalah 01 Januari tahun apapun
    const date = new Date(tanggal);
    if (date.getDate() === 1 && date.getMonth() === 0) {
      return '-';
    }
    
    return date.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  // Render sort indicator
  const renderSortIndicator = (column: string) => {
    if (sortBy !== column) return null;
    
    return (
      <span className="ml-1">
        {sortDir === 'desc' ? '▼' : '▲'}
      </span>
    );
  };

  // Handle toggle dark mode
  const handleToggleDarkMode = () => {
    setDarkMode(prev => !prev);
  };

  return (
    <Layout
      username={userData.username}
      name={userData.name}
      role={userData.role}
      darkMode={darkMode}
      onToggleDarkMode={handleToggleDarkMode}
      enableTransitions={enableTransitions}
    >
      <div className="flex flex-col w-full">
        <h1 className={`text-2xl font-bold mb-6 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
          Laporan Pendapatan Rawat Jalan
        </h1>

        {/* Notification */}
        {notification.show && (
          <div className={`mb-4 p-3 rounded ${notification.type === 'success' 
            ? (darkMode ? 'bg-green-800 text-green-200' : 'bg-green-100 text-green-800') 
            : (darkMode ? 'bg-red-800 text-red-200' : 'bg-red-100 text-red-800')
          }`}>
            {notification.message}
          </div>
        )}

        {/* Filter Card */}
        <div className={`mb-6 p-4 rounded-lg shadow-md ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
          <h2 className={`text-lg font-semibold mb-3 ${darkMode ? 'text-white' : 'text-gray-800'}`}>Filter</h2>
          <div className={`mb-2 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            <i>*Filter berdasarkan tanggal pasien</i>
          </div>
          <form onSubmit={handleFilterSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Tanggal Awal
                </label>
                <input
                  type="date"
                  name="tanggal_awal"
                  value={filter.tanggal_awal}
                  onChange={handleFilterChange}
                  className={`w-full p-2 border rounded ${darkMode 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                  }`}
                />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Tanggal Akhir
                </label>
                <input
                  type="date"
                  name="tanggal_akhir"
                  value={filter.tanggal_akhir}
                  onChange={handleFilterChange}
                  className={`w-full p-2 border rounded ${darkMode 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                  }`}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Filter Berdasarkan
                </label>
                <select
                  name="filter_by"
                  value={filter.filter_by}
                  onChange={handleFilterChange}
                  className={`w-full p-2 border rounded ${darkMode 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                  }`}
                >
                  <option value="tgl_registrasi">Tanggal Registrasi</option>
                  <option value="tgl_bayar">Tanggal Bayar</option>
                  <option value="both">Kedua Tanggal</option>
                </select>
              </div>
              
              <div>
                <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Tampilkan Detail Piutang
                </label>
                <select
                  name="include_piutang"
                  value={filter.include_piutang}
                  onChange={handleFilterChange}
                  className={`w-full p-2 border rounded ${darkMode 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                  }`}
                >
                  <option value="true">Ya</option>
                  <option value="false">Tidak</option>
                </select>
              </div>
            </div>
            
            <div className="flex justify-end">
              <button 
                type="submit"
                className={`px-4 py-2 rounded ${darkMode 
                  ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                  : 'bg-blue-500 hover:bg-blue-600 text-white'
                } transition-colors`}
              >
                Terapkan Filter
              </button>
            </div>
          </form>
        </div>

        {/* Summary Cards */}
        <div className={`mb-6 p-4 rounded-lg shadow-md ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className={`p-4 rounded-lg ${darkMode ? 'bg-blue-900' : 'bg-blue-50'}`}>
              <h3 className={`text-lg font-medium mb-1 ${darkMode ? 'text-blue-300' : 'text-blue-800'}`}>
                Pendapatan Rawat Jalan
              </h3>
              <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-blue-600'}`}>
                {loading ? '...' : formatRupiah(totalBayarRawatJalan)}
              </p>
            </div>
            <div className={`p-4 rounded-lg ${darkMode ? 'bg-purple-900' : 'bg-purple-50'}`}>
              <h3 className={`text-lg font-medium mb-1 ${darkMode ? 'text-purple-300' : 'text-purple-800'}`}>
                Total Piutang
              </h3>
              <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-purple-600'}`}>
                {loading ? '...' : formatRupiah(totalPiutang)}
              </p>
            </div>
            <div className={`p-4 rounded-lg ${darkMode ? 'bg-green-900' : 'bg-green-50'}`}>
              <h3 className={`text-lg font-medium mb-1 ${darkMode ? 'text-green-300' : 'text-green-800'}`}>
                Total Pendapatan
              </h3>
              <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-green-600'}`}>
                {loading ? '...' : formatRupiah(totalPendapatan)}
              </p>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className={`overflow-x-auto rounded-lg shadow-md ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
          <table className="w-full divide-y divide-gray-200">
            <thead className={darkMode ? 'bg-gray-700' : 'bg-gray-50'}>
              <tr>
                <th className={`px-2 py-2 text-left text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`} style={{ width: '7%' }}>
                  No. Rawat
                </th>
                <th className={`px-2 py-2 text-left text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`} style={{ width: '5%' }}>
                  No. RM
                </th>
                <th className={`px-2 py-2 text-left text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`} style={{ width: '15%' }}>
                  Nama Pasien
                </th>
                <th className={`px-2 py-2 text-left text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`} style={{ width: '8%' }}>
                  Tgl Registrasi
                </th>
                <th className={`px-2 py-2 text-left text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`} style={{ width: '10%' }}>
                  Poliklinik
                </th>
                <th className={`px-2 py-2 text-left text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`} style={{ width: '6%' }}>
                  No. Nota
                </th>
                <th className={`px-2 py-2 text-left text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`} style={{ width: '8%' }}>
                  Tgl Bayar
                </th>
                <th 
                  className={`px-2 py-2 text-left text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider cursor-pointer`}
                  onClick={() => handleSort('besar_bayar')}
                  style={{ width: '9%' }}
                >
                  Bayar Tunai {renderSortIndicator('besar_bayar')}
                </th>
                <th className={`px-2 py-2 text-left text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`} style={{ width: '10%' }}>
                  PNG Jawab
                </th>
                <th className={`px-2 py-2 text-left text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`} style={{ width: '10%' }}>
                  Nama Bayar
                </th>
                <th 
                  className={`px-2 py-2 text-left text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider cursor-pointer`}
                  onClick={() => handleSort('totalPiutangPasien')}
                  style={{ width: '7%' }}
                >
                  Piutang {renderSortIndicator('totalPiutangPasien')}
                </th>
                <th 
                  className={`px-2 py-2 text-left text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider cursor-pointer`}
                  onClick={() => handleSort('totalNilai')}
                  style={{ width: '7%' }}
                >
                  Total {renderSortIndicator('totalNilai')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={12} className="text-center py-4">
                    <div className="flex justify-center items-center space-x-2">
                      <div className={`animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 ${darkMode ? 'border-blue-400' : 'border-blue-600'}`}></div>
                      <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>Memuat data...</span>
                    </div>
                  </td>
                </tr>
              ) : sortedData.length === 0 ? (
                <tr>
                  <td colSpan={12} className={`text-center py-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    Tidak ada data yang tersedia
                  </td>
                </tr>
              ) : (
                sortedData.map((item, index) => (
                  <tr key={index} className={index % 2 === 0 
                    ? (darkMode ? 'bg-gray-900' : 'bg-gray-50') 
                    : (darkMode ? 'bg-gray-800' : 'bg-white')
                  }>
                    <td className={`px-2 py-2 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                      {item.no_rawat}
                    </td>
                    <td className={`px-2 py-2 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                      {item.no_rkm_medis}
                    </td>
                    <td className={`px-2 py-2 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                      {item.nm_pasien}
                    </td>
                    <td className={`px-2 py-2 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                      {formatTanggal(item.tgl_registrasi)}
                    </td>
                    <td className={`px-2 py-2 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                      {item.nm_poli}
                    </td>
                    <td className={`px-2 py-2 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                      {item.no_nota || '-'}
                    </td>
                    <td className={`px-2 py-2 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                      {formatTanggal(item.tgl_bayar)}
                    </td>
                    <td className={`px-2 py-2 text-sm ${darkMode ? 'text-blue-400' : 'text-blue-600'} font-medium`}>
                      {formatRupiah(item.besar_bayar)}
                    </td>
                    <td className={`px-2 py-2 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                      {item.pngJawab || '-'}
                    </td>
                    <td className={`px-2 py-2 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                      {item.namaBayar || '-'}
                    </td>
                    <td className={`px-2 py-2 text-sm ${darkMode ? 'text-purple-400' : 'text-purple-600'} font-medium`}>
                      {formatRupiah(item.totalPiutangPasien || 0)}
                    </td>
                    <td className={`px-2 py-2 text-sm ${darkMode ? 'text-green-400' : 'text-green-600'} font-medium`}>
                      {formatRupiah((item.besar_bayar || 0) + (item.totalPiutangPasien || 0))}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
};

export default LaporanRawatJalan; 