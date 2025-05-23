import React from 'react';

interface FooterProps {
  darkMode?: boolean;
}

const Footer: React.FC<FooterProps> = ({ darkMode = false }) => {
  return (
    <footer className={`py-6 border-t transition-all duration-500 ease-in-out w-full ${
      darkMode 
        ? 'bg-gray-800 text-gray-300 border-gray-700' 
        : 'bg-gray-900 text-gray-300 border-gray-700'
    }`}>
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <p className="text-sm transition-colors duration-500 ease-in-out text-center md:text-left">
              &copy; {new Date().getFullYear()} Dhia Fahmi G. - SIAK-RSBW. Sistem Informasi Akuntansi Rumah Sakit Bumi Waras.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 