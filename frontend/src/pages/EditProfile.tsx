import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import axios from 'axios';
import { getCurrentTheme } from '../utils/theme';

// API URL
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';

const EditProfile: React.FC = () => {
  const navigate = useNavigate();
  const [userData, setUserData] = useState({
    id: 0,
    username: '',
    name: '',
    role: '',
  });
  
  // Set nilai awal darkMode dari utilitas
  const [darkMode, setDarkMode] = useState(getCurrentTheme);
  
  const [formData, setFormData] = useState({
    name: '',
    password: '',
    confirmPassword: '',
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [notificationType, setNotificationType] = useState<'success' | 'error'>('success');
  const [enableTransitions, setEnableTransitions] = useState(false);

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
        username: user.username || '',
        name: user.name || '',
        role: user.role || '',
      });

      // Set nilai awal form
      setFormData(prevFormData => ({
        ...prevFormData,
        name: user.name || '',
      }));

      // Aktifkan transisi setelah 300ms
      setTimeout(() => {
        setEnableTransitions(true);
      }, 300);
    } catch (error) {
      console.error('Error parsing user data:', error);
      navigate('/login');
    }
  }, [navigate]);

  // Fungsi untuk menampilkan notifikasi dengan timeout
  const showNotificationWithTimeout = (message: string, type: 'success' | 'error') => {
    setNotificationMessage(message);
    setNotificationType(type);
    setShowNotification(true);
    setTimeout(() => {
      setShowNotification(false);
    }, 3000);
  };

  // Handle input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Validasi password jika diisi
    if (formData.password && formData.password !== formData.confirmPassword) {
      setError('Password dan konfirmasi password tidak cocok');
      showNotificationWithTimeout('Password dan konfirmasi password tidak cocok', 'error');
      return;
    }
    
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      // Persiapkan data untuk update
      const updateData: any = {};
      if (formData.name && formData.name !== userData.name) {
        updateData.name = formData.name;
      }
      if (formData.password) {
        updateData.password = formData.password;
      }

      // Jika tidak ada perubahan, berikan feedback
      if (Object.keys(updateData).length === 0) {
        showNotificationWithTimeout('Tidak ada perubahan yang dilakukan', 'error');
        setLoading(false);
        return;
      }

      // Kirim permintaan ke server untuk update profil
      const response = await axios.put(`${API_URL}/api/users/${userData.id}`, updateData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      // Update data local storage
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        user.name = response.data.name;
        localStorage.setItem('user', JSON.stringify(user));
      }

      // Tampilkan notifikasi berhasil
      showNotificationWithTimeout('Profil berhasil diperbarui', 'success');
      
      // Reset password fields
      setFormData({
        ...formData,
        password: '',
        confirmPassword: '',
      });
    } catch (error: any) {
      console.error('Error updating profile:', error);
      const errorMessage = error.response?.data || 'Gagal memperbarui profil';
      setError(errorMessage);
      showNotificationWithTimeout(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  const toggleTheme = () => {
    setDarkMode((prev: boolean) => !prev);
  };

  return (
    <Layout 
      username={userData.username}
      name={userData.name} 
      darkMode={darkMode} 
      onToggleDarkMode={toggleTheme}
      enableTransitions={enableTransitions}
    >
      {/* Notifikasi */}
      {showNotification && (
        <div 
          className={`fixed top-20 right-4 z-50 p-4 rounded shadow-lg ${
            notificationType === 'success' 
              ? (darkMode ? 'bg-green-800 text-green-200' : 'bg-green-100 text-green-800') 
              : (darkMode ? 'bg-red-800 text-red-200' : 'bg-red-100 text-red-800')
          } transition-all duration-500 transform animate-fadeIn`}
        >
          <div className="flex items-center">
            {notificationType === 'success' ? (
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            )}
            <span>{notificationMessage}</span>
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center mb-6">
          <button
            onClick={() => navigate('/')}
            className={`mr-4 p-2 rounded-lg ${
              darkMode 
                ? 'bg-gray-700 hover:bg-gray-600' 
                : 'bg-gray-200 hover:bg-gray-300'
            } transition-colors duration-200`}
            title="Kembali ke dashboard"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
            Edit Profil
          </h2>
        </div>
        
        <div className={`max-w-2xl mx-auto rounded-lg shadow-md overflow-hidden ${
          darkMode ? 'bg-gray-800' : 'bg-white'
        }`}>
          <div className={`p-6 ${darkMode ? 'border-b border-gray-700' : 'border-b'}`}>
            <form onSubmit={handleSubmit}>
              <div className="space-y-6">
                {/* Username (tidak dapat diubah) */}
                <div>
                  <label htmlFor="username" className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                    Username
                  </label>
                  <input
                    type="text"
                    id="username"
                    value={userData.username}
                    className={`w-full px-3 py-2 border rounded-md ${
                      darkMode 
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                    } focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-not-allowed opacity-75`}
                    disabled
                  />
                  <p className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    Username tidak dapat diubah
                  </p>
                </div>
                
                {/* Nama */}
                <div>
                  <label htmlFor="name" className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                    Nama Lengkap
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    placeholder="Masukkan nama lengkap"
                    value={formData.name}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 border rounded-md ${
                      darkMode 
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                    } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  />
                </div>
                
                {/* Password Baru */}
                <div>
                  <label htmlFor="password" className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                    Password Baru
                  </label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    placeholder="Kosongkan jika tidak ingin mengubah password"
                    value={formData.password}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 border rounded-md ${
                      darkMode 
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                    } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  />
                </div>
                
                {/* Konfirmasi Password Baru */}
                <div>
                  <label htmlFor="confirmPassword" className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                    Konfirmasi Password Baru
                  </label>
                  <input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    placeholder="Konfirmasi password baru"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 border rounded-md ${
                      darkMode 
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                    } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  />
                </div>
                
                {/* Submit Button */}
                <div className="pt-4 flex justify-end">
                  <button
                    type="submit"
                    disabled={loading}
                    className={`px-4 py-2 rounded-lg ${
                      darkMode 
                        ? 'bg-blue-600 hover:bg-blue-700' 
                        : 'bg-blue-600 hover:bg-blue-700'
                    } text-white font-medium transition-colors duration-200 flex items-center justify-center ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                  >
                    {loading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Menyimpan...
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Simpan Perubahan
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default EditProfile; 