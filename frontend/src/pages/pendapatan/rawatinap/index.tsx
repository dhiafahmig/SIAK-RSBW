import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../../components/Layout';
import axios from 'axios';
import { getCurrentTheme } from '../../../utils/theme';
import API_CONFIG from '../../../config/api';

const LaporanRawatInap: React.FC = () => {
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
  const [totalBayarRawatInap, setTotalBayarRawatInap] = useState(0);
  const [totalPiutang, setTotalPiutang] = useState(0);
  const [totalPendapatan, setTotalPendapatan] = useState(0);
  const [filter, setFilter] = useState({
    tanggal_awal: '',
    tanggal_akhir: '',
    filter_by: 'tgl_keluar', // Default filter berdasarkan tanggal keluar
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
        filter_by: 'tgl_keluar',
        include_piutang: 'true',
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
  }, [navigate]); // Hanya bergantung pada navigate

  // Effect untuk sorting data
  useEffect(() => {
    if (data.length > 0) {
      // Buat array gabungan data rawat inap dengan piutang
      const combinedData = data.map(item => {
        // Cari data piutang yang sesuai dengan no_rawat
        const matchingPiutang = piutangData.filter(p => p.no_rawat === item.no_rawat);
        
        // Hitung total piutang untuk pasien ini
        const totalPiutangPasien = matchingPiutang.reduce((total, p) => total + p.totalpiutang, 0);
        
        // Gunakan png_jawab dari data rawat inap jika tersedia, jika tidak gunakan dari piutang
        // Item.png_jawab sudah tersedia dari backend berdasarkan perubahan yang telah dilakukan
        const pngJawab = item.png_jawab || (matchingPiutang.length > 0 ? matchingPiutang[0].png_jawab : '-');
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
      
      const response = await axios.get(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.LAPORAN.RAWAT_INAP}`, {
        params: {
          tanggal_awal: tanggalAwal,
          tanggal_akhir: tanggalAkhir,
          filter_by: filter.filter_by,
          include_piutang: filter.include_piutang
        },
      });

      if (response.data.status === 'success') {
        setData(response.data.data_rawat_inap || []);
        setPiutangData(response.data.data_piutang || []);
        setTotalBayarRawatInap(response.data.total_bayar_rawat_inap || 0);
        setTotalPiutang(response.data.total_piutang || 0);
        setTotalPendapatan(response.data.total_pendapatan || 0);
        
        // Log response untuk debugging
        console.log("Response data:", response.data);
        console.log("Data rawat inap diterima:", response.data.data_rawat_inap?.length || 0, "records");
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
      
      const response = await axios.get(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.LAPORAN.RAWAT_INAP}`, {
        params: {
          tanggal_awal: filter.tanggal_awal,
          tanggal_akhir: filter.tanggal_akhir,
          filter_by: filter.filter_by,
          include_piutang: filter.include_piutang
        },
      });

      if (response.data.status === 'success') {
        setData(response.data.data_rawat_inap || []);
        setPiutangData(response.data.data_piutang || []);
        setTotalBayarRawatInap(response.data.total_bayar_rawat_inap || 0);
        setTotalPiutang(response.data.total_piutang || 0);
        setTotalPendapatan(response.data.total_pendapatan || 0);
        
        // Log response untuk debugging
        console.log("Response data:", response.data);
        console.log("Data rawat inap diterima:", response.data.data_rawat_inap?.length || 0, "records");
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

  // Render indikator sorting
  const renderSortIndicator = (column: string) => {
    if (sortBy !== column) return null;
    
    return sortDir === 'asc' 
      ? <span className="ml-1">↑</span> 
      : <span className="ml-1">↓</span>;
  };

  return (
    <Layout
      username={userData.username}
      name={userData.name}
      role={userData.role}
      darkMode={darkMode}
      onToggleDarkMode={() => setDarkMode(prev => !prev)}
      enableTransitions={enableTransitions}
    >
      <div className="container mx-auto px-2 py-6 max-w-full transition-all duration-300 ease-in-out">
        {/* Judul dan informasi halaman */}
        <div className={`mb-6 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
          <h1 className="text-2xl font-bold mb-2">Laporan Pendapatan Rawat Inap</h1>
          <p className="text-sm">Menampilkan data laporan pendapatan dari rawat inap dan piutang pasien.</p>
        </div>

        {/* Notifikasi */}
        {notification.show && (
          <div className={`p-4 mb-6 rounded-lg ${notification.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {notification.message}
          </div>
        )}

        {/* Filter Panel */}
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
                  <option value="tgl_keluar">Tanggal Keluar</option>
                  <option value="tgl_masuk">Tanggal Masuk</option>
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
                Pendapatan Rawat Inap
              </h3>
              <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-blue-600'}`}>
                {loading ? '...' : formatRupiah(totalBayarRawatInap)}
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
                  Tgl Masuk
                </th>
                <th className={`px-2 py-2 text-left text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`} style={{ width: '8%' }}>
                  Tgl Keluar
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
                      {formatTanggal(item.tgl_masuk)}
                    </td>
                    <td className={`px-2 py-2 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                      {formatTanggal(item.tgl_keluar)}
                    </td>
                    <td className={`px-2 py-2 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                      {item.no_nota || '-'}
                    </td>
                    <td className={`px-2 py-2 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                      {formatTanggal(item.tanggal)}
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

export default LaporanRawatInap;