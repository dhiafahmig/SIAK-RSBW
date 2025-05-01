import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../../components/Layout';
import axios from 'axios';
import { getCurrentTheme } from '../../../utils/theme';

// API URL
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';

const PenjualanObat: React.FC = () => {
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
  const [sortBy, setSortBy] = useState<string | null>('tanggal_penjualan');
  const [totalPenjualan, setTotalPenjualan] = useState(0);
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
          } else if (sortBy === 'tanggal_penjualan') {
            valA = new Date(a.tanggal_penjualan).getTime();
            valB = new Date(b.tanggal_penjualan).getTime();
          } else if (sortBy === 'no_penjualan') {
            valA = a.no_penjualan;
            valB = b.no_penjualan;
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
      const response = await axios.get(`${API_URL}/api/laporan/penjualan-obat`, {
        params: {
          tanggal_awal: tanggalAwal,
          tanggal_akhir: tanggalAkhir,
        },
      });

      if (response.data.status === 'success') {
        setData(response.data.data || []);
        setTotalPenjualan(response.data.total_penjualan || 0);
        
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
      
      const response = await axios.get(`${API_URL}/api/laporan/penjualan-obat`, {
        params: {
          tanggal_awal: filter.tanggal_awal,
          tanggal_akhir: filter.tanggal_akhir,
        },
      });

      if (response.data.status === 'success') {
        setData(response.data.data || []);
        setTotalPenjualan(response.data.total_penjualan || 0);
        
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
          Laporan Penjualan Obat
        </h1>

        {notification.show && (
          <div className={`mb-4 p-3 rounded ${notification.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {notification.message}
          </div>
        )}

        {/* Form Filter */}
        <div className={`mb-6 p-4 rounded-lg shadow-md ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
          <h2 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
            Filter Data
          </h2>
          
          <form onSubmit={handleFilterSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className={`block mb-2 text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Tanggal Awal
              </label>
              <input
                type="date"
                name="tanggal_awal"
                value={filter.tanggal_awal}
                onChange={handleFilterChange}
                className={`w-full p-2 border rounded ${darkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-white text-gray-900 border-gray-300'}`}
              />
            </div>
            
            <div>
              <label className={`block mb-2 text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Tanggal Akhir
              </label>
              <input
                type="date"
                name="tanggal_akhir"
                value={filter.tanggal_akhir}
                onChange={handleFilterChange}
                className={`w-full p-2 border rounded ${darkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-white text-gray-900 border-gray-300'}`}
              />
            </div>
            
            <div className="flex items-end">
              <button
                type="submit"
                className={`px-4 py-2 rounded font-medium ${darkMode 
                  ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                  : 'bg-blue-500 hover:bg-blue-600 text-white'}`}
              >
                Filter
              </button>
            </div>
          </form>
        </div>

        {/* Total Pendapatan */}
        <div className={`mb-6 p-4 rounded-lg shadow-md ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
          <div className="flex justify-between items-center">
            <h2 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
              Total Penjualan
            </h2>
            <span className={`text-xl font-bold ${darkMode ? 'text-green-400' : 'text-green-600'}`}>
              {formatRupiah(totalPenjualan)}
            </span>
          </div>
        </div>

        {/* Tabel Data */}
        <div className={`rounded-lg shadow-md overflow-hidden ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className={darkMode ? 'bg-gray-700' : 'bg-gray-50'}>
                <tr>
                  <th 
                    className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer ${
                      darkMode ? 'text-gray-300' : 'text-gray-500'
                    }`}
                    onClick={() => handleSort('tanggal_penjualan')}
                  >
                    Tanggal {renderSortIndicator('tanggal_penjualan')}
                  </th>
                  <th 
                    className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer ${
                      darkMode ? 'text-gray-300' : 'text-gray-500'
                    }`}
                    onClick={() => handleSort('no_penjualan')}
                  >
                    No. Penjualan {renderSortIndicator('no_penjualan')}
                  </th>
                  <th 
                    className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer ${
                      darkMode ? 'text-gray-300' : 'text-gray-500'
                    }`}
                    onClick={() => handleSort('total')}
                  >
                    Total {renderSortIndicator('total')}
                  </th>
                </tr>
              </thead>
              <tbody className={`divide-y ${darkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
                {loading ? (
                  <tr>
                    <td 
                      colSpan={3} 
                      className={`px-6 py-4 text-center ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}
                    >
                      Memuat data...
                    </td>
                  </tr>
                ) : sortedData.length === 0 ? (
                  <tr>
                    <td 
                      colSpan={3} 
                      className={`px-6 py-4 text-center ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}
                    >
                      Tidak ada data
                    </td>
                  </tr>
                ) : (
                  sortedData.map((item, index) => (
                    <tr 
                      key={index} 
                      className={darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}
                    >
                      <td 
                        className={`px-6 py-4 whitespace-nowrap text-sm ${
                          darkMode ? 'text-gray-300' : 'text-gray-500'
                        }`}
                      >
                        {formatTanggal(item.tanggal_penjualan)}
                      </td>
                      <td 
                        className={`px-6 py-4 whitespace-nowrap text-sm ${
                          darkMode ? 'text-gray-300' : 'text-gray-500'
                        }`}
                      >
                        {item.no_penjualan}
                      </td>
                      <td 
                        className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                          darkMode ? 'text-green-400' : 'text-green-600'
                        }`}
                      >
                        {formatRupiah(item.total)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Info Data */}
        <div className={`mt-4 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          Menampilkan {sortedData.length} dari {data.length} data
        </div>
      </div>
    </Layout>
  );
};

export default PenjualanObat; 