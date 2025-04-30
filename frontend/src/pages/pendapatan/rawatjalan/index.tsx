import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../../components/Layout';
import axios from 'axios';
import { getCurrentTheme, toggleDarkMode } from '../../../utils/theme';

// API URL
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';

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
  const [sortedData, setSortedData] = useState<any[]>([]);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [sortBy, setSortBy] = useState<string | null>(null);
  const [totalBayar, setTotalBayar] = useState(0);
  const [filter, setFilter] = useState({
    tanggal_awal: '',
    tanggal_akhir: '',
    filter_by: 'tgl_registrasi', // Default filter berdasarkan tanggal registrasi
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
        endpoint: `${API_URL}/api/user/settings/dark-mode?id=${userData.id}`
      });
      
      // Kirim sebagai angka 1 atau 0 untuk kompatibilitas dengan MySQL tinyint
      const payload = { dark_mode: darkMode ? 1 : 0 };
      console.log("Payload:", JSON.stringify(payload));
      
      const response = await axios.post(`${API_URL}/api/user/settings/dark-mode?id=${userData.id}`, 
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
      
      const response = await axios.get(`${API_URL}/api/user/settings?id=${userId}`, {
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
      let newData = [...data];
      
      if (sortBy === 'besar_bayar') {
        newData.sort((a, b) => {
          if (sortDir === 'desc') {
            return b.besar_bayar - a.besar_bayar;
          } else {
            return a.besar_bayar - b.besar_bayar;
          }
        });
      }
      
      setSortedData(newData);
    } else {
      setSortedData([]);
    }
  }, [data, sortBy, sortDir]);

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
      
      const response = await axios.get(`${API_URL}/api/laporan/rawat-jalan`, {
        params: {
          tanggal_awal: tanggalAwal,
          tanggal_akhir: tanggalAkhir,
          filter_by: filter.filter_by
        },
      });

      if (response.data.status === 'success') {
        setData(response.data.data || []);
        setTotalBayar(response.data.total_bayar || 0);
        
        // Log response untuk debugging
        console.log("Data diterima:", response.data.data.length, "records");
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
      
      const response = await axios.get(`${API_URL}/api/laporan/rawat-jalan`, {
        params: {
          tanggal_awal: filter.tanggal_awal,
          tanggal_akhir: filter.tanggal_akhir,
          filter_by: filter.filter_by
        },
      });

      if (response.data.status === 'success') {
        setData(response.data.data || []);
        setTotalBayar(response.data.total_bayar || 0);
        
        // Log response untuk debugging
        console.log("Data diterima:", response.data.data.length, "records");
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
  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
            <div className="mb-4">
              <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Filter Berdasarkan
              </label>
              <div className="flex gap-4">
                <div className="flex items-center">
                  <input
                    type="radio"
                    id="filter-registrasi"
                    name="filter_by"
                    value="tgl_registrasi"
                    checked={filter.filter_by === 'tgl_registrasi'}
                    onChange={handleFilterChange}
                    className={`mr-2 ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                  />
                  <label htmlFor="filter-registrasi" className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Tanggal Registrasi
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    type="radio"
                    id="filter-bayar"
                    name="filter_by"
                    value="tgl_bayar"
                    checked={filter.filter_by === 'tgl_bayar'}
                    onChange={handleFilterChange}
                    className={`mr-2 ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                  />
                  <label htmlFor="filter-bayar" className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Tanggal Bayar
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    type="radio"
                    id="filter-both"
                    name="filter_by"
                    value="both"
                    checked={filter.filter_by === 'both'}
                    onChange={handleFilterChange}
                    className={`mr-2 ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                  />
                  <label htmlFor="filter-both" className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Kedua Tanggal
                  </label>
                </div>
              </div>
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                className={`px-4 py-2 rounded-md ${darkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'} text-white focus:outline-none`}
              >
                Terapkan Filter
              </button>
            </div>
          </form>
        </div>

        {/* Summary Card */}
        <div className={`mb-6 p-4 rounded-lg shadow-md ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className={`p-4 rounded-lg ${darkMode ? 'bg-blue-900' : 'bg-blue-50'}`}>
              <h3 className={`text-lg font-medium mb-1 ${darkMode ? 'text-blue-300' : 'text-blue-800'}`}>
                Jumlah Data
              </h3>
              <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-blue-600'}`}>
                {loading ? '...' : data.length}
              </p>
            </div>
            <div className={`p-4 rounded-lg ${darkMode ? 'bg-green-900' : 'bg-green-50'}`}>
              <h3 className={`text-lg font-medium mb-1 ${darkMode ? 'text-green-300' : 'text-green-800'}`}>
                Total Pendapatan
              </h3>
              <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-green-600'}`}>
                {loading ? '...' : formatRupiah(totalBayar)}
              </p>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className={`overflow-x-auto rounded-lg shadow-md ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
          <table className="min-w-full divide-y divide-gray-200 table-fixed">
            <thead className={darkMode ? 'bg-gray-700' : 'bg-gray-50'}>
              <tr>
                <th className={`px-3 py-2 text-left text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider w-[12%]`}>
                  No. Rawat
                </th>
                <th className={`px-3 py-2 text-left text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider w-[10%]`}>
                  No. RM
                </th>
                <th className={`px-3 py-2 text-left text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider w-[15%]`}>
                  Nama Pasien
                </th>
                <th className={`px-3 py-2 text-left text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider w-[13%]`}>
                  Tgl Registrasi
                </th>
                <th className={`px-3 py-2 text-left text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider w-[13%]`}>
                  Poliklinik
                </th>
                <th className={`px-3 py-2 text-left text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider w-[10%]`}>
                  No. Nota
                </th>
                <th className={`px-3 py-2 text-left text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider w-[13%]`}>
                  Tgl Bayar
                </th>
                <th 
                  className={`px-3 py-2 text-left text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider cursor-pointer w-[14%]`}
                  onClick={() => handleSort('besar_bayar')}
                >
                  Besar Bayar {renderSortIndicator('besar_bayar')}
                </th>
              </tr>
            </thead>
            <tbody className={`divide-y divide-gray-200 ${darkMode ? 'bg-gray-800 divide-gray-700' : 'bg-white'}`}>
              {loading ? (
                <tr>
                  <td colSpan={8} className={`px-3 py-3 text-center ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                    Memuat data...
                  </td>
                </tr>
              ) : sortedData.length === 0 ? (
                <tr>
                  <td colSpan={8} className={`px-3 py-3 text-center ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                    Tidak ada data untuk periode yang dipilih
                  </td>
                </tr>
              ) : (
                sortedData.map((item, index) => (
                  <tr key={index} className={index % 2 === 0 
                    ? (darkMode ? 'bg-gray-900' : 'bg-gray-50') 
                    : (darkMode ? 'bg-gray-800' : 'bg-white')
                  }>
                    <td className={`px-3 py-2 whitespace-nowrap text-sm truncate ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                      {item.no_rawat}
                    </td>
                    <td className={`px-3 py-2 whitespace-nowrap text-sm truncate ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                      {item.no_rkm_medis}
                    </td>
                    <td className={`px-3 py-2 whitespace-nowrap text-sm truncate ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                      {item.nm_pasien}
                    </td>
                    <td className={`px-3 py-2 whitespace-nowrap text-sm truncate ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                      {formatTanggal(item.tgl_registrasi)}
                    </td>
                    <td className={`px-3 py-2 whitespace-nowrap text-sm truncate ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                      {item.nm_poli || '-'}
                    </td>
                    <td className={`px-3 py-2 whitespace-nowrap text-sm truncate ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                      {item.no_nota || '-'}
                    </td>
                    <td className={`px-3 py-2 whitespace-nowrap text-sm truncate ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                      {formatTanggal(item.tgl_bayar)}
                    </td>
                    <td className={`px-3 py-2 whitespace-nowrap text-sm truncate ${darkMode ? 'text-green-400' : 'text-green-600'} font-medium`}>
                      {formatRupiah(item.besar_bayar)}
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