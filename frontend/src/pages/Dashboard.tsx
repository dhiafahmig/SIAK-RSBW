import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import axios from 'axios';
import { toggleDarkMode, getCurrentTheme } from '../utils/theme';

// API URL
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';

const Dashboard: React.FC = () => {
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
  const [enableTransitions, setEnableTransitions] = useState(false);
  const initialMountCompleted = useRef(false);

  // Cek jika user belum login, redirect ke halaman login
  useEffect(() => {
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

      // Ambil preferensi tema dari database
      fetchDarkModePreference(user.id);
    } catch (error) {
      console.error('Error parsing user data:', error);
      navigate('/login');
    }
  }, [navigate]);

  // Fungsi untuk mengambil preferensi dark mode dari server
  const fetchDarkModePreference = async (userId: number) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await axios.get(`${API_URL}/api/user/settings?id=${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      // Set dark mode dari hasil response
      const serverDarkMode = response.data.dark_mode;
      
      // Hanya update jika berbeda dengan nilai saat ini untuk menghindari re-render yang tidak perlu
      if (serverDarkMode !== darkMode) {
        setDarkMode(serverDarkMode);
      }
      
      // Simpan juga di localStorage dan update DOM
      toggleDarkMode(serverDarkMode);
    } catch (error) {
      console.error('Error fetching dark mode preference:', error);
      // Tidak perlu fallback ke localStorage karena sudah diatur di useState initializer
    } finally {
      setLoading(false);
    }
  };

  // Menangani perubahan tema dan transisi
  useEffect(() => {
    if (loading) return; // Tidak update selama loading
    
    if (!initialMountCompleted.current) {
      // Saat initial mount, atur tema tanpa transisi
      document.documentElement.classList.remove('transition-colors', 'duration-500');
      
      // Tandai initial mount sebagai selesai
      initialMountCompleted.current = true;
      
      // Aktifkan transisi untuk perubahan selanjutnya (setelah delay)
      const timer = setTimeout(() => {
        setEnableTransitions(true);
      }, 300);
      
      return () => clearTimeout(timer);
    } else {
      // Untuk perubahan selanjutnya, tangani transisi
      if (enableTransitions) {
        // Tambahkan kelas transisi
        document.documentElement.classList.add('transition-colors', 'duration-500');
      }
      
      // Update tema menggunakan utilitas
      toggleDarkMode(darkMode);
      
      // Update preferensi di database
      updateDarkModePreference();
      
      // Hapus kelas transisi setelah transisi selesai
      if (enableTransitions) {
        const transitionTimeout = setTimeout(() => {
          document.documentElement.classList.remove('transition-colors', 'duration-500');
        }, 600);
        
        return () => clearTimeout(transitionTimeout);
      }
    }
  }, [darkMode, loading, enableTransitions]);

  // Fungsi untuk mengupdate preferensi dark mode ke server
  const updateDarkModePreference = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token || userData.id === 0) return;

      await axios.post(`${API_URL}/api/user/settings/dark-mode?id=${userData.id}`, 
        { dark_mode: darkMode },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
    } catch (error) {
      console.error('Error updating dark mode preference:', error);
    }
  };

  const toggleTheme = () => {
    setDarkMode((prev: boolean) => !prev);
  };

  return (
    <Layout 
      username={userData.username}
      name={userData.name} 
      role={userData.role}
      darkMode={darkMode} 
      onToggleDarkMode={toggleTheme}
      enableTransitions={enableTransitions}
    >
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4 transform">
        <h2 className={`text-3xl font-bold mb-3 ${enableTransitions ? "transition-colors duration-500 ease-in-out transform" : ""} ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
          Selamat Datang di Dashboard
        </h2>
        <p className={`${enableTransitions ? "transition-colors duration-500 ease-in-out" : ""} max-w-md mx-auto ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          Konten dashboard akan segera hadir
        </p>
        
        {/* Kartu Animasi */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-5xl">
          {[1, 2, 3].map((item) => (
            <div 
              key={item} 
              className={`p-6 rounded-lg shadow-md ${enableTransitions ? "transition-all duration-500" : ""} transform hover:scale-105 ease-in-out
                ${darkMode 
                  ? 'bg-gray-800 text-gray-200 hover:bg-gray-700' 
                  : 'bg-white text-gray-800 hover:bg-gray-50'
                }`}
            >
              <div className={`w-12 h-12 rounded-full mb-4 flex items-center justify-center ${enableTransitions ? "transition-colors duration-500" : ""}
                ${darkMode ? 'bg-blue-500' : 'bg-blue-600'}`}
              >
                <span className="text-white text-xl">{item}</span>
              </div>
              <h3 className={`text-xl font-semibold mb-2 ${enableTransitions ? "transition-colors duration-500" : ""}
                ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}
              >
                Fitur {item}
              </h3>
              <p className={`${enableTransitions ? "transition-colors duration-500" : ""}
                ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}
              >
                Deskripsi fitur {item} akan tersedia segera. Tunggu pengembangan selanjutnya.
              </p>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard; 