import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    // Cek preferensi sistem atau pengaturan sebelumnya dari localStorage
    const savedMode = localStorage.getItem('darkMode');
    return savedMode ? JSON.parse(savedMode) : window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // Tambahkan useEffect untuk mengatur transisi pada body/html
  useEffect(() => {
    // Tambahkan class transition ke html element
    document.documentElement.classList.add('transition-colors', 'duration-500');
    document.documentElement.classList.toggle('dark', darkMode);
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
    
    return () => {
      // Optional: bersihkan class transisi saat komponen unmount
      document.documentElement.classList.remove('transition-colors', 'duration-500');
    };
  }, [darkMode]);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  // Cek jika user sudah login, redirect ke dashboard
  useEffect(() => {
    const user = localStorage.getItem('user');
    if (user) {
      navigate('/');
    }
  }, [navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      // Validasi sederhana
      if (!formData.username || !formData.password) {
        throw new Error('Username dan password harus diisi');
      }
      
      // Panggil API login
      const response = await fetch('http://localhost:8080/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: formData.username,
          password: formData.password,
        }),
      });
      
      // Jika response bukan 2xx, tangkap error
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Username atau password salah');
      }
      
      // Parse response JSON
      const data = await response.json();
      
      // Simpan token dan data user ke localStorage
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      // Redirect ke dashboard
      navigate('/');
    } catch (err: any) {
      setError(err.message);
      setShowNotification(true);
      setTimeout(() => {
        setShowNotification(false);
      }, 2000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center relative overflow-hidden`}>

      
      {/* Overlay gradient untuk meningkatkan kontras */}
      <div 
        className={`absolute inset-0 z-0 w-full h-full ${
          darkMode 
            ? 'bg-gradient-to-b from-gray-900 to-gray-800 opacity-80' 
            : 'bg-gradient-to-b from-blue-100 to-white opacity-60'
        }`}
      ></div>

      {/* Toggle Dark Mode dengan transisi */}
      <button 
        onClick={toggleDarkMode}
        className={`absolute top-4 right-4 p-2 rounded-full transition-all duration-500 ${
          darkMode 
            ? 'bg-gray-800 text-yellow-300 hover:bg-gray-700' 
            : 'bg-white text-gray-700 hover:bg-gray-100'
        } shadow-md z-10`}
        aria-label={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      >
        {darkMode ? (
          <svg className="w-6 h-6 transition-transform duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        ) : (
          <svg className="w-6 h-6 transition-transform duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
          </svg>
        )}
      </button>

      {/* Notifikasi dengan transisi */}
      {showNotification && (
        <div 
          className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-50 ${darkMode ? 'bg-red-900 border-red-700 text-red-200' : 'bg-red-100 border-red-500 text-red-700'} border-l-4 p-4 rounded shadow-md`}
          style={{
            animation: 'fadeIn 0.3s ease-in-out, fadeOut 0.3s ease-in-out 1.7s'
          }}
        >
          <div className="flex items-center">
            <svg className={`h-5 w-5 ${darkMode ? 'text-red-300' : 'text-red-500'} mr-2`} fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <p>{error}</p>
          </div>
        </div>
      )}
      
      <div className="w-full max-w-md z-10 px-4">
        {/* Logo dan Judul dengan transisi */}
        <div className="text-center mb-8">
          <div className="flex justify-center items-center space-x-4 mb-4">
            <div className="bg-white p-2 rounded-full shadow-lg">
              <img 
                src="/images/rs.png" 
                alt="Logo RSBW"
                className="w-16 h-16"
              />
            </div>
          </div>
          <h2 className={`text-3xl font-extrabold transition-colors duration-500 ${darkMode ? 'text-white' : 'text-gray-800'} mb-2 text-shadow`}>SIAK-RSBW</h2>
        </div>
        
        {/* Form Login dengan transisi dan efek glass */}
        <div className={`backdrop-filter backdrop-blur-md transition-all duration-500 ${
          darkMode 
            ? 'bg-gray-800 bg-opacity-75 text-white' 
            : 'bg-white bg-opacity-85 text-gray-800'
        } py-8 px-10 shadow-2xl rounded-xl border ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <h3 className={`text-xl font-semibold mb-6 text-center`}>
            Sistem Informasi Akuntansi <br/> Rumah Sakit Bumi Waras
          </h3>
          
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="username" className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Username
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className={`h-5 w-5 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                </div>
                <input
                  id="username"
                  name="username"
                  type="text"
                  autoComplete="username"
                  required
                  className={`pl-10 block w-full px-3 py-3 border transition-colors duration-500 ${darkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'} rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary`}
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="Masukkan username"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Password
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className={`h-5 w-5 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  className={`pl-10 block w-full px-3 py-3 border transition-colors duration-500 ${darkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'} rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary`}
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Masukkan password"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                />
                <label htmlFor="remember-me" className={`ml-2 block text-sm`}>
                  Ingat saya
                </label>
              </div>

              <div className="text-sm">
                <a href="#" className="font-medium text-primary hover:text-blue-400 transition-colors duration-300">
                  Lupa password?
                </a>
              </div>
            </div>

            <div>
              <button
                type="submit"
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition duration-300 ease-in-out"
                disabled={loading}
              >
                {loading ? (
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : null}
                {loading ? 'Memproses...' : 'Login'}
              </button>
            </div>
          </form>
        </div>
        
        {/* Footer dengan transisi */}
        <div className={`mt-6 text-center text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'} text-shadow-sm`}>
          <p>© {new Date().getFullYear()} SIAK-RSBW. Semua hak dilindungi.</p>
        </div>
      </div>
    </div>
  );
};

export default Login;