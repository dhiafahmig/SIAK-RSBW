import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../../components/Layout';
import axios from 'axios';
import { getCurrentTheme } from '../../../utils/theme';
import API_CONFIG from '../../../config/api';

const PenerimaanObat: React.FC = () => {
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
  const [sortBy, setSortBy] = useState<string | null>('tanggal_penerimaan');
  const [totalPenerimaan, setTotalPenerimaan] = useState(0);
  const [filter, setFilter] = useState({
    tanggal_awal: '',
    tanggal_akhir: '',
  });
  const [enableTransitions, setEnableTransitions] = useState(false);
  
  // Gunakan hari ini untuk kedua tanggal awal dan akhir
  const today = new Date();
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const awal = firstDayOfMonth.toISOString().split('T')[0];
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
      setFilter({
        tanggal_awal: awal,
        tanggal_akhir: akhir,
      });

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
  }, [navigate, awal, akhir]); // Hanya bergantung pada navigate dan tanggal default

  // Update sortedData ketika data berubah atau sorting berubah
  useEffect(() => {
    if (data.length > 0) {
      let newData = [...data];
      
      if (sortBy) {
        newData.sort((a, b) => {
          let valA, valB;
          
          if (sortBy === 'total') {
            valA = a.total;
            valB = b.total;
          } else if (sortBy === 'tanggal_penerimaan') {
            valA = new Date(a.tanggal_penerimaan).getTime();
            valB = new Date(b.tanggal_penerimaan).getTime();
          } else if (sortBy === 'no_penerimaan') {
            valA = a.no_penerimaan;
            valB = b.no_penerimaan;
          } else {
            valA = a[sortBy];
            valB = b[sortBy];
          }
          
          if (sortDir === 'desc') {
            return valB > valA ? 1 : -1;
          } else {
            return valA > valB ? 1 : -1;
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
      const response = await axios.get(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.LAPORAN.PENERIMAAN_OBAT}`, {
        params: {
          tanggal_awal: tanggalAwal,
          tanggal_akhir: tanggalAkhir,
        },
      });

      if (response.data.status === 'success') {
        setData(response.data.data || []);
        setTotalPenerimaan(response.data.total_penerimaan || 0);
        
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
      
      const response = await axios.get(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.LAPORAN.PENERIMAAN_OBAT}`, {
        params: {
          tanggal_awal: filter.tanggal_awal,
          tanggal_akhir: filter.tanggal_akhir,
        },
      });

      if (response.data.status === 'success') {
        setData(response.data.data || []);
        setTotalPenerimaan(response.data.total_penerimaan || 0);
        
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
    
    try {
      const date = new Date(tanggal);
      return date.toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      });
    } catch (error) {
      console.error("Error formatting date:", error);
      return tanggal;
    }
  };
  
  // Render indikator urutan
  const renderSortIndicator = (column: string) => {
    if (sortBy !== column) return null;
    
    return (
      <span className="ml-1">
        {sortDir === 'asc' ? '▲' : '▼'}
      </span>
    );
  };

  // Toggle dark mode function
  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    localStorage.setItem('darkMode', (!darkMode).toString());
  };

  return (
    <Layout
      username={userData.username}
      name={userData.name}
      role={userData.role}
      darkMode={darkMode}
      onToggleDarkMode={toggleDarkMode}
      enableTransitions={enableTransitions}
    >
      <div className="container mx-auto px-4 py-8">
        <h1 className={`text-2xl font-bold mb-6 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
          Laporan Penerimaan Obat
        </h1>

        {notification.show && (
          <div className={`mb-4 p-3 rounded ${notification.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {notification.message}
          </div>
        )}

        {/* Form Filter */}
        <div className={`mb-6 p-4 rounded-lg shadow-md ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
          <h2 className={`text-lg font-semibold mb-3 ${darkMode ? 'text-white' : 'text-gray-800'}`}>Filter</h2>
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
                Total Penerimaan
              </h3>
              <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-green-600'}`}>
                {loading ? '...' : formatRupiah(totalPenerimaan)}
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
                  No. Penerimaan
                </th>
                <th className={`px-3 py-2 text-left text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider w-[15%]`}>
                  Tanggal
                </th>
                <th className={`px-3 py-2 text-left text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider w-[15%]`}>
                  No. Faktur
                </th>
                <th className={`px-3 py-2 text-left text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider w-[15%]`}>
                  Supplier
                </th>
                <th 
                  className={`px-3 py-2 text-left text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider cursor-pointer w-[15%]`}
                  onClick={() => handleSort('total')}
                >
                  Total {renderSortIndicator('total')}
                </th>
              </tr>
            </thead>
            <tbody className={`divide-y divide-gray-200 ${darkMode ? 'bg-gray-800 divide-gray-700' : 'bg-white'}`}>
              {loading ? (
                <tr>
                  <td colSpan={5} className={`px-3 py-3 text-center ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                    Memuat data...
                  </td>
                </tr>
              ) : sortedData.length === 0 ? (
                <tr>
                  <td colSpan={5} className={`px-3 py-3 text-center ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>
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
                      {item.no_penerimaan}
                    </td>
                    <td className={`px-3 py-2 whitespace-nowrap text-sm truncate ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                      {formatTanggal(item.tanggal_penerimaan)}
                    </td>
                    <td className={`px-3 py-2 whitespace-nowrap text-sm truncate ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                      {item.no_faktur}
                    </td>
                    <td className={`px-3 py-2 whitespace-nowrap text-sm truncate ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                      {item.nama_supplier}
                    </td>
                    <td className={`px-3 py-2 whitespace-nowrap text-sm truncate ${darkMode ? 'text-green-400' : 'text-green-600'} font-medium`}>
                      {formatRupiah(item.total)}
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

export default PenerimaanObat;