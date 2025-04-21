import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface NavbarProps {
  username?: string;
  name?: string;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  toggleSidebar: () => void;
  sidebarOpen: boolean;
  role?: string;
}

const Navbar: React.FC<NavbarProps> = ({ 
  username = 'User', 
  name = 'Pengguna',
  darkMode, 
  onToggleDarkMode, 
  toggleSidebar, 
  sidebarOpen,
  role = 'user'
}) => {
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    navigate('/login');
  };

  const toggleDropdown = () => {
    setDropdownOpen(!dropdownOpen);
  };

  return (
    <nav className={`${darkMode ? 'bg-gray-800' : 'bg-gray-900'} text-white shadow-md py-3 h-16 flex items-center fixed w-full z-10 transition-colors duration-500`}>
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <button 
              onClick={toggleSidebar}
              className="mr-2"
              title={sidebarOpen ? "Sembunyikan sidebar" : "Tampilkan sidebar"}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <img 
              src="/images/rs.png" 
              alt="Logo RSBW" 
              className="h-8 w-8 bg-white rounded-full p-1" 
            />
            <span className={`text-xl font-bold ${darkMode ? 'text-blue-400' : 'text-blue-400'}`}>SIAK-RSBW</span>
          </div>
          
          <div className="hidden md:flex items-center space-x-6">
            <span className="font-medium">Dashboard</span>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <button 
                onClick={onToggleDarkMode}
                className="relative inline-flex items-center justify-between h-6 rounded-full w-12 px-1 bg-gray-800 focus:outline-none"
                aria-pressed={darkMode}
              >
                <span className="sr-only">Toggle dark mode</span>
                <span className={`flex items-center justify-center rounded-full w-4 h-4 ${darkMode ? 'text-gray-800' : 'text-yellow-300'}`}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                  </svg>
                </span>
                <span className={`absolute left-0 top-0 bg-transparent border border-gray-600 w-6 h-6 rounded-full transform transition-transform duration-200 ${darkMode ? 'translate-x-6 border-gray-400' : 'translate-x-0 border-gray-600'}`}></span>
                <span className={`flex items-center justify-center rounded-full w-4 h-4 ${darkMode ? 'text-blue-300' : 'text-gray-600'}`}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                  </svg>
                </span>
              </button>
            </div>
            
            <div className="relative">
              <button 
                onClick={toggleDropdown}
                className={`flex items-center space-x-2 py-1 px-2 rounded ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-800'} transition-colors duration-200`}
              >
                <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
                  <span className="text-sm font-bold">{name.slice(0, 1).toUpperCase()}</span>
                </div>
                <span>Halo, {name}</span>
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 transition-transform duration-200 ${dropdownOpen ? 'transform rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
              
              {dropdownOpen && (
                <div className={`absolute right-0 mt-2 w-64 rounded-md shadow-lg ${darkMode ? 'bg-gray-800' : 'bg-gray-900'} border border-gray-700 z-50`}>
                  <div className="p-4">
                    <h3 className="text-lg font-medium text-blue-400 border-b border-gray-700 pb-2">Informasi Pengguna</h3>
                    
                    <table className="w-full mt-3 text-sm">
                      <tbody>
                        <tr>
                          <td className="py-2 text-gray-400">Nama</td>
                          <td className="py-2 text-white font-medium">{name}</td>
                        </tr>
                        <tr>
                          <td className="py-2 text-gray-400">Username</td>
                          <td className="py-2 text-white">{username}</td>
                        </tr>
                        <tr>
                          <td className="py-2 text-gray-400">Role</td>
                          <td className="py-2">
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              role === 'admin' ? 'bg-red-900 text-red-200' : 'bg-blue-900 text-blue-200'
                            }`}>
                              {role}
                            </span>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                    
                    <div className="mt-4 pt-2 border-t border-gray-700">
                      <button 
                        onClick={handleLogout}
                        className="w-full flex items-center justify-between p-2 mt-2 rounded hover:bg-gray-700 transition-colors text-red-400 hover:text-red-300"
                      >
                        <span className="font-medium">Logout</span>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 001 1h12a1 1 0 001-1V7.414l-5-5H3zm7 2a1 1 0 000 2h1a1 1 0 100-2h-1zm-2 5a1 1 0 100 2h5a1 1 0 100-2h-5zm0 4a1 1 0 100 2h1a1 1 0 100-2h-1z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;