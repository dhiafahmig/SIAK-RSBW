import React from 'react';
import { useNavigate } from 'react-router-dom';

interface NavbarProps {
  username?: string;
}

const Navbar: React.FC<NavbarProps> = ({ username }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <nav className="bg-blue-500 text-white shadow-md py-3 h-16 flex items-center">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <img 
              src="/images/rs.png" 
              alt="Logo RSBW" 
              className="h-8 w-8 bg-white rounded-full p-1" 
            />
            <span className="text-xl font-bold">SIAK-RSBW</span>
          </div>
          
          <div className="hidden md:flex items-center space-x-6">
            <span className="font-medium">Dashboard</span>
          </div>
          
          <div className="flex items-center space-x-4">
            <span>Halo, {username}</span>
            <button 
              onClick={handleLogout}
              className="bg-white text-blue-500 px-3 py-1 rounded hover:bg-blue-100 transition-colors duration-200"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;