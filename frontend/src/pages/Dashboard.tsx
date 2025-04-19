import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [userData, setUserData] = useState({
    username: 'admin',
    role: '',
  });
  const [darkMode, setDarkMode] = useState(false);

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
        username: user.username || 'admin',
        role: user.role || '',
      });
    } catch (error) {
      console.error('Error parsing user data:', error);
      navigate('/login');
    }

    // Cek preferensi tema
    const savedDarkMode = localStorage.getItem('darkMode');
    if (savedDarkMode) {
      setDarkMode(JSON.parse(savedDarkMode));
    }
  }, [navigate]);

  // Simpan preferensi tema
  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
  }, [darkMode]);

  const toggleDarkMode = () => {
    setDarkMode(prev => !prev);
  };

  return (
    <Layout 
      username={userData.username} 
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