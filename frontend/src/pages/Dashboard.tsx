import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import axios from 'axios';

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
  const [darkMode, setDarkMode] = useState(false);
  const [loading, setLoading] = useState(true);

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
      setDarkMode(response.data.dark_mode);
      
      // Simpan juga di localStorage sebagai fallback
      localStorage.setItem('darkMode', JSON.stringify(response.data.dark_mode));
    } catch (error) {
      console.error('Error fetching dark mode preference:', error);
      
      // Fallback ke localStorage jika API gagal
      const savedDarkMode = localStorage.getItem('darkMode');
      if (savedDarkMode) {
        setDarkMode(JSON.parse(savedDarkMode));
      }
    } finally {
      setLoading(false);
    }
  };

  // Simpan preferensi tema
  useEffect(() => {
    if (loading) return; // Jangan update saat masih loading

    document.documentElement.classList.toggle('dark', darkMode);
    localStorage.setItem('darkMode', JSON.stringify(darkMode));

    // Update preferensi di database jika user sudah login
    updateDarkModePreference();
  }, [darkMode]);

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

  const toggleDarkMode = () => {
    setDarkMode(prev => !prev);
  };

  return (
    <Layout 
      username={userData.username}
      name={userData.name} 
      darkMode={darkMode} 
      onToggleDarkMode={toggleDarkMode}
    >
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4 transform transition-all duration-700 ease-in-out">
        <h2 className={`text-3xl font-bold mb-3 transition-colors duration-500 ease-in-out transform ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
          Selamat Datang di Dashboard
        </h2>
        <p className={`transition-colors duration-500 ease-in-out max-w-md mx-auto ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          Konten dashboard akan segera hadir
        </p>
        
        {/* Kartu Animasi */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-5xl">
          {[1, 2, 3].map((item) => (
            <div 
              key={item} 
              className={`p-6 rounded-lg shadow-md transition-all duration-500 transform hover:scale-105 ease-in-out
                ${darkMode 
                  ? 'bg-gray-800 text-gray-200 hover:bg-gray-700' 
                  : 'bg-white text-gray-800 hover:bg-gray-50'
                }`}
            >
              <div className={`w-12 h-12 rounded-full mb-4 flex items-center justify-center transition-colors duration-500
                ${darkMode ? 'bg-blue-500' : 'bg-blue-600'}`}
              >
                <span className="text-white text-xl">{item}</span>
              </div>
              <h3 className={`text-xl font-semibold mb-2 transition-colors duration-500 
                ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}
              >
                Fitur {item}
              </h3>
              <p className={`transition-colors duration-500 
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