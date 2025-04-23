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
            <span className={`text-xl font-bold ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>SIAK-RSBW</span>
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
                className={`flex items-center space-x-2 py-1 px-3 rounded-full ${darkMode ? 'hover:bg-gray-700 bg-gray-700' : 'bg-gray-200 hover:bg-gray-300'} transition-all duration-200 shadow-sm ${darkMode ? 'text-white' : 'text-gray-700'}`}
              >
                <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center">
                  <span className="text-sm font-bold text-gray-700">{name.slice(0, 1).toUpperCase()}</span>
                </div>
                <span>Halo, {name}</span>
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 transition-transform duration-200 ${dropdownOpen ? 'transform rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
              
              {/* Dropdown Menu dengan transisi */}
              <div 
                className={`absolute right-0 mt-2 w-64 rounded-md shadow-lg ${darkMode ? 'bg-gray-800' : 'bg-white'} ${darkMode ? 'border border-gray-700' : 'border border-gray-200'} z-50 transform transition-all duration-300 origin-top-right ${dropdownOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0 pointer-events-none'}`}
              >
                <div className="p-4">
                  <h3 className={`text-lg font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} ${darkMode ? 'border-b border-gray-700' : 'border-b border-gray-200'} pb-2`}>Informasi Pengguna</h3>
                  
                  <table className="w-full mt-3 text-sm">
                    <tbody>
                      <tr>
                        <td className={`py-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Nama</td>
                        <td className={`py-2 ${darkMode ? 'text-white' : 'text-gray-800'} font-medium`}>{name}</td>
                      </tr>
                      <tr>
                        <td className={`py-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Username</td>
                        <td className={`py-2 ${darkMode ? 'text-white' : 'text-gray-800'}`}>{username}</td>
                      </tr>
                      <tr>
                        <td className={`py-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Role</td>
                        <td className="py-2">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            role === 'admin' 
                              ? (darkMode ? 'bg-red-900 text-red-200' : 'bg-red-100 text-red-800') 
                              : (darkMode ? 'bg-green-900 text-green-200' : 'bg-green-100 text-green-800')
                          } shadow-sm`}>
                            {role}
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                  
                  <div className={`mt-4 pt-2 ${darkMode ? 'border-t border-gray-700' : 'border-t border-gray-200'}`}>
                    <button 
                      onClick={() => navigate('/profile/edit')}
                      className={`w-full flex items-center justify-between p-2 rounded ${darkMode ? 'hover:bg-gray-700 text-gray-300 hover:text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'} transition-colors`}
                    >
                      <span className="font-medium">Edit Profil</span>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    
                    <button 
                      onClick={handleLogout}
                      className={`w-full flex items-center justify-between p-2 mt-2 rounded ${darkMode ? 'hover:bg-gray-700 text-gray-300 hover:text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'} transition-colors`}
                    >
                      <span className="font-medium">Logout</span>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;