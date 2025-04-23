import React, { useEffect, useState } from 'react';
import Navbar from './Navbar';
import Footer from './Footer';
import Sidebar from './Sidebar';

interface LayoutProps {
  children: React.ReactNode;
  username?: string;
  name?: string;
  role?: string;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  enableTransitions?: boolean;
}

const Layout: React.FC<LayoutProps> = ({ 
  children, 
  username = 'User', 
  name = 'Pengguna',
  role = 'user',
  darkMode = false,
  onToggleDarkMode,
  enableTransitions = false
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  // Tutup sidebar otomatis pada layar kecil
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };

    // Panggil sekali saat mount
    handleResize();

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);
  
  // Kelas transisi kondisional berdasarkan enableTransitions
  const transitionClass = enableTransitions ? "transition-colors duration-500 ease-in-out" : "";
  
  return (
    <div className={`flex flex-col min-h-screen ${transitionClass} ${darkMode ? 'bg-gray-900' : 'bg-gray-100'}`}>
      <Navbar 
        username={username} 
        name={name}
        darkMode={darkMode} 
        onToggleDarkMode={onToggleDarkMode}
        toggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        sidebarOpen={sidebarOpen}
        role={role}
      />
      
      <div className="flex flex-grow pt-16">
        {/* Sidebar */}
        <Sidebar 
          darkMode={darkMode} 
          isOpen={sidebarOpen} 
        />
        
        {/* Main Content */}
        <main 
          className={`
            flex-grow ${enableTransitions ? "transition-all duration-500 ease-in-out" : ""} 
            ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-800'}
            ${sidebarOpen ? 'md:ml-64' : 'ml-0'}
            w-full
          `}
        >
          <div className={`container mx-auto px-4 py-8 ${enableTransitions ? "transition-all duration-500 ease-in-out" : ""}`}>
            {children}
          </div>
        </main>
      </div>
      
      <div className={`${sidebarOpen ? 'md:ml-64' : 'ml-0'} ${enableTransitions ? "transition-all duration-500" : ""}`}>
        <Footer darkMode={darkMode} />
      </div>
    </div>
  );
};

export default Layout; 