import React from 'react';
import Navbar from './Navbar';
import Footer from './Footer';

interface LayoutProps {
  children: React.ReactNode;
  username?: string;
  darkMode?: boolean;
}

const Layout: React.FC<LayoutProps> = ({ children, username = 'User', darkMode = false }) => {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar username={username} />
      <main className={`flex-grow ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-800'}`}>
        {children}
      </main>
      <Footer darkMode={darkMode} />
    </div>
  );
};

export default Layout; 