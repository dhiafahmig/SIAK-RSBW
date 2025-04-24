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
    <nav className={`${darkMode ? 'bg-gray-800' : 'bg-white'} ${darkMode ? 'text-white' : 'text-gray-800'} shadow-md py-3 h-16 flex items-center fixed w-full z-10 transition-colors duration-500`}>
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <button 
              onClick={toggleSidebar}
              className={`mr-2 ${darkMode ? 'text-white' : 'text-gray-700'}`}
              title={sidebarOpen ? "Sembunyikan sidebar" : "Tampilkan sidebar"}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <img 
              src="/images/rs.png" 
              alt="Logo RSBW" 
              className="h-8 w-8 bg-white rounded-full p-1 shadow-sm" 
            />
            <span className={`text-xl font-bold ${darkMode ? 'text-black-400' : 'text-black-600'}`}>SIAK-RSBW</span>
          </div>
          
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <button 
                onClick={onToggleDarkMode}
                className={`relative inline-flex items-center p-1 justify-center w-14 h-7 rounded-full ${darkMode ? 'bg-gray-700' : 'bg-gray-300'} transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-50`}
                aria-pressed={darkMode}
              >
                <span className="sr-only">Toggle dark mode</span>
                <span 
                  className={`absolute left-1 flex items-center justify-center ${
                    darkMode ? 'translate-x-7 bg-gray-900' : 'translate-x-0 bg-white'
                  } w-5 h-5 rounded-full shadow-md transform transition-transform duration-300`}
                >
                  {darkMode ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-blue-300" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-yellow-500" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                    </svg>
                  )}
                </span>
              </button>
            </div>
            
            <div className="relative">
              <button 
                onClick={toggleDropdown}
                className={`flex items-center space-x-2 py-1.5 px-4 rounded-lg ${
                  darkMode 
                    ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                    : 'bg-white hover:bg-gray-100 text-gray-700 border border-gray-200'
                } transition-all duration-200 shadow-sm`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  darkMode 
                    ? 'bg-gray-900 text-gray-100' 
                    : 'bg-gray-200 text-gray-700'
                }`}>
                  <span className="text-sm font-bold">{name.slice(0, 1).toUpperCase()}</span>
                </div>
                <span className="font-medium">Halo, {name}</span>
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 transition-transform duration-200 ${dropdownOpen ? 'transform rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
              
              {/* Dropdown Menu dengan transisi */}
              {dropdownOpen && (
                <div 
                  className={`absolute right-0 mt-2 py-2 w-64 rounded-lg shadow-lg ${
                    darkMode 
                      ? 'bg-gray-800 border border-gray-700' 
                      : 'bg-white border border-gray-200'
                  } transform transition-all duration-300 origin-top-right z-10`}
                >
                  <div className={`px-4 py-3 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                    <p className={`text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                      Informasi Pengguna
                    </p>
                    <p className={`text-sm truncate ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      {username}
                    </p>
                    <div className="mt-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        role && role.toLowerCase() === 'admin' 
                          ? darkMode 
                            ? 'bg-red-800 text-red-200' 
                            : 'bg-red-100 text-red-800' 
                          : darkMode 
                            ? 'bg-green-800 text-green-200' 
                            : 'bg-green-100 text-green-800'
                      }`}>
                        {role}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => navigate('/profile/edit')}
                    className={`block w-full text-left px-4 py-2 text-sm ${
                      darkMode 
                        ? 'text-gray-300 hover:bg-gray-700' 
                        : 'text-gray-700 hover:bg-gray-100'
                    } transition-colors duration-150`}
                  >
                    Edit Profil
                  </button>
                  <button
                    onClick={handleLogout}
                    className={`block w-full text-left px-4 py-2 text-sm ${
                      darkMode 
                        ? 'text-red-400 hover:bg-gray-700' 
                        : 'text-red-600 hover:bg-gray-100'
                    } transition-colors duration-150`}
                  >
                    Logout
                  </button>
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