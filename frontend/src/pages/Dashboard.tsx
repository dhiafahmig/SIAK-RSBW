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
    <Layout username={userData.username} darkMode={darkMode}>
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4">
        <h2 className={`text-3xl font-bold mb-3 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
          Selamat Datang di Dashboard
        </h2>
        <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'} max-w-md mx-auto`}>
          Konten dashboard akan segera hadir
        </p>
        
        {/* Toggle Dark Mode Button */}
        <button 
          onClick={toggleDarkMode}
          className={`mt-8 p-3 rounded-full ${darkMode ? 'bg-gray-800 text-yellow-300' : 'bg-white text-gray-700'} shadow-md hover:shadow-lg transition-all duration-300`}
        >
          {darkMode ? (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          ) : (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          )}
        </button>
      </div>
    </Layout>
  );
};

export default Dashboard; 